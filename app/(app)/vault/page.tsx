"use client";

import { useCallback, useEffect, useState } from "react";
import type { Account } from "@/data/account";
import {
  getAccounts,
  getAccountsStorageKey,
  saveAccounts,
} from "@/lib/account-storage";
import { useLocalStorageValue } from "@/lib/use-local-storage-value";
import { useUserId } from "@/components/UserIdContext";
import SearchInput from "@/components/SearchInput";
import {
  hasVaultConfig,
  setupVault,
  unlockVault,
} from "@/lib/vault-config";
import {
  encryptVaultData,
  decryptVaultData,
  FAIL_CLOSED_ERROR_MESSAGE,
} from "@/lib/vault-crypto";

type AccountFormData = {
  name: string;
  username: string;
  email: string;
  url: string;
  category: string;
  password: string;
};

const emptyFormData: AccountFormData = {
  name: "",
  username: "",
  email: "",
  url: "",
  category: "Lainnya",
  password: "",
};

const EMPTY_ACCOUNTS: Account[] = [];

export default function VaultPage() {
  const userId = useUserId();
  const storageKey = getAccountsStorageKey(userId);
  const loadAccounts = useCallback(() => getAccounts(userId), [userId]);
  const { value: accounts } = useLocalStorageValue(
    storageKey,
    EMPTY_ACCOUNTS,
    loadAccounts
  );

  // State Manajemen Kunci Brankas (In-Memory Saja)
  const [isConfigured, setIsConfigured] = useState<boolean>(false);
  const [vaultKey, setVaultKey] = useState<CryptoKey | null>(null);
  const [masterPasswordInput, setMasterPasswordInput] = useState("");
  const [confirmPasswordInput, setConfirmPasswordInput] = useState("");
  const [authError, setAuthError] = useState("");
  const [isProcessingAuth, setIsProcessingAuth] = useState(false);

  // State Manajemen Akun
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AccountFormData>(emptyFormData);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // State Dekripsi Password On-Demand (In-Memory)
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, string>>({});
  const [decryptErrors, setDecryptErrors] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Periksa apakah konfigurasi Vault sudah pernah dibuat di browser
  useEffect(() => {
    setIsConfigured(hasVaultConfig());
  }, []);

  const filteredAccounts = accounts.filter((account) => {
    const query = searchQuery.toLowerCase();
    return (
      account.name.toLowerCase().includes(query) ||
      account.username.toLowerCase().includes(query) ||
      account.category.toLowerCase().includes(query)
    );
  });

  // 1. Setup Vault Baru
  async function handleSetupVault(e: React.FormEvent) {
    e.preventDefault();
    setAuthError("");

    if (masterPasswordInput.length < 12) {
      setAuthError("Master password harus memiliki minimal 12 karakter.");
      return;
    }

    if (masterPasswordInput !== confirmPasswordInput) {
      setAuthError("Konfirmasi master password tidak cocok.");
      return;
    }

    setIsProcessingAuth(true);
    try {
      const key = await setupVault(masterPasswordInput);
      setVaultKey(key);
      setIsConfigured(true);
      setMasterPasswordInput("");
      setConfirmPasswordInput("");
      setSuccess("Brankas berhasil disiapkan dan dibuka dengan enkripsi AES-256-GCM.");
    } catch (err: any) {
      setAuthError(err.message || "Gagal menyiapkan brankas.");
    } finally {
      setIsProcessingAuth(false);
    }
  }

  // 2. Buka Kunci Vault
  async function handleUnlockVault(e: React.FormEvent) {
    e.preventDefault();
    setAuthError("");

    if (!masterPasswordInput) {
      setAuthError("Masukkan master password kamu.");
      return;
    }

    setIsProcessingAuth(true);
    try {
      const key = await unlockVault(masterPasswordInput);
      setVaultKey(key);
      setMasterPasswordInput("");
      setSuccess("Brankas berhasil dibuka. Kunci aktif tersimpan aman di memori sesi.");
    } catch (err: any) {
      setAuthError(err.message || "Master password salah.");
    } finally {
      setIsProcessingAuth(false);
    }
  }

  // 3. Kunci Kembali Vault
  function handleLockVault() {
    setVaultKey(null);
    setRevealedPasswords({});
    setDecryptErrors({});
    setShowForm(false);
    setEditingId(null);
    setSuccess("Brankas telah dikunci kembali. Kunci enkripsi dibersihkan dari memori.");
  }

  // 4. Tambah atau Edit Akun
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!vaultKey) {
      setError("Brankas terkunci. Buka kunci brankas terlebih dahulu untuk mengenkripsi data.");
      return;
    }

    const name = form.name.trim();
    const username = form.username.trim();
    const email = form.email.trim();
    const url = form.url.trim();
    const password = form.password;

    if (!name || !username || !email || !url) {
      setError("Semua kolom informasi akun wajib diisi.");
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
      setError("URL harus menggunakan protokol aman HTTPS.");
      return;
    }

    if (!editingId && !password) {
      setError("Password akun wajib diisi untuk dienkripsi.");
      return;
    }

    const now = new Date().toISOString();

    try {
      if (editingId) {
        // Mode Edit Akun
        const existingAccount = accounts.find((a) => a.id === editingId);
        if (!existingAccount) {
          setError("Akun tidak ditemukan.");
          return;
        }

        let updatedEncryptedPassword = existingAccount.encryptedPassword;

        // Jika password diubah, lakukan enkripsi ulang dengan nonce baru
        if (password) {
          const payload = await encryptVaultData(password, vaultKey, {
            accountId: editingId,
            userId,
            version: 2,
          });
          updatedEncryptedPassword = JSON.stringify(payload);
        }

        const updatedAccounts = accounts.map((a) =>
          a.id === editingId
            ? {
                ...a,
                name,
                username,
                email,
                url: parsedUrl.toString(),
                category: form.category,
                encryptedPassword: updatedEncryptedPassword,
                updatedAt: now,
              }
            : a
        );

        saveAccounts(userId, updatedAccounts);
        setEditingId(null);
        setForm(emptyFormData);
        setShowForm(false);
        setSuccess(`Akun "${name}" berhasil diperbarui dengan enkripsi terautentikasi.`);
      } else {
        // Mode Tambah Akun Baru
        const newId = crypto.randomUUID();

        // Enkripsi password menggunakan AES-256-GCM terikat AAD
        const payload = await encryptVaultData(password, vaultKey, {
          accountId: newId,
          userId,
          version: 2,
        });

        const newAccount: Account = {
          id: newId,
          name,
          username,
          email,
          url: parsedUrl.toString(),
          category: form.category,
          encryptedPassword: JSON.stringify(payload),
          createdAt: now,
          updatedAt: now,
        };

        const updatedAccounts = [...accounts, newAccount];
        saveAccounts(userId, updatedAccounts);
        setForm(emptyFormData);
        setShowForm(false);
        setSuccess(`Akun "${name}" berhasil disimpan dan dilindungi dengan AES-256-GCM.`);
      }
    } catch (err: any) {
      setError(`Gagal mengenkripsi akun: ${err.message}`);
    }
  }

  // 5. Hapus Akun
  function handleDelete(id: string, name: string) {
    if (!window.confirm(`Apakah kamu yakin ingin menghapus akun "${name}"?`)) {
      return;
    }

    const updatedAccounts = accounts.filter((account) => account.id !== id);
    try {
      saveAccounts(userId, updatedAccounts);
      setSuccess(`Akun "${name}" berhasil dihapus.`);
      setError("");
    } catch {
      setError("Akun gagal dihapus.");
    }
  }

  // 6. Tampilkan/Dekripsi Password On-Demand (Verifikasi Integritas)
  async function handleToggleReveal(account: Account) {
    if (!vaultKey) {
      setError("Buka kunci brankas terlebih dahulu untuk melihat password.");
      return;
    }

    // Jika sudah ditampilkan, sembunyikan
    if (revealedPasswords[account.id]) {
      setRevealedPasswords((prev) => {
        const copy = { ...prev };
        delete copy[account.id];
        return copy;
      });
      return;
    }

    if (!account.encryptedPassword) {
      setDecryptErrors((prev) => ({
        ...prev,
        [account.id]: "Akun ini belum memiliki password terenkripsi (data prototipe lama).",
      }));
      return;
    }

    // Eksekusi dekripsi dengan verifikasi AAD context
    try {
      const plaintext = await decryptVaultData(
        account.encryptedPassword,
        vaultKey,
        {
          accountId: account.id,
          userId,
          version: 2,
        }
      );

      // Berhasil: simpan di state memori komponen
      setRevealedPasswords((prev) => ({
        ...prev,
        [account.id]: plaintext,
      }));
      setDecryptErrors((prev) => {
        const copy = { ...prev };
        delete copy[account.id];
        return copy;
      });
    } catch {
      // Gagal integritas: Terapkan prinsip Fail-Closed
      setDecryptErrors((prev) => ({
        ...prev,
        [account.id]: FAIL_CLOSED_ERROR_MESSAGE,
      }));
    }
  }

  // 7. Salin Password ke Clipboard
  async function handleCopyPassword(accountId: string, passwordText: string) {
    try {
      await navigator.clipboard.writeText(passwordText);
      setCopiedId(accountId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setError("Gagal menyalin password ke clipboard.");
    }
  }

  // 8. Buka Form Edit Akun
  function handleStartEdit(account: Account) {
    setEditingId(account.id);
    setForm({
      name: account.name,
      username: account.username,
      email: account.email,
      url: account.url,
      category: account.category,
      password: "", // Kosongkan agar pengguna hanya mengisi jika ingin mengubah
    });
    setShowForm(true);
    setError("");
    setSuccess("");
  }

  return (
    <main className="min-h-screen bg-[#f7f5fb] px-4 py-8 text-slate-800 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Header Halaman */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="mb-2 text-sm font-semibold text-purple-700">
              Personal Security Assistant
            </p>
            <h1 className="text-3xl font-bold text-purple-950">Brankas Digital (Vault)</h1>
            <p className="mt-2 text-sm text-purple-900/60">
              Penyimpanan kredensial akun terenkripsi terautentikasi (AES-256-GCM + AAD).
            </p>
          </div>

          {/* Status Kunci Brankas & Tombol Aksi */}
          <div className="flex items-center gap-3">
            {vaultKey ? (
              <>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Brankas Terbuka (AES-GCM Aktif)
                </span>
                <button
                  type="button"
                  onClick={handleLockVault}
                  className="rounded-xl border border-purple-200 bg-white px-4 py-2.5 text-xs font-semibold text-purple-700 shadow-sm hover:bg-purple-50 transition"
                >
                  🔒 Kunci Brankas
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(!showForm);
                    setEditingId(null);
                    setForm(emptyFormData);
                    setError("");
                    setSuccess("");
                  }}
                  className="rounded-xl bg-purple-700 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-purple-800 transition"
                >
                  {showForm ? "Tutup Form" : "+ Tambah Akun"}
                </button>
              </>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-800">
                🔒 Brankas Terkunci
              </span>
            )}
          </div>
        </header>

        {/* Notifikasi Global */}
        {success && (
          <div
            role="status"
            className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 flex items-center justify-between"
          >
            <span>✓ {success}</span>
            <button onClick={() => setSuccess("")} className="font-bold">×</button>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 flex items-center justify-between"
          >
            <span>⚠ {error}</span>
            <button onClick={() => setError("")} className="font-bold">×</button>
          </div>
        )}

        {/* KONDISI 1: VAULT BELUM DIKONFIGURASI (SETUP MASTER PASSWORD) */}
        {!isConfigured && !vaultKey && (
          <section className="rounded-2xl border border-purple-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="max-w-xl mx-auto text-center space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 text-3xl">
                🛡️
              </div>
              <h2 className="text-xl font-bold text-purple-950">Siapkan Master Password Brankas</h2>
              <p className="text-sm text-purple-900/70 leading-relaxed">
                Brankas Veylora menggunakan enkripsi terautentikasi <strong>AES-256-GCM</strong> dengan kunci yang diderivasi melalui <strong>PBKDF2-HMAC-SHA256 (600.000 iterasi)</strong>. Master password kamu tidak pernah disimpan di disk atau dikirim ke server.
              </p>

              {authError && (
                <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 font-medium">
                  ⚠ {authError}
                </div>
              )}

              <form onSubmit={handleSetupVault} className="space-y-4 text-left pt-2">
                <div>
                  <label className="block text-xs font-semibold text-purple-950 mb-1">
                    Master Password Baru (Minimal 12 Karakter) *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={12}
                    value={masterPasswordInput}
                    onChange={(e) => setMasterPasswordInput(e.target.value)}
                    placeholder="Masukkan master password yang kuat..."
                    className="w-full rounded-xl border border-purple-200 bg-[#fbf9fe] px-4 py-2.5 text-sm outline-none focus:border-purple-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-purple-950 mb-1">
                    Konfirmasi Master Password *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={12}
                    value={confirmPasswordInput}
                    onChange={(e) => setConfirmPasswordInput(e.target.value)}
                    placeholder="Ulangi master password..."
                    className="w-full rounded-xl border border-purple-200 bg-[#fbf9fe] px-4 py-2.5 text-sm outline-none focus:border-purple-600 focus:bg-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isProcessingAuth}
                  className="w-full rounded-xl bg-purple-700 py-3 text-sm font-semibold text-white shadow-sm hover:bg-purple-800 disabled:opacity-50"
                >
                  {isProcessingAuth ? "Menginisialisasi Kunci (PBKDF2)..." : "Buat & Aktifkan Brankas"}
                </button>
              </form>
            </div>
          </section>
        )}

        {/* KONDISI 2: VAULT SUDAH DIKONFIGURASI TAPI TERKUNCI */}
        {isConfigured && !vaultKey && (
          <section className="rounded-2xl border border-purple-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="max-w-md mx-auto text-center space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 text-3xl">
                🔒
              </div>
              <h2 className="text-xl font-bold text-purple-950">Buka Kunci Brankas Digital</h2>
              <p className="text-xs text-purple-900/60 leading-relaxed">
                Masukkan master password untuk menderivasi kunci AES-256 dan membuka akses ke kredensial terenkripsi kamu.
              </p>

              {authError && (
                <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 font-medium">
                  ⚠ {authError}
                </div>
              )}

              <form onSubmit={handleUnlockVault} className="space-y-4 text-left pt-2">
                <div>
                  <label className="block text-xs font-semibold text-purple-950 mb-1">
                    Master Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={masterPasswordInput}
                    onChange={(e) => setMasterPasswordInput(e.target.value)}
                    placeholder="Ketik master password kamu..."
                    className="w-full rounded-xl border border-purple-200 bg-[#fbf9fe] px-4 py-2.5 text-sm outline-none focus:border-purple-600 focus:bg-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isProcessingAuth}
                  className="w-full rounded-xl bg-purple-700 py-3 text-sm font-semibold text-white shadow-sm hover:bg-purple-800 disabled:opacity-50"
                >
                  {isProcessingAuth ? "Menderivasi Kunci Kriptografi..." : "Buka Kunci Brankas"}
                </button>
              </form>
            </div>
          </section>
        )}

        {/* FORM TAMBAH / UBAH AKUN (HANYA KETIKA UNLOCKED) */}
        {vaultKey && showForm && (
          <section className="rounded-2xl border border-purple-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-purple-950 mb-1">
              {editingId ? "Ubah Akun Terenkripsi" : "Tambah Akun Baru ke Brankas"}
            </h2>
            <p className="text-xs text-purple-900/60 mb-5">
              Password akan dienkripsi menggunakan AES-256-GCM dengan Nonce acak 96-bit dan AAD context-binding.
            </p>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-purple-950 mb-1">
                    Nama Layanan / Aplikasi *
                  </label>
                  <input
                    required
                    maxLength={100}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Contoh: GitHub, AWS, Google"
                    className="w-full rounded-xl border border-purple-200 bg-[#fbf9fe] px-3.5 py-2 text-sm outline-none focus:border-purple-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-purple-950 mb-1">
                    Kategori Layanan *
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full rounded-xl border border-purple-200 bg-[#fbf9fe] px-3.5 py-2 text-sm outline-none focus:border-purple-600 focus:bg-white"
                  >
                    <option value="Media Sosial">Media Sosial</option>
                    <option value="Perbankan & Finansial">Perbankan & Finansial</option>
                    <option value="Pekerjaan & Developer">Pekerjaan & Developer</option>
                    <option value="Hiburan & Streaming">Hiburan & Streaming</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-purple-950 mb-1">
                    Username / ID Pengguna *
                  </label>
                  <input
                    required
                    maxLength={100}
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    placeholder="Contoh: intan_dev"
                    className="w-full rounded-xl border border-purple-200 bg-[#fbf9fe] px-3.5 py-2 text-sm outline-none focus:border-purple-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-purple-950 mb-1">
                    Alamat Email Terdaftar *
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="nama@domain.com"
                    className="w-full rounded-xl border border-purple-200 bg-[#fbf9fe] px-3.5 py-2 text-sm outline-none focus:border-purple-600 focus:bg-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-purple-950 mb-1">
                    URL Situs Resmi (Protokol HTTPS) *
                  </label>
                  <input
                    type="url"
                    required
                    value={form.url}
                    onChange={(e) => setForm({ ...form, url: e.target.value })}
                    placeholder="https://github.com"
                    className="w-full rounded-xl border border-purple-200 bg-[#fbf9fe] px-3.5 py-2 text-sm outline-none focus:border-purple-600 focus:bg-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-purple-950 mb-1">
                    Password Akun (Dilindungi Enkripsi AES-256-GCM) {editingId ? "(Kosongkan jika tidak ingin mengubah)" : "*"}
                  </label>
                  <input
                    type="password"
                    required={!editingId}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder={editingId ? "Ketik password baru jika ingin mengubah..." : "Ketik password akun..."}
                    className="w-full rounded-xl border border-purple-200 bg-[#fbf9fe] px-3.5 py-2 text-sm outline-none focus:border-purple-600 focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="rounded-xl bg-purple-700 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-purple-800"
                >
                  {editingId ? "Simpan Perubahan Akun" : "Enkripsi & Simpan Akun"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setForm(emptyFormData);
                  }}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
              </div>
            </form>
          </section>
        )}

        {/* DAFTAR AKUN TERSIMPAN */}
        <section className="rounded-2xl border border-purple-100 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-purple-950">Daftar Akun Brankas</h2>
              <p className="text-xs text-purple-900/60">
                Penyimpanan lokal terlindung. Kredensial hanya dapat didekripsi saat brankas terbuka.
              </p>
            </div>

            <span className="rounded-full bg-purple-50 border border-purple-200 px-3 py-1 text-xs font-medium text-purple-800">
              {accounts.length} akun terdaftar
            </span>
          </div>

          {accounts.length > 0 && (
            <div className="mb-6">
              <SearchInput value={searchQuery} onChange={setSearchQuery} />
            </div>
          )}

          {accounts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-purple-200 bg-[#fbf9fe] px-5 py-12 text-center">
              <div aria-hidden="true" className="mb-3 text-4xl">🔐</div>
              <h3 className="text-lg font-bold text-purple-950">Brankas kamu masih kosong</h3>
              <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-purple-900/60">
                Belum ada akun yang disimpan. Tambahkan akun digital untuk mengamankannya dengan enkripsi AEAD.
              </p>
              {vaultKey && (
                <button
                  type="button"
                  onClick={() => setShowForm(true)}
                  className="mt-4 rounded-xl bg-purple-700 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-purple-800"
                >
                  + Tambah Akun Pertama
                </button>
              )}
            </div>
          ) : filteredAccounts.length === 0 ? (
            <p className="py-8 text-center text-sm text-purple-900/50">
              Akun yang kamu cari tidak ditemukan.
            </p>
          ) : (
            <div className="space-y-4">
              {filteredAccounts.map((account) => {
                const isRevealed = Boolean(revealedPasswords[account.id]);
                const decryptError = decryptErrors[account.id];

                return (
                  <div
                    key={account.id}
                    className="rounded-xl border border-purple-100 bg-[#fbf9fe] p-4 transition hover:border-purple-300 shadow-sm"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      {/* Informasi Akun */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-purple-950 text-base">{account.name}</h3>
                          <span className="rounded-full bg-purple-100 border border-purple-200 px-2.5 py-0.5 text-xs font-medium text-purple-800">
                            {account.category}
                          </span>
                        </div>
                        <p className="text-xs text-purple-900/70">
                          Username: <strong className="text-purple-950">{account.username}</strong> | Email: {account.email}
                        </p>
                        <p className="text-xs text-purple-900/50">
                          URL: <a href={account.url} target="_blank" rel="noreferrer" className="text-purple-700 hover:underline">{account.url}</a>
                        </p>
                      </div>

                      {/* Tombol Aksi Kriptografi */}
                      <div className="flex items-center gap-2 shrink-0">
                        {vaultKey ? (
                          <button
                            type="button"
                            onClick={() => handleToggleReveal(account)}
                            className="rounded-xl border border-purple-200 bg-white px-3 py-1.5 text-xs font-semibold text-purple-700 shadow-sm hover:bg-purple-50 transition"
                          >
                            {isRevealed ? "🙈 Sembunyikan" : "👁 Lihat Password"}
                          </button>
                        ) : (
                          <span className="text-xs text-purple-900/40 italic">Buka brankas untuk melihat</span>
                        )}

                        {vaultKey && (
                          <button
                            type="button"
                            onClick={() => handleStartEdit(account)}
                            className="rounded-xl border border-purple-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-purple-50"
                          >
                            Ubah
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDelete(account.id, account.name)}
                          className="rounded-xl border border-rose-200 bg-white px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>

                    {/* Area Password Terdekripsi (Ketika Diungkapkan) */}
                    {isRevealed && (
                      <div className="mt-3 pt-3 border-t border-purple-100 flex items-center justify-between bg-white rounded-lg p-2.5 border">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-purple-950">Password:</span>
                          <code className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {revealedPasswords[account.id]}
                          </code>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyPassword(account.id, revealedPasswords[account.id])}
                          className="rounded-lg bg-purple-100 px-2.5 py-1 text-xs font-semibold text-purple-800 hover:bg-purple-200 transition"
                        >
                          {copiedId === account.id ? "✓ Tersalin!" : "📋 Salin Password"}
                        </button>
                      </div>
                    )}

                    {/* Error Dekripsi / Gagal Integritas (Fail-Closed Display) */}
                    {decryptError && (
                      <div
                        role="alert"
                        className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs font-medium text-rose-700 flex items-center justify-between"
                      >
                        <span>⚠ {decryptError}</span>
                        <button
                          onClick={() =>
                            setDecryptErrors((prev) => {
                              const c = { ...prev };
                              delete c[account.id];
                              return c;
                            })
                          }
                          className="font-bold text-rose-800 ml-2"
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
