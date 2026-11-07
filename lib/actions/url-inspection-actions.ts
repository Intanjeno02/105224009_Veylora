"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { verifySession } from "@/lib/session";
import {
  createUrlInspectionSchema,
  updateUrlInspectionSchema,
} from "@/lib/schemas/url-inspection-schema";

export type InspectionActionState = {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
  data?: any;
};

// Algoritma analisis heuristik keamanan URL di sisi server
function runServerUrlAnalysis(rawUrl: string): {
  domain: string;
  status: "Mencurigakan" | "Perlu Diperiksa";
  reasons: string[];
} {
  const parsed = new URL(rawUrl);
  const hostname = parsed.hostname.toLowerCase();
  const reasons: string[] = [];

  if (parsed.protocol !== "https:") {
    reasons.push("URL tidak menggunakan protokol aman HTTPS (indikator risiko MITM).");
  }

  if (parsed.username || parsed.password) {
    reasons.push("URL memuat kredensial inline (user/password). Potensi eksploitasi otentikasi.");
  }

  if (hostname.startsWith("xn--") || hostname.includes(".xn--")) {
    reasons.push("Domain menggunakan encoding Punycode/IDN (indikator serangan Homograph/Spoofing).");
  }

  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) {
    reasons.push("URL langsung menunjuk ke alamat IP mentah alih-alih nama domain resmi.");
  }

  const suspiciousKeywords = [
    "login",
    "verify",
    "account",
    "banking",
    "secure-update",
    "wallet",
    "password",
    "confirm",
  ];

  for (const kw of suspiciousKeywords) {
    if (hostname.includes(kw) || parsed.pathname.toLowerCase().includes(kw)) {
      reasons.push(
        `Ditemukan kata kunci berisiko tinggi '${kw}' yang sering digunakan dalam kampanye Phishing.`
      );
      break;
    }
  }

  if (reasons.length > 0) {
    return {
      domain: hostname,
      status: "Mencurigakan",
      reasons,
    };
  }

  return {
    domain: hostname,
    status: "Perlu Diperiksa",
    reasons: [
      "Tidak ditemukan indikator ancaman langsung dari heuristik pola domain.",
      "Tetap waspada dan jangan memasukkan informasi rahasia jika asal tautan meragukan.",
    ],
  };
}

export async function createUrlInspection(
  prevState: InspectionActionState,
  formData: FormData
): Promise<InspectionActionState> {
  const session = await verifySession();
  if (!session) {
    return {
      success: false,
      message: "Sesi tidak valid atau telah kedaluwarsa. Silakan login kembali.",
    };
  }

  const rawData = {
    url: formData.get("url"),
    categoryId: formData.get("categoryId"),
    notes: formData.get("notes"),
  };

  const validated = createUrlInspectionSchema.safeParse(rawData);
  if (!validated.success) {
    return {
      success: false,
      message: "Validasi gagal. Periksa kembali format URL dan kategori pilihan.",
      errors: validated.error.flatten().fieldErrors,
    };
  }

  const { url, categoryId, notes } = validated.data;

  try {
    // Pastikan kategori keamanan yang dipilih ada di basis data
    const categoryExists = await prisma.securityCategory.findUnique({
      where: { id: categoryId },
    });

    if (!categoryExists) {
      return {
        success: false,
        message: "Kategori keamanan yang dipilih tidak ditemukan dalam sistem.",
        errors: {
          categoryId: ["Pilih kategori keamanan yang terdaftar."],
        },
      };
    }

    // Jalankan analisis heuristik di sisi server
    const analysis = runServerUrlAnalysis(url);

    const inspection = await prisma.urlInspection.create({
      data: {
        url,
        domain: analysis.domain,
        status: analysis.status,
        reasons: analysis.reasons,
        notes: notes || null,
        categoryId,
        userId: session.userId,
      },
      include: {
        category: true,
      },
    });

    revalidatePath("/history");
    revalidatePath("/check-url");

    return {
      success: true,
      message: "Pemeriksaan URL berhasil dilakukan dan disimpan ke basis data.",
      data: inspection,
    };
  } catch (error) {
    console.error("Gagal menyimpan inspeksi URL:", error);
    return {
      success: false,
      message: "Terjadi kesalahan internal server saat memproses inspeksi URL.",
    };
  }
}

export async function updateUrlInspection(
  prevState: InspectionActionState,
  formData: FormData
): Promise<InspectionActionState> {
  const session = await verifySession();
  if (!session) {
    return {
      success: false,
      message: "Sesi tidak valid atau telah kedaluwarsa. Silakan login kembali.",
    };
  }

  const rawData = {
    id: formData.get("id"),
    categoryId: formData.get("categoryId"),
    notes: formData.get("notes"),
  };

  const validated = updateUrlInspectionSchema.safeParse(rawData);
  if (!validated.success) {
    return {
      success: false,
      message: "Validasi gagal. Periksa data yang dimasukkan.",
      errors: validated.error.flatten().fieldErrors,
    };
  }

  const { id, categoryId, notes } = validated.data;

  try {
    const existing = await prisma.urlInspection.findUnique({
      where: { id },
    });

    if (!existing) {
      return {
        success: false,
        message: "Data inspeksi URL tidak ditemukan.",
      };
    }

    if (existing.userId !== session.userId) {
      return {
        success: false,
        message: "Otorisasi ditolak: Anda tidak memiliki akses ke data ini.",
      };
    }

    const updated = await prisma.urlInspection.update({
      where: { id },
      data: {
        categoryId,
        notes: notes || null,
      },
      include: {
        category: true,
      },
    });

    revalidatePath(`/history/${id}`);
    revalidatePath("/history");

    return {
      success: true,
      message: "Data inspeksi URL berhasil diperbarui.",
      data: updated,
    };
  } catch (error) {
    console.error("Gagal memperbarui inspeksi URL:", error);
    return {
      success: false,
      message: "Terjadi kesalahan server saat memperbarui data inspeksi.",
    };
  }
}

export async function deleteUrlInspection(id: string): Promise<InspectionActionState> {
  const session = await verifySession();
  if (!session) {
    return {
      success: false,
      message: "Sesi tidak valid atau telah kedaluwarsa. Silakan login kembali.",
    };
  }

  if (!id || typeof id !== "string") {
    return {
      success: false,
      message: "ID inspeksi tidak valid.",
    };
  }

  try {
    const existing = await prisma.urlInspection.findUnique({
      where: { id },
    });

    if (!existing) {
      return {
        success: false,
        message: "Data inspeksi URL tidak ditemukan.",
      };
    }

    if (existing.userId !== session.userId) {
      return {
        success: false,
        message: "Otorisasi ditolak: Anda tidak memiliki izin menghapus data ini.",
      };
    }

    const deleted = await prisma.urlInspection.delete({
      where: { id },
    });

    revalidatePath("/history");

    return {
      success: true,
      message: "Data inspeksi URL berhasil dihapus dari basis data.",
      data: deleted,
    };
  } catch (error) {
    console.error("Gagal menghapus inspeksi URL:", error);
    return {
      success: false,
      message: "Terjadi kesalahan server saat menghapus data inspeksi.",
    };
  }
}

