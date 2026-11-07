# Laporan Hasil Pengujian Otomatis Kriptografi (AEAD AES-256-GCM)
**Proyek:** Veylora — Personal Security Assistant  
**Mata Kuliah:** Kriptografi (Tugas 2 — Milestone 2 / `kripto-v0.2`)  
**Script Pengujian:** `scripts/run-crypto-tests.ts`  
**Waktu Eksekusi:** 8 November 2026  
**Status Hasil:** **10 / 10 LULUS (100.0% PASS)**  

---

## 1. Ringkasan Eksekutif Pengujian

Pengujian otomatis dilakukan untuk membuktikan kebenaran matematis dan keamanan implementasi **Authenticated Encryption with Associated Data (AEAD)** berbasis algoritma standar **AES-256-GCM** pada fitur brankas digital (*Vault*) Veylora. Pengujian dirancang untuk memverifikasi kerahasiaan (*confidentiality*), keutuhan data (*integrity*), keaslian data (*authenticity*), keterikatan konteks metadata (*AAD context binding*), keunikan nonce (*nonce freshness*), prinsip *fail-closed*, serta kompatibilitas mundur dengan komponen asli Tugas 1.

---

## 2. Matriks dan Hasil Pengujian Aktual (10 Skenario)

| No | ID Skenario | Nama & Fokus Pengujian | Tujuan Pengujian | Data Masukan Uji (Sintetis) | Hasil yang Diharapkan | Hasil Pengujian Aktual | Status |
|:---:|:---:|:---|:---|:---|:---|:---|:---:|
| 1 | **CRYPTO-01** | **Enkripsi Plaintext Valid** | Memastikan proses enkripsi menghasilkan payload terstruktur versi 2 dengan IV 96-bit dan Tag 128-bit. | `plaintext: "P@ssw0rdRahasiaVeylora2026!#$"`, `context: accountId="acc_demo_test_001"` | Payload JSON v2 dibuat dengan IV 12-byte, Tag 16-byte, dan AAD terikat. | Berhasil. Version=2, Alg=AES-256-GCM, IV_Len=12B, Tag_Len=16B | **PASS** |
| 2 | **CRYPTO-02** | **Dekripsi Ciphertext Valid** | Memverifikasi ciphertext yang sah dapat didekripsi kembali menjadi plaintext asli secara utuh. | Ciphertext v2 terikat pada context `accountId="acc_demo_test_001"` | Plaintext kembali sama persis: `"P@ssw0rdRahasiaVeylora2026!#$"` | Dekripsi sukses: `"P@ssw0rdRahasiaVeylora2026!#$"` (Kecocokan 100%) | **PASS** |
| 3 | **CRYPTO-03** | **Deteksi Modifikasi Ciphertext (Bit-Flipping)** | Memastikan manipulasi 1 bit pada ciphertext terdeteksi oleh Galois MAC dan ditolak (*fail-closed*). | Ciphertext dengan 1 bit diubah: `ctBytes[last] ^= 0x01` | Dekripsi ditolak dengan pesan error fail-closed. | Ditolak sesuai ekspektasi: `"Data tidak dapat dibuka karena integritasnya tidak valid atau master password tidak sesuai. Data asli tetap dipertahankan."` | **PASS** |
| 4 | **CRYPTO-04** | **Deteksi Pemalsuan Authentication Tag** | Memastikan manipulasi bit pada authentication tag ditolak secara tegas tanpa membocorkan plaintext. | Authentication Tag dimodifikasi: `tagBytes[0] ^= 0xff` | Dekripsi ditolak oleh verifikasi MAC WebCrypto. | Ditolak sesuai ekspektasi: `"Data tidak dapat dibuka karena integritasnya tidak valid..."` | **PASS** |
| 5 | **CRYPTO-05** | **Penolakan Kunci Salah (Wrong Key Protection)** | Memastikan dekripsi dengan kunci yang diderivasi dari master password yang salah ditolak secara aman. | Kunci diderivasi dari password `'WrongMasterPassword999!!'` | Dekripsi ditolak karena verifikasi MAC gagal. | Ditolak sesuai ekspektasi: `"Data tidak dapat dibuka karena integritasnya tidak valid..."` | **PASS** |
| 6 | **CRYPTO-06** | **Deteksi Modifikasi Nonce / IV** | Memastikan modifikasi nilai Nonce menyebabkan verifikasi tag GCM gagal total. | IV dimodifikasi: `ivBytes[0] ^= 0x55` | Dekripsi ditolak dengan pesan fail-closed. | Ditolak sesuai ekspektasi: `"Data tidak dapat dibuka karena integritasnya tidak valid..."` | **PASS** |
| 7 | **CRYPTO-07** | **Deteksi Modifikasi AAD (Context Swapping)** | Memastikan ciphertext tidak dapat dipindahkan ke akun/entri lain karena terikat AAD (*Cut-and-Paste Defense*). | Context diubah ke `accountId="acc_ATTACKER_SWAP_999"` | Dekripsi ditolak karena AAD tidak sesuai dengan yang diotentikasi. | Ditolak sesuai ekspektasi: `"Data tidak dapat dibuka karena integritasnya tidak valid..."` | **PASS** |
| 8 | **CRYPTO-08** | **Validasi Format Payload Kriptografi** | Memastikan payload malformed / rusak ditolak aman oleh skema Zod sebelum diproses layer kriptografi. | JSON malformed dengan algoritma bukan AES-256-GCM | Masukan ditolak oleh validasi skema Zod. | Ditolak sesuai ekspektasi: `"Format data terenkripsi tidak valid: Invalid input"` | **PASS** |
| 9 | **CRYPTO-09** | **Keunikan Nonce CSPRNG (Nonce Freshness)** | Dua enkripsi beruntun atas plaintext yang sama harus menghasilkan Nonce unik dan ciphertext berbeda (IND-CPA). | 2x Enkripsi plaintext identik dengan kunci yang sama | Nonce 1 != Nonce 2 dan Ciphertext 1 != Ciphertext 2 | Terverifikasi unik. Nonce1 != Nonce2, Ciphertext1 != Ciphertext2 (Semantically secure). | **PASS** |
| 10 | **CRYPTO-10** | **Integrasi Komponen Tugas 1 (v1 Compatibility)** | Memastikan muatan terenkripsi dari fungsi asli Tugas 1 (`encryptText`) dapat didekripsi di Tugas 2. | Muatan versi 1 hasil fungsi asli Tugas 1 | Berhasil mendekripsi muatan format v1 menjadi plaintext. | Integrasi berhasil. Plaintext terdekripsi: `"P@ssw0rdRahasiaVeylora2026!#$"` (Kompatibel 100%) | **PASS** |

---

## 3. Analisis Hasil dan Kesimpulan Keamanan

1. **Jaminan Integritas & Autentisitas (K2 & K4)**:
   Pengujian CRYPTO-03, CRYPTO-04, CRYPTO-06, dan CRYPTO-07 membuktikan secara matematis bahwa setiap perubahan pada ciphertext, IV, tag, maupun konteks AAD akan **seketika menggagalkan verifikasi Galois MAC**. Tidak ada skenario manipulasi yang berhasil menembus enkripsi.
2. **Keterikatan Konteks Metadata (Anti-Swapping)**:
   Pengujian CRYPTO-07 membuktikan bahwa memindahkan ciphertext dari satu entri akun ke entri akun lain menyebabkan dekripsi ditolak, karena AAD mengikat `accountId` dan `userId` secara kriptografis.
3. **Prinsip Fail-Closed**:
   Seluruh kegagalan dekripsi mengembalikan pesan yang aman dan tidak menampilkan potongan byte, plaintext parsial, atau internal cryptographic trace yang dapat dieksploitasi oleh penyerang.
4. **Kelulusan Kriteria**:
   Total 10 dari 10 skenario berhasil (**100.0% PASS**), melampaui syarat minimal rubrik ($\ge 8$ skenario).

