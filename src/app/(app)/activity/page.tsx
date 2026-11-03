"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Tabs } from "@/components/ui/Tabs";
import { MyRequests } from "@/components/loans/MyRequests";
import { IncomingRequests } from "@/components/loans/IncomingRequests";
import { ReviewPrompts } from "@/components/loans/ReviewPrompts";
import { MyListings } from "@/components/tools/MyListings";

export default function ActivityPage() {
  const [tab, setTab] = useState("requests");
  const incoming = useQuery(api.loans.incoming);
  const pending =
    incoming?.filter((l) => l.status === "pending" && !l.expired).length ?? 0;
  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
        My activity
      </h1>
      <p className="mb-6 mt-1 text-muted">
        Keep track of the tools you&apos;re sharing and borrowing.
      </p>

      <ReviewPrompts />

      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          { id: "requests", label: "My requests" },
          { id: "listings", label: "My listings" },
          { id: "incoming", label: "Incoming requests", count: pending },
        ]}
      />

      <div className="mt-6">
        {tab === "requests" && <MyRequests />}
        {tab === "listings" && <MyListings />}
        {tab === "incoming" && <IncomingRequests />}
      </div>
    </div>
  );
}
