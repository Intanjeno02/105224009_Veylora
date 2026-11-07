import { Metadata } from "next";
import prisma from "@/lib/prisma";
import CategoryManager from "./category-manager";

export const metadata: Metadata = {
  title: "Kategori Keamanan — Veylora",
  description: "Manajemen data master kategori ancaman keamanan siber Veylora.",
};

export default async function CategoriesPage() {
  const categories = await prisma.securityCategory.findMany({
    include: {
      _count: {
        select: {
          inspections: true,
        },
      },
    },
    orderBy: {
      id: "asc",
    },
  });

  return (
    <main className="min-h-screen bg-[#f7f5fb] px-4 py-8 text-slate-800 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <p className="mb-2 text-sm font-semibold text-purple-700">
            Personal Security Assistant
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-purple-950">
            Kategori Keamanan Siber
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-purple-900/60 sm:text-base">
            Kelola klasifikasi dan tingkat keparahan ancaman keamanan (Entity Master).
            Setiap pemeriksaan URL dikaitkan dengan kategori ini dengan batasan integritas referensial.
          </p>
        </header>

        <CategoryManager initialCategories={categories} />
      </div>
    </main>
  );
}
