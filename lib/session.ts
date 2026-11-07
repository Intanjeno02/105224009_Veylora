import { randomUUID } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

const SESSION_COOKIE_NAME = "veylora_session";
const SESSION_DURATION = 60 * 60 * 24 * 7;

function getSecretKey() {
  const secret = process.env.SESSION_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET belum dikonfigurasi dengan benar.");
  }

  return new TextEncoder().encode(secret);
}

// Memverifikasi token JWT session secara kriptografis (hanya algoritma HS256)
export async function verifySessionToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: ["HS256"],
    });

    if (
      typeof payload.sub !== "string" ||
      !payload.sub ||
      typeof payload.jti !== "string" ||
      !payload.jti
    ) {
      return null;
    }

    return {
      userId: payload.sub,
      sessionId: payload.jti,
    };
  } catch {
    return null;
  }
}

// Membuat session setelah login berhasil
export async function createSession(userId: string) {
  const sessionId = randomUUID();
  const expirationTime = Math.floor(Date.now() / 1000) + SESSION_DURATION;
  const expiresAt = new Date(expirationTime * 1000);

  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setJti(sessionId)
    .setIssuedAt()
    .setExpirationTime(expirationTime)
    .sign(getSecretKey());

  await prisma.session.deleteMany({
    where: {
      expiresAt: {
        lte: new Date(),
      },
    },
  });

  await prisma.session.create({
    data: {
      id: sessionId,
      userId,
      expiresAt,
    },
  });

  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

// Memeriksa session pengguna dan memvalidasi keberadaan akun di database PostgreSQL
export async function verifySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const session = await verifySessionToken(token);
  if (!session) {
    return null;
  }

  try {
    const activeSession = await prisma.session.findUnique({
      where: { id: session.sessionId },
      select: {
        userId: true,
        expiresAt: true,
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    if (
      !activeSession ||
      activeSession.userId !== session.userId ||
      activeSession.expiresAt <= new Date()
    ) {
      return null;
    }

    return {
      userId: activeSession.user.id,
      username: activeSession.user.username,
    };
  } catch (error) {
    console.error("Database user verification error:", error);
    return null;
  }
}

// Menghapus session saat logout
export async function deleteSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    const session = await verifySessionToken(token);

    if (session) {
      await prisma.session.deleteMany({
        where: {
          id: session.sessionId,
          userId: session.userId,
        },
      });
    }
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}
