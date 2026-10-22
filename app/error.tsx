"use client";

import { useEffect } from "react";

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

        <button
          onClick={() => reset()}
          className="mt-6 rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-500"
        >
          Coba Lagi
        </button>
      </div>
    </div>
  );
}