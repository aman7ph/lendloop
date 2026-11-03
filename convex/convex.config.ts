import { defineApp } from "convex/server";
import { v } from "convex/values";

const app = defineApp({
  env: {
    N8N_WEBHOOK_SECRET: v.string(),
    AUTOMATION_API_SECRET: v.string(),
    N8N_WEBHOOK_URL: v.optional(v.string()),
  },
});

export default app;
