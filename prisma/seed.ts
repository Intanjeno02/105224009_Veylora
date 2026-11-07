import { prisma } from "../lib/prisma-seed";
import { hashPassword } from "../lib/password-hashing";

async function main() {
  console.log("🌱 Memulai seeding database Veylora (data sintetis)...");

  // 1. Seed Security Categories (Entitas 1)
  const categoriesData = [
    {
      id: 1,
      name: "Phishing",
      severity: "HIGH",
      description:
        "Situs tiruan yang mencoba mencuri kredensial login, kata sandi, atau data keuangan.",
    },
    {
      id: 2,
      name: "Malware & Ransomware",
      severity: "CRITICAL",
      description:
        "Tautan unduhan payload berbahaya, script injeksi, atau perangkat perusak sistem.",
    },
    {
      id: 3,
      name: "Punycode & Spoofing",
      severity: "MEDIUM",
      description:
        "Domain menggunakan karakter Unicode tersembunyi untuk mengelabui mata pengguna.",
    },
    {
      id: 4,
      name: "Form Login Tidak Aman",
      severity: "MEDIUM",
      description:
        "Halaman autentikasi atau formulir pengisian data sensitif tanpa enkripsi HTTPS.",
    },
    {
      id: 5,
      name: "Situs Tepercaya & Aman",
      severity: "LOW",
      description:
        "Domain terverifikasi dengan reputasi bersih dan konfigurasi keamanan tepat.",
    },
  ];

  for (const cat of categoriesData) {
    await prisma.securityCategory.upsert({
      where: { id: cat.id },
      update: {
        name: cat.name,
        severity: cat.severity,
        description: cat.description,
      },
      create: {
        id: cat.id,
        name: cat.name,
        severity: cat.severity,
        description: cat.description,
      },
    });
  }

  console.log(`✅ ${categoriesData.length} Kategori Keamanan berhasil di-seed.`);

  // 2. Seed User Sintetis
  const demoUsername = "demouser_veylora";
  let demoUser = await prisma.user.findUnique({
    where: { username: demoUsername },
  });

  if (!demoUser) {
    const passwordHash = await hashPassword("VeyloraDemo2026!#Secure");
    demoUser = await prisma.user.create({
      data: {
        username: demoUsername,
        passwordHash,
        settings: {
          create: {
            displayName: "Pengguna Demonstrasi",
            notifications: true,
          },
        },
      },
    });
    console.log(`✅ Akun sintetis '${demoUsername}' berhasil dibuat.`);
  }

  // 3. Seed URL Inspections (Entitas 2)
  const inspectionsData = [
    {
      id: "insp_synthetic_001",
      url: "https://login-bank-verification.com/auth",
      domain: "login-bank-verification.com",
      status: "Mencurigakan",
      reasons: [
        "Nama domain mengandung kata yang sering digunakan pada halaman phishing.",
        "Sertifikat TLS baru diterbitkan kurang dari 24 jam.",
      ],
      notes: "Terdeteksi upaya spoofing portal autentikasi perbankan.",
      categoryId: 1, // Phishing
      userId: demoUser.id,
    },
    {
      id: "insp_synthetic_002",
      url: "http://update-system-patch.net/setup.exe",
      domain: "update-system-patch.net",
      status: "Mencurigakan",
      reasons: [
        "URL tidak menggunakan protokol HTTPS.",
        "Tautan langsung mengunduh berkas executable (.exe).",
      ],
      notes: "Diduga trojan dropper berselubung pembaruan sistem.",
      categoryId: 2, // Malware & Ransomware
      userId: demoUser.id,
    },
    {
      id: "insp_synthetic_003",
      url: "https://xn--pple-43d.com/id/verify",
      domain: "xn--pple-43d.com",
      status: "Mencurigakan",
      reasons: [
        "Domain menggunakan format Punycode.",
        "Karakter Cyrillic digunakan untuk meniru domain Apple resmi.",
      ],
      notes: "Serangan homograf internasional (IDN homograph attack).",
      categoryId: 3, // Punycode & Spoofing
      userId: demoUser.id,
    },
    {
      id: "insp_synthetic_004",
      url: "http://portal-internal.local/weblogin",
      domain: "portal-internal.local",
      status: "Perlu Diperiksa",
      reasons: [
        "URL tidak menggunakan protokol HTTPS.",
        "Kredensial dikirimkan dalam teks polos tanpa enkripsi transport.",
      ],
      notes: "Perlu migrasi ke HTTPS internal sebelum produksi.",
      categoryId: 4, // Form Login Tidak Aman
      userId: demoUser.id,
    },
    {
      id: "insp_synthetic_005",
      url: "https://github.com",
      domain: "github.com",
      status: "Aman",
      reasons: [
        "Domain terverifikasi memiliki sertifikat EV valid.",
        "Reputasi domain tinggi dengan proteksi HSTS aktif.",
      ],
      notes: "Platform kolaborasi kode resmi dan aman.",
      categoryId: 5, // Situs Tepercaya & Aman
      userId: demoUser.id,
    },
  ];

  for (const insp of inspectionsData) {
    await prisma.urlInspection.upsert({
      where: { id: insp.id },
      update: {
        url: insp.url,
        domain: insp.domain,
        status: insp.status,
        reasons: insp.reasons,
        notes: insp.notes,
        categoryId: insp.categoryId,
        userId: insp.userId,
      },
      create: insp,
    });
  }

  console.log(`✅ ${inspectionsData.length} Data Inspeksi URL berhasil di-seed.`);

  // Sinkronisasi sequence autoincrement PostgreSQL agar operasi INSERT/create berikutnya aman
  await prisma.$executeRawUnsafe(`
    SELECT setval(
      pg_get_serial_sequence('"SecurityCategory"', 'id'),
      COALESCE((SELECT MAX(id) FROM "SecurityCategory"), 1)
    );
  `);

  console.log("✨ Seeding selesai secara sukses!");
}

main()
  .catch((e) => {
    console.error("❌ Gagal menjalankan seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

