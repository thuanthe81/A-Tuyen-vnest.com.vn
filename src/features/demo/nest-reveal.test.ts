import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  VNEST_DESCRIPTOR_PATHS,
  VNEST_LOCKUP_VIEWBOX,
  VNEST_NEST_RINGS,
  VNEST_SYMBOL_PATH,
  VNEST_SYMBOL_VIEWBOX,
  VNEST_WORDMARK_PATHS,
  VNEST_WORDMARK_VIEWBOX,
} from "./nest-reveal-geometry";
import {
  DEFAULT_NEST_REVEAL_VARIANT,
  NEST_REVEAL_TIMING,
  introPlayedInThisDocument,
  isDocumentEntry,
  isHomepageRoute,
  markIntroPlayedInThisDocument,
  parseNestRevealVariantOverride,
  resetDocumentIntroForTests,
  resolveInitialNestRevealPhase,
  resolveNestRevealDecision,
} from "./nest-reveal-state";

const ROOT = process.cwd();

test("nest-reveal geometry matches official approved VNest SVG assets", () => {
  const symbolSvg = fs.readFileSync(
    path.join(ROOT, "public/dev-fixtures/brand-collection/vnest-symbol-approved.svg"),
    "utf8",
  );
  const wordmarkSvg = fs.readFileSync(
    path.join(ROOT, "public/dev-fixtures/brand-collection/vnest-wordmark-approved.svg"),
    "utf8",
  );
  const lockupSvg = fs.readFileSync(
    path.join(ROOT, "public/dev-fixtures/brand-collection/vnest-lockup.svg"),
    "utf8",
  );

  assert.ok(
    symbolSvg.includes(`viewBox="${VNEST_SYMBOL_VIEWBOX}"`),
    "Symbol viewBox must match vnest-symbol-approved.svg",
  );
  assert.ok(
    symbolSvg.includes(`d="${VNEST_SYMBOL_PATH}"`),
    "Symbol path d must exactly match vnest-symbol-approved.svg",
  );

  assert.ok(
    wordmarkSvg.includes(`viewBox="${VNEST_WORDMARK_VIEWBOX}"`),
    "Wordmark viewBox must match vnest-wordmark-approved.svg",
  );
  for (const wordmarkPath of VNEST_WORDMARK_PATHS) {
    assert.ok(
      wordmarkSvg.includes(`d="${wordmarkPath}"`),
      "Every wordmark letter path must exactly match vnest-wordmark-approved.svg",
    );
  }

  assert.ok(
    lockupSvg.includes(`viewBox="${VNEST_LOCKUP_VIEWBOX}"`),
    "Lockup viewBox must match vnest-lockup.svg",
  );
  for (const descriptorPath of VNEST_DESCRIPTOR_PATHS) {
    assert.ok(
      lockupSvg.includes(`d="${descriptorPath}"`),
      "Every descriptor glyph path must match vnest-lockup.svg",
    );
  }

  assert.equal(VNEST_NEST_RINGS.length, 4, "Nest symbol comprises 4 overlapping organic rings");
  for (const ring of VNEST_NEST_RINGS) {
    assert.ok(ring.fillPath.startsWith("M") && ring.fillPath.endsWith("Z"));
    assert.ok(ring.centerline.d.startsWith("M"));
    assert.ok(ring.centerline.length > 900 && ring.centerline.length < 1400);
  }
});

test("nest-reveal timing stays within the brief 0.9s-1.3s editorial target", () => {
  assert.ok(
    NEST_REVEAL_TIMING.totalMs >= 900 && NEST_REVEAL_TIMING.totalMs <= 1300,
    `Expected totalMs (${NEST_REVEAL_TIMING.totalMs}) to be within 900..1300ms`,
  );
  assert.ok(
    NEST_REVEAL_TIMING.revealMs < NEST_REVEAL_TIMING.totalMs,
    "Reveal phase must complete before total dissolve duration ends",
  );
});

test("nest-reveal route guard only activates on the homepage (/dev/demo)", () => {
  assert.equal(isHomepageRoute("/dev/demo"), true);
  assert.equal(isHomepageRoute("/dev/demo/"), true);
  assert.equal(isHomepageRoute("/dev/demo?intro=converge"), true);

  // Must not activate on property detail pages, booking steps, or other routes
  assert.equal(isHomepageRoute("/dev/stays/bare-chic"), false);
  assert.equal(isHomepageRoute("/dev/stays/bare-chic?view=demo"), false);
  assert.equal(isHomepageRoute("/dev/demo/tim-phong"), false);
  assert.equal(isHomepageRoute("/dev/demo/dat-phong"), false);
  assert.equal(isHomepageRoute("/"), false);
});

test("nest-reveal initial phase: every full load renders the overlay from the server (no homepage flash); intro=0 renders none", () => {
  assert.equal(resolveInitialNestRevealPhase(undefined), "beginning");
  assert.equal(resolveInitialNestRevealPhase(""), "beginning");
  assert.equal(resolveInitialNestRevealPhase("draw"), "beginning");
  assert.equal(resolveInitialNestRevealPhase("converge"), "beginning");
  assert.equal(resolveInitialNestRevealPhase("0"), "complete");
  assert.equal(resolveInitialNestRevealPhase("off"), "complete");
  assert.equal(resolveInitialNestRevealPhase("false"), "complete");
});

test("nest-reveal plays on every full load of the homepage, once per document, with reduced motion and query overrides", () => {
  const decide = (over: Partial<Parameters<typeof resolveNestRevealDecision>[0]> = {}) =>
    resolveNestRevealDecision({
      pathname: "/dev/demo",
      search: "",
      alreadyPlayedInDocument: false,
      documentEntry: true,
      prefersReducedMotion: false,
      ...over,
    });
  const play = { action: "play", variant: DEFAULT_NEST_REVEAL_VARIANT, shouldMarkSeen: true };
  const skip = { action: "skip", variant: DEFAULT_NEST_REVEAL_VARIANT, shouldMarkSeen: false };

  // First visit, refresh and hard reload are all a new document loaded on the homepage: it plays every time.
  assert.deepEqual(decide(), play);
  // Later in the same document (re-render, Back / Forward, VI / EN switch): never again.
  assert.deepEqual(decide({ alreadyPlayedInDocument: true }), skip);
  // Arriving at the homepage by a client-side link from another page: not a load, no intro.
  assert.deepEqual(decide({ documentEntry: false }), skip);
  // Reduced motion: the short static version.
  assert.deepEqual(decide({ prefersReducedMotion: true }), { ...play, action: "static-reduced-motion" });
  // Other routes never play it.
  assert.deepEqual(decide({ pathname: "/dev/stays/bare-chic", search: "?view=demo" }), skip);
  // ?intro=0 skips; forced variants still play (also after a client-side arrival), once per document.
  assert.deepEqual(decide({ search: "?intro=0&lang=en" }), skip);
  assert.deepEqual(decide({ search: "?intro=draw" }), { ...play, variant: "draw" });
  assert.deepEqual(decide({ search: "?intro=converge", documentEntry: false }), { ...play, variant: "converge" });
  assert.deepEqual(decide({ search: "?intro=converge", alreadyPlayedInDocument: true }), { ...skip, variant: "converge" });
});

test("nest-reveal remembers a play for the document only, and knows the page the document was loaded on", () => {
  resetDocumentIntroForTests();
  assert.equal(introPlayedInThisDocument(), false);
  markIntroPlayedInThisDocument();
  assert.equal(introPlayedInThisDocument(), true);
  resetDocumentIntroForTests();
  assert.equal(isDocumentEntry("/dev/demo", "http://localhost:3401/dev/demo?intro=0&lang=en"), true);
  assert.equal(isDocumentEntry("/dev/demo", "http://localhost:3401/dev/demo/"), true);
  assert.equal(isDocumentEntry("/dev/demo", "http://localhost:3401/dev/stays/bare-chic?view=demo"), false);
  assert.equal(isDocumentEntry("/dev/demo", undefined), true, "without the timing API: treated as a load");
  for (const file of ["nest-reveal-state.ts", "NestReveal.tsx"]) {
    const source = fs.readFileSync(path.join(ROOT, "src/features/demo", file), "utf8");
    assert.doesNotMatch(source, /sessionStorage|localStorage/, `${file}: nothing survives a reload`);
  }
});

test("nest-reveal component strictly avoids client-rendered script tags, progress bars, percentages, and spinners", () => {
  const componentSrc = fs.readFileSync(
    path.join(ROOT, "src/features/demo/NestReveal.tsx"),
    "utf8",
  );
  const cssSrc = fs.readFileSync(
    path.join(ROOT, "src/features/demo/NestReveal.module.css"),
    "utf8",
  );

  assert.ok(
    !componentSrc.includes("<script"),
    "Must never render a <script> tag inside a React Client Component",
  );
  assert.ok(
    !componentSrc.includes("dangerouslySetInnerHTML"),
    "Must never use dangerouslySetInnerHTML in NestReveal",
  );
  assert.ok(!componentSrc.includes("<progress"), "Must not use progress bar elements");
  assert.ok(!componentSrc.includes("100%"), "Must not render 0-100% loading text");
  assert.ok(!componentSrc.toLowerCase().includes("loading..."), "Must not render fake loading copy");
  assert.ok(cssSrc.includes("#f1ece4"), "Must use approved Warm Ivory #F1ECE4");
  assert.ok(cssSrc.includes("#a87444"), "Must use approved Copper #A87444");
  assert.ok(cssSrc.includes("#37412f"), "Must use approved Dark Olive #37412F");
  assert.ok(
    cssSrc.includes("prefers-reduced-motion: reduce"),
    "Must respect prefers-reduced-motion",
  );

  assert.equal(parseNestRevealVariantOverride("?intro=draw"), "draw");
  assert.equal(parseNestRevealVariantOverride("?intro=converge"), "converge");
  assert.equal(parseNestRevealVariantOverride("?intro=off"), "off");
  assert.equal(parseNestRevealVariantOverride(""), null);
});
