"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { newPasswordSchema } from "@/lib/password-policy";

const registerSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(3, "Username minimal 3 karakter.")
      .max(30, "Username maksimal 30 karakter.")
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "Username hanya boleh berisi huruf, angka, dan underscore."
      ),
    password: newPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi password tidak sama.",
    path: ["confirmPassword"],
  });

export default function RegisterPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState<{
    username?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const [generalError, setGeneralError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErrors({});
    setGeneralError("");

    const result = registerSchema.safeParse({
      username,
      password,
      confirmPassword,
    });

    if (!result.success) {
      const fieldErrors: {
        username?: string;
        password?: string;
        confirmPassword?: string;
      } = {};

      for (const issue of result.error.issues) {
        const field = issue.path[0];

        if (
          field === "username" ||
          field === "password" ||
          field === "confirmPassword"
        ) {
          fieldErrors[field] = issue.message;
        }
      }

      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/register", {
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
        setGeneralError(data.message || "Registrasi gagal.");
        return;
      }

      setUsername("");
      setPassword("");
      setConfirmPassword("");

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
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[#08070d]/40 backdrop-brightness-95"
      />

      <section className="relative w-full max-w-md rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.02] p-8 shadow-2xl shadow-purple-950/70 backdrop-blur-2xl sm:p-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-400/40 to-transparent"
        />

        {/* Header */}
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-purple-400/30 bg-purple-600/20 text-2xl shadow-lg shadow-purple-900/30">
            🛡️
          </div>

          <p className="mt-4 text-xs font-semibold tracking-[0.25em] text-purple-300">
            VEYLORA
          </p>

          <h1 className="mt-1 bg-gradient-to-r from-white via-purple-100 to-purple-200 bg-clip-text text-2xl font-bold tracking-tight text-transparent sm:text-3xl">
            Buat Akun Baru
          </h1>

          <p className="mt-2 text-xs leading-relaxed text-purple-200/60">
            Mulai lindungi keamanan digital Anda
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

        <form
          onSubmit={handleSubmit}
          noValidate
          autoComplete="on"
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

            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setErrors((prev) => ({
                  ...prev,
                  username: undefined,
                }));
              }}
              placeholder="Buat username Anda"
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-purple-200/30 transition-all focus:border-purple-400/70 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
            />

            {errors.username && (
              <p role="alert" className="mt-1.5 text-xs text-rose-400">
                ⚠ {errors.username}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-xs font-semibold uppercase tracking-wider text-purple-200/80"
            >
              Password
            </label>

            <div className="relative mt-2">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrors((prev) => ({
                    ...prev,
                    password: undefined,
                  }));
                }}
                placeholder="Buat password Anda"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pr-16 text-sm text-white placeholder-purple-200/30 transition-all focus:border-purple-400/70 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-xs text-purple-300/70 hover:text-white"
              >
                {showPassword ? "Tutup" : "Lihat"}
              </button>
            </div>

                        {errors.password && (
              <p role="alert" className="mt-1.5 text-xs text-rose-400">
                ⚠ {errors.password}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-xs font-semibold uppercase tracking-wider text-purple-200/80"
            >
              Konfirmasi Password
            </label>

            <div className="relative mt-2">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setErrors((prev) => ({
                    ...prev,
                    confirmPassword: undefined,
                  }));
                }}
                placeholder="Ulangi password Anda"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pr-16 text-sm text-white placeholder-purple-200/30 transition-all focus:border-purple-400/70 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
              />

              <button
                type="button"
                onClick={() =>
                  setShowConfirmPassword(!showConfirmPassword)
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-xs text-purple-300/70 hover:text-white"
              >
                {showConfirmPassword ? "Tutup" : "Lihat"}
              </button>
            </div>

            {errors.confirmPassword && (
              <p role="alert" className="mt-1.5 text-xs text-rose-400">
                ⚠ {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* Register Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-fuchsia-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-purple-900/40 transition-all duration-200 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Memproses..." : "Daftar"}
          </button>
        </form>

        {/* Login Link */}
        <div className="mt-6 border-t border-white/10 pt-5 text-center">
          <p className="text-xs text-purple-200/60">
            Sudah punya akun?{" "}
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="font-semibold text-purple-300 hover:text-white hover:underline"
            >
              Masuk
            </button>
          </p>
        </div>

        {/* Security Footer */}
        <div className="mt-5 text-center">
          <p className="text-[11px] text-purple-200/40">
            🔒 Data akun dilindungi dengan password hashing
          </p>
        </div>
      </section>
    </main>
  );
}
