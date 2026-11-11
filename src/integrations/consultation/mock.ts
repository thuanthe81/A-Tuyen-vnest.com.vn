/**
 * Development mock transport: nothing leaves the machine. src/config/env.ts refuses CONSULTATION_DELIVERY=mock outside a
 * development deployment, so a simulated "sent" never reaches a real visitor; the form also labels it as simulated.
 *
 *   sent    accepted after `latencyMs`
 *   failed  refused, as a provider outage would be (to see the failure state)
 *   slow    accepted after 2.5 s (to see "Đang gửi...")
 *
 * The last few messages are kept in memory only (`outbox`), for tests; nothing is written to disk or to the log.
 */

import type { EmailMessage } from "./compose-email";
import type { EmailTransport, TransportResult } from "./transport";

export const MOCK_CONSULTATION_OUTCOMES = ["sent", "failed", "slow"] as const;
export type MockConsultationOutcome = (typeof MOCK_CONSULTATION_OUTCOMES)[number];

export const isMockConsultationOutcome = (value: unknown): value is MockConsultationOutcome =>
  typeof value === "string" && (MOCK_CONSULTATION_OUTCOMES as readonly string[]).includes(value);

const OUTBOX_SIZE = 20;

export interface MockTransport extends EmailTransport {
  readonly outbox: readonly { message: EmailMessage; idempotencyKey: string }[];
}

export function createMockTransport(options: { outcome?: MockConsultationOutcome; latencyMs?: number } = {}): MockTransport {
  const outbox: { message: EmailMessage; idempotencyKey: string }[] = [];
  const outcome = options.outcome ?? "sent";
  const wait = (ms: number) => (ms > 0 ? new Promise<void>((resolve) => setTimeout(resolve, ms)) : Promise.resolve());
  return {
    provider: "mock",
    outbox,
    async send(message, { idempotencyKey }): Promise<TransportResult> {
      await wait(outcome === "slow" ? 2500 : (options.latencyMs ?? 0));
      if (outcome === "failed") return { ok: false, reason: "unavailable", detail: "mock-failure" };
      outbox.push({ message, idempotencyKey });
      if (outbox.length > OUTBOX_SIZE) outbox.shift();
      return { ok: true, providerId: `mock-${outbox.length}` };
    },
  };
}
