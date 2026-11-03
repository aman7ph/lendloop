import { Badge } from "@/components/ui/Badge";
import { Loan } from "./types";

export function StatusBadge({
  loan,
}: {
  loan: Pick<Loan, "status" | "overdue" | "expired">;
}) {
  if (loan.expired) return <Badge>Expired</Badge>;
  if (loan.overdue) return <Badge tone="alert">Overdue</Badge>;
  if (loan.status === "pending") return <Badge tone="warn">Pending</Badge>;
  if (loan.status === "approved") return <Badge tone="success">Approved</Badge>;
  if (loan.status === "declined") return <Badge tone="alert">Declined</Badge>;
  if (loan.status === "cancelled") return <Badge>Cancelled</Badge>;
  return <Badge>Returned</Badge>;
}
