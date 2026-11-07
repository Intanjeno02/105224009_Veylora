import { z } from "zod";
import { checkUrlSchema } from "./check-url-schema";

export const createUrlInspectionSchema = z.object({
  url: checkUrlSchema,
  categoryId: z.coerce
    .number({ message: "Kategori keamanan wajib dipilih." })
    .int("ID kategori harus berupa bilangan bulat.")
    .positive("Pilih kategori keamanan yang valid."),
  notes: z
    .string()
    .trim()
    .max(500, "Catatan tambahan maksimal 500 karakter.")
    .optional()
    .or(z.literal("")),
});

export const updateUrlInspectionSchema = z.object({
  id: z.string().trim().min(1, "ID inspeksi wajib diisi."),
  categoryId: z.coerce
    .number({ message: "Kategori keamanan wajib dipilih." })
    .int("ID kategori harus berupa bilangan bulat.")
    .positive("Pilih kategori keamanan yang valid."),
  notes: z
    .string()
    .trim()
    .max(500, "Catatan tambahan maksimal 500 karakter.")
    .optional()
    .or(z.literal("")),
});

export type CreateUrlInspectionInput = z.infer<typeof createUrlInspectionSchema>;
export type UpdateUrlInspectionInput = z.infer<typeof updateUrlInspectionSchema>;
