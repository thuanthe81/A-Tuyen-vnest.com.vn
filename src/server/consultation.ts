/**
 * The consultation submission behind POST /api/consultation, kept free of Next.js so it can be tested.
 *
 * Order of checks (cheapest and least revealing first): delivery switched on → request shape (JSON, size) → same-origin →
 * rate limit → spam trap → validation → duplicate → delivery. Success is reported only when the sink says the destination
 * accepted the request. Nothing personal is logged: lines carry the reference, the provider and codes only.
 */

import { createHash, randomBytes } from "node:crypto";
import {
  CONSULTATION_MAX_BODY_BYTES,
  CONSULTATION_TRAP_FIELD,
  validateConsultation,
  type ConsultationErrors,
  type ConsultationMode,
  type ConsultationRequest,
  type ConsultationSink,
} from "@/domain/consultation";
import { createRateLimiter, type Window } from "./rate-limit";

export type { ConsultationMode } from "@/domain/consultation";

export type ConsultationReply =
  | { ok: true; reference: string }
  | { ok: false; error: "invalid"; fields: ConsultationErrors }
  | { ok: false; error: "bad-request" | "forbidden" | "too-large" | "unsupported" | "rate-limited" | "rejected" | "delivery-failed" | "delivery-disabled" };

export type ConsultationOutcome = { status: 200 | 400 | 403 | 413 | 415 | 429 | 502 | 503; body: ConsultationReply };

export interface ConsultationInput {
  /** The raw request body. */
  body: string;
  contentType: string | null;
  /** The request's Origin header, if any. */
  origin: string | null;
  /** The Sec-Fetch-Site header, if any. */
  fetchSite: string | null;
  /** Hosts an Origin may name: the request's own host (and forwarded host) and SITE_URL's. */
  allowedHosts: readonly string[];
  /** The client's address as the platform reports it; hashed before use, never stored or logged. */
  clientAddress: string;
  /** `?mock=` on the request: honoured only when the mock is the configured delivery. */
  mockOutcome?: string | null;
}

export interface ConsultationDeps {
  mode: ConsultationMode;
  /** The sink for this request; with the mock, `mockOutcome` may pick a scenario. Undefined when delivery is off. */
  sink: (mockOutcome?: string | null) => ConsultationSink | undefined;
  rateLimits: { perClient: readonly Window[]; global: readonly Window[] };
  duplicateWindowMs: number;
  now?: () => Date;
  log?: (level: "info" | "warn", line: string) => void;
}

export interface ConsultationHandler {
  handle(input: ConsultationInput): Promise<ConsultationOutcome>;
}

const reply = (status: ConsultationOutcome["status"], body: ConsultationReply): ConsultationOutcome => ({ status, body });

/** "VN-3F9A2C1B": random, short enough to read out on the phone. */
const newReference = () => `VN-${randomBytes(4).toString("hex").toUpperCase()}`;

function hostOf(origin: string): string | undefined {
  try {
    return new URL(origin).host.toLowerCase();
  } catch {
    return undefined;
  }
}

/**
 * A browser request from another site is refused. Browsers send Origin with every cross-site POST (and JSON forces a
 * preflight this route never approves); when it is absent, Sec-Fetch-Site still tells. A request with neither (curl, a
 * server) is let through to the other checks: the rate limit and validation still apply.
 */
function sameOrigin(input: ConsultationInput): boolean {
  if (input.origin) {
    const host = hostOf(input.origin);
    return host !== undefined && input.allowedHosts.some((allowed) => allowed.toLowerCase() === host);
  }
  return !input.fetchSite || input.fetchSite === "same-origin" || input.fetchSite === "none";
}

export function createConsultationHandler(deps: ConsultationDeps): ConsultationHandler {
  const now = deps.now ?? (() => new Date());
  const log = deps.log ?? ((level, line) => (level === "warn" ? console.warn(line) : console.info(line)));
  // A salt drawn at start-up: hashes of client addresses and of requests mean nothing outside this process.
  const salt = randomBytes(16).toString("hex");
  const hash = (value: string) => createHash("sha256").update(salt).update(value).digest("hex");
  const perClient = createRateLimiter(deps.rateLimits.perClient);
  const global = createRateLimiter(deps.rateLimits.global);
  const recent = new Map<string, { expires: number; outcome: Promise<ConsultationOutcome> }>();

  const fingerprint = (r: ConsultationRequest) =>
    hash([r.service, r.name.toLowerCase(), r.reach.value.toLowerCase(), r.asset.toLowerCase(), r.message].join("\u0000"));

  async function deliver(sink: ConsultationSink, request: ConsultationRequest): Promise<ConsultationOutcome> {
    const reference = newReference();
    const result = await sink.deliver({ ...request, receivedAt: now(), reference }, { idempotencyKey: `vnest-consultation-${reference}` });
    if (result.ok) {
      log("info", `[consultation] sent ref=${reference} provider=${result.provider}${result.providerId ? ` id=${result.providerId}` : ""}`);
      return reply(200, { ok: true, reference });
    }
    log("warn", `[consultation] delivery failed ref=${reference} provider=${result.provider} reason=${result.reason}${result.detail ? ` ${result.detail}` : ""}`);
    return reply(502, { ok: false, error: "delivery-failed" });
  }

  return {
    async handle(input) {
      const sink = deps.mode === "off" ? undefined : deps.sink(deps.mode === "mock" ? input.mockOutcome : undefined);
      if (!sink) return reply(503, { ok: false, error: "delivery-disabled" });

      if (!/^application\/json(\s*;|$)/i.test(input.contentType ?? "")) return reply(415, { ok: false, error: "unsupported" });
      if (Buffer.byteLength(input.body, "utf8") > CONSULTATION_MAX_BODY_BYTES) return reply(413, { ok: false, error: "too-large" });
      if (!sameOrigin(input)) {
        log("warn", "[consultation] refused: cross-site request");
        return reply(403, { ok: false, error: "forbidden" });
      }

      const at = now().getTime();
      const clientOk = perClient.hit(hash(input.clientAddress || "unknown"), at);
      const globalOk = global.hit("all", at);
      if (!clientOk || !globalOk) {
        log("warn", `[consultation] refused: rate limit (${clientOk ? "server" : "client"})`);
        return reply(429, { ok: false, error: "rate-limited" });
      }

      let data: unknown;
      try {
        data = JSON.parse(input.body);
      } catch {
        return reply(400, { ok: false, error: "bad-request" });
      }
      if (typeof data !== "object" || data === null || Array.isArray(data)) return reply(400, { ok: false, error: "bad-request" });

      const trap = (data as Record<string, unknown>)[CONSULTATION_TRAP_FIELD];
      if (typeof trap === "string" ? trap.trim() !== "" : trap !== undefined && trap !== null) {
        // Refused, not faked: if a person ever triggers this, they see the failure message and VNest's email address.
        log("warn", "[consultation] refused: spam trap filled");
        return reply(400, { ok: false, error: "rejected" });
      }

      const checked = validateConsultation(data);
      if (!checked.ok) return reply(400, { ok: false, error: "invalid", fields: checked.errors });

      for (const [key, entry] of recent) if (entry.expires <= at) recent.delete(key);
      const key = fingerprint(checked.request);
      const earlier = recent.get(key);
      if (earlier) {
        // The same request again (a double click, a second tab, a resend after success): answer as the first one did,
        // without sending it twice. A failed first attempt is forgotten below, so a retry after a failure does send.
        log("info", "[consultation] duplicate not re-sent");
        return earlier.outcome;
      }
      const outcome = deliver(sink, checked.request).catch((): ConsultationOutcome => {
        log("warn", "[consultation] delivery failed: unexpected error");
        return reply(502, { ok: false, error: "delivery-failed" });
      });
      recent.set(key, { expires: at + deps.duplicateWindowMs, outcome });
      const settled = await outcome;
      if (!settled.body.ok) recent.delete(key);
      return settled;
    },
  };
}
