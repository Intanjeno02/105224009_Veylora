"use client";

import { useEffect, useMemo, useState } from "react";
import {
  clearScanHistory,
  getScanHistory,
  type ScanHistory,
} from "@/lib/history-storage";

type HistoryFilter =
  | "Semua"
  | "Mencurigakan"
  | "Perlu Diperiksa";

export default function HistoryPage() {
  const [history, setHistory] = useState<ScanHistory[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<HistoryFilter>("Semua");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setHistory(getScanHistory());
    setIsLoaded(true);
  }, []);

  const filteredHistory = useMemo(() => {
    const query = search.trim().toLowerCase();

    return history.filter((item) => {
      const matchesSearch = item.url.toLowerCase().includes(query);

      const matchesFilter =
        filter === "Semua" || item.status === filter;

      return matchesSearch && matchesFilter;
    });
  }, [history, search, filter]);

  function handleClearHistory() {
    const confirmed = window.confirm(
      "Apakah kamu yakin ingin menghapus seluruh riwayat pemeriksaan?"
    );

    if (!confirmed) {
      return;
    }

    clearScanHistory();
    setHistory([]);
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="mb-2 text-sm font-medium text-blue-400">
              Personal Security Assistant
            </p>

            <h1 className="text-3xl font-bold tracking-tight">
              Riwayat Pemeriksaan
            </h1>

            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              Lihat kembali URL yang pernah kamu periksa.
            </p>
          </div>

          {history.length > 0 && (
            <button
              type="button"
              onClick={handleClearHistory}
              className="rounded-xl border border-red-900 px-4 py-3 text-sm font-medium text-red-300 transition hover:bg-red-950/50 focus:outline-none focus:ring-2 focus:ring-red-400"
            >
              Hapus Semua Riwayat
            </button>
          )}
        </header>

        <section
          aria-labelledby="history-title"
          className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 sm:p-7"
        >
          <div className="mb-6 flex items-center justify-between gap-4">
            <h2 id="history-title" className="text-xl font-semibold">
              Daftar Riwayat
            </h2>

            <span className="rounded-full bg-zinc-800 px-3 py-1 text-sm text-zinc-300">
              {history.length} pemeriksaan
            </span>
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="history-search"
                className="mb-2 block text-sm font-medium text-zinc-300"
              >
                Cari URL
              </label>

              <input
                id="history-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari berdasarkan URL..."
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
              />
            </div>

            <div>
              <label
                htmlFor="history-filter"
                className="mb-2 block text-sm font-medium text-zinc-300"
              >
                Filter Status
              </label>

              <select
                id="history-filter"
                value={filter}
                onChange={(event) =>
                  setFilter(event.target.value as HistoryFilter)
                }
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
              >
                <option value="Semua">Semua Status</option>
                <option value="Mencurigakan">Mencurigakan</option>
                <option value="Perlu Diperiksa">
                  Perlu Diperiksa
                </option>
              </select>
            </div>
          </div>

          {!isLoaded ? (
            <p className="py-10 text-center text-sm text-zinc-400">
              Memuat riwayat...
            </p>
          ) : history.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-700 px-5 py-12 text-center">
              <div aria-hidden="true" className="mb-4 text-4xl">
                🕘
              </div>

              <h3 className="font-semibold text-zinc-200">
                Belum ada riwayat
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-zinc-400">
                Riwayat pemeriksaan URL akan muncul di sini setelah
                kamu menjalankan pemeriksaan melalui halaman Check URL.
              </p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <p className="py-10 text-center text-sm text-zinc-400">
              Tidak ada riwayat yang sesuai dengan pencarian atau filter.
            </p>
          ) : (
            <div className="space-y-3">
              {filteredHistory.map((item) => (
                <article
                  key={item.id}
                  className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 sm:p-5"
                >
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div className="min-w-0">
                      <p className="break-all text-sm font-medium text-zinc-100">
                        {item.url}
                      </p>

                      <p className="mt-2 text-xs text-zinc-500">
                        {new Date(item.checkedAt).toLocaleString("id-ID")}
                      </p>
                    </div>

                    <span
                      className={`inline-flex w-fit shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${
                        item.status === "Mencurigakan"
                          ? "border-red-800 bg-red-950/40 text-red-300"
                          : "border-amber-800 bg-amber-950/40 text-amber-300"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <ul className="mt-4 space-y-2">
                    {item.reasons.map((reason, index) => (
                      <li
                        key={`${item.id}-${index}`}
                        className="text-sm leading-relaxed text-zinc-400"
                      >
                        • {reason}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          )}
        </section>

        <p className="mt-5 text-xs leading-relaxed text-zinc-500">
          Riwayat disimpan secara lokal di browser ini. Status yang
          ditampilkan berasal dari simulasi pemeriksaan, bukan verifikasi
          keamanan situs secara menyeluruh.
        </p>
      </div>
    </main>
  );
}