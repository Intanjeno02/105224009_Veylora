"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function DynamicRouteDetailPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#08070d] px-4 py-10 text-white">
          <p className="mx-auto max-w-3xl text-sm text-slate-400">
            Memuat halaman detail...
          </p>
        </main>
      }
    >
      <DynamicRouteDetailContent />
    </Suspense>
  );
}

function DynamicRouteDetailContent() {
  const { id } = useParams<{ id: string }>();

  const isValidId =
    typeof id === "string" &&
    /^[a-zA-Z0-9_-]{1,100}$/.test(id);

  if (!isValidId) {
    return (
      <main className="relative isolate min-h-screen overflow-hidden bg-[#08070d] px-4 py-10 text-white sm:px-6">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        >
          <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />
          <div className="absolute -right-40 top-1/3 h-96 w-96 rounded-full bg-fuchsia-600/15 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:28px_28px] opacity-[0.06]" />
        </div>
        <section className="mx-auto max-w-3xl">
          <p className="mb-6 text-sm font-semibold text-violet-300">
            Veylora <span className="text-violet-500">/</span> ROUTE LAB
          </p>
          <div className="rounded-3xl border border-rose-300/15 bg-gradient-to-br from-rose-950/70 via-purple-950 to-[#11101c] p-6 shadow-2xl shadow-purple-950/30 sm:p-8">
            <p className="text-sm font-semibold text-rose-300">
              Pemeriksaan gagal
            </p>
            <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
            ID Tidak Valid
            </h1>

            <p className="mt-3 text-slate-300">
              Parameter ID tidak sesuai dengan format yang ditentukan.
            </p>

            <Link
              href="/uji-dynamic-route"
              className="mt-6 inline-flex rounded-xl bg-gradient-to-r from-blue-600 via-violet-600 to-fuchsia-600 px-5 py-3 font-semibold shadow-lg shadow-violet-950/40 transition hover:brightness-110"
            >
              Kembali ke Pengujian
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[#08070d] px-4 py-10 text-white sm:px-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="absolute -right-40 top-1/3 h-96 w-96 rounded-full bg-fuchsia-600/15 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:28px_28px] opacity-[0.06]" />
      </div>

      <section className="mx-auto max-w-3xl">
        <header className="mb-6 flex items-center justify-between gap-4">
          <p className="text-sm font-semibold text-violet-300">
            Veylora <span className="text-violet-500">/</span> ROUTE LAB
          </p>
          <Link
            href="/"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-violet-400/40 hover:bg-white/10 hover:text-white"
          >
            Dashboard
          </Link>
        </header>

        <div className="relative overflow-hidden rounded-3xl border border-violet-300/15 bg-gradient-to-br from-indigo-950 via-purple-950 to-[#11101c] p-6 shadow-2xl shadow-purple-950/30 sm:p-8">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:18px_18px] opacity-[0.08]"
          />
          <div className="relative">
            <p className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-semibold text-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
              Dynamic Routing Berhasil
            </p>

            <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
              Halaman Detail
            </h1>

            <p className="mt-3 text-slate-300">
              Halaman ini menerima parameter ID dari URL.
            </p>

            <div className="mt-7 rounded-2xl border border-white/10 bg-[#090811]/60 p-5 backdrop-blur-sm">
              <p className="text-sm font-medium text-slate-400">
                ID yang diterima
              </p>
              <p className="mt-2 break-all font-mono text-xl font-semibold text-violet-200">
                {id}
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/uji-dynamic-route"
                className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 via-violet-600 to-fuchsia-600 px-4 py-3 text-center font-semibold shadow-lg shadow-violet-950/40 transition hover:brightness-110"
              >
                Uji ID Lain
              </Link>

              <Link
                href="/"
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center font-semibold text-slate-200 transition hover:bg-white/10"
              >
                Kembali ke Dashboard
              </Link>
            </div>
          </div>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-20 -right-10 h-48 w-48 rounded-full border border-violet-300/15"
          >
            <div className="absolute inset-6 rounded-full border border-violet-300/10" />
          </div>
        </div>
      </section>
    </main>
  );
}