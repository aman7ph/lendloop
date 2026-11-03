import { v } from "convex/values";
import {
  internalMutation,
  internalQuery,
  MutationCtx,
} from "./_generated/server";
import { Id } from "./_generated/dataModel";

const DAY_MS = 24 * 60 * 60 * 1000;

type EventFields = {
  loanId: Id<"loans">;
  kind: "notify" | "reminder";
  event: string;
  key: string;
  status: "sent" | "failed";
  attempts: number;
  error?: string;
};

async function upsertEvent(ctx: MutationCtx, a: EventFields) {
  const existing = await ctx.db
    .query("automationEvents")
    .withIndex("by_key", (q) => q.eq("idempotencyKey", a.key))
    .unique();
  if (existing?.status === "sent") return;

  const fields = {
    loanId: a.loanId,
    kind: a.kind,
    event: a.event,
    status: a.status,
    attempts: a.attempts,
    at: Date.now(),
    idempotencyKey: a.key,
    lastError: a.error,
  };
  if (existing) await ctx.db.patch(existing._id, fields);
  else await ctx.db.insert("automationEvents", fields);
}

/** Has this event already been delivered? (idempotency check) */
export const isSent = internalQuery({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    const row = await ctx.db
      .query("automationEvents")
      .withIndex("by_key", (q) => q.eq("idempotencyKey", key))
      .unique();
    return row?.status === "sent";
  },
});

export const record = internalMutation({
  args: {
    loanId: v.id("loans"),
    kind: v.union(v.literal("notify"), v.literal("reminder")),
    event: v.string(),
    key: v.string(),
    status: v.union(v.literal("sent"), v.literal("failed")),
    attempts: v.number(),
    error: v.optional(v.string()),
  },
  handler: async (ctx, a) => upsertEvent(ctx, a),
});

/** Overdue loans that have not been reminded today. Minimal fields only. */
export const overdueForReminders = internalQuery({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const date = new Date(now).toISOString().slice(0, 10); // UTC day
    const loans = await ctx.db
      .query("loans")
      .withIndex("by_status_end", (q) =>
        q.eq("status", "approved").lt("endDate", now),
      )
      .take(200);

    const out = [];
    for (const loan of loans) {
      const key = `${loan._id}:reminder:${date}`;
      const done = await ctx.db
        .query("automationEvents")
        .withIndex("by_key", (q) => q.eq("idempotencyKey", key))
        .unique();
      if (done?.status === "sent") continue;

      const [borrower, lender] = await Promise.all([
        ctx.db.get(loan.borrowerId),
        ctx.db.get(loan.lenderId),
      ]);
      if (!borrower || !lender) continue;

      out.push({
        loanId: loan._id,
        date,
        borrowerName: borrower.name,
        lenderName: lender.name,
        toolName: loan.toolName,
        endDate: loan.endDate,
        daysOverdue: Math.max(1, Math.floor((now - loan.endDate) / DAY_MS)),
      });
    }
    return out;
  },
});

export const recordReminderResult = internalMutation({
  args: {
    loanId: v.string(),
    date: v.string(),
    status: v.string(),
    attempts: v.number(),
    error: v.optional(v.string()),
  },
  handler: async (ctx, a) => {
    const loanId = ctx.db.normalizeId("loans", a.loanId);
    if (!loanId) return { ok: false as const, error: "invalid_loan" };
    if (!/^\d{4}-\d{2}-\d{2}$/.test(a.date)) {
      return { ok: false as const, error: "invalid_date" };
    }
    const age = Math.abs(Date.now() - Date.parse(`${a.date}T00:00:00Z`));
    if (!(age < 2 * DAY_MS))
      return { ok: false as const, error: "invalid_date" };
    if (a.status !== "sent" && a.status !== "failed") {
      return { ok: false as const, error: "invalid_status" };
    }
    if (!Number.isInteger(a.attempts) || a.attempts < 1 || a.attempts > 10) {
      return { ok: false as const, error: "invalid_attempts" };
    }
    if (!(await ctx.db.get(loanId))) {
      return { ok: false as const, error: "not_found" };
    }

    await upsertEvent(ctx, {
      loanId,
      kind: "reminder",
      event: "overdue",
      key: `${loanId}:reminder:${a.date}`,
      status: a.status,
      attempts: a.attempts,
      error: a.error?.slice(0, 300),
    });
    return { ok: true as const };
  },
});
