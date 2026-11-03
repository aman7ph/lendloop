"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/Button";
import { friendlyError } from "@/lib/errors";
import { Loan } from "./types";

export function CancelRequest({ loan }: { loan: Loan }) {
  const cancel = useMutation(api.loans.cancel);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function run() {
    setBusy(true);
    setError("");
    try {
      await cancel({ loanId: loan.id });
    } catch (e) {
      setError(friendlyError(e));
      setBusy(false);
    }
  }

  return (
    <div className="mt-3">
      <Button variant="outline" disabled={busy} onClick={run}>
        {busy ? "Cancelling..." : "Cancel request"}
      </Button>
      {error && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
