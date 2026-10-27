## Pembagian Server Components dan Client Components

Pada Next.js App Router, komponen secara default menggunakan Server Components, kecuali jika ditandai dengan direktif `"use client"`. Pemilihan jenis komponen disesuaikan dengan kebutuhan setiap bagian aplikasi.

### 1. Server Components

Server Components digunakan untuk komponen yang tidak memerlukan interaksi langsung dari pengguna melalui browser, seperti pengaturan struktur dasar halaman.

Dalam proyek Veylora, `app/layout.tsx` menggunakan Server Component karena tidak memiliki direktif `"use client"` dan tidak menggunakan hook interaktif. Komponen ini mengatur elemen HTML utama, font, metadata, serta CSS global aplikasi.

Penggunaan Server Component pada layout utama membantu memisahkan pengaturan dasar aplikasi dari komponen yang memerlukan interaksi di browser.

### 2. Client Components

Client Components digunakan ketika komponen memerlukan interaksi pengguna, state, event handler, atau API browser. Komponen ini ditandai dengan direktif `"use client"`.

Beberapa contoh penggunaannya dalam proyek Veylora adalah:

* **Halaman Beranda — `app/(app)/page.tsx`**
  Menggunakan Client Component karena memerlukan `useState` untuk mengelola state, `useEffect` untuk membaca data dari `localStorage` dan memasang event listener, serta `usePathname` untuk mengetahui URL aktif. Halaman ini juga memiliki event handler untuk interaksi tombol dan input pencarian.

* **AppShell — `components/AppShell.tsx`**
  Menggunakan Client Component karena memakai `usePathname` untuk mengetahui rute yang sedang dibuka dan menyesuaikan tampilan navigasi.

* **Halaman Pengujian Dynamic Route — `app/(app)/uji-dynamic-route/page.tsx`**
  Menggunakan Client Component karena memakai `useState` untuk mengelola input dan pesan validasi, serta `useRouter` untuk melakukan navigasi ke halaman detail berdasarkan ID yang dimasukkan.

* **Template — `app/template.tsx`**
  Menggunakan Client Component karena memiliki direktif `"use client"` dan `useEffect`. Hook tersebut digunakan untuk mencatat pesan ke console ketika template dipasang kembali.

* **Error Boundary — `app/error.tsx`**
  Menggunakan Client Component karena membutuhkan `useEffect` untuk mencatat error dan event handler pada tombol yang memanggil fungsi `reset()`.

### 3. Alasan Pembagian Komponen

Pembagian Server dan Client Components dilakukan berdasarkan kebutuhan teknis masing-masing komponen.

Server Component digunakan pada bagian yang tidak memerlukan interaksi langsung dari browser. Sebaliknya, Client Component digunakan ketika komponen membutuhkan state, hook React, event handler, navigasi interaktif, atau API browser.

Dengan pembagian ini, penggunaan fitur interaktif dapat difokuskan pada bagian yang membutuhkannya, sementara komponen dasar aplikasi tetap menggunakan Server Component jika sesuai.

Perlu diperhatikan bahwa Client Component tidak berarti seluruh proses rendering hanya dilakukan di browser. Next.js tetap dapat melakukan pre-rendering HTML di server, sedangkan fitur interaktifnya berjalan di sisi klien.
