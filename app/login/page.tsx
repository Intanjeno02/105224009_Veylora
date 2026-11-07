"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loginSchema } from "@/lib/schemas/login-schema";

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [errors, setErrors] = useState<{
    username?: string;
    password?: string;
  }>({});

  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState("");
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  // Tutup modal jika tombol Escape ditekan
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsForgotModalOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Proses login menggunakan PostgreSQL melalui API
  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErrors({});
    setGeneralError("");

    // Validasi input menggunakan Zod
    const result = loginSchema.safeParse({
      username,
      password,
    });

    if (!result.success) {
      const fieldErrors: {
        username?: string;
        password?: string;
      } = {};

      for (const issue of result.error.issues) {
        if (issue.path[0] === "username") {
          fieldErrors.username = issue.message;
        } else if (issue.path[0] === "password") {
          fieldErrors.password = issue.message;
        }
      }

      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: result.data.username,
          password: result.data.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setGeneralError(data.message || "Login gagal.");
        setPassword("");
        return;
      }

      // Login berhasil
      setUsername("");
      setPassword("");

      router.replace("/");
      router.refresh();
    } catch {
      setGeneralError(
        "Tidak dapat terhubung ke server. Silakan coba lagi."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main
      className="relative isolate flex min-h-screen w-full items-center justify-center overflow-x-hidden bg-[#08070d] bg-cover bg-center bg-no-repeat px-4 py-12 text-white"
      style={{
        backgroundImage: "url('/images/veylora-login-bg.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        minHeight: "100vh",
        width: "100%",
      }}
    >
      {/* Background Overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[#08070d]/40 backdrop-brightness-95"
      />

      {/* Login Card */}
      <section className="relative w-full max-w-md rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.02] p-8 shadow-2xl shadow-purple-950/70 backdrop-blur-2xl sm:p-10">
        {/* Top Highlight */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-400/40 to-transparent"
        />

        {/* Header */}
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-purple-400/30 bg-purple-600/20 text-2xl shadow-lg shadow-purple-900/30">
            <span aria-hidden="true">🛡️</span>
          </div>

          <p className="mt-4 text-xs font-semibold tracking-[0.25em] text-purple-300">
            VEYLORA
          </p>

          <h1 className="mt-1 bg-gradient-to-r from-white via-purple-100 to-purple-200 bg-clip-text text-2xl font-bold tracking-tight text-transparent sm:text-3xl">
            Masuk ke Akun
          </h1>

          <p className="mt-2 text-xs leading-relaxed text-purple-200/60">
            Asisten Keamanan Digital Pribadi Anda
          </p>
        </div>

        {/* General Error */}
        {generalError && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300"
          >
            {generalError}
          </div>
        )}

        {/* Login Form */}
        <form
          noValidate
          autoComplete="on"
          onSubmit={handleSubmit}
          className="mt-7 space-y-5"
        >
          {/* Username */}
          <div>
            <label
              htmlFor="username"
              className="block text-xs font-semibold uppercase tracking-wider text-purple-200/80"
            >
              Username
            </label>

            <div className="mt-2">
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);

                  if (errors.username) {
                    setErrors((prev) => ({
                      ...prev,
                      username: undefined,
                    }));
                  }
                }}
                placeholder="Masukkan username Anda"
                className={`w-full rounded-xl border bg-white/5 px-4 py-3 text-sm text-white placeholder-purple-200/30 transition-all focus:bg-white/10 focus:outline-none focus:ring-2 ${
                  errors.username
                    ? "border-rose-400/60 focus:border-rose-400 focus:ring-rose-500/20"
                    : "border-white/10 focus:border-purple-400/70 focus:ring-purple-500/30"
                }`}
              />
            </div>

            {errors.username && (
              <p
                role="alert"
                className="mt-1.5 flex items-center gap-1 text-xs text-rose-400"
              >
                <span aria-hidden="true">⚠</span>
                <span>{errors.username}</span>
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="block text-xs font-semibold uppercase tracking-wider text-purple-200/80"
              >
                Password
              </label>

              <button
                type="button"
                onClick={() => setIsForgotModalOpen(true)}
                className="text-xs font-medium text-purple-300 transition-colors hover:text-purple-100 hover:underline focus:rounded focus:outline-none focus:ring-2 focus:ring-purple-400/40"
              >
                Forgot Password?
              </button>
            </div>

            <div className="relative mt-2">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);

                  if (errors.password) {
                    setErrors((prev) => ({
                      ...prev,
                      password: undefined,
                    }));
                  }
                }}
                placeholder="Masukkan password Anda"
                className={`w-full rounded-xl border bg-white/5 px-4 py-3 pr-11 text-sm text-white placeholder-purple-200/30 transition-all focus:bg-white/10 focus:outline-none focus:ring-2 ${
                  errors.password
                    ? "border-rose-400/60 focus:border-rose-400 focus:ring-rose-500/20"
                    : "border-white/10 focus:border-purple-400/70 focus:ring-purple-500/30"
                }`}
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-xs text-purple-300/70 transition hover:text-white focus:outline-none"
                aria-label={
                  showPassword
                    ? "Sembunyikan password"
                    : "Tampilkan password"
                }
              >
                {showPassword ? "Tutup" : "Lihat"}
              </button>
            </div>

            {errors.password && (
              <p
                role="alert"
                className="mt-1.5 flex items-center gap-1 text-xs text-rose-400"
              >
                <span aria-hidden="true">⚠</span>
                <span>{errors.password}</span>
              </p>
            )}
          </div>

          {/* Tombol Login */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-fuchsia-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-purple-900/40 transition-all duration-200 hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-[#08070d] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Memproses..." : "Masuk"}
          </button>
        </form>

        {/* Footer Keamanan */}
        <div className="mt-8 border-t border-white/10 pt-4 text-center">
          <p className="text-[11px] text-purple-200/40">
            🔒 Enkripsi & keamanan sesi dilindungi secara lokal
          </p>
        </div>
      </section>

      {/* Modal Forgot Password */}
      {isForgotModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="forgot-password-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            className="fixed inset-0 bg-black/65 backdrop-blur-md transition-opacity"
            onClick={() => setIsForgotModalOpen(false)}
            aria-hidden="true"
          />

          <div className="relative z-10 w-full max-w-lg rounded-3xl border border-white/15 bg-gradient-to-b from-[#19132c]/95 via-[#130f24]/98 to-[#0b0816]/98 p-6 text-white shadow-2xl shadow-purple-950/90 backdrop-blur-2xl sm:p-8">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-400/50 to-transparent"
            />

            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-purple-400/30 bg-purple-600/20 text-xl shadow-md shadow-purple-900/40">
                  <span aria-hidden="true">🔑</span>
                </div>

                <div>
                  <h2
                    id="forgot-password-title"
                    className="text-lg font-bold text-white sm:text-xl"
                  >
                    Forgot Your Password?
                  </h2>

                  <p className="text-xs text-purple-200/60">
                    Bantuan Pemulihan Akun
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsForgotModalOpen(false)}
                className="rounded-lg p-1.5 text-purple-300/70 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-purple-400/40"
                aria-label="Tutup modal"
              >
                <span
                  aria-hidden="true"
                  className="text-xl leading-none"
                >
                  ✕
                </span>
              </button>
            </div>

            <div className="mt-5 space-y-2 text-xs leading-relaxed text-purple-200/80">
              <p>
                Fitur pemulihan password belum tersedia. Saat ini,
                Veylora belum terhubung dengan layanan email untuk
                mengirimkan tautan pengaturan ulang password.
              </p>
            </div>

            <div
              role="note"
              className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-[11px] leading-relaxed text-amber-200/90"
            >
              <div className="flex items-start gap-2">
                <span
                  aria-hidden="true"
                  className="shrink-0 text-sm"
                >
                  ℹ️
                </span>

                <span>
                  Jika Anda lupa password, hubungi administrator
                  aplikasi. Jangan membagikan password kepada orang lain.
                </span>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(false)}
                className="w-full rounded-xl bg-white/10 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-purple-400 sm:w-auto"
              >
                Close & Return to Login
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
