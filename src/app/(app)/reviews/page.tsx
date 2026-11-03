"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Spinner } from "@/components/ui/Spinner";
import { Tabs } from "@/components/ui/Tabs";
import { RatingSummary } from "@/components/reviews/RatingSummary";
import { ReceivedReviews } from "@/components/reviews/ReceivedReviews";
import { GivenReviews } from "@/components/reviews/GivenReviews";

export default function MyReviewsPage() {
  const me = useQuery(api.users.me);
  const profile = useQuery(
    api.reviews.profile,
    me ? { userId: me.id } : "skip",
  );
  const [tab, setTab] = useState("received");

  if (!profile) return <Spinner />;

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
        My reviews
      </h1>
      <p className="mb-6 mt-1 text-muted">
        What neighbors say about you, and what you said about them.
      </p>

      <RatingSummary lender={profile.lender} borrower={profile.borrower} />

      <div className="mt-6">
        <Tabs
          active={tab}
          onChange={setTab}
          tabs={[
            {
              id: "received",
              label: "Received",
              count: profile.reviews.length,
            },
            { id: "given", label: "Given" },
          ]}
        />
      </div>

      <div className="mt-6">
        {tab === "received" ? (
          <ReceivedReviews
            reviews={profile.reviews}
            emptyText="No one has reviewed you yet. Reviews appear after a loan is returned."
          />
        ) : (
          <GivenReviews />
        )}
      </div>
    </div>
  );
}
