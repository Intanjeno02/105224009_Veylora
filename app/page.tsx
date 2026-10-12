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
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotification, setShowNotification] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<DashboardAccount[]>([]);

  // Ambil akun dari localStorage yang juga dipakai oleh halaman Vault.
  useEffect(() => {
    const loadAccounts = () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const stored: StoredAccount[] = raw ? JSON.parse(raw) : [];
        const mapped = stored.map((account, index): DashboardAccount => {
          const name = account.name || "Akun tanpa nama";
          const palette = [
            { color: "from-blue-500 to-indigo-600", badgeColor: "bg-slate-500/10 text-slate-500 border-slate-500/20", dotColor: "bg-slate-400" },
            { color: "from-emerald-500 to-teal-700", badgeColor: "bg-slate-500/10 text-slate-500 border-slate-500/20", dotColor: "bg-slate-400" },
            { color: "from-violet-500 to-purple-700", badgeColor: "bg-slate-500/10 text-slate-500 border-slate-500/20", dotColor: "bg-slate-400" },
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
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-200">
      {/* 1. HEADER (<header>) */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 p-0.5 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <div className="w-full h-full bg-white dark:bg-zinc-900 rounded-[10px] flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-blue-600 dark:text-blue-400"
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
              <span className="font-bold text-base sm:text-lg tracking-tight bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-800 dark:from-white dark:via-blue-200 dark:to-indigo-300 bg-clip-text text-transparent">
                Veylora
              </span>
              <span className="hidden sm:inline-block ml-2 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                v2.6
              </span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-zinc-500">
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
                className="w-full pl-10 pr-4 py-2 text-sm bg-slate-100/80 dark:bg-zinc-800/80 border border-transparent focus:border-blue-500 dark:focus:border-blue-400 rounded-xl focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
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
                className="p-2.5 rounded-xl text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors relative"
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
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-slate-200 dark:border-zinc-800 p-4 z-50 text-xs">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-zinc-800 font-semibold">
                    <span>Pemberitahuan Keamanan</span>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 cursor-pointer">
                      Tandai dibaca
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300">
                      ⚠️ 1 URL Berbahaya baru saja diblokir sistem.
                    </div>
                    <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300">
                      🔑 Kata sandi Netflix Anda terdeteksi lemah.
                    </div>
                    <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300">
                      🛡️ Pemindaian berkala selesai. Skor: 82/100.
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile */}
            <div className="flex items-center gap-3 pl-2 sm:pl-3 border-l border-slate-200 dark:border-zinc-800">
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm shadow-md ring-2 ring-white dark:ring-zinc-800">
                  I
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-900"></span>
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-sm font-semibold leading-tight text-slate-900 dark:text-zinc-100">
                  Intan
                </div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Terlindungi
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Search Bar Row */}
        <div className="p-3 md:hidden border-t border-slate-100 dark:border-zinc-800">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
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
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-100 dark:bg-zinc-800 border-none rounded-lg text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
        </div>
      </header>

      {/* 2. BODY LAYOUT (<aside> & <main>) */}
      <div className="flex-1 flex w-full max-w-7xl mx-auto px-0 sm:px-4 lg:px-8">
        {/* Desktop Sidebar (<aside>) */}
        <aside
          aria-label="Navigasi Utama Desktop"
          className="hidden md:flex w-64 flex-col justify-between py-6 pr-6 shrink-0 border-r border-slate-200/80 dark:border-zinc-800 min-h-[calc(100vh-4rem)]"
        >
          {/* Main Navigation Links */}
          <div className="space-y-6">
            <div>
              <p className="px-3 text-[11px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
                Menu Utama
              </p>
              <nav className="space-y-1">
 {navItems.map((item) => {
  const isActive = pathname === item.href;

  return (
    <Link
      key={item.name}
      href={item.href}
      aria-current={isActive ? "page" : undefined}
      className={`w-full flex items-center gap-3 rounded-xl px-3 py-3 ${
        isActive
          ? "bg-blue-600 text-white"
          : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-zinc-800"
      }`}
    >
      <span>{item.icon}</span>
      <span>{item.name}</span>
    </Link>
  );
})}
              </nav>
            </div>

            {/* Quick Status Widget */}
            <div className="p-3.5 rounded-xl bg-slate-100/70 dark:bg-zinc-900/70 border border-slate-200/60 dark:border-zinc-800 text-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400">
                <span>Status Vault</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Terkunci</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full w-[82%] rounded-full"></div>
              </div>
              <p className="text-[10px] text-slate-400 dark:text-zinc-500">
                <strong className="text-slate-700 dark:text-zinc-300">Belum dianalisis</strong>
              </p>
            </div>
          </div>

          {/* Security Tip Box at the Bottom of Sidebar */}
          <div className="mt-auto pt-6">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 p-4 text-white shadow-lg border border-indigo-700/30">
              <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-blue-500/20 rounded-full blur-xl pointer-events-none"></div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-cyan-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-xs text-cyan-200">Tips Keamanan</h4>
                  <p className="text-[11px] text-slate-200 leading-relaxed mt-1">
                    Aktifkan Autentikasi Dua Faktor (2FA) pada akun email untuk mencegah akses tak dikenal hingga 99%.
                  </p>
                </div>
              </div>
              <button className="mt-3 w-full py-1.5 px-3 bg-white/10 hover:bg-white/20 active:bg-white/30 rounded-lg text-[11px] font-medium text-white transition-colors border border-white/10 flex items-center justify-center gap-1">
                <span>Pelajari Selengkapnya</span>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area (<main>) */}
        <main className="flex-1 min-w-0 py-6 px-4 sm:px-6 lg:px-8 space-y-6 pb-28 md:pb-8">
          {/* HERO SECTION */}
          <section
            aria-label="Hero Banner"
            className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white shadow-xl shadow-indigo-700/10 p-6 sm:p-8"
          >
            {/* Background cyber pattern decor */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>
            <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-cyan-400/20 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
              {/* Text & Greetings */}
              <div className="max-w-xl text-center lg:text-left space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-xs font-medium text-cyan-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Data akun tersimpan di perangkat ini
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
                  Halo! 👋
                </h1>
                <p className="text-sm sm:text-base text-blue-100 leading-relaxed">
                  Kelola akun digital kamu dari satu tempat. Tambahkan akun melalui Vault untuk mulai mengisi dashboard ini.
                </p>
                <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-3">
                  <button className="px-5 py-2.5 rounded-xl bg-white text-blue-700 font-semibold text-xs sm:text-sm hover:bg-blue-50 shadow-md shadow-black/10 transition-transform active:scale-95 flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  <div className="absolute inset-0 rounded-full border border-cyan-400/30 animate-spin [animation-duration:16s]"></div>
                  <div className="absolute inset-2 rounded-full border border-white/20 border-dashed"></div>
                  
                  {/* Shield graphic placeholder */}
                  <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-blue-400/30 backdrop-blur-md border border-cyan-300/40 shadow-inner flex flex-col items-center justify-center transform hover:rotate-2 transition-transform">
                    <svg
                      className="w-14 h-14 sm:w-16 sm:h-16 text-cyan-200 drop-shadow-[0_4px_12px_rgba(34,211,238,0.5)]"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
                    </svg>
                    <span className="text-[10px] font-bold text-cyan-200 uppercase tracking-widest mt-1">
                      Vault Lokal
                    </span>
                  </div>

                  {/* Floating badge */}
                  <div className="absolute -bottom-2 -left-2 bg-slate-900/90 text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-500/40 text-emerald-400 flex items-center gap-1 shadow-lg backdrop-blur">
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
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-slate-200/80 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
                  Total Akun
                </span>
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
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
                <span className="text-3xl font-extrabold text-slate-900 dark:text-zinc-100 tracking-tight">
                  {accounts.length}
                </span>
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  Tersimpan di Vault
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-500 dark:text-zinc-400">
                Semua akun aktif dalam pengawasan
              </p>
            </div>

            {/* Card 2: Password Lemah */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-slate-200/80 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
                  Password Lemah
                </span>
                <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
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
                <span className="text-3xl font-extrabold text-rose-600 dark:text-rose-400 tracking-tight">
                  0
                </span>
                <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800">
                  Perlu Diganti
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-500 dark:text-zinc-400">
                Rentan terhadap peretasan brute force
              </p>
            </div>

            {/* Card 3: Password Reused */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-slate-200/80 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
                  Password Reused
                </span>
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
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
                <span className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 tracking-tight">
                  0
                </span>
                <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                  Kata Sandi Duplikat
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-500 dark:text-zinc-400">
                Satu sandi bocor membahayakan akun lain
              </p>
            </div>

            {/* Card 4: URL Mencurigakan */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-slate-200/80 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
                  URL Mencurigakan
                </span>
                <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
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
                <span className="text-3xl font-extrabold text-purple-600 dark:text-purple-400 tracking-tight">
                  0
                </span>
                <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-full border border-purple-200 dark:border-purple-800">
                  Terdeteksi Phishing
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-500 dark:text-zinc-400">
                1 tautan berbahaya telah diamankan
              </p>
            </div>
          </section>

          {/* DATA TABLES / LISTS SECTION (<section>) */}
          <section aria-label="Daftar Akun dan Riwayat Pemindaian" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* "Akun Terbaru" Table (Takes 2 Columns on Large Screens) */}
            <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200/80 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col">
              {/* Header */}
              <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                    <span>Akun Terbaru</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 font-normal">
                      {filteredAccounts.length} Akun
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                    Daftar akun tersimpan beserta evaluasi kekuatan kata sandi.
                  </p>
                </div>
                <button className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center gap-1 transition-colors">
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
                    <tr className="bg-slate-50/70 dark:bg-zinc-800/40 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500 border-b border-slate-100 dark:border-zinc-800">
                      <th className="py-3 px-4 sm:px-6">Layanan / Akun</th>
                      <th className="py-3 px-4">Kekuatan Sandi</th>
                      <th className="py-3 px-4 hidden sm:table-cell">Terakhir Diperbarui</th>
                      <th className="py-3 px-4 sm:px-6 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 text-xs sm:text-sm">
                    {filteredAccounts.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-400 dark:text-zinc-500">
                          Tidak ditemukan akun yang sesuai dengan pencarian &quot;{searchQuery}&quot;.
                        </td>
                      </tr>
                    ) : (
                      filteredAccounts.map((account) => (
                        <tr
                          key={account.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition-colors"
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
                                <div className="font-semibold text-slate-900 dark:text-zinc-100">
                                  {account.name}
                                </div>
                                <div className="text-[11px] text-slate-500 dark:text-zinc-400 truncate max-w-[150px] sm:max-w-xs">
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
                          <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-zinc-400 hidden sm:table-cell whitespace-nowrap">
                            {account.lastUpdated}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => setSelectedAccount(account.name)}
                                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
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
                                className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-zinc-800 rounded-lg transition-colors"
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
                <div className="p-3 bg-blue-50/80 dark:bg-blue-950/40 border-t border-blue-100 dark:border-blue-900/50 flex items-center justify-between text-xs text-blue-800 dark:text-blue-300">
                  <div className="flex items-center gap-2">
                    <span>🔐 Akun <strong>{selectedAccount}</strong> tercatat di Vault lokal. Enkripsi belum diverifikasi.</span>
                  </div>
                  <button
                    onClick={() => setSelectedAccount(null)}
                    className="font-bold text-blue-600 dark:text-blue-400 hover:underline text-[11px]"
                  >
                    Tutup
                  </button>
                </div>
              )}
            </div>

            {/* "Riwayat Pemandian URL" (URL Scan History) (1 Column) */}
            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200/80 dark:border-zinc-800 shadow-sm p-5 sm:p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                      Riwayat Pemindaian Tautan URL
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                      Log analisis pemindaian tautan web terkini.
                    </p>
                  </div>
                  <span className="p-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300">
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
                    <div className="py-6 text-center text-xs text-slate-400 dark:text-zinc-500">
                      Tidak ada riwayat pemindaian URL ditemukan.
                    </div>
                  ) : (
                    filteredUrls.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-2xl bg-slate-50/70 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800/80 hover:border-slate-200 dark:hover:border-zinc-700 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-xs text-slate-800 dark:text-zinc-200 truncate max-w-[170px]">
                            {item.domain}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.badgeColor}`}
                          >
                            {item.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 dark:text-zinc-500 truncate mt-1">
                          {item.url}
                        </p>
                        <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 dark:text-zinc-500 pt-1 border-t border-slate-200/50 dark:border-zinc-800/60">
                          <span>{item.description}</span>
                          <span>{item.time}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Quick Scan Input Button */}
              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-zinc-800">
                <button className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-2">
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
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 dark:from-amber-950/20 dark:via-orange-950/20 dark:to-rose-950/20 border border-amber-500/30 dark:border-amber-500/20 p-5 sm:p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
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
                      <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-zinc-100">
                        Rekomendasi Keamanan Kritis
                      </h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30 uppercase">
                        Tindakan Dibutuhkan
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 mt-1 leading-relaxed max-w-2xl">
                      Analisis kekuatan kata sandi belum tersedia. Pastikan setiap akun memakai kata sandi yang kuat dan berbeda.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0 pt-2 sm:pt-0">
                  <button className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-semibold text-xs sm:text-sm shadow-md shadow-amber-600/20 transition-all flex items-center justify-center gap-2">
                    <span>Lihat Detail Rekomendasi</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                  <button className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-medium text-xs sm:text-sm border border-slate-200 dark:border-zinc-700 transition-all">
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
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-zinc-800 px-2 py-2 safe-bottom shadow-2xl"
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
                    ? "text-blue-600 dark:text-blue-400 font-semibold"
                    : "text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300"
                }`}
              >
                <div
                  className={`p-1 rounded-lg ${
                    isActive ? "bg-blue-50 dark:bg-blue-950/60" : ""
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
      <footer className="border-t border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-6 px-4 sm:px-6 lg:px-8 mt-auto text-xs text-slate-500 dark:text-zinc-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>© 2026 Veylora. Hak Cipta Dilindungi.</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-medium">
            <a
              href="#privasi"
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Privasi
            </a>
            <a
              href="#syarat"
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Syarat & Ketentuan
            </a>
            <a
              href="#bantuan"
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Bantuan
            </a>
            <span className="hidden sm:inline text-slate-300 dark:text-zinc-700">|</span>
            <span className="text-xs text-zinc-500">
  Penyimpanan lokal · Enkripsi belum diterapkan
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
