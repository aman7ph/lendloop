import { Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { categoryStyle } from "@/lib/categoryStyle";
import { MyTool } from "./types";

type Props = { tool: MyTool; onEdit: () => void; onDelete: () => void };

export function MyToolCard({ tool, onEdit, onDelete }: Props) {
  const { tint, Icon } = categoryStyle(tool.category);
  const photo = tool.imageUrls[0];

  return (
    <article className="flex items-center gap-3 rounded-3xl bg-surface p-3 shadow-sm">
      <div
        className={`flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl ${tint}`}
      >
        {photo ? (
          <img src={photo} alt={tool.name} className="size-full object-cover" />
        ) : (
          <Icon size={28} className="text-muted/70" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{tool.name}</p>
        <p className="text-sm text-muted">
          <span className="capitalize">{tool.category}</span> · up to{" "}
          {tool.maxLoanDays} days
        </p>
        <div className="mt-1">
          <Badge tone={tool.available ? "success" : "alert"}>
            {tool.available ? "Available" : "On loan"}
          </Badge>
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <button
          aria-label="Edit"
          onClick={onEdit}
          className="rounded-full p-2 hover:bg-brand-soft"
        >
          <Pencil size={18} />
        </button>
        <button
          aria-label="Delete"
          onClick={onDelete}
          className="rounded-full p-2 text-danger hover:bg-accent-soft"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </article>
  );
}
