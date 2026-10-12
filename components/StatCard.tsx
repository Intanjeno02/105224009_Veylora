type StatCardProps = {
  title: string;
  value: number;
  description: string;
  status: string;
  icon: string;
  color: "blue" | "red" | "amber" | "purple";
};

const colorStyles = {
  blue: {
    icon: "bg-blue-500/10 text-blue-400",
    value: "text-blue-400",
    status: "border-blue-500/30 text-blue-400",
  },
  red: {
    icon: "bg-rose-500/10 text-rose-400",
    value: "text-rose-400",
    status: "border-rose-500/30 text-rose-400",
  },
  amber: {
    icon: "bg-amber-500/10 text-amber-400",
    value: "text-amber-400",
    status: "border-amber-500/30 text-amber-400",
  },
  purple: {
    icon: "bg-purple-500/10 text-purple-400",
    value: "text-purple-400",
    status: "border-purple-500/30 text-purple-400",
  },
};

export default function StatCard({
  title,
  value,
  description,
  status,
  icon,
  color,
}: StatCardProps) {
  const styles = colorStyles[color];

  return (
    <section
      aria-label={title}
      className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 shadow-sm transition hover:border-zinc-700"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-medium text-zinc-400">{title}</h2>

        <span
          aria-hidden="true"
          className={`flex h-10 w-10 items-center justify-center rounded-xl text-xl ${styles.icon}`}
        >
          {icon}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <p className={`text-3xl font-bold ${styles.value}`}>{value}</p>

        <span
          className={`rounded-full border px-2 py-1 text-xs font-medium ${styles.status}`}
        >
          {status}
        </span>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-zinc-400">
        {description}
      </p>
    </section>
  );
}