export default function HistoryDetailLoading() {
  return (
    <main className="min-h-screen bg-[#f7f5fb] px-4 py-8 sm:px-6 lg:px-8 animate-pulse">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="h-4 w-32 bg-purple-200 rounded"></div>
        <div className="h-8 w-64 bg-purple-200 rounded"></div>
        <div className="rounded-2xl border border-purple-100 bg-white p-8 space-y-6">
          <div className="h-6 w-3/4 bg-purple-100 rounded"></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="h-16 bg-purple-50 rounded-xl"></div>
            <div className="h-16 bg-purple-50 rounded-xl"></div>
            <div className="h-16 bg-purple-50 rounded-xl"></div>
          </div>
          <div className="h-24 bg-purple-50 rounded-xl"></div>
        </div>
      </div>
    </main>
  );
}

