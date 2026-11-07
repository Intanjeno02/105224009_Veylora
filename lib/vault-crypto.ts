import {
  vaultEncryptedPayloadSchema,
  type VaultAadContext,
  type VaultEncryptedPayloadV2,
} from "@/lib/schemas/vault-crypto-schema";

export const PBKDF2_ITERATIONS = 600_000;
export const AES_KEY_LENGTH = 256;
export const NONCE_LENGTH_BYTES = 12; // 96-bit nonce
export const TAG_LENGTH_BYTES = 16;   // 128-bit tag
export const SALT_LENGTH_BYTES = 16;  // 128-bit salt

export const FAIL_CLOSED_ERROR_MESSAGE =
  "Data tidak dapat dibuka karena integritasnya tidak valid atau master password tidak sesuai. Data asli tetap dipertahankan.";

export function toBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function fromBase64(value: string): Uint8Array {
  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(value, "base64"));
  }
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Menghasilkan salt acak menggunakan CSPRNG peramban/lingkungan runtime.
 */
export function generateSalt(): Uint8Array {
  return globalThis.crypto.getRandomValues(new Uint8Array(SALT_LENGTH_BYTES));
}

/**
 * Menghasilkan Nonce/IV acak 96-bit (12 byte) baru menggunakan CSPRNG.
 */
export function generateNonce(): Uint8Array {
  return globalThis.crypto.getRandomValues(new Uint8Array(NONCE_LENGTH_BYTES));
}

/**
 * Menghasilkan kunci simetris AES-256 dari master password menggunakan PBKDF2-HMAC-SHA256.
 * Kunci bersifat non-extractable demi keamanan memori.
 */
export async function deriveEncryptionKey(
  masterPassword: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  if (!masterPassword || masterPassword.length < 12) {
    throw new Error("Master password harus memiliki minimal 12 karakter.");
  }

  if (!salt || salt.length < 16) {
    throw new Error("Salt harus memiliki panjang minimal 16 byte (128 bit).");
  }

  const passwordBytes = new TextEncoder().encode(masterPassword);

  const passwordKey = await globalThis.crypto.subtle.importKey(
    "raw",
    passwordBytes,
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return globalThis.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: new Uint8Array(salt),
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    passwordKey,
    {
      name: "AES-GCM",
      length: AES_KEY_LENGTH,
    },
    false, // non-extractable in memory
    ["encrypt", "decrypt"]
  );
}

/**
 * Serialisasi kanonikal untuk Associated Authenticated Data (AAD).
 */
export function serializeAad(context: VaultAadContext): Uint8Array {
  const canonicalString = JSON.stringify({
    accountId: context.accountId,
    userId: context.userId,
    version: context.version ?? 2,
  });
  return new TextEncoder().encode(canonicalString);
}

/**
 * Mengenkripsi data sensitif Vault menggunakan AEAD (AES-256-GCM) dengan AAD context-binding.
 */
export async function encryptVaultData(
  plaintext: string,
  key: CryptoKey,
  context: VaultAadContext
): Promise<VaultEncryptedPayloadV2> {
  if (typeof plaintext !== "string") {
    throw new Error("Plaintext harus berupa string.");
  }

  if (!context || !context.accountId || !context.userId) {
    throw new Error("Konteks AAD (accountId dan userId) wajib disediakan.");
  }

  const iv = generateNonce();
  const aadBytes = serializeAad(context);
  const plaintextBytes = new TextEncoder().encode(plaintext);

  // WebCrypto subtle.encrypt menghasilkan ciphertext digabung dengan tag 128-bit di akhir
  const encryptedBuffer = await globalThis.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: new Uint8Array(iv) as unknown as BufferSource,
      additionalData: aadBytes as unknown as BufferSource,
      tagLength: 128,
    },
    key,
    plaintextBytes
  );

  const rawEncrypted = new Uint8Array(encryptedBuffer);
  // Pisahkan ciphertext dan authentication tag 16 byte
  const ciphertextBytes = rawEncrypted.subarray(0, rawEncrypted.length - TAG_LENGTH_BYTES);
  const tagBytes = rawEncrypted.subarray(rawEncrypted.length - TAG_LENGTH_BYTES);

  return {
    version: 2,
    algorithm: "AES-256-GCM",
    keyDerivation: "PBKDF2-SHA256",
    iterations: PBKDF2_ITERATIONS,
    iv: toBase64(iv),
    ciphertext: toBase64(ciphertextBytes),
    tag: toBase64(tagBytes),
    aadContext: {
      accountId: context.accountId,
      userId: context.userId,
      version: context.version ?? 2,
    },
  };
}

/**
 * Mendekripsi data Vault dengan verifikasi integritas otentikasi (Fail-Closed).
 */
export async function decryptVaultData(
  encryptedInput: string | unknown,
  key: CryptoKey,
  expectedContext?: VaultAadContext
): Promise<string> {
  let parsedPayload: unknown;

  try {
    if (typeof encryptedInput === "string") {
      parsedPayload = JSON.parse(encryptedInput);
    } else {
      parsedPayload = encryptedInput;
    }
  } catch {
    throw new Error("Format data terenkripsi tidak valid: gagal mengurai JSON.");
  }

  // Validasi format masukan menggunakan Zod Schema
  const validation = vaultEncryptedPayloadSchema.safeParse(parsedPayload);
  if (!validation.success) {
    throw new Error(
      `Format data terenkripsi tidak valid: ${validation.error.issues[0]?.message ?? "Struktur tidak sesuai."}`
    );
  }

  const payload = validation.data;

  // Penanganan Muatan Versi 2 (AEAD dengan AAD dan tag terpisah)
  if (payload.version === 2) {
    // Verifikasi keterikatan konteks AAD (Context Swapping Protection)
    if (expectedContext) {
      if (
        payload.aadContext.accountId !== expectedContext.accountId ||
        payload.aadContext.userId !== expectedContext.userId
      ) {
        throw new Error(FAIL_CLOSED_ERROR_MESSAGE);
      }
    }

    const iv = fromBase64(payload.iv);
    const ciphertextBytes = fromBase64(payload.ciphertext);
    const tagBytes = fromBase64(payload.tag);

    if (iv.length !== NONCE_LENGTH_BYTES) {
      throw new Error(`Panjang IV tidak valid: ${iv.length} byte (ekspektasi 12 byte).`);
    }

    if (tagBytes.length !== TAG_LENGTH_BYTES) {
      throw new Error(`Panjang Tag tidak valid: ${tagBytes.length} byte (ekspektasi 16 byte).`);
    }

    // Rekonstruksi buffer gabungan (ciphertext + tag) untuk WebCrypto decrypt
    const combinedEncrypted = new Uint8Array(ciphertextBytes.length + tagBytes.length);
    combinedEncrypted.set(ciphertextBytes, 0);
    combinedEncrypted.set(tagBytes, ciphertextBytes.length);

    const aadBytes = serializeAad(payload.aadContext);

    try {
      const plaintextBuffer = await globalThis.crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv: new Uint8Array(iv) as unknown as BufferSource,
          additionalData: aadBytes as unknown as BufferSource,
          tagLength: 128,
        },
        key,
        combinedEncrypted as unknown as BufferSource
      );

      return new TextDecoder().decode(plaintextBuffer);
    } catch {
      // Fail-closed: lempar pesan aman tanpa membocorkan status internal kriptografi
      throw new Error(FAIL_CLOSED_ERROR_MESSAGE);
    }
  }

  // Penanganan Kompatibilitas Mundur: Versi 1 (Tugas 1)
  if (payload.version === 1) {
    const iv = fromBase64(payload.iv);
    const ciphertext = fromBase64(payload.ciphertext);

    if (iv.length !== 12) {
      throw new Error("IV versi 1 tidak valid.");
    }

    try {
      const plaintext = await globalThis.crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv: new Uint8Array(iv) as unknown as BufferSource,
        },
        key,
        new Uint8Array(ciphertext) as unknown as BufferSource
      );

      return new TextDecoder().decode(plaintext);
    } catch {
      throw new Error(FAIL_CLOSED_ERROR_MESSAGE);
    }
  }

  throw new Error("Versi payload kriptografi tidak dikenali.");
}

/**
 * Fungsi enkripsi sederhana (kompatibilitas mundur dengan Tugas 1).
 */
export async function encryptText(
  plaintext: string,
  key: CryptoKey
): Promise<string> {
  const iv = generateNonce();
  const plaintextBytes = new TextEncoder().encode(plaintext);

  const ciphertext = await globalThis.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv as unknown as BufferSource,
    },
    key,
    plaintextBytes
  );

  return JSON.stringify({
    version: 1,
    iv: toBase64(iv),
    ciphertext: toBase64(new Uint8Array(ciphertext)),
  });
}

/**
 * Fungsi dekripsi sederhana (kompatibilitas mundur dengan Tugas 1).
 */
export async function decryptText(
  encryptedData: string,
  key: CryptoKey
): Promise<string> {
  return decryptVaultData(encryptedData, key);
}
