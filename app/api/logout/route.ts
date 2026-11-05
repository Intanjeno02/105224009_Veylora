import { NextResponse } from "next/server";
import { deleteSession } from "@/lib/session";

export async function POST() {
  try {
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
