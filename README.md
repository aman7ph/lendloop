# LendLoop

> Borrow what you need. Lend what you don't.

A neighborhood tool-lending board. Neighbors list tools they are willing to lend, request to borrow them for a date range, and receive automated notifications and overdue reminders handled by n8n.

Built for the Fluence full-stack take-home.

**Stack:** Next.js (App Router) · TypeScript · Tailwind CSS · Clerk · Convex · n8n (self-hosted with Docker)

## Contents

1. [Features](#features)
2. [Architecture](#architecture)
3. [Local setup](#local-setup)
4. [Environment variables](#environment-variables)
5. [Automation design (n8n)](#automation-design-n8n)
6. [Security and data minimization](#security-and-data-minimization)
7. [Testing status](#testing-status)
8. [Known limitations](#known-limitations)
9. [Repository layout](#repository-layout)

## Features

- **Public page:** brand, tagline, a read-only list of available tools (name and category only, no owner details, no ids), and a "Sign in to lend or borrow" button (Clerk).
- **Tools:** members list a tool (name, category, condition, description, up to 3 photos, and the longest loan they allow), edit or delete only their own listings, and browse all tools with availability, search (tool, category or neighbor) and category filters.
- **Loans:** request a date range, then the lender approves or declines, the borrower can cancel a pending request, and the lender marks the loan returned. Overlapping dates are rejected, and approving a request automatically declines overlapping pending ones. Overdue is derived (never stored) and flagged for both sides.
- **Views:** My listings, My requests and Incoming requests, in one "My activity" page.
- **Reviews:** after a loan is returned, each side can rate the other (1 to 5 stars and a comment). Ratings are kept separately for the lender and borrower roles, and members have a profile page.
- **Admin:** manage categories, see all loans, mark a lender as "Trusted Lender" (badge visible to members), and remove any listing.
- **Automation (n8n):** three workflows, described below.
- **Mobile first:** a bottom tab bar on phones and a sidebar on desktop, with the same visual identity.

## Architecture

```
Browser (Next.js, React)
   |  Clerk sign-in -> JWT
   v
Convex  (queries, mutations, HTTP actions)
   |  verifies the JWT; every function checks role and ownership itself
   |
   |  loan mutation commits and schedules an internal action in the same transaction
   |        |
   |        v
   |   notify.send ---- signed webhook (HMAC) ----> n8n "loan events"
   |        ^                                          verify -> dedupe -> deliver (Discord)
   |        |  records sent / failed, retries with backoff
   |
   |  HTTP endpoints, accepted only with a valid n8n signature
   |     GET  /automation/overdue            <---- n8n "overdue reminders" (daily 09:00)
   |     POST /automation/reminder-result    <---- n8n write-back (idempotent)

n8n "error alerts": runs when either workflow fails and posts an alert.
```

**Data model** (Convex tables):

| Table              | Purpose                                                                                                            |
| ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `users`            | Clerk id, name, email, `role` (`admin` or `user`), `trustedLender`, picture, rating totals                         |
| `categories`       | Admin-managed category names                                                                                       |
| `tools`            | Owner, name, category, condition, description, max loan days, image ids                                            |
| `loans`            | Tool, borrower, lender, dates, status (`pending`, `approved`, `declined`, `returned`, `cancelled`), decline reason |
| `reviews`          | One per person per returned loan, with the reviewee's role                                                         |
| `automationEvents` | Delivery log: kind, event, status, attempts, last error, idempotency key                                           |

"Lender" and "borrower" are **not roles**. They are relationships to a specific tool or loan, checked on every request. The only roles are `admin` and `user`.

## Local setup

**Prerequisites:** Node.js 20.9 or newer, Docker (Desktop on Windows or macOS), and free accounts on [Clerk](https://clerk.com) and [Convex](https://convex.dev).

### 1. Install

```bash
git clone https://github.com/aman7ph/lendloop.git
cd lendloop
npm install
```

### 2. Convex

```bash
npx convex dev
```

Log in and create a project when asked. This writes `NEXT_PUBLIC_CONVEX_URL` and `CONVEX_DEPLOYMENT` to `.env.local` and keeps syncing `convex/`. **Leave it running.** The first push reports the two automation secrets (below) as missing until you set them.

### 3. Two shared secrets for the automation

Generate two different random values (run the command twice):

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

```bash
npx convex env set N8N_WEBHOOK_SECRET <first value>
npx convex env set AUTOMATION_API_SECRET <second value>
```

Keep the same two values for `n8n/.env` in step 7.

### 4. Clerk

1. Create a Clerk application and enable your sign-in options.
2. In the Clerk dashboard, activate the **Convex integration** and copy the **Frontend API URL**:
   ```bash
   npx convex env set CLERK_FRONTEND_API_URL https://<your-instance>.clerk.accounts.dev
   ```
3. Under **Sessions, Customize session token**, add these claims so Convex receives them:
   ```json
   {
     "name": "{{user.full_name}}",
     "email": "{{user.primary_email_address}}",
     "picture": "{{user.image_url}}"
   }
   ```
4. Put the keys in `.env.local`:
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   ```

### 5. Seed the categories

```bash
npx convex run categories:seedDefaults
```

### 6. Run the app

```bash
npm run dev
```

Open http://localhost:3000 and sign in. **To become an admin**, open the Convex dashboard, go to Data, then `users`, and set your row's `role` to `admin`. This is deliberate: there is no way to change a role from inside the app.

### 7. n8n (Docker)

```bash
cp n8n/.env.example n8n/.env     # on Windows: copy n8n\.env.example n8n\.env
```

Fill in `n8n/.env`:

- `N8N_ENCRYPTION_KEY`: a new random value (same command as above).
- `N8N_WEBHOOK_SECRET` and `AUTOMATION_API_SECRET`: the **same** two values you set in Convex.
- `CONVEX_SITE_URL`: your Convex HTTP actions URL (Convex dashboard, Settings, URL and Deploy Key). It ends in `.convex.site`.
- `DISCORD_WEBHOOK_URL` and `DISCORD_ALERT_WEBHOOK_URL`: two Discord webhook URLs (one for notifications, one for alerts). Any endpoint that accepts a JSON `POST` and answers 2xx also works as a stand-in, for example a free webhook.site address.

Start n8n and import the workflows:

```bash
cd n8n && docker compose up -d && cd ..
```

1. Open http://localhost:5678 and create the local owner account.
2. For each file in `n8n/workflows/` (`loan-events.json`, `overdue-reminders.json`, `error-alerts.json`), use the workflow menu, then **Import from file**.
3. Open the **loan events** and **overdue reminders** workflows, go to **Settings**, and set **Error Workflow** to `LendLoop error alerts`.
4. Publish all three workflows.

Test the webhook gate without Convex (it reads the secret from `n8n/.env`):

```bash
node scripts/send-test-event.mjs --url=http://localhost:5678/webhook/lendloop-events
node scripts/send-test-event.mjs --url=http://localhost:5678/webhook/lendloop-events --tamper   # 401
node scripts/send-test-event.mjs --url=http://localhost:5678/webhook/lendloop-events --stale     # 401
```

### 8. Live end-to-end test (optional)

Convex runs in the cloud and cannot reach `localhost`, so expose n8n temporarily with a free Cloudflare quick tunnel:

```bash
cloudflared tunnel --url http://localhost:5678
npx convex env set N8N_WEBHOOK_URL https://<tunnel-address>/webhook/lendloop-events
```

Now request, approve, decline, cancel or return a loan in the app and watch the messages arrive. The tunnel exposes the whole n8n instance, so close it afterwards and remove the variable:

```bash
npx convex env remove N8N_WEBHOOK_URL
```

With no URL set, the app works normally and each notification attempt is recorded as `failed` in `automationEvents`.

### Helper scripts

| Script                        | Purpose                                                                            |
| ----------------------------- | ---------------------------------------------------------------------------------- |
| `scripts/send-test-event.mjs` | Sends a correctly signed (or deliberately bad) event to the n8n webhook            |
| `scripts/call-convex.mjs`     | Calls the signed Convex endpoints the way n8n does (`overdue`, `result`)           |
| `scripts/check-secrets.mjs`   | Scans tracked files and git history for any secret value from your local env files |

## Environment variables

| Variable                                           | Where                     | Secret  | Purpose                                                      |
| -------------------------------------------------- | ------------------------- | ------- | ------------------------------------------------------------ |
| `NEXT_PUBLIC_CONVEX_URL`, `CONVEX_DEPLOYMENT`      | `.env.local`              | no      | Written by `npx convex dev`                                  |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`                | `.env.local`              | no      | Clerk frontend key                                           |
| `CLERK_SECRET_KEY`                                 | `.env.local`              | **yes** | Clerk backend key                                            |
| `CLERK_FRONTEND_API_URL`                           | Convex env                | no      | Which issuer Convex trusts for tokens                        |
| `N8N_WEBHOOK_SECRET`                               | Convex env and `n8n/.env` | **yes** | Convex signs, n8n verifies                                   |
| `AUTOMATION_API_SECRET`                            | Convex env and `n8n/.env` | **yes** | n8n signs, Convex verifies                                   |
| `N8N_WEBHOOK_URL`                                  | Convex env (optional)     | no      | Where Convex sends events. Unset means failures are recorded |
| `N8N_ENCRYPTION_KEY`                               | `n8n/.env`                | **yes** | Encrypts n8n's stored data                                   |
| `CONVEX_SITE_URL`                                  | `n8n/.env`                | no      | Convex HTTP endpoints base URL                               |
| `N8N_PUBLIC_URL`                                   | `n8n/.env` (optional)     | no      | Public n8n URL when behind a tunnel or domain                |
| `DISCORD_WEBHOOK_URL`, `DISCORD_ALERT_WEBHOOK_URL` | `n8n/.env`                | **yes** | Delivery and alert channels                                  |

Backend variables are declared with validators in `convex/convex.config.ts` and read through a typed `env` object. A missing secret blocks the deploy, and a mistyped name is a compile error. Compose passes the secrets to n8n, where workflows read them with `$env`. Nothing secret is stored in the workflow JSON.

## Automation design (n8n)

### Workflow 1: loan events (Convex to n8n)

Each loan change (`created`, `approved`, `declined`, `auto_declined`, `cancelled`, `returned`) schedules an internal Convex action **inside the same transaction** as the change. If the change fails, nothing is sent. If it commits, delivery is attempted afterwards and never blocks the user.

The action sends a minimal JSON payload (event, display names, tool name, dates, idempotency key), signed with HMAC-SHA256 over `timestamp.rawBody`. In n8n:

```
Webhook (raw body) -> verify signature + 5 min window -> duplicate check -> build message
   -> log (mock) -> Discord -> mark delivered -> 200
```

The workflow answers with deliberate status codes:

| Status | Meaning                          | Convex behavior                                          |
| ------ | -------------------------------- | -------------------------------------------------------- |
| 200    | Delivered, or duplicate ignored  | Record `sent`                                            |
| 401    | Bad signature or stale timestamp | Permanent failure, no retry                              |
| 422    | Unsupported event                | Permanent failure, no retry                              |
| 502    | Delivery failed                  | Record `failed`, retry (30 s, 2 min, 10 min, 4 attempts) |

### Workflow 2: overdue reminders (n8n to Convex)

A daily schedule (09:00, `Africa/Addis_Ababa`, set in the compose file) signs a `GET /automation/overdue` request, sends one reminder per overdue loan, and signs a `POST /automation/reminder-result` write-back per loan. Convex leaves out loans already reminded today. A failed send is written back as `failed`, so the loan is picked up again by the next run.

### Workflow 3: error alerts

Any failed run triggers an alert to a **separate** channel with the workflow name, the error and a link to the execution. Failure branches reply to the caller first and then raise an error on purpose, because a node set to "continue on error" would otherwise leave the run marked as a success and nobody would be alerted.

### Reliability properties

- **Signed in both directions**, with a **separate secret for each direction**. The inbound signature covers the method and path, so a captured signature cannot be replayed on another endpoint.
- **Idempotent**: keys are `loanId:notify:event` and `loanId:reminder:YYYY-MM-DD` (the date is chosen by Convex). Convex checks before sending and never downgrades a `sent` row. n8n deduplicates by key and records a key only after delivery succeeds, so a failed delivery can be retried.
- **Failures are visible**: every attempt is stored in `automationEvents` with its status, attempts and last error, retries use backoff, and failed n8n runs raise an alert.

## Security and data minimization

**Authorization**

- All rules are enforced inside Convex functions. The UI only hides buttons.
- Two roles. The role lives in the Convex `users` table (not in the token), and no function can change it. The first admin is set by hand in the dashboard.
- Ownership is derived on the server. Clients never send `ownerId`, `lenderId` or `borrowerId`, and every function that takes an id checks it against the caller (no insecure direct object references).
- Admins moderate (remove listings, view all loans, set the Trusted Lender badge) but do not edit listings or act as lenders.
- Loans follow a state machine, and every mutation validates the current status. The overlap rule is re-checked at approval time inside the transaction.
- All input is validated on the server (lengths, category allow-list, ratings, dates, image count, type and size).

**Data minimization**

- The public query returns an explicit projection: tool name and category only.
- Signed-in lists show the owner's display name, picture, Trusted flag and average rating, never emails or ids beyond what the UI needs.
- The admin member list shows no emails.
- n8n receives only what a message needs: event type, display names, tool name and dates. No emails and no ids.
- Names are user-controlled text, so they are stripped of mentions and markdown before going into a chat message, and Discord is also told to ignore mentions.

**Secrets**

- Secrets live in environment variables. The exported workflows contain none.
- `.env*` is git-ignored, and the example files contain names only.
- `scripts/check-secrets.mjs` scans tracked files and the whole git history for any value from your local env files.
- n8n is bound to `127.0.0.1` and its image version is pinned.

Every decision is logged with its rationale in [`docs/decisions.md`](docs/decisions.md). What I would change for production is in [`docs/production-notes.md`](docs/production-notes.md).

## Testing status

There is **no automated test suite yet**. Verification so far:

**Verified**

- Convex rules (validation, ownership, overlap, status transitions and admin-only functions) with a temporary test harness that is not part of the repo.
- The n8n gate with `send-test-event.mjs`: valid, tampered body, stale timestamp, duplicate key, unsupported event, and Discord delivery failure followed by a successful retry with the same key.
- The signed Convex endpoints with `call-convex.mjs`: valid, stale, tampered, invalid id, and idempotent write-back.
- The reminder workflow: happy path, a second run that sends nothing, and a failed send that recovers on the next run.
- Live end to end through a tunnel: created, approved, declined, cancelled and returned notifications from real UI actions, plus an n8n outage where Convex retried and delivered exactly one message on the third attempt.

**Implemented but not covered by scripted tests**

- Reviews and profiles, the admin page, category management, and tool image upload.
- The `auto_declined` notification (its template was tested by script, but not triggered live).

## Known limitations

- The brief's bonus (automation activity shown on each loan) is not implemented yet. The data exists in `automationEvents`.
- Notifications are sent through n8n only, with no in-app notification center.
- Lists are capped (no pagination), and availability is computed per tool, which would not scale.
- Reminders repeat daily with no cap.
- A tool with an active loan cannot be deleted, not even by an admin.
- n8n's duplicate store uses workflow static data, and the alert channel is Discord.

These and the production changes are covered in [`docs/production-notes.md`](docs/production-notes.md).

## How this was built

I built this with AI assistance (Claude), as the assignment allows. I designed the permission model and data model first, wrote the decisions down in `docs/decisions.md`, and tested the security and failure behavior on purpose, including the failure paths.

## Repository layout

```
convex/            schema, queries, mutations, HTTP endpoints, notification outbox
  lib/             auth helpers, loan rules, HMAC and signature verification
src/app/           Next.js routes ((app) group is the signed-in area)
src/components/    UI, split by area (layout, ui, tools, loans, reviews, admin, landing)
n8n/               docker-compose.yml, .env.example, workflows/ (exported JSON)
scripts/           test and verification scripts
docs/              decisions.md, production-notes.md
```
