type AccountCardProps = {
  name: string;
  username: string;
  category: string;
  lastUpdated: string;
  initial: string;
  color?: string;
};

export default function AccountCard({
  name,
  username,
  category,
  lastUpdated,
  initial,
  color = "bg-purple-700",
}: AccountCardProps) {
  return (
    <article className="flex items-center justify-between gap-4 rounded-xl border border-purple-100 bg-white p-4 shadow-sm transition hover:border-purple-300 hover:shadow-md">
      <div className="flex min-w-0 items-center gap-3">
        <div
          aria-hidden="true"
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${color} font-bold text-white shadow-sm`}
        >
          {initial}
        </div>

        <div className="min-w-0">
          <h3 className="truncate font-semibold text-purple-950">{name}</h3>

          <p className="truncate text-sm text-purple-900/70">{username}</p>

          <p className="mt-1 text-xs text-purple-900/50">{category}</p>
        </div>
      </div>

      <div className="shrink-0 text-right">
        <p className="text-xs text-purple-900/50">Terakhir diperbarui</p>
        <p className="mt-1 text-xs font-medium text-purple-950/80">{lastUpdated}</p>
      </div>
    </article>
  );
}
