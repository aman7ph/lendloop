import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("user")),
    trustedLender: v.boolean(),
    imageUrl: v.optional(v.string()),
    lenderRatingCount: v.optional(v.number()),
    lenderRatingSum: v.optional(v.number()),
    borrowerRatingCount: v.optional(v.number()),
    borrowerRatingSum: v.optional(v.number()),
  }).index("by_clerk", ["clerkId"]),

  tools: defineTable({
    ownerId: v.id("users"),
    name: v.string(),
    category: v.string(),
    condition: v.string(),
    description: v.string(),
    maxLoanDays: v.optional(v.number()),
    imageIds: v.optional(v.array(v.id("_storage"))),
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
    declineReason: v.optional(
      v.union(v.literal("lender"), v.literal("auto_overlap")),
    ),
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

  categories: defineTable({
    name: v.string(),
    createdBy: v.optional(v.id("users")),
  }).index("by_name", ["name"]),
  reviews: defineTable({
    loanId: v.id("loans"),
    reviewerId: v.id("users"),
    revieweeId: v.id("users"),
    revieweeRole: v.union(v.literal("lender"), v.literal("borrower")),
    rating: v.number(),
    comment: v.string(),
    toolName: v.string(),
  })
    .index("by_loan_reviewer", ["loanId", "reviewerId"])
    .index("by_reviewee", ["revieweeId"]),
});
