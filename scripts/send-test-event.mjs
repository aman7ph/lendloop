import { createHmac, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";

const flags = new Set(process.argv.slice(2));
const urlArg = process.argv.find((a) => a.startsWith("--url="));
const url = urlArg
  ? urlArg.slice("--url=".length)
  : "http://localhost:5678/webhook-test/lendloop-events";

function loadSecret() {
  const text = readFileSync(new URL("../n8n/.env", import.meta.url), "utf8");
  const line = text
    .split(/\r?\n/)
    .find((l) => l.startsWith("N8N_WEBHOOK_SECRET="));
  if (!line) throw new Error("N8N_WEBHOOK_SECRET not found in n8n/.env");
  return line.slice("N8N_WEBHOOK_SECRET=".length).trim();
}
const keyArg = process.argv.find((a) => a.startsWith("--key="));
const eventArg = process.argv.find((a) => a.startsWith("--event="));
const payload = {
  version: 1,
  event: eventArg ? eventArg.slice("--event=".length) : "approved",
  idempotencyKey: keyArg
    ? keyArg.slice("--key=".length)
    : `test:notify:approved:${randomUUID()}`,
  recipientName: "Test Borrower",
  otherName: "Test Lender",
  toolName: "Cordless drill",
  startDate: Date.now() + 3_600_000,
  endDate: Date.now() + 7_200_000,
};

let body = JSON.stringify(payload);
const timestamp = String(
  Date.now() - (flags.has("--stale") ? 10 * 60 * 1000 : 0),
);
const signature = createHmac("sha256", loadSecret())
  .update(`${timestamp}.${body}`)
  .digest("hex");

if (flags.has("--tamper"))
  body = body.replace("Cordless drill", "Expensive laptop");

const res = await fetch(url, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-LendLoop-Timestamp": timestamp,
    "X-LendLoop-Signature": `sha256=${signature}`,
    "X-LendLoop-Idempotency-Key": payload.idempotencyKey,
  },
  body,
});
console.log(res.status, await res.text());
