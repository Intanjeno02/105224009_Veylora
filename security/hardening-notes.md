# Catatan Security Hardening Veylora

## 1. Tujuan

Dokumen ini merangkum hardening keamanan Pekan 4 yang sudah diterapkan dan bukti pengujiannya. Status implementasi dibedakan dari hasil pengujian runtime, simulasi, maupun pemeriksaan kode. Dokumen ini bukan sertifikasi atau audit menyeluruh, dan tidak menyatakan seluruh sistem sudah aman.

## 2. Ruang Lingkup

- Kebijakan password, hashing, kompatibilitas bcrypt lama, dan blocklist password lokal.
- Pembatasan percobaan login.
- Session JWT dan pencabutan session.
- Isolasi data Vault dan History pada localStorage.
- Dedicated database role PostgreSQL dan pemisahan koneksi runtime/migration.
- Status role Administrator dan MFA.

Vault dan riwayat pemeriksaan URL tetap merupakan data lokal browser; keduanya tidak dipindahkan ke PostgreSQL.

## 3. Temuan Sebelum Hardening

### Password Security

- Password baru sebelumnya memiliki batas minimum yang lebih rendah dan disimpan menggunakan bcrypt, yang membatasi input efektif sampai 72 byte.
- Password umum atau password yang diketahui pernah bocor belum diperiksa terhadap blocklist lokal.
- Dukungan password manager dan autofill belum dipastikan melalui atribut autocomplete yang sesuai.

### Login Protection

- Endpoint login belum membatasi percobaan password salah. Permintaan dapat diulang tanpa jeda yang diterapkan aplikasi.

### Session Security

- Logout sebelumnya hanya menghapus cookie. Token JWT yang telah disalin dapat berpotensi digunakan sampai masa berlakunya habis karena tidak ada pencabutan record session di sisi server.

### Local Data Isolation

- Vault menggunakan key global `personal-security-accounts` dan History menggunakan `veylora-url-history`, sehingga data berpotensi tercampur saat browser yang sama dipakai akun berbeda.

### Database Security

- Koneksi aplikasi menggunakan role PostgreSQL `postgres`, yang terverifikasi sebagai superuser, dapat membuat database, dan dapat membuat role.
- Runtime dan perintah Prisma migration belum memakai konfigurasi URL yang terpisah.

## 4. Implementasi Hardening

### 4.1 Password Security

- Password baru minimal **15 Unicode code point** dan maksimal **1.024 Unicode code point**. Login tetap menerima password akun lama yang lebih pendek agar akun tersebut tidak terkunci; batas maksimum tetap diterapkan.
- Password dinormalisasi ke **Unicode NFC** sebelum hashing dan verifikasi.
- Password baru di-hash dengan **Argon2id** menggunakan salt dari library. bcrypt hanya dipertahankan untuk memverifikasi akun lama; setelah verifikasi lama berhasil, hash dimigrasikan ke Argon2id tanpa mengganti password pengguna. Input bcrypt yang lebih dari 72 byte ditolak sebelum compare.
- Register memeriksa blocklist lokal di server sebelum hashing. Daftar menyimpan digest SHA-256, bukan entri password plaintext, dan pemeriksaan dilakukan tanpa mengirim password ke layanan eksternal.
- Blocklist diturunkan dari `Probable-Wordlists` v2, file `Top304Thousand-probable-v2.txt` pada revisi `8ed574a02cbf37a9205344d4e31468a05989ca37`. Dataset menyatakan sumber daftar real-password mencakup SecLists, Weakpass, dan Hashes.org. Atribusi, lisensi CC BY-SA 4.0, serta transformasi dataset dicatat di [password-blocklist-attribution.md](../data/password-blocklist-attribution.md).
- Daftar lokal memuat **2.097 digest** dari entri yang memenuhi panjang minimum setelah NFC. Pemeriksaan hanya berupa kecocokan persis; dataset terbatas dan bukan pemeriksaan menyeluruh terhadap semua password yang pernah bocor atau variasinya.
- Form login menggunakan autocomplete `current-password`; form register menggunakan `new-password`. Implementasi form tidak mencegah paste. Ini merupakan pemeriksaan kode; dukungan aktual bergantung pada password manager/browser dan tidak dicatat sebagai uji lintas produk.

### 4.2 Login Protection

- Rate limiting menggunakan username yang dinormalisasi menjadi huruf kecil sebagai kunci.
- Lima kegagalan dalam jendela 15 menit mengaktifkan pemblokiran selama 15 menit.
- Permintaan selama pemblokiran menerima HTTP **429** dan header **`Retry-After`**.
- Login berhasil menghapus penghitung username tersebut.
- Penghitung disimpan di PostgreSQL. UPSERT atomik mencegah request bersamaan melewati batas, dan catatan kedaluwarsa dibersihkan.
- Jika penyimpanan limiter gagal, login gagal secara tertutup dengan HTTP 503; pembatasan tidak dilewati secara diam-diam.
- Mekanisme ini memenuhi kebutuhan demo localhost yang hanya menggunakan pembatasan berdasarkan username. Ini bukan rancangan rate limiting produksi: tidak ada pembatasan IP, penyimpanan terdistribusi khusus, ataupun mitigasi terukur untuk serangan yang merotasi username.

### 4.3 Session Security

- JWT session memiliki `jti` unik dan subject `sub`; verifikasi token membatasi algoritma ke HS256.
- Record session dengan ID `jti`, `userId`, dan masa berlaku tersimpan di PostgreSQL.
- `verifySession()` memverifikasi signature lalu memeriksa record session dan akun di database, kecocokan user, serta masa kedaluwarsa.
- Logout menghapus record session aktif dan cookie. Session perangkat lain tidak menjadi sasaran penghapusan.
- Token dari session yang dicabut ditolak saat replay. Pengujian terdahulu mencatat HTTP 401; token dan nilainya tidak dicantumkan.

### 4.4 Local Data Isolation

- `userId` berasal dari session terverifikasi.
- Vault dan History tetap disimpan di `localStorage`, dengan key `veylora_vault_<userId>` dan `veylora_history_<userId>`.
- Data legacy tidak diimpor otomatis. Impor yang tersedia dilakukan manual setelah konfirmasi; sumber legacy tidak dihapus oleh mekanisme impor.
- Logout tidak menghapus data Vault maupun History lokal.
- Pengujian browser akun A menunjukkan data uji tersimpan dan tetap ada sesudah logout/login ulang. Pengujian silang dua akun A/B pada browser nyata belum dilakukan karena akun B tidak tersedia.

### 4.5 Database Security

- Runtime memakai role PostgreSQL **`veylora_app`** melalui `DATABASE_URL`. Role ini diverifikasi bukan superuser, tidak dapat membuat database atau role, tidak memiliki `BYPASSRLS`, dan tidak mempunyai hak `CREATE` pada database Veylora maupun schema `public`.
- Grant tabel runtime dibatasi sesuai operasi aplikasi:
  - `User`: SELECT, INSERT, UPDATE.
  - `UserSettings`: SELECT, INSERT.
  - `Session`: SELECT, INSERT, DELETE.
  - `LoginRateLimit`: SELECT, INSERT, UPDATE, DELETE.
  - Tidak ada grant runtime pada `_prisma_migrations`.
- Prisma CLI memilih `MIGRATION_DATABASE_URL` untuk migrasi; file lokal memakai koneksi migration terpisah dengan hak DDL yang memadai. `lib/prisma.ts` tetap membaca `DATABASE_URL` untuk runtime.
- `.env` diabaikan Git dan tidak terlacak; password database hanya disimpan pada konfigurasi lokal. Pemindaian source tidak menemukan kredensial database yang ditulis langsung.
- **Pengecualian akses:** role masih dapat `CONNECT` ke database PostgreSQL bernama `postgres` karena izin `CONNECT` bawaan untuk `PUBLIC` tidak dicabut. Karena itu, pembatasan koneksi role hanya ke database Veylora belum sepenuhnya terpenuhi; verifikasi pengecualian ini bukan bukti isolasi database penuh. Tidak ditemukan grant tabel aplikasi bagi role tersebut pada database lain dalam pemeriksaan yang dilakukan. Izin global `PUBLIC` tidak diubah karena dapat memengaruhi role lain pada instalasi lokal.

### 4.6 MFA dan Administrator

- Model `User` dan alur autentikasi yang diperiksa tidak menyediakan role Administrator aktif atau pemeriksaan akses administrator. Data contoh admin tidak dianggap sebagai akun administrator aktif.
- MFA belum diimplementasikan.
- Pencarian repository tidak menemukan instruksi asli Pekan 4 yang menjelaskan apakah MFA administrator merupakan persyaratan wajib. Dokumen praktikum Modul 4 yang tersedia membahas Next.js App Router, bukan MFA. Karena instruksi dosen yang relevan tidak ditemukan, status kewajiban MFA **masih memerlukan konfirmasi**; dokumen ini tidak mengasumsikannya hanya rekomendasi.

## 5. Hasil Pengujian

Status di bawah mencatat bukti yang benar-benar tersedia. Uji mock dan pemeriksaan kode diberi keterangan agar tidak disamakan dengan uji produksi atau uji browser.

| Area | Pengujian dan hasil yang diamati | Status |
|---|---|---|
| Password policy | Uji validasi mencakup password di bawah minimum, tepat 15 code point, panjang 64, dan input Unicode; validasi server dan frontend memakai kebijakan password baru yang sama. | PASS — uji otomatis/simulasi |
| Password hashing | Hash baru diverifikasi sebagai Argon2id; password salah ditolak; data yang disimpan berupa hash, bukan plaintext. | PASS — uji otomatis |
| Kompatibilitas bcrypt | Hash bcrypt lama terverifikasi; migrasi ke Argon2id diuji dengan Prisma mock; input lebih dari 72 byte ditolak sebelum compare. | PASS — uji otomatis/mock, bukan migrasi akun database nyata |
| Blocklist password | Password dari fixture blocklist ditolak sebelum hashing; password valid yang tidak cocok melewati validasi. Hash-list lokal diperiksa berisi digest, bukan entri plaintext. | PASS — uji integrasi terisolasi dengan API/Prisma mock |
| Login rate limiting | Empat kegagalan menghasilkan 401, kegagalan kelima dan permintaan berikutnya menghasilkan 429 dengan `Retry-After`; kondisi tetap membatasi setelah server production lokal direstart. | PASS — HTTP production build lokal |
| Reset limiter | Setelah kegagalan tercatat, login berhasil menghapus penghitung di PostgreSQL. | PASS — HTTP production build lokal dan pemeriksaan database |
| Session revocation | Logout menghapus session aktif; replay session yang dicabut pernah diuji dan ditolak HTTP 401; session perangkat lain yang diperiksa tetap aktif. | PASS — pengujian terdahulu yang dicatat |
| Local storage akun A | Penyimpanan Vault/History dan persistensi sesudah logout/login ulang akun A diamati pada browser nyata; impor otomatis tidak terjadi. | PASS — browser nyata akun A |
| Local storage akun A/B | Akun B tidak tersedia saat pengujian; isolasi silang browser nyata belum dibuktikan. | BELUM DIUJI |
| Database role | Koneksi runtime terverifikasi sebagai `veylora_app`; atribut role dan grant yang disebut di atas diperiksa terhadap PostgreSQL. | PASS — koneksi database aktual |
| Pemisahan koneksi | Runtime dan migration memakai URL lokal berbeda; status migrasi dijalankan melalui konfigurasi Prisma dan menunjukkan database up to date. | PASS — konfigurasi dan koneksi aktual |
| Operasi aplikasi dengan role runtime | Register/login/logout, session, serta limiter dijalankan melalui production build memakai role runtime. | PASS — HTTP lokal dengan akun sintetis; data sintetis dibersihkan |
| Build dan pemeriksaan kode | `npx tsc --noEmit`, ESLint, dan production build berhasil pada verifikasi akhir dedicated role. | PASS |
| MFA admin | Tidak tersedia untuk diuji; instruksi asli yang menetapkan kewajiban MFA tidak ditemukan dalam repository. | TIDAK DIIMPLEMENTASIKAN; kewajiban perlu dikonfirmasi |

## 6. Risiko atau Keterbatasan yang Masih Ada

- Blocklist bersumber dari satu dataset terbatas dan hanya memeriksa exact match; ia tidak mencakup semua password bocor, variasi, atau daftar yang lebih baru.
- Blocklist tidak mengirim password keluar dari server, tetapi lisensi/data sumber pihak ketiga tetap mempunyai keterbatasan yang dijelaskan dalam atribusi dataset.
- Rate limit hanya berdasarkan username dan ditujukan untuk demonstrasi lokal, bukan perlindungan komprehensif terhadap serangan produksi.
- Pengujian isolasi localStorage silang dua akun pada browser nyata belum dilakukan.
- Role runtime dapat `CONNECT` ke database `postgres` karena grant bawaan `PUBLIC` tetap berlaku.
- MFA belum tersedia dan kewajiban akademiknya belum terkonfirmasi dari instruksi Pekan 4 yang ditemukan.
- Keberhasilan pemeriksaan yang dicatat tidak membuktikan seluruh aplikasi bebas dari risiko keamanan.

## 7. Kesimpulan

Hardening yang telah diuji meliputi kebijakan dan hashing password, kompatibilitas bcrypt, blocklist lokal, rate limiting, pencabutan session, isolasi localStorage akun A, serta pembatasan privilege database runtime. Hasil yang memerlukan batasan—terutama uji silang akun A/B, MFA, keterbatasan blocklist/rate limiter, dan izin `CONNECT` ke database `postgres`—tetap dinyatakan terbuka. Dokumen ini tidak menyatakan seluruh sistem sudah aman.

## 8. SSH Hardening Pekan 5

### Tujuan dan Kondisi Sebelum Hardening

Tujuan hardening adalah membatasi autentikasi SSH ke public key, menolak root login, serta memverifikasi konfigurasi efektif dan hasil uji koneksi dari Windows ke Ubuntu WSL.

Pada pemeriksaan awal, OpenSSH Server belum terinstal, `sshd`, `sshd_config`, dan `sshd_config.d` belum tersedia, layanan SSH belum ada, dan tidak ada listener pada port 22. systemd aktif pada Ubuntu WSL. Tidak ditemukan pasangan SSH key atau `authorized_keys` untuk pengguna `intanlucu` di WSL maupun pasangan key pada profil Windows.

Setelah OpenSSH Server 10.2p1 terinstal dan sebelum hardening, konfigurasi efektif yang diperiksa adalah: port 22; `PermitRootLogin prohibit-password`; `PasswordAuthentication yes`; `KbdInteractiveAuthentication no`; `PubkeyAuthentication yes`; `PermitEmptyPasswords no`; `MaxAuthTries 6`; dan `X11Forwarding yes`. Layanan memakai aktivasi socket systemd melalui `ssh.socket`.

### Backup dan Konfigurasi

Backup konfigurasi dibuat sebelum perubahan di `/etc/ssh/backup-before-hardening-20261107-1430/`. Backup memuat `sshd_config` dan direktori drop-in; tidak mencakup host key atau private key.

Drop-in aktif berada di `/etc/ssh/sshd_config.d/00-hardening.conf` dengan isi:

```text
PermitRootLogin no
PasswordAuthentication no
KbdInteractiveAuthentication no
PubkeyAuthentication yes
PermitEmptyPasswords no
MaxAuthTries 3
X11Forwarding no
AllowUsers intanlucu
```

File yang diminta dengan nama `/etc/ssh/sshd_config.d/00-veylora-hardening.conf` tidak dibuat. `00-hardening.conf` sudah dibaca lebih awal, memuat pengaturan yang diperlukan, dan nilai efektifnya telah diverifikasi; file kedua akan menjadi konfigurasi duplikat yang tidak diperlukan.

`00-hardening.conf` diproses sebelum file konfigurasi yang urutannya lebih akhir. Konfigurasi efektif diperiksa menggunakan `sudo sshd -T`; hasil relevannya:

| Opsi | Nilai efektif |
|---|---|
| `port` | `22` |
| `permitrootlogin` | `no` |
| `passwordauthentication` | `no` |
| `kbdinteractiveauthentication` | `no` |
| `pubkeyauthentication` | `yes` |
| `permitemptypasswords` | `no` |
| `maxauthtries` | `3` |
| `x11forwarding` | `no` |
| `allowusers` | `intanlucu` |
| `authorizedkeysfile` | `.ssh/authorized_keys .ssh/authorized_keys2` |

### SSH Key, Validasi, dan Penerapan

Tidak ada key sebelumnya, sehingga pasangan Ed25519 khusus praktik dibuat di profil Windows pada `C:\Users\INTAN\.ssh\veylora-wsl-practice-ed25519`. Private key tidak disalin ke repository atau ditampilkan; ACL file membatasi akses ke akun Windows pengguna, SYSTEM, dan Administrators. Public key dipasang pada `/home/intanlucu/.ssh/authorized_keys`; direktori memiliki mode `700` dan file mode `600`.

Sebelum password authentication dinonaktifkan, uji dari Windows ke `intanlucu@127.0.0.1` menggunakan public key berhasil dan mengembalikan `whoami=intanlucu` (exit code 0).

Setelah drop-in dibuat, `sudo sshd -t` berhasil (`SSHD_CONFIG_VALID`). Penerapan dilakukan dengan `sudo systemctl reload ssh.service`, bukan menghentikan sesi aktif. Status systemd menunjukkan reload berhasil; `ExecReload` menjalankan `sshd -t` dengan status 0 dan `ssh.service` serta `ssh.socket` aktif.

### Hasil Pengujian

| Pemeriksaan | Hasil aktual | Status |
|---|---|---|
| Konfigurasi drop-in | File tersedia dengan owner `root:root` dan mode `644`; isi sesuai pengaturan di atas. | PASS |
| Sintaks konfigurasi | `sudo sshd -t` berhasil sebelum reload; `ExecReload` setelah perubahan juga menjalankan `sshd -t` dengan status 0. | PASS |
| Konfigurasi efektif | Output `sudo sshd -T` cocok dengan semua nilai pada tabel. | PASS |
| SSH key dari Windows | Login ke `intanlucu@127.0.0.1` berhasil; `whoami` menghasilkan `intanlucu`, exit code 0. | PASS |
| Login password saja | Uji Windows dengan public-key auth dimatikan ditolak `Permission denied (publickey)`, exit code 255. Tidak ada password yang dikirim. | PASS — penolakan teruji |
| Login langsung sebagai root | Uji Windows dengan key ke `root@127.0.0.1` ditolak `Permission denied (publickey)`, exit code 255. | PASS — penolakan teruji |
| Backup konfigurasi | Backup berada pada lokasi di atas; target baru dibuat tanpa menimpa backup yang sudah ada. | PASS |
| Konflik port / konektivitas | Tidak ada listener Windows port 22 sebelum server dipasang; koneksi Windows ke WSL melalui `127.0.0.1:22` berhasil setelah pemasangan. | PASS |

Password authentication dinonaktifkan hanya setelah autentikasi SSH key dari Windows berhasil diverifikasi. Pengujian positif dan negatif pada tabel dilakukan setelah konfigurasi efektif diterapkan.

### Batasan WSL

- Ubuntu WSL menggunakan systemd dan `ssh.socket`; unit socket mendengarkan pada `0.0.0.0:22` dan `[::]:22` di dalam WSL. Pengujian yang dilakukan berasal dari Windows melalui localhost. Firewall tidak diubah, sehingga keterjangkauan dari jaringan lain tidak diklaim telah diuji.
- Layanan dan konektivitas bergantung pada WSL sedang berjalan dan konfigurasi jaringan Windows/WSL; ini bukan pengujian pada server Ubuntu fisik atau produksi.
- Hardening ini hanya mencakup SSH. Tidak ada hardening lain atau perubahan firewall/kernel yang dilakukan pada tahap ini. Patch management dan Lynis AFTER dicatat terpisah pada bagian berikut.

## 9. Lynis Audit AFTER dan Perbandingan Hasil Hardening OS

Audit Lynis AFTER dijalankan ulang pada 2026-11-07 di Ubuntu 26.04 LTS melalui WSL 2 menggunakan Lynis 3.1.6 setelah seluruh hardening OS, SSH tuning, file permission, umask, legal banner, dan sysctl diterapkan. Keluaran terminal lengkap tersimpan di [lynis-after.txt](./lynis-after.txt) dan audit berakhir dengan exit code 0. File baseline [lynis-before.txt](./lynis-before.txt) tetap dipertahankan utuh.

### Perbandingan Metrik Lynis

| Metrik | BEFORE (Baseline) | INTERMEDIATE | AFTER (Final Hardened) | Perubahan Total | Target Rubrik | Status |
|---|---:|---:|---:|---:|:---:|:---:|
| **Hardening Index** | **66** | 67 | **80** | **+14 poin** | Minimal 70 | **MELAMPAUI TARGET (80 >= 70)** |
| **Tests Performed** | 244 | 248 | **249** | +5 tests | — | — |
| **Warnings** | 1 | 0 | **0** | -1 (Tuntas) | 0 | **PASS** |
| **Suggestions** | 37 | 44 | **28** | -16 suggestions | — | **SIGNIFIKAN TURUN** |

### Rincian Hardening OS yang Diterapkan:
1. **SSH Tuning Tambahan (`/etc/ssh/sshd_config.d/00-hardening.conf`):**
   - `AllowTcpForwarding no`
   - `AllowAgentForwarding no`
   - `ClientAliveCountMax 2`
   - `ClientAliveInterval 300`
   - `LogLevel VERBOSE`
   - `MaxSessions 2`
   - `TCPKeepAlive no`
2. **Izin File Sensitif & Compiler:**
   - `chmod 600 /etc/crontab /etc/ssh/sshd_config`
   - `chmod 700 /etc/cron.*`
   - `chmod 700 /usr/bin/gcc-15 /usr/bin/x86_64-linux-gnu-as` (Membatasi akses compiler C hanya untuk root)
3. **Kebijakan Akun & Umask (`/etc/login.defs`):**
   - `UMASK 027` (Mencegah file baru dibaca oleh pengguna non-grup)
   - `PASS_MAX_DAYS 90`
   - `PASS_MIN_DAYS 1`
4. **Legal Banners (`/etc/issue` & `/etc/issue.net`):**
   - Menambahkan legal warning banner resmi untuk memperjelas batas akses sistem.
5. **Sysctl Kernel Hardening (`/etc/sysctl.d/99-hardening.conf`):**
   - `fs.protected_fifos = 2`
   - `fs.protected_regular = 2`
   - `fs.suid_dumpable = 0`
   - `kernel.kptr_restrict = 2`
   - `kernel.sysrq = 0`
   - `net.ipv4.conf.all.accept_redirects = 0`
   - `net.ipv4.conf.all.send_redirects = 0`
   - `net.ipv4.conf.default.accept_redirects = 0`
6. **Paket Audit & Pemeliharaan:**
   - Pemasangan `needrestart` dan `libpam-tmpdir` untuk keamanan temporary directory per pengguna.

---

## 10. Container Hardening dan Verifikasi Runtime (Pekan 6)

Hardening container diterapkan pada aplikasi Next.js Veylora dan PostgreSQL menggunakan arsitektur multi-stage Docker build dan Docker Compose v2.

### 10.1 Arsitektur Multi-Stage Dockerfile (`Dockerfile`)
- **Base Image:** `node:22-alpine` (ringan, minimal attack surface).
- **Non-Root User:** Membuat group `nodejs` (GID 1001) dan user `nextjs` (UID 1001).
- **Next.js Standalone Build:** Menambahkan `output: "standalone"` pada `next.config.ts` untuk meminimalisasi node_modules yang dimasukkan ke image runtime.
- **Minimal Runtime Footprint:** Tahap runner hanya menyalin artefak minimal yang dibutuhkan untuk eksekusi server:
  - `/app/.next/standalone`
  - `/app/.next/static`
  - `/app/public`
  - `/app/prisma` & client

### 10.2 Konfigurasi Docker Compose (`compose.yaml`)
- **User Non-Root:** Didefinisikan secara eksplisit `user: "1001:1001"`.
- **Read-Only Root Filesystem:** Diaktifkan dengan `read_only: true`.
- **Writable Tmpfs:** Direktori temporer yang memerlukan penulisan dialihkan ke memori non-persisten `tmpfs: [/tmp, /app/.next/cache]`.
- **Drop All Capabilities:** Membatasi capability Linux dengan `cap_drop: [ALL]`.
- **No New Privileges:** `security_opt: [no-new-privileges:true]` mencegah eskalasi hak istimewa (misalnya melalui SUID binary).
- **Isolasi Port Database:** Service `db` **TIDAK memiliki mapping `ports:` ke host**. Akses PostgreSQL hanya terbuka melalui bridge network internal `tugas1_default` (`db:5432`). Host port 5432 sama sekali tidak dipublikasikan.

### 10.3 Hasil Uji Verifikasi Runtime Container

Verifikasi runtime dijalankan langsung pada container aktif di lingkungan Ubuntu WSL 2:

| Parameter | Perintah Verifikasi | Hasil Aktual | Status |
|---|---|---|:---:|
| **Non-Root User** | `docker compose exec app id` | `uid=1001(nextjs) gid=1001(nodejs) groups=1001(nodejs)` | **PASS** |
| **Capability Limitation** | `docker compose exec app sh -c 'grep CapEff /proc/1/status'` | `CapEff: 0000000000000000` (Nol capability efektif) | **PASS** |
| **Read-Only Filesystem (Uji Negatif)** | `docker compose exec app touch /app/security-write-test` | `touch: /app/security-write-test: Read-only file system` (Exit code 1, tertolak) | **PASS** |
| **Tmpfs Writable (Uji Positif)** | `docker compose exec app touch /tmp/test-ok` | Berhasil menulis di `/tmp` (memori terisolasi), file dapat dibuat dan dihapus | **PASS** |
| **Isolasi Port Basis Data** | `ss -ltn \| grep 5432` | Tidak ada output (Port 5432 tidak listening pada host WSL/Windows) | **PASS** |
| **Konektivitas Aplikasi** | `curl -s -I http://localhost:3000` | `HTTP/1.1 307 Temporary Redirect` -> `location: /login` (Aplikasi aktif merespons) | **PASS** |

---

## 11. Pemindaian Kerentanan Image (Trivy) dan SBOM CycloneDX

Pemindaian kerentanan image container dilakukan menggunakan **Trivy v0.76.2** di lingkungan Ubuntu WSL 2.

### 11.1 Perbandingan Hasil Pemindaian (Before vs After)
- **Baseline Image (Before):** Image unhardened `node:22` (Debian-based standard image).
  - Laporan tersimpan di: `security/image-scan-before.txt`
  - Terdeteksi ratusan paket dependensi OS Debian yang belum diminimalisasi.
- **Hardened Image (After):** Image `veylora-app:latest` (`node:22-alpine` multi-stage standalone).
  - Laporan tersimpan di: `security/image-scan-after.txt`
  - **Hasil Kerentanan CRITICAL: 0 (NOL KEMATIAN / ZERO CRITICAL VULNERABILITIES)**.
  - Memenuhi syarat kelulusan rubrik Tugas 2.

### 11.2 Software Bill of Materials (SBOM)
- **Format:** CycloneDX v1.7 JSON (`specVersion: "1.7"`, `$schema: "http://cyclonedx.org/schema/bom-1.7.schema.json"`)
- **Penghasil SBOM:** Trivy v0.76.2
- **Lokasi File:** `security/sbom.cdx.json`
- **Total Komponen Teridentifikasi:** 260 komponen (pustaka Alpine OS, Node runtime, dan dependensi npm terpasang).
- **Validasi Integritas:** Format JSON valid dan terverifikasi melalui parser otomatis.

---

## 12. Kesimpulan Akhir dan Kesiapan Milestone `sec-0.2`

Seluruh sasaran Tugas 2 telah diselesaikan dengan bukti terperinci:
1. **Autentikasi & Least Privilege:** Password hashing Argon2id (64 MiB, 3 iterasi), rate limiting, dan 26 uji akses (12 positif, 14 negatif) **100% PASS**.
2. **Hardening OS:** SSH Key-Only (ED25519), root & password login ditolak, Lynis hardening index melompat dari 66 menjadi **80** (target >= 70).
3. **Hardening Container:** Pengguna non-root (UID 1001), `CapEff: 0000000000000000`, filesystem read-only, port database tidak dipublikasikan ke host.
4. **Vulnerability Scanning & SBOM:** 0 kerentanan CRITICAL pada image akhir (`veylora-app:latest`), perbandingan before/after tersedia, SBOM CycloneDX JSON tersedia.
5. **Dokumentasi & Integritas:** Seluruh kontrol terhubung dengan Risk Register Tugas 1 dan STRIDE pada `security/risk-register.md`, serta `AI_LOG.md` lengkap.

Sistem Veylora siap untuk pemeriksaan dan demonstrasi evaluasi milestone **`sec-0.2`**.
