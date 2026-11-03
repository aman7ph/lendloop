import { v } from "convex/values";
import { env, internalAction, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { notifyEvent } from "./lib/events";
import { hmacHex } from "./lib/hmac";

const MAX_ATTEMPTS = 4;
const BACKOFF_MS = [30_000, 120_000, 600_000];
const REQUEST_TIMEOUT_MS = 10_000;

export const buildPayload = internalQuery({
  args: { loanId: v.id("loans"), event: notifyEvent, key: v.string() },
  handler: async (ctx, { loanId, event, key }) => {
    const loan = await ctx.db.get(loanId);
    if (!loan) return null;
    const [borrower, lender] = await Promise.all([
      ctx.db.get(loan.borrowerId),
      ctx.db.get(loan.lenderId),
    ]);
    if (!borrower || !lender) return null;

    const toLender = event === "created" || event === "cancelled";
    const [recipient, other] = toLender
      ? [lender, borrower]
      : [borrower, lender];

    return {
      version: 1,
      event,
      idempotencyKey: key,
      recipientName: recipient.name,
      otherName: other.name,
      toolName: loan.toolName,
      startDate: loan.startDate,
      endDate: loan.endDate,
    };
  },
});

export const send = internalAction({
  args: {
    loanId: v.id("loans"),
    event: notifyEvent,
    attempt: v.optional(v.number()),
  },
  handler: async (ctx, { loanId, event, attempt = 1 }): Promise<void> => {
    const key = `${loanId}:notify:${event}`;
    if (await ctx.runQuery(internal.automation.isSent, { key })) return;

    const payload = await ctx.runQuery(internal.notify.buildPayload, {
      loanId,
      event,
      key,
    });
    if (!payload) return;

    const record = (status: "sent" | "failed", error?: string) =>
      ctx.runMutation(internal.automation.record, {
        loanId,
        kind: "notify",
        event,
        key,
        status,
        attempts: attempt,
        error,
      });

    const url = env.N8N_WEBHOOK_URL;
    const secret = env.N8N_WEBHOOK_SECRET;
    if (!url || !secret) {
      await record(
        "failed",
        "N8N_WEBHOOK_URL or N8N_WEBHOOK_SECRET is not set",
      );
      return;
    }

    const body = JSON.stringify(payload);
    const timestamp = String(Date.now());
    const signature = await hmacHex(secret, `${timestamp}.${body}`);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    let error = "";
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-LendLoop-Timestamp": timestamp,
          "X-LendLoop-Signature": `sha256=${signature}`,
          "X-LendLoop-Idempotency-Key": key,
        },
        body,
        signal: controller.signal,
      });
      if (!res.ok) error = `HTTP ${res.status}`;
    } catch (e) {
      error = e instanceof Error ? e.message : "network error";
    } finally {
      clearTimeout(timer);
    }

    await record(error ? "failed" : "sent", error || undefined);

    if (error && attempt < MAX_ATTEMPTS) {
      await ctx.scheduler.runAfter(
        BACKOFF_MS[attempt - 1],
        internal.notify.send,
        {
          loanId,
          event,
          attempt: attempt + 1,
        },
      );
    }
  },
});
