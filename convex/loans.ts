import { v } from "convex/values";
import { mutation, query, QueryCtx } from "./_generated/server";
import { Doc } from "./_generated/dataModel";
import { requireAdmin, requireUser } from "./lib/auth";
import {
  DAY_MS,
  DEFAULT_MAX_LOAN_DAYS,
  START_GRACE_MS,
  overlaps,
} from "./lib/loanRules";

async function toView(ctx: QueryCtx, loan: Doc<"loans">, now: number) {
  const [borrower, lender] = await Promise.all([
    ctx.db.get(loan.borrowerId),
    ctx.db.get(loan.lenderId),
  ]);
  return {
    id: loan._id,
    toolName: loan.toolName,
    status: loan.status,
    startDate: loan.startDate,
    endDate: loan.endDate,
    returnedAt: loan.returnedAt,
    declineReason: loan.declineReason,
    overdue: loan.status === "approved" && loan.endDate < now,
    expired: loan.status === "pending" && loan.endDate < now,
    borrowerName: borrower?.name ?? "Unknown",
    lenderName: lender?.name ?? "Unknown",
    lenderTrusted: lender?.trustedLender ?? false,
    borrowerId: loan.borrowerId,
    lenderId: loan.lenderId,
  };
}

async function loansForTool(ctx: QueryCtx, toolId: Doc<"tools">["_id"]) {
  return await ctx.db
    .query("loans")
    .withIndex("by_tool", (q) => q.eq("toolId", toolId))
    .collect();
}

export const request = mutation({
  args: { toolId: v.id("tools"), startDate: v.number(), endDate: v.number() },
  handler: async (ctx, { toolId, startDate, endDate }) => {
    const user = await requireUser(ctx);
    const now = Date.now();

    if (!Number.isFinite(startDate) || !Number.isFinite(endDate)) {
      throw new Error("INVALID_DATES");
    }
    const tool = await ctx.db.get(toolId);
    if (!tool) throw new Error("NOT_FOUND");
    if (tool.ownerId === user._id) throw new Error("CANNOT_BORROW_OWN_TOOL");

    if (startDate < now - START_GRACE_MS) throw new Error("START_IN_PAST");
    if (endDate <= startDate) throw new Error("END_MUST_BE_AFTER_START");

    const maxDays = tool.maxLoanDays ?? DEFAULT_MAX_LOAN_DAYS;
    if (endDate - startDate > maxDays * DAY_MS) {
      throw new Error("EXCEEDS_MAX_LOAN_LENGTH");
    }

    const loans = await loansForTool(ctx, toolId);
    const window = { startDate, endDate };
    if (loans.some((l) => l.status === "approved" && overlaps(l, window))) {
      throw new Error("DATES_UNAVAILABLE");
    }
    if (
      loans.some((l) => l.status === "pending" && l.borrowerId === user._id)
    ) {
      throw new Error("ALREADY_REQUESTED");
    }

    return await ctx.db.insert("loans", {
      toolId,
      toolName: tool.name,
      borrowerId: user._id,
      lenderId: tool.ownerId,
      startDate,
      endDate,
      status: "pending",
    });
  },
});

export const approve = mutation({
  args: { loanId: v.id("loans") },
  handler: async (ctx, { loanId }) => {
    const user = await requireUser(ctx);
    const loan = await ctx.db.get(loanId);
    if (!loan) throw new Error("NOT_FOUND");
    if (loan.lenderId !== user._id) throw new Error("FORBIDDEN"); // D1
    if (loan.status !== "pending") throw new Error("INVALID_STATUS");
    if (loan.endDate <= Date.now()) throw new Error("REQUEST_EXPIRED");

    const others = (await loansForTool(ctx, loan.toolId)).filter(
      (l) => l._id !== loan._id,
    );

    if (others.some((l) => l.status === "approved" && overlaps(l, loan))) {
      throw new Error("DATES_UNAVAILABLE");
    }

    await ctx.db.patch(loanId, { status: "approved" });

    const autoDeclined: string[] = [];
    for (const other of others) {
      if (other.status === "pending" && overlaps(other, loan)) {
        await ctx.db.patch(other._id, {
          status: "declined",
          declineReason: "auto_overlap",
        });
        autoDeclined.push(other._id);
      }
    }
    return { autoDeclined };
  },
});

export const decline = mutation({
  args: { loanId: v.id("loans") },
  handler: async (ctx, { loanId }) => {
    const user = await requireUser(ctx);
    const loan = await ctx.db.get(loanId);
    if (!loan) throw new Error("NOT_FOUND");
    if (loan.lenderId !== user._id) throw new Error("FORBIDDEN");
    if (loan.status !== "pending") throw new Error("INVALID_STATUS");
    await ctx.db.patch(loanId, { status: "declined", declineReason: "lender" });
  },
});
export const cancel = mutation({
  args: { loanId: v.id("loans") },
  handler: async (ctx, { loanId }) => {
    const user = await requireUser(ctx);
    const loan = await ctx.db.get(loanId);
    if (!loan) throw new Error("NOT_FOUND");
    if (loan.borrowerId !== user._id) throw new Error("FORBIDDEN");
    if (loan.status !== "pending") throw new Error("INVALID_STATUS");
    await ctx.db.patch(loanId, { status: "cancelled" });
  },
});
export const markReturned = mutation({
  args: { loanId: v.id("loans") },
  handler: async (ctx, { loanId }) => {
    const user = await requireUser(ctx);
    const loan = await ctx.db.get(loanId);
    if (!loan) throw new Error("NOT_FOUND");
    if (loan.lenderId !== user._id && user.role !== "admin") {
      throw new Error("FORBIDDEN");
    }
    if (loan.status !== "approved") throw new Error("INVALID_STATUS");
    await ctx.db.patch(loanId, { status: "returned", returnedAt: Date.now() });
  },
});

export const myRequests = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const now = Date.now();
    const loans = await ctx.db
      .query("loans")
      .withIndex("by_borrower", (q) => q.eq("borrowerId", user._id))
      .order("desc")
      .take(100);
    return await Promise.all(loans.map((l) => toView(ctx, l, now)));
  },
});

export const incoming = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const now = Date.now();
    const loans = await ctx.db
      .query("loans")
      .withIndex("by_lender", (q) => q.eq("lenderId", user._id))
      .order("desc")
      .take(100);
    return await Promise.all(loans.map((l) => toView(ctx, l, now)));
  },
});

export const allLoans = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const now = Date.now();
    const loans = await ctx.db.query("loans").order("desc").take(200);
    return await Promise.all(loans.map((l) => toView(ctx, l, now)));
  },
});
