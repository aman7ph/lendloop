"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Id } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { StatusBadge } from "@/components/loans/StatusBadge";
import { formatRange } from "@/lib/dates";
import { friendlyError } from "@/lib/errors";

export function AllLoans() {
  const loans = useQuery(api.loans.allLoans);
  const markReturned = useMutation(api.loans.markReturned);
  const [error, setError] = useState("");

  if (loans === undefined) return <Spinner />;
  if (loans.length === 0) return <EmptyState text="No loans yet." />;

  async function returned(loanId: Id<"loans">) {
    setError("");
    try {
      await markReturned({ loanId });
    } catch (e) {
      setError(friendlyError(e));
    }
  }

  return (
    <>
      {error && (
        <p
          role="alert"
          className="mb-3 rounded-xl bg-accent-soft p-3 text-sm text-danger"
        >
          {error}
        </p>
      )}
      <ul className="grid gap-3">
        {loans.map((l) => (
          <li
            key={l.id}
            className="flex flex-wrap items-center gap-3 rounded-3xl bg-surface p-4 shadow-sm"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{l.toolName}</p>
              <p className="text-sm text-muted">
                {l.lenderName} lends to {l.borrowerName}
              </p>
              <p className="text-sm text-muted">
                {formatRange(l.startDate, l.endDate)}
              </p>
            </div>
            <StatusBadge loan={l} />
            {l.status === "approved" && (
              <Button variant="outline" onClick={() => returned(l.id)}>
                Mark returned
              </Button>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
