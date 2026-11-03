"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { Star } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/Button";
import { ReviewModal } from "./ReviewModal";
import { ReviewPrompt } from "./types";

export function ReviewPrompts() {
  const prompts = useQuery(api.reviews.reviewable);
  const [active, setActive] = useState<ReviewPrompt | null>(null);
  if (!prompts?.length) return null;

  return (
    <section className="mb-6 flex flex-col gap-2">
      {prompts.map((p) => (
        <div
          key={p.loanId}
          className="flex items-center gap-3 rounded-2xl bg-brand-soft p-3"
        >
          <Star size={20} className="shrink-0 text-accent" />
          <p className="min-w-0 flex-1 text-sm">
            How was <strong>{p.otherName}</strong> as a {p.reviewingRole}?{" "}
            <span className="text-muted">({p.toolName})</span>
          </p>
          <Button className="h-9 px-4" onClick={() => setActive(p)}>
            Rate
          </Button>
        </div>
      ))}
      {active && (
        <ReviewModal prompt={active} onClose={() => setActive(null)} />
      )}
    </section>
  );
}
