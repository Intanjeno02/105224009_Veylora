"use client";

type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export default function SearchInput({
  value,
  onChange,
  placeholder = "Cari akun atau layanan...",
}: SearchInputProps) {
  return (
    <div className="w-full">
      <label
        htmlFor="account-search"
        className="sr-only"
      >
        Cari akun atau layanan
      </label>

      <div className="relative">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-purple-900/50"
        >
          ⌕
        </span>

        <input
          id="account-search"
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-purple-200 bg-white py-3 pl-10 pr-4 text-sm text-purple-950 placeholder-purple-900/40 outline-none transition focus:border-purple-600 focus:ring-2 focus:ring-purple-500/20 shadow-sm"
        />
      </div>
    </div>
  );
}