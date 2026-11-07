import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createSession } from "@/lib/session";
import { loginPasswordSchema } from "@/lib/password-policy";
import { verifyPassword } from "@/lib/password-hashing";
import {
  getLoginRateLimit,
  getRetryAfterSeconds,
  LoginRateLimitStorageError,
  recordFailedLogin,
  resetLoginRateLimit,
} from "@/lib/login-rate-limit";
import { z } from "zod";

const loginSchema = z.object({
  username: z.string().trim().min(1, "Username wajib diisi."),
  password: loginPasswordSchema,
});

function tooManyLoginAttempts(blockedUntil: Date) {
  return NextResponse.json(
    {
      message:
        "Terlalu banyak percobaan login. Silakan coba lagi setelah beberapa menit.",
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(getRetryAfterSeconds(blockedUntil)),
      },
    }
  );
}

export async function POST(request: Request) {
  try {
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { message: "Format data tidak valid." },
        { status: 400 }
      );
    }

    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const username = validation.data.username.toLowerCase();
    const password = validation.data.password;

    const rateLimit = await getLoginRateLimit(username);

    if (rateLimit.blockedUntil) {
      return tooManyLoginAttempts(rateLimit.blockedUntil);
    }

    // Cari pengguna berdasarkan username
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      const failedAttempt = await recordFailedLogin(username);

      if (failedAttempt.blockedUntil) {
        return tooManyLoginAttempts(failedAttempt.blockedUntil);
      }

      return NextResponse.json(
        { message: "Username atau password salah." },
        { status: 401 }
      );
    }

    const verification = await verifyPassword(password, user.passwordHash);

    if (!verification.valid) {
      const failedAttempt = await recordFailedLogin(username);

      if (failedAttempt.blockedUntil) {
        return tooManyLoginAttempts(failedAttempt.blockedUntil);
      }

      return NextResponse.json(
        { message: "Username atau password salah." },
        { status: 401 }
      );
    }

    if (verification.upgradedHash) {
      const migration = await prisma.user.updateMany({
        where: {
          id: user.id,
          passwordHash: user.passwordHash,
        },
        data: {
          passwordHash: verification.upgradedHash,
        },
      });

      if (migration.count === 0) {
        const latestUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { passwordHash: true },
        });

        if (!latestUser) {
          return NextResponse.json(
            { message: "Username atau password salah." },
            { status: 401 }
          );
        }

        const latestVerification = await verifyPassword(
          password,
          latestUser.passwordHash
        );

        if (!latestVerification.valid) {
          return NextResponse.json(
            { message: "Username atau password salah." },
            { status: 401 }
          );
        }
      }
    }

    await resetLoginRateLimit(username);

    // Buat session pengguna
    await createSession(user.id);

    return NextResponse.json(
      {
        message: "Login berhasil.",
        user: {
          id: user.id,
          username: user.username,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof LoginRateLimitStorageError) {
      console.error("Login rate limit storage error:", error.cause);

      return NextResponse.json(
        { message: "Login tidak dapat diproses saat ini. Silakan coba lagi." },
        { status: 503 }
      );
    }

    console.error("Login error:", error);

    return NextResponse.json(
      { message: "Terjadi kesalahan pada server." },
      { status: 500 }
    );
  }
}