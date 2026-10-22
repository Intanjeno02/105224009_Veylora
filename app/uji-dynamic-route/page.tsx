"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function extractDynamicId(input: string): string | null {
  let path = input;

  if (/^[a-z][a-z\d+.-]*:\/\//i.test(input)) {
    try {
      path = new URL(input).pathname;
    } catch {
      return null;
    }
  } else {
    path = input.split(/[?#]/, 1)[0];
  }

  const encodedId = path.split("/").filter(Boolean).at(-1);

  if (!encodedId) {
    return null;
  }

  try {
    return decodeURIComponent(encodedId);
  } catch {
    return null;
  }
}

export default function UjiDynamicRoutePage() {
  const [id, setId] = useState("");
  const [error, setError] = useState("");

  const router = useRouter();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const dynamicId = extractDynamicId(id.trim());

    if (!dynamicId || !/^[a-zA-Z0-9_-]{1,100}$/.test(dynamicId)) {
      setError(
        "Masukkan ID atau path yang berakhir dengan ID berisi huruf, angka, tanda hubung, atau garis bawah."
      );
      return;
    }

    setError("");

    router.push(`/uji-dynamic-route/${encodeURIComponent(dynamicId)}`);
  }

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[#08070d] px-4 py-10 text-white sm:px-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="absolute -right-40 top-1/3 h-96 w-96 rounded-full bg-fuchsia-600/15 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:28px_28px] opacity-[0.06]" />
      </div>

      <section className="mx-auto max-w-3xl">
        <header className="mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-violet-600 to-fuchsia-600 shadow-lg shadow-violet-950/50">
              <svg
                aria-hidden="true"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                  d="M8 7h12m0 0-4-4m4 4-4 4M16 17H4m0 0 4 4m-4-4 4-4"
                />
              </svg>
            </div>
            <div>
              <p className="font-semibold tracking-tight">Veylora</p>
              <p className="text-xs text-slate-400">Pengujian Pemweb</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-violet-400/40 hover:bg-white/10 hover:text-white"
          >
            Kembali ke Dashboard
          </button>
        </header>

        <div className="relative mb-6 overflow-hidden rounded-3xl border border-violet-300/15 bg-gradient-to-br from-indigo-950 via-purple-950 to-[#11101c] p-6 shadow-2xl shadow-purple-950/30 sm:p-8">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:18px_18px] opacity-[0.08]"
          />
          <div className="relative">
            <p className="text-sm font-semibold text-violet-300">
              ROUTE LAB <span className="text-violet-500">/</span> 01
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Uji Dynamic Routing
            </h1>
            <p className="mt-3 max-w-xl leading-7 text-slate-300">
              Masukkan ID untuk menguji perpindahan ke halaman detail
              menggunakan parameter dinamis.
            </p>
          </div>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-16 -right-8 h-48 w-48 rounded-full border border-violet-300/15 sm:bottom-0 sm:right-8"
          >
            <div className="absolute inset-5 rounded-full border border-violet-300/10" />
            <div className="absolute inset-10 rounded-full bg-violet-400/10 blur-xl" />
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-white/10 bg-white/[0.045] p-5 shadow-xl shadow-black/20 backdrop-blur-sm sm:p-7"
        >
          <div className="mb-6">
            <label
              htmlFor="dynamic-id"
              className="mb-2 block text-sm font-semibold text-slate-100"
            >
              ID yang ingin diuji
            </label>
            <input
              id="dynamic-id"
              type="text"
              value={id}
              onChange={(event) => {
                setId(event.target.value);
                setError("");
              }}
              placeholder="Contoh: akun-123 atau /check-url/akun-123"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "id-error" : undefined}
              className="w-full rounded-xl border border-white/10 bg-[#0c0b13]/80 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-violet-400 focus:ring-4 focus:ring-violet-500/15"
            />
            {error && (
              <p
                id="id-error"
                role="alert"
                className="mt-2 text-sm text-rose-300"
              >
                {error}
              </p>
            )}
            <p className="mt-2 text-xs text-slate-500">
              Masukkan ID atau path lengkap yang berakhir dengan ID.
            </p>
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-gradient-to-r from-blue-600 via-violet-600 to-fuchsia-600 px-4 py-3 font-semibold shadow-lg shadow-violet-950/40 transition hover:brightness-110 focus:outline-none focus:ring-4 focus:ring-violet-400/30"
          >
            Uji Dynamic Route
          </button>
        </form>

        <aside className="mt-5 rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-6">
          <h2 className="font-semibold text-slate-100">Apa yang diuji?</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Aplikasi mengambil ID dari input atau segmen terakhir path,
            memeriksa formatnya, lalu membuka halaman detail dinamis.
          </p>
        </aside>
      </section>
    </main>
  );
}