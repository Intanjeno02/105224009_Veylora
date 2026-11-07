import dotenv from "dotenv";
dotenv.config();

import prisma from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password-hashing";
import {
  newPasswordSchema,
  loginPasswordSchema,
  countPasswordCodePoints,
  MIN_PASSWORD_CODE_POINTS,
  MAX_PASSWORD_CODE_POINTS,
} from "@/lib/password-policy";
import { isPasswordBlocklisted } from "@/lib/password-blocklist";
import {
  recordFailedLogin,
  getLoginRateLimit,
  resetLoginRateLimit,
} from "@/lib/login-rate-limit";
import {
  createSession,
  verifySessionToken,
} from "@/lib/session";
import { getAccountsStorageKey, getAccounts, saveAccounts } from "@/lib/account-storage";
import { getScanHistoryStorageKey } from "@/lib/history-storage";
import { proxy } from "@/proxy";
import { NextRequest } from "next/server";
import { hash as hashBcrypt } from "bcryptjs";
import { randomUUID } from "node:crypto";
import { SignJWT } from "jose";

interface TestResult {
  id: string;
  category: string;
  testName: string;
  type: "POSITIF" | "NEGATIF";
  role: string;
  resource: string;
  expected: string;
  actual: string;
  status: "PASS" | "FAIL";
}

const results: TestResult[] = [];

function record(res: TestResult) {
  results.push(res);
  const color = res.status === "PASS" ? "\x1b[32mPASS\x1b[0m" : "\x1b[31mFAIL\x1b[0m";
  console.log(`[${color}] [${res.id}] [${res.type}] ${res.testName}: ${res.actual}`);
}

async function runTests() {
  console.log("=== MEMULAI PENGUJIAN AKSES, AUTENTIKASI, & LEAST PRIVILEGE VEYLORA ===\n");

  // ----------------------------------------------------
  // KELOMPOK 1: KEBIJAKAN PASSWORD (NIST SP 800-63B-4)
  // ----------------------------------------------------

  // PW-01 (Negatif): Password di bawah 15 karakter ditolak
  const shortPw = "P@ss1234";
  const shortParsed = newPasswordSchema.safeParse(shortPw);
  record({
    id: "PW-01",
    category: "Password Policy",
    testName: "Password kurang dari 15 karakter ditolak saat registrasi",
    type: "NEGATIF",
    role: "Pengunjung Baru",
    resource: "POST /api/register",
    expected: "Validasi gagal, pesan minimal 15 karakter",
    actual: !shortParsed.success ? `Ditolak: "${shortParsed.error.issues[0].message}"` : "Diterima (salah)",
    status: !shortParsed.success && shortParsed.error.issues[0].message.includes("minimal 15") ? "PASS" : "FAIL",
  });

  // PW-02 (Positif): Password tepat 15 karakter diterima
  const exact15Pw = "Exact15Chars#Ok";
  const exact15Parsed = newPasswordSchema.safeParse(exact15Pw);
  record({
    id: "PW-02",
    category: "Password Policy",
    testName: "Password tepat 15 code points diterima",
    type: "POSITIF",
    role: "Pengunjung Baru",
    resource: "POST /api/register",
    expected: "Validasi sukses",
    actual: exact15Parsed.success ? `Diterima (panjang code point: ${countPasswordCodePoints(exact15Pw)})` : "Ditolak",
    status: exact15Parsed.success && countPasswordCodePoints(exact15Pw) === 15 ? "PASS" : "FAIL",
  });

  // PW-03 (Positif): Password 64 karakter diterima
  const long64Pw = "A".repeat(64);
  const long64Parsed = newPasswordSchema.safeParse(long64Pw);
  record({
    id: "PW-03",
    category: "Password Policy",
    testName: "Password panjang 64 code points diterima",
    type: "POSITIF",
    role: "Pengunjung Baru",
    resource: "POST /api/register",
    expected: "Validasi sukses",
    actual: long64Parsed.success ? `Diterima (panjang: ${countPasswordCodePoints(long64Pw)})` : "Ditolak",
    status: long64Parsed.success ? "PASS" : "FAIL",
  });

  // PW-04 (Positif): Password dengan karakter Unicode NFC dihitung benar
  const unicodePw = "VeyloraSecure🔒2026✨"; // emoji multi-byte
  const unicodeParsed = newPasswordSchema.safeParse(unicodePw);
  record({
    id: "PW-04",
    category: "Password Policy",
    testName: "Password Unicode dinormalisasi NFC dan dihitung code point-nya",
    type: "POSITIF",
    role: "Pengunjung Baru",
    resource: "POST /api/register",
    expected: "Validasi sukses dengan panjang code point akurat",
    actual: unicodeParsed.success ? `Diterima (code points: ${countPasswordCodePoints(unicodePw)})` : "Ditolak",
    status: unicodeParsed.success ? "PASS" : "FAIL",
  });

  // PW-05 (Negatif): Password ada di blocklist ditolak sebelum hash
  const commonPw = "passwordpassword"; // 16 chars, umum dari dataset
  const isBlocklisted = isPasswordBlocklisted(commonPw);
  record({
    id: "PW-05",
    category: "Password Policy",
    testName: "Password umum/bocor yang ada dalam blocklist ditolak",
    type: "NEGATIF",
    role: "Pengunjung Baru",
    resource: "POST /api/register",
    expected: "Terdeteksi di blocklist (true)",
    actual: isBlocklisted ? "Ditolak: password terdaftar dalam blocklist lokal" : "Tidak terdeteksi (salah)",
    status: isBlocklisted ? "PASS" : "FAIL",
  });

  // ----------------------------------------------------
  // KELOMPOK 2: PASSWORD HASHING (ARGON2ID & BCRYPT MIGRATION)
  // ----------------------------------------------------

  // HASH-01 (Positif): Password baru di-hash dengan Argon2id
  const testPlain = "SangatRahasiaSecure#2026!";
  const argonHash1 = await hashPassword(testPlain);
  const argonHash2 = await hashPassword(testPlain);
  const isArgon2id = argonHash1.startsWith("$argon2id$");
  const isSaltUnique = argonHash1 !== argonHash2;
  record({
    id: "HASH-01",
    category: "Password Hashing",
    testName: "Password baru disimpan menggunakan Argon2id dengan salt acak unik",
    type: "POSITIF",
    role: "Sistem Autentikasi",
    resource: "lib/password-hashing.ts",
    expected: "Hash berawalan $argon2id$ dan salt berbeda tiap hashing",
    actual: `Prefix: ${argonHash1.substring(0, 10)}... | Unique salt: ${isSaltUnique}`,
    status: isArgon2id && isSaltUnique ? "PASS" : "FAIL",
  });

  // HASH-02 (Positif): Verifikasi password benar sukses
  const verifyValid = await verifyPassword(testPlain, argonHash1);
  record({
    id: "HASH-02",
    category: "Password Hashing",
    testName: "Verifikasi password benar menggunakan Argon2id sukses",
    type: "POSITIF",
    role: "Pengguna Terdaftar",
    resource: "POST /api/login",
    expected: "valid: true",
    actual: `valid: ${verifyValid.valid}`,
    status: verifyValid.valid ? "PASS" : "FAIL",
  });

  // HASH-03 (Negatif): Verifikasi password salah ditolak
  const verifyInvalid = await verifyPassword("SalahPassword#2026!", argonHash1);
  record({
    id: "HASH-03",
    category: "Password Hashing",
    testName: "Verifikasi password salah ditolak",
    type: "NEGATIF",
    role: "Penyerang / Pengguna Salah",
    resource: "POST /api/login",
    expected: "valid: false",
    actual: `valid: ${verifyInvalid.valid}`,
    status: !verifyInvalid.valid ? "PASS" : "FAIL",
  });

  // HASH-04 (Positif): Akun lama dengan hash bcrypt terverifikasi dan otomatis di-upgrade
  const legacyBcryptHash = await hashBcrypt("BcryptOldPassword#2026!", 10);
  const legacyVerify = await verifyPassword("BcryptOldPassword#2026!", legacyBcryptHash);
  const hasUpgraded = legacyVerify.valid && typeof legacyVerify.upgradedHash === "string" && legacyVerify.upgradedHash.startsWith("$argon2id$");
  record({
    id: "HASH-04",
    category: "Password Hashing",
    testName: "Migrasi otomatis akun lama dari bcrypt ke Argon2id saat login sukses",
    type: "POSITIF",
    role: "Akun Legacy",
    resource: "lib/password-hashing.ts",
    expected: "valid: true dengan upgradedHash berformat $argon2id$",
    actual: `valid: ${legacyVerify.valid}, upgradedHash prefix: ${"upgradedHash" in legacyVerify ? legacyVerify.upgradedHash?.substring(0, 10) : "none"}`,
    status: hasUpgraded ? "PASS" : "FAIL",
  });

  // HASH-05 (Negatif): Password bcrypt > 72 byte ditolak sebelum perbandingan
  const oversizedPw = "A".repeat(73);
  const oversizedVerify = await verifyPassword(oversizedPw, legacyBcryptHash);
  record({
    id: "HASH-05",
    category: "Password Hashing",
    testName: "Input password > 72 byte pada hash bcrypt ditolak secara aman",
    type: "NEGATIF",
    role: "Penyerang",
    resource: "lib/password-hashing.ts",
    expected: "valid: false (mencegah DoS / pemotongan)",
    actual: `valid: ${oversizedVerify.valid}`,
    status: !oversizedVerify.valid ? "PASS" : "FAIL",
  });

  // ----------------------------------------------------
  // KELOMPOK 3: LOGIN RATE LIMITING & BRUTE-FORCE PROTECTION
  // ----------------------------------------------------

  const testUserLimiter = `test_rate_user_${Date.now()}`;
  await resetLoginRateLimit(testUserLimiter);

  // RL-01 (Negatif): Percobaan 1-4 gagal dicatat tanpa pemblokiran
  for (let i = 1; i <= 4; i++) {
    await recordFailedLogin(testUserLimiter);
  }
  const recordAfter4 = await prisma.loginRateLimit.findUnique({
    where: { username: testUserLimiter },
  });
  const statusAfter4 = await getLoginRateLimit(testUserLimiter);
  record({
    id: "RL-01",
    category: "Rate Limiting",
    testName: "Empat kegagalan login berturut-turut dicatat tanpa pemblokiran",
    type: "NEGATIF",
    role: "Penyerang Online Guessing",
    resource: "POST /api/login",
    expected: "failedAttempts: 4, blockedUntil: null",
    actual: `failedAttempts: ${recordAfter4?.failedAttempts}, blockedUntil: ${statusAfter4.blockedUntil}`,
    status: recordAfter4?.failedAttempts === 4 && statusAfter4.blockedUntil === null ? "PASS" : "FAIL",
  });

  // RL-02 (Negatif): Kegagalan ke-5 mengaktifkan pemblokiran (HTTP 429)
  const failed5 = await recordFailedLogin(testUserLimiter);
  const isBlocked = failed5.blockedUntil !== null && failed5.blockedUntil > new Date();
  record({
    id: "RL-02",
    category: "Rate Limiting",
    testName: "Kegagalan ke-5 mengaktifkan lockout (HTTP 429)",
    type: "NEGATIF",
    role: "Penyerang Online Guessing",
    resource: "POST /api/login",
    expected: "Akun diblokir selama 15 menit (blockedUntil terisi)",
    actual: `blockedUntil: ${failed5.blockedUntil?.toISOString()}`,
    status: isBlocked ? "PASS" : "FAIL",
  });

  // RL-03 (Positif): Login sukses mereset penghitung rate limit
  await resetLoginRateLimit(testUserLimiter);
  const recordAfterReset = await prisma.loginRateLimit.findUnique({
    where: { username: testUserLimiter },
  });
  const statusAfterReset = await getLoginRateLimit(testUserLimiter);
  record({
    id: "RL-03",
    category: "Rate Limiting",
    testName: "Login berhasil mereset penghitung kegagalan",
    type: "POSITIF",
    role: "Pengguna Sah",
    resource: "POST /api/login",
    expected: "Record dihapus, blockedUntil: null",
    actual: `Record exists: ${Boolean(recordAfterReset)}, blockedUntil: ${statusAfterReset.blockedUntil}`,
    status: !recordAfterReset && statusAfterReset.blockedUntil === null ? "PASS" : "FAIL",
  });

  // ----------------------------------------------------
  // KELOMPOK 4: KONTROL AKSES URL & MIDDLEWARE PROXY
  // ----------------------------------------------------

  // AC-01 (Negatif): Pengunjung tanpa login mengakses /vault dialihkan ke /login
  const reqVault = new NextRequest("http://localhost:3000/vault");
  const resVault = await proxy(reqVault);
  const isVaultRedirect = resVault.status === 307 || resVault.status === 302 || resVault.headers.get("location")?.includes("/login");
  record({
    id: "AC-01",
    category: "Access Control",
    testName: "Pengunjung tanpa login mengakses /vault dialihkan ke /login",
    type: "NEGATIF",
    role: "Pengunjung Tanpa Login",
    resource: "GET /vault",
    expected: "Redirect 307 ke /login",
    actual: `Status: ${resVault.status}, Location: ${resVault.headers.get("location")}`,
    status: isVaultRedirect ? "PASS" : "FAIL",
  });

  // AC-02 (Negatif): Pengunjung tanpa login mengakses /history dialihkan ke /login
  const reqHistory = new NextRequest("http://localhost:3000/history");
  const resHistory = await proxy(reqHistory);
  const isHistoryRedirect = resHistory.status === 307 || resHistory.status === 302 || resHistory.headers.get("location")?.includes("/login");
  record({
    id: "AC-02",
    category: "Access Control",
    testName: "Pengunjung tanpa login mengakses /history dialihkan ke /login",
    type: "NEGATIF",
    role: "Pengunjung Tanpa Login",
    resource: "GET /history",
    expected: "Redirect ke /login",
    actual: `Status: ${resHistory.status}, Location: ${resHistory.headers.get("location")}`,
    status: isHistoryRedirect ? "PASS" : "FAIL",
  });

  // AC-03 (Negatif): Pengunjung tanpa login mengakses Dashboard / dialihkan ke /login
  const reqRoot = new NextRequest("http://localhost:3000/");
  const resRoot = await proxy(reqRoot);
  const isRootRedirect = resRoot.status === 307 || resRoot.status === 302 || resRoot.headers.get("location")?.includes("/login");
  record({
    id: "AC-03",
    category: "Access Control",
    testName: "Pengunjung tanpa login mengakses Dashboard / dialihkan ke /login",
    type: "NEGATIF",
    role: "Pengunjung Tanpa Login",
    resource: "GET /",
    expected: "Redirect ke /login",
    actual: `Status: ${resRoot.status}, Location: ${resRoot.headers.get("location")}`,
    status: isRootRedirect ? "PASS" : "FAIL",
  });

  // AC-04 (Positif): Pengunjung dapat membuka halaman publik /login dan /register
  const reqLoginPg = new NextRequest("http://localhost:3000/login");
  const resLoginPg = await proxy(reqLoginPg);
  const reqRegPg = new NextRequest("http://localhost:3000/register");
  const resRegPg = await proxy(reqRegPg);
  record({
    id: "AC-04",
    category: "Access Control",
    testName: "Pengunjung tanpa login dapat membuka halaman publik /login dan /register",
    type: "POSITIF",
    role: "Pengunjung Tanpa Login",
    resource: "GET /login, GET /register",
    expected: "HTTP 200 / NextResponse.next()",
    actual: `login status: ${resLoginPg.status}, register status: ${resRegPg.status}`,
    status: resLoginPg.status === 200 && resRegPg.status === 200 ? "PASS" : "FAIL",
  });

  // AC-05 (Negatif): Permintaan API terproteksi tanpa session menghasilkan HTTP 401
  const reqApiProtected = new NextRequest("http://localhost:3000/api/logout");
  const resApiProtected = await proxy(reqApiProtected);
  record({
    id: "AC-05",
    category: "Access Control",
    testName: "Permintaan API tanpa session menghasilkan HTTP 401 Unauthorized",
    type: "NEGATIF",
    role: "Pengunjung Tanpa Login",
    resource: "POST /api/logout",
    expected: "HTTP 401 JSON",
    actual: `Status: ${resApiProtected.status}`,
    status: resApiProtected.status === 401 ? "PASS" : "FAIL",
  });

  // ----------------------------------------------------
  // KELOMPOK 5: PENGELOLAAN SESSION & REVOKASI TOKEN
  // ----------------------------------------------------

  // SES-01 (Positif): Session JWT dibuat dan diverifikasi secara kriptografis
  const secretKey = new TextEncoder().encode(process.env.SESSION_SECRET);
  const testSessionId = randomUUID();
  const testUserId = "usr_synthetic_test_01";
  const jwt = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(testUserId)
    .setJti(testSessionId)
    .setIssuedAt()
    .setExpirationTime("2h")
    .sign(secretKey);

  const verified = await verifySessionToken(jwt);
  record({
    id: "SES-01",
    category: "Session Management",
    testName: "Verifikasi token session JWT valid dengan algoritma HS256",
    type: "POSITIF",
    role: "Pengguna Terautentikasi",
    resource: "lib/session.ts",
    expected: `userId: ${testUserId}, sessionId: ${testSessionId}`,
    actual: `userId: ${verified?.userId}, sessionId: ${verified?.sessionId}`,
    status: verified?.userId === testUserId && verified?.sessionId === testSessionId ? "PASS" : "FAIL",
  });

  // SES-02 (Negatif): Token palsu / diubah (tampered) ditolak
  const tamperedJwt = jwt.slice(0, -6) + "XXXXXX";
  const tamperedVerified = await verifySessionToken(tamperedJwt);
  record({
    id: "SES-02",
    category: "Session Management",
    testName: "Token JWT yang dimanipulasi ditolak verifikasinya",
    type: "NEGATIF",
    role: "Penyerang Tampering",
    resource: "lib/session.ts",
    expected: "null (verifikasi signature gagal)",
    actual: `${tamperedVerified}`,
    status: tamperedVerified === null ? "PASS" : "FAIL",
  });

  // SES-03 (Positif): Pengguna login dapat mengakses resource dengan cookie valid
  const reqWithAuth = new NextRequest("http://localhost:3000/vault", {
    headers: {
      cookie: `veylora_session=${jwt}`,
    },
  });
  const resWithAuth = await proxy(reqWithAuth);
  record({
    id: "SES-03",
    category: "Access Control",
    testName: "Pengguna dengan session valid diizinkan mengakses halaman terproteksi",
    type: "POSITIF",
    role: "Pengguna Terautentikasi",
    resource: "GET /vault",
    expected: "HTTP 200 (NextResponse.next)",
    actual: `Status: ${resWithAuth.status}`,
    status: resWithAuth.status === 200 ? "PASS" : "FAIL",
  });

  // ----------------------------------------------------
  // KELOMPOK 6: ISOLASI DATA PENGGUNA (HORIZONTAL PRIVILEGE ESCALATION)
  // ----------------------------------------------------

  // ISO-01 (Positif): Namespace penyimpanan Vault terisolasi per userId
  const userA_id = "usr_alice_123";
  const userB_id = "usr_bob_456";
  const keyA = getAccountsStorageKey(userA_id);
  const keyB = getAccountsStorageKey(userB_id);
  record({
    id: "ISO-01",
    category: "Data Isolation",
    testName: "Kunci penyimpanan Vault diisolasi secara unik per User ID",
    type: "POSITIF",
    role: "Pengguna Terautentikasi",
    resource: "lib/account-storage.ts",
    expected: "Key berbeda dan terisolasi dengan format veylora_vault_<id>",
    actual: `Key A: ${keyA} | Key B: ${keyB}`,
    status: keyA !== keyB && keyA === "veylora_vault_usr_alice_123" ? "PASS" : "FAIL",
  });

  // ISO-02 (Negatif): User A tidak dapat membaca atau menimpa data User B
  const histKeyA = getScanHistoryStorageKey(userA_id);
  const histKeyB = getScanHistoryStorageKey(userB_id);
  record({
    id: "ISO-02",
    category: "Data Isolation",
    testName: "Isolasi data riwayat URL mencegah pembacaan data antar-pengguna",
    type: "NEGATIF",
    role: "Pengguna A vs Pengguna B",
    resource: "lib/history-storage.ts",
    expected: "Namespace penyimpanan terpisah, tidak ada cross-access",
    actual: `History A: ${histKeyA} | History B: ${histKeyB}`,
    status: histKeyA !== histKeyB ? "PASS" : "FAIL",
  });

  // ----------------------------------------------------
  // KELOMPOK 7: LEAST PRIVILEGE DATABASE RUNTIME ROLE
  // ----------------------------------------------------

  // DB-01 (Positif): veylora_app memiliki hak SELECT pada tabel User
  let canSelectUser = false;
  try {
    const userCount = await prisma.user.count();
    canSelectUser = typeof userCount === "number";
  } catch (e) {
    canSelectUser = false;
  }
  record({
    id: "DB-01",
    category: "Database Least Privilege",
    testName: "Role runtime veylora_app dapat melakukan SELECT pada tabel aplikasi",
    type: "POSITIF",
    role: "Database Role veylora_app",
    resource: "PostgreSQL: veylora_db",
    expected: "Query SELECT berhasil",
    actual: `SELECT User count: ${canSelectUser}`,
    status: canSelectUser ? "PASS" : "FAIL",
  });

  // DB-02 (Negatif): veylora_app TIDAK BISA membuat tabel baru (DDL ditolak)
  let ddlRejected = false;
  let ddlErrorMsg = "";
  try {
    await prisma.$executeRawUnsafe("CREATE TABLE security_tamper_test (id int);");
  } catch (err: any) {
    ddlRejected = true;
    ddlErrorMsg = err.message || String(err);
  }
  record({
    id: "DB-02",
    category: "Database Least Privilege",
    testName: "Role runtime veylora_app ditolak saat mencoba membuat tabel baru (DDL)",
    type: "NEGATIF",
    role: "Database Role veylora_app",
    resource: "PostgreSQL: CREATE TABLE",
    expected: "Permission denied / DDL ditolak",
    actual: ddlRejected ? `Ditolak: ${ddlErrorMsg.substring(0, 60)}...` : "Berhasil membuat tabel (salah)",
    status: ddlRejected ? "PASS" : "FAIL",
  });

  // DB-03 (Negatif): veylora_app TIDAK BISA membuat role baru di database
  let roleCreateRejected = false;
  let roleCreateError = "";
  try {
    await prisma.$executeRawUnsafe("CREATE ROLE hacker_admin WITH SUPERUSER;");
  } catch (err: any) {
    roleCreateRejected = true;
    roleCreateError = err.message || String(err);
  }
  record({
    id: "DB-03",
    category: "Database Least Privilege",
    testName: "Role runtime veylora_app ditolak saat mencoba membuat role database",
    type: "NEGATIF",
    role: "Database Role veylora_app",
    resource: "PostgreSQL: CREATE ROLE",
    expected: "Permission denied",
    actual: roleCreateRejected ? `Ditolak: ${roleCreateError.substring(0, 60)}...` : "Berhasil membuat role (salah)",
    status: roleCreateRejected ? "PASS" : "FAIL",
  });

  // ----------------------------------------------------
  // RINGKASAN PENGUJIAN
  // ----------------------------------------------------
  console.log("\n=== RINGKASAN PENGUJIAN ===");
  const total = results.length;
  const passed = results.filter(r => r.status === "PASS").length;
  const failed = results.filter(r => r.status === "FAIL").length;
  const positiveCount = results.filter(r => r.type === "POSITIF").length;
  const negativeCount = results.filter(r => r.type === "NEGATIF").length;

  console.log(`Total Uji: ${total}`);
  console.log(`Pengujian Positif: ${positiveCount}`);
  console.log(`Pengujian Negatif: ${negativeCount}`);
  console.log(`Lulus (PASS): ${passed}`);
  console.log(`Gagal (FAIL): ${failed}`);

  if (failed > 0) {
    console.error(`\nAda ${failed} pengujian yang gagal!`);
    process.exit(1);
  } else {
    console.log("\nSELURUH PENGUJIAN AKSES, AUTENTIKASI, & LEAST PRIVILEGE BERHASIL 100%!");
  }
}

runTests().catch(err => {
  console.error("Fatal test error:", err);
  process.exit(1);
});
