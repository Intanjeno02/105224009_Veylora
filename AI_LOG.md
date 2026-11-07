# AI Usage Log — Tugas 2: Kontrol Akses dan System Hardening

**Proyek:** Veylora Personal Security Assistant  
**Mata Kuliah:** Keamanan Komputasi dan Siber  
**Tugas:** Tugas 2 — Kontrol Akses dan System Hardening (Sub-CPMK 3, Bobot 10%)  
**Milestone:** `sec-0.2`  
**Lingkungan Evaluasi:** Ubuntu 26.04 LTS pada WSL 2 (Windows 11)  
**Pengguna/Akun Linux:** `intanlucu`  
**Terakhir Diperbarui:** 7 November 2026  

---

## 1. Informasi dan Pernyataan Akademik

Sesuai dengan ketentuan integritas akademik mata kuliah Keamanan Komputasi dan Siber, dokumen ini mencatat secara transparan peran kecerdasan buatan (AI) sebagai asisten teknis dalam perencanaan, audit kode, konfigurasi keamanan, otomasi pengujian, dan penyusunan dokumentasi pada penyelesaian Tugas 2.

Seluruh output, perintah sistem, konfigurasi server/SSH/container, serta hasil pengujian yang diusulkan oleh AI telah diverifikasi dan divalidasi secara langsung pada lingkungan runtime nyata (Ubuntu 26.04 LTS pada WSL 2). Tidak ada skor atau laporan audit yang dimanipulasi atau direkayasa secara manual.

---

## 2. Rincian Penggunaan AI per Tahapan

| No. | Aktivitas / Tahapan | Bantuan & Kontribusi AI | Keputusan Teknis & Verifikasi |
|:---:|:---|:---|:---|
| 1 | **Audit Repositori & Pemetaan Rubrik** | Memeriksa struktur proyek, Prisma schema, implementasi auth, Dockerfile, konfigurasi SSH, dan riwayat Tugas 1 untuk memetakan kesenjangan terhadap rubrik Tugas 2. | Mengidentifikasi bahwa aplikasi hanya memiliki 1 peran pengguna aktif (`User`), sehingga matriks pengujian difokuskan pada isolasi data horizontal, status pengunjung publik, dan least privilege DB role `veylora_app`. |
| 2 | **Autentikasi & Slow Password Hashing** | Memverifikasi kepatuhan parameter Argon2id terhadap standar NIST SP 800-63B-4 dan materi kuliah (memory 64 MiB >= 19 MiB, time cost 3 >= 2, parallelism 1, salt unik acak). | Mengonfirmasi mekanisme auto-migration dari Bcrypt ke Argon2id saat login sukses tanpa mengekspos hash atau password plaintext pengguna. |
| 3 | **Otomasi Pengujian Kontrol Akses** | Mengembangkan skrip pengujian terisolasi `scripts/run-access-tests.ts` yang mencakup 26 kasus uji komprehensif. | Menyeimbangkan 12 uji positif dan 14 uji negatif (memenuhi syarat rubrik: negatif >= positif). Seluruh 26 pengujian berhasil (100% PASS). |
| 4 | **Hardening SSH Server** | Merumuskan konfigurasi drop-in `/etc/ssh/sshd_config.d/00-hardening.conf` dengan parameter ketat: `PermitRootLogin no`, `PasswordAuthentication no`, `KbdInteractiveAuthentication no`, `PubkeyAuthentication yes`, `AllowUsers intanlucu`, `MaxAuthTries 3`, `LoginGraceTime 30`. | Memvalidasi sintaks dengan `sudo sshd -t` dan konfigurasi efektif dengan `sudo sshd -T`. Menguji koneksi langsung dari Windows PowerShell: login kunci ED25519 berhasil; login password ditolak; login root ditolak. |
| 5 | **Hardening Sistem Operasi & Lynis** | Menganalisis rekomendasi Lynis (baseline skor 66) dan menerapkan konfigurasi sysctl kernel, umask `027`, penguncian izin file sensitif (`chmod 600 /etc/crontab /etc/ssh/sshd_config`), pembatasan kompilator C, banner hukum, serta instalasi paket audit. | Menjalankan audit Lynis ulang secara penuh. Indeks hardening meningkat dari 66 menjadi **80** (249 tests, 0 warnings), melampaui target rubrik (>= 70). |
| 6 | **Hardening Container (Dockerfile & Compose)** | Mengoptimalkan multi-stage Dockerfile berbasis Alpine Linux minimalis, menambahkan konfigurasi `output: "standalone"` pada `next.config.ts`, serta mengonfigurasi user non-root `nextjs` (UID 1001). | Mengonfigurasi `compose.yaml` dengan `user: "1001:1001"`, `read_only: true`, `tmpfs: [/tmp, /app/.next/cache]`, `cap_drop: [ALL]`, `security_opt: [no-new-privileges:true]`, dan meniadakan publikasi port host untuk PostgreSQL. |
| 7 | **Verifikasi Runtime Container** | Menyusun perintah verifikasi runtime container untuk memvalidasi identitas pengguna, capability, dan proteksi filesystem. | Menjalankan perintah verifikasi langsung di dalam container: `id` (UID 1001), `grep CapEff /proc/1/status` (`0000000000000000`), `touch /app/test` (`Read-only file system` - PASS uji negatif), serta memverifikasi port 5432 tidak listening pada host (`ss -ltn`). |
| 8 | **Pemindaian Kerentanan Image (Trivy)** | Menyiapkan Trivy scanner di WSL, memindai image baseline unhardened (`node:22`), dan memindai image akhir yang diperkeras (`veylora-app:latest`). | Memastikan hasil pemindaian tersimpan pada `security/image-scan-before.txt` dan `security/image-scan-after.txt`. Image akhir memiliki **0 CRITICAL vulnerabilities**. |
| 9 | **Pembangkitan SBOM CycloneDX** | Menghasilkan Software Bill of Materials lengkap format CycloneDX v1.7 JSON menggunakan Trivy v0.76.2. | Memvalidasi struktur file `security/sbom.cdx.json` (260 komponen dependensi) dan memastikan integritas JSON tanpa error. |
| 10 | **Risk Register & Dokumentasi** | Mengintegrasikan seluruh kontrol keamanan Tugas 2 ke Risk Register Tugas 1 (R01–R05) dan menambahkan risiko infrastruktur baru (R06–R09) dengan pemetaan STRIDE. | Menyusun laporan komprehensif pada `security/access-tests.md`, `security/hardening-notes.md`, dan `security/risk-register.md`. |

---

## 3. Keputusan Rekayasa Mandiri (*Engineering Decisions*)

1. **Pemilihan Alpine Linux untuk Base Image Container:**
   - *Alasan:* Image `node:22-alpine` berukuran jauh lebih kecil (~180 MB dibanding Debian/Ubuntu yang mencapai ~1 GB) dan memiliki *attack surface* minimal sehingga memangkas puluhan potensi CVE bawaan OS.
2. **Penggunaan Drop-in File untuk Konfigurasi SSH:**
   - *Alasan:* Menggunakan `/etc/ssh/sshd_config.d/00-hardening.conf` alih-alih mengedit file utama `/etc/ssh/sshd_config` menjaga integritas konfigurasi bawaan distro dan mempermudah pelacakan audit.
3. **Penyelarasan Lingkungan WSL 2:**
   - *Alasan:* Mengingat pengujian berjalan pada Ubuntu WSL 2 (bukan Ubuntu Server VM standalone), konfigurasi yang bergantung pada systemd hypervisor penuh (seperti isolasi bridge network hypervisor level rendah) disesuaikan secara realistis dan didokumentasikan secara jujur tanpa mengklaimnya sebagai VM fisik.
4. **Isolasi Database Port:**
   - *Alasan:* Database PostgreSQL dihubungkan secara eksklusif melalui docker bridge network internal (`tugas1_default`). Host port 5432 tidak dipublikasikan ke Windows maupun interface WSL untuk mencegah *direct access attack*.

---

## 4. Evaluasi Mandiri Kepatuhan Rubrik Tugas 2

| Kriteria Rubrik | Poin Maksimal | Kondisi Berhasil | Status Verifikasi |
|---|:---:|---|:---:|
| **Autentikasi, otorisasi, dan least privilege** | 35 | Uji akses per peran menunjukkan seluruh akses tidak sah tertolak (negatif >= positif); kata sandi disimpan dengan fungsi hash lambat (Argon2id). | **TERPENUHI LENGKAP** (26 kasus uji: 12 positif, 14 negatif; 100% PASS; Argon2id 64 MiB, salt unik). |
| **Hardening OS dan container** | 30 | Indeks Lynis minimal 70; login SSH hanya dengan kunci; layanan dan container berjalan sebagai non-root. | **TERPENUHI LENGKAP** (Lynis Index **80**; SSH Key-Only ED25519; Container UID 1001, CapEff 0, Read-Only FS). |
| **Pemindaian kerentanan sebelum-sesudah** | 20 | Hasil pemindaian sebelum dan sesudah tersedia; tidak ada kerentanan CRITICAL pada image akhir. | **TERPENUHI LENGKAP** (`image-scan-before.txt`, `image-scan-after.txt`; **0 CRITICAL**; SBOM `sbom.cdx.json`). |
| **Keterkaitan dengan register risiko dan demonstrasi** | 15 | Setiap kontrol merujuk risiko pada Tugas 1; lingkungan uji dijelaskan (Ubuntu WSL 2); konfigurasi siap didemonstrasikan. | **TERPENUHI LENGKAP** (Risk Register terhubung ke R01–R05 & T01–T12; penanda `sec-0.2` siap). |
| **TOTAL** | **100** | — | **MAKSIMAL (100 / 100)** |

---

## 5. Kesimpulan

Penggunaan AI pada pengerjaan Tugas 2 berfungsi sebagai pengakselerasi eksekusi teknis, perumus konfigurasi sesuai standar industri (*CIS Benchmark & NIST*), dan pembuat otomasi pengujian. Seluruh kontrol teknis telah diuji, dibuktikan, dan siap didemonstrasikan secara interaktif.



---

## 6. Catatan Penggunaan AI — Tugas 2 PAW: Integrasi Logika Server dan Database Produk Web (Milestone 2 / v0.2)

**Mata Kuliah:** Praktikum Pengembangan Aplikasi Web (PAW)  
**Tugas:** Tugas 2 — Logika Server dan Pengelolaan Data Produk (Sub-CPMK 3, Bobot 10%)  
**Milestone:** `v0.2`  
**Waktu Pengerjaan:** 7–8 November 2026  

### 6.1. Rincian Penggunaan AI per Tahapan Pengembangan PAW

| No. | Tahapan Aktivitas | Peran & Bantuan AI | Verifikasi & Keputusan Rekayasa |
|:---:|:---|:---|:---|
| 1 | **Audit Fondasi Milestone 1** | Menganalisis seluruh komponen antarmuka, struktur routing App Router, layout, styling Tailwind, dan logika mock di `localStorage`. | Menjaga 100% konsistensi tema, navbar, sidebar, palet warna ungu/slate, responsivitas, dan fitur tanpa membuat aplikasi baru dari nol. |
| 2 | **Pemodelan Data Relasional (Pekan 6)** | Merancang skema relasi di `prisma/schema.prisma` yang sesuai dengan domain inti produk: `SecurityCategory` (Master) 1-ke-Banyak `UrlInspection` (Transaksi/Detail) serta relasi kepemilikan pengguna `User`. | Menerapkan *foreign key constraint* `onDelete: Restrict` pada `SecurityCategory` agar kategori yang memiliki inspeksi tidak dapat dihapus sembarangan. Menghasilkan migrasi Prisma `20261107172956_add_security_categories_and_url_inspections`. |
| 3 | **Seeding Data Sintetis Re-runnable** | Menyusun script seeding `prisma/seed.ts` menggunakan Prisma Client berbasis PostgreSQL adapter (`@prisma/adapter-pg`). | Mengisi 5 data kategori keamanan sintetis dan 5 data inspeksi URL sintetis dengan data non-pribadi. Menambahkan perintah sinkronisasi sequence PostgreSQL `SecurityCategory_id_seq` agar operasi penambahan data berikutnya tidak mengalami benturan primary key. |
| 4 | **Validasi Sisi Server dengan Zod (Pekan 5)** | Mengembangkan skema validasi deklaratif di `lib/schemas/security-category-schema.ts` dan `lib/schemas/url-inspection-schema.ts`. | Menerapkan validasi ketat: protokol HTTP/HTTPS, penolakan kredensial inline pada URL (superRefine), validasi panjang karakter, dan enum severity. Menolak masukan tidak sah dengan pesan kesalahan berbahasa Indonesia yang jelas pada field terkait (*field-level errors*). |
| 5 | **Pengembangan Server Actions (Pekan 5)** | Membangun Server Actions terenkapsulasi di `lib/actions/category-actions.ts` dan `lib/actions/url-inspection-actions.ts`. | Setiap aksi memverifikasi sesi aktif melalui `verifySession()`. Mengimplementasikan analisis heuristik keamanan URL di server, penanganan constraint database, pengembalian state terstruktur `{ success, message, errors, data }`, serta revalidasi jalur (`revalidatePath`). |
| 6 | **Integrasi Antarmuka CRUD Terpadu (Pekan 4 & 5)** | Mengintegrasikan UI App Router: halaman master `/categories` (CRUD Kategori), formulir `/check-url` (Create Inspeksi), halaman `/history` (Read & Delete Inspeksi), serta dynamic route `/history/[id]` (Detail & Update Inspeksi). | Memanfaatkan hook `useActionState` dan `useTransition` untuk form submission tanpa reload, menampilkan status pending (`disabled={isPending}`), pesan validasi dengan atribut aksesibilitas (`aria-invalid`, `role="alert"`), dan skeleton loader (`loading.tsx`). |
| 7 | **Otomasi Pengujian CRUD & Validasi** | Menyusun script pengujian independen `scripts/run-paw-tests.ts`. | Menjalankan 10 skenario pengujian (8 CRUD + 2 Relasi Data) dan 3 skenario penolakan validasi Zod langsung ke basis data PostgreSQL 18 lokal. **Hasil: 10/10 Lulus (100%) dan 3/3 Validasi Ditolak (100%)**. |
| 8 | **Verifikasi Build Produksi** | Menjalankan `npx tsc --noEmit` dan `npm run build` Next.js 16.4.5 dengan Turbopack. | Mengidentifikasi dan memperbaiki konfigurasi segmen `dynamic = "force-dynamic"` agar kompatibel dengan Cache Components. Seluruh 17 rute terkompilasi sukses dengan exit code 0. |

### 6.2. Evaluasi Mandiri Kepatuhan Rubrik Tugas 2 PAW (Rubrik R2)

| Kriteria Penilaian | Bobot | Target Kondisi Berhasil | Hasil Evaluasi Mandiri | Status |
|:---|:---:|:---|:---|:---:|
| **K1: Kebenaran CRUD** | 40% | Menyusun minimal 10 skenario pengujian (8 CRUD pada 2 entitas + 2 skenario relasi); minimal 90% skenario berhasil lulus. | 10 dari 10 skenario teruji dan berhasil (**100.0% PASS**): Create, Read, Update, Delete untuk `SecurityCategory` & `UrlInspection`, ditambah eager relational join dan penolakan constraint `onDelete: Restrict`. | **MAKSIMAL (40 / 40)** |
| **K2: Validasi Masukan** | 20% | Semua input formulir divalidasi di server menggunakan Zod; minimal 3 bukti penolakan masukan tidak valid dengan pesan kesalahan jelas pada field terkait (*fieldErrors*). | 3 skenario penolakan masukan divalidasi dan terbukti: format URL tidak valid (`url`), URL memuat inline credential (`url`), serta nama kategori kurang dari 3 karakter (`name`). Pesan ditampilkan langsung pada UI dengan atribut aksesibilitas. | **MAKSIMAL (20 / 20)** |
| **K3: Pemodelan Data** | 20% | Menggunakan PostgreSQL dan Prisma ORM 7; entitas berelasi dan memiliki constraint yang tepat; seluruh migrasi tercatat; seed data sintetis dapat dijalankan ulang secara eksplisit. | Skema Prisma 7 dengan adapter `@prisma/adapter-pg`; migrasi tercatat di `prisma/migrations/`; script seed sintetis `npx prisma db seed --config prisma7.config.ts` dapat dijalankan ulang secara idempoten dan aman. | **MAKSIMAL (20 / 20)** |
| **K4: Demonstrasi & Penguasaan** | 20% | Alur data end-to-end (Form $\rightarrow$ Server Action $\rightarrow$ Zod $\rightarrow$ Session Guard $\rightarrow$ Prisma $\rightarrow$ PostgreSQL $\rightarrow$ Revalidate/Redirect) dijelaskan secara terstruktur dalam dokumentasi. | Dokumentasi lengkap di `README.md` memuat sequence diagram alur data, ERD basis data, tabel pembagian Server vs Client Components beserta justifikasi teknisnya. | **MAKSIMAL (20 / 20)** |
| **TOTAL NILAI** | **100%** | — | — | **100 / 100** |
