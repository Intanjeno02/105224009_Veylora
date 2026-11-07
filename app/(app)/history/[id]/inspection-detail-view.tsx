"use client";

import { useActionState, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  updateUrlInspection,
  deleteUrlInspection,
  type InspectionActionState,
} from "@/lib/actions/url-inspection-actions";

type CategoryOption = {
  id: number;
  name: string;
  severity: string;
  description: string | null;
};

type InspectionData = {
  id: string;
  url: string;
  domain: string;
  status: string;
  reasons: string[];
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  categoryId: number;
  category: CategoryOption;
};

const initialActionState: InspectionActionState = {
  success: false,
  message: "",
};

export default function InspectionDetailView({
  inspection,
  categories,
}: {
  inspection: InspectionData;
  categories: CategoryOption[];
}) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, startDeleteTransition] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [updateState, formAction, isUpdating] = useActionState(
    async (prev: InspectionActionState, formData: FormData) => {
      const res = await updateUrlInspection(prev, formData);
      if (res.success) {
        setIsEditing(false);
      }
      return res;
    },
    initialActionState
  );

  function handleDelete() {
    if (!window.confirm("Yakin ingin menghapus catatan inspeksi ini secara permanen?")) {
      return;
    }

    setDeleteError(null);
    startDeleteTransition(async () => {
      const res = await deleteUrlInspection(inspection.id);
      if (res.success) {
        router.push("/history");
      } else {
        setDeleteError(res.message);
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
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/history"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-700 hover:text-purple-900"
        >
          ← Kembali ke Riwayat
        </Link>

        <div className="flex gap-2">
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="rounded-xl border border-purple-200 bg-white px-3 py-1.5 text-xs font-semibold text-purple-700 shadow-sm hover:bg-purple-50"
            >
              Ubah Data / Catatan
            </button>
          )}

          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="rounded-xl border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 shadow-sm hover:bg-rose-50 disabled:opacity-50"
          >
            {isDeleting ? "Menghapus..." : "Hapus Inspeksi"}
          </button>
        </div>
      </div>

      {deleteError && (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-700"
        >
          ⚠ {deleteError}
        </div>
      )}

      {updateState.success && (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-medium text-emerald-700"
        >
          ✓ {updateState.message}
        </div>
      )}

      {/* Main Detail Card */}
      <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between border-b border-purple-50 pb-5 mb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-600">
                Detail Inspeksi URL
              </span>
              <span className="text-xs text-slate-400">• ID: {inspection.id}</span>
            </div>
            <h2 className="text-2xl font-bold text-purple-950 break-all">
              {inspection.url}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold border ${
                inspection.status === "Mencurigakan"
                  ? "bg-rose-100 text-rose-700 border-rose-300"
                  : "bg-amber-100 text-amber-700 border-amber-300"
              }`}
            >
              {inspection.status}
            </span>

            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold border ${getSeverityClass(
                inspection.category.severity
              )}`}
            >
              {inspection.category.name}
            </span>
          </div>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-sm">
          <div className="rounded-xl bg-[#fbf9fe] p-4 border border-purple-100">
            <span className="block text-xs text-purple-900/60 font-medium mb-1">
              Domain Terdeteksi:
            </span>
            <strong className="text-purple-950 text-base">{inspection.domain}</strong>
          </div>

          <div className="rounded-xl bg-[#fbf9fe] p-4 border border-purple-100">
            <span className="block text-xs text-purple-900/60 font-medium mb-1">
              Kategori Terkait:
            </span>
            <strong className="text-purple-950 text-base">
              {inspection.category.name} ({inspection.category.severity})
            </strong>
          </div>

          <div className="rounded-xl bg-[#fbf9fe] p-4 border border-purple-100">
            <span className="block text-xs text-purple-900/60 font-medium mb-1">
              Tanggal Dibuat / Diperbarui:
            </span>
            <span className="text-purple-950 font-medium text-xs block">
              Dibuat: {new Date(inspection.createdAt).toLocaleString("id-ID")}
            </span>
            <span className="text-purple-950/70 text-xs block">
              Diubah: {new Date(inspection.updatedAt).toLocaleString("id-ID")}
            </span>
          </div>
        </div>

        {/* Heuristic Reasons */}
        <div className="mb-6 rounded-xl border border-purple-100 bg-[#fbf9fe] p-5">
          <h3 className="text-sm font-semibold text-purple-950 mb-3">
            Aturan Deteksi & Indikator Keamanan (Server Heuristics):
          </h3>
          <ul className="space-y-2 text-xs text-slate-700">
            {inspection.reasons.map((r, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="text-purple-600 font-bold text-sm leading-none">•</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Category Description */}
        {inspection.category.description && (
          <div className="mb-6 rounded-xl border border-purple-100 bg-purple-50/40 p-4 text-xs text-purple-900">
            <strong className="block mb-1 font-semibold text-purple-950">
              Keterangan Kategori ({inspection.category.name}):
            </strong>
            <p>{inspection.category.description}</p>
          </div>
        )}

        {/* Edit Form or Current Notes Display */}
        {isEditing ? (
          <div className="rounded-2xl border-2 border-purple-200 bg-white p-6 shadow-sm">
            <h3 className="text-base font-bold text-purple-950 mb-4">
              Ubah Data Inspeksi URL
            </h3>

            <form action={formAction} noValidate className="space-y-4">
              <input type="hidden" name="id" value={inspection.id} />

              <div>
                <label
                  htmlFor="edit-category"
                  className="block text-xs font-semibold text-purple-950 mb-1"
                >
                  Pilih Kategori Keamanan Relasional *
                </label>
                <select
                  id="edit-category"
                  name="categoryId"
                  defaultValue={inspection.categoryId}
                  className="w-full rounded-xl border border-purple-200 bg-[#fbf9fe] px-3.5 py-2 text-sm text-purple-950 outline-none transition focus:border-purple-600 focus:bg-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} — Tingkat {c.severity}
                    </option>
                  ))}
                </select>
                {updateState.errors?.categoryId && (
                  <p role="alert" className="mt-1 text-xs text-rose-600 font-medium">
                    {updateState.errors.categoryId[0]}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="edit-notes"
                  className="block text-xs font-semibold text-purple-950 mb-1"
                >
                  Catatan Analis / Penyelidikan
                </label>
                <textarea
                  id="edit-notes"
                  name="notes"
                  rows={4}
                  defaultValue={inspection.notes ?? ""}
                  maxLength={500}
                  placeholder="Tambahkan catatan hasil penyelidikan lebih lanjut..."
                  className="w-full rounded-xl border border-purple-200 bg-[#fbf9fe] px-3.5 py-2 text-sm text-purple-950 outline-none transition focus:border-purple-600 focus:bg-white"
                />
                {updateState.errors?.notes && (
                  <p role="alert" className="mt-1 text-xs text-rose-600 font-medium">
                    {updateState.errors.notes[0]}
                  </p>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="rounded-xl bg-purple-700 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-purple-800 disabled:opacity-50"
                >
                  {isUpdating ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  disabled={isUpdating}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="rounded-xl border border-purple-100 bg-white p-5">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-purple-950">
                Catatan Analis:
              </h4>
              <button
                onClick={() => setIsEditing(true)}
                className="text-xs font-medium text-purple-700 hover:underline"
              >
                + Ubah Catatan
              </button>
            </div>
            {inspection.notes ? (
              <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                {inspection.notes}
              </p>
            ) : (
              <p className="text-xs text-slate-400 italic">
                Belum ada catatan investigasi untuk inspeksi ini.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

