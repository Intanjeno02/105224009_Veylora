import { z } from "zod";
import { loginPasswordSchema } from "@/lib/password-policy";

export const loginSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, "Username wajib diisi.")
    .min(3, "Username minimal 3 karakter.")
    .max(50, "Username tidak boleh lebih dari 50 karakter."),
  password: loginPasswordSchema,
});

export type LoginInput = z.infer<typeof loginSchema>;
