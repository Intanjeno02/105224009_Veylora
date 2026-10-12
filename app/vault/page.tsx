"use client";

import { useEffect, useState } from "react";
import type { Account } from "@/data/account";
import { getAccounts, saveAccounts } from "@/lib/account-storage";
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

export default function VaultPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<AccountForm>(emptyForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    setAccounts(getAccounts());
  }, []);

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
      setAccounts(updatedAccounts);
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
      setAccounts(updatedAccounts);
      setSuccess("Akun berhasil dihapus.");
      setError("");
    } catch {
      setError("Akun gagal dihapus.");
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="mb-2 text-sm text-blue-400">
              Personal Security Assistant
            </p>

            <h1 className="text-3xl font-bold">Vault</h1>

            <p className="mt-2 text-sm text-zinc-400">
              Kelola informasi akun digital kamu.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowForm(!showForm);
              setError("");
              setSuccess("");
            }}
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            {showForm ? "Batal" : "+ Tambah Akun"}
          </button>
        </header>

        <section
          aria-label="Daftar akun tersimpan"
          className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 sm:p-6"
        >
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Akun Tersimpan</h2>

            <span className="rounded-full bg-zinc-800 px-3 py-1 text-sm text-zinc-300">
              {accounts.length} akun
            </span>
          </div>

          {showForm && (
            <form
              onSubmit={handleSubmit}
              noValidate
              className="mb-8 space-y-5 rounded-xl border border-zinc-700 bg-zinc-950 p-5"
            >
              <h3 className="text-lg font-semibold">Tambah Akun Baru</h3>

              <p className="text-sm text-amber-300">
                Prototipe ini belum mengenkripsi kredensial. Jangan masukkan
                password asli.
              </p>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="account-name"
                    className="mb-2 block text-sm text-zinc-300"
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
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-3 text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>

                <div>
                  <label
                    htmlFor="account-username"
                    className="mb-2 block text-sm text-zinc-300"
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
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-3 text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>

                <div>
                  <label
                    htmlFor="account-email"
                    className="mb-2 block text-sm text-zinc-300"
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
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-3 text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>

                <div>
                  <label
                    htmlFor="account-url"
                    className="mb-2 block text-sm text-zinc-300"
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
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-3 text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="account-category"
                    className="mb-2 block text-sm text-zinc-300"
                  >
                    Kategori
                  </label>

                  <select
                    id="account-category"
                    value={form.category}
                    onChange={(event) =>
                      setForm({ ...form, category: event.target.value })
                    }
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-3 text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
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
                <p role="alert" className="text-sm text-red-400">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:w-auto"
              >
                Simpan Akun
              </button>
            </form>
          )}

          {success && (
            <p
              role="status"
              className="mb-5 rounded-lg border border-emerald-800 bg-emerald-950/40 p-3 text-sm text-emerald-300"
            >
              {success}
            </p>
          )}

          {error && !showForm && (
            <p role="alert" className="mb-5 text-sm text-red-400">
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
            <div className="rounded-xl border border-dashed border-zinc-700 px-5 py-12 text-center">
              <div aria-hidden="true" className="mb-4 text-4xl">
                🔐
              </div>

              <h3 className="text-lg font-semibold">
                Vault kamu masih kosong
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-zinc-400">
                Belum ada akun yang disimpan. Tambahkan akun untuk mulai
                mengelola informasi digital kamu.
              </p>

              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                Tambah Akun Pertama
              </button>
            </div>
          ) : filteredAccounts.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-400">
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
                    className="ml-2 text-xs text-red-400 underline hover:text-red-300"
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