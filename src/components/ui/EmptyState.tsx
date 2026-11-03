import { ReactNode } from "react";

export function EmptyState({
  text,
  children,
}: {
  text: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-line bg-surface p-10 text-center text-muted">
      <p>{text}</p>
      {children}
    </div>
  );
}
