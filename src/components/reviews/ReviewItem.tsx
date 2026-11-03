import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { formatDay } from "@/lib/dates";
import { Stars } from "./Stars";

type Props = {
  prefix: "From" | "To";
  name: string;
  role: "lender" | "borrower";
  rating: number;
  comment: string;
  toolName: string;
  at: number;
  onDelete?: () => void;
};

export function ReviewItem({
  prefix,
  name,
  role,
  rating,
  comment,
  toolName,
  at,
  onDelete,
}: Props) {
  return (
    <article className="rounded-3xl bg-surface p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold">
            {prefix} {name}
          </p>
          <p className="text-sm text-muted">
            {toolName} · {formatDay(at)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="success">As {role}</Badge>
          {onDelete && (
            <button
              aria-label="Delete review"
              onClick={onDelete}
              className="rounded-full p-2 text-danger hover:bg-accent-soft"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </div>
      <div className="mt-2">
        <Stars value={rating} />
      </div>
      {comment && <p className="mt-2 text-sm">{comment}</p>}
    </article>
  );
}
