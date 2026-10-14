# Risk Register — Veylora Personal Security Assistant

## 1. Tujuan

Risk register dibuat untuk menentukan ancaman mana yang perlu
diprioritaskan berdasarkan kemungkinan terjadinya dan dampaknya
terhadap aplikasi Veylora Personal Security Assistant.

Penilaian ini masih berdasarkan rancangan aplikasi, sehingga
nilainya dapat berubah setelah aplikasi selesai dibuat dan diuji.

## 2. Skala Penilaian

### Kemungkinan (Likelihood)

| Nilai | Keterangan |
|---|---|
| 1 | Rendah, ancaman relatif sulit terjadi. |
| 2 | Sedang, ancaman bisa terjadi dalam kondisi tertentu. |
| 3 | Tinggi, ancaman cukup mungkin terjadi. |

### Dampak (Impact)

| Nilai | Keterangan |
|---|---|
| 1 | Rendah, gangguan hanya memengaruhi bagian kecil aplikasi. |
| 2 | Sedang, gangguan memengaruhi fitur atau sebagian data pengguna. |
| 3 | Tinggi, gangguan dapat membahayakan data penting atau fungsi utama aplikasi. |

### Perhitungan Risiko

Nilai risiko = Kemungkinan × Dampak

| Nilai Risiko | Prioritas |
|---|---|
| 1–2 | Rendah |
| 3–4 | Sedang |
| 6–9 | Tinggi |

## 3. Daftar Risiko Prioritas

| ID | Ancaman | Aset Terdampak | Kemungkinan | Dampak | Nilai Risiko | Prioritas | Alasan |
|---|---|---|---|---|---|---|---|
| R01 | Password pengguna dicuri dan digunakan untuk login tanpa izin. | A02, A05 | 2 | 3 | 6 | Tinggi | Jika penyerang berhasil masuk, akun pengguna dapat diakses tanpa izin. |
| R02 | Data password dalam Vault bocor karena perlindungan penyimpanan tidak memadai. | A01, A03, A04 | 2 | 3 | 6 | Tinggi | Kebocoran password dapat membahayakan banyak akun digital yang disimpan pengguna. |
| R03 | Penyerang menggunakan sesi login yang dicuri untuk mengakses Vault. | A03, A05 | 2 | 3 | 6 | Tinggi | Sesi yang masih aktif dapat disalahgunakan untuk mengakses data tanpa login ulang. |
| R04 | Hasil pemeriksaan URL salah atau diubah sehingga pengguna menerima informasi yang tidak sesuai. | A07 | 2 | 2 | 4 | Sedang | Pengguna dapat menganggap URL berbahaya sebagai URL yang aman. |
| R05 | Riwayat pemeriksaan URL diakses oleh pihak yang tidak berwenang. | A06 | 2 | 2 | 4 | Sedang | Riwayat dapat mengungkap aktivitas pengguna dan perlu dibatasi aksesnya. |

## 4. Rencana Penanganan Risiko

| ID Risiko | Rencana Kontrol | Alasan | Pemetaan ke Tugas Berikutnya |
|---|---|---|---|
| R01 | Menggunakan hashing password yang sesuai, membatasi percobaan login, dan menerapkan autentikasi yang aman. | Kemungkinan sedang karena pengguna dapat memakai password lemah atau berulang dan pembatasan login belum diterapkan. Dampak tinggi karena akun yang berhasil diakses tanpa izin dapat membahayakan data pengguna. | Tugas 2: Autentikasi dan kontrol akses. |
| R02 | Mengenkripsi data kredensial di Vault dan mengatur pengelolaan kunci enkripsi dengan aman. | Melindungi password yang disimpan jika data penyimpanan diakses pihak lain. | Tugas 2: Enkripsi dan pengelolaan kunci. |
| R03 | Mengatur masa berlaku sesi, memeriksa hak akses sebelum membuka Vault, dan menyediakan logout. | Mengurangi risiko penyalahgunaan sesi yang dicuri. | Tugas 2: Manajemen sesi dan otorisasi. |
| R04 | Memvalidasi URL dan menggunakan mekanisme pemeriksaan yang dapat dipercaya. Menampilkan hasil yang tidak pasti jika pemeriksaan belum meyakinkan. | Mengurangi risiko pengguna mengambil keputusan berdasarkan hasil pemeriksaan yang salah. | Tugas 3: Validasi input dan pemeriksaan URL. |
| R05 | Membatasi akses ke riwayat pemeriksaan dan melindungi data yang disimpan. | Menjaga privasi aktivitas pengguna. | Tugas 2: Kontrol akses dan perlindungan data. |

## 5. Catatan

Penilaian risiko dibuat berdasarkan fungsi dan rancangan awal
Veylora, bukan berdasarkan hasil pengujian keamanan.

Nilai kemungkinan merupakan perkiraan awal dan perlu dievaluasi
kembali setelah mekanisme keamanan diterapkan.

Kontrol yang ditulis merupakan rencana pengembangan dan belum
berarti sudah tersedia di dalam aplikasi.

## 6. Kesimpulan

Risiko yang menjadi prioritas utama adalah pencurian password,
kebocoran data Vault, dan penyalahgunaan sesi login karena
ketiganya dapat membahayakan data penting pengguna.

Oleh karena itu, pengembangan Veylora perlu memprioritaskan
autentikasi, perlindungan password, enkripsi Vault, dan
pemeriksaan hak akses sebelum menambahkan fitur lainnya.