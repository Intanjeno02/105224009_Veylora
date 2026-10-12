"use client";

import { useState } from "react";
import { addScanHistory } from "@/lib/history-storage";

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

    const input = url.trim();

    if (!input) {
      setError("Masukkan URL yang ingin diperiksa.");
      return;
    }

    let parsedUrl: URL;

    try {
      parsedUrl = new URL(input);
    } catch {
      setError(
        "Format URL tidak valid. Masukkan URL lengkap, misalnya https://example.com."
      );
      return;
    }

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      setError("URL harus menggunakan protokol HTTP atau HTTPS.");
      return;
    }

    if (
      !parsedUrl.hostname ||
      !parsedUrl.hostname.includes(".") ||
      parsedUrl.hostname.startsWith(".") ||
      parsedUrl.hostname.endsWith(".")
    ) {
      setError("Nama host URL tidak valid.");
      return;
    }

    if (parsedUrl.username || parsedUrl.password) {
      setError(
        "URL tidak boleh berisi username atau password. Hapus informasi tersebut sebelum melanjutkan."
      );
      return;
    }

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
    <main className="min-h-screen bg-zinc-950 px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8">
          <p className="mb-2 text-sm font-medium text-blue-400">
            Personal Security Assistant
          </p>

          <h1 className="text-3xl font-bold tracking-tight">
            Cek Keamanan URL
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
            Periksa indikator sederhana pada sebuah tautan sebelum
            membukanya. Hasil pemeriksaan awal ini belum menjamin
            keamanan situs.
          </p>
        </header>

        <section
          aria-labelledby="url-form-title"
          className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 sm:p-8"
        >
          <div className="mb-6 flex items-start gap-4">
            <div
              aria-hidden="true"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-600/15 text-2xl text-blue-400"
            >
              ⛨
            </div>

            <div>
              <h2 id="url-form-title" className="text-xl font-semibold">
                Periksa tautan
              </h2>

              <p className="mt-1 text-sm text-zinc-300">
                Masukkan URL lengkap yang ingin kamu periksa.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <label
              htmlFor="url-input"
              className="mb-2 block text-sm font-medium text-zinc-200"
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
                className="min-w-0 flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
              />

              <button
                type="submit"
                disabled={isChecking}
                className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-zinc-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isChecking ? "Memeriksa..." : "Periksa URL"}
              </button>
            </div>

            <p
              id="url-help"
              className="mt-3 text-xs leading-relaxed text-zinc-300"
            >
              Gunakan URL lengkap dengan awalan http:// atau https://.
              Jangan memasukkan tautan yang berisi informasi login.
            </p>

            <p
              id="url-error"
              role="alert"
              className="mt-3 text-sm text-red-400"
            >
              {error}
            </p>
          </form>
        </section>

        <section
          aria-labelledby="result-title"
          aria-live="polite"
          className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-5 sm:p-8"
        >
          <div className="mb-5">
            <h2 id="result-title" className="text-xl font-semibold">
              Hasil Pemeriksaan
            </h2>

            <p className="mt-1 text-sm text-zinc-300">
              Hasil simulasi berdasarkan beberapa indikator sederhana.
            </p>
          </div>

          {!result ? (
            <div className="rounded-xl border border-dashed border-zinc-700 px-5 py-12 text-center">
              <div aria-hidden="true" className="mb-4 text-4xl">
                🔎
              </div>

              <h3 className="font-medium text-zinc-200">
                Belum ada hasil pemeriksaan
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-zinc-300">
                Masukkan URL pada formulir di atas untuk menjalankan
                simulasi pemeriksaan.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-zinc-700 bg-zinc-950 p-5">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    URL yang diperiksa
                  </p>

                  <p className="mt-2 break-all text-sm text-zinc-200">
                    {result.url}
                  </p>
                </div>

                <span
                  className={`inline-flex w-fit shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${
                    result.status === "Mencurigakan"
                      ? "border-red-800 bg-red-950/40 text-red-300"
                      : "border-amber-800 bg-amber-950/40 text-amber-300"
                  }`}
                >
                  {result.status}
                </span>
              </div>

              <div className="mt-6">
                <h3 className="font-semibold text-zinc-200">
                  Temuan simulasi
                </h3>

                <ul className="mt-3 space-y-3">
                  {result.reasons.map((reason, index) => (
                    <li
                      key={`${index}-${reason}`}
                      className="flex items-start gap-3 text-sm leading-relaxed text-zinc-400"
                    >
                      <span
                        aria-hidden="true"
                        className="mt-0.5 text-blue-400"
                      >
                        •
                      </span>

                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <p className="mt-6 border-t border-zinc-800 pt-4 text-xs leading-relaxed text-zinc-500">
                Diperiksa pada{" "}
                {new Date(result.checkedAt).toLocaleString("id-ID")}.
                Pemeriksaan ini berjalan secara lokal menggunakan aturan
                sederhana. Hasilnya bukan verifikasi keamanan situs yang
                sebenarnya.
              </p>

              <button
                type="button"
                onClick={resetForm}
                className="mt-5 rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                Periksa URL lain
              </button>
            </div>
          )}
        </section>

        <aside className="mt-6 rounded-xl border border-amber-900/60 bg-amber-950/20 p-5">
          <h2 className="font-semibold text-amber-300">
            Perhatikan batasan pemeriksaan
          </h2>

          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
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