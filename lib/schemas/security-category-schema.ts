import { z } from "zod";

export const categorySeverityEnum = z.enum(
  ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
  { message: "Tingkat keparahan harus salah satu dari: LOW, MEDIUM, HIGH, atau CRITICAL." }
);

export const createCategorySchema = z.object({
  name: z
    .string({ message: "Nama kategori wajib diisi." })
    .trim()
    .min(1, "Nama kategori wajib diisi.")
    .min(3, "Nama kategori minimal 3 karakter.")
    .max(50, "Nama kategori maksimal 50 karakter."),
  severity: categorySeverityEnum,
  description: z
    .string()
    .trim()
    .max(255, "Deskripsi maksimal 255 karakter.")
    .optional()
    .or(z.literal("")),
});

export const updateCategorySchema = createCategorySchema.extend({
  id: z.coerce.number({ message: "ID kategori harus berupa angka." }).int().positive("ID kategori tidak valid."),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
