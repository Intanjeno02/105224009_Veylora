"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { deleteUrlInspection } from "@/lib/actions/url-inspection-actions";

type InspectionWithCategory = {
  id: string;
  url: string;
  domain: string;
  status: string;
  reasons: string[];
  notes: string | null;
  createdAt: Date;
  category: {
    id: number;
    name: string;
    severity: string;
  };
};

type CategoryOption = {
  id: number;
  name: string;
};

export default function HistoryList({
  inspections,
  categories,
}: {
  inspections: InspectionWithCategory[];
  categories: CategoryOption[];
}) {
  const [search, setSearch] = useState("");
  const [selectedCatId, setSelectedCatId] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [isDeleting, startDeleteTransition] = useTransition();
  const [alertMessage, setAlertMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const filtered = inspections.filter((item) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      q === "" ||
      item.url.toLowerCase().includes(q) ||
      item.domain.toLowerCase().includes(q) ||
      (item.notes && item.notes.toLowerCase().includes(q));

    const matchesCategory =
      selectedCatId === "all" || item.category.id.toString() === selectedCatId;

    const matchesStatus =
      selectedStatus === "all" || item.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  function handleDelete(id: string, url: string) {
    if (!window.confirm(`Hapus catatan inspeksi untuk "${url}" dari basis data?`)) {
      return;
    }

    setAlertMessage(null);
    startDeleteTransition(async () => {
      const res = await deleteUrlInspection(id);
      if (res.success) {
        setAlertMessage({ type: "success", text: res.message });
      } else {
        setAlertMessage({ type: "error", text: res.message });
      }
    });
  }

  function getSeverityClass(severity: string) {
    switch (severity) {
      case "CRITICAL":
        return "bg-rose-100 text-rose-800 border-rose-300";
      case "HIGH":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "LOW":
      default:
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
    }
  }

  return (
    <div className="space-y-6">
      {/* Alert Notifikasi */}
      {alertMessage && (
        <div
          role={alertMessage.type === "error" ? "alert" : "status"}
          className={`rounded-xl border p-4 text-sm flex items-center justify-between ${
            alertMessage.type === "error"
              ? "border-rose-200 bg-rose-50 text-rose-800"
              : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          <span>
            {alertMessage.type === "error" ? "⚠" : "✓"} {alertMessage.text}
          </span>
          <button
            onClick={() => setAlertMessage(null)}
            className="font-bold hover:opacity-75"
          >
            ×
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-purple-100 bg-white p-5 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label
              htmlFor="search-query"
              className="mb-1 block text-xs font-semibold text-purple-950"
            >
              Cari URL / Domain
            </label>
            <input
              id="search-query"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ketik domain atau kata kunci..."
              className="w-full rounded-xl border border-purple-200 bg-[#fbf9fe] px-3.5 py-2 text-sm text-purple-950 outline-none transition focus:border-purple-600 focus:bg-white"
            />
          </div>

          <div>
            <label
              htmlFor="filter-category"
              className="mb-1 block text-xs font-semibold text-purple-950"
            >
              Filter Kategori Relasional
            </label>
            <select
              id="filter-category"
              value={selectedCatId}
              onChange={(e) => setSelectedCatId(e.target.value)}
              className="w-full rounded-xl border border-purple-200 bg-[#fbf9fe] px-3.5 py-2 text-sm text-purple-950 outline-none transition focus:border-purple-600 focus:bg-white"
            >
              <option value="all">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id.toString()}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="filter-status"
              className="mb-1 block text-xs font-semibold text-purple-950"
            >
              Filter Status Deteksi
            </label>
            <select
              id="filter-status"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full rounded-xl border border-purple-200 bg-[#fbf9fe] px-3.5 py-2 text-sm text-purple-950 outline-none transition focus:border-purple-600 focus:bg-white"
            >
              <option value="all">Semua Status</option>
              <option value="Mencurigakan">Mencurigakan</option>
              <option value="Perlu Diperiksa">Perlu Diperiksa</option>
            </select>
          </div>
        </div>
      </div>

      {/* List Inspeksi */}
      <div className="rounded-2xl border border-purple-100 bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-purple-950">
            Daftar Riwayat Basis Data
          </h2>

          <span className="rounded-full bg-purple-50 border border-purple-200 px-3 py-1 text-xs font-medium text-purple-800">
            Menampilkan {filtered.length} dari {inspections.length} pemeriksaan
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm font-medium text-slate-500">
              Tidak ada data riwayat inspeksi yang sesuai dengan pencarian.
            </p>
            <Link
              href="/check-url"
              className="mt-4 inline-block rounded-xl bg-purple-700 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-purple-800"
            >
              + Periksa URL Baru
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-purple-50 space-y-4">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="pt-4 first:pt-0 flex flex-col justify-between gap-4 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                        item.status === "Mencurigakan"
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {item.status}
                    </span>

                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium border ${getSeverityClass(
                        item.category.severity
                      )}`}
                    >
                      {item.category.name}
                    </span>

                    <span className="text-xs text-purple-900/50">
                      {new Date(item.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <h3 className="font-semibold text-purple-950 break-all text-sm sm:text-base">
                    {item.url}
                  </h3>

                  <p className="text-xs text-purple-900/60 mt-1">
                    Domain: <span className="font-medium text-purple-900">{item.domain}</span>
                  </p>

                  {item.notes && (
                    <p className="mt-1 text-xs text-slate-500 italic line-clamp-1">
                      Catatan: &ldquo;{item.notes}&rdquo;
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/history/${item.id}`}
                    className="rounded-xl border border-purple-200 bg-purple-50/50 px-3 py-1.5 text-xs font-semibold text-purple-700 transition hover:bg-purple-100"
                  >
                    Detail / Ubah
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleDelete(item.id, item.url)}
                    disabled={isDeleting}
                    className="rounded-xl border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

