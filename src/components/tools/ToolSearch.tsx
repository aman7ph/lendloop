import { Search } from "lucide-react";

type Props = { value: string; onChange: (v: string) => void };

export function ToolSearch({ value, onChange }: Props) {
  return (
    <label className="relative block">
      <Search
        size={18}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-muted"
      />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search by tool, category or neighbor"
        aria-label="Search tools"
        className="h-12 w-full rounded-full border border-line bg-surface pl-11 pr-4 outline-none focus:border-brand"
      />
    </label>
  );
}
