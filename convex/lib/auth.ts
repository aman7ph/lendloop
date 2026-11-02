import { use } from "react";
import { QueryCtx, MutationCtx } from "../_generated/server";

type Ctx = QueryCtx | MutationCtx;

export async function requireUser(ctx: Ctx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("UNAUTHENTICATED");

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk", (q) => q.eq("clerkId", identity.subject))
    .unique();

  if (!user) throw new Error("UNAUTHENTICATED");

  return user;
}

export async function requireAdmin(ctx: Ctx) {
  const user = await requireUser(ctx);
  if (user.role !== "admin") throw new Error("FORBIDDEN");
  return user;
}
