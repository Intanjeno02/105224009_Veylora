import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { Prisma } from "@/lib/generated/prisma/client";
import prisma from "@/lib/prisma";
import { createSession } from "@/lib/session";
import { z } from "zod";

const registerSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username minimal 3 karakter.")
    .max(30, "Username maksimal 30 karakter.")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username hanya boleh berisi huruf, angka, dan underscore."
    ),

  password: z
    .string()
    .min(8, "Password minimal 8 karakter.")
    .max(72, "Password maksimal 72 karakter."),
});

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

    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          message: validation.error.issues[0].message,
        },
        { status: 400 }
      );
    }

    const username = validation.data.username.toLowerCase();
    const password = validation.data.password;

    // Pastikan password tidak melebihi batas bcrypt
    if (Buffer.byteLength(password, "utf8") > 72) {
      return NextResponse.json(
        { message: "Ukuran password maksimal 72 byte." },
        { status: 400 }
      );
    }

    // Periksa username yang sudah terdaftar
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "Username sudah digunakan." },
        { status: 409 }
      );
    }

    // Hash password sebelum disimpan
    const passwordHash = await hash(password, 12);

    // Buat User dan UserSettings sekaligus
    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,

        settings: {
          create: {
            displayName: username,
            notifications: false,
          },
        },
      },

      select: {
        id: true,
        username: true,
      },
    });

    // Buat session pengguna
    await createSession(user.id);

    return NextResponse.json(
      {
        message: "Registrasi berhasil.",
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { message: "Username sudah digunakan." },
        { status: 409 }
      );
    }

    console.error("Register error:", error);

    return NextResponse.json(
      { message: "Terjadi kesalahan pada server." },
      { status: 500 }
    );
  }
}