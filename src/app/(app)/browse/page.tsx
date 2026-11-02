"use client";

import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Spinner } from "@/components/ui/Spinner";
import { ToolCard } from "@/components/tools/ToolCard";
import { ToolSearch } from "@/components/tools/ToolSearch";
import { ToolDetailModal } from "@/components/tools/ToolDetailModal";
import { Tool } from "@/components/tools/types";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

export default function BrowsePage() {
  const me = useQuery(api.users.me);
  const tools = useQuery(api.tools.list, {});
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tools ?? [];
    return (tools ?? []).filter((t) =>
      [t.name, t.ownerName, t.category].some((field) =>
        field.toLowerCase().includes(q),
      ),
    );
  }, [tools, search]);

  const open: Tool | undefined = tools?.find((t) => t.id === openId);

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
        {greeting()}, {me?.name.split(" ")[0] ?? "neighbor"}
        <span className="text-accent">.</span>
      </h1>
      <p className="mb-6 mt-1 text-muted">
        What can your neighborhood help you with today?
      </p>

      <ToolSearch value={search} onChange={setSearch} />

      <div className="mt-6">
        {tools === undefined ? (
          <Spinner />
        ) : visible.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-line bg-surface p-10 text-center text-muted">
            {search
              ? "No tools match your search."
              : "No tools yet. Be the first to share one."}
          </p>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map((t) => (
              <li key={t.id}>
                <ToolCard tool={t} onOpen={() => setOpenId(t.id)} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {open && <ToolDetailModal tool={open} onClose={() => setOpenId(null)} />}
    </div>
  );
}
