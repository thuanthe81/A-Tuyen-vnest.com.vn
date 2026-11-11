/**
 * Resend transport (https://resend.com/docs/api-reference/emails/send-email), over plain fetch: no SDK, no dependency.
 *
 * Server-only. The API key comes from src/config/env.ts and is sent only to Resend's endpoint. Logs and results carry the
 * HTTP status and Resend's error name, never the message, its addresses or the key.
 *
 * Before it can deliver, the sender's domain must be verified in Resend (DKIM records on vnest.com.vn, or a subdomain):
 * docs/handoff/BACKEND-HANDOFF.md §11.3.
 */

import type { EmailTransport, TransportResult } from "./transport";

export const RESEND_ENDPOINT = "https://api.resend.com/emails";

export interface ResendOptions {
  apiKey: string;
  timeoutMs: number;
  /** Injected in tests; the global fetch otherwise. */
  fetch?: typeof fetch;
  endpoint?: string;
}

/** Resend error names are snake_case words; anything else is reduced to that alphabet before it reaches a log. */
const errorName = (value: unknown): string => (typeof value === "string" ? value.replace(/[^a-z_]/gi, "").slice(0, 60) || "unknown" : "unknown");

export function createResendTransport(options: ResendOptions): EmailTransport {
  const send = options.fetch ?? fetch;
  const endpoint = options.endpoint ?? RESEND_ENDPOINT;
  return {
    provider: "resend",
    async send(message, { idempotencyKey }): Promise<TransportResult> {
      let response: Response;
      try {
        response = await send(endpoint, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${options.apiKey}`,
            "Content-Type": "application/json",
            "Idempotency-Key": idempotencyKey,
          },
          body: JSON.stringify({
            from: message.from,
            to: [message.to],
            subject: message.subject,
            text: message.text,
            html: message.html,
            ...(message.replyTo ? { reply_to: message.replyTo } : {}),
          }),
          signal: AbortSignal.timeout(options.timeoutMs),
          cache: "no-store",
        });
      } catch (error) {
        const name = error instanceof Error ? error.name : "Error";
        return name === "TimeoutError" || name === "AbortError" ? { ok: false, reason: "timeout", detail: name } : { ok: false, reason: "unavailable", detail: errorName(name) };
      }

      const body = (await response.json().catch(() => ({}))) as { id?: unknown; name?: unknown };
      if (response.ok) return { ok: true, ...(typeof body.id === "string" ? { providerId: body.id.slice(0, 80) } : {}) };
      const detail = `status=${response.status} error=${errorName(body.name)}`;
      if (response.status === 401 || response.status === 403) return { ok: false, reason: "misconfigured", detail };
      if (response.status === 429 || response.status >= 500) return { ok: false, reason: "unavailable", detail };
      return { ok: false, reason: "rejected", detail };
    },
  };
}
