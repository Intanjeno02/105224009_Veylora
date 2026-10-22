"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const navItems = [
  { name: "Beranda", href: "/" },
  { name: "Vault", href: "/vault" },
  { name: "Cek URL", href: "/check-url" },
  { name: "Riwayat", href: "/history" },
  { name: "Pengaturan", href: "/settings" },
  { name: "Uji Dynamic Route", href: "/uji-dynamic-route" },
];

interface AppShellProps {
children: ReactNode;
}

function NavigationLinks({ pathname }: { pathname?: string }) {
  return (
    <>
      {navItems.map((item) => {
        const isActive =
          pathname !== undefined &&
          (item.href === "/"
            ? pathname === "/"
            : pathname === item.href ||
              pathname.startsWith(`${item.href}/`));

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={`block rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
              isActive
                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-purple-900/20"
                : "text-gray-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            {item.name}
          </Link>
        );
      })}
    </>
  );
}

function ActiveNavigation() {
const pathname = usePathname();
  return <NavigationLinks pathname={pathname} />;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[#0c0a12] text-white md:flex">
      <aside className="w-full shrink-0 border-b border-white/10 bg-[#12101b] p-4 md:fixed md:inset-y-0 md:left-0 md:w-64 md:border-b-0 md:border-r">
        <div className="mb-8 px-3 py-4">
          <h1 className="text-2xl font-bold text-purple-400">Veylora</h1>
          <p className="mt-1 text-xs text-gray-400">
            Personal Security Assistant
          </p>
        </div>

        <nav aria-label="Navigasi utama" className="space-y-2">
          <Suspense fallback={<NavigationLinks />}>
            <ActiveNavigation />
          </Suspense>
        </nav>
      </aside>

      <main className="min-w-0 flex-1 md:ml-64">{children}</main>
    </div>
  );
}
