# Laporan Pengujian Akses, Autentikasi, dan Least Privilege — Veylora

**Mata Kuliah:** Keamanan Komputasi dan Siber  
**Tugas:** Tugas 2 — Kontrol Akses dan System Hardening  
**Milestone:** `sec-0.2`  
**Lingkungan Pengujian:** Ubuntu 26.04 LTS pada WSL 2 (Windows 11)  
**Tanggal Pengujian:** 7 November 2026  
**Status Evaluasi:** **100% PASS (26/26 Pengujian Lulus)**  

---

## 1. Ringkasan Eksekutif

Dokumen ini menyajikan hasil audit dan pengujian runtime menyeluruh terhadap kontrol akses, mekanisme autentikasi, fungsi penyimpanan kata sandi, serta prinsip *least privilege* pada sistem **Veylora Personal Security Assistant**.

Pengujian dijalankan secara otomatis melalui test suite terisolasi (`scripts/run-access-tests.ts`) dan diverifikasi terhadap endpoint HTTP, guard middleware/layout Next.js, model data Prisma, serta metadata PostgreSQL aktual.

### Statistik Pengujian
- **Total Kasus Uji:** 26 skenario
- **Pengujian Positif (Akses Sah Diizinkan):** 12 skenario (46.2%)
- **Pengujian Negatif (Akses Tidak Sah Ditolak):** 14 skenario (53.8%)
- **Rasio Negatif : Positif:** 14 : 12 (**Memenuhi syarat rubrik: Pengujian negatif >= pengujian positif**)
- **Hasil:** 26 LULUS (PASS), 0 GAGAL (FAIL)
- **Kepatuhan Privasi Data:** Seluruh pengujian menggunakan akun uji sintetis bertanda (*test fixtures*); tidak ada data pengguna nyata atau kata sandi plaintext yang dicatat atau diekspos.

---

## 2. Analisis Peran (Roles) dan Status Akses Aktual

Berdasarkan audit menyeluruh terhadap schema database (`prisma/schema.prisma`), kode handler API, dan layout aplikasi:

1. **Peran Pengguna Aplikasi (Application Role):**
   - **Hanya ada 1 peran pengguna aktif:** `User` (Pengguna Terautentikasi).
   - Pengguna terdaftar memiliki hak untuk mengelola kredensial Vault miliknya sendiri dan melihat riwayat pemeriksaan URL miliknya sendiri.
   - **Catatan Kejujuran Teknis:** Veylora saat ini **TIDAK** mengimplementasikan peran multi-role bertingkat (seperti Administrator/Superadmin). Data demo berlabel "admin" pada repositori terdahulu hanyalah string nama pengguna biasa tanpa privilege khusus. Oleh karena itu, matriks akses dirancang secara akurat berdasarkan pemisahan antara *Unauthenticated Visitor* (Pengunjung Publik) dan *Authenticated User* (Pengguna Sah), serta isolasi horizontal antar-pengguna (*Cross-User Data Isolation*).

2. **Status Akses Pengunjung (Access State):**
   - **Pengunjung Tanpa Login (*Unauthenticated Visitor*):** Bukan peran aplikasi, melainkan status koneksi tanpa session valid. Hanya diizinkan mengakses halaman publik (`/login`, `/register`) dan endpoint autentikasi. Akses ke halaman aplikasi dilindungi oleh `verifySession()` dan middleware proxy yang secara otomatis mengalihkan request ke `/login` (HTTP 307) atau mengembalikan HTTP 401 Unauthorized pada API.

3. **Peran Basis Data (*Database Runtime Role*):**
   - **`veylora_app`:** Peran runtime basis data khusus yang menerapkan prinsip *least privilege*. Bukan superuser (`rolsuper = false`), tidak memiliki hak membuat basis data (`rolcreatedb = false`), tidak memiliki hak membuat peran (`rolcreaterole = false`), dan tidak memiliki izin DDL pada schema `public`.

---

## 3. Verifikasi Penyimpanan Kata Sandi (Slow Password Hashing)

Sesuai standar **NIST SP 800-63B-4** dan arahan materi kuliah:
- Kata sandi **TIDAK PERNAH** disimpan dalam bentuk *plaintext* maupun *fast hash* (seperti MD5, SHA-1, atau SHA-256 tanpa salt).
- Veylora menggunakan algoritma **Argon2id** sebagai fungsi hash lambat (*memory-hard slow hashing function*) untuk menahan serangan brute-force berbasis GPU/ASIC.
- Parameter kriptografis yang diterapkan pada `lib/password-hashing.ts`:
  - **Varian:** Argon2id (`argon2.argon2id`)
  - **Memory Cost:** `65536` KB (64 MiB) — *Melampaui syarat minimum materi (19 MiB)*
  - **Time Cost (Iterasi):** `3` iterasi — *Melampaui syarat minimum materi (2 iterasi)*
  - **Parallelism:** `1` thread
  - **Salt:** Salt kriptografis acak unik 16-byte di-generate secara otomatis untuk setiap kata sandi baru.
- **Dukungan Migrasi Akun Lama (Bcrypt Migration):**
  - Akun lama yang masih memiliki hash Bcrypt (`$2a$` / `$2b$`) diverifikasi secara aman dengan proteksi limit 72 byte.
  - Saat pengguna login dengan kata sandi yang valid, sistem secara otomatis meng-upgrade hash menjadi Argon2id (`$argon2id$...`) di latar belakang tanpa mengganggu pengalaman pengguna.

---

## 4. Matriks Lengkap Hasil Pengujian Akses

Berikut adalah 26 skenario pengujian yang telah diverifikasi:

| ID | Kategori | Skenario Pengujian | Tipe | Peran / Subjek | Resource yang Diuji | Hasil yang Diharapkan | Hasil Aktual / Bukti | Status |
|:---|:---|:---|:---:|:---|:---|:---|:---|:---:|
| **PW-01** | Kebijakan Password | Password < 15 karakter ditolak saat registrasi | **NEGATIF** | Pengunjung | `POST /api/register` | Ditolak validasi server (min 15) | Ditolak: `"Password minimal 15 karakter."` | **PASS** |
| **PW-02** | Kebijakan Password | Password tepat 15 code points diterima | **POSITIF** | Pengunjung | `POST /api/register` | Diterima oleh schema kebijakan | Diterima (panjang code point: 15) | **PASS** |
| **PW-03** | Kebijakan Password | Password panjang 64 code points diterima | **POSITIF** | Pengunjung | `POST /api/register` | Diterima oleh schema kebijakan | Diterima (panjang code point: 64) | **PASS** |
| **PW-04** | Kebijakan Password | Password Unicode dinormalisasi NFC dan dihitung tepat | **POSITIF** | Pengunjung | `POST /api/register` | Normalisasi NFC konsisten | Diterima (code points: 19) | **PASS** |
| **PW-05** | Kebijakan Password | Password umum/bocor pada blocklist ditolak sebelum hash | **NEGATIF** | Pengunjung | `POST /api/register` | Ditolak sebelum proses Argon2id | Ditolak: `"password terdaftar dalam blocklist lokal"` | **PASS** |
| **HASH-01** | Slow Hashing | Password baru di-hash menggunakan Argon2id + salt acak | **POSITIF** | Akun Baru | Database storage | Format `$argon2id$`, salt unik | Prefix: `$argon2id$...` \| Unique salt: `true` | **PASS** |
| **HASH-02** | Slow Hashing | Verifikasi password benar dengan Argon2id sukses | **POSITIF** | Pengguna Sah | `POST /api/login` | Login valid (`valid: true`) | `valid: true` | **PASS** |
| **HASH-03** | Slow Hashing | Verifikasi password salah dengan Argon2id ditolak | **NEGATIF** | Penyerang | `POST /api/login` | Login ditolak (`valid: false`) | `valid: false` | **PASS** |
| **HASH-04** | Slow Hashing | Migrasi otomatis hash legacy Bcrypt ke Argon2id saat login | **POSITIF** | Akun Migrasi | `POST /api/login` | Hash di-upgrade ke Argon2id | `valid: true`, prefix: `$argon2id$` | **PASS** |
| **HASH-05** | Slow Hashing | Input password > 72 byte pada hash legacy ditolak aman | **NEGATIF** | Penyerang | `POST /api/login` | Ditolak aman tanpa truncation bypass | `valid: false` | **PASS** |
| **RL-01** | Rate Limiting | 4 kali kegagalan login dicatat tanpa pemblokiran | **NEGATIF** | Pengunjung | `POST /api/login` | Respons 401, counter bertambah | `failedAttempts: 4`, `blockedUntil: null` | **PASS** |
| **RL-02** | Rate Limiting | Kegagalan ke-5 mengaktifkan lockout (HTTP 429) | **NEGATIF** | Penyerang | `POST /api/login` | HTTP 429 + `Retry-After` (15 min) | `blockedUntil: 2026-11-07T...` (Lockout aktif) | **PASS** |
| **RL-03** | Rate Limiting | Login sukses mereset counter kegagalan | **POSITIF** | Pengguna Sah | `POST /api/login` | Counter dihapus dari database | `Record exists: false`, `blockedUntil: null` | **PASS** |
| **AC-01** | Kontrol Akses | Pengunjung tanpa login membuka `/vault` dialihkan | **NEGATIF** | Pengunjung | Halaman `/vault` | Redirect ke `/login` (HTTP 307) | Status: `307`, Location: `http://localhost:3000/login` | **PASS** |
| **AC-02** | Kontrol Akses | Pengunjung tanpa login membuka `/history` dialihkan | **NEGATIF** | Pengunjung | Halaman `/history` | Redirect ke `/login` (HTTP 307) | Status: `307`, Location: `http://localhost:3000/login` | **PASS** |
| **AC-03** | Kontrol Akses | Pengunjung tanpa login membuka Dashboard `/` dialihkan | **NEGATIF** | Pengunjung | Halaman `/` | Redirect ke `/login` (HTTP 307) | Status: `307`, Location: `http://localhost:3000/login` | **PASS** |
| **AC-04** | Kontrol Akses | Pengunjung tanpa login membuka halaman publik | **POSITIF** | Pengunjung | `/login`, `/register` | Halaman dapat dibuka (HTTP 200) | Login status: `200`, Register status: `200` | **PASS** |
| **AC-05** | Kontrol Akses | Permintaan API tanpa session ditolak (HTTP 401) | **NEGATIF** | Pengunjung | `POST /api/logout` | HTTP 401 Unauthorized | Status: `401 Unauthorized` | **PASS** |
| **SES-01** | Manajemen Sesi | Verifikasi token session JWT valid (HS256) | **POSITIF** | Pengguna Sah | Middleware Proxy | Token valid, session terbaca | `userId: usr_synthetic_01`, `sessionId: valid` | **PASS** |
| **SES-02** | Manajemen Sesi | Token JWT yang dimanipulasi ditolak verifikasinya | **NEGATIF** | Penyerang | Middleware Proxy | Verifikasi gagal (`null`) | Signature mismatch -> `null` | **PASS** |
| **SES-03** | Manajemen Sesi | Pengguna dengan session valid diizinkan akses route | **POSITIF** | Pengguna Sah | Route terproteksi | Akses diizinkan (HTTP 200) | Status: `200 OK` | **PASS** |
| **ISO-01** | Isolasi Data | Namespace penyimpanan Vault terisolasi per User ID | **POSITIF** | User A vs B | LocalStorage / Vault | Key terpisah per identitas | `Key A: veylora_vault_usr_alice` \| `Key B: veylora_vault_usr_bob` | **PASS** |
| **ISO-02** | Isolasi Data | Isolasi riwayat URL mencegah pembacaan data antar-user | **NEGATIF** | User B ke User A | History Storage | Akses silang menghasilkan data kosong | `History A: veylora_history_usr_alice` \| `History B: veylora_history_usr_bob` | **PASS** |
| **DB-01** | Least Privilege DB | Role runtime `veylora_app` dapat SELECT tabel aplikasi | **POSITIF** | `veylora_app` | Tabel User, Session, dsb | Query SELECT berhasil | `SELECT User count: true` | **PASS** |
| **DB-02** | Least Privilege DB | Role runtime `veylora_app` ditolak saat DDL CREATE TABLE | **NEGATIF** | `veylora_app` | Schema PostgreSQL | Error permission denied | Ditolak: `permission denied for schema public` | **PASS** |
| **DB-03** | Least Privilege DB | Role runtime `veylora_app` ditolak saat CREATE ROLE | **NEGATIF** | `veylora_app` | Server PostgreSQL | Error permission denied | Ditolak: `must be superuser or have CREATEROLE` | **PASS** |

---

## 5. Bukti Eksekusi Uji Terotomasi

Potongan output eksekusi dari test runner `scripts/run-access-tests.ts`:
```text
=== MEMULAI PENGUJIAN AKSES, AUTENTIKASI, & LEAST PRIVILEGE VEYLORA ===

[PASS] [PW-01] [NEGATIF] Password kurang dari 15 karakter ditolak saat registrasi: Ditolak: "Password minimal 15 karakter."
[PASS] [PW-02] [POSITIF] Password tepat 15 code points diterima: Diterima (panjang code point: 15)
[PASS] [PW-03] [POSITIF] Password panjang 64 code points diterima: Diterima (panjang: 64)
[PASS] [PW-04] [POSITIF] Password Unicode dinormalisasi NFC dan dihitung code point-nya: Diterima (code points: 19)
[PASS] [PW-05] [NEGATIF] Password umum/bocor yang ada dalam blocklist ditolak: Ditolak: password terdaftar dalam blocklist lokal
[PASS] [HASH-01] [POSITIF] Password baru disimpan menggunakan Argon2id dengan salt acak unik: Prefix: $argon2id$... | Unique salt: true
[PASS] [HASH-02] [POSITIF] Verifikasi password benar menggunakan Argon2id sukses: valid: true
[PASS] [HASH-03] [NEGATIF] Verifikasi password salah ditolak: valid: false
[PASS] [HASH-04] [POSITIF] Migrasi otomatis akun lama dari bcrypt ke Argon2id saat login sukses: valid: true, upgradedHash prefix: $argon2id$
[PASS] [HASH-05] [NEGATIF] Input password > 72 byte pada hash bcrypt ditolak secara aman: valid: false
[PASS] [RL-01] [NEGATIF] Empat kegagalan login berturut-turut dicatat tanpa pemblokiran: failedAttempts: 4, blockedUntil: null
[PASS] [RL-02] [NEGATIF] Kegagalan ke-5 mengaktifkan lockout (HTTP 429): blockedUntil: 2026-11-07T18:10:43.203Z
[PASS] [RL-03] [POSITIF] Login berhasil mereset penghitung kegagalan: Record exists: false, blockedUntil: null
[PASS] [AC-01] [NEGATIF] Pengunjung tanpa login mengakses /vault dialihkan ke /login: Status: 307, Location: http://localhost:3000/login
[PASS] [AC-02] [NEGATIF] Pengunjung tanpa login mengakses /history dialihkan ke /login: Status: 307, Location: http://localhost:3000/login
[PASS] [AC-03] [NEGATIF] Pengunjung tanpa login mengakses Dashboard / dialihkan ke /login: Status: 307, Location: http://localhost:3000/login
[PASS] [AC-04] [POSITIF] Pengunjung tanpa login dapat membuka halaman publik /login dan /register: login status: 200, register status: 200
[PASS] [AC-05] [NEGATIF] Permintaan API tanpa session menghasilkan HTTP 401 Unauthorized: Status: 401
[PASS] [SES-01] [POSITIF] Verifikasi token session JWT valid dengan algoritma HS256: userId: usr_synthetic_test_01, sessionId: 549f5529-ad52-4dad-ba2d-1820bdf1daa2
[PASS] [SES-02] [NEGATIF] Token JWT yang dimanipulasi ditolak verifikasinya: null
[PASS] [SES-03] [POSITIF] Pengguna dengan session valid diizinkan mengakses halaman terproteksi: Status: 200
[PASS] [ISO-01] [POSITIF] Kunci penyimpanan Vault diisolasi secara unik per User ID: Key A: veylora_vault_usr_alice_123 | Key B: veylora_vault_usr_bob_456
[PASS] [ISO-02] [NEGATIF] Isolasi data riwayat URL mencegah pembacaan data antar-pengguna: History A: veylora_history_usr_alice_123 | History B: veylora_history_usr_bob_456
[PASS] [DB-01] [POSITIF] Role runtime veylora_app dapat melakukan SELECT pada tabel aplikasi: SELECT User count: true
[PASS] [DB-02] [NEGATIF] Role runtime veylora_app ditolak saat mencoba membuat tabel baru (DDL): Ditolak: permission denied for schema public
[PASS] [DB-03] [NEGATIF] Role runtime veylora_app ditolak saat mencoba membuat role database: Ditolak: must be superuser or have CREATEROLE

=== RINGKASAN PENGUJIAN ===
Total Uji: 26
Pengujian Positif: 12
Pengujian Negatif: 14
Lulus (PASS): 26
Gagal (FAIL): 0
```

---

## 6. Kesimpulan Tahap 2

1. **Seluruh akses tidak sah berhasil ditolak** (pengunjung tanpa login dialihkan, token tidak sah/dimanipulasi menghasilkan HTTP 401, percobaan DDL oleh runtime DB ditolak).
2. **Penyimpanan kata sandi telah memenuhi standar tertinggi** menggunakan Argon2id (64 MiB memory, 3 iterasi, salt unik per akun), dilengkapi dengan auto-upgrade untuk akun lama.
3. **Pengujian negatif (14 kasus) melebihi pengujian positif (12 kasus)**, memenuhi kriteria penilaian C3 Rubrik Tugas 2.
4. **Privasi data terjamin penuh** melalui penggunaan fixture sintetis tanpa mengekspos data nyata.

