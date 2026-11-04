import { v } from "convex/values";
import { mutation, query, QueryCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { requireUser } from "./lib/auth";
import { findCategory, normalizeCategoryName } from "./lib/categories";
import { DEFAULT_MAX_LOAN_DAYS, MAX_ALLOWED_LOAN_DAYS } from "./lib/loanRules";

const MAX_IMAGES = 3;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const toolFields = {
  name: v.string(),
  category: v.string(),
  condition: v.string(),
  description: v.string(),
  maxLoanDays: v.optional(v.number()),
  imageIds: v.optional(v.array(v.id("_storage"))),
};

async function validateImages(ctx: QueryCtx, ids: Id<"_storage">[]) {
  if (ids.length > MAX_IMAGES) throw new Error("TOO_MANY_IMAGES");
  if (new Set(ids).size !== ids.length) throw new Error("DUPLICATE_IMAGE");
  for (const id of ids) {
    const meta = await ctx.db.system.get(id);
    if (!meta) throw new Error("INVALID_IMAGE");
    if (!meta.contentType || !ALLOWED_TYPES.includes(meta.contentType)) {
      throw new Error("INVALID_IMAGE_TYPE");
    }
    if (meta.size > MAX_IMAGE_BYTES) throw new Error("IMAGE_TOO_LARGE");
  }
}

async function imageUrls(ctx: QueryCtx, ids: Id<"_storage">[] | undefined) {
  const urls = await Promise.all(
    (ids ?? []).map((id) => ctx.storage.getUrl(id)),
  );
  return urls.filter((u): u is string => u !== null);
}

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

// export const listPublic = query({
//   args: {},
//   handler: async (ctx) => {
//     const now = Date.now();
//     const tools = await ctx.db.query("tools").take(100);
//     return await Promise.all(
//       tools.map(async (t) => ({
//         name: t.name,
//         category: t.category,
//         available: !(await isOnLoan(ctx, t._id, now)),
//       })),
//     );
//   },
// });

export const listPublic = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const tools = await ctx.db.query("tools").take(100);
    const out = [];
    for (const t of tools) {
      if (!(await isOnLoan(ctx, t._id, now))) {
        out.push({ name: t.name, category: t.category }); // explicit projection
      }
    }
    return out;
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
          ownerId: t.ownerId,
          ownerImageUrl: owner?.imageUrl ?? null,
          ownerTrusted: owner?.trustedLender ?? false,
          ownerRating: owner?.lenderRatingCount
            ? Math.round(
                ((owner.lenderRatingSum ?? 0) / owner.lenderRatingCount) * 10,
              ) / 10
            : null,
          ownerRatingCount: owner?.lenderRatingCount ?? 0,
          maxLoanDays: t.maxLoanDays ?? DEFAULT_MAX_LOAN_DAYS,
          imageUrls: await imageUrls(ctx, t.imageIds),
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
        imageIds: t.imageIds ?? [],
        imageUrls: await imageUrls(ctx, t.imageIds),
      })),
    );
  },
});

export const create = mutation({
  args: toolFields,
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const { imageIds, ...rest } = args;
    const data = await cleanToolInput(ctx, rest);
    if (imageIds) await validateImages(ctx, imageIds);
    return await ctx.db.insert("tools", {
      ownerId: user._id, // D4
      ...data,
      imageIds: imageIds ?? [],
    });
  },
});

export const update = mutation({
  args: { toolId: v.id("tools"), ...toolFields },
  handler: async (ctx, { toolId, imageIds, ...fields }) => {
    const user = await requireUser(ctx);
    const tool = await ctx.db.get(toolId);
    if (!tool) throw new Error("NOT_FOUND");
    if (tool.ownerId !== user._id) throw new Error("FORBIDDEN");

    const patch: Record<string, unknown> = await cleanToolInput(ctx, fields);

    if (imageIds !== undefined) {
      await validateImages(ctx, imageIds);
      patch.imageIds = imageIds;
      const removed = (tool.imageIds ?? []).filter(
        (id) => !imageIds.includes(id),
      );
      for (const id of removed) await ctx.storage.delete(id);
    }
    await ctx.db.patch(toolId, patch);
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
    for (const id of tool.imageIds ?? []) await ctx.storage.delete(id);
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireUser(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});
