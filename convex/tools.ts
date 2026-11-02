import { v } from "convex/values";
import { mutation, query, QueryCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { requireUser } from "./lib/auth";
import { findCategory, normalizeCategoryName } from "./lib/categories";
import { DEFAULT_MAX_LOAN_DAYS, MAX_ALLOWED_LOAN_DAYS } from "./lib/loanRules";

const toolFields = {
  name: v.string(),
  category: v.string(),
  condition: v.string(),
  description: v.string(),
  maxLoanDays: v.optional(v.number()),
};

async function isOnLoan(ctx: QueryCtx, toolId: Id<"tools">, now: number) {
  const loans = await ctx.db
    .query("loans")
    .withIndex("by_tool", (q) => q.eq("toolId", toolId))
    .collect();
  return loans.some((l) => l.status === "approved" && l.startDate <= now);
}

async function cleanToolInput(
  ctx: QueryCtx,
  input: {
    name: string;
    category: string;
    condition: string;
    description: string;
    maxLoanDays?: number;
  },
) {
  const name = input.name.trim();
  const condition = input.condition.trim();
  const description = input.description.trim();
  const category = normalizeCategoryName(input.category);
  const maxLoanDays = input.maxLoanDays ?? DEFAULT_MAX_LOAN_DAYS;

  if (name.length < 2 || name.length > 80) throw new Error("INVALID_NAME");
  if (condition.length < 2 || condition.length > 60)
    throw new Error("INVALID_CONDITION");
  if (description.length > 500) throw new Error("INVALID_DESCRIPTION");
  if (!(await findCategory(ctx, category))) throw new Error("INVALID_CATEGORY");
  if (
    !Number.isInteger(maxLoanDays) ||
    maxLoanDays < 1 ||
    maxLoanDays > MAX_ALLOWED_LOAN_DAYS
  ) {
    throw new Error("INVALID_MAX_LOAN_DAYS");
  }

  return { name, category, condition, description, maxLoanDays };
}

export const listPublic = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const tools = await ctx.db.query("tools").take(100);
    return await Promise.all(
      tools.map(async (t) => ({
        name: t.name,
        category: t.category,
        available: !(await isOnLoan(ctx, t._id, now)),
      })),
    );
  },
});

export const list = query({
  args: { category: v.optional(v.string()) },
  handler: async (ctx, { category }) => {
    const user = await requireUser(ctx);
    const now = Date.now();

    const tools = category
      ? await ctx.db
          .query("tools")
          .withIndex("by_category", (q) => q.eq("category", category))
          .take(200)
      : await ctx.db.query("tools").take(200);

    return await Promise.all(
      tools.map(async (t) => {
        const owner = await ctx.db.get(t.ownerId);
        return {
          id: t._id,
          name: t.name,
          category: t.category,
          condition: t.condition,
          description: t.description,
          available: !(await isOnLoan(ctx, t._id, now)),
          isMine: t.ownerId === user._id,
          ownerName: owner?.name ?? "Unknown",
          ownerTrusted: owner?.trustedLender ?? false,
          maxLoanDays: t.maxLoanDays ?? DEFAULT_MAX_LOAN_DAYS,
        };
      }),
    );
  },
});

export const mine = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const now = Date.now();
    const tools = await ctx.db
      .query("tools")
      .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
      .collect();

    return await Promise.all(
      tools.map(async (t) => ({
        id: t._id,
        name: t.name,
        category: t.category,
        condition: t.condition,
        description: t.description,
        available: !(await isOnLoan(ctx, t._id, now)),
        maxLoanDays: t.maxLoanDays ?? DEFAULT_MAX_LOAN_DAYS,
      })),
    );
  },
});

export const create = mutation({
  args: toolFields,
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const data = await cleanToolInput(ctx, args);
    return await ctx.db.insert("tools", { ownerId: user._id, ...data });
  },
});

export const update = mutation({
  args: { toolId: v.id("tools"), ...toolFields },
  handler: async (ctx, { toolId, ...fields }) => {
    const user = await requireUser(ctx);
    const tool = await ctx.db.get(toolId);
    if (!tool) throw new Error("NOT_FOUND");
    if (tool.ownerId !== user._id) throw new Error("FORBIDDEN");
    await ctx.db.patch(toolId, await cleanToolInput(ctx, fields));
  },
});

export const remove = mutation({
  args: { toolId: v.id("tools") },
  handler: async (ctx, { toolId }) => {
    const user = await requireUser(ctx);
    const tool = await ctx.db.get(toolId);
    if (!tool) throw new Error("NOT_FOUND");
    if (tool.ownerId !== user._id && user.role !== "admin") {
      throw new Error("FORBIDDEN");
    }

    const loans = await ctx.db
      .query("loans")
      .withIndex("by_tool", (q) => q.eq("toolId", toolId))
      .collect();
    if (loans.some((l) => l.status === "pending" || l.status === "approved")) {
      throw new Error("TOOL_HAS_ACTIVE_LOAN");
    }

    await ctx.db.delete(toolId);
  },
});
