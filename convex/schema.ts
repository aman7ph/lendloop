import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("user")),
    trustedLender: v.boolean(),
  }).index("by_clerk", ["clerkId"]),

  tools: defineTable({
    ownerId: v.id("users"),
    name: v.string(),
    category: v.string(),
    condition: v.string(),
    description: v.string(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_category", ["category"]),

  loans: defineTable({
    toolId: v.id("tools"),
    toolName: v.string(),
    borrowerId: v.id("users"),
    lenderId: v.id("users"),
    startDate: v.number(),
    endDate: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("declined"),
      v.literal("returned"),
    ),
    returnedAt: v.optional(v.number()),
  })
    .index("by_borrower", ["borrowerId"])
    .index("by_lender", ["lenderId"])
    .index("by_tool", ["toolId"])
    .index("by_status_end", ["status", "endDate"]),

  automationEvents: defineTable({
    loanId: v.id("loans"),
    kind: v.union(v.literal("notify"), v.literal("reminder")),
    status: v.union(v.literal("sent"), v.literal("failed")),
    attempts: v.number(),
    at: v.number(),
    idempotencyKey: v.string(), // D9
  })
    .index("by_key", ["idempotencyKey"])
    .index("by_loan", ["loanId"]),
});
