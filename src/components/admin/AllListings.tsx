"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Trash2 } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { Tool } from "@/components/tools/types";

export function AllListings() {
  const tools = useQuery(api.tools.list, {});
  const remove = useMutation(api.tools.remove);
  const [target, setTarget] = useState<Tool | null>(null);

  if (tools === undefined) return <Spinner />;
  if (tools.length === 0) return <EmptyState text="No listings yet." />;

  return (
    <>
      <ul className="grid gap-3">
        {tools.map((t) => (
          <li
            key={t.id}
            className="flex items-center gap-3 rounded-3xl bg-surface p-4 shadow-sm"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{t.name}</p>
              <p className="text-sm text-muted">
                <span className="capitalize">{t.category}</span> · {t.ownerName}
              </p>
            </div>
            <button
              aria-label={`Remove ${t.name}`}
              onClick={() => setTarget(t)}
              className="rounded-full p-2 text-danger hover:bg-accent-soft"
            >
              <Trash2 size={18} />
            </button>
          </li>
        ))}
      </ul>
      {target && (
        <ConfirmModal
          title="Remove this listing?"
          message={`"${target.name}" by ${target.ownerName} will be removed with its photos.`}
          confirmLabel="Remove"
          onConfirm={() => remove({ toolId: target.id })}
          onClose={() => setTarget(null)}
        />
      )}
    </>
  );
}
