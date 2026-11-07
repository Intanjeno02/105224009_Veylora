"use client";

import { useActionState, useState, useTransition } from "react";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  type CategoryActionState,
} from "@/lib/actions/category-actions";

type CategoryItem = {
  id: number;
  name: string;
  severity: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    inspections: number;
  };
};

const initialActionState: CategoryActionState = {
  success: false,
  message: "",
};

function getSeverityBadge(severity: string) {
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

export default function CategoryManager({
  initialCategories,
}: {
  initialCategories: CategoryItem[];
}) {
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [generalSuccess, setGeneralSuccess] = useState<string | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

  // Create form state
  const [createState, createAction, isCreating] = useActionState(
    async (prev: CategoryActionState, formData: FormData) => {
      setGeneralError(null);
      setGeneralSuccess(null);
      const res = await createCategory(prev, formData);
      if (res.success) {
        setGeneralSuccess(res.message);
      }
      return res;
    },
    initialActionState
  );

  // Update form state
  const [updateState, updateAction, isUpdating] = useActionState(
    async (prev: CategoryActionState, formData: FormData) => {
      setGeneralError(null);
      setGeneralSuccess(null);
      const res = await updateCategory(prev, formData);
      if (res.success) {
        setGeneralSuccess(res.message);
        setEditingCategory(null);
      }
      return res;
    },
    initialActionState
  );

  function handleDelete(id: number, name: string, count: number) {
    setGeneralError(null);
    setGeneralSuccess(null);

    if (count > 0) {
      if (
        !window.confirm(
          `Kategori "${name}" masih memiliki ${count} inspeksi URL terkait. Menurut aturan integritas referensial (Restrict), penghapusan akan ditolak. Lanjutkan untuk verifikasi?`
        )
      ) {
        return;
      }
    } else {
      if (!window.confirm(`Yakin ingin menghapus kategori "${name}"?`)) {
        return;
      }
    }

    startDeleteTransition(async () => {
      const res = await deleteCategory(id);
      if (res.success) {
        setGeneralSuccess(res.message);
      } else {
        setGeneralError(res.message);
      }
    });
  }

  return (
    <div className="space-y-8">
      {/* Notifikasi Global */}
      {generalSuccess && (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 flex items-center justify-between"
        >
          <span>✓ {generalSuccess}</span>
          <button
            onClick={() => setGeneralSuccess(null)}
            className="text-emerald-700 hover:text-emerald-950 font-bold"
          >
            ×
          </button>
        </div>
      )}

      {generalError && (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 flex items-center justify-between"
        >
          <span>⚠ {generalError}</span>
          <button
            onClick={() => setGeneralError(null)}
            className="text-rose-700 hover:text-rose-950 font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Grid: Form Tambah/Ubah dan Daftar Kategori */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Kolom Kiri: Form Input (Tambah atau Ubah) */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-purple-950 mb-1">
              {editingCategory ? "Ubah Kategori Keamanan" : "Tambah Kategori Baru"}
            </h2>
            <p className="text-xs text-purple-900/60 mb-5">
              {editingCategory
                ? "Perbarui klasifikasi ancaman keamanan berikut."
                : "Definisikan kategori baru untuk mengelompokkan risiko inspeksi URL."}
            </p>

            {editingCategory ? (
              /* FORM UBAH KATEGORI */
              <form action={updateAction} className="space-y-4" noValidate>
                <input type="hidden" name="id" value={editingCategory.id} />

                <div>
                  <label
                    htmlFor="edit-name"
                    className="block text-xs font-semibold text-purple-950 mb-1"
                  >
                    Nama Kategori *
                  </label>
                  <input
                    id="edit-name"
                    name="name"
                    type="text"
                    defaultValue={editingCategory.name}
                    required
                    aria-invalid={Boolean(updateState.errors?.name)}
                    aria-describedby={
                      updateState.errors?.name ? "edit-name-error" : undefined
                    }
                    className="w-full rounded-xl border border-purple-200 bg-[#fbf9fe] px-3 py-2 text-sm text-purple-950 outline-none transition focus:border-purple-600 focus:bg-white"
                  />
                  {updateState.errors?.name && (
                    <p
                      id="edit-name-error"
                      role="alert"
                      className="mt-1 text-xs text-rose-600 font-medium"
                    >
                      {updateState.errors.name[0]}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="edit-severity"
                    className="block text-xs font-semibold text-purple-950 mb-1"
                  >
                    Tingkat Keparahan *
                  </label>
                  <select
                    id="edit-severity"
                    name="severity"
                    defaultValue={editingCategory.severity}
                    required
                    aria-invalid={Boolean(updateState.errors?.severity)}
                    className="w-full rounded-xl border border-purple-200 bg-[#fbf9fe] px-3 py-2 text-sm text-purple-950 outline-none transition focus:border-purple-600 focus:bg-white"
                  >
                    <option value="LOW">LOW (Rendah)</option>
                    <option value="MEDIUM">MEDIUM (Sedang)</option>
                    <option value="HIGH">HIGH (Tinggi)</option>
                    <option value="CRITICAL">CRITICAL (Kritis)</option>
                  </select>
                  {updateState.errors?.severity && (
                    <p role="alert" className="mt-1 text-xs text-rose-600 font-medium">
                      {updateState.errors.severity[0]}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="edit-description"
                    className="block text-xs font-semibold text-purple-950 mb-1"
                  >
                    Deskripsi Kategori (Opsional)
                  </label>
                  <textarea
                    id="edit-description"
                    name="description"
                    rows={3}
                    defaultValue={editingCategory.description ?? ""}
                    maxLength={255}
                    placeholder="Penjelasan konteks ancaman..."
                    className="w-full rounded-xl border border-purple-200 bg-[#fbf9fe] px-3 py-2 text-sm text-purple-950 outline-none transition focus:border-purple-600 focus:bg-white"
                  />
                  {updateState.errors?.description && (
                    <p role="alert" className="mt-1 text-xs text-rose-600 font-medium">
                      {updateState.errors.description[0]}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="flex-1 rounded-xl bg-purple-700 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-purple-800 disabled:opacity-50"
                  >
                    {isUpdating ? "Menyimpan..." : "Simpan Perubahan"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingCategory(null)}
                    disabled={isUpdating}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100"
                  >
                    Batal
                  </button>
                </div>
              </form>
            ) : (
              /* FORM TAMBAH KATEGORI BARU */
              <form action={createAction} className="space-y-4" noValidate>
                <div>
                  <label
                    htmlFor="create-name"
                    className="block text-xs font-semibold text-purple-950 mb-1"
                  >
                    Nama Kategori *
                  </label>
                  <input
                    id="create-name"
                    name="name"
                    type="text"
                    placeholder="Contoh: Malware, Adware, Deface"
                    required
                    aria-invalid={Boolean(createState.errors?.name)}
                    aria-describedby={
                      createState.errors?.name ? "create-name-error" : undefined
                    }
                    className="w-full rounded-xl border border-purple-200 bg-[#fbf9fe] px-3 py-2 text-sm text-purple-950 outline-none transition focus:border-purple-600 focus:bg-white"
                  />
                  {createState.errors?.name && (
                    <p
                      id="create-name-error"
                      role="alert"
                      className="mt-1 text-xs text-rose-600 font-medium"
                    >
                      {createState.errors.name[0]}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="create-severity"
                    className="block text-xs font-semibold text-purple-950 mb-1"
                  >
                    Tingkat Keparahan *
                  </label>
                  <select
                    id="create-severity"
                    name="severity"
                    defaultValue="MEDIUM"
                    required
                    aria-invalid={Boolean(createState.errors?.severity)}
                    className="w-full rounded-xl border border-purple-200 bg-[#fbf9fe] px-3 py-2 text-sm text-purple-950 outline-none transition focus:border-purple-600 focus:bg-white"
                  >
                    <option value="LOW">LOW (Rendah)</option>
                    <option value="MEDIUM">MEDIUM (Sedang)</option>
                    <option value="HIGH">HIGH (Tinggi)</option>
                    <option value="CRITICAL">CRITICAL (Kritis)</option>
                  </select>
                  {createState.errors?.severity && (
                    <p role="alert" className="mt-1 text-xs text-rose-600 font-medium">
                      {createState.errors.severity[0]}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="create-description"
                    className="block text-xs font-semibold text-purple-950 mb-1"
                  >
                    Deskripsi Kategori (Opsional)
                  </label>
                  <textarea
                    id="create-description"
                    name="description"
                    rows={3}
                    maxLength={255}
                    placeholder="Contoh: Situs yang mendistribusikan berkas biner berbahaya..."
                    className="w-full rounded-xl border border-purple-200 bg-[#fbf9fe] px-3 py-2 text-sm text-purple-950 outline-none transition focus:border-purple-600 focus:bg-white"
                  />
                  {createState.errors?.description && (
                    <p role="alert" className="mt-1 text-xs text-rose-600 font-medium">
                      {createState.errors.description[0]}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isCreating}
                  className="w-full rounded-xl bg-purple-700 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-purple-800 disabled:opacity-50"
                >
                  {isCreating ? "Menyimpan Kategori..." : "+ Tambah Kategori"}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Kolom Kanan: Tabel / Daftar Kategori */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-purple-950">
                  Daftar Kategori Keamanan
                </h2>
                <p className="text-xs text-purple-900/60">
                  Total {initialCategories.length} kategori terdaftar di PostgreSQL
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="border-b border-purple-100 bg-[#fbf9fe] text-xs font-semibold text-purple-950">
                  <tr>
                    <th scope="col" className="px-4 py-3">Nama Kategori</th>
                    <th scope="col" className="px-4 py-3">Keparahan</th>
                    <th scope="col" className="px-4 py-3">Deskripsi</th>
                    <th scope="col" className="px-4 py-3 text-center">Tautan URL</th>
                    <th scope="col" className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-50">
                  {initialCategories.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                        Belum ada kategori yang tersimpan.
                      </td>
                    </tr>
                  ) : (
                    initialCategories.map((cat) => (
                      <tr key={cat.id} className="hover:bg-purple-50/40 transition">
                        <td className="px-4 py-3 font-semibold text-purple-950">
                          {cat.name}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getSeverityBadge(
                              cat.severity
                            )}`}
                          >
                            {cat.severity}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500 max-w-xs truncate">
                          {cat.description || "-"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-block rounded-md bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700">
                            {cat._count.inspections} data
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right space-x-2">
                          <button
                            onClick={() => setEditingCategory(cat)}
                            className="rounded-lg border border-purple-200 bg-white px-2.5 py-1 text-xs font-medium text-purple-700 hover:bg-purple-50"
                          >
                            Ubah
                          </button>
                          <button
                            onClick={() =>
                              handleDelete(cat.id, cat.name, cat._count.inspections)
                            }
                            disabled={isDeleting}
                            className="rounded-lg border border-rose-200 bg-white px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

