import { Metadata } from "next";
import prisma from "@/lib/prisma";
import HistoryList from "./history-list";

export const metadata: Metadata = {
  title: "Riwayat Pemeriksaan — Veylora",
  description: "Daftar riwayat pemeriksaan URL tersimpan dalam basis data PostgreSQL.",
};

export default async function HistoryPage() {
  const [inspections, categories] = await Promise.all([
    prisma.urlInspection.findMany({
      include: {
        category: {
          select: {
            id: true,
            name: true,
            severity: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.securityCategory.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
  ]);

  return (
    <main className="min-h-screen bg-[#f7f5fb] px-4 py-8 text-slate-800 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8">
          <p className="mb-2 text-sm font-semibold text-purple-700">
            Personal Security Assistant
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-purple-950">
            Riwayat Pemeriksaan URL
          </h1>

          <p className="mt-2 text-sm leading-relaxed text-purple-900/60">
            Daftar pemeriksaan URL yang tersimpan secara persisten di database PostgreSQL,
            terhubung dengan entitas relasional Kategori Keamanan.
          </p>
        </header>

        <HistoryList inspections={inspections} categories={categories} />
      </div>
    </main>
  );
}
