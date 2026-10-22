"use client";

import { useState } from "react";
import {
  DEFAULT_SETTINGS,
  getSettings,
  saveSettings,
  type AppSettings,
} from "@/lib/settings-storage";
import {
  clearScanHistory,
} from "@/lib/history-storage";
import { useLocalStorageValue } from "@/lib/use-local-storage-value";

const SETTINGS_STORAGE_KEY = "veylora-settings";

export default function SettingsPage() {
  const { value: settings, isLoaded } = useLocalStorageValue(
    SETTINGS_STORAGE_KEY,
    DEFAULT_SETTINGS,
    getSettings
  );

  if (!isLoaded) {
    return (
      <main className="min-h-screen bg-[#f7f5fb] p-8 font-medium text-purple-950">
        Memuat pengaturan...
      </main>
    );
  }

  return <SettingsContent initialSettings={settings} />;
}

function SettingsContent({
  initialSettings,
}: {
  initialSettings: AppSettings;
}) {
  const [settings, setSettings] = useState(initialSettings);
  const [message, setMessage] = useState("");

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

  return (
    <main className="min-h-screen bg-[#f7f5fb] px-4 py-8 text-slate-800 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8">
          <p className="mb-2 text-sm font-semibold text-purple-700">
            Personal Security Assistant
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-purple-950">
            Pengaturan
          </h1>

          <p className="mt-2 text-sm leading-relaxed text-purple-900/60">
            Atur preferensi penggunaan dan privasi Veylora.
          </p>
        </header>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Profil pengguna */}
          <section
            aria-labelledby="profile-title"
            className="rounded-2xl border border-purple-100 bg-white p-5 shadow-sm sm:p-7"
          >
            <h2
              id="profile-title"
              className="text-xl font-bold text-purple-950"
            >
              Profil Pengguna
            </h2>

            <p className="mt-1 text-sm text-purple-900/60">
              Atur nama yang digunakan pada aplikasi.
            </p>

            <div className="mt-5">
              <label
                htmlFor="username"
                className="mb-2 block text-sm font-medium text-purple-950/80"
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
                className="w-full rounded-xl border border-purple-200 bg-[#fbf9fe] px-4 py-3 text-sm text-purple-950 outline-none focus:border-purple-600 focus:bg-white focus:ring-2 focus:ring-purple-500/20 shadow-sm transition-all"
              />
            </div>
          </section>

          {/* Tampilan */}
          <section
            aria-labelledby="appearance-title"
            className="rounded-2xl border border-purple-100 bg-white p-5 shadow-sm sm:p-7"
          >
            <h2
              id="appearance-title"
              className="text-xl font-bold text-purple-950"
            >
              Tampilan
            </h2>

            <p className="mt-1 text-sm text-purple-900/60">
              Tampilan Veylora menggunakan tema gelap secara konsisten.
            </p>

            <div className="mt-5 inline-flex items-center gap-2 rounded-xl border border-violet-400/20 bg-violet-400/10 px-4 py-3 text-sm font-semibold text-violet-200">
              <span aria-hidden="true" className="text-base">✦</span>
              Tema Gelap Aktif
            </div>
          </section>

          {/* Notifikasi */}
          <section
            aria-labelledby="notification-title"
            className="rounded-2xl border border-purple-100 bg-white p-5 shadow-sm sm:p-7"
          >
            <h2
              id="notification-title"
              className="text-xl font-bold text-purple-950"
            >
              Notifikasi
            </h2>

            <p className="mt-1 text-sm text-purple-900/60">
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
                className="mt-1 h-4 w-4 accent-purple-700 focus:ring-2 focus:ring-purple-500/30"
              />

              <span>
                <span className="block text-sm font-medium text-purple-950">
                  Aktifkan preferensi notifikasi
                </span>

                <span className="mt-1 block text-sm leading-relaxed text-purple-900/60">
                  Simpan pilihan apakah kamu ingin menerima
                  notifikasi dari aplikasi.
                </span>
              </span>
            </label>

            <p className="mt-3 text-xs leading-relaxed text-purple-900/50">
              Pengaturan ini belum mengaktifkan notifikasi otomatis.
              Sistem notifikasi perlu diimplementasikan secara terpisah.
            </p>
          </section>

          {/* Privasi */}
          <section
            aria-labelledby="privacy-title"
            className="rounded-2xl border border-purple-100 bg-white p-5 shadow-sm sm:p-7"
          >
            <h2
              id="privacy-title"
              className="text-xl font-bold text-purple-950"
            >
              Privasi Data
            </h2>

            <p className="mt-1 text-sm text-purple-900/60">
              Informasi mengenai penyimpanan data aplikasi.
            </p>

            <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
              <h3 className="font-bold text-emerald-900">
                Penyimpanan lokal
              </h3>

              <p className="mt-2 text-sm leading-relaxed text-emerald-800/90">
                Pengaturan dan riwayat pemeriksaan disimpan pada
                browser yang digunakan. Implementasi ini tidak
                mengirim data tersebut ke database server.
              </p>

              <p className="mt-2 text-sm leading-relaxed text-emerald-800/90">
                Penyimpanan lokal belum tentu terenkripsi. Jangan
                menyimpan kata sandi asli atau informasi sensitif
                dalam penyimpanan browser biasa.
              </p>
            </div>
          </section>

          {/* Simpan pengaturan */}
          <section className="rounded-2xl border border-purple-100 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="font-bold text-purple-950">
                  Simpan Perubahan
                </h2>

                <p className="mt-1 text-sm text-purple-900/60">
                  Simpan preferensi yang sudah kamu pilih.
                </p>
              </div>

              <button
                type="submit"
                className="rounded-xl bg-purple-700 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-purple-700/20 transition hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
              >
                Simpan Pengaturan
              </button>
            </div>

            {message && (
              <p
                role="status"
                aria-live="polite"
                className="mt-4 text-sm font-medium text-emerald-700"
              >
                {message}
              </p>
            )}
          </section>
        </form>

        {/* Hapus riwayat */}
        <section
          aria-labelledby="history-delete-title"
          className="mt-6 rounded-2xl border border-rose-200 bg-rose-50/40 p-5 shadow-sm sm:p-7"
        >
          <h2
            id="history-delete-title"
            className="text-xl font-bold text-rose-950"
          >
            Hapus Riwayat
          </h2>

          <p className="mt-2 text-sm leading-relaxed text-rose-900/70">
            Hapus seluruh riwayat pemeriksaan URL yang tersimpan
            pada browser ini. Tindakan ini tidak dapat dibatalkan.
          </p>

          <button
            type="button"
            onClick={handleClearHistory}
            className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 focus:outline-none focus:ring-2 focus:ring-rose-400"
          >
            Hapus Semua Riwayat
          </button>
        </section>
      </div>
    </main>
  );
}