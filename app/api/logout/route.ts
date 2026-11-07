import { NextResponse } from "next/server";
import { deleteSession, verifySession } from "@/lib/session";

export async function POST() {
  try {
    const session = await verifySession();

    if (!session) {
      return NextResponse.json(
        { message: "Silakan login terlebih dahulu." },
        { status: 401 }
      );
    }

    await deleteSession();

    return NextResponse.json(
      {
        message: "Logout berhasil.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Logout error:", error);

    return NextResponse.json(
      {
        message: "Terjadi kesalahan saat logout.",
      },
      { status: 500 }
    );
  }
}
