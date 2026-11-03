import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { verifyAutomationRequest } from "./lib/verifyAutomation";

const http = httpRouter();

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

http.route({
  path: "/automation/overdue",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    if (!(await verifyAutomationRequest(request, ""))) {
      return json({ error: "unauthorized" }, 401);
    }
    const loans = await ctx.runQuery(
      internal.automation.overdueForReminders,
      {},
    );
    return json({ loans });
  }),
});

http.route({
  path: "/automation/reminder-result",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const raw = await request.text();
    if (!(await verifyAutomationRequest(request, raw))) {
      return json({ error: "unauthorized" }, 401);
    }

    let body: Record<string, unknown>;
    try {
      body = JSON.parse(raw);
    } catch {
      return json({ error: "invalid_json" }, 400);
    }

    const result = await ctx.runMutation(
      internal.automation.recordReminderResult,
      {
        loanId: String(body.loanId ?? ""),
        date: String(body.date ?? ""),
        status: String(body.status ?? ""),
        attempts: Number(body.attempts),
        error: body.error === undefined ? undefined : String(body.error),
      },
    );
    return result.ok
      ? json({ status: "recorded" })
      : json({ error: result.error }, 400);
  }),
});

export default http;
