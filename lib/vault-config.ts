import {
  deriveEncryptionKey,
  encryptText,
  decryptText,
  generateSalt,
} from "@/lib/vault-crypto";

const CONFIG_KEY = "veylora-vault-config";
const VERIFICATION_TEXT = "veylora-vault-verified-v1";

type VaultConfig = {
  version: 1;
  salt: string;
  verification: string;
};

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

function readConfig(): VaultConfig | null {
  const savedConfig = localStorage.getItem(CONFIG_KEY);

  if (!savedConfig) {
    return null;
  }

  try {
    const config = JSON.parse(savedConfig) as VaultConfig;

    if (
      config.version !== 1 ||
      typeof config.salt !== "string" ||
      typeof config.verification !== "string"
    ) {
      throw new Error("Konfigurasi Vault tidak valid.");
    }

    return config;
  } catch {
    throw new Error(
      "Konfigurasi Vault rusak atau tidak valid."
    );
  }
}

/**
 * Memeriksa apakah konfigurasi Vault sudah dibuat.
 */
export function hasVaultConfig(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return localStorage.getItem(CONFIG_KEY) !== null;
}

/**
 * Membuat konfigurasi Vault baru.
 * Master password tidak disimpan.
 */
export async function setupVault(
  masterPassword: string
): Promise<CryptoKey> {
  if (typeof window === "undefined") {
    throw new Error("Vault hanya dapat disiapkan di browser.");
  }

  if (hasVaultConfig()) {
    throw new Error("Vault sudah dibuat.");
  }

  const salt = generateSalt();

  const key = await deriveEncryptionKey(
    masterPassword,
    salt
  );

  const verification = await encryptText(
    VERIFICATION_TEXT,
    key
  );

  const config: VaultConfig = {
    version: 1,
    salt: toBase64(salt),
    verification,
  };

  try {
    localStorage.setItem(
      CONFIG_KEY,
      JSON.stringify(config)
    );
  } catch {
    throw new Error(
      "Konfigurasi Vault gagal disimpan di browser."
    );
  }

  return key;
}

/**
 * Membuka Vault menggunakan master password.
 * Password yang salah akan menghasilkan kegagalan dekripsi.
 */
export async function unlockVault(
  masterPassword: string
): Promise<CryptoKey> {
  if (typeof window === "undefined") {
    throw new Error("Vault hanya dapat dibuka di browser.");
  }

  const config = readConfig();

  if (!config) {
    throw new Error("Vault belum disiapkan.");
  }

  const salt = fromBase64(config.salt);

  if (salt.length !== 16) {
    throw new Error("Salt Vault tidak valid.");
  }

  const key = await deriveEncryptionKey(
    masterPassword,
    salt
  );

  try {
    const verification = await decryptText(
      config.verification,
      key
    );

    if (verification !== VERIFICATION_TEXT) {
      throw new Error("Master password salah.");
    }

    return key;
  } catch {
    throw new Error(
      "Master password salah atau konfigurasi Vault rusak."
    );
  }
}