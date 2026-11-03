import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";

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
  handler: async (ctx, a) => {
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
  },
});
