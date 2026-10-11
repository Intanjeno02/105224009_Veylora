# Inventaris Aset Personal Security Assistant

## 1. Deskripsi Sistem

Personal Security Assistant merupakan aplikasi web yang dirancang
untuk membantu pengguna mengelola keamanan akun digital dan
memeriksa URL yang berpotensi berbahaya.

Inventaris aset ini dibuat untuk mengidentifikasi data, layanan,
akun, rahasia, log, dan cadangan data yang perlu dilindungi.

## 2. Daftar Aset

| ID | Nama Aset | Kategori | Deskripsi |
|---|---|---|---|
| A01 | Kredensial akun pengguna | Data | Informasi login akun digital yang disimpan dalam Vault |
| A02 | Data akun pengguna | Data | Informasi yang digunakan untuk mengidentifikasi pengguna |
| A03 | Master password | Rahasia | Rahasia yang digunakan untuk membuka akses ke Vault, jika diterapkan dalam desain |
| A04 | Kunci enkripsi | Rahasia | Kunci yang digunakan untuk melindungi atau membuka data terenkripsi |
| A05 | Session token | Data autentikasi | Token yang digunakan untuk mempertahankan sesi pengguna |
| A06 | Riwayat pemeriksaan URL | Data | Catatan pemeriksaan URL yang dilakukan pengguna |
| A07 | Hasil pemeriksaan URL | Data | Informasi hasil analisis URL |
| A08 | Database aplikasi | Infrastruktur | Media penyimpanan data aplikasi |
| A09 | Layanan autentikasi | Layanan | Komponen yang memverifikasi identitas pengguna |
| A10 | Log keamanan | Log | Catatan aktivitas yang relevan untuk pemantauan dan investigasi |
| A11 | Backup data | Backup | Cadangan data untuk mendukung pemulihan |
| A12 | Source code aplikasi | Perangkat lunak | Kode program yang membentuk aplikasi |

## 3. Klasifikasi Keamanan CIA

Klasifikasi dilakukan berdasarkan tiga aspek:
- Confidentiality (Kerahasiaan)
- Integrity (Integritas)
- Availability (Ketersediaan)

Skala penilaian:
- 1 = Rendah
- 2 = Sedang
- 3 = Tinggi

| ID Aset | Confidentiality | Integrity | Availability | Alasan |
|---|---|---|---|---|
| A01 | 3 - Tinggi | 3 - Tinggi | 2 - Sedang | Kredensial harus dirahasiakan dan dijaga keakuratannya agar tidak disalahgunakan |
| A02 | 2 - Sedang | 3 - Tinggi | 2 - Sedang | Data akun harus akurat dan hanya dapat diakses oleh pihak berwenang |
| A03 | 3 - Tinggi | 3 - Tinggi | 2 - Sedang | Pengungkapan atau perubahan rahasia dapat mengganggu keamanan Vault |
| A04 | 3 - Tinggi | 3 - Tinggi | 3 - Tinggi | Kebocoran atau kerusakan kunci dapat mengganggu perlindungan dan pemulihan data |
| A05 | 3 - Tinggi | 3 - Tinggi | 2 - Sedang | Token yang dicuri atau dimodifikasi dapat disalahgunakan untuk mengakses sesi |
| A06 | 2 - Sedang | 2 - Sedang | 2 - Sedang | Riwayat dapat mengandung informasi aktivitas pengguna dan harus dijaga keakuratannya |
| A07 | 2 - Sedang | 3 - Tinggi | 2 - Sedang | Hasil yang dimodifikasi dapat menyesatkan pengguna dalam menilai keamanan URL |
| A08 | 3 - Tinggi | 3 - Tinggi | 3 - Tinggi | Database dapat menyimpan informasi sensitif dan mendukung fungsi utama aplikasi |
| A09 | 2 - Sedang | 3 - Tinggi | 3 - Tinggi | Gangguan atau manipulasi autentikasi dapat menghambat akses yang sah |
| A10 | 2 - Sedang | 3 - Tinggi | 2 - Sedang | Log harus dijaga dari manipulasi agar dapat digunakan dalam investigasi |
| A11 | 3 - Tinggi | 3 - Tinggi | 2 - Sedang | Backup dapat mengandung data sensitif dan harus dapat dipulihkan dengan benar |
| A12 | 2 - Sedang | 3 - Tinggi | 2 - Sedang | Perubahan kode tanpa izin dapat menimbulkan kerentanan pada aplikasi |

## 4. Catatan

Penilaian CIA merupakan penilaian awal berdasarkan fungsi dan
dampak keamanan setiap aset.

Nilai dapat disesuaikan setelah arsitektur aplikasi, mekanisme
penyimpanan, dan kebutuhan pengguna ditentukan lebih lanjut.

Aset dan layanan yang belum diimplementasikan harus diperlakukan
sebagai komponen rancangan, bukan sebagai fitur yang sudah tersedia.