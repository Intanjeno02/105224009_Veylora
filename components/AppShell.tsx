"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { UserIdProvider } from "@/components/UserIdContext";

const navItems = [
  { name: "Beranda", href: "/" },
  { name: "Vault", href: "/vault" },
  { name: "Cek URL", href: "/check-url" },
  { name: "Riwayat", href: "/history" },
  { name: "Pengaturan", href: "/settings" },
  { name: "Uji Dynamic Route", href: "/uji-dynamic-route" },
];

interface AppShellProps {
  userId: string;
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

export default function AppShell({ userId, children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [isNotFound, setIsNotFound] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Memeriksa halaman Not Found
  useEffect(() => {
    const checkNotFound = () => {
      setIsNotFound(
        document.documentElement.dataset.notFound === "true"
      );
    };

    checkNotFound();

    window.addEventListener("not-found-change", checkNotFound);

    return () => {
      window.removeEventListener("not-found-change", checkNotFound);
    };
  }, [pathname]);

  // Logout menggunakan API dan menghapus HttpOnly cookie
  async function handleLogout() {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      const response = await fetch("/api/logout", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Logout gagal.");
      }

      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoggingOut(false);
      alert("Gagal logout. Silakan coba lagi.");
    }
  }

  return (
    <UserIdProvider userId={userId}>
      {isNotFound ? (
        children
      ) : (
        <div className="min-h-screen bg-[#0c0a12] text-white md:flex">
          {/* Sidebar */}
          <aside className="w-full shrink-0 border-b border-white/10 bg-[#12101b] p-4 md:fixed md:inset-y-0 md:left-0 md:w-64 md:border-b-0 md:border-r">
            <div className="mb-8 px-3 py-4">
              <h1 className="text-2xl font-bold text-purple-400">
                Veylora
              </h1>

              <p className="mt-1 text-xs text-gray-400">
                Personal Security Assistant
              </p>
            </div>

            {/* Navigation */}
            <nav aria-label="Navigasi utama" className="space-y-2">
              <Suspense fallback={<NavigationLinks />}>
                <ActiveNavigation />
              </Suspense>
            </nav>

            {/* Logout */}
            <div className="mt-8 border-t border-white/10 pt-4">
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-rose-300 transition-colors hover:bg-rose-500/10 hover:text-rose-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span aria-hidden="true">🚪</span>
                <span>{isLoggingOut ? "Keluar..." : "Keluar"}</span>
              </button>
            </div>
          </aside>

          {/* Main Content */}
          <main className="min-w-0 flex-1 md:ml-64">
            {children}
          </main>
        </div>
      )}
    </UserIdProvider>
  );
}
