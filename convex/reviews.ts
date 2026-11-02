import { v } from "convex/values";
import { mutation, MutationCtx, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { requireUser } from "./lib/auth";

const MAX_COMMENT = 500;

async function applyRating(
  ctx: MutationCtx,
  userId: Id<"users">,
  role: "lender" | "borrower",
  rating: number,
  sign: 1 | -1,
) {
  const u = await ctx.db.get(userId);
  if (!u) return;
  if (role === "lender") {
    await ctx.db.patch(userId, {
      lenderRatingSum: Math.max(0, (u.lenderRatingSum ?? 0) + sign * rating),
      lenderRatingCount: Math.max(0, (u.lenderRatingCount ?? 0) + sign),
    });
  } else {
    await ctx.db.patch(userId, {
      borrowerRatingSum: Math.max(
        0,
        (u.borrowerRatingSum ?? 0) + sign * rating,
      ),
      borrowerRatingCount: Math.max(0, (u.borrowerRatingCount ?? 0) + sign),
    });
  }
}

const avg = (sum?: number, count?: number) =>
  count ? Math.round(((sum ?? 0) / count) * 10) / 10 : null;

export const create = mutation({
  args: { loanId: v.id("loans"), rating: v.number(), comment: v.string() },
  handler: async (ctx, { loanId, rating, comment }) => {
    const user = await requireUser(ctx);
    const loan = await ctx.db.get(loanId);
    if (!loan) throw new Error("NOT_FOUND");

    const isLender = loan.lenderId === user._id;
    const isBorrower = loan.borrowerId === user._id;
    if (!isLender && !isBorrower) throw new Error("FORBIDDEN");
    if (loan.status !== "returned") throw new Error("LOAN_NOT_COMPLETED");

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new Error("INVALID_RATING");
    }
    const clean = comment.trim();
    if (clean.length > MAX_COMMENT) throw new Error("INVALID_COMMENT");

    const existing = await ctx.db
      .query("reviews")
      .withIndex("by_loan_reviewer", (q) =>
        q.eq("loanId", loanId).eq("reviewerId", user._id),
      )
      .unique();
    if (existing) throw new Error("ALREADY_REVIEWED");

    const revieweeId = isLender ? loan.borrowerId : loan.lenderId;
    const revieweeRole = isLender ? "borrower" : "lender";

    await ctx.db.insert("reviews", {
      loanId,
      reviewerId: user._id,
      revieweeId,
      revieweeRole,
      rating,
      comment: clean,
      toolName: loan.toolName,
    });
    await applyRating(ctx, revieweeId, revieweeRole, rating, 1);
  },
});

export const remove = mutation({
  args: { reviewId: v.id("reviews") },
  handler: async (ctx, { reviewId }) => {
    const user = await requireUser(ctx);
    const review = await ctx.db.get(reviewId);
    if (!review) throw new Error("NOT_FOUND");
    if (review.reviewerId !== user._id && user.role !== "admin") {
      throw new Error("FORBIDDEN");
    }
    await applyRating(
      ctx,
      review.revieweeId,
      review.revieweeRole,
      review.rating,
      -1,
    );
    await ctx.db.delete(reviewId);
  },
});

export const reviewable = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const [asBorrower, asLender] = await Promise.all([
      ctx.db
        .query("loans")
        .withIndex("by_borrower", (q) => q.eq("borrowerId", user._id))
        .order("desc")
        .take(100),
      ctx.db
        .query("loans")
        .withIndex("by_lender", (q) => q.eq("lenderId", user._id))
        .order("desc")
        .take(100),
    ]);

    const out = [];
    for (const l of [...asBorrower, ...asLender].filter(
      (x) => x.status === "returned",
    )) {
      const mine = await ctx.db
        .query("reviews")
        .withIndex("by_loan_reviewer", (q) =>
          q.eq("loanId", l._id).eq("reviewerId", user._id),
        )
        .unique();
      if (mine) continue;
      const iAmLender = l.lenderId === user._id;
      const other = await ctx.db.get(iAmLender ? l.borrowerId : l.lenderId);
      out.push({
        loanId: l._id,
        toolName: l.toolName,
        otherName: other?.name ?? "Unknown",
        reviewingRole: iAmLender ? ("borrower" as const) : ("lender" as const),
      });
    }
    return out;
  },
});

export const forLoan = query({
  args: { loanId: v.id("loans") },
  handler: async (ctx, { loanId }) => {
    const user = await requireUser(ctx);
    const loan = await ctx.db.get(loanId);
    if (!loan) throw new Error("NOT_FOUND");
    if (
      loan.lenderId !== user._id &&
      loan.borrowerId !== user._id &&
      user.role !== "admin"
    ) {
      throw new Error("FORBIDDEN");
    }
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_loan_reviewer", (q) => q.eq("loanId", loanId))
      .collect();
    return await Promise.all(
      reviews.map(async (r) => ({
        id: r._id,
        reviewerName: (await ctx.db.get(r.reviewerId))?.name ?? "Unknown",
        revieweeRole: r.revieweeRole,
        rating: r.rating,
        comment: r.comment,
        mine: r.reviewerId === user._id,
      })),
    );
  },
});

export const profile = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    await requireUser(ctx);
    const u = await ctx.db.get(userId);
    if (!u) return null;

    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_reviewee", (q) => q.eq("revieweeId", userId))
      .order("desc")
      .take(50);

    return {
      name: u.name,
      imageUrl: u.imageUrl ?? null,
      trustedLender: u.trustedLender,
      lender: {
        average: avg(u.lenderRatingSum, u.lenderRatingCount),
        count: u.lenderRatingCount ?? 0,
      },
      borrower: {
        average: avg(u.borrowerRatingSum, u.borrowerRatingCount),
        count: u.borrowerRatingCount ?? 0,
      },
      reviews: await Promise.all(
        reviews.map(async (r) => ({
          id: r._id,
          reviewerName: (await ctx.db.get(r.reviewerId))?.name ?? "Unknown",
          revieweeRole: r.revieweeRole,
          rating: r.rating,
          comment: r.comment,
          toolName: r.toolName,
          at: r._creationTime,
        })),
      ),
    };
  },
});
