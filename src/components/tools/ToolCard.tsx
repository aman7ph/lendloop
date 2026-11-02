import { ShieldCheck } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { categoryStyle } from "@/lib/categoryStyle";
import { Tool } from "./types";

export function ToolCard({ tool, onOpen }: { tool: Tool; onOpen: () => void }) {
  const { tint, Icon } = categoryStyle(tool.category);
  const photo = tool.imageUrls[0];

  return (
    <button onClick={onOpen} className="group block w-full text-left">
      <div
        className={`relative aspect-[4/3] overflow-hidden rounded-card ${tint}`}
      >
        {photo ? (
          <img
            src={photo}
            alt={tool.name}
            className="size-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <Icon size={44} className="text-muted/70" />
          </div>
        )}
        <span className="absolute left-3 top-3">
          <Badge tone={tool.available ? "success" : "alert"}>
            {tool.available ? "Available" : "Borrowed"}
          </Badge>
        </span>
        <span className="absolute bottom-3 right-3 capitalize">
          <Badge>{tool.category}</Badge>
        </span>
      </div>
      <div className="mt-3 flex items-start justify-between gap-3 px-1">
        <div className="min-w-0">
          <p className="truncate font-semibold">{tool.name}</p>
          {tool.isMine ? (
            <p className="text-sm text-muted">Your listing</p>
          ) : (
            tool.ownerTrusted && (
              <p className="mt-0.5 flex items-center gap-1 text-sm text-muted">
                <ShieldCheck size={14} /> Trusted lender
              </p>
            )
          )}
        </div>
        <Avatar name={tool.ownerName} imageUrl={tool.ownerImageUrl} size={32} />
      </div>
    </button>
  );
}
