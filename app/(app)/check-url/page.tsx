"use client";

import { useState } from "react";
import { addScanHistory } from "@/lib/history-storage";
import { checkUrlSchema } from "@/lib/schemas/check-url-schema";

type ScanResult = {
  url: string;
  status: "Perlu Diperiksa" | "Mencurigakan";
  reasons: string[];
  checkedAt: string;
};

function analyzeUrl(url: string): ScanResult {
  const parsedUrl = new URL(url);
  const hostname = parsedUrl.hostname.toLowerCase();
  const reasons: string[] = [];

  // Indikator sederhana untuk simulasi pemeriksaan.
  if (parsedUrl.protocol !== "https:") {
    reasons.push("URL tidak menggunakan protokol HTTPS.");
  }

  if (parsedUrl.username || parsedUrl.password) {
    reasons.push("URL mengandung informasi kredensial.");
  }

  if (hostname.startsWith("xn--") || hostname.includes(".xn--")) {
    reasons.push("Domain menggunakan format Punycode.");
  }

  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) {
    reasons.push("URL menggunakan alamat IP secara langsung.");
  }

  if (
    hostname.includes("login") ||
    hostname.includes("verify") ||
    hostname.includes("account")
  ) {
    reasons.push(
      "Nama domain mengandung kata yang sering digunakan pada halaman autentikasi. Periksa identitas situs."
    );
  }

  if (reasons.length > 0) {
    return {
      url: parsedUrl.href,
      status: "Mencurigakan",
      reasons,
      checkedAt: new Date().toISOString(),
    };
  }

  return {
    url: parsedUrl.href,
    status: "Perlu Diperiksa",
    reasons: [
      "Tidak ditemukan indikator sederhana dari aturan simulasi.",
      "Hasil ini bukan bukti bahwa situs aman dari phishing.",
    ],
    checkedAt: new Date().toISOString(),
  };
}

export default function CheckUrlPage() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState("");
  const [isChecking, setIsChecking] = useState(false);

function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault();

  setError("");
  setResult(null);

  const validation = checkUrlSchema.safeParse(url);

  if (!validation.success) {
    setError(validation.error.issues[0]?.message ?? "URL tidak valid.");
    return;
  }

  const parsedUrl = new URL(validation.data);

  setIsChecking(true);

  // Simulasi pemeriksaan lokal, bukan pemindaian keamanan sungguhan.
  window.setTimeout(() => {
    try {
      const scanResult = analyzeUrl(parsedUrl.href);

      // Simpan hasil pemeriksaan ke riwayat browser.
      addScanHistory({
        url: scanResult.url,
        status: scanResult.status,
        reasons: scanResult.reasons,
        checkedAt: scanResult.checkedAt,
      });

      // Tampilkan hasil pemeriksaan.
      setResult(scanResult);
    } catch {
      setError("URL tidak dapat diproses atau gagal disimpan.");
    } finally {
      setIsChecking(false);
    }
  }, 500);
}

  function resetForm() {
    setUrl("");
    setResult(null);
    setError("");
    setIsChecking(false);
  }

  return (
    <main className="min-h-screen bg-[#f7f5fb] px-4 py-8 text-slate-800 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8">
          <p className="mb-2 text-sm font-semibold text-purple-700">
            Personal Security Assistant
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-purple-950">
            Cek Keamanan URL
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-purple-900/60 sm:text-base">
            Periksa indikator sederhana pada sebuah tautan sebelum
            membukanya. Hasil pemeriksaan awal ini belum menjamin
            keamanan situs.
          </p>
        </header>

        <section
          aria-labelledby="url-form-title"
          className="rounded-2xl border border-purple-100 bg-white p-5 shadow-sm sm:p-8"
        >
          <div className="mb-6 flex items-start gap-4">
            <div
              aria-hidden="true"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-purple-200 bg-purple-50 text-2xl text-purple-700 shadow-sm"
            >
              ⛨
            </div>

            <div>
              <h2 id="url-form-title" className="text-xl font-bold text-purple-950">
                Periksa tautan
              </h2>

              <p className="mt-1 text-sm text-purple-900/60">
                Masukkan URL lengkap yang ingin kamu periksa.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <label
              htmlFor="url-input"
              className="mb-2 block text-sm font-medium text-purple-950/80"
            >
              URL yang akan diperiksa
            </label>

            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                id="url-input"
                name="url"
                type="url"
                inputMode="url"
                autoComplete="url"
                maxLength={2048}
                value={url}
                onChange={(event) => {
                  setUrl(event.target.value);
                  setError("");
                  setResult(null);
                }}
                placeholder="https://example.com"
                aria-invalid={Boolean(error)}
                aria-describedby="url-help url-error"
                className="min-w-0 flex-1 rounded-xl border border-purple-200 bg-[#fbf9fe] px-4 py-3 text-sm text-purple-950 outline-none transition placeholder:text-purple-900/40 focus:border-purple-600 focus:bg-white focus:ring-2 focus:ring-purple-500/20 shadow-sm"
              />

              <button
                type="submit"
                disabled={isChecking}
                className="rounded-xl bg-purple-700 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-purple-700/20 transition hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isChecking ? "Memeriksa..." : "Periksa URL"}
              </button>
            </div>

            <p
              id="url-help"
              className="mt-3 text-xs leading-relaxed text-purple-900/60"
            >
              Gunakan URL lengkap dengan awalan http:// atau https://.
              Jangan memasukkan tautan yang berisi informasi login.
            </p>

            {error && (
              <p
                id="url-error"
                role="alert"
                className="mt-3 text-sm font-medium text-rose-600"
              >
                {error}
              </p>
            )}
          </form>
        </section>

        <section
          aria-labelledby="result-title"
          aria-live="polite"
          className="mt-6 rounded-2xl border border-purple-100 bg-white p-5 shadow-sm sm:p-8"
        >
          <div className="mb-5">
            <h2 id="result-title" className="text-xl font-bold text-purple-950">
              Hasil Pemeriksaan
            </h2>

            <p className="mt-1 text-sm text-purple-900/60">
              Hasil simulasi berdasarkan beberapa indikator sederhana.
            </p>
          </div>

          {!result ? (
            <div className="rounded-2xl border border-dashed border-purple-200 bg-[#fbf9fe] px-5 py-12 text-center">
              <div aria-hidden="true" className="mb-4 text-4xl">
                🔎
              </div>

              <h3 className="font-bold text-purple-950">
                Belum ada hasil pemeriksaan
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-purple-900/60">
                Masukkan URL pada formulir di atas untuk menjalankan
                simulasi pemeriksaan.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-purple-200 bg-[#fbf9fe] p-5 shadow-sm">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-purple-900/50">
                    URL yang diperiksa
                  </p>

                  <p className="mt-2 break-all text-sm font-medium text-purple-950 font-mono">
                    {result.url}
                  </p>
                </div>

                <span
                  className={`inline-flex w-fit shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${
                    result.status === "Mencurigakan"
                      ? "border-rose-200 bg-rose-50 text-rose-700"
                      : "border-amber-200 bg-amber-50 text-amber-800"
                  }`}
                >
                  {result.status}
                </span>
              </div>

              <div className="mt-6">
                <h3 className="font-bold text-purple-950">
                  Temuan simulasi
                </h3>

                <ul className="mt-3 space-y-3">
                  {result.reasons.map((reason, index) => (
                    <li
                      key={`${index}-${reason}`}
                      className="flex items-start gap-3 text-sm leading-relaxed text-purple-900/80"
                    >
                      <span
                        aria-hidden="true"
                        className="mt-0.5 font-bold text-purple-700"
                      >
                        •
                      </span>

                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <p className="mt-6 border-t border-purple-100 pt-4 text-xs leading-relaxed text-purple-900/50">
                Diperiksa pada{" "}
                {new Date(result.checkedAt).toLocaleString("id-ID")}.
                Pemeriksaan ini berjalan secara lokal menggunakan aturan
                sederhana. Hasilnya bukan verifikasi keamanan situs yang
                sebenarnya.
              </p>

              <button
                type="button"
                onClick={resetForm}
                className="mt-5 rounded-xl border border-purple-200 bg-white px-4 py-2 text-sm font-semibold text-purple-950 shadow-sm transition hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              >
                Periksa URL lain
              </button>
            </div>
          )}
        </section>

        <aside className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/70 p-5 shadow-sm">
          <h2 className="font-bold text-amber-900">
            Perhatikan batasan pemeriksaan
          </h2>

          <p className="mt-2 text-sm leading-relaxed text-amber-800/90">
            URL yang tidak menunjukkan indikator di atas belum tentu aman.
            Deteksi phishing yang sebenarnya membutuhkan analisis lebih
            lanjut, misalnya pemeriksaan reputasi domain dan sumber intelijen
            ancaman yang tepercaya.
          </p>
        </aside>
      </div>
    </main>
  );
}