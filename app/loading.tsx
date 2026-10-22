export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div
          className="h-10 w-10 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600"
          role="status"
          aria-label="Memuat halaman"
        />
        <p className="text-sm text-purple-300">
          Memuat halaman Veylora...
        </p>
      </div>
    </div>
  );
}