"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { ProfileHeader } from "@/components/reviews/ProfileHeader";
import { RatingSummary } from "@/components/reviews/RatingSummary";
import { ReceivedReviews } from "@/components/reviews/ReceivedReviews";

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const profile = useQuery(api.reviews.profile, { userId: id });

  if (profile === undefined) return <Spinner />;
  if (profile === null)
    return <EmptyState text="This member could not be found." />;

  return (
    <div>
      <ProfileHeader
        name={profile.name}
        imageUrl={profile.imageUrl}
        trusted={profile.trustedLender}
      />
      <RatingSummary lender={profile.lender} borrower={profile.borrower} />
      <h2 className="mb-3 mt-8 text-xl font-semibold">Reviews</h2>
      <ReceivedReviews reviews={profile.reviews} emptyText="No reviews yet." />
    </div>
  );
}
