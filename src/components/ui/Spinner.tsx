import { Loader2 } from "lucide-react";

export function Spinner({ text }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted">
      <Loader2 className="animate-spin" />
      {text && <p>{text}</p>}
    </div>
  );
}
