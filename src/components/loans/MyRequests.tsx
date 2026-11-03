"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoanCard } from "./LoanCard";
import { CancelRequest } from "./CancelRequest";

export function MyRequests() {
  const loans = useQuery(api.loans.myRequests);
  if (loans === undefined) return <Spinner />;
  if (loans.length === 0) {
    return (
      <EmptyState text="You haven't asked to borrow anything yet. Browse tools to get started." />
    );
  }
  return (
    <ul className="grid gap-4 lg:grid-cols-2">
      {loans.map((l) => (
        <li key={l.id}>
          <LoanCard loan={l} role="borrower">
            {l.status === "pending" && <CancelRequest loan={l} />}
          </LoanCard>
        </li>
      ))}
    </ul>
  );
}
