type Tab = { id: string; label: string; count?: number };
type Props = { tabs: Tab[]; active: string; onChange: (id: string) => void };

export function Tabs({ tabs, active, onChange }: Props) {
  return (
    <div role="tablist" className="flex flex-wrap gap-2">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={active === t.id}
          onClick={() => onChange(t.id)}
          className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
            active === t.id
              ? "border-brand bg-brand text-white"
              : "border-line bg-surface hover:bg-brand-soft"
          }`}
        >
          {t.label}
          {t.count ? (
            <span className="ml-1.5 text-accent">{t.count}</span>
          ) : null}
        </button>
      ))}
    </div>
  );
}
