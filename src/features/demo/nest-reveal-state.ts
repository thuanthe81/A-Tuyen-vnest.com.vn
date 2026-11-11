export type NestRevealVariant = "draw" | "converge";
export type NestRevealAction = "play" | "static-reduced-motion" | "skip";
export type NestRevealPhase =
  | "checking"
  | "beginning"
  | "forming"
  | "brand-reveal"
  | "dissolving"
  | "complete";

/**
 * Default selected variation after comparing Variation A (Nest Draw) and
 * Variation B (Nest Converge) in live browser preview.
 * Both remain selectable via `?intro=draw` and `?intro=converge`.
 */
export const DEFAULT_NEST_REVEAL_VARIANT: NestRevealVariant = "converge";

/**
 * Total animation timeline durations (in milliseconds).
 * Designed around the 0.9s–1.3s sweet spot so the entrance feels calm,
 * intentional, and editorial without ever delaying interaction unnecessarily.
 */
export const NEST_REVEAL_TIMING = {
  /** Phase 1 -> 3 total play duration before seamless dissolve begins (ms) */
  revealMs: 920,
  /** Phase 4 soft dissolve duration (ms) */
  dissolveMs: 280,
  /** Total sequence duration (~1.20s) */
  totalMs: 1200,
  /** Brief static hold when prefers-reduced-motion is enabled (ms) */
  reducedMotionHoldMs: 180,
  /** Soft fade when prefers-reduced-motion is enabled (ms) */
  reducedMotionDissolveMs: 180,
} as const;

/**
 * WHEN THE INTRO PLAYS (owner brief, Phase D final fixes, 10/11/2026): once per document, on the homepage.
 *
 * - Every full load of the homepage plays it: first visit, refresh, hard reload. Nothing is kept across loads (the
 *   former once-per-browser-session flag kept in browser storage is gone).
 * - Inside one document it plays at most once, so React re-renders, client-side navigation, Back / Forward and the
 *   VI / EN switch (a soft navigation) never replay it. This flag lives in module memory: a new document starts at false.
 * - It plays only when the homepage is the page the document was loaded on; arriving at the homepage by a client-side
 *   link from another page does not start it. A forced `?intro=draw|converge` still plays on that path (preview tool).
 * - `?intro=0` (or off / false) skips it; prefers-reduced-motion gets the short static version.
 */
let playedInThisDocument = false;

export function introPlayedInThisDocument(): boolean {
  return playedInThisDocument;
}

export function markIntroPlayedInThisDocument(): void {
  playedInThisDocument = true;
}

export function resetDocumentIntroForTests(): void {
  playedInThisDocument = false;
}

/** Whether `pathname` is the page this document was loaded on (`entryUrl`: the navigation entry's URL). */
export function isDocumentEntry(pathname: string, entryUrl: string | undefined): boolean {
  if (!entryUrl) return true;
  try {
    return normalizePathname(new URL(entryUrl, "http://vnest.local").pathname) === normalizePathname(pathname);
  } catch {
    return true;
  }
}

export function normalizePathname(pathname: string): string {
  if (!pathname) return "/";
  const stripped = pathname.split("?")[0]?.split("#")[0] ?? "/";
  if (stripped.length > 1 && stripped.endsWith("/")) {
    return stripped.slice(0, -1);
  }
  return stripped;
}

/**
 * Returns true only for the VNest V3 homepage route (`/dev/demo`).
 * Explicitly excludes property detail pages (`/dev/stays/*`), booking steps
 * (`/dev/demo/tim-phong`, `/dev/demo/dat-phong`), and other utility routes.
 */
export function isHomepageRoute(pathname: string): boolean {
  return normalizePathname(pathname) === "/dev/demo";
}

/**
 * Parses optional `?intro=` query parameter for comparing variations in browser preview:
 * - `?intro=draw` -> forces Variation A (Nest Draw)
 * - `?intro=converge` -> forces Variation B (Nest Converge)
 * - `?intro=0` or `?intro=off` -> forces skip
 */
export function parseNestRevealVariantOverride(
  search: string,
): NestRevealVariant | "off" | null {
  if (!search) return null;
  const raw = search.startsWith("?") ? search.slice(1) : search;
  const params = new URLSearchParams(raw);
  const value = params.get("intro")?.trim().toLowerCase();
  if (value === "draw") return "draw";
  if (value === "converge") return "converge";
  if (value === "0" || value === "off" || value === "false") return "off";
  return null;
}

/**
 * The phase the server renders (and hydration starts from):
 * - `?intro=0` / `off` / `false` starts at `"complete"` (nothing rendered).
 * - Anything else starts at `"beginning"`: a full load always plays, so the overlay is in the server HTML and covers the
 *   page from the first paint (no flash of the homepage before the intro). Its CSS ends it at ~1.2 s even before
 *   hydration. When the client decides to skip (a client-side arrival), it does so in `useLayoutEffect`, before paint.
 */
export function resolveInitialNestRevealPhase(
  initialIntroParam?: string,
): NestRevealPhase {
  const normalized = initialIntroParam?.trim().toLowerCase();
  if (normalized === "draw" || normalized === "converge") {
    return "beginning";
  }
  if (normalized === "0" || normalized === "off" || normalized === "false") {
    return "complete";
  }
  return "beginning";
}

export interface NestRevealDecisionInput {
  pathname: string;
  search?: string;
  /** Already played in this document (module memory): never twice per load. */
  alreadyPlayedInDocument: boolean;
  /** The homepage is the page this document was loaded on (not a client-side arrival). */
  documentEntry: boolean;
  prefersReducedMotion: boolean;
  defaultVariant?: NestRevealVariant;
}

export interface NestRevealDecision {
  action: NestRevealAction;
  variant: NestRevealVariant;
  shouldMarkSeen: boolean;
}

export function resolveNestRevealDecision(
  input: NestRevealDecisionInput,
): NestRevealDecision {
  const defaultVariant = input.defaultVariant ?? DEFAULT_NEST_REVEAL_VARIANT;
  const override = parseNestRevealVariantOverride(input.search ?? "");
  const variant: NestRevealVariant =
    override === "draw" || override === "converge" ? override : defaultVariant;

  if (!isHomepageRoute(input.pathname)) {
    return { action: "skip", variant, shouldMarkSeen: false };
  }

  if (override === "off") {
    return { action: "skip", variant, shouldMarkSeen: false };
  }

  if (input.alreadyPlayedInDocument) {
    return { action: "skip", variant, shouldMarkSeen: false };
  }

  if (!input.documentEntry && override === null) {
    return { action: "skip", variant, shouldMarkSeen: false };
  }

  if (input.prefersReducedMotion) {
    return {
      action: "static-reduced-motion",
      variant,
      shouldMarkSeen: true,
    };
  }

  return {
    action: "play",
    variant,
    shouldMarkSeen: true,
  };
}
