import "dotenv/config";
import { prisma } from "../lib/prisma-seed";
import {
  createCategorySchema,
  updateCategorySchema,
} from "../lib/schemas/security-category-schema";
import {
  createUrlInspectionSchema,
  updateUrlInspectionSchema,
} from "../lib/schemas/url-inspection-schema";

type TestResult = {
  id: string;
  category: "CRUD" | "RELATION" | "VALIDATION";
  name: string;
  expected: string;
  actual: string;
  status: "PASS" | "FAIL";
  details?: string;
};

async function runPawTests() {
  console.log("================================================================================");
  console.log("  VEYLORA — PENGUJIAN OTOMATIS TUGAS 2 PAW (MILESTONE 2 / v0.2)");
  console.log("================================================================================\n");

  const results: TestResult[] = [];

  // Ambil atau siapkan user pengujian sintetis
  let testUser = await prisma.user.findFirst({
    where: { username: "demouser_veylora" },
  });

  if (!testUser) {
    testUser = await prisma.user.create({
      data: {
        username: "demouser_veylora",
        passwordHash: "$argon2id$v=19$m=65536,t=3,p=4$syntheticHashForTesting",
      },
    });
  }

  // ============================================================================
  // BAGIAN 1: PENGUJIAN CRUD ENTITAS 1 (SecurityCategory)
  // ============================================================================

  // S01: CREATE SecurityCategory
  let createdCatId: number | null = null;
  try {
    const catName = `Test_Category_${Date.now()}`;
    const newCat = await prisma.securityCategory.create({
      data: {
        name: catName,
        severity: "HIGH",
        description: "Kategori pengujian otomatis CRUD Create.",
      },
    });
    createdCatId = newCat.id;

    results.push({
      id: "S01",
      category: "CRUD",
      name: "CREATE SecurityCategory",
      expected: "Kategori baru tersimpan di PostgreSQL dengan ID auto-increment dan severity valid.",
      actual: `Tersimpan: ID=${newCat.id}, Name="${newCat.name}", Severity=${newCat.severity}`,
      status: "PASS",
    });
  } catch (error: any) {
    results.push({
      id: "S01",
      category: "CRUD",
      name: "CREATE SecurityCategory",
      expected: "Kategori baru tersimpan di PostgreSQL.",
      actual: `Gagal: ${error.message}`,
      status: "FAIL",
    });
  }

  // S02: READ SecurityCategory
  try {
    const fetchedCat = await prisma.securityCategory.findUnique({
      where: { id: createdCatId! },
    });

    if (fetchedCat && fetchedCat.id === createdCatId) {
      results.push({
        id: "S02",
        category: "CRUD",
        name: "READ SecurityCategory",
        expected: "Data kategori berhasil dibaca kembali dari PostgreSQL berdasarkan primary key.",
        actual: `Ditemukan: ID=${fetchedCat.id}, Name="${fetchedCat.name}", Severity=${fetchedCat.severity}`,
        status: "PASS",
      });
    } else {
      results.push({
        id: "S02",
        category: "CRUD",
        name: "READ SecurityCategory",
        expected: "Data kategori ditemukan.",
        actual: "Data kategori bernilai null.",
        status: "FAIL",
      });
    }
  } catch (error: any) {
    results.push({
      id: "S02",
      category: "CRUD",
      name: "READ SecurityCategory",
      expected: "Data kategori berhasil dibaca.",
      actual: `Gagal: ${error.message}`,
      status: "FAIL",
    });
  }

  // S03: UPDATE SecurityCategory
  try {
    const updatedCat = await prisma.securityCategory.update({
      where: { id: createdCatId! },
      data: {
        severity: "CRITICAL",
        description: "Deskripsi berhasil diperbarui oleh pengujian otomatis.",
      },
    });

    if (updatedCat.severity === "CRITICAL") {
      results.push({
        id: "S03",
        category: "CRUD",
        name: "UPDATE SecurityCategory",
        expected: "Data kategori diperbarui di PostgreSQL (severity berubah ke CRITICAL).",
        actual: `Berhasil diubah: Severity=${updatedCat.severity}, Desc="${updatedCat.description}"`,
        status: "PASS",
      });
    } else {
      results.push({
        id: "S03",
        category: "CRUD",
        name: "UPDATE SecurityCategory",
        expected: "Severity menjadi CRITICAL.",
        actual: `Severity tetap ${updatedCat.severity}`,
        status: "FAIL",
      });
    }
  } catch (error: any) {
    results.push({
      id: "S03",
      category: "CRUD",
      name: "UPDATE SecurityCategory",
      expected: "Data kategori diperbarui.",
      actual: `Gagal: ${error.message}`,
      status: "FAIL",
    });
  }

  // S04: DELETE SecurityCategory (pada entitas tanpa relasi anak)
  try {
    // Buat dummy kategori sementara untuk diuji delete
    const tempCat = await prisma.securityCategory.create({
      data: {
        name: `Temp_Delete_${Date.now()}`,
        severity: "LOW",
        description: "Untuk diuji hapus.",
      },
    });

    await prisma.securityCategory.delete({
      where: { id: tempCat.id },
    });

    const checkDeleted = await prisma.securityCategory.findUnique({
      where: { id: tempCat.id },
    });

    if (!checkDeleted) {
      results.push({
        id: "S04",
        category: "CRUD",
        name: "DELETE SecurityCategory",
        expected: "Kategori tanpa relasi anak berhasil dihapus permanen dari basis data.",
        actual: `Data kategori ID=${tempCat.id} berhasil dihapus (verifikasi query bernilai null).`,
        status: "PASS",
      });
    } else {
      results.push({
        id: "S04",
        category: "CRUD",
        name: "DELETE SecurityCategory",
        expected: "Data terhapus.",
        actual: "Data masih ditemukan di basis data.",
        status: "FAIL",
      });
    }
  } catch (error: any) {
    results.push({
      id: "S04",
      category: "CRUD",
      name: "DELETE SecurityCategory",
      expected: "Kategori berhasil dihapus.",
      actual: `Gagal: ${error.message}`,
      status: "FAIL",
    });
  }

  // ============================================================================
  // BAGIAN 2: PENGUJIAN CRUD ENTITAS 2 (UrlInspection)
  // ============================================================================

  // S05: CREATE UrlInspection
  let createdInspectionId: string | null = null;
  try {
    const newInspection = await prisma.urlInspection.create({
      data: {
        url: "https://secure-login.portal-verification.test/auth",
        domain: "secure-login.portal-verification.test",
        status: "Mencurigakan",
        reasons: ["Domain memuat kata kunci login", "Menggunakan nama domain tiruan"],
        notes: "Catatan pengujian CRUD Create otomatis.",
        categoryId: createdCatId!,
        userId: testUser.id,
      },
    });
    createdInspectionId = newInspection.id;

    results.push({
      id: "S05",
      category: "CRUD",
      name: "CREATE UrlInspection",
      expected: "Inspeksi URL baru tersimpan di PostgreSQL dengan relasi categoryId dan userId yang valid.",
      actual: `Tersimpan: ID=${newInspection.id}, Domain="${newInspection.domain}", Status=${newInspection.status}`,
      status: "PASS",
    });
  } catch (error: any) {
    results.push({
      id: "S05",
      category: "CRUD",
      name: "CREATE UrlInspection",
      expected: "Inspeksi URL baru tersimpan.",
      actual: `Gagal: ${error.message}`,
      status: "FAIL",
    });
  }

  // S06: READ UrlInspection
  try {
    const fetchedInspection = await prisma.urlInspection.findUnique({
      where: { id: createdInspectionId! },
    });

    if (fetchedInspection && fetchedInspection.id === createdInspectionId) {
      results.push({
        id: "S06",
        category: "CRUD",
        name: "READ UrlInspection",
        expected: "Data inspeksi URL berhasil dibaca dari PostgreSQL berdasarkan CUID primary key.",
        actual: `Ditemukan: ID=${fetchedInspection.id}, URL="${fetchedInspection.url}", Domain=${fetchedInspection.domain}`,
        status: "PASS",
      });
    } else {
      results.push({
        id: "S06",
        category: "CRUD",
        name: "READ UrlInspection",
        expected: "Data inspeksi ditemukan.",
        actual: "Data bernilai null.",
        status: "FAIL",
      });
    }
  } catch (error: any) {
    results.push({
      id: "S06",
      category: "CRUD",
      name: "READ UrlInspection",
      expected: "Data inspeksi berhasil dibaca.",
      actual: `Gagal: ${error.message}`,
      status: "FAIL",
    });
  }

  // S07: UPDATE UrlInspection
  try {
    const updatedInspection = await prisma.urlInspection.update({
      where: { id: createdInspectionId! },
      data: {
        notes: "Catatan telah diperbarui oleh pengujian otomatis: terkonfirmasi aman.",
        status: "Perlu Diperiksa",
      },
    });

    if (updatedInspection.status === "Perlu Diperiksa") {
      results.push({
        id: "S07",
        category: "CRUD",
        name: "UPDATE UrlInspection",
        expected: "Data inspeksi berhasil diubah (status dan notes terbarui).",
        actual: `Berhasil diubah: Status=${updatedInspection.status}, Notes="${updatedInspection.notes}"`,
        status: "PASS",
      });
    } else {
      results.push({
        id: "S07",
        category: "CRUD",
        name: "UPDATE UrlInspection",
        expected: "Data terbarui.",
        actual: `Status masih ${updatedInspection.status}`,
        status: "FAIL",
      });
    }
  } catch (error: any) {
    results.push({
      id: "S07",
      category: "CRUD",
      name: "UPDATE UrlInspection",
      expected: "Data inspeksi diperbarui.",
      actual: `Gagal: ${error.message}`,
      status: "FAIL",
    });
  }

  // S08: DELETE UrlInspection
  try {
    await prisma.urlInspection.delete({
      where: { id: createdInspectionId! },
    });

    const checkDeleted = await prisma.urlInspection.findUnique({
      where: { id: createdInspectionId! },
    });

    if (!checkDeleted) {
      results.push({
        id: "S08",
        category: "CRUD",
        name: "DELETE UrlInspection",
        expected: "Data inspeksi URL berhasil dihapus secara permanen dari PostgreSQL.",
        actual: `Data ID=${createdInspectionId} berhasil dihapus (verifikasi query bernilai null).`,
        status: "PASS",
      });
    } else {
      results.push({
        id: "S08",
        category: "CRUD",
        name: "DELETE UrlInspection",
        expected: "Data inspeksi terhapus.",
        actual: "Data masih ditemukan di basis data.",
        status: "FAIL",
      });
    }
  } catch (error: any) {
    results.push({
      id: "S08",
      category: "CRUD",
      name: "DELETE UrlInspection",
      expected: "Data inspeksi terhapus.",
      actual: `Gagal: ${error.message}`,
      status: "FAIL",
    });
  }

  // ============================================================================
  // BAGIAN 3: PENGUJIAN RELASI DAN INTEGRITAS REFERENSIAL (2 Skenario)
  // ============================================================================

  // S09: Relational Read (UrlInspection join SecurityCategory)
  try {
    // Siapkan inspeksi yang terhubung ke createdCatId
    const relInspection = await prisma.urlInspection.create({
      data: {
        url: "https://bank-secure-update.phish-sample.org/login",
        domain: "bank-secure-update.phish-sample.org",
        status: "Mencurigakan",
        reasons: ["Indikator Phishing"],
        categoryId: createdCatId!,
        userId: testUser.id,
      },
      include: {
        category: true,
      },
    });

    if (
      relInspection.category &&
      relInspection.category.id === createdCatId! &&
      relInspection.category.severity === "CRITICAL"
    ) {
      results.push({
        id: "S09",
        category: "RELATION",
        name: "RELATIONAL READ (Eager Join)",
        expected: "Query UrlInspection dengan include: { category: true } berhasil memuat data relasi SecurityCategory secara utuh.",
        actual: `Berhasil dimuat: Inspection.id=${relInspection.id} -> Category="${relInspection.category.name}" (Severity: ${relInspection.category.severity})`,
        status: "PASS",
      });
    } else {
      results.push({
        id: "S09",
        category: "RELATION",
        name: "RELATIONAL READ (Eager Join)",
        expected: "Relasi kategori termuat.",
        actual: "Data relasi tidak sesuai atau null.",
        status: "FAIL",
      });
    }

    // S10: Referential Integrity Restrict (Penolakan Hapus Kategori yang Memiliki Data Anak)
    try {
      await prisma.securityCategory.delete({
        where: { id: createdCatId! },
      });

      // Jika berhasil dihapus, maka constraint Restrict gagal!
      results.push({
        id: "S10",
        category: "RELATION",
        name: "REFERENTIAL INTEGRITY (Restrict)",
        expected: "Penghapusan SecurityCategory ditolak oleh PostgreSQL karena masih memiliki data UrlInspection anak.",
        actual: "Kategori terhapus (Foreign Key constraint Restrict tidak bekerja).",
        status: "FAIL",
      });
    } catch (fkError: any) {
      // Kode P2003 adalah Prisma error untuk foreign key constraint failed
      const isConstraintError =
        fkError.code === "P2003" ||
        fkError.message.includes("Foreign key constraint failed") ||
        fkError.message.includes("violates foreign key constraint");

      if (isConstraintError) {
        results.push({
          id: "S10",
          category: "RELATION",
          name: "REFERENTIAL INTEGRITY (Restrict)",
          expected: "Penghapusan SecurityCategory ditolak oleh PostgreSQL karena masih memiliki relasi anak (onDelete: Restrict).",
          actual: `Penghapusan ditolak sesuai ekspektasi (Prisma error: ${fkError.code} - Foreign key constraint failed).`,
          status: "PASS",
        });
      } else {
        results.push({
          id: "S10",
          category: "RELATION",
          name: "REFERENTIAL INTEGRITY (Restrict)",
          expected: "Penghapusan ditolak karena constraint foreign key.",
          actual: `Error tidak terduga: ${fkError.message}`,
          status: "FAIL",
        });
      }
    }

    // Bersihkan data relInspection dan createdCatId
    await prisma.urlInspection.delete({ where: { id: relInspection.id } });
    await prisma.securityCategory.delete({ where: { id: createdCatId! } });
  } catch (error: any) {
    results.push({
      id: "S09",
      category: "RELATION",
      name: "RELATIONAL INTEGRITY TESTING",
      expected: "Pengujian relasi selesai.",
      actual: `Gagal: ${error.message}`,
      status: "FAIL",
    });
  }

  // ============================================================================
  // BAGIAN 4: PENGUJIAN VALIDASI MASUKAN SERVER DENGAN ZOD (>= 3 Skenario)
  // ============================================================================

  // V01: Penolakan URL Tidak Valid / Format Salah
  const v01Input = {
    url: "bukan-sebuah-url-valid",
    categoryId: 1,
    notes: "Uji penolakan format URL",
  };
  const v01Res = createUrlInspectionSchema.safeParse(v01Input);
  if (!v01Res.success && v01Res.error.flatten().fieldErrors.url) {
    const errorMsg = v01Res.error.flatten().fieldErrors.url![0];
    results.push({
      id: "V01",
      category: "VALIDATION",
      name: "ZOD VALIDATION: Format URL Tidak Valid",
      expected: "Input ditolak oleh Zod di sisi server dengan fieldError pada field 'url'.",
      actual: `DITOLAK. Field: 'url', Pesan: "${errorMsg}"`,
      status: "PASS",
    });
  } else {
    results.push({
      id: "V01",
      category: "VALIDATION",
      name: "ZOD VALIDATION: Format URL Tidak Valid",
      expected: "Input ditolak pada field url.",
      actual: "Input diterima secara keliru.",
      status: "FAIL",
    });
  }

  // V02: Penolakan URL Mengandung Kredensial Inline (Security Refinement)
  const v02Input = {
    url: "https://admin:SuperSecret123@secure-bank.example.com/login",
    categoryId: 1,
    notes: "Uji penolakan inline credential",
  };
  const v02Res = createUrlInspectionSchema.safeParse(v02Input);
  if (!v02Res.success && v02Res.error.flatten().fieldErrors.url) {
    const errorMsg = v02Res.error.flatten().fieldErrors.url![0];
    results.push({
      id: "V02",
      category: "VALIDATION",
      name: "ZOD VALIDATION: URL Memuat Kredensial Inline",
      expected: "Input ditolak oleh aturan superRefine Zod demi keamanan kredensial.",
      actual: `DITOLAK. Field: 'url', Pesan: "${errorMsg}"`,
      status: "PASS",
    });
  } else {
    results.push({
      id: "V02",
      category: "VALIDATION",
      name: "ZOD VALIDATION: URL Memuat Kredensial Inline",
      expected: "Input ditolak pada field url.",
      actual: "Input diterima secara keliru.",
      status: "FAIL",
    });
  }

  // V03: Penolakan Nama Kategori Kurang dari 3 Karakter
  const v03Input = {
    name: "Ab",
    severity: "HIGH",
    description: "Uji nama pendek",
  };
  const v03Res = createCategorySchema.safeParse(v03Input);
  if (!v03Res.success && v03Res.error.flatten().fieldErrors.name) {
    const errorMsg = v03Res.error.flatten().fieldErrors.name![0];
    results.push({
      id: "V03",
      category: "VALIDATION",
      name: "ZOD VALIDATION: Nama Kategori Kurang dari 3 Karakter",
      expected: "Input ditolak oleh Zod di sisi server dengan fieldError pada field 'name'.",
      actual: `DITOLAK. Field: 'name', Pesan: "${errorMsg}"`,
      status: "PASS",
    });
  } else {
    results.push({
      id: "V03",
      category: "VALIDATION",
      name: "ZOD VALIDATION: Nama Kategori Kurang dari 3 Karakter",
      expected: "Input ditolak pada field name.",
      actual: "Input diterima secara keliru.",
      status: "FAIL",
    });
  }

  // ============================================================================
  // RINGKASAN & STATISTIK HASIL PENGUJIAN
  // ============================================================================

  console.log("--------------------------------------------------------------------------------");
  console.log("HASIL EKSEKUSI PENGUJIAN SKENARIO (CRUD & INTEGRITAS DATA):");
  console.log("--------------------------------------------------------------------------------");
  const crudAndRelTests = results.filter((r) => r.category !== "VALIDATION");
  crudAndRelTests.forEach((r) => {
    console.log(`[${r.status}] ${r.id} - ${r.name}`);
    console.log(`       Ekspektasi : ${r.expected}`);
    console.log(`       Aktual     : ${r.actual}\n`);
  });

  console.log("--------------------------------------------------------------------------------");
  console.log("HASIL EKSEKUSI PENGUJIAN VALIDASI SISI SERVER (ZOD FIELD ERRORS):");
  console.log("--------------------------------------------------------------------------------");
  const valTests = results.filter((r) => r.category === "VALIDATION");
  valTests.forEach((r) => {
    console.log(`[${r.status}] ${r.id} - ${r.name}`);
    console.log(`       Ekspektasi : ${r.expected}`);
    console.log(`       Aktual     : ${r.actual}\n`);
  });

  const totalCrudRel = crudAndRelTests.length;
  const passedCrudRel = crudAndRelTests.filter((r) => r.status === "PASS").length;
  const passRateCrudRel = (passedCrudRel / totalCrudRel) * 100;

  const totalVal = valTests.length;
  const passedVal = valTests.filter((r) => r.status === "PASS").length;

  console.log("================================================================================");
  console.log(`TOTAL SKENARIO CRUD & RELASI : ${passedCrudRel} / ${totalCrudRel} LULUS (${passRateCrudRel.toFixed(1)}%) [Target: >= 90%]`);
  console.log(`TOTAL BUKTI VALIDASI ZOD     : ${passedVal} / ${totalVal} DITOLAK SESUAI ATURAN (100%) [Target: >= 3]`);
  console.log("================================================================================");

  if (passedCrudRel >= 9 && passedVal >= 3) {
    console.log("KESIMPULAN: SELURUH KRITERIA PENGUJIAN TUGAS 2 PAW TERPENUHI (PASS)");
    process.exit(0);
  } else {
    console.error("KESIMPULAN: PENGUJIAN BELUM MEMENUHI AMBANG MINIMAL (FAIL)");
    process.exit(1);
  }
}

runPawTests()
  .catch((e) => {
    console.error("FATAL ERROR dalam eksekusi pengujian:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

