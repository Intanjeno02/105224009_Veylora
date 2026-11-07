import { notFound } from "next/navigation";
import { Metadata } from "next";
import prisma from "@/lib/prisma";
import InspectionDetailView from "./inspection-detail-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const inspection = await prisma.urlInspection.findUnique({
    where: { id },
    select: { domain: true },
  });

  if (!inspection) {
    return {
      title: "Inspeksi Tidak Ditemukan — Veylora",
    };
  }

  return {
    title: `Inspeksi ${inspection.domain} — Veylora`,
    description: `Detail investigasi dan kategori keamanan untuk domain ${inspection.domain}.`,
  };
}

export default async function HistoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [inspection, categories] = await Promise.all([
    prisma.urlInspection.findUnique({
      where: { id },
      include: {
        category: true,
      },
    }),
    prisma.securityCategory.findMany({
      orderBy: {
        name: "asc",
      },
    }),
  ]);

  if (!inspection) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#f7f5fb] px-4 py-8 text-slate-800 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-6">
          <p className="mb-1 text-sm font-semibold text-purple-700">
            Personal Security Assistant
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-purple-950">
            Detail & Penyelidikan URL
          </h1>
        </header>

        <InspectionDetailView
          inspection={inspection}
          categories={categories}
        />
      </div>
    </main>
  );
}
