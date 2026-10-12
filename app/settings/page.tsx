"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_SETTINGS,
  getSettings,
  saveSettings,
  type AppSettings,
} from "@/lib/settings-storage";
import {
  clearScanHistory,
} from "@/lib/history-storage";

export default function SettingsPage() {
  const [settings, setSettings] =
    useState<AppSettings>(DEFAULT_SETTINGS);

  const [isLoaded, setIsLoaded] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setSettings(getSettings());
    setIsLoaded(true);
  }, []);

  function updateSettings(
    key: keyof AppSettings,
    value: string | boolean
  ) {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));

    setMessage("");
  }

  function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!settings.username.trim()) {
      setMessage("Nama pengguna tidak boleh kosong.");
      return;
    }

    const updatedSettings = {
      ...settings,
      username: settings.username.trim(),
    };

    saveSettings(updatedSettings);
    setSettings(updatedSettings);

    // Terapkan tema ke elemen HTML utama.
    document.documentElement.classList.toggle(
      "dark",
      updatedSettings.theme === "dark"
    );

    document.documentElement.style.colorScheme =
      updatedSettings.theme;

    setMessage("Pengaturan berhasil disimpan.");
  }

  function handleClearHistory() {
    const confirmed = window.confirm(
      "Apakah kamu yakin ingin menghapus seluruh riwayat pemeriksaan URL?"
    );

    if (!confirmed) {
      return;
    }

    clearScanHistory();
    setMessage("Riwayat pemeriksaan berhasil dihapus.");
  }

  if (!isLoaded) {
    return (
      <main className="min-h-screen bg-zinc-950 p-8 text-white">
        Memuat pengaturan...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8">
          <p className="mb-2 text-sm font-medium text-blue-400">
            Personal Security Assistant
          </p>

          <h1 className="text-3xl font-bold tracking-tight">
            Pengaturan
          </h1>

          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            Atur preferensi penggunaan dan privasi Veylora.
          </p>
        </header>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Profil pengguna */}
          <section
            aria-labelledby="profile-title"
            className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 sm:p-7"
          >
            <h2
              id="profile-title"
              className="text-xl font-semibold"
            >
              Profil Pengguna
            </h2>

            <p className="mt-1 text-sm text-zinc-400">
              Atur nama yang digunakan pada aplikasi.
            </p>

            <div className="mt-5">
              <label
                htmlFor="username"
                className="mb-2 block text-sm font-medium text-zinc-300"
              >
                Nama pengguna
              </label>

              <input
                id="username"
                name="username"
                type="text"
                maxLength={40}
                autoComplete="nickname"
                value={settings.username}
                onChange={(event) =>
                  updateSettings(
                    "username",
                    event.target.value
                  )
                }
                required
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
          </section>

          {/* Tampilan */}
          <section
            aria-labelledby="appearance-title"
            className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 sm:p-7"
          >
            <h2
              id="appearance-title"
              className="text-xl font-semibold"
            >
              Tampilan
            </h2>

            <p className="mt-1 text-sm text-zinc-400">
              Pilih tema tampilan aplikasi.
            </p>

            <div className="mt-5">
              <label
                htmlFor="theme"
                className="mb-2 block text-sm font-medium text-zinc-300"
              >
                Tema aplikasi
              </label>

              <select
                id="theme"
                name="theme"
                value={settings.theme}
                onChange={(event) =>
                  updateSettings(
                    "theme",
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
              >
                <option value="dark">Gelap</option>
                <option value="light">Terang</option>
              </select>

              <p className="mt-2 text-xs leading-relaxed text-zinc-500">
                Pilihan tema disimpan, tetapi penerapan tema terang
                ke seluruh halaman memerlukan penyesuaian CSS global.
              </p>
            </div>
          </section>

          {/* Notifikasi */}
          <section
            aria-labelledby="notification-title"
            className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 sm:p-7"
          >
            <h2
              id="notification-title"
              className="text-xl font-semibold"
            >
              Notifikasi
            </h2>

            <p className="mt-1 text-sm text-zinc-400">
              Atur preferensi notifikasi aplikasi.
            </p>

            <label
              htmlFor="notifications"
              className="mt-5 flex cursor-pointer items-start gap-4"
            >
              <input
                id="notifications"
                name="notifications"
                type="checkbox"
                checked={settings.notifications}
                onChange={(event) =>
                  updateSettings(
                    "notifications",
                    event.target.checked
                  )
                }
                className="mt-1 h-4 w-4 accent-blue-600 focus:ring-2 focus:ring-blue-400"
              />

              <span>
                <span className="block text-sm font-medium text-zinc-200">
                  Aktifkan preferensi notifikasi
                </span>

                <span className="mt-1 block text-sm leading-relaxed text-zinc-400">
                  Simpan pilihan apakah kamu ingin menerima
                  notifikasi dari aplikasi.
                </span>
              </span>
            </label>

            <p className="mt-3 text-xs leading-relaxed text-zinc-500">
              Pengaturan ini belum mengaktifkan notifikasi otomatis.
              Sistem notifikasi perlu diimplementasikan secara terpisah.
            </p>
          </section>

          {/* Privasi */}
          <section
            aria-labelledby="privacy-title"
            className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 sm:p-7"
          >
            <h2
              id="privacy-title"
              className="text-xl font-semibold"
            >
              Privasi Data
            </h2>

            <p className="mt-1 text-sm text-zinc-400">
              Informasi mengenai penyimpanan data aplikasi.
            </p>

            <div className="mt-5 rounded-xl border border-emerald-900/60 bg-emerald-950/20 p-4">
              <h3 className="font-medium text-emerald-300">
                Penyimpanan lokal
              </h3>

              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                Pengaturan dan riwayat pemeriksaan disimpan pada
                browser yang digunakan. Implementasi ini tidak
                mengirim data tersebut ke database server.
              </p>

              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                Penyimpanan lokal belum tentu terenkripsi. Jangan
                menyimpan kata sandi asli atau informasi sensitif
                dalam penyimpanan browser biasa.
              </p>
            </div>
          </section>

          {/* Simpan pengaturan */}
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 sm:p-7">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="font-semibold">
                  Simpan Perubahan
                </h2>

                <p className="mt-1 text-sm text-zinc-400">
                  Simpan preferensi yang sudah kamu pilih.
                </p>
              </div>

              <button
                type="submit"
                className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-zinc-900"
              >
                Simpan Pengaturan
              </button>
            </div>

            {message && (
              <p
                role="status"
                aria-live="polite"
                className="mt-4 text-sm text-emerald-400"
              >
                {message}
              </p>
            )}
          </section>
        </form>

        {/* Hapus riwayat */}
        <section
          aria-labelledby="history-delete-title"
          className="mt-6 rounded-2xl border border-red-900/60 bg-zinc-900 p-5 sm:p-7"
        >
          <h2
            id="history-delete-title"
            className="text-xl font-semibold"
          >
            Hapus Riwayat
          </h2>

          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            Hapus seluruh riwayat pemeriksaan URL yang tersimpan
            pada browser ini. Tindakan ini tidak dapat dibatalkan.
          </p>

          <button
            type="button"
            onClick={handleClearHistory}
            className="mt-5 rounded-xl border border-red-800 px-5 py-3 text-sm font-medium text-red-300 transition hover:bg-red-950/50 focus:outline-none focus:ring-2 focus:ring-red-400"
          >
            Hapus Semua Riwayat
          </button>
        </section>
      </div>
    </main>
  );
}