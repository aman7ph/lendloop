"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { ReviewItem } from "./ReviewItem";
import { GivenReview } from "./types";

export function GivenReviews() {
  const reviews = useQuery(api.reviews.given);
  const remove = useMutation(api.reviews.remove);
  const [deleting, setDeleting] = useState<GivenReview | null>(null);

  if (reviews === undefined) return <Spinner />;
  if (reviews.length === 0)
    return <EmptyState text="You haven't written any reviews yet." />;

  return (
    <>
      <ul className="grid gap-3">
        {reviews.map((r) => (
          <li key={r.id}>
            <ReviewItem
              prefix="To"
              name={r.revieweeName}
              role={r.revieweeRole}
              rating={r.rating}
              comment={r.comment}
              toolName={r.toolName}
              at={r.at}
              onDelete={() => setDeleting(r)}
            />
          </li>
        ))}
      </ul>
      {deleting && (
        <ConfirmModal
          title="Delete this review?"
          message={`It will be removed from ${deleting.revieweeName}'s profile and their rating will update. You'll be able to review this loan again.`}
          confirmLabel="Delete"
          onConfirm={() => remove({ reviewId: deleting.id as never })}
          onClose={() => setDeleting(null)}
        />
      )}
    </>
  );
}
