"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoanCard } from "./LoanCard";
import { LoanActions } from "./LoanActions";

export function IncomingRequests() {
  const loans = useQuery(api.loans.incoming);
  if (loans === undefined) return <Spinner />;
  if (loans.length === 0) {
    return <EmptyState text="No one has asked to borrow your tools yet." />;
  }
  return (
    <ul className="grid gap-4 lg:grid-cols-2">
      {loans.map((l) => (
        <li key={l.id}>
          <LoanCard loan={l} role="lender">
            <LoanActions loan={l} />
          </LoanCard>
        </li>
      ))}
    </ul>
  );
}
