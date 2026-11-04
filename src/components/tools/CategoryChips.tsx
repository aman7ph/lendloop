type Props = {
  categories: string[];
  value: string;
  onChange: (v: string) => void;
};

export function CategoryChips({ categories, value, onChange }: Props) {
  return (
    <div
      className="mt-3 flex gap-2 overflow-x-auto pb-1"
      role="group"
      aria-label="Filter by category"
    >
      {["", ...categories].map((c) => (
        <button
          key={c || "all"}
          onClick={() => onChange(c)}
          aria-pressed={value === c}
          className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium capitalize ${
            value === c
              ? "border-brand bg-brand text-white"
              : "border-line bg-surface hover:bg-brand-soft"
          }`}
        >
          {c || "All"}
        </button>
      ))}
    </div>
  );
}
