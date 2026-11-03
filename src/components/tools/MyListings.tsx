"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { MyToolCard } from "./MyToolCard";
import { ToolFormModal } from "./ToolFormModal";
import { MyTool } from "./types";

export function MyListings() {
  const tools = useQuery(api.tools.mine);
  const remove = useMutation(api.tools.remove);
  const [form, setForm] = useState<MyTool | "new" | null>(null);
  const [deleting, setDeleting] = useState<MyTool | null>(null);

  if (tools === undefined) return <Spinner />;

  return (
    <>
      {tools.length === 0 ? (
        <EmptyState text="You haven't listed any tools yet.">
          <Button onClick={() => setForm("new")}>Add your first tool</Button>
        </EmptyState>
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {tools.map((t) => (
            <li key={t.id}>
              <MyToolCard
                tool={t}
                onEdit={() => setForm(t)}
                onDelete={() => setDeleting(t)}
              />
            </li>
          ))}
        </ul>
      )}

      {form && (
        <ToolFormModal
          tool={form === "new" ? undefined : form}
          onClose={() => setForm(null)}
        />
      )}
      {deleting && (
        <ConfirmModal
          title="Delete this tool?"
          message={`"${deleting.name}" and its photos will be removed. This can't be undone.`}
          confirmLabel="Delete"
          onConfirm={() => remove({ toolId: deleting.id })}
          onClose={() => setDeleting(null)}
        />
      )}
    </>
  );
}
