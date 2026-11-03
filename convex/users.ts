import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin, requireUser } from "./lib/auth";

export const store = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("UNAUTHENTICATED");

    const name = identity.name ?? identity.email ?? "Neighbor";
    const email = identity.email ?? "";
    const imageUrl = identity.pictureUrl;

    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (existing) {
      if (
        existing.name !== name ||
        existing.email !== email ||
        existing.imageUrl !== imageUrl
      ) {
        await ctx.db.patch(existing._id, { name, email, imageUrl });
      }

      return existing._id;
    }

    return await ctx.db.insert("users", {
      clerkId: identity.subject,
      name,
      email,
      role: "user",
      trustedLender: false,
    });
  },
});

export const me = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) return null;

    return {
      id: user._id,
      name: user.name,
      role: user.role,
      trustedLender: user.trustedLender,
    };
  },
});

export const listForAdmin = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const users = await ctx.db.query("users").take(200);
    return users.map((u) => ({
      id: u._id,
      name: u.name,
      imageUrl: u.imageUrl ?? null,
      role: u.role,
      trustedLender: u.trustedLender,
    }));
  },
});

export const setTrusted = mutation({
  args: { userId: v.id("users"), trusted: v.boolean() },
  handler: async (ctx, { userId, trusted }) => {
    await requireAdmin(ctx);
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("NOT_FOUND");
    await ctx.db.patch(userId, { trustedLender: trusted });
  },
});
