"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type StoredAccount = {
  id: string;
  name: string;
  username?: string;
  email?: string;
  url?: string;
  category?: string;
  createdAt?: string;
  updatedAt?: string;
};

type DashboardAccount = {
  id: string;
  name: string;
  username: string;
  category: string;
  strength: string;
  lastUpdated: string;
  badgeColor: string;
  dotColor: string;
  initial: string;
  color: string;
};

const STORAGE_KEY = "personal-security-accounts";
const EMPTY_URLS: { id: string; url: string; domain: string; status: string; description: string; time: string; badgeColor: string }[] = [];

export default function DashboardPage() {
  const pathname = usePathname();
  if (new URLSearchParams(window.location.search).get("test-error") === "true") {
  throw new Error("Pengujian error.tsx");
    }
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotification, setShowNotification] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<DashboardAccount[]>([]);
  const [testError, setTestError] = useState(false);

  // Pengujian error.tsx (hapus bagian ini untuk menghilangkan tombol uji reror)
  if (testError) {
  throw new Error("Pengujian error.tsx");
    }

  // Ambil akun dari localStorage yang juga dipakai oleh halaman Vault.
  useEffect(() => {
    const loadAccounts = () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const stored: StoredAccount[] = raw ? JSON.parse(raw) : [];
        const mapped = stored.map((account, index): DashboardAccount => {
          const name = account.name || "Akun tanpa nama";
          const palette = [
            { color: "from-purple-600 to-indigo-700", badgeColor: "bg-purple-50 text-purple-800 border-purple-200", dotColor: "bg-purple-600" },
            { color: "from-emerald-600 to-teal-700", badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200", dotColor: "bg-emerald-600" },
            { color: "from-violet-700 to-purple-800", badgeColor: "bg-purple-50 text-purple-800 border-purple-200", dotColor: "bg-purple-600" },
          ];
          const style = palette[index % palette.length];
          return {
            id: account.id,
            name,
            username: account.username || account.email || account.url || "",
            category: account.category || "Lainnya",
            strength: "Belum dianalisis",
            lastUpdated: account.updatedAt ? new Date(account.updatedAt).toLocaleDateString("id-ID") : "—",
            badgeColor: style.badgeColor,
            dotColor: style.dotColor,
            initial: name.slice(0, 2).toUpperCase(),
            color: style.color,
          };
        });
        setAccounts(mapped);
      } catch {
        setAccounts([]);
      }
    };

    loadAccounts();
    window.addEventListener("storage", loadAccounts);
    window.addEventListener("focus", loadAccounts);
    return () => {
      window.removeEventListener("storage", loadAccounts);
      window.removeEventListener("focus", loadAccounts);
    };
  }, []);

  const filteredAccounts = accounts.filter(
    (acc) =>
      acc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Riwayat URL akan kosong sampai fitur pemindaian benar-benar menyimpan hasil.
  const filteredUrls = EMPTY_URLS.filter(
    (item) =>
      item.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const navItems = [
    {
      name: "Beranda",
      href: "/",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      name: "Vault",
      href: "/vault",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
    },
    {
      name: "Cek URL",
      href: "/check-url",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
      ),
    },
    {
      name: "Riwayat",
      href: "/history",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      name: "Pengaturan",
      href: "/settings",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      name: "Uji Dynamic Route",
      href: "/uji-dynamic-route",
      icon: (
        <span aria-hidden="true" className="text-lg">
          {"</>"}
        </span>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#f7f5fb] text-slate-800 flex flex-col font-sans transition-colors duration-200">
      {/* 1. HEADER (<header>) */}
      <header className="sticky top-0 z-40 w-full border-b border-purple-100 bg-white/95 backdrop-blur-md transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-700 via-violet-600 to-purple-500 p-0.5 flex items-center justify-center shadow-md shadow-purple-600/20">
              <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-purple-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.2"
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
            </div>
            <div>
              <span className="font-bold text-base sm:text-lg tracking-tight bg-gradient-to-r from-purple-950 via-purple-900 to-violet-800 bg-clip-text text-transparent">
                Veylora
              </span>
              <span className="hidden sm:inline-block ml-2 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase rounded bg-purple-100 text-purple-800 border border-purple-200">
                v2.6
              </span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-purple-900/40">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari akun atau layanan..."
                className="w-full pl-10 pr-4 py-2 text-sm bg-purple-50/70 border border-purple-100/80 focus:border-purple-600 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-purple-950 placeholder-purple-900/40 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-purple-900/50 hover:text-purple-950"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Actions & Profile */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Notification Icon with Badge */}
            <div className="relative">
              <button
                onClick={() => setShowNotification(!showNotification)}
                className="p-2.5 rounded-xl text-purple-900/70 hover:bg-purple-50 transition-colors relative"
                aria-label="Pemberitahuan"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                {/* Notification Badge */}
                <span className="absolute top-1.5 right-1.5 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-600 text-white text-[9px] font-bold items-center justify-center">
                    3
                  </span>
                </span>
              </button>

              {/* Notification Dropdown Menu */}
              {showNotification && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-purple-100 p-4 z-50 text-xs text-purple-950">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-purple-100 font-semibold">
                    <span>Pemberitahuan Keamanan</span>
                    <span className="text-[10px] text-purple-700 hover:text-purple-900 cursor-pointer">
                      Tandai dibaca
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="p-2 rounded-lg bg-rose-50 border border-rose-100 text-rose-800">
                      ⚠️ 1 URL Berbahaya baru saja diblokir sistem.
                    </div>
                    <div className="p-2 rounded-lg bg-amber-50 border border-amber-100 text-amber-800">
                      🔑 Kata sandi Netflix Anda terdeteksi lemah.
                    </div>
                    <div className="p-2 rounded-lg bg-purple-50 border border-purple-100 text-purple-800">
                      🛡️ Pemindaian berkala selesai. Skor: 82/100.
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile */}
            <div className="flex items-center gap-3 pl-2 sm:pl-3 border-l border-purple-100">
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-700 to-violet-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm ring-2 ring-white">
                  I
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white"></span>
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-sm font-semibold leading-tight text-purple-950">
                  Intan
                </div>
                <div className="text-[11px] text-purple-900/60 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Terlindungi
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Search Bar Row */}
        <div className="p-3 md:hidden border-t border-purple-100">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-purple-900/40">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari akun atau layanan..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-purple-50/70 border border-purple-100/70 rounded-lg text-purple-950 placeholder-purple-900/40 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>
        </div>
      </header>

      {/* 2. BODY LAYOUT (<aside> & <main>) */}
      <div className="flex-1 flex w-full max-w-7xl mx-auto px-0 sm:px-4 lg:px-8"> 

        {/* Main Content Area (<main>) */}
        <main className="flex-1 min-w-0 py-6 px-4 sm:px-6 lg:px-8 space-y-6 pb-28 md:pb-8">
            <button
                onClick={() => setTestError(true)}
                className="rounded-xl bg-red-600 px-4 py-2 text-white"
            >
                Uji Error
            </button>
          {/* HERO SECTION */}
          <section
            aria-label="Hero Banner"
            className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-900 via-violet-900 to-indigo-950 text-white shadow-xl shadow-purple-950/20 p-6 sm:p-8"
          >
            {/* Background cyber pattern decor */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>
            <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-purple-400/20 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
              {/* Text & Greetings */}
              <div className="max-w-xl text-center lg:text-left space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-xs font-medium text-purple-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Data akun tersimpan di perangkat ini
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
                  Halo! 👋
                </h1>
                <p className="text-sm sm:text-base text-purple-100 leading-relaxed">
                  Kelola akun digital kamu dari satu tempat. Tambahkan akun melalui Vault untuk mulai mengisi dashboard ini.
                </p>
                <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-3">
                  <button className="px-5 py-2.5 rounded-xl bg-white text-purple-900 font-semibold text-xs sm:text-sm hover:bg-purple-50 shadow-md shadow-black/10 transition-transform active:scale-95 flex items-center gap-2">
                    <svg className="w-4 h-4 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Pindai Ulang Sekarang
                  </button>
                  <button className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-medium text-xs sm:text-sm backdrop-blur-sm border border-white/20 transition-all flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Tambah Akun Baru
                  </button>
                </div>
              </div>

              {/* Security Shield Illustration Placeholder */}
              <div className="shrink-0 relative flex items-center justify-center">
                <div className="relative w-40 h-40 sm:w-48 sm:h-48 flex items-center justify-center">
                  {/* Glowing Rings */}
                  <div className="absolute inset-0 rounded-full border border-purple-400/30 animate-spin [animation-duration:16s]"></div>
                  <div className="absolute inset-2 rounded-full border border-white/20 border-dashed"></div>
                  
                  {/* Shield graphic placeholder */}
                  <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-gradient-to-tr from-purple-500/20 to-violet-400/30 backdrop-blur-md border border-purple-300/40 shadow-inner flex flex-col items-center justify-center transform hover:rotate-2 transition-transform">
                    <svg
                      className="w-14 h-14 sm:w-16 sm:h-16 text-purple-200 drop-shadow-[0_4px_12px_rgba(168,85,247,0.5)]"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
                    </svg>
                    <span className="text-[10px] font-bold text-purple-200 uppercase tracking-widest mt-1">
                      Vault Lokal
                    </span>
                  </div>

                  {/* Floating badge */}
                  <div className="absolute -bottom-2 -left-2 bg-purple-950/90 text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-500/40 text-emerald-400 flex items-center gap-1 shadow-lg backdrop-blur">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    Data di perangkat
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* STATISTICS CARDS SECTION (<section>) */}
          <section aria-label="Statistik Keamanan" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total Akun */}
            <div className="bg-white rounded-2xl p-5 border border-purple-100 shadow-sm hover:border-purple-300 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-purple-900/60">
                  Total Akun
                </span>
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-purple-950 tracking-tight">
                  {accounts.length}
                </span>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Tersimpan di Vault
                </span>
              </div>
              <p className="mt-2 text-xs text-purple-900/60">
                Semua akun aktif dalam pengawasan
              </p>
            </div>

            {/* Card 2: Password Lemah */}
            <div className="bg-white rounded-2xl p-5 border border-purple-100 shadow-sm hover:border-purple-300 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-purple-900/60">
                  Password Lemah
                </span>
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-rose-600 tracking-tight">
                  0
                </span>
                <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                  Perlu Diganti
                </span>
              </div>
              <p className="mt-2 text-xs text-purple-900/60">
                Rentan terhadap peretasan brute force
              </p>
            </div>

            {/* Card 3: Password Reused */}
            <div className="bg-white rounded-2xl p-5 border border-purple-100 shadow-sm hover:border-purple-300 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-purple-900/60">
                  Password Reused
                </span>
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"
                    />
                  </svg>
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-amber-600 tracking-tight">
                  0
                </span>
                <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  Kata Sandi Duplikat
                </span>
              </div>
              <p className="mt-2 text-xs text-purple-900/60">
                Satu sandi bocor membahayakan akun lain
              </p>
            </div>

            {/* Card 4: URL Mencurigakan */}
            <div className="bg-white rounded-2xl p-5 border border-purple-100 shadow-sm hover:border-purple-300 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-purple-900/60">
                  URL Mencurigakan
                </span>
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-purple-950 tracking-tight">
                  0
                </span>
                <span className="text-[11px] font-semibold text-purple-800 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                  Terdeteksi Phishing
                </span>
              </div>
              <p className="mt-2 text-xs text-purple-900/60">
                1 tautan berbahaya telah diamankan
              </p>
            </div>
          </section>

          {/* DATA TABLES / LISTS SECTION (<section>) */}
          <section aria-label="Daftar Akun dan Riwayat Pemindaian" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* "Akun Terbaru" Table (Takes 2 Columns on Large Screens) */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-purple-100 shadow-sm overflow-hidden flex flex-col">
              {/* Header */}
              <div className="p-5 sm:p-6 border-b border-purple-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-purple-950 flex items-center gap-2">
                    <span>Akun Terbaru</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-100 font-normal">
                      {filteredAccounts.length} Akun
                    </span>
                  </h3>
                  <p className="text-xs text-purple-900/60 mt-0.5">
                    Daftar akun tersimpan beserta evaluasi kekuatan kata sandi.
                  </p>
                </div>
                <button className="text-xs font-semibold text-purple-700 hover:text-purple-900 flex items-center gap-1 transition-colors">
                  <span>Lihat Semua Akun</span>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Responsive Table */}
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-purple-50/60 text-[11px] font-semibold uppercase tracking-wider text-purple-900/70 border-b border-purple-100">
                      <th className="py-3 px-4 sm:px-6">Layanan / Akun</th>
                      <th className="py-3 px-4">Kekuatan Sandi</th>
                      <th className="py-3 px-4 hidden sm:table-cell">Terakhir Diperbarui</th>
                      <th className="py-3 px-4 sm:px-6 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-100 text-xs sm:text-sm">
                    {filteredAccounts.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-purple-900/50">
                          Tidak ditemukan akun yang sesuai dengan pencarian &quot;{searchQuery}&quot;.
                        </td>
                      </tr>
                    ) : (
                      filteredAccounts.map((account) => (
                        <tr
                          key={account.id}
                          className="hover:bg-purple-50/40 transition-colors"
                        >
                          {/* Service & Username */}
                          <td className="py-3.5 px-4 sm:px-6">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${account.color} text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm`}
                              >
                                {account.initial}
                              </div>
                              <div className="min-w-0">
                                <div className="font-semibold text-purple-950">
                                  {account.name}
                                </div>
                                <div className="text-[11px] text-purple-900/60 truncate max-w-[150px] sm:max-w-xs">
                                  {account.username}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Status Pill (Kuat, Sedang, Lemah) */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${account.badgeColor}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${account.dotColor}`}></span>
                              {account.strength}
                            </span>
                          </td>

                          {/* Last Updated */}
                          <td className="py-3.5 px-4 text-xs text-purple-900/60 hidden sm:table-cell whitespace-nowrap">
                            {account.lastUpdated}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => setSelectedAccount(account.name)}
                                className="p-1.5 text-purple-900/50 hover:text-purple-950 hover:bg-purple-50 rounded-lg transition-colors"
                                title="Lihat Kredensial"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                  />
                                </svg>
                              </button>
                              <button
                                className="p-1.5 text-purple-900/50 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                                title="Perbarui Kata Sandi"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                  />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Alert detail modal preview if an account is clicked */}
              {selectedAccount && (
                <div className="p-3 bg-purple-50 border-t border-purple-100 flex items-center justify-between text-xs text-purple-900">
                  <div className="flex items-center gap-2">
                    <span>🔐 Akun <strong>{selectedAccount}</strong> tercatat di Vault lokal. Enkripsi belum diverifikasi.</span>
                  </div>
                  <button
                    onClick={() => setSelectedAccount(null)}
                    className="font-bold text-purple-700 hover:text-purple-900 hover:underline text-[11px]"
                  >
                    Tutup
                  </button>
                </div>
              )}
            </div>

            {/* "Riwayat Pemandian URL" (URL Scan History) (1 Column) */}
            <div className="bg-white rounded-3xl border border-purple-100 shadow-sm p-5 sm:p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-purple-100">
                  <div>
                    <h3 className="text-base font-bold text-purple-950">
                      Riwayat Pemindaian Tautan URL
                    </h3>
                    <p className="text-xs text-purple-900/60 mt-0.5">
                      Log analisis pemindaian tautan web terkini.
                    </p>
                  </div>
                  <span className="p-2 rounded-xl bg-purple-50 text-purple-700">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                  </span>
                </div>

                {/* Scan List */}
                <div className="mt-4 space-y-3">
                  {filteredUrls.length === 0 ? (
                    <div className="py-6 text-center text-xs text-purple-900/50">
                      Tidak ada riwayat pemindaian URL ditemukan.
                    </div>
                  ) : (
                    filteredUrls.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-2xl bg-[#faf8fd] border border-purple-100/70 hover:border-purple-300 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-xs text-purple-950 truncate max-w-[170px]">
                            {item.domain}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.badgeColor}`}
                          >
                            {item.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-purple-900/60 truncate mt-1">
                          {item.url}
                        </p>
                        <div className="mt-2 flex items-center justify-between text-[10px] text-purple-900/50 pt-1 border-t border-purple-100/70">
                          <span>{item.description}</span>
                          <span>{item.time}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Quick Scan Input Button */}
              <div className="mt-5 pt-3 border-t border-purple-100">
                <button className="w-full py-2.5 px-4 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-semibold shadow-md shadow-purple-700/20 transition-all flex items-center justify-center gap-2">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <span>Pindai URL Baru</span>
                </button>
              </div>
            </div>
          </section>

          {/* SECURITY RECOMMENDATION BANNER */}
          <section aria-label="Rekomendasi Keamanan">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500/10 via-purple-500/5 to-purple-500/10 border border-purple-200/80 p-5 sm:p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-600 border border-amber-500/30 flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm sm:text-base font-bold text-purple-950">
                        Rekomendasi Keamanan Kritis
                      </h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-700 border border-rose-500/30 uppercase">
                        Tindakan Dibutuhkan
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-purple-900/70 mt-1 leading-relaxed max-w-2xl">
                      Analisis kekuatan kata sandi belum tersedia. Pastikan setiap akun memakai kata sandi yang kuat dan berbeda.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0 pt-2 sm:pt-0">
                  <button className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 active:bg-purple-900 text-white font-semibold text-xs sm:text-sm shadow-md shadow-purple-700/20 transition-all flex items-center justify-center gap-2">
                    <span>Lihat Detail Rekomendasi</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                  <button className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-purple-50 text-purple-900 font-medium text-xs sm:text-sm border border-purple-200 transition-all">
                    Abaikan
                  </button>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>

      {/* 3. TABLET & MOBILE BOTTOM NAVIGATION BAR */}
      <nav
        aria-label="Navigasi Bawah Mobile"
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-purple-100 px-2 py-2 safe-bottom shadow-2xl"
      >
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all relative ${
                  isActive
                    ? "text-purple-700 font-semibold"
                    : "text-purple-900/50 hover:text-purple-950"
                }`}
              >
                <div
                  className={`p-1 rounded-lg ${
                    isActive ? "bg-purple-50" : ""
                  }`}
                >
                  {item.icon}
                </div>
                <span className="text-[10px] mt-0.5 tracking-tight">{item.name}</span>
                {item.name === "Vault" && (
                  <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-rose-500"></span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* 4. FOOTER (<footer>) */}
      <footer className="border-t border-purple-100 bg-white py-6 px-4 sm:px-6 lg:px-8 mt-auto text-xs text-purple-900/60">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-purple-950/80">© 2026 Veylora. Hak Cipta Dilindungi.</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-medium">
            <a
              href="#privasi"
              className="text-purple-900/70 hover:text-purple-700 transition-colors"
            >
              Privasi
            </a>
            <a
              href="#syarat"
              className="text-purple-900/70 hover:text-purple-700 transition-colors"
            >
              Syarat & Ketentuan
            </a>
            <a
              href="#bantuan"
              className="text-purple-900/70 hover:text-purple-700 transition-colors"
            >
              Bantuan
            </a>
            <span className="hidden sm:inline text-purple-200">|</span>
            <span className="text-xs text-purple-900/50">
              Penyimpanan lokal · Enkripsi belum diterapkan
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
