# Dokumen Teknis Modul 6 — PostgreSQL dan Prisma ORM

Nama/NIM   : Intan Rhevita Arselina Suryana/105224009  
Repositori : 105224009_Veylora

> **Catatan:** dokumen ini menjelaskan implementasi yang ditemukan di kode. Hasil migrasi dan operasi database belum diuji langsung ke PostgreSQL pada pemeriksaan ini.

## 1. Rancangan Data

### Diagram entitas
+-------------------------------+
|             User              |
+-------------------------------+
| id           String  PK       |
| username     String  UNIQUE   |
| passwordHash String           |
| createdAt    DateTime         |
| updatedAt    DateTime         |
| settings     UserSettings?    |
+-------------------------------+
               | 1
               | 
               | 1
+-------------------------------+
|         UserSettings          |
+-------------------------------+
| id            String  PK      |
| displayName   String?         |
| notifications Boolean         |
| userId        String  UNIQUE  |
+-------------------------------+

tabel User dan UserSettings berelasi satu-ke-satu. Setiap pengaturan dimiliki satu user, dan satu user bisa memiliki nol atau satu pengaturan.

### Kunci dan constraint

| Kolom | Aturan | Tujuan |
|---|---|---|
| `id` | Primary key, dibuat dengan `cuid()` | Menjadi identitas unik setiap user. |
| `username` | `@unique` | Mencegah dua user memakai username yang sama. |
| `passwordHash` | Wajib diisi | Menyimpan hash kata sandi, bukan kata sandi asli. |
| `createdAt` | `@default(now())` | Mencatat waktu data dibuat. |
| `updatedAt` | `@updatedAt` | Diperbarui oleh Prisma ketika data diubah. |
| `UserSettings.userId` | Wajib diisi, unik, foreign key ke `User.id` | Memastikan satu setelan hanya dimiliki satu user. |
| `UserSettings.notifications` | `@default(false)` | Notifikasi nonaktif sebagai nilai awal. |

### Alasan aturan penghapusan

Relasi memakai `onDelete: Cascade`. Jadi, jika user dihapus, data `UserSettings` miliknya ikut terhapus. Pilihan ini cocok karena setelan tidak berguna tanpa user pemiliknya. Perilaku tersebut sudah tertulis di skema dan migrasi, tetapi belum diuji langsung ke database.

## 2. Skema dan Migrasi

### Isi `prisma/schema.prisma`

Skema yang saat ini ada:

```prisma
generator client {
  provider = "prisma-client"
  output   = "../lib/generated/prisma"
}

datasource db {
  provider = "postgresql"
}

model User {
  id           String        @id @default(cuid())
  username     String        @unique
  passwordHash String
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt

  settings     UserSettings?
}

model UserSettings {
  id            String   @id @default(cuid())
  displayName   String?
  notifications Boolean  @default(false)
  userId        String   @unique

  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

Provider database-nya PostgreSQL. URL koneksi dibaca dari `DATABASE_URL` melalui `prisma7.config.ts`, bukan ditulis langsung di file skema.

### Folder migrasi dan potongan SQL

Ada dua migrasi. `20261101142233_init_users` membuat tabel `User` dan unique index untuk username. Migrasi `20261105124047_add_user_settings` membuat tabel `UserSettings`, unique index untuk `userId`, dan foreign key dengan `ON DELETE CASCADE`.

```sql
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
```

Bagian penting migrasi kedua:

```sql
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");

ALTER TABLE "UserSettings"
ADD CONSTRAINT "UserSettings_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
```

### Hasil penerapan migrasi

File migrasi sudah tersedia dan sesuai dengan relasi di skema. Namun, status penerapannya pada PostgreSQL belum diperiksa, jadi belum bisa dipastikan migrasi berhasil dijalankan.

## 3. Seed dan Prisma Client

### Seed

Proyek ini memang tidak memakai seed. Data user dibuat saat pengguna mendaftar melalui halaman registrasi, jadi database tidak perlu diisi dengan akun tetap sebelum aplikasi digunakan. Saat registrasi, endpoint membuat data `User` sekaligus `UserSettings` melalui Prisma. Cara ini juga menghindari pembuatan akun demo atau data contoh yang tidak diperlukan di database. Migrasi tetap diperlukan untuk membuat struktur tabelnya; seed dan migrasi punya fungsi yang berbeda.

| Percobaan | Keluaran aktual |
|---|---|
| Menjalankan seed | Tidak dilakukan dan tidak diperlukan; data dibuat melalui registrasi. |

### Prisma Client

Prisma Client dibuat di `lib/prisma.ts` memakai adapter PostgreSQL (`PrismaPg`) dan koneksi `DATABASE_URL`. Client dipakai oleh endpoint register dan login.

## 4. Operasi CRUD

Prisma dipakai di `app/api/register/route.ts` dan `app/api/login/route.ts`. Registrasi memeriksa username, membuat hash password, lalu membuat `User` beserta `UserSettings`; login mencari user dan membandingkan password dengan hash.

| Operasi | Metode Prisma yang biasanya dipakai | Kondisi di proyek |
|---|---|---|
| Membuat user dan setelan | `user.create()` dengan nested `settings.create` | Ada di endpoint register. |
| Membaca user | `user.findUnique()` | Ada di endpoint register dan login. |
| Mengubah user | `user.update()` | Belum ditemukan. |
| Menghapus user | `user.delete()` | Belum ditemukan. |

Endpoint register menangani `P2002` (username duplikat) dengan status `409` dan pesan yang mudah dipahami. `P2025` belum ditangani karena operasi update/delete yang biasanya memicunya belum ditemukan.

## 5. Transaksi dan Rollback

Belum ditemukan pemanggilan `$transaction` eksplisit. Namun, pembuatan user dan setelannya dilakukan sebagai nested write dalam satu operasi Prisma, sehingga keduanya diproses bersama. Belum ada bukti uji kegagalan dan rollback terhadap database.

Transaksi berguna ketika beberapa perubahan harus berhasil bersama-sama. Untuk penghapusan user, skema saat ini memakai `Cascade`, bukan `Restrict`, sehingga setelannya ikut terhapus. Pengujian perilaku ini tetap perlu dijalankan pada database.

| Bagian yang diminta | Kondisi aktual |
|---|---|
| Penghapusan user dan setelannya (`Cascade`) | Aturannya ada di skema dan migrasi; belum diuji langsung. |
| Bukti data sebelum/sesudah rollback | Belum tersedia; belum ada pengujian rollback. |

## 6. Skenario Uji

Tabel ini membedakan pemeriksaan kode dari pengujian langsung ke database. Hasil yang belum diuji tidak dianggap lulus.

| No. | Skenario | Hasil yang diharapkan | Hasil aktual |
|---:|---|---|---|
| 1 | Memeriksa model dan provider database | Model `User` memakai PostgreSQL dan memiliki kolom yang sesuai. | **Diperiksa dari file:** provider PostgreSQL dan model `User` tersedia. |
| 2 | Memeriksa primary key dan username unik | `id` menjadi primary key dan `username` memiliki constraint unik. | **Diperiksa dari file:** `@id`, `@unique`, primary key, dan unique index tersedia. |
| 3 | Memeriksa relasi User–UserSettings | Relasi satu-ke-satu memakai foreign key dan `Cascade`. | **Diperiksa dari file:** relasi dan aturan ada di skema serta migrasi. |
| 4 | Menerapkan kedua migrasi | Tabel, index, dan foreign key terbentuk di PostgreSQL. | Belum diverifikasi di database. |
| 5 | Menjalankan seed pertama dan kedua | Data awal masuk dan tidak menjadi duplikat. | Belum bisa diuji; seed belum tersedia. |
| 6 | Registrasi dengan username baru | User dan setelan dibuat; password disimpan sebagai hash. | Alur tersedia di kode; belum diuji langsung ke database. |
| 7 | Registrasi dengan username duplikat | Ditolak dengan pesan yang jelas. | Penanganan `P2002` ada di kode; belum diuji langsung. |
| 8 | Login dengan kredensial valid/tidak valid | Password dicocokkan dengan hash dan hasil sesuai. | Alur tersedia di kode; belum diuji langsung ke database. |
| 9 | Mengubah atau menghapus user yang tidak ditemukan | Aplikasi menangani `P2025`. | Belum bisa diuji; operasi update/delete belum ditemukan. |
| 10 | Menghapus user dan menguji rollback | Setelan ikut terhapus; perubahan gagal tidak menyisakan data parsial. | Aturan `Cascade` ada di file; penghapusan dan rollback belum diuji. |

**Ringkasan:** relasi, migrasi, endpoint register/login, dan penanganan `P2002` terlihat di kode. Pengujian aktual ke PostgreSQL belum dilakukan, jadi persentase kelulusan runtime belum bisa dihitung.

## 7. Kendala dan Penyelesaian

Bagian yang masih belum tersedia adalah seed dan operasi update/delete. Migrasi, registrasi, dan login sudah ada di kode, tetapi status migrasi serta hasil alur tersebut di PostgreSQL perlu diuji langsung sebelum dinyatakan berhasil.

## 8. Catatan Pemanfaatan AI

AI membantu merangkum skema, migrasi, dan pemakaian Prisma di kode. Informasi diperiksa pada `prisma/schema.prisma`, dua file migrasi, `lib/prisma.ts`, serta endpoint register/login. Pengujian langsung ke PostgreSQL, seed, dan rollback belum diverifikasi.