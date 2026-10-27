"use client";

import { useMemo, useState } from "react";
import {
  clearScanHistory,
  getScanHistory,
  type ScanHistory,
} from "@/lib/history-storage";
import { useLocalStorageValue } from "@/lib/use-local-storage-value";

const EMPTY_HISTORY: ScanHistory[] = [];
const HISTORY_STORAGE_KEY = "veylora-url-history";

type HistoryFilter =
  | "Semua"
  | "Mencurigakan"
  | "Perlu Diperiksa";

export default function HistoryPage() {
  const { value: history, isLoaded } = useLocalStorageValue(
    HISTORY_STORAGE_KEY,
    EMPTY_HISTORY,
    getScanHistory
  );
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<HistoryFilter>("Semua");

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
  }

  return (
    <main className="min-h-screen bg-[#f7f5fb] px-4 py-8 text-slate-800 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="mb-2 text-sm font-semibold text-purple-700">
              Personal Security Assistant
            </p>

            <h1 className="text-3xl font-bold tracking-tight text-purple-950">
              Riwayat Pemeriksaan
            </h1>

            <p className="mt-2 text-sm leading-relaxed text-purple-900/60">
              Lihat kembali URL yang pernah kamu periksa.
            </p>
          </div>

          {history.length > 0 && (
            <button
              type="button"
              onClick={handleClearHistory}
              className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 focus:outline-none focus:ring-2 focus:ring-rose-400"
            >
              Hapus Semua Riwayat
            </button>
          )}
        </header>

        <section
          aria-labelledby="history-title"
          className="rounded-2xl border border-purple-100 bg-white p-5 shadow-sm sm:p-7"
        >
          <div className="mb-6 flex items-center justify-between gap-4">
            <h2 id="history-title" className="text-xl font-bold text-purple-950">
              Daftar Riwayat
            </h2>

            <span className="rounded-full bg-purple-50 border border-purple-200 px-3 py-1 text-sm font-medium text-purple-800">
              {history.length} pemeriksaan
            </span>
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="history-search"
                className="mb-2 block text-sm font-medium text-purple-950/80"
              >
                Cari URL
              </label>

              <input
                id="history-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari berdasarkan URL..."
                className="w-full rounded-xl border border-purple-200 bg-[#fbf9fe] px-4 py-3 text-sm text-purple-950 placeholder-purple-900/40 outline-none focus:border-purple-600 focus:bg-white focus:ring-2 focus:ring-purple-500/20 shadow-sm transition-all"
              />
            </div>

            <div>
              <label
                htmlFor="history-filter"
                className="mb-2 block text-sm font-medium text-purple-950/80"
              >
                Filter Status
              </label>

              <select
                id="history-filter"
                value={filter}
                onChange={(event) =>
                  setFilter(event.target.value as HistoryFilter)
                }
                className="w-full rounded-xl border border-purple-200 bg-[#fbf9fe] px-4 py-3 text-sm text-purple-950 outline-none focus:border-purple-600 focus:bg-white focus:ring-2 focus:ring-purple-500/20 shadow-sm transition-all"
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
            <p className="py-10 text-center text-sm text-purple-900/50">
              Memuat riwayat...
            </p>
          ) : history.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-purple-200 bg-[#fbf9fe] px-5 py-12 text-center">
              <div aria-hidden="true" className="mb-4 text-4xl">
                🕘
              </div>

              <h3 className="font-bold text-purple-950">
                Belum ada riwayat
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-purple-900/60">
                Riwayat pemeriksaan URL akan muncul di sini setelah
                kamu menjalankan pemeriksaan melalui halaman Check URL.
              </p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <p className="py-10 text-center text-sm text-purple-900/50">
              Tidak ada riwayat yang sesuai dengan pencarian atau filter.
            </p>
          ) : (
            <div className="space-y-3">
              {filteredHistory.map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl border border-purple-100 bg-[#fbf9fe] p-4 sm:p-5 shadow-sm"
                >
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div className="min-w-0">
                      <p className="break-all text-sm font-medium text-purple-950 font-mono">
                        {item.url}
                      </p>

                      <p className="mt-2 text-xs text-purple-900/50">
                        {new Date(item.checkedAt).toLocaleString("id-ID")}
                      </p>
                    </div>

                    <span
                      className={`inline-flex w-fit shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${
                        item.status === "Mencurigakan"
                          ? "border-rose-200 bg-rose-50 text-rose-700"
                          : "border-amber-200 bg-amber-50 text-amber-800"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <ul className="mt-4 space-y-2">
                    {item.reasons.map((reason, index) => (
                      <li
                        key={`${item.id}-${index}`}
                        className="text-sm leading-relaxed text-purple-900/80"
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

        <p className="mt-5 text-xs leading-relaxed text-purple-900/50">
          Riwayat disimpan secara lokal di browser ini. Status yang
          ditampilkan berasal dari simulasi pemeriksaan, bukan verifikasi
          keamanan situs secara menyeluruh.
        </p>
      </div>
    </main>
  );
}