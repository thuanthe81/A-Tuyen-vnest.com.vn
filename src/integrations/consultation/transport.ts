/**
 * An email transport: one message out, one honest answer back. Implementations: Resend (HTTP API, ./resend.ts) and the
 * development mock (./mock.ts). To use another provider or authenticated SMTP, add a file here that implements
 * `EmailTransport` and select it in src/server/services.ts; nothing else changes.
 */

import type { ConsultationDeliveryResult } from "@/domain/consultation";
import type { EmailMessage } from "./compose-email";

export type TransportResult =
  | { ok: true; providerId?: string }
  | { ok: false; reason: Extract<ConsultationDeliveryResult, { ok: false }>["reason"]; detail?: string };

export interface EmailTransport {
  readonly provider: string;
  /** Resolves (never rejects). `ok: true` only when the provider accepted the message. */
  send(message: EmailMessage, options: { idempotencyKey: string }): Promise<TransportResult>;
}
