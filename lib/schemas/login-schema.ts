import { z } from "zod";

export const loginSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, "Username wajib diisi.")
    .min(3, "Username minimal 3 karakter.")
    .max(50, "Username tidak boleh lebih dari 50 karakter."),
  password: z
    .string()
    .min(1, "Password wajib diisi.")
    .min(6, "Password minimal 6 karakter.")
    .max(100, "Password tidak boleh lebih dari 100 karakter."),
});

export type LoginInput = z.infer<typeof loginSchema>;

