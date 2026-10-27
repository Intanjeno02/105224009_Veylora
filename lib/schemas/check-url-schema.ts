import { z } from "zod";

export const checkUrlSchema = z
  .string()
  .trim()
  .min(1, "Masukkan URL yang ingin diperiksa.")
  .max(2048, "URL tidak boleh lebih dari 2048 karakter.")
  .superRefine((value, context) => {
    let parsedUrl: URL;

    try {
      parsedUrl = new URL(value);
    } catch {
      context.addIssue({
        code: "custom",
        message:
          "Format URL tidak valid. Masukkan URL lengkap, misalnya https://example.com.",
      });
      return;
    }

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      context.addIssue({
        code: "custom",
        message: "URL harus menggunakan protokol HTTP atau HTTPS.",
      });
      return;
    }

    if (
      !parsedUrl.hostname ||
      !parsedUrl.hostname.includes(".") ||
      parsedUrl.hostname.startsWith(".") ||
      parsedUrl.hostname.endsWith(".")
    ) {
      context.addIssue({
        code: "custom",
        message: "Nama host URL tidak valid.",
      });
    }

    if (parsedUrl.username || parsedUrl.password) {
      context.addIssue({
        code: "custom",
        message:
          "URL tidak boleh berisi username atau password. Hapus informasi tersebut sebelum melanjutkan.",
      });
    }
  });

export type CheckUrlInput = z.infer<typeof checkUrlSchema>;
