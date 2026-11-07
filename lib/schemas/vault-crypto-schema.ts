import { z } from "zod";

const base64Regex = /^[A-Za-z0-9+/=]+$/;

export const vaultAadContextSchema = z.object({
  accountId: z.string().min(1, "Account ID tidak boleh kosong."),
  userId: z.string().min(1, "User ID tidak boleh kosong."),
  version: z.number().int().positive().default(2),
});

export const vaultEncryptedPayloadV2Schema = z.object({
  version: z.literal(2),
  algorithm: z.literal("AES-256-GCM"),
  keyDerivation: z.literal("PBKDF2-SHA256"),
  iterations: z.number().int().min(100_000, "Iterasi KDF minimal 100.000."),
  iv: z
    .string()
    .min(1, "IV wajib diisi.")
    .regex(base64Regex, "Format IV harus berupa Base64 valid."),
  ciphertext: z
    .string()
    .min(1, "Ciphertext wajib diisi.")
    .regex(base64Regex, "Format Ciphertext harus berupa Base64 valid."),
  tag: z
    .string()
    .min(1, "Authentication Tag wajib diisi.")
    .regex(base64Regex, "Format Tag harus berupa Base64 valid."),
  aadContext: vaultAadContextSchema,
});

export const vaultEncryptedPayloadV1Schema = z.object({
  version: z.literal(1),
  iv: z.string().min(1).regex(base64Regex),
  ciphertext: z.string().min(1).regex(base64Regex),
});

export const vaultEncryptedPayloadSchema = z.union([
  vaultEncryptedPayloadV2Schema,
  vaultEncryptedPayloadV1Schema,
]);

export type VaultAadContext = z.infer<typeof vaultAadContextSchema>;
export type VaultEncryptedPayloadV2 = z.infer<typeof vaultEncryptedPayloadV2Schema>;
export type VaultEncryptedPayloadV1 = z.infer<typeof vaultEncryptedPayloadV1Schema>;
export type VaultEncryptedPayload = z.infer<typeof vaultEncryptedPayloadSchema>;

