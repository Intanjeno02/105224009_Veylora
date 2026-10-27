"use client";

import { useState } from "react";
import type { Account } from "@/data/account";
import { getAccounts, saveAccounts } from "@/lib/account-storage";
import { useLocalStorageValue } from "@/lib/use-local-storage-value";
import AccountCard from "@/components/AccountCard";
import SearchInput from "@/components/SearchInput";

type AccountForm = {
  name: string;
  username: string;
  email: string;
  url: string;
  category: string;
};

const emptyForm: AccountForm = {
  name: "",
  username: "",
  email: "",
  url: "",
  category: "Lainnya",
};
const EMPTY_ACCOUNTS: Account[] = [];
const ACCOUNTS_STORAGE_KEY = "personal-security-accounts";

export default function VaultPage() {
  const { value: accounts } = useLocalStorageValue(
    ACCOUNTS_STORAGE_KEY,
    EMPTY_ACCOUNTS,
    getAccounts
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<AccountForm>(emptyForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const filteredAccounts = accounts.filter((account) => {
    const query = searchQuery.toLowerCase();

    return (
      account.name.toLowerCase().includes(query) ||
      account.username.toLowerCase().includes(query) ||
      account.category.toLowerCase().includes(query)
    );
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const name = form.name.trim();
    const username = form.username.trim();
    const email = form.email.trim();
    const url = form.url.trim();

    if (!name || !username || !email || !url) {
      setError("Semua kolom wajib diisi.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Masukkan alamat email yang valid.");
      return;
    }

    let parsedUrl: URL;

    try {
      parsedUrl = new URL(url);
    } catch {
      setError("Masukkan URL yang valid, termasuk https://.");
      return;
    }

    if (parsedUrl.protocol !== "https:") {
      setError("URL harus menggunakan HTTPS.");
      return;
    }

    const now = new Date().toISOString();

    const newAccount: Account = {
      id: crypto.randomUUID(),
      name,
      username,
      email,
      url: parsedUrl.toString(),
      category: form.category,
      encryptedPassword: "",
      createdAt: now,
      updatedAt: now,
    };

    const updatedAccounts = [...accounts, newAccount];

    try {
      saveAccounts(updatedAccounts);
      setForm(emptyForm);
      setShowForm(false);
      setSuccess("Akun berhasil ditambahkan.");
    } catch {
      setError("Akun gagal disimpan. Periksa penyimpanan browser.");
    }
  }

  function handleDelete(id: string) {
    const updatedAccounts = accounts.filter(
      (account) => account.id !== id
    );

    try {
      saveAccounts(updatedAccounts);
      setSuccess("Akun berhasil dihapus.");
      setError("");
    } catch {
      setError("Akun gagal dihapus.");
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f5fb] px-4 py-8 text-slate-800 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="mb-2 text-sm font-semibold text-purple-700">
              Personal Security Assistant
            </p>

            <h1 className="text-3xl font-bold text-purple-950">Vault</h1>

            <p className="mt-2 text-sm text-purple-900/60">
              Kelola informasi akun digital kamu dengan aman.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowForm(!showForm);
              setError("");
              setSuccess("");
            }}
            className="rounded-xl bg-purple-700 px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-purple-700/20 transition hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
          >
            {showForm ? "Batal" : "+ Tambah Akun"}
          </button>
        </header>

        <section
          aria-label="Daftar akun tersimpan"
          className="rounded-2xl border border-purple-100 bg-white p-5 shadow-sm sm:p-6"
        >
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-bold text-purple-950">Akun Tersimpan</h2>

            <span className="rounded-full bg-purple-50 border border-purple-200 px-3 py-1 text-sm font-medium text-purple-800">
              {accounts.length} akun
            </span>
          </div>

          {showForm && (
            <form
              onSubmit={handleSubmit}
              noValidate
              className="mb-8 space-y-5 rounded-2xl border border-purple-200 bg-[#fbf9fe] p-5 sm:p-6 shadow-sm"
            >
              <h3 className="text-lg font-bold text-purple-950">Tambah Akun Baru</h3>

              <p className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 font-medium">
                Prototipe ini belum mengenkripsi kredensial. Jangan masukkan
                password asli.
              </p>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="account-name"
                    className="mb-2 block text-sm font-medium text-purple-950/80"
                  >
                    Nama layanan *
                  </label>

                  <input
                    id="account-name"
                    required
                    maxLength={100}
                    value={form.name}
                    onChange={(event) =>
                      setForm({ ...form, name: event.target.value })
                    }
                    placeholder="Contoh: GitHub"
                    className="w-full rounded-xl border border-purple-200 bg-white px-3 py-3 text-purple-950 placeholder-purple-900/40 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20 shadow-sm transition-all"
                  />
                </div>

                <div>
                  <label
                    htmlFor="account-username"
                    className="mb-2 block text-sm font-medium text-purple-950/80"
                  >
                    Username *
                  </label>

                  <input
                    id="account-username"
                    required
                    maxLength={100}
                    value={form.username}
                    onChange={(event) =>
                      setForm({ ...form, username: event.target.value })
                    }
                    placeholder="Contoh: rin-dev"
                    className="w-full rounded-xl border border-purple-200 bg-white px-3 py-3 text-purple-950 placeholder-purple-900/40 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20 shadow-sm transition-all"
                  />
                </div>

                <div>
                  <label
                    htmlFor="account-email"
                    className="mb-2 block text-sm font-medium text-purple-950/80"
                  >
                    Email *
                  </label>

                  <input
                    id="account-email"
                    type="email"
                    required
                    maxLength={254}
                    value={form.email}
                    onChange={(event) =>
                      setForm({ ...form, email: event.target.value })
                    }
                    placeholder="nama@example.com"
                    className="w-full rounded-xl border border-purple-200 bg-white px-3 py-3 text-purple-950 placeholder-purple-900/40 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20 shadow-sm transition-all"
                  />
                </div>

                <div>
                  <label
                    htmlFor="account-url"
                    className="mb-2 block text-sm font-medium text-purple-950/80"
                  >
                    URL layanan *
                  </label>

                  <input
                    id="account-url"
                    type="url"
                    required
                    maxLength={2048}
                    value={form.url}
                    onChange={(event) =>
                      setForm({ ...form, url: event.target.value })
                    }
                    placeholder="https://github.com"
                    className="w-full rounded-xl border border-purple-200 bg-white px-3 py-3 text-purple-950 placeholder-purple-900/40 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20 shadow-sm transition-all"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="account-category"
                    className="mb-2 block text-sm font-medium text-purple-950/80"
                  >
                    Kategori
                  </label>

                  <select
                    id="account-category"
                    value={form.category}
                    onChange={(event) =>
                      setForm({ ...form, category: event.target.value })
                    }
                    className="w-full rounded-xl border border-purple-200 bg-white px-3 py-3 text-purple-950 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20 shadow-sm transition-all"
                  >
                    <option value="Email">Email</option>
                    <option value="Media Sosial">Media Sosial</option>
                    <option value="Keuangan">Keuangan</option>
                    <option value="Pengembangan">Pengembangan</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
              </div>

              {error && (
                <p role="alert" className="text-sm font-medium text-rose-600">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="w-full rounded-xl bg-purple-700 px-5 py-3 font-semibold text-white shadow-sm shadow-purple-700/20 transition hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500/30 sm:w-auto"
              >
                Simpan Akun
              </button>
            </form>
          )}

          {success && (
            <p
              role="status"
              className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-800"
            >
              {success}
            </p>
          )}

          {error && !showForm && (
            <p role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-800">
              {error}
            </p>
          )}

          {accounts.length > 0 && (
            <div className="mb-5">
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
              />
            </div>
          )}

          {accounts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-purple-200 bg-[#fbf9fe] px-5 py-12 text-center">
              <div aria-hidden="true" className="mb-4 text-4xl">
                🔐
              </div>

              <h3 className="text-lg font-bold text-purple-950">
                Vault kamu masih kosong
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-purple-900/60">
                Belum ada akun yang disimpan. Tambahkan akun untuk mulai
                mengelola informasi digital kamu.
              </p>

              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="mt-5 rounded-xl bg-purple-700 px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-purple-700/20 hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
              >
                Tambah Akun Pertama
              </button>
            </div>
          ) : filteredAccounts.length === 0 ? (
            <p className="py-8 text-center text-sm text-purple-900/50">
              Akun yang kamu cari tidak ditemukan.
            </p>
          ) : (
            <div className="space-y-3">
              {filteredAccounts.map((account) => (
                <div key={account.id} className="space-y-2">
                  <AccountCard
                    name={account.name}
                    username={account.username}
                    category={account.category}
                    lastUpdated={new Date(
                      account.updatedAt
                    ).toLocaleDateString("id-ID")}
                    initial={account.name.charAt(0).toUpperCase()}
                  />

                  <button
                    type="button"
                    onClick={() => handleDelete(account.id)}
                    className="ml-2 text-xs font-medium text-rose-600 hover:text-rose-800 hover:underline transition-colors"
                    aria-label={`Hapus akun ${account.name}`}
                  >
                    Hapus akun
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}