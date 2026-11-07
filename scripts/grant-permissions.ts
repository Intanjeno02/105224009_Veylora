import { Client } from "pg";
import dotenv from "dotenv";

dotenv.config();

async function grantPermissions() {
  const client = new Client({
    connectionString: process.env.MIGRATION_DATABASE_URL || process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    await client.query(`
      GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "SecurityCategory", "UrlInspection" TO veylora_app;
      GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO veylora_app;
    `);
    console.log("Permissions granted to veylora_app successfully.");
  } catch (err) {
    console.error("Error granting permissions:", err);
  } finally {
    await client.end();
  }
}

grantPermissions();

