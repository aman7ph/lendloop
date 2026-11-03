import { ReactNode } from "react";
import { Package } from "lucide-react";
import { formatRange } from "@/lib/dates";
import { StatusBadge } from "./StatusBadge";
import { Loan } from "./types";
import Link from "next/link";

type Props = { loan: Loan; role: "borrower" | "lender"; children?: ReactNode };

export function LoanCard({ loan, role, children }: Props) {
  const otherId = role === "borrower" ? loan.lenderId : loan.borrowerId;
  const otherName = role === "borrower" ? loan.lenderName : loan.borrowerName;
  const note =
    loan.declineReason === "auto_overlap"
      ? "This tool was lent to someone else for those dates."
      : loan.overdue
        ? role === "borrower"
          ? "This was due back already. Please return it to the lender."
          : `${loan.borrowerName} hasn't returned this yet.`
        : "";

  return (
    <article className="rounded-3xl bg-surface p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-tint-mint text-brand">
          <Package size={22} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{loan.toolName}</p>
          <p className="text-sm text-muted">
            {formatRange(loan.startDate, loan.endDate)}
          </p>
          <p className="text-sm text-muted">
            {role === "borrower" ? "Lender: " : "Borrower: "}
            <Link href={`/profile/${otherId}`} className="hover:underline">
              {otherName}
            </Link>
          </p>
        </div>
        <StatusBadge loan={loan} />
      </div>
      {note && (
        <p className="mt-3 rounded-xl bg-accent-soft p-3 text-sm">{note}</p>
      )}
      {children}
    </article>
  );
}
