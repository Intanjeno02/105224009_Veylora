"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { verifySession } from "@/lib/session";
import {
  createCategorySchema,
  updateCategorySchema,
} from "@/lib/schemas/security-category-schema";

export type CategoryActionState = {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
  data?: any;
};

export async function createCategory(
  prevState: CategoryActionState,
  formData: FormData
): Promise<CategoryActionState> {
  const session = await verifySession();
  if (!session) {
    return {
      success: false,
      message: "Sesi tidak valid atau telah berakhir. Silakan login kembali.",
    };
  }

  const rawData = {
    name: formData.get("name"),
    severity: formData.get("severity"),
    description: formData.get("description"),
  };

  const validated = createCategorySchema.safeParse(rawData);
  if (!validated.success) {
    return {
      success: false,
      message: "Validasi gagal. Periksa kembali isian formulir.",
      errors: validated.error.flatten().fieldErrors,
    };
  }

  const { name, severity, description } = validated.data;

  try {
    const existing = await prisma.securityCategory.findUnique({
      where: { name },
    });

    if (existing) {
      return {
        success: false,
        message: `Kategori dengan nama "${name}" sudah terdaftar.`,
        errors: {
          name: ["Nama kategori sudah digunakan. Gunakan nama lain."],
        },
      };
    }

    const category = await prisma.securityCategory.create({
      data: {
        name,
        severity,
        description: description || null,
      },
    });

    revalidatePath("/categories");
    revalidatePath("/check-url");
    revalidatePath("/history");

    return {
      success: true,
      message: `Kategori "${category.name}" berhasil ditambahkan.`,
      data: category,
    };
  } catch (error) {
    console.error("Gagal membuat kategori keamanan:", error);
    return {
      success: false,
      message: "Terjadi kesalahan internal server saat menyimpan kategori.",
    };
  }
}

export async function updateCategory(
  prevState: CategoryActionState,
  formData: FormData
): Promise<CategoryActionState> {
  const session = await verifySession();
  if (!session) {
    return {
      success: false,
      message: "Sesi tidak valid atau telah berakhir. Silakan login kembali.",
    };
  }

  const rawData = {
    id: formData.get("id"),
    name: formData.get("name"),
    severity: formData.get("severity"),
    description: formData.get("description"),
  };

  const validated = updateCategorySchema.safeParse(rawData);
  if (!validated.success) {
    return {
      success: false,
      message: "Validasi gagal. Periksa kembali isian formulir.",
      errors: validated.error.flatten().fieldErrors,
    };
  }

  const { id, name, severity, description } = validated.data;

  try {
    const existing = await prisma.securityCategory.findUnique({
      where: { id },
    });

    if (!existing) {
      return {
        success: false,
        message: "Kategori keamanan yang ingin diperbarui tidak ditemukan.",
      };
    }

    // Periksa apakah nama sudah digunakan oleh kategori lain
    const duplicate = await prisma.securityCategory.findFirst({
      where: {
        name,
        NOT: { id },
      },
    });

    if (duplicate) {
      return {
        success: false,
        message: `Nama kategori "${name}" sudah digunakan oleh kategori lain.`,
        errors: {
          name: ["Nama kategori sudah digunakan. Gunakan nama lain."],
        },
      };
    }

    const updated = await prisma.securityCategory.update({
      where: { id },
      data: {
        name,
        severity,
        description: description || null,
      },
    });

    revalidatePath("/categories");
    revalidatePath("/check-url");
    revalidatePath("/history");

    return {
      success: true,
      message: `Kategori "${updated.name}" berhasil diperbarui.`,
      data: updated,
    };
  } catch (error) {
    console.error("Gagal memperbarui kategori:", error);
    return {
      success: false,
      message: "Terjadi kesalahan internal server saat memperbarui kategori.",
    };
  }
}

export async function deleteCategory(id: number): Promise<CategoryActionState> {
  const session = await verifySession();
  if (!session) {
    return {
      success: false,
      message: "Sesi tidak valid atau telah berakhir. Silakan login kembali.",
    };
  }

  if (typeof id !== "number" || isNaN(id) || id <= 0) {
    return {
      success: false,
      message: "ID kategori tidak valid.",
    };
  }

  try {
    // Periksa relasi referensial sebelum menghapus
    const inspectionCount = await prisma.urlInspection.count({
      where: { categoryId: id },
    });

    if (inspectionCount > 0) {
      return {
        success: false,
        message: `Kategori tidak dapat dihapus karena masih terkait dengan ${inspectionCount} catatan inspeksi URL (Restricted). Hapus atau pindahkan inspeksi terkait terlebih dahulu.`,
      };
    }

    const deleted = await prisma.securityCategory.delete({
      where: { id },
    });

    revalidatePath("/categories");
    revalidatePath("/check-url");
    revalidatePath("/history");

    return {
      success: true,
      message: `Kategori "${deleted.name}" berhasil dihapus.`,
      data: deleted,
    };
  } catch (error: any) {
    if (error.code === "P2003") {
      return {
        success: false,
        message:
          "Penghapusan ditolak oleh basis data: integritas relasional terpenuhi (Foreign Key Constraint Restrict).",
      };
    }
    console.error("Gagal menghapus kategori:", error);
    return {
      success: false,
      message: "Terjadi kesalahan server saat menghapus kategori.",
    };
  }
}

