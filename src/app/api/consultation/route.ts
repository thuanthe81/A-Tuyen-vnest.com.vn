import { env } from "@/config/env";
import { CONSULTATION_MAX_BODY_BYTES } from "@/domain/consultation";
import { getConsultation } from "@/server/services";

/**
 * POST /api/consultation — the consultation form's only way out (body: JSON, see src/domain/consultation.ts).
 *
 * Every check lives in src/server/consultation.ts; this file only reads the request. Answers are never cached or indexed.
 * `?mock=sent|failed|slow` picks a simulated outcome and is ignored unless CONSULTATION_DELIVERY=mock (development only).
 *
 * Replies: 200 { ok, reference } once the provider accepted the request · 400 invalid / rejected · 403 cross-site ·
 * 413 too large · 415 not JSON · 429 rate limited · 502 delivery failed · 503 delivery disabled.
 */

const HEADERS = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" } as const;

/** The body as text, read no further than the limit (a missing or false Content-Length cannot make it read more). */
async function readCapped(request: Request, limit: number): Promise<string | undefined> {
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) {
      await reader.cancel();
      return undefined;
    }
    chunks.push(value);
  }
  return new TextDecoder().decode(Buffer.concat(chunks));
}

/** The first address in X-Forwarded-For, as the hosting platform's proxy sets it; X-Real-IP otherwise. */
function clientAddress(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip")?.trim() || "unknown";
}

export async function POST(request: Request) {
  const headers = request.headers;
  const declared = Number(headers.get("content-length") ?? "0");
  const body = declared > CONSULTATION_MAX_BODY_BYTES ? undefined : await readCapped(request, CONSULTATION_MAX_BODY_BYTES);
  if (body === undefined) return Response.json({ ok: false, error: "too-large" }, { status: 413, headers: HEADERS });

  const allowedHosts = [headers.get("host"), headers.get("x-forwarded-host"), env.siteUrl.host].filter((host): host is string => Boolean(host));
  const outcome = await getConsultation().handle({
    body,
    contentType: headers.get("content-type"),
    origin: headers.get("origin"),
    fetchSite: headers.get("sec-fetch-site"),
    allowedHosts,
    clientAddress: clientAddress(headers),
    mockOutcome: new URL(request.url).searchParams.get("mock"),
  });
  return Response.json(outcome.body, { status: outcome.status, headers: HEADERS });
}
