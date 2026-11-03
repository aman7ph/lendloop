import { env } from "../_generated/server";
import { hmacHex, safeEqual, SIGNATURE_MAX_AGE_MS } from "./hmac";

export async function verifyAutomationRequest(
  request: Request,
  rawBody: string,
) {
  const timestamp = request.headers.get("x-lendloop-timestamp") ?? "";
  const signature = request.headers.get("x-lendloop-signature") ?? "";
  if (!/^\d+$/.test(timestamp) || !signature.startsWith("sha256="))
    return false;
  if (Math.abs(Date.now() - Number(timestamp)) > SIGNATURE_MAX_AGE_MS)
    return false;

  const path = new URL(request.url).pathname;
  const expected = await hmacHex(
    env.AUTOMATION_API_SECRET,
    `${timestamp}.${request.method}.${path}.${rawBody}`,
  );
  return safeEqual(expected, signature.slice("sha256=".length));
}
