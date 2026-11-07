# Matriks Pengujian Akses dan Keamanan Veylora

## 1. Tujuan

Dokumen ini merangkum role, hak akses, dan skenario keamanan Pekan 4 yang benar-benar diperiksa. Status **PASS** hanya digunakan bila ada hasil pengujian atau bukti implementasi yang dinyatakan secara jelas. Pemeriksaan kode saja tidak dianggap sebagai pengujian runtime.

## 2. Role dan Hak Akses

Model `User` memiliki `id`, `username`, `passwordHash`, waktu pembuatan/perubahan, relasi `UserSettings`, dan relasi `Session`. Tidak ada kolom/enum role maupun otorisasi berbasis role.

| Role/kondisi akses | Status implementasi | Hak akses yang terlihat |
|---|---|---|
| Pengunjung tanpa login | Kondisi akses, bukan role aplikasi | Halaman login/register serta endpoint login/register publik. Halaman aplikasi dilindungi session. |
| Pengguna terautentikasi | Satu-satunya tipe pengguna aktif | Dapat memakai halaman aplikasi setelah pemeriksaan session; tidak ada pembedaan hak antar pengguna. |
| Administrator | TIDAK DIIMPLEMENTASIKAN | Tidak ada role atau pemeriksaan administrator aktif. Data demo berlabel admin bukan akun aktif. |
| Role lain | TIDAK DIIMPLEMENTASIKAN | Tidak ditemukan definisi atau aturan akses role lain. |
| `veylora_app` | Role database runtime, bukan role pengguna | Koneksi runtime dengan grant minimum per tabel; bukan superuser, tidak dapat membuat database/role, dan tidak memiliki `CREATE` pada schema `public`. |

Proxy memverifikasi signature JWT, HS256, `sub`, dan `jti`. Pemeriksaan record session penuh melalui database dilakukan oleh `verifySession()` yang digunakan layout aplikasi dan route logout.

## 3. Daftar Halaman dan Endpoint

Halaman berikut berada di bawah `app/(app)/layout.tsx`, yang memanggil `verifySession()`:

| Halaman | URL | Perlindungan |
|---|---|---|
| Dashboard | `/` | Session aktif |
| Vault | `/vault` | Session aktif |
| History | `/history` | Session aktif |
| Cek URL | `/check-url` | Session aktif |
| Pengaturan | `/settings` | Session aktif |
| Uji Dynamic Route | `/uji-dynamic-route` | Session aktif |
| Detail Uji Dynamic Route | `/uji-dynamic-route/[id]` | Session aktif |

| Endpoint | Akses | Operasi utama |
|---|---|---|
| `POST /api/login` | Publik | Verifikasi password, rate limit, buat session |
| `POST /api/register` | Publik | Validasi kebijakan/blocklist, buat akun dan session |
| `POST /api/logout` | Memerlukan session aktif | Verifikasi session dan cabut session saat ini |

## 4. Matriks Pengujian

| ID | Area / role | Halaman/endpoint | Kondisi awal | Aksi | Hasil yang diharapkan | Hasil aktual / bukti | Status |
|---|---|---|---|---|---|
| AT-01 | Pengunjung | Dashboard `/` | Tidak login | Membuka dashboard | Dialihkan ke `/login` | Tidak ada bukti uji browser khusus untuk dashboard tanpa login; hanya ada pemeriksaan guard dalam kode. | BELUM DIUJI |
| AT-02 | Pengunjung | Vault `/vault` | Logout/tanpa session | Membuka Vault | Dialihkan ke `/login` | Browser mengarahkan request Vault ke halaman login. | PASS |
| AT-03 | Pengunjung | History `/history` | Tidak login | Membuka History | Dialihkan ke `/login` | Tidak ada bukti uji browser khusus untuk History tanpa login. | BELUM DIUJI |
| AT-04 | Pengunjung | `POST /api/logout` | Tanpa session aktif | Mengirim request logout anonim sebagai pengujian tersendiri | HTTP 401 | Pengujian tersendiri belum tersedia. HTTP 401 yang tercatat berasal dari pengujian replay session menggunakan request tanpa cookie, bukan pengujian anonim `POST /api/logout` yang terpisah. | BELUM DIUJI |
| AT-05 | Pengunjung dengan session yang dicabut | Endpoint API replay; path pengujian terdahulu tidak tercatat | Session sudah dicabut | Mengirim ulang token lama | Request ditolak | Pengujian terdahulu mencatat HTTP 401; path endpoint spesifik tidak tersedia di bukti, sehingga handler yang secara spesifik memanggil `verifySession()` tidak dapat dipastikan dari catatan itu. | PASS |
| AT-06 | Pengunjung dengan session dicabut | Halaman terlindungi | Session dicabut | Membuka halaman dengan cookie lama | Dialihkan ke login | Tidak ada bukti replay cookie lama pada halaman terproteksi. | BELUM DIUJI |
| AT-07 | Pengguna terautentikasi | Dashboard, Vault, History | Login berhasil | Membuka ketiga halaman | Ketiganya dapat dibuka | Ketiga halaman tersebut diamati di browser akun A; ini tidak mencakup semua halaman aplikasi. | PASS |
| AT-08 | Pengguna sesudah logout | `/vault` | Logout berhasil | Membuka Vault | Dialihkan ke login | Akses Vault sesudah logout mengarah ke halaman login. | PASS |
| AT-09 | Pengguna terautentikasi | `POST /api/logout` | Session aktif | Logout melalui aplikasi | Session saat ini dicabut | Logout berhasil; record session aktif dihapus dan dua session lain yang diperiksa tetap aktif. | PASS |
| PW-01 | Pengguna baru | `POST /api/register` | Password kurang dari 15 code point | Submit registrasi | Ditolak validasi server | Uji validasi password pendek ditolak. | PASS |
| PW-02 | Pengguna baru | `POST /api/register` | Password tepat 15 code point, tidak blocklisted | Submit registrasi | Validasi password lolos | Batas minimum diuji dan diterima oleh schema kebijakan. | PASS |
| PW-03 | Pengguna baru | `POST /api/register` | Password 64 code point | Submit registrasi | Validasi password lolos | Panjang 64 diuji dalam validasi. | PASS |
| PW-04 | Pengguna baru | `POST /api/register` | Password Unicode panjang dalam batas | Submit registrasi | Hitung code point dan normalisasi NFC konsisten | Pengujian Unicode dijalankan dalam simulasi validasi/hashing. | PASS |
| PW-05 | Pengguna baru | `POST /api/register` | Password cocok dengan digest blocklist | Request API langsung, tanpa bergantung frontend | Ditolak sebelum Argon2id hash | Uji API terisolasi dengan Prisma mock menolak fixture blocklist sebelum hashing; tidak membuat akun database. | PASS |
| PW-06 | Pengguna baru | `POST /api/register` | Password memenuhi panjang dan tidak cocok dengan blocklist | Submit request | Lanjut ke hash dan pembuatan akun | Uji API terisolasi dengan mock melewati pemeriksaan blocklist dan melanjutkan jalur registrasi. | PASS |
| PW-07 | Akun lama | `POST /api/login` | Hash bcrypt lama | Login dengan password benar | Login berjalan dan hash dimigrasikan ke Argon2id | Hash bcrypt nyata diverifikasi; jalur migrasi diuji dengan Prisma mock, bukan update akun database nyata. | PASS |
| PW-08 | Pengguna login/registrasi | Form login/register | Form ditampilkan | Memeriksa autocomplete dan paste | `current-password` / `new-password`; tidak memblokir paste | Pemeriksaan kode menemukan autocomplete yang sesuai dan tidak menemukan pencegahan paste; uji lintas password manager/browser tidak tercatat. | PASS |
| RL-01 | Pengunjung | `POST /api/login` | Username sintetis; limiter kosong | Empat kali password salah | Empat respons autentikasi gagal biasa | HTTP pada production build lokal menghasilkan HTTP 401 untuk empat kegagalan. | PASS |
| RL-02 | Pengunjung | `POST /api/login` | Empat kegagalan dalam jendela 15 menit | Gagal untuk kali kelima | HTTP 429 dan `Retry-After` | Production build lokal menghasilkan 429 dan nilai `Retry-After` positif. | PASS |
| RL-03 | Pengunjung | `POST /api/login` | Username sedang dibatasi | Mengulang login | Tetap 429 selama lockout | Request berikutnya pada akun limiter tetap menghasilkan 429. | PASS |
| RL-04 | Pengguna terautentikasi | `POST /api/login` | Ada penghitung kegagalan | Login sukses | Penghitung username dihapus | Penghitung diperiksa di PostgreSQL sebelum login sukses dan dipastikan terhapus sesudahnya. | PASS |
| RL-05 | Pengunjung | `POST /api/login` | Username sintetis dibatasi | Restart server production lalu mencoba lagi | Status limiter bertahan | Diuji terpisah sebelumnya: status 429 bertahan sesudah restart server lokal; data uji sudah dibersihkan. | PASS |
| RL-06 | Pengunjung | `POST /api/login` | Username tidak dikenal dan password salah | Membandingkan respons autentikasi | Pesan tidak membocorkan keberadaan username | Pesan untuk username sintetis tidak dikenal sama dengan pesan password salah untuk akun sintetis. | PASS |
| DB-01 | Runtime database role | Koneksi PostgreSQL | Aplikasi memakai `.env` lokal | Memeriksa role dan atribut | `veylora_app`, non-superuser, tanpa CREATEDB/CREATEROLE/CREATE schema | Metadata PostgreSQL mengonfirmasi atribut tersebut; role tidak memiliki `CREATE` database atau schema. | PASS |
| DB-02 | Runtime database role | Tabel aplikasi | Aplikasi runtime | Memeriksa grant | Hak terbatas sesuai operasi aplikasi | Grant diverifikasi: User SELECT/INSERT/UPDATE; UserSettings SELECT/INSERT; Session SELECT/INSERT/DELETE; LoginRateLimit SELECT/INSERT/UPDATE/DELETE; tanpa grant `_prisma_migrations`. | PASS |
| DB-03 | Runtime database role | Database `postgres` | `PUBLIC CONNECT` tidak dicabut | Memeriksa kemampuan CONNECT dan mendokumentasikan pengecualian | Pengecualian CONNECT terverifikasi dan didokumentasikan; pembatasan koneksi hanya ke database Veylora belum sepenuhnya terpenuhi | Role masih dapat CONNECT ke `postgres` karena privilege bawaan PUBLIC; pengecualian ini telah diverifikasi dan didokumentasikan. Hak CONNECT PUBLIC tidak dicabut. | PASS — verifikasi pengecualian, bukan keberhasilan isolasi database penuh |
| DB-04 | Runtime dan migration | PostgreSQL/Prisma CLI | Dua environment URL tersedia lokal | Verifikasi konfigurasi dan `migrate status` | Runtime memakai `DATABASE_URL`; CLI memilih `MIGRATION_DATABASE_URL` | Identitas runtime `veylora_app`, koneksi migration role admin; status migrasi up to date. DDL migration baru tidak dijalankan pada pemeriksaan akhir. | PASS |
| DB-05 | Akun sintetis / runtime role | API production build | Akun belum ada | Register, login, logout, dan limiter melalui HTTP | Operasi yang diperlukan berjalan dengan grant runtime | Uji end-to-end lulus; akun sintetis, session terkait, dan row limiter dibersihkan. | PASS |
| LD-01 | Akun A | Vault dan History | Akun A login pada browser nyata | Simpan entri uji Vault dan URL History | Data disimpan dalam namespace userId | Entri uji tampil; key menggunakan pola namespace akun. | PASS |
| LD-02 | Akun A | Vault dan History | Data uji tersimpan | Logout dan login kembali akun A | Data uji tetap terlihat | Persistensi Vault dan History diamati pada browser nyata. | PASS |
| LD-03 | Akun A | localStorage | Key legacy mungkin ada | Login dan periksa impor otomatis | Tidak ada impor otomatis | Tidak ditemukan impor otomatis; key legacy tidak ditemukan pada browser uji. | PASS |
| LD-04 | Akun A dan B | Vault dan History | Akun B tidak tersedia | Login silang dan periksa namespace/data | Data A dan B terisolasi | Pengujian browser silang tidak dilakukan karena akun B tidak tersedia. Simulasi localStorage terpisah pernah lulus, tetapi bukan pengganti uji browser dua akun. | BELUM DIUJI |
| MFA-01 | Administrator | Endpoint/halaman yang dibatasi role | Role Administrator tidak aktif | Mencoba alur MFA administrator | MFA hanya dapat diuji bila role/alur diterapkan | Tidak ada role administrator aktif atau MFA. Dokumen instruksi asli Pekan 4 yang mengatur kewajiban MFA tidak ditemukan di repository; dokumen praktikum Modul 4 yang tersedia tidak membahasnya. | TIDAK DIIMPLEMENTASIKAN |

## 5. Hasil Pengujian

- **PASS:** uji HTTP production lokal untuk register, login, password salah, logout, replay session yang dicabut, limiter, serta reset penghitung.
- **PASS:** uji pembatasan role database dan hak akses tabel melalui koneksi PostgreSQL aktual.
- **PASS:** pemeriksaan pemisahan runtime/migration dan status migrasi. Pemeriksaan ini tidak menjalankan DDL baru.
- **PASS:** TypeScript, ESLint, dan production build pada verifikasi dedicated role.
- **PASS:** pengujian akun A untuk persistensi Vault/History dan tidak adanya impor otomatis.
- **BELUM DIUJI:** isolasi silang akun A/B melalui browser nyata; akun B tidak tersedia.
- **BELUM DIUJI:** replay session dicabut ke halaman terlindungi dan skenario anonim `POST /api/logout` yang dicatat terpisah.
- **TIDAK DIIMPLEMENTASIKAN:** MFA dan role Administrator aktif. Kewajiban akademik MFA masih perlu dicocokkan dengan instruksi dosen karena instruksi asli yang relevan tidak ditemukan di repository.

## 6. Skenario yang Belum Diuji atau Belum Diimplementasikan

- Pengunjung tanpa login membuka Dashboard `/` dan History `/history` pada pengujian browser khusus.
- Request anonim tanpa cookie ke `POST /api/logout` sebagai skenario tersendiri.
- Replay cookie lama yang dicabut langsung ke halaman terproteksi.
- Isolasi Vault/History lintas akun A dan B dalam browser nyata.
- MFA untuk administrator. Fitur belum ada; kewajiban dalam instruksi akademik belum dapat dipastikan dari repository.
- Pengujian password manager pada berbagai browser/produk password manager.
- DDL migrasi baru melalui `MIGRATION_DATABASE_URL`; tidak ada migrasi tertunda ketika verifikasi dilakukan.

## 7. Kesimpulan

Bukti menunjukkan hardening password, rate limiting username, session revocation, operasi runtime dengan role database terbatas, pemisahan koneksi Prisma, serta penyimpanan Vault/History per userId telah diterapkan dan diuji pada tingkat yang dinyatakan di setiap baris. Batasan yang masih terbuka—termasuk uji browser dua akun, keterbatasan rate limiter lokal, izin CONNECT ke database `postgres`, serta MFA yang belum tersedia dan kewajibannya belum terkonfirmasi—tidak dianggap lulus. Matriks ini bukan klaim bahwa seluruh aplikasi sudah aman.

## 8. SSH Hardening Pekan 5

Pengujian dilakukan dari Windows ke Ubuntu 26.04 LTS melalui WSL 2 pada `127.0.0.1:22`. Konfigurasi efektif diverifikasi dengan `sudo sshd -T`, dan sintaks dengan `sudo sshd -t`. Drop-in aktif adalah `/etc/ssh/sshd_config.d/00-hardening.conf`; file `00-veylora-hardening.conf` tidak dibuat karena konfigurasi yang sudah ada diproses lebih awal dan memenuhi kebutuhan.

| ID | Skenario | Metode/bukti aktual | Hasil | Status |
|---|---|---|---|---|
| SSH-01 | Login menggunakan SSH key | Windows `ssh` dengan private key yang ditentukan, `BatchMode=yes`, autentikasi public key saja. Perintah `whoami` menghasilkan `intanlucu`, exit code 0. | Login berhasil tanpa fallback password. | PASS |
| SSH-02 | Login password-only | Windows `ssh` dengan `BatchMode=yes`, public-key auth dinonaktifkan, metode password dipilih, tanpa password prompt. Server menolak dengan `Permission denied (publickey)`, exit code 255. | Autentikasi password ditolak. | PASS |
| SSH-03 | Login langsung sebagai root | Windows `ssh` dengan `BatchMode=yes` dan key pengguna ke `root@127.0.0.1`. Server menolak dengan `Permission denied (publickey)`, exit code 255. | Root login ditolak. | PASS |

Pengujian ini hanya membuktikan koneksi Windows ke WSL melalui localhost; akses jaringan dari host lain belum diuji.
