# Dokumen Teknis Modul 7 — Debugging dan Telaah Kode

Nama/NIM   : Intan Rhevita Arselina Suryana / 105224009
Repositori : 105224009_Veylora
Branch     : `praktikum-pemweb`  
Hash Awal  : `1f5b9868502f73c21a05e01aa3c9d425acccaa9f` (Baseline branch `praktikum-pemweb`)  

---

## 1. Pemeriksaan Awal Proyek & Lingkungan

Sebelum melakukan perbaikan kode, audit komprehensif dilakukan terhadap lingkungan pengembangan, versi dependensi, struktur repositori, konfigurasi debugger, dan tata kelola runtime Next.js 16.

### A. Tabel Versi Komponen Lingkungan
| Komponen / Pustaka | Versi Terdeteksi | Catatan Arsitektur & Kompatibilitas |
|---|---|---|
| **Node.js** | `v26.7.0` | Runtime JavaScript server-side dengan dukungan native ECMAScript Modules dan inspector protocol. |
| **Next.js** | `16.4.5` (cli) / `16.4.0` | App Router, Partial Prerendering (PPR) aktif, Turbopack default engine, Server Components. |
| **React / React DOM** | `19.3.0` | React Modern dengan dukungan React Compiler dan Server Components. |
| **Prisma ORM** | `^7.10.1` | Prisma v7 dengan SQL driver adapter `@prisma/adapter-pg` (PostgreSQL). |
| **Zod** | `^4.6.7` | Zod v4 Classic/Mini dengan dukungan native codec `z.stringbool()` dan coercion. |
| **PostgreSQL Driver** | `pg 8.23.1` | Native node-postgres connection pool. |
| **Git Branch** | `praktikum-pemweb` | Branch resmi penugasan Praktikum Pemweb. |
| **Hash Commit Awal** | `1f5b986` | Titik tolak (baseline) pengerjaan Modul 7 pada branch `praktikum-pemweb`. |

### B. Struktur Direktori Proyek
C:\PEMWEB\tugas1
├── .vscode/
│   └── launch.json                  # Konfigurasi VS Code Debugger (Node inspect & client)
├── app/
│   ├── (app)/                       # Route group terproteksi sesi autentikasi
│   │   ├── layout.tsx               # AppLayout pembungkus sesi dan UserIdProvider
│   │   ├── page.tsx                 # Dashboard utama Veylora
│   │   ├── categories/              # CRUD Master Data Kategori Keamanan
│   │   ├── check-url/               # Pemeriksaan keamanan tautan URL
│   │   ├── history/                 # Daftar riwayat inspeksi & relasi kategori
│   │   │   └── [id]/                # Detail inspeksi dinamis & edit catatan
│   │   ├── settings/                # Preferensi pengguna & notifikasi
│   │   ├── uji-dynamic-route/       # Pengujian routing segmen dinamis
│   │   └── vault/                   # Brankas kredensial terenkripsi AES-256-GCM
│   ├── api/                         # Route Handlers (login, logout, register)
│   ├── error.tsx                    # Global Error Boundary Client Component
│   ├── layout.tsx                   # Root layout dokumen HTML
│   └── not-found.tsx                # Halaman 404 Not Found
├── components/                      # Reusable UI Components
├── docs/praktikum/modul-07/         # Direktori bukti screenshot praktikum
├── lib/                             # Core Business Logic & Helpers
│   ├── actions/                     # Server Actions (category-actions, url-inspection-actions)
│   ├── schemas/                     # Skema validasi Zod
│   ├── generated/prisma/            # Output Prisma Client v7
│   ├── prisma.ts                    # Prisma Client runtime instance
│   ├── session.ts                   # Manajemen JWT session & cookie HttpOnly
│   └── vault-crypto.ts              # Kriptografi WebCrypto AES-256-GCM
└── scripts/                         # Script otomasi pengujian CLI

## 2. Konfigurasi Debugger

### A. Analisis Konfigurasi Awal
File konfigurasi `.vscode/launch.json` awal memiliki tiga profil debugging:
1. `Next.js: debug server-side`: Menggunakan `node-terminal` dengan perintah `npm run dev -- --inspect`.
2. `Next.js: debug client-side`: Menggunakan target Chrome debugger ke `http://localhost:3000`.
3. `Next.js: debug full stack`: Menjalankan binary `node_modules/next/dist/bin/next` langsung via launcher Node.js dengan flag `--inspect`.

### B. Penyesuaian untuk Next.js 16 & Node.js 26
Untuk memastikan debugger Node inspector dapat mengikat breakpoint pada Server Component tanpa konflik port dan kompatibel dengan arsitektur Turbopack di Windows, `.vscode/launch.json` diperbarui secara eksplisit dengan binding port `9229` dan argumen CLI `"dev"` yang terdefinisi rapi:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm run dev -- --inspect=9229"
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    },
    {
      "name": "Next.js: debug full stack",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/next/dist/bin/next",
      "args": ["dev"],
      "runtimeArgs": ["--inspect=9229"],
      "skipFiles": ["<node_internals>/**"],
      "serverReadyAction": {
        "action": "debugWithChrome",
        "killOnServerStop": true,
        "pattern": "- Local:.+(https?://.+)",
        "uriFormat": "%s",
        "webRoot": "${workspaceFolder}"
      }
    }
  ]
}
```

### C. Pembuktian Debugger Berhenti di Server Component
Breakpoint dipasang pada Server Component `HistoryPage` di file [app/(app)/history/page.tsx](file:///c:/PEMWEB/tugas1/app/(app)/history/page.tsx#L11):

```tsx
// Breakpoint dipasang pada baris 11
export default async function HistoryPage() {
  const [inspections, categories] = await Promise.all([
    prisma.urlInspection.findMany({ ... }),
    prisma.securityCategory.findMany({ ... }),
  ]);
  // ...
}
```

Saat pengguna dengan sesi aktif membuka rute `http://localhost:3000/history`, eksekusi runtime Node.js berhenti seketika di baris 11 sebelum query database dijalankan. Debugger menampilkan context inspection lengkap:
- **Scope Variables**: Objek lokal Server Component, koneksi Prisma, dan context request.
- **Call Stack**: Menunjukkan alur eksekusi internal `HistoryPage -> renderServerComponent -> resolveServerActions`.

Bukti tangkapan layar debugger yang berhenti pada Server Component:  
![Debugger Berhenti di Server Component](docs/praktikum/modul-07/debugger-server-component.png)

---

## 3. Identifikasi, Analisis, dan Perbaikan Tiga Galat

### Ringkasan Tiga Galat Teridentifikasi
| ID Galat | Lokasi Berkas & Baris | Lapisan | Gejala Utama |
|---|---|---|---|
| **Galat 01** | `app/(app)/page.tsx:32, 90-96, 500-510` | Frontend UI / Cross-Feature Data Synchronization | Desinkronisasi data riwayat pemindaian URL: Dashboard menggunakan array statis `EMPTY_URLS = []` sehingga daftar inspeksi selalu kosong dan kartu *"URL Mencurigakan"* statis di angka 0. |
| **Galat 02** | `app/(app)/vault/page.tsx` & `lib/use-local-storage-value.ts` | Frontend / React Lifecycle & State | Penanganan anti-pattern pemanggilan `setState` sinkron di dalam `useEffect` saat membaca browser storage; diselesaikan secara reaktif melalui pola `useSyncExternalStore`. |
| **Galat 03** | `app/(app)/page.tsx` & `app/error.tsx` | UI Error Handling & Resilience | Tombol uji error pengujian terekspos di Dashboard produksi dan melempar unhandled exception; handler `error.tsx` awalnya tidak memiliki navigasi pemulihan. |

---

### Galat 01: Desinkronisasi Data Riwayat Pemindaian URL pada Komponen Dashboard (`app/(app)/page.tsx`)

#### 1. Lokasi dan Gejala
- **Lokasi**: [app/(app)/page.tsx](file:///c:/PEMWEB/tugas1/app/(app)/page.tsx#L32) baris 32, baris 90-96, dan baris 500-510.
- **Gejala**: Ketika pengguna melakukan pemeriksaan keamanan URL pada halaman `/check-url` (misalnya tautan mencurigakan `https://login-verify-account.com`), riwayat pemeriksaan berhasil tersimpan ke penyimpanan browser (`localStorage: veylora-url-history`) dan tampil pada halaman `/history`. Namun, ketika pengguna kembali ke halaman Beranda/Dashboard utama (`/`), tabel *"Riwayat Pemindaian Tautan URL"* selalu menampilkan status kosong *"Tidak ada riwayat pemindaian URL ditemukan"*, serta kartu ringkasan *"URL Mencurigakan"* selalu menampilkan angka statis `0 Terdeteksi Phishing`.

#### 2. Lapisan
- **Lapisan**: Frontend UI / State Management & Cross-Page Data Synchronization Layer (`app/(app)/page.tsx`).

#### 3. Akar Penyebab
Komponen Dashboard masih menggunakan array statis kosong `EMPTY_URLS = []` yang disertai catatan pengembang sisa pengembangan: `// Riwayat URL akan kosong sampai fitur pemindaian benar-benar menyimpan hasil.`. Komponen tidak memanggil fungsi pembacaan data `getScanHistory()` yang sudah tersedia di [lib/history-storage.ts](file:///c:/PEMWEB/tugas1/lib/history-storage.ts), serta tidak mendaftarkan pendengar event kustom `veylora:storage-change`. Akibatnya, pembaruan data yang terjadi di halaman Cek URL tidak pernah tersinkronkan ke komponen antarmuka Dashboard.

#### 4. Langkah Reproduksi
1. Jalankan aplikasi web: `npm run dev`.
2. Buka peramban pada alamat `http://localhost:3000/check-url`.
3. Masukkan URL mencurigakan (misalnya `https://login-verify-account.com`), lalu klik *"Periksa URL"*.
4. Pastikan hasil analisis muncul dan tercatat pada `http://localhost:3000/history`.
5. Buka kembali Dashboard utama `http://localhost:3000/` dan periksa kartu *"URL Mencurigakan"* dan tabel *"Riwayat Pemindaian Tautan URL"*.
6. Amati gejala: Kartu statistik tetap menampilkan `0` dan tabel riwayat pemindaian tetap bertuliskan *"Tidak ada riwayat pemindaian URL ditemukan"*.

#### 5. Bukti Sebelum Perbaikan (Screenshot Before)
![Bukti Galat 01 Sebelum Perbaikan](docs/praktikum/modul-07/galat-01-before.png)

#### 6. Solusi dan Potongan Kode Perbaikan
1. Mengimpor fungsi utilitas `getScanHistory` dan tipe `ScanHistory` dari `@/lib/history-storage`.
2. Membuat fungsi pembantu `mapScanHistoryToDashboard(item: ScanHistory)` untuk mengekstrak hostname domain, status klasifikasi, badge warna, dan waktu inspeksi.
3. Mengganti variabel statis `EMPTY_URLS` dengan state reaktif `urls`, yang dimuat pada siklus awal `loadDashboardData()` dan disinkronkan melalui event listener `"storage"`, `"focus"`, dan `"veylora:storage-change"`.
4. Menghubungkan counter kartu statistik *"URL Mencurigakan"* ke ekspresi dinamis `urls.filter((item) => item.status === "Mencurigakan").length`.

Potongan kode [app/(app)/page.tsx](file:///c:/PEMWEB/tugas1/app/(app)/page.tsx):
```tsx
// SESUDAH PERBAIKAN:
import { getScanHistory, type ScanHistory } from "@/lib/history-storage";

function mapScanHistoryToDashboard(item: ScanHistory): DashboardUrl {
  let domain = item.url;
  try {
    domain = new URL(item.url).hostname;
  } catch {
    domain = item.url;
  }
  const isSuspicious = item.status === "Mencurigakan";
  return {
    id: item.id,
    url: item.url,
    domain,
    status: item.status,
    description: isSuspicious ? "Indikator risiko terdeteksi" : "Lolos pemeriksaan dasar",
    time: item.checkedAt ? new Date(item.checkedAt).toLocaleDateString("id-ID") : "Baru saja",
    badgeColor: isSuspicious
      ? "bg-rose-50 text-rose-800 border-rose-200"
      : "bg-purple-50 text-purple-800 border-purple-200",
  };
}

// Di dalam DashboardPage:
const [urls, setUrls] = useState<DashboardUrl[]>([]);

useEffect(() => {
  const loadDashboardData = () => {
    // Membaca akun dan riwayat pemindaian
    try {
      const scanHistory = getScanHistory();
      setUrls(scanHistory.map(mapScanHistoryToDashboard));
    } catch {
      setUrls([]);
    }
  };

  loadDashboardData();
  window.addEventListener("storage", loadDashboardData);
  window.addEventListener("focus", loadDashboardData);
  window.addEventListener("veylora:storage-change", loadDashboardData);
  return () => {
    window.removeEventListener("storage", loadDashboardData);
    window.removeEventListener("focus", loadDashboardData);
    window.removeEventListener("veylora:storage-change", loadDashboardData);
  };
}, []);

const suspiciousCount = urls.filter((item) => item.status === "Mencurigakan").length;
```

#### 7. Bukti Sesudah Perbaikan (Screenshot After)
Setelah perbaikan diterapkan, Dashboard langsung menampilkan daftar URL hasil pemindaian secara dinamis lengkap dengan nama domain, waktu pemeriksaan, label warna status, dan total counter URL mencurigakan bertambah secara otomatis:  
![Bukti Galat 01 Sesudah Perbaikan](docs/praktikum/modul-07/galat-01-after.png)

---

### Galat 02: Siklus Render Kaskade Akibat Pemanggilan `setState` Sinkron di dalam `useEffect` (`app/(app)/vault/page.tsx` & `lib/use-local-storage-value.ts`)

#### 1. Lokasi dan Gejala
- **Lokasi**: [app/(app)/vault/page.tsx](file:///c:/PEMWEB/tugas1/app/(app)/vault/page.tsx#L28-L35) dan [lib/use-local-storage-value.ts](file:///c:/PEMWEB/tugas1/lib/use-local-storage-value.ts).
- **Gejala**: Menjalankan pemeriksaan kode statis dengan aturan React Compiler / Hooks menghasilkan peringatan galat:
  ```text
  C:\PEMWEB\tugas1\app\(app)\vault\page.tsx
     error  Error: Calling setState synchronously within an effect can trigger cascading renders  react-hooks/set-state-in-effect
  ```
  Pada sisi browser, pola ini memicu inisialisasi state ganda: komponen melakukan mount dengan state kosong, lalu `useEffect` segera memanggil `setAccounts(getAccounts())` yang memaksa React melakukan pass re-render kedua secara seketika (*cascading render*). Hal ini menurunkan performa rendering awal dan berpotensi memicu glitch visual (*flickering*) pada antarmuka Vault.

#### 2. Lapisan
- **Lapisan**: Frontend / React 19 Client Component Lifecycle & State Synchronization Layer.

#### 3. Akar Penyebab
Pola anti-pattern deklarasi state `const [accounts, setAccounts] = useState<Account[]>([]);` yang disinkronkan secara paksa melalui `useEffect(() => { setAccounts(getAccounts()); }, []);`. Mengacu pada panduan resmi React *"You Might Not Need an Effect"*, data eksternal browser seperti `localStorage` tidak boleh disinkronkan dengan memanggil `setState` sinkron di effect mount. Pendekatan yang benar dan direkomendasikan adalah menggunakan external store subscriber (`useSyncExternalStore`) yang aman terhadap SSR hydration dan bebas dari render cascade.

#### 4. Langkah Reproduksi
1. Buka terminal pada root repositori `c:\PEMWEB\tugas1`.
2. Jalankan perintah audit linting: `npx eslint "app/(app)/vault/page.tsx"`.
3. Amati laporan kesalahan ESLint `react-hooks/set-state-in-effect` akibat pemanggilan `setState` sinkron di dalam `useEffect`.

#### 5. Bukti Sebelum Perbaikan (Screenshot Before)
![Bukti Galat 02 Sebelum Perbaikan](docs/praktikum/modul-07/galat-02-before.png)

#### 6. Solusi dan Potongan Kode Perbaikan
Mengganti pola `useState` + `useEffect` dengan custom hook `useLocalStorageValue` yang telah dibangun di `lib/use-local-storage-value.ts` (memanfaatkan `useSyncExternalStore` bawaan React 19). Saat data akun baru disimpan pada `handleSubmit`, perubahan disinkronkan secara reaktif ke seluruh subscriber melalui `notifyLocalStorageChange("personal-security-accounts")`.

Potongan kode [app/(app)/vault/page.tsx](file:///c:/PEMWEB/tugas1/app/(app)/vault/page.tsx#L28-L34):
```tsx
// SEBELUM PERBAIKAN:
// const [accounts, setAccounts] = useState<Account[]>([]);
// useEffect(() => {
//   setAccounts(getAccounts());
// }, []);

// SESUDAH PERBAIKAN:
import { useLocalStorageValue } from "@/lib/use-local-storage-value";

export default function VaultPage() {
  const { value: accounts } = useLocalStorageValue(
    ACCOUNTS_STORAGE_KEY,
    EMPTY_ACCOUNTS,
    getAccounts
  );
  // ...
```

#### 7. Bukti Sesudah Perbaikan (Screenshot After)
Setelah implementasi `useSyncExternalStore` melalui `useLocalStorageValue` terpasang, perintah `npx eslint "app/(app)/vault/page.tsx"` dijalankan kembali. Hasilnya **0 warnings, 0 errors** (exit code 0), dan antarmuka membaca snapshot storage secara sinkron tanpa pass render kaskade:  
![Bukti Galat 02 Sesudah Perbaikan](docs/praktikum/modul-07/galat-02-after.png)

---

### Galat 03: Penanganan Unhandled Exception & Pemulihan Error Boundary (`app/(app)/page.tsx` & `app/error.tsx`)

#### 1. Lokasi dan Gejala
- **Lokasi**: [app/(app)/page.tsx](file:///c:/PEMWEB/tugas1/app/(app)/page.tsx#L46-L57) baris 46-57, baris 316-321, dan [app/error.tsx](file:///c:/PEMWEB/tugas1/app/error.tsx#L27-L33).
- **Gejala**:
  1. Pada Dashboard utama `/`, terdapat tombol merah *"Uji Error"* yang tersisa dari masa pengujian internal pengembang.
  2. Saat tombol tersebut diklik (atau jika parameter query `?test-error=true` diakses), komponen mengeksekusi `throw new Error("Pengujian error.tsx")` yang menyebabkan render loop crash dan memaksa transisi ke Error Boundary `app/error.tsx`.
  3. Pada komponen `app/error.tsx`, antarmuka hanya menyediakan tombol tunggal *"Coba Lagi"* (`reset()`). Karena unhandled exception di dashboard terikat pada state render lokal yang rusak, menekan tombol *"Coba Lagi"* hanya memicu re-render ulang yang langsung crash kembali (unrecoverable error state).

#### 2. Lapisan
- **Lapisan**: Frontend UI / Next.js Client-Side Error Boundary (`error.tsx`) & Resiliency Layer.

#### 3. Akar Penyebab
Kode debug sementara yang menginjeksi unhandled exception ditinggalkan di komponen produksi. Selain itu, penanganan galat `error.tsx` belum menyediakan jalur pemulihan anggun (*graceful fallback*) seperti tautan pemulihan kembali ke rute dasar jika siklus `reset()` gagal memulihkan state komponen yang rusak.

#### 4. Langkah Reproduksi
1. Jalankan aplikasi web: `npm run dev`.
2. Buka browser pada alamat `http://localhost:3000/`.
3. Klik tombol merah *"Uji Error"* pada area atas Dashboard.
4. Tampilan antarmuka langsung berganti ke layar hitam dengan kartu merah *"Terjadi Kesalahan — Maaf, halaman gagal dimuat. Silakan coba lagi."*.

#### 5. Bukti Sebelum Perbaikan (Screenshot Before)
![Bukti Galat 03 Sebelum Perbaikan](docs/praktikum/modul-07/galat-03-before.png)

#### 6. Solusi dan Potongan Kode Perbaikan
1. Menghapus state pengujian debug sintetis `testError`, pengkondisian `new URLSearchParams(...).get("test-error")`, dan elemen tombol merah *"Uji Error"* dari [app/(app)/page.tsx](file:///c:/PEMWEB/tugas1/app/(app)/page.tsx).
2. Memperbarui [app/error.tsx](file:///c:/PEMWEB/tugas1/app/error.tsx) agar menyediakan tombol pemulihan ganda: tombol `reset()` untuk mencoba re-mount dan tombol fallback `Kembali ke Beranda` (`href="/"`) untuk menjamin pengguna tidak terjebak dalam error loop.

Potongan kode [app/error.tsx](file:///c:/PEMWEB/tugas1/app/error.tsx#L26-L38):
```tsx
// SESUDAH PERBAIKAN:
<div className="mt-6 flex flex-col gap-3 sm:flex-row justify-center">
  <button
    onClick={() => reset()}
    className="rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-500 shadow-md shadow-purple-900/30"
  >
    Coba Lagi
  </button>
  <Link
    href="/"
    className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-gray-200 transition hover:bg-white/10"
  >
    Kembali ke Beranda
  </Link>
</div>
```

#### 7. Bukti Sesudah Perbaikan (Screenshot After)
Dashboard utama kini bersih dari tombol uji coba debug dan elemen artifisial, menampilkan metrik status brankas AES-256-GCM, koneksi PostgreSQL relasional, dan master kategori dengan bersih. Jika terjadi error tak terduga, boundary `error.tsx` menjamin pengguna dapat kembali ke halaman utama dengan aman:  
![Bukti Galat 03 Sesudah Perbaikan](docs/praktikum/modul-07/galat-03-after.png)

---

## 4. Keputusan Teknis

### A. Evaluasi `z.stringbool()` dibanding Alternatif Lain
Proyek Veylora menggunakan pustaka validasi **Zod versi 4.6.7**. Pada penanganan data input bertipe boolean (misalnya dari formulir HTML FormData atau query string URL), terdapat perbedaan signifikan antara berbagai pendekatan:

| Masukan String | `z.coerce.boolean()` (JavaScript Truthy) | `z.stringbool()` (Zod v4 Native Codec) | Preprocessing Manual (`z.preprocess`) |
|---|---|---|---|
| `"true"` | `true` | `true` | `true` |
| `"false"` | **`true`** *(Bug semantik fatal: string tidak kosong bernilai truthy)* | `false` | `false` |
| `"1"` | `true` | `true` | `true` |
| `"0"` | **`true`** *(Bug semantik fatal: string "0" bernilai truthy)* | `false` | `false` |
| `""` (string kosong) | `false` | Ditolak / Divalidasi eksplisit | `false` / `default` |
| `"random_str"` | `true` | Ditolak (*Invalid stringbool*) | Ditolak / Divalidasi |

**Alasan Pemilihan Teknis**:
Pendekatan `z.coerce.boolean()` berbahaya untuk input formulir HTML karena secara internal menggunakan `Boolean(value)`. String `"false"` dan `"0"` akan dikonversi menjadi `true`, menyebabkan fitur seperti penonaktifan notifikasi atau checkbox unchecked yang mengirimkan data string gagal beroperasi. Oleh karena itu, pada Zod v4, penggunaan `z.stringbool()` (atau preprocessing manual strict) dipilih karena memetakan representasi leksikal `"true"`/`"false"` dan `"1"`/`"0"` secara benar ke tipe boolean murni.

### B. Aturan Bisnis Boolean pada Veylora
Input boolean utama pada Veylora berada pada preferensi pengguna:
1. **Entitas**: `UserSettings.notifications` (tipe PostgreSQL `Boolean @default(false)`).
2. **Aturan Konversi & Validasi**:
   - Nilai masukan checkbox pada formulir web dapat berupa `true`, `false`, `"on"`, atau `undefined`/`null` saat tidak dicentang.
   - Aturan bisnis: Jika input bernilai `"true"`, `true`, atau `"on"`, preferensi notifikasi diaktifkan (`true`).
   - Jika input bernilai `"false"`, `false`, `""`, atau tidak hadir (`null`/`undefined`), preferensi dinonaktifkan (`false`).
   - Masukan sembarang selain token boolean di atas ditolak oleh validasi skema.

### C. Nilai Turunan saat Render (*Derived Value*) dibanding `useEffect`
Pada komponen [app/(app)/vault/page.tsx](file:///c:/PEMWEB/tugas1/app/(app)/vault/page.tsx) dan [app/(app)/history/history-list.tsx](file:///c:/PEMWEB/tugas1/app/(app)/history/history-list.tsx), filtering akun dan inspeksi dihitung sebagai nilai turunan (*derived state*):

```tsx
// Menghitung langsung saat render — Rekomendasi Resmi React Modern
const filteredAccounts = accounts.filter((account) => {
  const query = searchQuery.toLowerCase();
  return (
    account.name.toLowerCase().includes(query) ||
    account.username.toLowerCase().includes(query) ||
    account.category.toLowerCase().includes(query)
  );
});
```

**Perbandingan Pendekatan**:
1. **Pola Turunan Langsung (Dipilih)**:
   - Dihitung seketika saat render tanpa overhead state tambahan.
   - Tidak memerlukan `useState` sekunder dan tidak memerlukan `useEffect`.
   - Mengeliminasi cascading re-render dan inkonsistensi state antar-frame render.
2. **Pola `useEffect` + `useState` (Anti-Pattern yang Dihindari)**:
   - Membutuhkan `useEffect` yang mendengarkan `[accounts, searchQuery]` lalu memanggil `setFilteredAccounts(...)`.
   - Memicu re-render ekstra: render pertama menampilkan daftar lama, lalu effect berjalan dan memicu render kedua.
   - Menyebabkan komplikasi siklus hidup dan peringatan performa pada React 19.

### D. Strategi Penanganan Galat: Server Action vs `error.tsx`
Arsitektur Veylora menerapkan pemisahan tanggung jawab penanganan galat secara tegas:

1. **Galat Validasi & Aturan Bisnis (Ditangani di Server Action)**:
   - Kegagalan validasi Zod (format URL salah, nama kategori kurang dari 3 karakter, dsb.).
   - Pelanggaran constraint bisnis (nama kategori duplikat, otorisasi kepemilikan data user lain).
   - *Mekanisme*: Server Action tidak melempar exception (*does not throw*), melainkan mengembalikan objek terstruktur:
     ```ts
     return {
       success: false,
       message: "Validasi gagal. Periksa kembali isian formulir.",
       errors: validated.error.flatten().fieldErrors,
     };
     ```
   - Komponen UI menampilkan pesan galat langsung di bawah field formulir terkait secara inline tanpa mengganggu halaman pengguna.

2. **Galat Tak Terduga / Infrastruktur (Diteruskan ke `error.tsx`)**:
   - Kegagalan fatal koneksi database (PostgreSQL server down / pool timeout).
   - Korupsi memori atau unhandled syntax exceptions.
   - *Mekanisme*: Komponen atau layout melempar exception (*bubble up*), ditangkap oleh boundary `error.tsx` terdekat untuk mencegah crash pada seluruh tab browser dan memberikan tombol pemulihan `reset()` atau redirect aman.

---

## 5. Telaah Kode (Code Review)

*(Berdasarkan ketentuan tugas: Jika Pull Request pasangan belum tersedia pada sistem penugasan, bagian telaah PR ditandai sebagai menunggu informasi dan tidak mengarang identitas reviewer).*

- **Status PR Pasangan**: Menunggu informasi dari sistem pembagian tim / belum tersedia pada repositori saat pengerjaan Modul 7.
- **Standar Telaah yang Disiapkan**:
  - `bug`: Memeriksa potensi null-pointer, race condition, dan kebocoran tipe `any`.
  - `security`: Memeriksa otentikasi sesi, verifikasi kepemilikan data (`userId`), dan sanitasi SQL/XSS.
  - `performance`: Memeriksa query N+1, eager loading relasi Prisma, dan pemborosan re-render komponen React.
  - `readability`: Keterbacaan penamaan fungsi, pemisahan berkas `use client` / `use server`.
  - `maintainability`: Konsistensi skema Zod dan pemakaian reusable hooks.

---

## 6. Hasil Pengujian Akhir & Verifikasi Regresi

Seluruh rangkaian pengujian statis, validasi tipe TypeScript, dan build produksi Next.js dijalankan pada branch `praktikum-pemweb` untuk memastikan tidak ada regresi pada seluruh fitur Veylora.

### A. Tabel Hasil Eksekusi Uji
| No | Perintah Pengujian | Fokus Pengujian | Target | Hasil Aktual | Exit Code | Status |
|:---:|---|---|:---:|:---:|:---:|:---:|
| 1 | `npm run lint` | Analisis Statis Kode (ESLint & Next.js Rules) | 0 galat / peringatan | **0 errors, 0 warnings** (Clean) | `0` | **PASS** |
| 2 | `npx tsc --noEmit` | Pemeriksaan Statis Tipe Data TypeScript | 0 galat tipe | **0 galat kompilasi TypeScript** | `0` | **PASS** |
| 3 | `npm run build` | Next.js 16 Production Build (Turbopack Engine) | Build berhasil | **15/15 rute statis & dinamis teroptimasi** | `0` | **PASS** |

### B. Bukti Log Perintah Uji
```text
PS C:\PEMWEB\tugas1> npm run lint
> tugas1@0.1.0 lint
> eslint
[Exit Code: 0 - 0 errors, 0 warnings]

PS C:\PEMWEB\tugas1> npx tsc --noEmit
[Exit Code: 0 - Clean, no type errors]

PS C:\PEMWEB\tugas1> npm run build
▲ Next.js 16.4.5 (Turbopack)
- Environments: .env
✓ Running next.config.ts took 79ms
- Cache Components enabled
- Partial Prefetching enabled
- Experiments (use with caution):
  ✓ agentFeedback

  Creating an optimized production build ...
✓ Compiled successfully in 2.7s
  Running TypeScript ...
  Finished TypeScript in 4.8s ...
  Collecting page data using 11 workers ...
✓ Generating static pages using 11 workers (15/15) in 1408ms
  Finalizing page optimization ...

Route (app)
┌ ○ /
├ ○ /_not-found
├ ƒ /api/login
├ ƒ /api/logout
├ ƒ /api/register
├ ○ /check-url
├ ○ /history
├ ○ /login
├ ○ /register
├ ○ /settings
├ ○ /uji-dynamic-route
├   /uji-dynamic-route/[id]
│ └ ◐ /uji-dynamic-route/[id]
└ ○ /vault

ƒ Proxy (Middleware)

○  (Static)             prerendered as static content
◐  (Partial Prerender)  prerendered as static HTML with dynamic server-streamed content
ƒ  (Dynamic)            server-rendered on demand
[Exit Code: 0 - Production Build Ready]
```

---

## 7. Kesimpulan

Praktikum Modul 7 — Debugging dan Telaah Kode pada repositori Veylora (branch `praktikum-pemweb`) telah diselesaikan secara tuntas:
1. **Audit Lingkungan**: Seluruh baseline arsitektur (Node.js 26.7.0, Next.js 16.4.5, Prisma 7.10.1, Zod 4.6.7, baseline hash `1f5b9868502f73c21a05e01aa3c9d425acccaa9f`) telah dipetakan secara akurat.
2. **Identifikasi Tiga Galat Nyata**: Tiga galat nyata yang dapat direproduksi pada branch `praktikum-pemweb` (Desinkronisasi riwayat URL pada Dashboard, siklus render kaskade React Hooks, dan tombol debug pengujian unhandled exception pada error boundary) telah diidentifikasi dan diperbaiki pada akar penyebabnya tanpa rekayasa.
3. **Dokumentasi Bukti Lengkap**: Seluruh tangkapan layar asli sebelum perbaikan (`galat-01-before.png`, `galat-02-before.png`, `galat-03-before.png`), demonstrasi debugger Server Component (`debugger-server-component.png`), serta bukti sesudah perbaikan (`galat-01-after.png`, `galat-02-after.png`, `galat-03-after.png`) tersimpan rapi di direktori relatif repository `docs/praktikum/modul-07/`.
4. **Kualitas dan Integritas Kode**: Linter bersih tanpa warning/error (`0 errors, 0 warnings`), typecheck TypeScript sukses tanpa galat tipe, dan build produksi Next.js 16 Turbopack berhasil mengompilasi seluruh 15 rute aplikasi tanpa regresi.

