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
- D14: Signed-in users see the owner's name and Trusted Lender badge, never the
  owner's email or ids beyond what the UI needs. The public list shows no ids.
- D15: Tool input is validated and normalised on the server (length limits,
  category allow-list). The client's validation is UX only.
- D16: "Available" means no approved loan that has started and is unreturned.
  Overdue loans therefore still count as unavailable.
- D17: Categories are a table managed by admins only. Tools store the
  normalised category name. Renaming is not supported.
- D18: Category names are normalised (trim, lowercase, collapsed spaces) and
  validated on the server, so duplicates differing only by case cannot exist.
- D19: A category used by any tool cannot be deleted (same principle as D10).
- D20: Default categories are seeded by an internal mutation, which is not
  callable from clients.
- D21: Approving a request automatically declines pending requests on the same
  tool whose dates overlap (declineReason "auto_overlap").
- D22: Loan times are exact moments. Start may not be in the past (5 minute
  grace for clock skew). End must be strictly after start.
- D23: Each tool has an owner-defined maxLoanDays (default 14, ceiling 60).
- D24: Overlap uses half-open intervals [start, end), so back-to-back loans do
  not conflict.
- D25: Overlap is re-checked at approval time, not only at request time.
- D26: A borrower may hold only one pending request per tool.
- D27: Only the lender can approve or decline. The lender or an admin can mark
  a loan returned.
- D28: Reviews attach to a loan, not to a user pair. Only the lender and
  borrower of a loan with status "returned" can review each other, once each.
- D29: Rating is an integer 1-5, comment max 500 chars, validated on the
  server. Reviews cannot be edited. The reviewer or an admin can delete.
- D30: Rating aggregates (sum, count) are stored per role on the user and
  updated in the same transaction as the review, so they cannot drift.
- D31: A tool has at most 3 images, enforced on the server. The public list
  never includes images.
- D32: Signed-in tool listings include ownerId so the UI can link to a member
  profile. The public list still exposes no ids.
- D33: Deleting a review lets its author review that loan again. Accepted for
  this scope. A production fix is soft-deleting and keeping the review slot used.
- D34: Profile pictures come from the Clerk token (picture claim). There is no
  custom upload, which removes an attack surface.
- D35: Tool images are validated on the server: max 3, jpeg/png/webp, max 5 MB,
  no duplicates. Only a tool's own removed images are deleted.
- D36: Known gap: a client could attach a storage id that another user
  uploaded. Production fix: record uploads in a table with the uploader and
  accept only the caller's own.
- D37: Unused uploads (upload started, tool never saved) become orphans.
  Production fix: a scheduled cleanup job.
- D38: Next.js Cache Components is disabled. The app is a signed-in, client-driven
  UI over live Convex subscriptions, so server-side caching adds no value and its
  instant-navigation validation conflicts with the auth gate.
- D39: Borrowers can cancel their own pending requests. The loan moves to
  "cancelled" instead of being deleted, so history is kept and the automation
  step can notify the lender. Approved loans cannot be cancelled by the borrower.
- D40: Ratings and reviews are visible to signed-in members only. The public
  page shows none.
- D41: The profile query takes a string and validates it, returning null for
  an invalid id, so a bad URL shows "not found" instead of crashing.
- D42: Only a review's author can delete it (admins can delete any). Deletion
  reverses the rating aggregates in the same transaction.
- D43: Tool listings expose only the owner's lender rating (average and count),
  never individual reviews.
- D44: Admin pages render only for admins, but this is UX. Each admin function
  calls requireAdmin on the server.
- D45: setTrusted sets an explicit value (idempotent), not a toggle.
- D46: The admin member list shows names and flags only, never emails or
  Clerk ids.
- D47: Admins can delete any listing and mark loans returned, but cannot edit
  listings or act as lenders (D1).
- D48: Automation uses two separate shared secrets, one per direction. Payloads
  are signed with HMAC-SHA256 over "timestamp.body", timestamps older than 5
  minutes are rejected, and comparisons are constant-time.
- D49: Notification events are scheduled from inside the mutation (outbox
  pattern), so they are attempted if and only if the change committed.
- D50 (updated): The notification step in n8n has two delivery nodes, a logged
  mock and a Discord webhook. The Discord URL is stored in an n8n credential.
- D51: Notification payloads contain display names, tool name and dates only.
  No emails or ids. Adding an email channel later would be a deliberate change
  to the payload.
- D52: Automation failures never roll back the business change. The mutation
  commits first, and delivery is attempted afterwards, recorded, and retried
  with backoff (30s, 2min, 10min, 4 attempts).
- D53: Delivery is idempotent. The key is loanId:notify:event, a delivered
  event is never re-sent or downgraded, and each retry re-signs with a fresh
  timestamp.
- D54: Backend environment variables are declared with validators in
  convex/convex.config.ts and read through the generated typed env object.
  A missing secret blocks the deploy, and a mistyped name is a compile error.
  The webhook URL is optional so a missing URL degrades to a recorded failure.
- D55: n8n runs in Docker bound to localhost, with a pinned image version.
  Shared secrets reach it through a git-ignored env file and are read with
  $env, never stored in exported workflow JSON. $env access is enabled
  explicitly. Production would use an external secrets manager instead.
- D56: n8n deduplicates deliveries by idempotency key using workflow static
  data with a 24h TTL. A key is recorded only after delivery succeeds, so a
  failed delivery can be retried. Production would use a database table.
- D57: User-controlled names are sanitised (no mentions or markdown) before
  they are placed in chat messages.
- D58: The n8n workflow answers with deliberate status codes: 200 delivered or
  duplicate, 401 bad signature, 422 unsupported event, 502 delivery failure.
  Convex retries only 5xx, 408, 429 and network errors. A 4xx is permanent.
- D59: A key is stored as delivered only after the channel accepts the message,
  so a failed delivery can be retried.
- D60: Node success is not trusted until its failure path has been observed.
  Discord delivery uses an HTTP Request node, which fails on non-2xx
  responses, with the webhook URL in an environment variable.
- D61: Mark delivered reads the idempotency key from the Build message node
  explicitly, not from the previous node's output.
- D62: The Convex request timeout (20s) exceeds n8n's worst-case delivery
  time, so slow deliveries are not misreported as failures.
