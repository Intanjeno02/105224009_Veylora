# Veylora — Personal Security Assistant
> **Milestone 2 (v0.2) — Integrasi Logika Server dan Database Produk Web**  
> Mata Kuliah: Pengembangan Aplikasi Web (PAW) & Keamanan Komputasi dan Siber (KKS)  
> Repository: [105224009_Veylora](https://github.com/Intanjeno02/105224009_Veylora) | Tag Rilis: `v0.2`

---

## 1. Deskripsi Produk

**Veylora** adalah aplikasi asisten keamanan digital pribadi (*Personal Security Assistant*) yang dirancang untuk membantu pengguna mengamankan aktivitas digital sehari-hari. Veylora menyediakan alat bantu deteksi ancaman tautan (*URL Safety Inspector*), pengelompokan taksonomi ancaman keamanan siber (*Security Taxonomy & Category Management*), brankas penyimpanan kredensial akun terenkripsi (*Encrypted Password Vault*), serta audit skor keamanan digital.

Pada **Milestone 2 (v0.2)**, Veylora berevolusi dari prototipe antarmuka berbasis penyimpanan peramban lokal menjadi aplikasi web full-stack terintegrasi dengan arsitektur **Next.js App Router**, **Server Actions**, validasi sisi server menggunakan **Zod**, serta persistensi data relasional menggunakan **PostgreSQL** dan **Prisma ORM 7**.

---

## 2. Perkembangan Fitur: Milestone 1 (v0.1) ke Milestone 2 (v0.2)

| Aspek / Fitur | Milestone 1 (v0.1) | Milestone 2 (v0.2) |
| :--- | :--- | :--- |
| **Penyimpanan Data** | Penyimpanan sementara di peramban (`localStorage` & *mock state*). | Persistensi permanen di basis data relasional **PostgreSQL** melalui **Prisma ORM 7**. |
| **Arsitektur Pemrosesan** | Logika pemrosesan dan filter hanya terjadi di sisi klien (Client Component). | Kombinasi terpadu **Server Components** dan **Server Actions** dengan revalidasi data otomatis (`revalidatePath`). |
| **Entitas Bisnis Relasional** | Belum ada pemodelan skema basis data relasional. | 2 Entitas bisnis utama saling berelasi: `SecurityCategory` (Master) 1-ke-Banyak `UrlInspection` (Transaksi) dengan *foreign key constraint* `onDelete: Restrict`. |
| **Operasi CRUD** | Manipulasi array lokal di memori peramban. | Operasi **Create, Read, Update, Delete (CRUD)** lengkap dan persisten untuk kedua entitas melalui antarmuka web. |
| **Validasi Masukan** | Pengecekan form sederhana di sisi klien (mudah dibypass). | Validasi deklaratif dan ketat di sisi server menggunakan **Zod**, menolak masukan tidak sah dengan pesan kesalahan per-field (*field-level errors*). |
| **Rute Dinamis** | Rute statis dan simulasi dasar. | Rute dinamis App Router `/history/[id]` lengkap dengan *metadata generation*, *loading skeleton*, serta penanganan *not-found* (`notFound()`). |
| **Keamanan Autentikasi** | Menggunakan bcryptjs dasar. | Standar kriptografi modern dengan **Argon2id** (memory: 64MB, iterations: 3, parallelism: 4) serta proteksi brute-force rate limiter di basis data. |
| **Prinsip Zero-Knowledge Vault** | Data brankas lokal. | **Tetap dipertahankan di sisi klien**: Kredensial rahasia brankas tidak pernah dikirim dalam bentuk plaintext ke server atau basis data umum. |

---

## 3. Pemodelan Data & Skema Basis Data (Prisma ORM 7)

Aplikasi menggunakan dua entitas bisnis utama yang saling berelasi di PostgreSQL:

```mermaid
erDiagram
    SecurityCategory ||--o{ UrlInspection : "memiliki / mengelompokkan"
    User ||--o{ UrlInspection : "melakukan inspeksi"
    User ||--o{ Session : "memiliki sesi"

    SecurityCategory {
        Int id PK "Auto-increment"
        String name UK "Nama kategori (min 3, max 50)"
        String severity "LOW | MEDIUM | HIGH | CRITICAL"
        String description "Keterangan ancaman (opsional)"
        DateTime createdAt "Waktu pembuatan"
        DateTime updatedAt "Waktu pembaruan"
    }

    UrlInspection {
        String id PK "CUID unique identifier"
        String url "URL lengkap yang diperiksa"
        String domain "Nama domain yang diekstraksi"
        String status "Mencurigakan | Perlu Diperiksa"
        String[] reasons "Daftar alasan heuristik deteksi"
        String notes "Catatan analis / penyelidikan"
        DateTime createdAt "Waktu inspeksi"
        DateTime updatedAt "Waktu revisi catatan"
        Int categoryId FK "Relasi ke SecurityCategory (Restrict)"
        String userId FK "Relasi ke User (Cascade)"
    }
```

### Karakteristik & Integritas Relasi:
1. **Aturan `onDelete: Restrict`**: Menghapus `SecurityCategory` yang masih memiliki data anak `UrlInspection` akan **ditolak** oleh basis data demi menjaga integritas data riwayat keamanan.
2. **Atribut dan Tipe Data**: Menggunakan CUID untuk identifikasi URL yang aman dari penomoran berurutan (*enumeration attack*), serta array string PostgreSQL (`String[]`) untuk menyimpan daftar temuan aturan heuristik.

---

## 4. Alur Data End-to-End (Form → Server Action → Zod → Prisma → Database)

Setiap proses manipulasi data melalui tahapan alur yang terstandarisasi:

```mermaid
sequenceDiagram
    autonumber
    actor Pengguna as Peramban (Client)
    participant Action as Server Action (lib/actions)
    participant Session as Session Guard (lib/session)
    participant Zod as Zod Schema (lib/schemas)
    participant Prisma as Prisma ORM Client
    participant DB as PostgreSQL Database

    Pengguna->>Action: Submit Form (FormData)
    Action->>Session: verifySession()
    alt Sesi Tidak Valid
        Session-->>Pengguna: Return { success: false, message: "Sesi kedaluwarsa" }
    else Sesi Terverifikasi
        Action->>Zod: schema.safeParse(formData)
        alt Validasi Gagal
            Zod-->>Pengguna: Return { success: false, errors: fieldErrors }
        else Validasi Berhasil
            Action->>Prisma: prisma.entity.create/update/delete()
            Prisma->>DB: Eksekusi SQL Query + Constraint Check
            DB-->>Prisma: Hasil Eksekusi / Error P2003
            Action->>Action: revalidatePath()
            Action-->>Pengguna: Return { success: true, message, data }
        end
    end
```

---

## 5. Analisis Pembagian Komponen (Server vs Client Components)

Sesuai arsitektur Next.js App Router, komponen dibagi secara terencana:

| Komponen / Halaman | Tipe Komponen | Alasan Teknis Pemilihan |
| :--- | :--- | :--- |
| `app/layout.tsx` | **Server Component** | Mengelola tag root HTML, metadata global, pemuatan font Google, dan CSS global tanpa memerlukan state atau event peramban. |
| `app/(app)/layout.tsx` | **Server Component** | Melakukan verifikasi sesi secara aman di server (`verifySession()`) sebelum merender layout dalam dan meneruskan `userId` tanpa kebocoran token. |
| `app/(app)/categories/page.tsx` | **Server Component** | Mengambil langsung data seluruh kategori dan agregasi jumlah inspeksi dari PostgreSQL secara efisien di sisi server. |
| `app/(app)/categories/category-manager.tsx` | **Client Component** (`"use client"`) | Memerlukan interaktivitas formulir, modal edit inline, pending state (`useActionState`), transisi hapus (`useTransition`), serta konfirmasi jendela peramban. |
| `app/(app)/check-url/page.tsx` | **Server Component** | Mengambil data opsi kategori keamanan dari PostgreSQL untuk disuplai ke dropdown formulir secara pre-rendered. |
| `app/(app)/check-url/check-url-form.tsx` | **Client Component** (`"use client"`) | Menangani input pengguna secara interaktif, pending spinner saat analisis, menampilkan pesan kesalahan per field, dan sinkronisasi ke penyimpanan lokal. |
| `app/(app)/history/page.tsx` | **Server Component** | Menjalankan query paralel `findMany` untuk inspeksi URL dan kategori dengan relasi `include: { category: true }` langsung dari database server. |
| `app/(app)/history/history-list.tsx` | **Client Component** (`"use client"`) | Memerlukan filter pencarian instan sisi klien, pemilahan status, serta pemicu aksi Server Action hapus dengan konfirmasi dialog. |
| `app/(app)/history/[id]/page.tsx` | **Server Component** | Mengambil parameter rute dinamis secara asinkron (`await params`), mengeksekusi `findUnique`, menghasilkan metadata dinamis, serta memicu `notFound()` jika ID tidak valid. |
| `app/(app)/history/[id]/inspection-detail-view.tsx` | **Client Component** (`"use client"`) | Menyediakan formulir pengeditan catatan analis secara inline, eksekusi pembaruan relasi, dan navigasi redirect programatik (`useRouter`). |
| `app/(app)/history/[id]/loading.tsx` | **Server Component** | Memberikan umpan balik visual animasi kerangka pemuatan (*skeleton loading*) otomatis saat halaman detail sedang mengambil data. |
| `app/not-found.tsx` | **Server Component** | Halaman fallback global 404 ketika entitas atau rute tidak ditemukan di basis data. |
| `app/error.tsx` | **Client Component** (`"use client"`) | Error boundary wajib berupa Client Component menurut spesifikasi Next.js untuk menangkap runtime error dan menyediakan tombol pemulihan `reset()`. |

---

## 6. Laporan Hasil Pengujian Terverifikasi (100% PASS)

Pengujian dijalankan secara otomatis melalui script pengujian terpadu `scripts/run-paw-tests.ts` yang menguji integritas basis data dan validasi skema server secara nyata:

### A. 10 Skenario Pengujian CRUD & Relasi Data (Rubrik K1: Target $\ge 90\%$)

| No | ID | Nama Skenario & Entitas | Tujuan & Langkah Pengujian | Hasil yang Diharapkan | Hasil Aktual | Status |
| :---: | :---: | :--- | :--- | :--- | :--- | :---: |
| 1 | **S01** | **CREATE SecurityCategory** | Menambahkan kategori keamanan baru ke tabel master `SecurityCategory`. | Data baru tersimpan dengan ID auto-increment dan nilai severity valid. | Tersimpan: ID=6, Name="Test_Category_...", Severity=HIGH | **PASS** |
| 2 | **S02** | **READ SecurityCategory** | Membaca data kategori berdasarkan primary key ID yang baru dibuat. | Data kategori berhasil ditemukan dan atribut sesuai dengan data yang diinput. | Ditemukan: ID=6, Severity=HIGH | **PASS** |
| 3 | **S03** | **UPDATE SecurityCategory** | Memperbarui tingkat keparahan (*severity*) dan deskripsi kategori. | Nilai *severity* berubah menjadi `CRITICAL` dan deskripsi terbarui di database. | Berhasil diubah: Severity=CRITICAL | **PASS** |
| 4 | **S04** | **DELETE SecurityCategory** | Menghapus kategori sementara yang tidak memiliki relasi anak (*orphan*). | Data kategori berhasil dihapus permanen dari basis data. | Data ID=7 terhapus (verifikasi query bernilai null) | **PASS** |
| 5 | **S05** | **CREATE UrlInspection** | Menyimpan pemeriksaan URL baru yang terhubung ke categoryId dan userId. | Data inspeksi tersimpan dengan ID CUID dan foreign key yang valid. | Tersimpan: ID=cmw6pd9gn..., Domain="secure-login...", Status=Mencurigakan | **PASS** |
| 6 | **S06** | **READ UrlInspection** | Membaca catatan inspeksi URL berdasarkan CUID primary key. | Data inspeksi berhasil dibaca kembali dari PostgreSQL. | Ditemukan: ID=cmw6pd9gn..., URL valid | **PASS** |
| 7 | **S07** | **UPDATE UrlInspection** | Memperbarui catatan investigasi analis dan status pada inspeksi terkait. | Atribut notes dan status terbarui di basis data. | Berhasil diubah: Status=Perlu Diperiksa, Notes terbarui | **PASS** |
| 8 | **S08** | **DELETE UrlInspection** | Menghapus catatan inspeksi URL dari basis data. | Data inspeksi berhasil dihapus permanen dari PostgreSQL. | Data ID=cmw6pd9gn... terhapus (query bernilai null) | **PASS** |
| 9 | **S09** | **RELATIONAL READ (Eager Join)** | Melakukan query `urlInspection.findUnique` dengan relasi `include: { category: true }`. | Data inspeksi memuat objek entitas relasional `SecurityCategory` secara utuh. | Berhasil dimuat: Inspection -> Category="Test_Category" (Severity: CRITICAL) | **PASS** |
| 10 | **S10** | **REFERENTIAL INTEGRITY (Restrict)** | Mencoba menghapus `SecurityCategory` yang masih memiliki relasi anak `UrlInspection`. | PostgreSQL menolak penghapusan dengan error foreign key constraint (`P2003`). | Ditolak sesuai ekspektasi: Prisma error P2003 (Foreign key constraint Restrict) | **PASS** |

> **Tingkat Keberhasilan Skenario CRUD & Relasi**: **10 / 10 Lulus (100.0%)** (Memenuhi kriteria rubrik $\ge 90\%$).

---

### B. Bukti Validasi Masukan Sisi Server Menggunakan Zod (Rubrik K2: Target $\ge 3$)

| No | ID | Kasus Pengujian Input Tidak Valid | Nilai Masukan Pengujian | Pesan Kesalahan Spesifik pada Field Terkait (*Field-Level Error*) | Status |
| :---: | :---: | :--- | :--- | :--- | :---: |
| 1 | **V01** | Format URL tidak valid / bukan alamat web | `url: "bukan-sebuah-url-valid"` | **Field:** `url`<br>**Pesan:** `"Format URL tidak valid. Masukkan URL lengkap, misalnya https://example.com."` | **PASS (Ditolak)** |
| 2 | **V02** | URL memuat informasi kredensial rahasia (*inline user/pass*) | `url: "https://admin:SuperSecret123@secure-bank.example.com/login"` | **Field:** `url`<br>**Pesan:** `"URL tidak boleh berisi username atau password. Hapus informasi tersebut sebelum melanjutkan."` | **PASS (Ditolak)** |
| 3 | **V03** | Nama kategori terlalu pendek (kurang dari batas minimal 3 karakter) | `name: "Ab"` | **Field:** `name`<br>**Pesan:** `"Nama kategori minimal 3 karakter."` | **PASS (Ditolak)** |

---

## 7. Panduan Menjalankan Aplikasi Secara Lokal

### Prasyarat
- **Node.js** v20.x atau lebih baru
- **PostgreSQL 18** (berjalan pada port 5432)
- Paket manajer **npm**

### Langkah Menjalankan:
1. **Clone repository dan pasang dependency**:
   ```bash
   git clone https://github.com/Intanjeno02/105224009_Veylora.git
   cd 105224009_Veylora
   npm install
   ```

2. **Konfigurasi Environment Variables**:
   Salin `.env.example` menjadi `.env` lalu sesuaikan kredensial basis data:
   ```bash
   cp .env.example .env
   ```

3. **Jalankan Migrasi Basis Data**:
   ```bash
   npx prisma migrate deploy --config prisma7.config.ts
   npx prisma generate --config prisma7.config.ts
   ```

4. **Jalankan Seeding Data Sintetis**:
   ```bash
   npx prisma db seed --config prisma7.config.ts
   ```

5. **Jalankan Pengujian Otomatis CRUD & Validasi**:
   ```bash
   npx tsx scripts/run-paw-tests.ts
   ```

6. **Jalankan Server Pengembangan**:
   ```bash
   npm run dev
   ```
   Aplikasi dapat diakses melalui peramban di `http://localhost:3000`. Akun demo pengujian sintetis: `demouser_veylora`.


---

## 8. Implementasi Kriptografi: Enkripsi Terautentikasi (AEAD AES-256-GCM) pada Vault

Fitur **Vault** Veylora menerapkan standar kriptografi modern **Authenticated Encryption with Associated Data (AEAD)** berbasis algoritma **AES-256-GCM** untuk melindungi seluruh kata sandi akun digital pengguna di peramban:

### A. Arsitektur Kriptografi & Pengelolaan Kunci
1. **Algoritma Simetris**: AES-256 dalam mode Galois/Counter Mode (GCM).
2. **Kunci Enkripsi (256-bit)**: Diderivasi dari master password pengguna menggunakan **PBKDF2-HMAC-SHA256** dengan **600.000 iterasi** dan salt acak 128-bit CSPRNG. Objek `CryptoKey` bersifat *non-extractable* dan hanya disimpan di memori volatil komponen selama sesi brankas terbuka.
3. **Nonce / IV (96-bit)**: Dihasilkan secara independen menggunakan CSPRNG (`crypto.getRandomValues`) untuk setiap operasi enkripsi guna menjamin sifat *semantically secure* (IND-CPA) dan mencegah *nonce-reuse attack*.
4. **Authentication Tag (128-bit)**: Dihitung menggunakan perkalian Galois field $GF(2^{128})$ untuk memverifikasi keutuhan ciphertext.
5. **Associated Authenticated Data (AAD)**: Mengikat metadata akun (`accountId`, `userId`, dan `version`) secara kriptografis ke ciphertext. Memindahkan ciphertext ke entri lain (*Cut-and-Paste Attack*) akan menggagalkan dekripsi secara otomatis.
6. **Prinsip Fail-Closed**: Setiap kegagalan integritas (modifikasi ciphertext, pemalsuan tag, atau kesalahan kunci) seketika membatalkan operasi tanpa membocorkan data plaintext.

### B. Menjalankan Pengujian Otomatis Kriptografi
Untuk menjalankan 10 skenario pengujian AEAD (termasuk deteksi bit-flipping, pemalsuan tag, wrong key, context swapping, dan kompatibilitas mundur Tugas 1):
```bash
npx tsx scripts/run-crypto-tests.ts
```

| ID Pengujian | Fokus Pengujian | Status Hasil |
|:---:|:---|:---:|
| **CRYPTO-01** | Enkripsi Plaintext Valid (AEAD AES-256-GCM v2) | **PASS** |
| **CRYPTO-02** | Dekripsi Ciphertext Valid (Kesesuaian 100%) | **PASS** |
| **CRYPTO-03** | Deteksi Modifikasi Bit Ciphertext (Bit-Flipping) | **PASS (Ditolak)** |
| **CRYPTO-04** | Deteksi Pemalsuan Authentication Tag Galois MAC | **PASS (Ditolak)** |
| **CRYPTO-05** | Penolakan Kunci Salah (Wrong Key Protection) | **PASS (Ditolak)** |
| **CRYPTO-06** | Deteksi Modifikasi Nilai Nonce / IV | **PASS (Ditolak)** |
| **CRYPTO-07** | Deteksi Context Swapping AAD (Cut-and-Paste Defense) | **PASS (Ditolak)** |
| **CRYPTO-08** | Validasi Format Skema Payload Zod | **PASS (Ditolak)** |
| **CRYPTO-09** | Keunikan Nonce CSPRNG (Nonce Freshness & IND-CPA) | **PASS** |
| **CRYPTO-10** | Kompatibilitas Mundur & Integrasi Komponen Tugas 1 (v1) | **PASS** |
