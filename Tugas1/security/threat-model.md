# Threat Model — Veylora Personal Security Assistant

## 1. Tujuan

Threat modeling dilakukan untuk mengetahui ancaman keamanan
yang mungkin terjadi pada aplikasi Veylora Personal Security Assistant.

Aplikasi ini digunakan untuk menyimpan password akun digital
dan memeriksa URL yang berpotensi berbahaya. Karena aplikasi
menyimpan data penting pengguna, perlu dilakukan analisis
untuk mengetahui risiko yang mungkin terjadi dan cara mengatasinya.

## 2. Ruang Lingkup

Analisis dilakukan berdasarkan DFD awal Veylora dengan
komponen sebagai berikut:

- E1: Pengguna
- P1: Autentikasi Pengguna
- P2: Pengelolaan Vault
- P3: Pemeriksaan URL
- D1: Data akun dan password hash
- D2: Vault dan data kredensial
- D3: Riwayat pemeriksaan URL

Analisis ini masih berdasarkan rancangan aplikasi dan akan
disesuaikan lagi jika ada perubahan pada implementasi.

## 3. Kategori STRIDE

STRIDE digunakan untuk mengelompokkan ancaman keamanan
berdasarkan jenis serangannya.

| Kategori | Penjelasan |
|---|---|
| S - Spoofing | Penyerang menyamar sebagai pengguna yang sah. |
| T - Tampering | Penyerang mengubah data tanpa izin. |
| R - Repudiation | Aktivitas sulit dibuktikan karena catatan yang tersedia tidak memadai. |
| I - Information Disclosure | Data penting diketahui oleh pihak yang tidak berwenang. |
| D - Denial of Service | Layanan terganggu sehingga tidak bisa digunakan dengan normal. |
| E - Elevation of Privilege | Pengguna mendapatkan hak akses yang seharusnya tidak dimiliki. |

## 4. Daftar Ancaman

| ID | STRIDE | Elemen DFD | Aset Terdampak | Ancaman |
|---|---|---|---|---|
| T01 | S | P1, F01 | A02, A05 | Penyerang menggunakan username dan password yang dicuri untuk masuk ke akun pengguna. |
| T02 | T | P1, D1, F03 | A02 | Data akun diubah tanpa izin sehingga proses login bisa terganggu. |
| T03 | R | P3, D3, F08 | A06 | Pengguna menyangkal pernah melakukan pemeriksaan URL karena riwayat pemeriksaan tidak mencatat informasi aktivitas secara memadai. |
| T04 | I | P2, D2, F05a, F05b | A01, A03, A04 | Password yang disimpan di Vault bocor karena perlindungan data tidak memadai. |
| T05 | I | P1, D1, F03 | A01, A02 | Password akun diketahui pihak lain karena password disimpan tanpa mekanisme hashing yang sesuai. |
| T06 | T | P2, D2, F05a, F05b | A01, A04 | Data password di Vault diubah tanpa izin sehingga informasi yang tersimpan menjadi tidak benar. |
| T07 | S | P2, F04, F09 | A03, A05 | Penyerang menggunakan sesi login yang dicuri untuk mencoba mengakses Vault. |
| T08 | D | P3, F06 | A07 | Permintaan pemeriksaan URL yang terlalu banyak membuat layanan menjadi lambat atau tidak bisa digunakan. |
| T09 | I | P3, D3, F08 | A06 | Riwayat pemeriksaan URL dilihat oleh pihak yang tidak berwenang sehingga aktivitas pengguna diketahui. |
| T10 | T | P3, F07 | A07 | Hasil pemeriksaan URL diubah sehingga pengguna mendapatkan informasi keamanan yang salah. |
| T11 | E | P2, F09, D2 | A01, A04 | Pengguna dapat mengakses password milik akun lain karena pemeriksaan hak akses tidak berjalan dengan baik. |
| T12 | I | F01, F04, D1, D2 | A01, A02, A05 | Data penting pengguna diketahui pihak lain karena komunikasi atau penyimpanan data tidak terlindungi dengan baik. |

## 5. Catatan

Analisis ini dibuat berdasarkan rancangan awal Veylora.
Beberapa ancaman masih perlu diperiksa kembali ketika aplikasi
mulai diimplementasikan.

Mekanisme seperti hashing password, enkripsi Vault, penggunaan TLS,
dan pemeriksaan hak akses perlu diterapkan sesuai kebutuhan keamanan.

Untuk pemeriksaan URL, metode yang digunakan masih perlu ditentukan,
terutama jika nantinya aplikasi menggunakan layanan eksternal.

## 6. Kesimpulan

Berdasarkan analisis awal, Veylora memiliki beberapa potensi ancaman,
terutama pada proses login, penyimpanan password, pengelolaan Vault,
dan pemeriksaan URL.

Ancaman tersebut perlu dinilai berdasarkan kemungkinan terjadinya
dan dampaknya terhadap aplikasi. Hasil penilaian akan digunakan
untuk menentukan risiko yang perlu diprioritaskan dan cara mengatasinya.