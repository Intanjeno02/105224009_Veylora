"use client";

import Link from "next/link";
import { useState } from "react";

export default function Header() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header className="sticky top-0 z-40 w-full border-b border-purple-100 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Logo dan nama produk */}
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-purple-200 bg-purple-50 text-purple-700 shadow-sm">
            <span aria-hidden="true">🛡️</span>
          </div>

          <div>
            <p className="text-sm font-bold text-purple-950 sm:text-lg">
              Personal Security Assistant
            </p>
            <p className="hidden text-xs text-purple-900/60 sm:block">
              Asisten Keamanan Digital
            </p>
          </div>
        </Link>

        {/* Kolom pencarian */}
        <form
          role="search"
          onSubmit={(event) => event.preventDefault()}
          className="hidden w-full max-w-md md:block"
        >
          <label htmlFor="global-search" className="sr-only">
            Cari akun atau layanan
          </label>

          <input
            id="global-search"
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Cari akun atau layanan..."
            className="w-full rounded-xl border border-purple-200 bg-[#f7f5fb] px-4 py-2 text-sm text-purple-950 placeholder-purple-900/40 focus:border-purple-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
          />
        </form>

        {/* Profil pengguna */}
        <div className="flex shrink-0 items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-700 font-semibold text-white shadow-sm shadow-purple-700/20"
            aria-label="Profil pengguna"
          >
            I
          </div>

          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-purple-950">Intan</p>
            <p className="text-xs text-emerald-700 font-medium">Asisten Keamanan</p>
          </div>
        </div>
      </div>
    </header>
  );
}