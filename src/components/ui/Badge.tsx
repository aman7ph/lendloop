import { ReactNode } from "react";

const TONES = {
  neutral: "bg-surface text-ink",
  success: "bg-brand-soft text-brand",
  alert: "bg-accent-soft text-danger",
  warn: "bg-tint-butter text-ink",
};

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: keyof typeof TONES;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}
