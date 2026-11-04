# Production notes: what I would change

Ordered by risk. The take-home runs locally. This is what I would change before real users, and how I would carry the same ideas into a healthcare context.

## 1. Before real users

- **Convex errors:** switch every `throw new Error("CODE")` to `ConvexError("CODE")`. Production Convex hides the message of plain errors from clients. The UI's error mapping already reads both forms.
- **Clerk:** use a production instance on a real domain, and add Clerk webhooks (`user.created`, `user.updated`, `user.deleted`) to sync profiles and handle account deletion. Today a row is created lazily on first sign-in.
- **Admins:** require MFA, keep an audit log of every admin action, and manage roles through an audited process instead of the dashboard.
- **Abuse limits:** rate-limit request creation, uploads and the `/automation/*` endpoints.
- **Uploads:** record the uploader and accept only the caller's own files (today a client could attach another user's storage id), check the real file bytes and not only the declared type, strip image metadata, and run a scheduled cleanup for orphaned files.

## 2. n8n and automation

- **Hosting:** run n8n on a managed host with a real domain and TLS, expose only `/webhook/*` publicly, keep the editor behind SSO or a VPN, use Postgres instead of SQLite, pin versions, and back up the database and `N8N_ENCRYPTION_KEY`.
- **Secrets:** use a secrets manager, re-block `$env` access in nodes, rotate on a schedule, use separate secrets per environment, and accept two secrets during a rotation window.
- **Dedupe store:** move the idempotency keys from workflow static data to a database table or Redis with a TTL, so it survives restarts and works across instances.
- **Notifications:** use a real per-user channel (email, SMS or in-app) with preferences. The payload stays minimal.
- **Alerting:** send alerts to a separate real channel such as email or a pager, alert on bursts of 401s, and add an admin view of failed events with a manual "resend" (a dead-letter queue).
- **Reminder policy:** cap the number of reminders, escalate to the lender, respect quiet hours and each user's timezone, and paginate the overdue endpoint.
- **Retry queue:** replace the self-scheduled retry chain with a proper work queue with concurrency limits.

## 3. Data and domain

- **Deletion:** soft-delete tools, and add an admin force-remove that cancels active loans and notifies the borrower.
- **Stale requests:** auto-expire old pending requests with a scheduled job.
- **Reviews:** make them double-blind (hidden until both are submitted or a deadline passes), and soft-delete instead of letting an author re-review after deleting.
- **Performance:** paginate lists, move search to the server, and denormalize availability to remove the per-tool loan lookup. Recompute availability on a schedule so it flips when a loan's start time passes.

## 4. Quality and operations

- **Tests:** add `convex-test` for the permission rules, the status machine and the overlap logic, plus Playwright for the main flows. Run `tsc`, lint, tests and the secret scan in CI.
- **Observability:** Sentry for frontend and backend, structured logs with request ids, metrics for delivery success and retry counts (Datadog or OpenTelemetry), and an uptime check on n8n.
- **Environments:** separate dev, staging and production deployments for Convex, Clerk and n8n.
- **Web hardening:** security headers and a content security policy, plus dependency scanning.

## 5. If this handled health data

LendLoop moves tool names and display names. A clinical product moves far more sensitive data, so I would apply the same patterns more strictly:

- **Notifications carry no clinical content or identifiers.** They say "you have an update" with a link that requires authentication, and the detail is read in the app. The same rule as the minimal webhook payload here, taken further.
- **Encrypt in transit and at rest**, add field-level encryption for the most sensitive fields, and manage keys properly.
- **Audit trail** for every read and write of sensitive records, not only admin actions.
- **Least privilege** beyond `admin` and `user`: clinician, administrator and researcher roles with narrow scopes, enforced server-side as they are here.
- **Retention and erasure** policies, and consent records.
- **Vendors:** the right agreements (data processing, or business associate agreements where required) with every service that touches the data, including the identity provider, database, automation host and notification provider, and attention to data residency.
- **Incident response:** logging that supports investigation, plus a documented breach process.
