const PBKDF2_ITERATIONS = 600_000;

function toBase64(bytes: Uint8Array): string {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value);

  return Uint8Array.from(binary, (character) =>
    character.charCodeAt(0)
  );
}

/**
 * Membuat salt acak untuk master password.
 * Salt bukan password dan boleh disimpan.
 */
export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(16));
}

/**
 * Menghasilkan kunci AES-256 dari master password.
 * Kunci tidak disimpan secara permanen.
 */
export async function deriveEncryptionKey(
  masterPassword: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  if (masterPassword.length < 12) {
    throw new Error(
      "Master password harus memiliki minimal 12 karakter."
    );
  }

  const passwordBytes = new TextEncoder().encode(masterPassword);

  const passwordKey = await crypto.subtle.importKey(
    "raw",
    passwordBytes,
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
  {
    name: "PBKDF2",
    salt: new Uint8Array(salt),
    iterations: PBKDF2_ITERATIONS,
    hash: "SHA-256",
  },
  passwordKey,
  {
    name: "AES-GCM",
    length: 256,
  },
  false,
  ["encrypt", "decrypt"]
);
}

/**
 * Mengenkripsi teks menggunakan AES-256-GCM.
 * Setiap enkripsi menggunakan IV acak yang baru.
 */
export async function encryptText(
  plaintext: string,
  key: CryptoKey
): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const plaintextBytes = new TextEncoder().encode(plaintext);

  const ciphertext = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
    },
    key,
    plaintextBytes
  );

  const encryptedBytes = new Uint8Array(ciphertext);

  return JSON.stringify({
    version: 1,
    iv: toBase64(iv),
    ciphertext: toBase64(encryptedBytes),
  });
}

/**
 * Mendekripsi teks yang sebelumnya dienkripsi.
 */
export async function decryptText(
  encryptedData: string,
  key: CryptoKey
): Promise<string> {
  const payload = JSON.parse(encryptedData) as {
    version: number;
    iv: string;
    ciphertext: string;
  };

  if (
    payload.version !== 1 ||
    typeof payload.iv !== "string" ||
    typeof payload.ciphertext !== "string"
  ) {
    throw new Error("Format data terenkripsi tidak valid.");
  }

  const iv = fromBase64(payload.iv);
  const ciphertext = fromBase64(payload.ciphertext);

  if (iv.length !== 12) {
    throw new Error("IV tidak valid.");
  }

  const plaintext = await crypto.subtle.decrypt(
  {
    name: "AES-GCM",
    iv: new Uint8Array(iv),
  },
  key,
  new Uint8Array(ciphertext)
);

  return new TextDecoder().decode(plaintext);
}