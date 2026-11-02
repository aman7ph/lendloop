import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { requireAdmin } from "./lib/auth";
import {
  DEFAULT_CATEGORIES,
  findCategory,
  normalizeCategoryName,
} from "./lib/categories";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("categories").take(100);
    return rows.map((c) => c.name).sort();
  },
});

export const create = mutation({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    const admin = await requireAdmin(ctx);
    const clean = normalizeCategoryName(name);
    if (await findCategory(ctx, clean)) return clean;
    await ctx.db.insert("categories", { name: clean, createdBy: admin._id });
    return clean;
  },
});

export const remove = mutation({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    await requireAdmin(ctx);
    const clean = normalizeCategoryName(name);
    const category = await findCategory(ctx, clean);
    if (!category) throw new Error("NOT_FOUND");

    const inUse = await ctx.db
      .query("tools")
      .withIndex("by_category", (q) => q.eq("category", clean))
      .first();
    if (inUse) throw new Error("CATEGORY_IN_USE");

    await ctx.db.delete(category._id);
  },
});

export const seedDefaults = internalMutation({
  args: {},
  handler: async (ctx) => {
    for (const name of DEFAULT_CATEGORIES) {
      if (!(await findCategory(ctx, name))) {
        await ctx.db.insert("categories", { name });
      }
    }
  },
});
