/**
 * Consultation requests: fixed settings. Server-side values that change per deployment (delivery mode, credentials,
 * sender) are read in src/config/env.ts; this file holds what does not.
 */

/** Confirmed by the owner on 10/11/2026 as the address that receives consultation requests. */
export const CONSULTATION_RECIPIENT_DEFAULT = "hello@vnest.com.vn";

export const consultation = {
  /** Shown in the email ("10/11/2026, 14:32 (GMT+7)"): VNest works in Vietnam time. */
  timeZone: "Asia/Ho_Chi_Minh",
  timeZoneLabel: "GMT+7, giờ Việt Nam",
  /** How long the server waits for the email provider before reporting a failure. */
  providerTimeoutMs: 10_000,
  /**
   * Abuse limits, per client address (hashed, kept in memory only) and for the whole server. Generous for a person,
   * tight for a script. In-memory: each server instance counts on its own (BACKEND-HANDOFF.md §11.6).
   */
  rateLimits: {
    perClient: [
      { windowMs: 10 * 60_000, max: 5 },
      { windowMs: 24 * 60 * 60_000, max: 20 },
    ],
    global: [{ windowMs: 60 * 60_000, max: 100 }],
  },
  /** The same request (same service, name, contact, property type and message) sent again within this time is not re-sent. */
  duplicateWindowMs: 10 * 60_000,
  /** Labels for the source pages the email names. Any other path is shown as it is. */
  sourcePages: {
    "/": "Trang chủ",
    "/dev/demo": "Trang chủ (bản xem trước)",
    "/hop-tac": "Trang Hợp tác",
    "/dev/demo/hop-tac": "Trang Hợp tác (bản xem trước)",
  } as Readonly<Record<string, string>>,
} as const;
