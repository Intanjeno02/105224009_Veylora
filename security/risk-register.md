# Risk Register & Threat Mitigation Matrix — Veylora Personal Security Assistant

**Mata Kuliah:** Keamanan Komputasi dan Siber  
**Tugas:** Tugas 2 — Kontrol Akses dan System Hardening  
**Milestone:** `sec-0.2`  
**Lingkungan Evaluasi:** Ubuntu 26.04 LTS pada WSL 2 (Windows 11)  
**Terakhir Diperbarui:** 7 November 2026  

---

## 1. Pendahuluan dan Metodologi

Risk Register ini merupakan evolusi langsung dari **Risk Register Tugas 1** (`origin/tugas-1:Tugas1/security/risk-register.md`) dan **Threat Model Tugas 1** (`origin/tugas-1:Tugas1/security/threat-model.md`).

Pada milestone `sec-0.2` (Tugas 2), fokus utama adalah merealisasikan kontrol keamanan teknis untuk memitigasi risiko autentikasi, perlindungan kata sandi, kontrol akses, hardening sistem operasi/SSH, serta pengamanan container dan rantai pasok software (*supply chain*).

### Skala Penilaian Risiko
- **Kemungkinan (*Likelihood - L*):** 1 (Rendah), 2 (Sedang), 3 (Tinggi)
- **Dampak (*Impact - I*):** 1 (Rendah), 2 (Sedang), 3 (Tinggi)
- **Nilai Risiko (*Risk Score - RS*):** $L \times I$
  - **1–2:** Rendah (Low)
  - **3–4:** Sedang (Medium)
  - **6–9:** Tinggi (High)

---

## 2. Matriks Pemetaan Risiko Tugas 1 & Tugas 2 ke STRIDE

Tabel berikut memetakan risiko dari Tugas 1 (R01–R05) serta risiko operasional infrastruktur Tugas 2 (R06–R09) ke kategori ancaman STRIDE, ancaman spesifik Tugas 1 (T01–T12), kontrol teknis yang telah diimplementasikan, bukti verifikasi, serta status mitigasi akhir:

| ID Risiko | Ancaman & Skenario Risiko | Kategori STRIDE | Ancaman T1 Terkait | Aset Terdampak | Skor Awal (L × I) | Kontrol Keamanan yang Diterapkan (Tugas 2) | Bukti Pengujian & Verifikasi | Skor Akhir (L × I) | Status Akhir |
|:---:|:---|:---:|:---:|:---:|:---:|:---|:---|:---:|:---:|
| **R01** | Password pengguna ditebak/dicuri melalui brute force atau kebocoran hash lemah | **S** (Spoofing),<br>**I** (Info Disc) | T01, T05 | A01, A02, A05 | **6 (Tinggi)**<br>(2 × 3) | 1. Slow hashing **Argon2id** (memory 64 MiB, 3 iterasi, salt unik 16-byte).<br>2. Kebijakan panjang password min 15 karakter.<br>3. Pengecekan blocklist kata sandi umum sebelum hashing.<br>4. Rate limiting: maksimal 5 percobaan gagal per 15 menit (HTTP 429 + `Retry-After`).<br>5. Pesan error seragam (*timing/enumeration protection*). | Test case: `PW-01` s/d `PW-05`, `HASH-01` s/d `HASH-05`, `RL-01` s/d `RL-03` pada `security/access-tests.md`. Seluruh 13 pengujian **PASS**. | **2 (Rendah)**<br>(1 × 2) | **MITIGATED** |
| **R02** | Data kredensial dalam Vault bocor atau diakses lintas pengguna (*cross-user*) | **I** (Info Disc),<br>**E** (Elevation) | T04, T06, T11 | A01, A03, A04 | **6 (Tinggi)**<br>(2 × 3) | 1. Isolasi penyimpanan data berbasis namespace unik `userId` (`veylora_vault_<userId>`).<br>2. Akses halaman `/vault` diwajibkan melewati validasi session database aktif (`verifySession()`). | Test case: `ISO-01`, `AC-01` pada `security/access-tests.md`. Pengguna B tidak dapat membaca atau menimpa key pengguna A. | **2 (Rendah)**<br>(1 × 2) | **MITIGATED** |
| **R03** | Penyerang menyalahgunakan session curian atau token kadaluwarsa/dimanipulasi | **S** (Spoofing),<br>**T** (Tampering) | T07 | A03, A05 | **6 (Tinggi)**<br>(2 × 3) | 1. Token JWT ditandatangani secara kriptografis menggunakan algoritma HS256 (`sub` dan `jti`).<br>2. Cookie session bertanda `HttpOnly`, `SameSite=Lax`, `Secure` (pada production).<br>3. Pencabutan session aktif seketika pada database saat logout.<br>4. Replay token yang dicabut atau signature palsu langsung ditolak (HTTP 401). | Test case: `SES-01`, `SES-02`, `AC-05` pada `security/access-tests.md`. Manipulasi signature menghasilkan `null` / HTTP 401. | **2 (Rendah)**<br>(1 × 2) | **MITIGATED** |
| **R04** | Riwayat pemeriksaan URL atau hasil audit keamanan dimanipulasi atau diakses tidak sah | **T** (Tampering),<br>**I** (Info Disc) | T09, T10 | A06, A07 | **4 (Sedang)**<br>(2 × 2) | 1. Namespace riwayat terisolasi per akun (`veylora_history_<userId>`).<br>2. Halaman `/history` dan `/check-url` dilindungi layout guard session. | Test case: `ISO-02`, `AC-02` pada `security/access-tests.md`. Akses tanpa login dialihkan ke `/login`. | **1 (Rendah)**<br>(1 × 1) | **MITIGATED** |
| **R05** | Pengguna menyangkal aktivitas pemeriksaan atau perubahan akun (*non-repudiation*) | **R** (Repudiation) | T03 | A06 | **4 (Sedang)**<br>(2 × 2) | 1. Audit trail session mencatat timestamp pembuatan dan akses terakhir.<br>2. Rate limit mencatat riwayat percobaan login per identifier.<br>3. Log SSH Linux di-set ke mode `VERBOSE` untuk akuntabilitas login. | Verifikasi konfigurasi SSH (`LogLevel VERBOSE` pada `00-hardening.conf`) dan skema session Prisma. | **2 (Rendah)**<br>(1 × 2) | **MITIGATED** |
| **R06** | Penyerang melakukan brute force atau login SSH sebagai root pada host OS | **S** (Spoofing),<br>**E** (Elevation) | Infrastruktur Host | Host OS & App Data | **9 (Tinggi)**<br>(3 × 3) | 1. SSH hanya menerima autentikasi berbasis kunci publik (`PubkeyAuthentication yes`).<br>2. Autentikasi kata sandi dan interaktif dimatikan (`PasswordAuthentication no`, `KbdInteractiveAuthentication no`).<br>3. Root login dilarang keras (`PermitRootLogin no`).<br>4. Pembatasan pengguna eksplisit (`AllowUsers intanlucu`).<br>5. Batas percobaan autentikasi ketat (`MaxAuthTries 3`, `LoginGraceTime 30`).<br>6. Hardening OS Lynis (skor melompat dari 66 ke **80**). | Uji koneksi dari Windows via SSH: Kunci ED25519 berhasil; login password ditolak; login root ditolak. Bukti konfigurasi `sshd -T` pada `security/hardening-notes.md`. | **1 (Rendah)**<br>(1 × 1) | **MITIGATED** |
| **R07** | Penyerang melakukan eksploitasi container breakout atau modifikasi runtime | **E** (Elevation),<br>**T** (Tampering) | Infrastruktur Container | Container & Host Filesystem | **9 (Tinggi)**<br>(3 × 3) | 1. Container berjalan sebagai pengguna non-root (`nextjs` UID 1001, GID 1001).<br>2. Seluruh Linux capabilities didrop (`cap_drop: [ALL]`, verifikasi `CapEff: 0000000000000000`).<br>3. Pencegahan eskalasi privilege (`security_opt: [no-new-privileges:true]`).<br>4. Filesystem container bersifat *read-only* (`read_only: true`), dengan direktori temporer terisolasi pada `tmpfs` (`/tmp`, `/app/.next/cache`). | Eksekusi runtime: `id` -> `uid=1001`, `grep CapEff /proc/1/status` -> `0000000000000000`, `touch /app/test` -> `Read-only file system` (Ditolak). | **2 (Rendah)**<br>(1 × 2) | **MITIGATED** |
| **R08** | Kerentanan keamanan kritis pada image container atau dependensi supply chain | **I** (Info Disc),<br>**D** (DoS) | Rantai Pasok Software | Image Container | **6 (Tinggi)**<br>(2 × 3) | 1. Image berbasis `node:22-alpine` minimalis multi-stage build.<br>2. Pemindaian kerentanan Trivy sebelum dan sesudah perbaikan.<br>3. Eliminasi kerentanan hingga **0 CRITICAL** pada image akhir.<br>4. Pembuatan Software Bill of Materials (SBOM) standar CycloneDX v1.7 JSON. | File laporan Trivy: `security/image-scan-before.txt` vs `security/image-scan-after.txt` (0 CRITICAL). SBOM: `security/sbom.cdx.json` (260 komponen teridentifikasi). | **2 (Rendah)**<br>(1 × 2) | **MITIGATED** |
| **R09** | Basis data PostgreSQL diakses langsung oleh penyerang dari jaringan luar/host | **I** (Info Disc),<br>**T** (Tampering) | Basis Data Backend | PostgreSQL & User Secrets | **9 (Tinggi)**<br>(3 × 3) | 1. Port basis data (5432) **TIDAK DIBUKA / TIDAK DIPUBLIKASIKAN** ke host (`ports` ditiadakan pada service `db`).<br>2. Basis data hanya dapat diakses melalui jaringan bridge internal Docker Compose (`tugas1_default`).<br>3. Runtime database role `veylora_app` non-superuser tanpa hak DDL/role management. | Verifikasi listening socket host WSL via `ss -ltn | grep 5432` (hasil kosong, tidak ada port 5432 terbuka). Uji DDL `DB-02` dan `DB-03` ditolak. | **1 (Rendah)**<br>(1 × 1) | **MITIGATED** |

---

## 3. Analisis Risiko Residu (*Residual Risk*)

Meskipun seluruh kontrol prioritas pada Tugas 2 telah berhasil diterapkan dan memitigasi ancaman ke tingkat Rendah, berikut adalah risiko residu yang diidentifikasi untuk ditindaklanjuti pada tahapan/tugas berikutnya:

1. **Enkripsi Kredensial Vault At-Rest (Tugas 3):**
   - *Kondisi saat ini:* Kredensial dalam Vault diisolasi per akun pengguna.
   - *Risiko Residu:* Enkripsi end-to-end / envelope encryption dengan master key pengguna perlu disempurnakan pada modul berikutnya agar database administrator atau pihak dengan akses dump database tidak dapat membaca plaintext rahasia pihak ketiga.
2. **Multi-Factor Authentication (MFA):**
   - *Kondisi saat ini:* Veylora hanya memiliki 1 peran pengguna (`User`) tanpa hierarki administrator.
   - *Risiko Residu:* Jika akun pengguna memiliki kata sandi yang sangat kuat namun perangkat lokal terinfeksi malware pencuri session (infostealer), MFA berbasis TOTP akan memberikan lapisan pertahanan tambahan.
3. **Penyelarasan Kernel WSL 2:**
   - *Kondisi saat ini:* Pengujian dilakukan pada Ubuntu WSL 2 (kernel Linux Microsoft kustom), di mana modul kernel tertentu (`sysctl` network stack bridge atau auditd service) berjalan di bawah arsitektur hypervisor WSL.
   - *Mitigasi:* Seluruh rekomendasi hardening OS yang kompatibel telah dimaksimalkan hingga mencapai skor Lynis 80 (jauh melampaui ambang batas 70).

---

## 4. Kesimpulan

Seluruh kontrol keamanan Tugas 2 (Autentikasi Argon2id, Otorisasi, Least Privilege DB, Hardening SSH Key-Only, Hardening OS Lynis Index 80, Non-Root Container, Read-Only Filesystem, Drop All Capabilities, Isolasi Port Database, Zero Critical CVE Trivy, dan CycloneDX SBOM) telah terhubung secara eksplisit dengan **Risk Register Tugas 1** dan prinsip **STRIDE**. 

Sistem **Veylora** pada milestone `sec-0.2` dinyatakan memenuhi seluruh kriteria keberhasilan dengan bukti audit yang dapat direproduksi secara mandiri.

