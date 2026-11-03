import { v } from "convex/values";

export const notifyEvent = v.union(
  v.literal("created"),
  v.literal("approved"),
  v.literal("declined"),
  v.literal("auto_declined"),
  v.literal("cancelled"),
  v.literal("returned"),
);
