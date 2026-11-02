import { ShieldCheck } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { BorrowForm } from "../loans/BorrowForm";
import { ToolImages } from "./ToolImages";
import { Tool } from "./types";

export function ToolDetailModal({
  tool,
  onClose,
}: {
  tool: Tool;
  onClose: () => void;
}) {
  return (
    <Modal title={tool.name} eyebrow="Tool details" onClose={onClose}>
      <ToolImages
        urls={tool.imageUrls}
        category={tool.category}
        name={tool.name}
      />

      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="text-sm capitalize text-muted">
          {tool.category} · {tool.condition}
        </span>
        <Badge tone={tool.available ? "success" : "alert"}>
          {tool.available ? "Available" : "Currently borrowed"}
        </Badge>
      </div>

      {tool.description && (
        <p className="mt-3 text-muted">{tool.description}</p>
      )}

      <div className="mt-4 flex items-center gap-3 rounded-2xl bg-brand-soft/60 p-3">
        <Avatar name={tool.ownerName} imageUrl={tool.ownerImageUrl} size={40} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{tool.ownerName}</p>
          <p className="text-sm text-muted">
            {tool.isMine ? "That's you" : "Lender"}
          </p>
        </div>
        {tool.ownerTrusted && <ShieldCheck className="text-brand" />}
      </div>

      <div className="mt-5">
        {tool.isMine ? (
          <p className="rounded-2xl bg-surface p-4 text-center text-sm text-muted">
            This is your own listing. Neighbors can request it from here.
          </p>
        ) : (
          <BorrowForm
            toolId={tool.id}
            maxLoanDays={tool.maxLoanDays}
            onDone={onClose}
          />
        )}
      </div>
    </Modal>
  );
}
