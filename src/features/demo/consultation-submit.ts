/**
 * The browser's side of a consultation request: post it to /api/consultation and turn the answer into one of four
 * outcomes the form can show. The form never sees HTTP, so the endpoint (or a CRM behind it) can change freely.
 *
 * "sent" means the server confirmed that the delivery provider accepted the request. Anything unexpected (network
 * failure, timeout, an answer that is not ours) is "failed", never "sent".
 */

import type { ConsultationErrors } from "@/domain/consultation";

export const CONSULTATION_ENDPOINT = "/api/consultation";
const TIMEOUT_MS = 20_000;

export type ConsultationPayload = {
  service: string;
  name: string;
  reach: string;
  asset: string;
  message: string;
  source: string;
  locale: string;
  /** The spam trap (CONSULTATION_TRAP_FIELD); empty for people. */
  [trap: string]: string;
};

export type SubmitOutcome =
  | { kind: "sent"; reference: string }
  | { kind: "invalid"; fields: ConsultationErrors }
  | { kind: "limited" }
  | { kind: "failed" };

export async function submitConsultation(payload: ConsultationPayload, options: { endpoint?: string; fetch?: typeof fetch } = {}): Promise<SubmitOutcome> {
  const send = options.fetch ?? fetch;
  let response: Response;
  try {
    response = await send(options.endpoint ?? CONSULTATION_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
      credentials: "same-origin",
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    return { kind: "failed" };
  }
  const body = (await response.json().catch(() => null)) as { ok?: unknown; reference?: unknown; error?: unknown; fields?: unknown } | null;
  if (response.ok && body?.ok === true && typeof body.reference === "string") return { kind: "sent", reference: body.reference };
  if (response.status === 429) return { kind: "limited" };
  if (response.status === 400 && body?.error === "invalid" && typeof body.fields === "object" && body.fields !== null) {
    return { kind: "invalid", fields: body.fields as ConsultationErrors };
  }
  return { kind: "failed" };
}
