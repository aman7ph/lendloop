"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/Button";
import { friendlyError } from "@/lib/errors";
import { Loan } from "./types";

export function LoanActions({ loan }: { loan: Loan }) {
  const approve = useMutation(api.loans.approve);
  const decline = useMutation(api.loans.decline);
  const markReturned = useMutation(api.loans.markReturned);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  async function run(fn: () => Promise<string | null>) {
    setBusy(true);
    setMessage("");
    try {
      setIsError(false);
      setMessage((await fn()) ?? "");
    } catch (e) {
      setIsError(true);
      setMessage(friendlyError(e));
    } finally {
      setBusy(false);
    }
  }

  const onApprove = () =>
    run(async () => {
      const { autoDeclined } = await approve({ loanId: loan.id });
      return autoDeclined.length
        ? `${autoDeclined.length} overlapping request(s) were declined automatically.`
        : "";
    });

  return (
    <div className="mt-3">
      <div className="flex flex-wrap gap-2">
        {loan.status === "pending" && (
          <>
            {!loan.expired && (
              <Button disabled={busy} onClick={onApprove}>
                Approve
              </Button>
            )}
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => run(() => decline({ loanId: loan.id }))}
            >
              Decline
            </Button>
          </>
        )}
        {loan.status === "approved" && (
          <Button
            disabled={busy}
            onClick={() => run(() => markReturned({ loanId: loan.id }))}
          >
            Mark as returned
          </Button>
        )}
      </div>
      {message && (
        <p
          role={isError ? "alert" : "status"}
          className={`mt-2 text-sm ${isError ? "text-danger" : "text-brand"}`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
