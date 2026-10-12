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
  color = "bg-blue-600",
}: AccountCardProps) {
  return (
    <article className="flex items-center justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-900 p-4 transition hover:border-zinc-700">
      <div className="flex min-w-0 items-center gap-3">
        <div
          aria-hidden="true"
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${color} font-bold text-white`}
        >
          {initial}
        </div>

        <div className="min-w-0">
          <h3 className="truncate font-semibold text-white">{name}</h3>

          <p className="truncate text-sm text-zinc-400">{username}</p>

          <p className="mt-1 text-xs text-zinc-500">{category}</p>
        </div>
      </div>

      <div className="shrink-0 text-right">
        <p className="text-xs text-zinc-500">Terakhir diperbarui</p>
        <p className="mt-1 text-xs text-zinc-300">{lastUpdated}</p>
      </div>
    </article>
  );
}
