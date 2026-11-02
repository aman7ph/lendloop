import { QueryCtx } from "../_generated/server";

export const DEFAULT_CATEGORIES = [
  "power tools",
  "garden",
  "kitchen",
  "camping",
  "cleaning",
  "other",
];

export function normalizeCategoryName(raw: string) {
  const name = raw.trim().toLowerCase().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 30) throw new Error("INVALID_CATEGORY");
  return name;
}

export async function findCategory(ctx: QueryCtx, name: string) {
  return await ctx.db
    .query("categories")
    .withIndex("by_name", (q) => q.eq("name", name))
    .unique();
}
