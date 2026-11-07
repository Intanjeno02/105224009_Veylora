import argon2 from "argon2";
import { compare as compareBcrypt } from "bcryptjs";
import { normalizePassword } from "@/lib/password-policy";

const BCRYPT_HASH_PATTERN = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;
const ARGON2ID_PREFIX = "$argon2id$";

export type PasswordVerification =
  | { valid: false }
  | { valid: true; upgradedHash?: string };

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(normalizePassword(password), {
    type: argon2.argon2id,
    memoryCost: 65_536,
    timeCost: 3,
    parallelism: 1,
  });
}

export async function verifyPassword(
  password: string,
  passwordHash: string
): Promise<PasswordVerification> {
  if (passwordHash.startsWith(ARGON2ID_PREFIX)) {
    return {
      valid: await argon2.verify(
        passwordHash,
        normalizePassword(password)
      ),
    };
  }

  if (!BCRYPT_HASH_PATTERN.test(passwordHash)) {
    return { valid: false };
  }

  if (Buffer.byteLength(password, "utf8") > 72) {
    return { valid: false };
  }

  const valid = await compareBcrypt(password, passwordHash);

  if (!valid) {
    return { valid: false };
  }

  return {
    valid: true,
    upgradedHash: await hashPassword(password),
  };
}
