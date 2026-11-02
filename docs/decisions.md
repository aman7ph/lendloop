## 1. Roles and permissions

Two roles: `admin` and `user`. "Lender" and "borrower" are not roles. They are
relationships to a specific tool or loan, checked on every request.

### Decisions

- D1: Only the lender (tool owner) can approve or decline a request on their tool.
  Admins moderate (remove listings, view all loans, mark Trusted Lender) but do not
  act as lenders.
- D2: There is no in-app way to change a role. The first admin is set manually in
  the Convex dashboard. This removes privilege escalation through the app entirely.
- D3: All checks are enforced inside Convex functions. The UI only hides buttons.
- D4: The server derives ownerId, lenderId, and borrowerId from the authenticated
  user and the tool record. The client never sends them.

## 2. Data model

Tables: users, tools, loans, automationEvents.

### users

clerkId (indexed), name, email, role ("admin" | "user", default "user"),
trustedLender (boolean, default false)

### tools

ownerId, name, category, condition, description
Indexes: by owner, by category

### loans

toolId, toolName (snapshot), borrowerId, lenderId, startDate, endDate,
status ("pending" | "approved" | "declined" | "returned"), returnedAt (optional)
Indexes: by borrower, by lender, by tool, by status + endDate

### automationEvents

loanId, kind ("notify" | "reminder"), status ("sent" | "failed"),
attempts, at, idempotencyKey (indexed)

### Loan status flow

pending -> approved -> returned
pending -> declined
No other transitions are allowed.

### Decisions

- D5: "Overdue" is derived (status = approved and endDate < now), never stored.
- D6: A request is rejected if its dates overlap an approved loan on the same
  tool, or if the borrower owns the tool.
- D7: lenderId is copied onto the loan at creation, so access checks do not
  depend on the tool record.
- D8: The public query returns an explicit projection (name, category,
  available flag), never raw documents, so owner data cannot leak by accident.
- D9: Idempotency key format is loanId:kind:eventOrDate. A retry hits the same
  key and is a no-op.
- D10: A tool with a pending or approved loan cannot be deleted, by owners or
  admins. Tools with only returned or declined loans can be deleted, and the
  history is kept.
- D11: loans store a toolName snapshot so history still displays after the tool
  is deleted.
- D12: users rows are created lazily on first sign-in via users.store, which
  takes no arguments. Identity fields come only from the verified token. New
  rows always get role "user". store never modifies role or trustedLender.
- D13: Authorization helpers (requireUser, requireAdmin) live in
  convex/lib/auth.ts and are the first call in every protected function.
