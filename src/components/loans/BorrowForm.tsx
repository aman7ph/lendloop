"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { CheckCircle2 } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/Button";
import { friendlyError } from "@/lib/errors";
import { fromInputValue, toInputValue } from "@/lib/dates";

type Props = { toolId: Id<"tools">; maxLoanDays: number; onDone: () => void };

const inputClass =
  "h-12 w-full rounded-2xl border border-line bg-surface px-3 outline-none focus:border-brand";

export function BorrowForm({ toolId, maxLoanDays, onDone }: Props) {
  const request = useMutation(api.loans.request);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit() {
    setError("");
    const startDate = fromInputValue(start);
    const endDate = fromInputValue(end);
    if (Number.isNaN(startDate) || Number.isNaN(endDate)) {
      return setError("Please choose both a pick-up and a return time.");
    }
    setBusy(true);
    try {
      await request({ toolId, startDate, endDate });
      setSent(true);
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl bg-brand-soft p-6 text-center">
        <CheckCircle2 size={36} className="text-brand" />
        <p className="font-semibold">Request sent</p>
        <p className="text-sm text-muted">
          The lender will approve or decline it. You can follow it in My
          activity.
        </p>
        <Button onClick={onDone}>Done</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium">
          Pick-up
          <input
            type="datetime-local"
            value={start}
            min={toInputValue(Date.now())}
            onChange={(e) => setStart(e.target.value)}
            className={`mt-1 ${inputClass}`}
          />
        </label>
        <label className="text-sm font-medium">
          Return
          <input
            type="datetime-local"
            value={end}
            min={start || toInputValue(Date.now())}
            onChange={(e) => setEnd(e.target.value)}
            className={`mt-1 ${inputClass}`}
          />
        </label>
      </div>
      <p className="text-xs text-muted">
        The owner allows up to {maxLoanDays} days per loan.
      </p>
      {error && (
        <p
          role="alert"
          className="rounded-xl bg-accent-soft p-3 text-sm text-danger"
        >
          {error}
        </p>
      )}
      <Button onClick={submit} disabled={busy} className="h-12">
        {busy ? "Sending..." : "Request to borrow"}
      </Button>
    </div>
  );
}
