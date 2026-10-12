"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    name: "Beranda",
    href: "/",
    icon: "⌂",
  },
  {
    name: "Vault",
    href: "/vault",
    icon: "🔒",
  },
  {
    name: "Cek URL",
    href: "/check-url",
    icon: "◎",
  },
  {
    name: "Riwayat",
    href: "/history",
    icon: "◷",
  },
  {
    name: "Pengaturan",
    href: "/settings",
    icon: "⚙",
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      aria-label="Navigasi utama"
      className="hidden min-h-[calc(100vh-4rem)] w-64 shrink-0 flex-col border-r border-zinc-800 bg-zinc-950 px-4 py-6 md:flex"
    >
      <p className="mb-4 px-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
        Menu Utama
      </p>

      <nav aria-label="Menu utama" className="space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              <span
                aria-hidden="true"
                className="flex w-6 items-center justify-center text-lg"
              >
                {item.icon}
              </span>

              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="text-zinc-400">Status Vault</span>
          <span className="font-semibold text-emerald-400">
            Terkunci
          </span>
        </div>

        <div
          className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-800"
          role="progressbar"
          aria-label="Tingkat proteksi akun"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={82}
        >
          <div className="h-full w-[82%] rounded-full bg-emerald-500" />
        </div>

        <p className="mt-2 text-xs text-zinc-400">
          Tingkat proteksi akun:{" "}
          <strong className="text-white">82%</strong>
        </p>
      </div>
    </aside>
  );
}