/**
 * The email implementation of the ConsultationSink port: compose the message, hand it to a transport, report what the
 * transport said. A CRM sink would implement the same port (src/domain/consultation.ts).
 */

import type { ConsultationSink } from "@/domain/consultation";
import { composeConsultationEmail, type ComposeOptions } from "./compose-email";
import type { EmailTransport } from "./transport";

export interface EmailSinkOptions extends ComposeOptions {
  transport: EmailTransport;
  /** Server configuration only (CONSULTATION_RECIPIENT, default hello@vnest.com.vn). */
  recipient: string;
  /** A sender on a domain the provider has verified (CONSULTATION_SENDER). */
  sender: string;
}

export function createEmailSink(options: EmailSinkOptions): ConsultationSink {
  const { transport, recipient, sender, ...compose } = options;
  return {
    provider: transport.provider,
    async deliver(record, { idempotencyKey }) {
      const message = composeConsultationEmail(record, { to: recipient, from: sender }, compose);
      const result = await transport.send(message, { idempotencyKey });
      return result.ok
        ? { ok: true, provider: transport.provider, ...(result.providerId ? { providerId: result.providerId } : {}) }
        : { ok: false, provider: transport.provider, reason: result.reason, ...(result.detail ? { detail: result.detail } : {}) };
    },
  };
}
