# DFD Level 0 — Personal Security Assistant

## 1. Tujuan

Diagram ini menggambarkan interaksi antara pengguna dan
sistem Personal Security Assistant serta aliran data utamanya.

## 2. Entitas Eksternal

- E1: Pengguna

## 3. Proses

- P1: Autentikasi Pengguna
- P2: Pengelolaan Vault
- P3: Pemeriksaan URL

## 4. Data Store

- D1: Data Akun Pengguna
- D2: Data Kredensial Vault
- D3: Riwayat Pemeriksaan URL

## 5. Aliran Data

| ID | Sumber | Tujuan | Data |
|---|---|---|---|
| F01 | Pengguna | P1 | Data autentikasi |
| F02 | P1 | Pengguna | Status autentikasi |
| F03 | P1 | D1 | Data akun yang diperlukan |
| F04 | Pengguna | P2 | Permintaan akses Vault |
| F05 | P2 | D2 | Permintaan penyimpanan atau pengambilan kredensial |
| F06 | Pengguna | P3 | URL yang ingin diperiksa |
| F07 | P3 | Pengguna | Hasil pemeriksaan URL |
| F08 | P3 | D3 | Riwayat pemeriksaan URL |

## 6. Catatan Keamanan

- Data autentikasi harus dikirim melalui koneksi yang aman.
- Kredensial Vault perlu dilindungi menggunakan enkripsi
  sesuai rancangan sistem.
- Kunci enkripsi harus dikelola secara terpisah dari data
  terenkripsi sesuai kebutuhan keamanan.
- Akses ke data akun dan Vault harus dibatasi berdasarkan
  identitas serta hak akses pengguna.

Catatan: Diagram ini merupakan rancangan awal. Detail aliran
data dan mekanisme perlindungan akan disempurnakan setelah
arsitektur aplikasi ditentukan.