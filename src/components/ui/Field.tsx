import { ReactNode } from "react";

export const inputClass =
  "h-12 w-full rounded-2xl border border-line bg-surface px-3 outline-none focus:border-brand";

type Props = { label: string; hint?: string; children: ReactNode };

export function Field({ label, hint, children }: Props) {
  return (
    <label className="block text-sm font-medium">
      {label}
      {hint && <span className="font-normal text-muted"> {hint}</span>}
      <div className="mt-1">{children}</div>
    </label>
  );
}
