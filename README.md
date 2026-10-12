## Pengujian

### 1. Pengujian Responsivitas

Pengujian responsivitas dilakukan untuk memastikan antarmuka
dapat digunakan pada ukuran layar ponsel, tablet, dan desktop.

Hasil pengujian menunjukkan bahwa antarmuka dapat ditampilkan
tanpa elemen utama terpotong pada ukuran layar yang diuji.

Bukti pengujian tersedia di folder `docs/screenshots/`.

### 2. Pengujian Lighthouse Accessibility

Pengujian aksesibilitas dilakukan menggunakan Lighthouse
pada halaman Check URL.

| Parameter | Hasil |
|---|---|
| Kategori pengujian | Accessibility |
| Mode pengujian | Navigation |
| Perangkat | Desktop |
| Browser | Google Chrome |
| Versi Chrome | [Isi versi yang digunakan] |
| Halaman yang diuji | http://localhost:3000/check-url |
| Skor Accessibility | 90/100 |
| Target minimum | 85/100 |
| Status | Memenuhi target |

Bukti dan laporan pengujian tersedia di folder `docs/`.