"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Terjadi kesalahan pada halaman:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-red-500/20 bg-[#12101a] p-8 text-center">
        <h2 className="text-xl font-bold text-red-400">
          Terjadi Kesalahan
        </h2>

        <p className="mt-3 text-sm text-gray-300">
          Maaf, halaman gagal dimuat. Silakan coba lagi.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row justify-center">
          <button
            onClick={() => reset()}
            className="rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-500 shadow-md shadow-purple-900/30"
          >
            Coba Lagi
          </button>
          <Link
            href="/"
            className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-gray-200 transition hover:bg-white/10"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
