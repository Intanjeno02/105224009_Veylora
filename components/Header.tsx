"use client";

import { useState } from "react";

export default function Header() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800 bg-zinc-900">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Logo dan nama produk */}
        <a href="/" className="flex shrink-0 items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-500 text-blue-400">
            <span aria-hidden="true">🛡️</span>
          </div>

          <div>
            <p className="text-sm font-bold text-white sm:text-lg">
              Personal Security Assistant
            </p>
            <p className="hidden text-xs text-zinc-400 sm:block">
              Asisten Keamanan Digital
            </p>
          </div>
        </a>

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
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-white placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
        </form>

        {/* Profil pengguna */}
        <div className="flex shrink-0 items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 font-semibold text-white"
            aria-label="Profil pengguna"
          >
            I
          </div>

          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-white">Intan</p>
            <p className="text-xs text-emerald-400">Asisten Keamanan</p>
          </div>
        </div>
      </div>
    </header>
  );
}