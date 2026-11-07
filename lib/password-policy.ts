import { z } from "zod";

export const MIN_PASSWORD_CODE_POINTS = 15;
export const MAX_PASSWORD_CODE_POINTS = 1024;

export function normalizePassword(password: string): string {
  return password.normalize("NFC");
}

export function countPasswordCodePoints(password: string): number {
  return Array.from(normalizePassword(password)).length;
}

function addMaximumLengthIssue(
  password: string,
  context: z.RefinementCtx
): void {
  if (countPasswordCodePoints(password) > MAX_PASSWORD_CODE_POINTS) {
    context.addIssue({
      code: "custom",
      message: `Password tidak boleh lebih dari ${MAX_PASSWORD_CODE_POINTS} karakter.`,
    });
  }
}

export const newPasswordSchema = z.string().superRefine((password, context) => {
  const length = countPasswordCodePoints(password);

  if (length < MIN_PASSWORD_CODE_POINTS) {
    context.addIssue({
      code: "custom",
      message: `Password minimal ${MIN_PASSWORD_CODE_POINTS} karakter.`,
    });
  }

  addMaximumLengthIssue(password, context);
});

export const loginPasswordSchema = z
  .string()
  .min(1, "Password wajib diisi.")
  .superRefine(addMaximumLengthIssue);
