import { EmptyState } from "@/components/ui/EmptyState";
import { ReviewItem } from "./ReviewItem";
import { Profile } from "./types";

type Props = { reviews: Profile["reviews"]; emptyText: string };

export function ReceivedReviews({ reviews, emptyText }: Props) {
  if (reviews.length === 0) return <EmptyState text={emptyText} />;
  return (
    <ul className="grid gap-3">
      {reviews.map((r) => (
        <li key={r.id}>
          <ReviewItem
            prefix="From"
            name={r.reviewerName}
            role={r.revieweeRole}
            rating={r.rating}
            comment={r.comment}
            toolName={r.toolName}
            at={r.at}
          />
        </li>
      ))}
    </ul>
  );
}
