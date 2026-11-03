"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { Star } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { friendlyError } from "@/lib/errors";
import { ReviewPrompt } from "./types";

export function ReviewModal({
  prompt,
  onClose,
}: {
  prompt: ReviewPrompt;
  onClose: () => void;
}) {
  const create = useMutation(api.reviews.create);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError("");
    try {
      await create({ loanId: prompt.loanId, rating, comment });
      onClose();
    } catch (e) {
      setError(friendlyError(e));
      setBusy(false);
    }
  }

  return (
    <Modal
      title={`Rate ${prompt.otherName}`}
      eyebrow={`As a ${prompt.reviewingRole} · ${prompt.toolName}`}
      onClose={onClose}
    >
      <div className="flex gap-1" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            onClick={() => setRating(n)}
          >
            <Star
              size={36}
              className="text-accent"
              fill={n <= rating ? "currentColor" : "none"}
            />
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={500}
        rows={3}
        placeholder="How did it go? (optional)"
        className="mt-4 w-full rounded-2xl border border-line bg-surface p-3 outline-none focus:border-brand"
      />
      {error && (
        <p
          role="alert"
          className="mt-3 rounded-xl bg-accent-soft p-3 text-sm text-danger"
        >
          {error}
        </p>
      )}
      <div className="mt-4 flex gap-3">
        <Button variant="outline" onClick={onClose} className="flex-1">
          Not now
        </Button>
        <Button
          onClick={submit}
          disabled={busy || rating === 0}
          className="flex-1"
        >
          Submit review
        </Button>
      </div>
    </Modal>
  );
}
