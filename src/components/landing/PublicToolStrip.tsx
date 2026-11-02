"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { categoryStyle } from "@/lib/categoryStyle";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";

export function PublicToolStrip() {
  const tools = useQuery(api.tools.listPublic);

  return (
    <section className="mx-auto max-w-5xl px-4 py-10">
      <h2 className="mb-1 text-2xl font-semibold">
        Available in the neighborhood
      </h2>
      <p className="mb-6 text-muted">
        A preview of what neighbors are sharing. Sign in to see details and
        borrow.
      </p>

      {tools === undefined && <Spinner />}

      {tools?.length === 0 && (
        <p className="rounded-3xl border border-dashed border-line bg-surface p-8 text-center text-muted">
          No tools listed yet. Be the first to share one.
        </p>
      )}

      <ul className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {tools?.map((t, i) => {
          const { tint, Icon } = categoryStyle(t.category);
          return (
            <li
              key={`${t.name}-${i}`}
              className="rounded-3xl bg-surface p-3 shadow-sm"
            >
              <div
                className={`flex aspect-[4/3] items-center justify-center rounded-2xl ${tint}`}
              >
                <Icon size={36} className="text-muted" />
              </div>
              <p className="mt-3 truncate font-semibold">{t.name}</p>
              <div className="mt-1 flex items-center justify-between gap-2">
                <span className="truncate text-xs capitalize text-muted">
                  {t.category}
                </span>
                <Badge tone={t.available ? "success" : "alert"}>
                  {t.available ? "Available" : "Borrowed"}
                </Badge>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
