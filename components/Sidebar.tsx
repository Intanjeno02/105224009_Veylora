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
      className="hidden min-h-[calc(100vh-4rem)] w-64 shrink-0 flex-col border-r border-purple-100/80 bg-[#fbf9fe] px-4 py-6 md:flex"
    >
      <p className="mb-4 px-3 text-xs font-semibold uppercase tracking-wider text-purple-900/60">
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
                  ? "bg-purple-700 text-white shadow-sm shadow-purple-700/20"
                  : "text-purple-900/70 hover:bg-purple-100/70 hover:text-purple-950"
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

      <div className="mt-8 rounded-xl border border-purple-100 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="text-purple-900/60">Status Vault</span>
          <span className="font-semibold text-emerald-700">
            Terkunci
          </span>
        </div>

        <div
          className="mt-3 h-2 overflow-hidden rounded-full bg-purple-100"
          role="progressbar"
          aria-label="Tingkat proteksi akun"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={82}
        >
          <div className="h-full w-[82%] rounded-full bg-emerald-600" />
        </div>

        <p className="mt-2 text-xs text-purple-900/70">
          Tingkat proteksi akun:{" "}
          <strong className="text-purple-950">82%</strong>
        </p>
      </div>
    </aside>
  );
}