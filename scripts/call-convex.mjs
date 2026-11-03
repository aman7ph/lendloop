import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";

const argv = process.argv.slice(2);
const command = argv[0];
const flag = (name) =>
  argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
const has = (name) => argv.includes(`--${name}`);

const site = flag("site");
if (!site || !["overdue", "result"].includes(command ?? "")) {
  console.error(
    "usage: node scripts/call-convex.mjs <overdue|result> --site=https://<name>.convex.site " +
      "[--loan=<id> --date=YYYY-MM-DD --status=sent|failed] [--stale] [--tamper]",
  );
  process.exit(1);
}

function loadSecret() {
  const text = readFileSync(new URL("../n8n/.env", import.meta.url), "utf8");
  const line = text
    .split(/\r?\n/)
    .find((l) => l.startsWith("AUTOMATION_API_SECRET="));
  if (!line) throw new Error("AUTOMATION_API_SECRET not found in n8n/.env");
  return line.slice("AUTOMATION_API_SECRET=".length).trim();
}

const method = command === "overdue" ? "GET" : "POST";
const path =
  command === "overdue" ? "/automation/overdue" : "/automation/reminder-result";
let body =
  command === "overdue"
    ? ""
    : JSON.stringify({
        loanId: flag("loan"),
        date: flag("date"),
        status: flag("status") ?? "sent",
        attempts: 1,
      });

const timestamp = String(Date.now() - (has("stale") ? 10 * 60 * 1000 : 0));
const signature = createHmac("sha256", loadSecret())
  .update(`${timestamp}.${method}.${path}.${body}`)
  .digest("hex");

if (has("tamper") && body) body = body.replace('"attempts":1', '"attempts":2');

const res = await fetch(site + path, {
  method,
  headers: {
    "Content-Type": "application/json",
    "X-LendLoop-Timestamp": timestamp,
    "X-LendLoop-Signature": `sha256=${signature}`,
  },
  body: method === "GET" ? undefined : body,
});
console.log(res.status, await res.text());
