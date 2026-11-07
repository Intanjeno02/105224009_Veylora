"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { addScanHistory } from "@/lib/history-storage";
import { useUserId } from "@/components/UserIdContext";
import {
  createUrlInspection,
  type InspectionActionState,
} from "@/lib/actions/url-inspection-actions";

type CategoryOption = {
  id: number;
  name: string;
  severity: string;
};

const initialActionState: InspectionActionState = {
  success: false,
  message: "",
};

export default function CheckUrlForm({
  categories,
}: {
  categories: CategoryOption[];
}) {
  const userId = useUserId();
  const [url, setUrl] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number>(
    categories[0]?.id ?? 1
  );
  const [notes, setNotes] = useState("");

  const [state, formAction, isPending] = useActionState(
    async (prev: InspectionActionState, formData: FormData) => {
      const result = await createUrlInspection(prev, formData);
      return result;
    },
    initialActionState
  );

  // Sync to local storage for backward compatibility with Milestone 1
  useEffect(() => {
    if (state.success && state.data) {
      try {
        addScanHistory(userId, {
          url: state.data.url,
          status: state.data.status,
          reasons: state.data.reasons ?? [],
          checkedAt: new Date(state.data.createdAt).toISOString(),
        });
      } catch (e) {
        console.error("Gagal menyimpan ke penyimpanan lokal riwayat:", e);
      }
    }
  }, [state, userId]);

  function resetForm() {
    setUrl("");
    setNotes("");
    if (categories.length > 0) {
      setSelectedCategory(categories[0].id);
    }
  }

  return (
    <div className="space-y-8">
      <section
        aria-labelledby="url-form-title"
        className="rounded-2xl border border-purple-100 bg-white p-5 shadow-sm sm:p-8"
      >
        <div className="mb-6 flex items-start gap-4">
          <div
            aria-hidden="true"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-purple-200 bg-purple-50 text-2xl text-purple-700 shadow-sm"
          >
            ⛨
          </div>

          <div>
            <h2 id="url-form-title" className="text-xl font-bold text-purple-950">
              Periksa tautan ke basis data
            </h2>
            <p className="mt-1 text-sm text-purple-900/60">
              Masukkan URL lengkap yang ingin diperiksa. Data dan analisis akan divalidasi dengan Zod di server dan disimpan ke PostgreSQL.
            </p>
          </div>
        </div>

        <form action={formAction} noValidate className="space-y-5">
          {/* Input URL */}
          <div>
            <label
              htmlFor="url-input"
              className="mb-2 block text-sm font-medium text-purple-950/80"
            >
              URL yang akan diperiksa *
            </label>

            <input
              id="url-input"
              name="url"
              type="url"
              inputMode="url"
              autoComplete="url"
              maxLength={2048}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              aria-invalid={Boolean(state.errors?.url)}
              aria-describedby={state.errors?.url ? "url-error" : "url-help"}
              className="w-full rounded-xl border border-purple-200 bg-[#fbf9fe] px-4 py-3 text-sm text-purple-950 outline-none transition placeholder:text-purple-900/40 focus:border-purple-600 focus:bg-white focus:ring-2 focus:ring-purple-500/20 shadow-sm"
            />

            {state.errors?.url ? (
              <p
                id="url-error"
                role="alert"
                className="mt-1.5 text-xs font-medium text-rose-600"
              >
                ⚠ {state.errors.url[0]}
              </p>
            ) : (
              <p id="url-help" className="mt-1.5 text-xs text-purple-900/50">
                Gunakan format lengkap dengan skema http:// atau https://
              </p>
            )}
          </div>

          {/* Input Kategori Relasional */}
          <div>
            <label
              htmlFor="category-select"
              className="mb-2 block text-sm font-medium text-purple-950/80"
            >
              Kategori Keamanan Relasional *
            </label>

            <select
              id="category-select"
              name="categoryId"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(Number(e.target.value))}
              aria-invalid={Boolean(state.errors?.categoryId)}
              aria-describedby={state.errors?.categoryId ? "category-error" : undefined}
              className="w-full rounded-xl border border-purple-200 bg-[#fbf9fe] px-4 py-3 text-sm text-purple-950 outline-none transition focus:border-purple-600 focus:bg-white focus:ring-2 focus:ring-purple-500/20 shadow-sm"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — Tingkat {c.severity}
                </option>
              ))}
            </select>

            {state.errors?.categoryId && (
              <p
                id="category-error"
                role="alert"
                className="mt-1.5 text-xs font-medium text-rose-600"
              >
                ⚠ {state.errors.categoryId[0]}
              </p>
            )}
          </div>

          {/* Input Catatan Opsional */}
          <div>
            <label
              htmlFor="notes-input"
              className="mb-2 block text-sm font-medium text-purple-950/80"
            >
              Catatan Investigasi / Analis (Opsional)
            </label>

            <textarea
              id="notes-input"
              name="notes"
              rows={2}
              maxLength={500}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Ditemukan dari email broadcast mencurigakan..."
              aria-invalid={Boolean(state.errors?.notes)}
              aria-describedby={state.errors?.notes ? "notes-error" : undefined}
              className="w-full rounded-xl border border-purple-200 bg-[#fbf9fe] px-4 py-2.5 text-sm text-purple-950 outline-none transition focus:border-purple-600 focus:bg-white focus:ring-2 focus:ring-purple-500/20 shadow-sm"
            />

            {state.errors?.notes && (
              <p
                id="notes-error"
                role="alert"
                className="mt-1.5 text-xs font-medium text-rose-600"
              >
                ⚠ {state.errors.notes[0]}
              </p>
            )}
          </div>

          {/* Global Alert */}
          {!state.success && state.message && (
            <div
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-700"
            >
              {state.message}
            </div>
          )}

          {/* Tombol Submit */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-xl bg-purple-700 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-purple-700/20 transition hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? "Menganalisis & Menyimpan..." : "Periksa & Simpan URL"}
            </button>

            {url && (
              <button
                type="button"
                onClick={resetForm}
                disabled={isPending}
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Reset
              </button>
            )}
          </div>
        </form>
      </section>

      {/* Tampilan Hasil Inspeksi Server */}
      {state.success && state.data && (
        <section
          aria-labelledby="result-title"
          className="rounded-2xl border border-purple-100 bg-white p-5 shadow-sm sm:p-8"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-purple-50 pb-5 mb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-600">
                  Hasil Pemeriksaan Server
                </span>
                <span className="text-xs text-slate-400">• ID: {state.data.id}</span>
              </div>
              <h3 id="result-title" className="text-xl font-bold text-purple-950 break-all">
                {state.data.url}
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  state.data.status === "Mencurigakan"
                    ? "bg-rose-100 text-rose-700 border border-rose-300"
                    : "bg-amber-100 text-amber-700 border border-amber-300"
                }`}
              >
                {state.data.status}
              </span>
              {state.data.category && (
                <span className="rounded-full bg-purple-100 border border-purple-200 px-3 py-1 text-xs font-medium text-purple-800">
                  {state.data.category.name}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-sm">
            <div className="rounded-xl bg-[#fbf9fe] p-4 border border-purple-100">
              <span className="block text-xs text-purple-900/60 font-medium mb-1">
                Domain Terdeteksi:
              </span>
              <strong className="text-purple-950 text-base">{state.data.domain}</strong>
            </div>
            <div className="rounded-xl bg-[#fbf9fe] p-4 border border-purple-100">
              <span className="block text-xs text-purple-900/60 font-medium mb-1">
                Waktu Penyimpanan Basis Data:
              </span>
              <span className="text-purple-950 font-medium">
                {new Date(state.data.createdAt).toLocaleString("id-ID")}
              </span>
            </div>
          </div>

          <div className="mb-6">
            <h4 className="text-sm font-semibold text-purple-950 mb-2">
              Hasil Analisis Aturan Heuristik Keamanan:
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-600">
              {state.data.reasons?.map((reason: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">•</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>

          {state.data.notes && (
            <div className="mb-6 rounded-xl bg-purple-50/60 p-4 border border-purple-100 text-xs text-purple-900">
              <strong className="block mb-1 font-semibold">Catatan Investigasi:</strong>
              <p className="whitespace-pre-line">{state.data.notes}</p>
            </div>
          )}

          <div className="flex gap-3">
            <Link
              href={`/history/${state.data.id}`}
              className="rounded-xl bg-purple-700 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-purple-800"
            >
              Lihat Detail Dinamis →
            </Link>
            <Link
              href="/history"
              className="rounded-xl border border-purple-200 bg-white px-4 py-2 text-xs font-semibold text-purple-700 hover:bg-purple-50"
            >
              Buka Seluruh Riwayat
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}

