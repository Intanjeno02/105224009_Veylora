export default function NotFound() {
return ( <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-[#08070d] px-4 py-10 text-white">
{/* Background dekoratif */} <div
     aria-hidden="true"
     className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
   > <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />
    <div className="absolute -right-40 top-1/3 h-96 w-96 rounded-full bg-fuchsia-600/15 blur-3xl" />

    <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:28px_28px] opacity-[0.06]" />
  </div>

  <section className="w-full max-w-xl rounded-3xl border border-violet-300/15 bg-gradient-to-br from-indigo-950 via-purple-950 to-[#11101c] p-8 text-center shadow-2xl shadow-purple-950/30 sm:p-12">
    <p className="text-sm font-semibold tracking-[0.25em] text-violet-300">
      VEYLORA
    </p>

    <h1 className="mt-6 bg-gradient-to-r from-blue-400 via-violet-400 to-fuchsia-400 bg-clip-text text-7xl font-extrabold tracking-tight text-transparent sm:text-8xl">
      404
    </h1>

    <h2 className="mt-5 text-2xl font-bold sm:text-3xl">
      Halaman Tidak Ditemukan
    </h2>

    <p className="mt-4 leading-7 text-slate-300">
      Maaf, halaman yang kamu cari tidak tersedia atau alamatnya
      tidak sesuai. Periksa kembali alamat halaman yang ingin dibuka.
    </p>

    <a
      href="/"
      className="mt-8 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 via-violet-600 to-fuchsia-600 px-6 py-3 font-semibold shadow-lg shadow-violet-950/40 transition hover:brightness-110 focus:outline-none focus:ring-4 focus:ring-violet-400/40"
    >
      Kembali ke Beranda
    </a>
  </section>
</main>

);
}
