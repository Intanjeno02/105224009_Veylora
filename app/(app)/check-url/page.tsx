import { Metadata } from "next";
import prisma from "@/lib/prisma";
import CheckUrlForm from "./check-url-form";

export const metadata: Metadata = {
  title: "Cek Keamanan URL — Veylora",
  description: "Periksa keamanan tautan web dan simpan ke basis data PostgreSQL terpadu.",
};

export default async function CheckUrlPage() {
  const categories = await prisma.securityCategory.findMany({
    select: {
      id: true,
      name: true,
      severity: true,
    },
    orderBy: {
      id: "asc",
    },
  });

  return (
    <main className="min-h-screen bg-[#f7f5fb] px-4 py-8 text-slate-800 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8">
          <p className="mb-2 text-sm font-semibold text-purple-700">
            Personal Security Assistant
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-purple-950">
            Cek Keamanan URL
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-purple-900/60 sm:text-base">
            Periksa indikator keamanan sebuah tautan. Hasil divalidasi oleh Zod di sisi server,
            dianalisis dengan aturan deteksi dini, dan disimpan secara persisten ke database PostgreSQL.
          </p>
        </header>

        <CheckUrlForm categories={categories} />
      </div>
    </main>
  );
}
