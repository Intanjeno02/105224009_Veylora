# Dokumen Teknis Modul 5 — Formulir, Validasi, Session, dan Cookie

Nama/NIM   : Intan Rhevita Arselina Suryana/105224009
Repositori : 

## 1. Skema Validasi

- Tabel kolom formulir: nama kolom, aturan Zod, pesan galat

  Pada halaman Cek URL, input diperiksa menggunakan Zod di `lib/schemas/check-url-schema.ts`. Formulir Tambah Akun di Vault saat ini memakai pemeriksaan manual di browser, belum memakai Zod.

| Kolom | Aturan | Pesan galat |
|---|---|---|
| URL yang diperiksa | Tidak boleh kosong setelah spasi dihapus. | Masukkan URL yang ingin diperiksa. |
| URL yang diperiksa | Maksimal 2048 karakter. | URL tidak boleh lebih dari 2048 karakter. |
| URL yang diperiksa | Harus berupa URL lengkap yang dapat dibaca, termasuk protokol. | Format URL tidak valid. Masukkan URL lengkap, misalnya `https://example.com`. |
| URL yang diperiksa | Protokol hanya boleh HTTP atau HTTPS. | URL harus menggunakan protokol HTTP atau HTTPS. |
| URL yang diperiksa | Nama host harus ada dan memiliki format yang masuk akal. | Nama host URL tidak valid. |
| URL yang diperiksa | Tidak boleh berisi username atau password. | URL tidak boleh berisi username atau password. |

  Di formulir Vault, nama layanan dan username wajib diisi (maksimal 100 karakter), email wajib diisi dan diperiksa format dasarnya (maksimal 254 karakter), serta URL layanan wajib diisi dan harus menggunakan HTTPS (maksimal 2048 karakter). Kategori boleh dipilih dari daftar yang tersedia.

- Aturan semantik yang diperiksa di Server Action dan alasannya

  Aturan semantik memeriksa makna data setelah formatnya benar. Contohnya, URL yang valid secara format tetap ditolak jika protokolnya bukan HTTP/HTTPS atau jika URL berisi username/password. Untuk Vault, URL layanan harus HTTPS agar koneksi ke layanan menggunakan protokol yang lebih aman. Aturan ini membantu mencegah data yang tidak sesuai kebutuhan aplikasi diproses. Pada proyek saat ini belum ada Server Action; pemeriksaan tersebut berjalan di browser.

## 2. Alur Server Action

- Urutan sesi, validasi bentuk, validasi semantik, mutasi, revalidatePath, redirect

  Jika formulir ini dipindahkan ke Server Action, urutannya adalah: periksa sesi pengguna di server, baca data formulir, validasi bentuk menggunakan Zod, periksa aturan semantik, lakukan perubahan data jika semua pemeriksaan berhasil, panggil `revalidatePath` agar halaman memakai data terbaru, lalu `redirect` jika pengguna perlu diarahkan ke halaman lain. Jika validasi gagal, kembalikan pesan galat dan jangan mengubah data.

  Pada kode proyek saat ini belum ada Server Action. Halaman Cek URL dan Vault berjalan sebagai Client Component; pemeriksaan serta perubahan data dilakukan di browser. Karena itu, proyek saat ini tidak menjalankan urutan sesi, `revalidatePath`, atau `redirect` melalui Server Action.

- Pembagian berkas: Server Component, Client Component, berkas "use server"

  Server Component cocok untuk menampilkan halaman dan mengambil data di server. Client Component digunakan untuk bagian yang perlu interaksi langsung, seperti input, tombol, dan state formulir. Fungsi yang diberi `"use server"` ditempatkan sebagai Server Action untuk memeriksa data dan mengubah data secara aman di server. Di proyek ini halaman interaktif seperti Cek URL dan Vault menggunakan `"use client"`; belum ada berkas `"use server"`.

## 3. Bukti Uji Validasi

- Tabel minimal 8 kasus uji: masukan, hasil yang diharapkan, hasil nyata

  Tabel berikut menunjukkan hasil berdasarkan aturan yang ada di kode; ini bukan hasil dari pengujian otomatis.

| No. | Masukan | Hasil yang diharapkan | Hasil berdasarkan kode |
|---|---|---|---|
| 1 | Kosong | Ditolak karena wajib diisi. | Ditolak: “Masukkan URL yang ingin diperiksa.” |
| 2 | `example.com` | Ditolak karena tidak mencantumkan protokol. | Ditolak: format URL tidak valid. |
| 3 | `ftp://example.com` | Ditolak karena protokol bukan HTTP/HTTPS. | Ditolak: “URL harus menggunakan protokol HTTP atau HTTPS.” |
| 4 | `https://example.com` | Diterima dan pemeriksaan simulasi dijalankan. | Diterima; hasil ditampilkan dan disimpan ke riwayat browser. |
| 5 | `http://example.com` | Diterima oleh validasi bentuk, tetapi diberi indikator karena bukan HTTPS. | Diterima; hasil simulasi berstatus “Mencurigakan”. |
| 6 | `https://user:pass@example.com` | Ditolak karena mengandung informasi login. | Ditolak dengan pesan agar username/password dihapus. |
| 7 | `javascript:alert(1)` | Ditolak karena protokol tidak diizinkan. | Ditolak: “URL harus menggunakan protokol HTTP atau HTTPS.” |
| 8 | URL lebih dari 2048 karakter | Ditolak karena melewati batas panjang. | Ditolak: “URL tidak boleh lebih dari 2048 karakter.” |

- Minimal 3 kasus dengan validasi klien dilewati (atribut novalidate)

  Formulir Cek URL memiliki atribut `noValidate`, sehingga pemeriksaan bawaan browser seperti `required` dan format input URL dilewati. Namun, handler formulir tetap menjalankan pemeriksaan Zod. Kasus nomor 1, 2, dan 3 pada tabel menunjukkan bahwa input kosong, URL tanpa protokol, dan protokol FTP tetap ditolak oleh validasi Zod.

- Tangkapan layar galat per kolom
![input kosong](input_kosong_modul5.png)
![URL tanpa protokol](URL_Tanpa_Protokol_modul5.png)
![FTP tertolak](FTP_tertolak_modul5.png)

## 4. Session dan Cookie

- Atribut cookie sesi dan alasan pemilihannya

  Jika aplikasi menggunakan sesi server, cookie sebaiknya menyimpan ID sesi acak, bukan data rahasia atau seluruh data pengguna. Gunakan `HttpOnly` agar JavaScript di browser tidak dapat membaca cookie, `Secure` saat aplikasi berjalan melalui HTTPS, `SameSite=Lax` untuk mengurangi risiko pengiriman cookie lintas situs, `Path=/` agar berlaku di seluruh aplikasi, dan masa berlaku (`Max-Age` atau `Expires`) yang sesuai. Di proyek saat ini belum ada cookie sesi; data Vault disimpan di `localStorage` browser.

- Tangkapan layar panel Application dan header Set-Cookie (nilai disamarkan)
![application cookies](apllication_cookies.png)
![local storage](Local_Storage.png)
Pemeriksaan pada tab Network menunjukkan bahwa request dokumen halaman Cek URL tidak memiliki header Set-Cookie. Hal ini sesuai dengan implementasi saat ini yang belum menggunakan cookie sesi server.
  

- Hasil uji: cookie palsu, logout, cookie lama setelah logout

 ### Hasil Uji: Cookie Palsu, Logout, dan Cookie Lama Setelah Logout

| No. | Skenario Pengujian         | Langkah Pengujian                                                                                           | Hasil yang Diharapkan                                                                                           | Hasil Aktual                                                                            |
| --- | -------------------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| 1   | Cookie palsu               | Memasukkan cookie dengan ID sesi yang tidak valid, kemudian mencoba mengakses halaman yang dilindungi sesi. | Server menolak cookie palsu dan tidak memberikan akses ke halaman yang dilindungi.                              | Belum dapat diuji karena aplikasi belum menerapkan session server dan validasi ID sesi. |
| 2   | Logout                     | Melakukan logout setelah pengguna memiliki sesi aktif.                                                      | Sesi dihapus dari server dan cookie sesi dihapus dari browser sehingga pengguna tidak lagi memiliki sesi aktif. | Belum dapat diuji karena fitur logout dan session server belum tersedia.                |
| 3   | Cookie lama setelah logout | Melakukan logout, kemudian mencoba menggunakan kembali cookie sesi sebelum logout.                          | Server menolak cookie lama karena sesi terkait sudah tidak aktif.                                               | Belum dapat diuji karena aplikasi belum menerapkan session server dan mekanisme logout. |

**Catatan:** Pada implementasi Veylora saat ini, data Vault disimpan menggunakan `localStorage` di browser. Aplikasi belum menerapkan session server dan mekanisme autentikasi berbasis cookie. Oleh karena itu, ketiga skenario pengujian di atas belum dapat dilakukan. Hasil yang diharapkan merupakan perilaku keamanan yang harus dipenuhi apabila mekanisme session server diimplementasikan.


## 5. Keputusan Teknis

- Alasan pola session di server dibanding token di cookie

  Sesi server menyimpan data sesi di server dan hanya menaruh ID acak di cookie. Cara ini memudahkan aplikasi mencabut sesi saat logout, mengubah status akun, atau mendeteksi sesi yang tidak berlaku. Token yang membawa data di cookie lebih sulit dicabut sebelum masa berlakunya habis dan berisiko membocorkan informasi bila isi token tidak ditangani dengan benar. Untuk aplikasi yang perlu logout dan perlindungan akses, sesi server lebih mudah dikendalikan.

- Batas peran proxy.ts dibanding pemeriksaan di aksi

  `proxy.ts` dapat digunakan sebagai pemeriksaan awal untuk mengarahkan pengguna yang belum memiliki sesi dari halaman tertentu. Namun, pemeriksaan di proxy bukan pengganti pemeriksaan keamanan pada aksi. Setiap aksi yang berjalan di server tetap harus memeriksa sesi dan hak akses sebelum membaca atau mengubah data, karena aksi bisa dipanggil secara langsung tanpa melewati navigasi halaman. Proyek saat ini belum memiliki `proxy.ts` maupun Server Action.

## 6. Kendala dan Penyelesaian 

## 7. Catatan Pemanfaatan AI Alat, perintah utama, bagian yang digunakan, dan cara memverifikasinya. Tulis "Tidak menggunakan AI" apabila tidak menggunakan AI