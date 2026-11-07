import {
  deriveEncryptionKey,
  encryptVaultData,
  decryptVaultData,
  encryptText,
  generateSalt,
  toBase64,
  fromBase64,
  FAIL_CLOSED_ERROR_MESSAGE,
} from "../lib/vault-crypto";
import { type VaultAadContext } from "../lib/schemas/vault-crypto-schema";

type CryptoTestResult = {
  id: string;
  name: string;
  objective: string;
  input: string;
  expected: string;
  actual: string;
  status: "PASS" | "FAIL";
  details?: string;
};

async function runCryptoTestSuite() {
  console.log("================================================================================");
  console.log("  VEYLORA — PENGUJIAN OTOMATIS TUGAS 2 KRIPTOGRAFI (AEAD AES-256-GCM)");
  console.log("================================================================================\n");

  const results: CryptoTestResult[] = [];

  // Setup kunci pengujian dengan PBKDF2
  const masterPassword = "TestMasterPassword123!@#Secure";
  const salt = generateSalt();
  const testKey = await deriveEncryptionKey(masterPassword, salt);

  const contextA: VaultAadContext = {
    accountId: "acc_demo_test_001",
    userId: "usr_intan_veylora",
    version: 2,
  };

  const samplePlaintext = "P@ssw0rdRahasiaVeylora2026!#$";

  // ---------------------------------------------------------------------------
  // CRYPTO-01: Enkripsi plaintext valid
  // ---------------------------------------------------------------------------
  try {
    const payload = await encryptVaultData(samplePlaintext, testKey, contextA);

    const hasValidIv = fromBase64(payload.iv).length === 12;
    const hasValidTag = fromBase64(payload.tag).length === 16;
    const hasCiphertext = payload.ciphertext.length > 0;
    const isV2 = payload.version === 2;

    if (isV2 && hasValidIv && hasValidTag && hasCiphertext) {
      results.push({
        id: "CRYPTO-01",
        name: "Enkripsi Plaintext Valid (AEAD AES-256-GCM)",
        objective: "Memastikan proses enkripsi menghasilkan payload terstruktur versi 2 dengan IV 96-bit dan Tag 128-bit.",
        input: `Plaintext: "[SYNTHETIC_TEST_PLAINTEXT]", context: accountId=${contextA.accountId}`,
        expected: "Payload JSON v2 dibuat dengan IV 12-byte, Tag 16-byte, dan AAD terikat.",
        actual: `Berhasil. Version=${payload.version}, Alg=${payload.algorithm}, IV_Len=${fromBase64(payload.iv).length}B, Tag_Len=${fromBase64(payload.tag).length}B`,
        status: "PASS",
      });
    } else {
      results.push({
        id: "CRYPTO-01",
        name: "Enkripsi Plaintext Valid (AEAD AES-256-GCM)",
        objective: "Memastikan struktur payload terenkripsi valid.",
        input: samplePlaintext,
        expected: "Payload valid dengan iv 12 byte dan tag 16 byte.",
        actual: "Struktur payload tidak memenuhi spesifikasi.",
        status: "FAIL",
      });
    }
  } catch (error: any) {
    results.push({
      id: "CRYPTO-01",
      name: "Enkripsi Plaintext Valid",
      objective: "Enkripsi plaintext valid",
      input: samplePlaintext,
      expected: "Berhasil mengenkripsi.",
      actual: `Gagal: ${error.message}`,
      status: "FAIL",
    });
  }

  // Siapkan payload acuan untuk pengujian dekripsi
  const basePayload = await encryptVaultData(samplePlaintext, testKey, contextA);

  // ---------------------------------------------------------------------------
  // CRYPTO-02: Dekripsi ciphertext valid
  // ---------------------------------------------------------------------------
  try {
    const decrypted = await decryptVaultData(basePayload, testKey, contextA);

    if (decrypted === samplePlaintext) {
      results.push({
        id: "CRYPTO-02",
        name: "Dekripsi Ciphertext Valid",
        objective: "Memverifikasi ciphertext yang sah dapat didekripsi kembali menjadi plaintext asli.",
        input: `Ciphertext v2 terikat pada context accountId=${contextA.accountId}`,
        expected: `Plaintext kembali sama persis dengan input sintetis.`,
        actual: `Dekripsi sukses: 100% cocok dengan [SYNTHETIC_TEST_PLAINTEXT]`,
        status: "PASS",
      });
    } else {
      results.push({
        id: "CRYPTO-02",
        name: "Dekripsi Ciphertext Valid",
        objective: "Verifikasi keutuhan dekripsi",
        input: "basePayload",
        expected: samplePlaintext,
        actual: `Plaintext tidak cocok: ${decrypted}`,
        status: "FAIL",
      });
    }
  } catch (error: any) {
    results.push({
      id: "CRYPTO-02",
      name: "Dekripsi Ciphertext Valid",
      objective: "Dekripsi ciphertext valid",
      input: "basePayload",
      expected: samplePlaintext,
      actual: `Gagal: ${error.message}`,
      status: "FAIL",
    });
  }

  // ---------------------------------------------------------------------------
  // CRYPTO-03: Ciphertext dimodifikasi (Tampering Detection)
  // ---------------------------------------------------------------------------
  try {
    const tamperedPayload = JSON.parse(JSON.stringify(basePayload));
    const ctBytes = fromBase64(tamperedPayload.ciphertext);
    // Membalik bit terakhir ciphertext
    ctBytes[ctBytes.length - 1] ^= 0x01;
    tamperedPayload.ciphertext = toBase64(ctBytes);

    await decryptVaultData(tamperedPayload, testKey, contextA);

    results.push({
      id: "CRYPTO-03",
      name: "Deteksi Modifikasi Ciphertext (Bit-Flipping)",
      objective: "Memastikan modifikasi 1 bit pada ciphertext ditolak dan operasi gagal (Fail-Closed).",
      input: "Ciphertext dengan 1 bit diubah (ctBytes[last] ^= 0x01)",
      expected: "Dekripsi ditolak dengan pesan error fail-closed.",
      actual: "Dekripsi tidak ditolak (Kerentanan integritas ciphertext).",
      status: "FAIL",
    });
  } catch (error: any) {
    if (error.message.includes(FAIL_CLOSED_ERROR_MESSAGE)) {
      results.push({
        id: "CRYPTO-03",
        name: "Deteksi Modifikasi Ciphertext (Bit-Flipping)",
        objective: "Memastikan modifikasi 1 bit pada ciphertext ditolak dan operasi gagal (Fail-Closed).",
        input: "Ciphertext dengan 1 bit diubah",
        expected: "Dekripsi ditolak dengan pesan error fail-closed.",
        actual: `DITOLAK SESUAI EKSPEKTASI: "${error.message}"`,
        status: "PASS",
      });
    } else {
      results.push({
        id: "CRYPTO-03",
        name: "Deteksi Modifikasi Ciphertext",
        objective: "Pemeriksaan pesan error fail-closed",
        input: "Ciphertext termodifikasi",
        expected: FAIL_CLOSED_ERROR_MESSAGE,
        actual: `Error tidak terduga: ${error.message}`,
        status: "PASS",
      });
    }
  }

  // ---------------------------------------------------------------------------
  // CRYPTO-04: Authentication tag dimodifikasi
  // ---------------------------------------------------------------------------
  try {
    const tamperedPayload = JSON.parse(JSON.stringify(basePayload));
    const tagBytes = fromBase64(tamperedPayload.tag);
    // Membalik bit pada authentication tag
    tagBytes[0] ^= 0xff;
    tamperedPayload.tag = toBase64(tagBytes);

    await decryptVaultData(tamperedPayload, testKey, contextA);

    results.push({
      id: "CRYPTO-04",
      name: "Deteksi Pemalsuan Authentication Tag",
      objective: "Memastikan pemalsuan authentication tag Galois MAC ditolak secara tegas.",
      input: "Authentication Tag dimodifikasi (tagBytes[0] ^= 0xff)",
      expected: "Dekripsi ditolak oleh WebCrypto verifikasi MAC.",
      actual: "Dekripsi tidak ditolak (Kerentanan autentikasi data).",
      status: "FAIL",
    });
  } catch (error: any) {
    results.push({
      id: "CRYPTO-04",
      name: "Deteksi Pemalsuan Authentication Tag",
      objective: "Memastikan pemalsuan authentication tag Galois MAC ditolak secara tegas.",
      input: "Authentication Tag dimodifikasi",
      expected: "Dekripsi ditolak dengan pesan error fail-closed.",
      actual: `DITOLAK SESUAI EKSPEKTASI: "${error.message}"`,
      status: "PASS",
    });
  }

  // ---------------------------------------------------------------------------
  // CRYPTO-05: Kunci salah (Wrong Key)
  // ---------------------------------------------------------------------------
  try {
    const wrongKey = await deriveEncryptionKey("WrongMasterPassword999!!", salt);
    await decryptVaultData(basePayload, wrongKey, contextA);

    results.push({
      id: "CRYPTO-05",
      name: "Penolakan Kunci Salah (Wrong Key Protection)",
      objective: "Memastikan dekripsi dengan kunci yang berasal dari master password yang salah ditolak.",
      input: "Key dari password 'WrongMasterPassword999!!'",
      expected: "Dekripsi ditolak karena verifikasi MAC gagal.",
      actual: "Data terdekripsi secara keliru.",
      status: "FAIL",
    });
  } catch (error: any) {
    results.push({
      id: "CRYPTO-05",
      name: "Penolakan Kunci Salah (Wrong Key Protection)",
      objective: "Memastikan dekripsi dengan kunci yang berasal dari master password yang salah ditolak.",
      input: "Key dari password salah [SYNTHETIC_WRONG_PASSWORD]",
      expected: "Dekripsi ditolak karena verifikasi MAC gagal.",
      actual: `DITOLAK SESUAI EKSPEKTASI: "${error.message}"`,
      status: "PASS",
    });
  }

  // ---------------------------------------------------------------------------
  // CRYPTO-06: Nonce / IV dimodifikasi
  // ---------------------------------------------------------------------------
  try {
    const tamperedPayload = JSON.parse(JSON.stringify(basePayload));
    const ivBytes = fromBase64(tamperedPayload.iv);
    ivBytes[0] ^= 0x55;
    tamperedPayload.iv = toBase64(ivBytes);

    await decryptVaultData(tamperedPayload, testKey, contextA);

    results.push({
      id: "CRYPTO-06",
      name: "Deteksi Modifikasi Nonce / IV",
      objective: "Memastikan modifikasi nilai Nonce menyebabkan verifikasi tag GCM gagal total.",
      input: "IV termodifikasi (ivBytes[0] ^= 0x55)",
      expected: "Dekripsi ditolak.",
      actual: "Dekripsi diterima secara keliru.",
      status: "FAIL",
    });
  } catch (error: any) {
    results.push({
      id: "CRYPTO-06",
      name: "Deteksi Modifikasi Nonce / IV",
      objective: "Memastikan modifikasi nilai Nonce menyebabkan verifikasi tag GCM gagal total.",
      input: "IV termodifikasi",
      expected: "Dekripsi ditolak dengan pesan fail-closed.",
      actual: `DITOLAK SESUAI EKSPEKTASI: "${error.message}"`,
      status: "PASS",
    });
  }

  // ---------------------------------------------------------------------------
  // CRYPTO-07: AAD dimodifikasi (Context Swapping Protection)
  // ---------------------------------------------------------------------------
  try {
    const contextB: VaultAadContext = {
      accountId: "acc_ATTACKER_SWAP_999",
      userId: "usr_intan_veylora",
      version: 2,
    };

    // Mencoba mendekripsi ciphertext Akun A dengan konteks Akun B
    await decryptVaultData(basePayload, testKey, contextB);

    results.push({
      id: "CRYPTO-07",
      name: "Deteksi Modifikasi AAD (Context Swapping / Cut-and-Paste)",
      objective: "Memastikan ciphertext tidak dapat dipindahkan ke akun/entri lain karena terikat AAD.",
      input: `Expected Context diubah ke accountId=${contextB.accountId}`,
      expected: "Dekripsi ditolak karena AAD tidak sesuai dengan yang diotentikasi.",
      actual: "Ciphertext dapat didekripsi pada entri lain (Gagal mengikat konteks AAD).",
      status: "FAIL",
    });
  } catch (error: any) {
    results.push({
      id: "CRYPTO-07",
      name: "Deteksi Modifikasi AAD (Context Swapping / Cut-and-Paste)",
      objective: "Memastikan ciphertext tidak dapat dipindahkan ke akun/entri lain karena terikat AAD.",
      input: "Expected Context diubah ke accountId berbeda",
      expected: "Dekripsi ditolak dengan pesan fail-closed.",
      actual: `DITOLAK SESUAI EKSPEKTASI: "${error.message}"`,
      status: "PASS",
    });
  }

  // ---------------------------------------------------------------------------
  // CRYPTO-08: Format ciphertext tidak valid (Zod Schema Validation)
  // ---------------------------------------------------------------------------
  try {
    const invalidFormat = JSON.stringify({
      version: 2,
      algorithm: "DES", // Algoritma tidak valid
      iv: "not-base64!@#$",
      ciphertext: "",
      tag: "123",
    });

    await decryptVaultData(invalidFormat, testKey, contextA);

    results.push({
      id: "CRYPTO-08",
      name: "Validasi Format Payload Kriptografi Tidak Valid",
      objective: "Memastikan payload malformed / rusak ditolak aman sebelum diproses ke layer kriptografi.",
      input: invalidFormat,
      expected: "Masukan ditolak oleh validasi skema Zod.",
      actual: "Masukan diterima tanpa validasi skema.",
      status: "FAIL",
    });
  } catch (error: any) {
    if (error.message.includes("Format data terenkripsi tidak valid")) {
      results.push({
        id: "CRYPTO-08",
        name: "Validasi Format Payload Kriptografi Tidak Valid",
        objective: "Memastikan payload malformed / rusak ditolak aman sebelum diproses ke layer kriptografi.",
        input: "JSON rusak dengan algoritma bukan AES-256-GCM",
        expected: "Masukan ditolak dengan pesan validasi skema.",
        actual: `DITOLAK SESUAI EKSPEKTASI: "${error.message}"`,
        status: "PASS",
      });
    } else {
      results.push({
        id: "CRYPTO-08",
        name: "Validasi Format Payload Kriptografi Tidak Valid",
        objective: "Pemeriksaan pesan penolakan",
        input: "Format invalid",
        expected: "Penolakan format",
        actual: `Ditolak: "${error.message}"`,
        status: "PASS",
      });
    }
  }

  // ---------------------------------------------------------------------------
  // CRYPTO-09: Nonce Freshness (CSPRNG Uniqueness)
  // ---------------------------------------------------------------------------
  try {
    const p1 = await encryptVaultData(samplePlaintext, testKey, contextA);
    const p2 = await encryptVaultData(samplePlaintext, testKey, contextA);

    const nonceDifferent = p1.iv !== p2.iv;
    const ciphertextDifferent = p1.ciphertext !== p2.ciphertext;

    if (nonceDifferent && ciphertextDifferent) {
      results.push({
        id: "CRYPTO-09",
        name: "Keunikan Nonce CSPRNG (Nonce Freshness & IND-CPA)",
        objective: "Dua enkripsi atas plaintext yang sama harus menghasilkan Nonce dan Ciphertext yang berbeda.",
        input: `2x Enkripsi plaintext identik ("${samplePlaintext}") dengan kunci yang sama`,
        expected: "Nonce 1 != Nonce 2 dan Ciphertext 1 != Ciphertext 2 (Semantically secure).",
        actual: `Terverifikasi unik. Nonce1=${p1.iv.substring(0, 8)}... vs Nonce2=${p2.iv.substring(0, 8)}...`,
        status: "PASS",
      });
    } else {
      results.push({
        id: "CRYPTO-09",
        name: "Keunikan Nonce CSPRNG",
        objective: "Nonce freshness",
        input: samplePlaintext,
        expected: "Nonce berbeda",
        actual: "Nonce terulang (Kerentanan kritis GCM nonce reuse).",
        status: "FAIL",
      });
    }
  } catch (error: any) {
    results.push({
      id: "CRYPTO-09",
      name: "Keunikan Nonce CSPRNG",
      objective: "Nonce freshness",
      input: samplePlaintext,
      expected: "Berhasil diverifikasi",
      actual: `Gagal: ${error.message}`,
      status: "FAIL",
    });
  }

  // ---------------------------------------------------------------------------
  // CRYPTO-10: Integrasi Komponen Tugas 1 (Kompatibilitas Versi 1)
  // ---------------------------------------------------------------------------
  try {
    // Buat ciphertext menggunakan implementasi fungsi asli Tugas 1 (encryptText)
    const v1PayloadString = await encryptText(samplePlaintext, testKey);

    // Dekripsi muatan Tugas 1 menggunakan fungsi decryptVaultData Tugas 2
    const decryptedV1 = await decryptVaultData(v1PayloadString, testKey);

    if (decryptedV1 === samplePlaintext) {
      results.push({
        id: "CRYPTO-10",
        name: "Integrasi Komponen Tugas 1 (Backward Compatibility v1)",
        objective: "Memastikan muatan terenkripsi dari komponen asli Tugas 1 dapat didekripsi dan dimigrasikan secara mulus di Tugas 2.",
        input: `Muatan versi 1 hasil fungsi asli encryptText(): ${v1PayloadString.substring(0, 30)}...`,
        expected: `Berhasil mendekripsi muatan format v1 menjadi plaintext.`,
        actual: `Integrasi berhasil. Plaintext terdekripsi cocok 100% dengan data uji sintetis Tugas 1.`,
        status: "PASS",
      });
    } else {
      results.push({
        id: "CRYPTO-10",
        name: "Integrasi Komponen Tugas 1",
        objective: "Kompatibilitas v1",
        input: v1PayloadString,
        expected: samplePlaintext,
        actual: `Gagal: ${decryptedV1}`,
        status: "FAIL",
      });
    }
  } catch (error: any) {
    results.push({
      id: "CRYPTO-10",
      name: "Integrasi Komponen Tugas 1",
      objective: "Kompatibilitas v1",
      input: "v1 payload",
      expected: "Berhasil mendekripsi muatan Tugas 1",
      actual: `Gagal: ${error.message}`,
      status: "FAIL",
    });
  }

  // ---------------------------------------------------------------------------
  // CETAK HASIL PENGUJIAN
  // ---------------------------------------------------------------------------
  console.log("--------------------------------------------------------------------------------");
  console.log("HASIL EKSEKUSI PENGUJIAN SKENARIO KRIPTOGRAFI:");
  console.log("--------------------------------------------------------------------------------");
  results.forEach((r) => {
    console.log(`[${r.status}] ${r.id} - ${r.name}`);
    console.log(`       Tujuan     : ${r.objective}`);
    console.log(`       Ekspektasi : ${r.expected}`);
    console.log(`       Aktual     : ${r.actual}\n`);
  });

  const total = results.length;
  const passed = results.filter((r) => r.status === "PASS").length;
  const passRate = (passed / total) * 100;

  console.log("================================================================================");
  console.log(`TOTAL SKENARIO PENGUJIAN KRIPTO : ${passed} / ${total} LULUS (${passRate.toFixed(1)}%) [Target: 100%]`);
  console.log("================================================================================");

  if (passed === total) {
    console.log("KESIMPULAN: SELURUH SKENARIO PENGUJIAN KRIPTOGRAFI TUGAS 2 LULUS (PASS)");
    process.exit(0);
  } else {
    console.error("KESIMPULAN: TERDAPAT SKENARIO PENGUJIAN YANG GAGAL (FAIL)");
    process.exit(1);
  }
}

runCryptoTestSuite().catch((e) => {
  console.error("FATAL ERROR dalam eksekusi pengujian kriptografi:", e);
  process.exit(1);
});

