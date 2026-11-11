/**
 * CONSULTATION REQUESTS: the shape, the rules and the delivery port, shared by the browser form and the server.
 *
 * The browser runs `validateConsultation` for instant feedback; the server runs it again on whatever arrives, because
 * anything sent to /api/consultation can be forged. Errors are codes, never sentences: the form turns them into its own
 * Vietnamese or English copy (features/demo/contact-copy.ts).
 *
 * Delivery goes through `ConsultationSink`, so the form and the endpoint never know whether a request becomes an email,
 * a CRM record or both (src/server/services.ts decides; docs/handoff/BACKEND-HANDOFF.md, "Consultation requests").
 *
 * Pure TypeScript with no imports outside src/domain (ESLint), so it runs in the browser, on the server and in plain Node.
 */

/** The four choices of "Dịch vụ quan tâm". Must match SERVICES in features/demo/owner-journey.ts plus "chua-ro" (tested). */
export const CONSULTATION_SERVICES = ["van-hanh", "tu-van-mo-hinh", "nhuong-quyen", "chua-ro"] as const;
export type ConsultationService = (typeof CONSULTATION_SERVICES)[number];

/**
 * What a page tells the form about delivery: "off" (not active: the form says so and sends nothing), "mock" (local
 * development simulation, labelled as such) or "live" (a real provider is configured on the server).
 */
export type ConsultationMode = "off" | "mock" | "live";

export const CONSULTATION_LOCALES = ["vi", "en"] as const;
export type ConsultationLocale = (typeof CONSULTATION_LOCALES)[number];

/**
 * Length limits, in characters after trimming. Generous for people, small enough that a request is never a payload.
 * 254 is the longest valid email address (RFC 5321 path limit).
 */
export const CONSULTATION_LIMITS = {
  name: { min: 2, max: 100 },
  reach: { max: 254 },
  asset: { max: 120 },
  message: { max: 2000 },
  source: { max: 120 },
} as const;

/**
 * The spam trap: a field people never see or fill (hidden from view, from the keyboard and from assistive technology).
 * A request that fills it is refused. A neutral name, so password managers and autofill leave it alone.
 */
export const CONSULTATION_TRAP_FIELD = "vnx_hp";

/** Sizes the endpoint refuses before parsing: the JSON of a maximal request is well under 16 KB. */
export const CONSULTATION_MAX_BODY_BYTES = 16_384;

export type ConsultationField = "service" | "name" | "reach" | "asset" | "message";
export type ConsultationErrorCode = "required" | "invalid" | "too-long";
export type ConsultationErrors = Partial<Record<ConsultationField, ConsultationErrorCode>>;

export type ContactReach = { kind: "email"; value: string } | { kind: "phone"; value: string; digits: string };

/** A request that passed every rule: clean, trimmed strings only. */
export interface ConsultationRequest {
  service: ConsultationService;
  name: string;
  reach: ContactReach;
  /** Empty when not given. */
  asset: string;
  /** Empty when not given. Line breaks kept (normalised to \n). */
  message: string;
  /** The page path the form was sent from, e.g. "/dev/demo" (never a query or a full URL). */
  source: string;
  locale: ConsultationLocale;
}

/**
 * A plain address only: letters, digits and . _ + ' - before the @, no display name, quoting, spaces, % ? = or line
 * breaks, so an address the visitor typed can be used as Reply-To or in a mailto link without adding anything of its own.
 */
const EMAIL = /^[A-Za-z0-9_+'-]+(?:\.[A-Za-z0-9_+'-]+)*@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)*\.[A-Za-z]{2,}$/;
/** Vietnamese numbers (0 or +84, then 9–10 digits) or any E.164 number; spaces, dots, dashes and brackets ignored. */
const PHONE = /^(?:(?:\+?84|0)\d{9,10}|\+[1-9]\d{7,14})$/;
/** Characters a phone number may be written with, besides digits and a leading +. */
const PHONE_SEPARATORS = /[\s.\-()]/g;
/** C0/C1 control characters (line breaks included), DEL, and the Unicode line/paragraph separators. */
const CONTROL = /[\u0000-\u001f\u007f-\u009f\u2028\u2029]/g;
/** The same, but keeping \n (multi-line message). */
const CONTROL_EXCEPT_NEWLINE = /[\u0000-\u0009\u000b-\u001f\u007f-\u009f\u2028\u2029]/g;
/** Zero-width and bidirectional-override characters: invisible, and used to disguise text. */
const INVISIBLE = /[\u200b-\u200f\u202a-\u202e\u2060-\u2064\u2066-\u206f\ufeff]/g;
const SOURCE = /^\/[A-Za-z0-9\-/]*$/;

/** A plain email address as the form accepts it (also used to check configured addresses). */
export const isEmailAddress = (value: string): boolean => value.length <= CONSULTATION_LIMITS.reach.max && EMAIL.test(value);

/** One line of text: NFC, no control or invisible characters, runs of spaces collapsed, trimmed. */
export function cleanLine(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.normalize("NFC").replace(INVISIBLE, "").replace(CONTROL, " ").replace(/\s+/g, " ").trim();
}

/** Multi-line text: as cleanLine, but line breaks are kept (at most two in a row) and each line is trimmed. */
export function cleanText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value
    .normalize("NFC")
    .replace(/\r\n?/g, "\n")
    .replace(INVISIBLE, "")
    .replace(CONTROL_EXCEPT_NEWLINE, " ")
    .split("\n")
    .map((line) => line.replace(/[^\S\n]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** A phone number or an email address, recognised; undefined when it is neither. */
export function parseReach(value: string): ContactReach | undefined {
  const reach = value.trim();
  if (isEmailAddress(reach)) return { kind: "email", value: reach };
  const digits = reach.replace(PHONE_SEPARATORS, "");
  if (PHONE.test(digits)) return { kind: "phone", value: reach, digits };
  return undefined;
}

export const isConsultationService = (value: unknown): value is ConsultationService =>
  typeof value === "string" && (CONSULTATION_SERVICES as readonly string[]).includes(value);

/** The two required contact fields only: what the form checks as the visitor types and submits. */
export function contactErrors(input: { name: unknown; reach: unknown }): Pick<ConsultationErrors, "name" | "reach"> {
  const errors: Pick<ConsultationErrors, "name" | "reach"> = {};
  const name = cleanLine(input.name);
  if (name.length < CONSULTATION_LIMITS.name.min) errors.name = "required";
  else if (name.length > CONSULTATION_LIMITS.name.max) errors.name = "too-long";
  const reach = cleanLine(input.reach);
  if (!reach) errors.reach = "required";
  else if (reach.length > CONSULTATION_LIMITS.reach.max) errors.reach = "too-long";
  else if (!parseReach(reach)) errors.reach = "invalid";
  return errors;
}

export type ConsultationValidation = { ok: true; request: ConsultationRequest } | { ok: false; errors: ConsultationErrors };

/**
 * Every rule, on untrusted input (a parsed JSON body or a FormData snapshot). Unknown keys are ignored. An unknown or
 * missing language falls back to Vietnamese and an unusable source path to "unknown": neither is the visitor's mistake,
 * so neither blocks a request.
 */
export function validateConsultation(input: unknown): ConsultationValidation {
  const raw = (typeof input === "object" && input !== null ? input : {}) as Record<string, unknown>;
  const errors: ConsultationErrors = { ...contactErrors({ name: raw.name, reach: raw.reach }) };

  if (raw.service === undefined || raw.service === null || raw.service === "") errors.service = "required";
  else if (!isConsultationService(raw.service)) errors.service = "invalid";

  const asset = cleanLine(raw.asset);
  if (asset.length > CONSULTATION_LIMITS.asset.max) errors.asset = "too-long";
  const message = cleanText(raw.message);
  if (message.length > CONSULTATION_LIMITS.message.max) errors.message = "too-long";

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  const sourceText = cleanLine(raw.source);
  const source = sourceText.length <= CONSULTATION_LIMITS.source.max && SOURCE.test(sourceText) ? sourceText : "unknown";
  const locale = raw.locale === "en" ? "en" : "vi";
  return {
    ok: true,
    request: {
      service: raw.service as ConsultationService,
      name: cleanLine(raw.name),
      reach: parseReach(cleanLine(raw.reach)) as ContactReach,
      asset,
      message,
      source,
      locale,
    },
  };
}

/** A validated request with what the server adds: when it arrived and a short reference for support. */
export interface ConsultationRecord extends ConsultationRequest {
  receivedAt: Date;
  /** Random, not derived from personal data; safe to log and to quote in the email. */
  reference: string;
}

export type ConsultationDeliveryResult =
  | { ok: true; provider: string; providerId?: string }
  | { ok: false; provider: string; reason: "rejected" | "unavailable" | "timeout" | "misconfigured"; detail?: string };

/**
 * Where a validated request goes. The email sink is the first implementation; a CRM sink (or one that does both) can
 * replace it in src/server/services.ts without touching the form or the endpoint.
 *
 * `ok: true` must mean the destination ACCEPTED the request (an email provider answered 2xx), never "queued locally".
 * `detail` is for logs: never put personal data in it.
 */
export interface ConsultationSink {
  readonly provider: string;
  deliver(record: ConsultationRecord, options: { idempotencyKey: string }): Promise<ConsultationDeliveryResult>;
}
