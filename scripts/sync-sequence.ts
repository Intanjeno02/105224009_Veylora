import "dotenv/config";
import { prisma } from "../lib/prisma-seed";

async function syncSequence() {
  await prisma.$executeRawUnsafe(`
    SELECT setval(
      pg_get_serial_sequence('"SecurityCategory"', 'id'),
      COALESCE((SELECT MAX(id) FROM "SecurityCategory"), 1)
    );
  `);
  console.log("✅ Sequence SecurityCategory_id_seq berhasil disinkronisasi!");
}

syncSequence()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

