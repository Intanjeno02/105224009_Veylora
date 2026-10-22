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
    icon: "bg-purple-50 text-purple-700",
    value: "text-purple-950",
    status: "border-purple-200 bg-purple-50 text-purple-800",
  },
  red: {
    icon: "bg-rose-50 text-rose-600",
    value: "text-rose-600",
    status: "border-rose-200 bg-rose-50 text-rose-700",
  },
  amber: {
    icon: "bg-amber-50 text-amber-600",
    value: "text-amber-600",
    status: "border-amber-200 bg-amber-50 text-amber-700",
  },
  purple: {
    icon: "bg-purple-100/70 text-purple-700",
    value: "text-purple-900",
    status: "border-purple-200 bg-purple-50 text-purple-800",
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
      className="rounded-2xl border border-purple-100 bg-white p-5 shadow-sm transition hover:border-purple-300 hover:shadow-md"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-medium text-purple-900/70">{title}</h2>

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

      <p className="mt-3 text-xs leading-relaxed text-purple-900/60">
        {description}
      </p>
    </section>
  );
}