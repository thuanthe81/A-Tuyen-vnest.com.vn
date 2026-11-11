import assert from "node:assert/strict";
import { test } from "node:test";
import { readEnv } from "@/config/env";
import { routes } from "@/config/routes";
import { parseIsoDate } from "@/domain/dates";

const live = { SITE_URL: "https://vnest.example", SITE_INDEXABLE: "true", DEPLOY_ENV: "production", CONTENT_SOURCE: "files", BOOKING_PROVIDER: "none" };

test("defaults are safe: mock data, development, not indexable", () => {
  const env = readEnv({});
  assert.equal(env.siteUrl.toString(), "http://localhost:3000/");
  assert.equal(env.deployEnv, "development");
  assert.equal(env.contentSource, "mock");
  assert.equal(env.bookingProvider, "mock");
  assert.equal(env.indexable, false);
});

test("indexing needs the flag, production, and no mock data, all at once", () => {
  assert.equal(readEnv(live).indexable, true);
  assert.equal(readEnv({ ...live, SITE_INDEXABLE: "false" }).indexable, false);
  assert.equal(readEnv({ ...live, DEPLOY_ENV: "preview" }).indexable, false);
  assert.equal(readEnv({ ...live, DEPLOY_ENV: undefined }).indexable, false);
  assert.equal(readEnv({ ...live, CONTENT_SOURCE: "mock" }).indexable, false);
  assert.equal(readEnv({ ...live, BOOKING_PROVIDER: "mock" }).indexable, false);
});

test("a Vercel preview is recognised, and Vercel production counts as production", () => {
  assert.equal(readEnv({ ...live, DEPLOY_ENV: undefined, VERCEL_ENV: "preview" }).indexable, false);
  const production = readEnv({ ...live, DEPLOY_ENV: undefined, VERCEL_ENV: "production" });
  assert.equal(production.indexable, true);
  assert.equal(production.deployEnvSource, "platform");
  assert.deepEqual(production.diagnostics, []);
});

// Final Phase 01 safeguards: who decides which deployment this is, and what happens when nobody does.
test("when DEPLOY_ENV and the platform disagree, the one that is not production wins", () => {
  // A variable meant for the live site, also applied to previews, must not open them.
  const declaredUp = readEnv({ ...live, DEPLOY_ENV: "production", VERCEL_ENV: "preview" });
  assert.equal(declaredUp.deployEnv, "preview");
  assert.equal(declaredUp.indexable, false);
  assert.match(declaredUp.diagnostics.join("\n"), /DEPLOY_ENV=production, but VERCEL_ENV says this is a preview deployment/);
  assert.equal(readEnv({ ...live, DEPLOY_ENV: "production", VERCEL_ENV: "development" }).indexable, false);

  // And the live deployment can still be held closed on purpose.
  const declaredDown = readEnv({ ...live, DEPLOY_ENV: "preview", VERCEL_ENV: "production" });
  assert.equal(declaredDown.deployEnv, "preview");
  assert.equal(declaredDown.indexable, false);
  assert.match(declaredDown.diagnostics.join("\n"), /VERCEL_ENV says this is a production deployment, but DEPLOY_ENV=preview/);

  // Agreement is the only way through, and it is silent.
  const agreed = readEnv({ ...live, DEPLOY_ENV: "production", VERCEL_ENV: "production" });
  assert.equal(agreed.indexable, true);
  assert.deepEqual(agreed.diagnostics, []);
});

test("preview signals from other hosts can only close a deployment, never open one", () => {
  for (const preview of [
    { NETLIFY: "true", CONTEXT: "deploy-preview" },
    { NETLIFY: "true", CONTEXT: "branch-deploy" },
    { RENDER: "true", IS_PULL_REQUEST: "true" },
  ]) {
    const env = readEnv({ ...live, ...preview });
    assert.equal(env.deployEnv, "preview", JSON.stringify(preview));
    assert.equal(env.indexable, false);
    assert.equal(readEnv({ ...live, DEPLOY_ENV: undefined, ...preview }).deployEnv, "preview");
  }
  // These hosts' "production" is not taken as proof: there, DEPLOY_ENV must say it.
  const netlifyLive = readEnv({ ...live, DEPLOY_ENV: undefined, NETLIFY: "true", CONTEXT: "production" });
  assert.equal(netlifyLive.deployEnvSource, "unknown");
  assert.equal(netlifyLive.indexable, false);
  assert.equal(readEnv({ ...live, NETLIFY: "true", CONTEXT: "production" }).indexable, true);
  // A stray CONTEXT on some other host means nothing.
  assert.equal(readEnv({ ...live, CONTEXT: "deploy-preview" }).indexable, true);
});

test("a platform variable that is present but empty or unreadable closes the deployment", () => {
  for (const unreadable of [
    { VERCEL_ENV: "" },
    { VERCEL_ENV: "  " },
    { NETLIFY: "true", CONTEXT: "" },
    { NETLIFY: "true", CONTEXT: "dev" },
    { NETLIFY: "true", CONTEXT: "something-new" },
    { RENDER: "true", IS_PULL_REQUEST: "" },
    { RENDER: "true", IS_PULL_REQUEST: "TRUE" },
  ]) {
    const env = readEnv({ ...live, ...unreadable });
    assert.equal(env.deployEnv, "preview", JSON.stringify(unreadable));
    assert.equal(env.indexable, false, JSON.stringify(unreadable));
    assert.match(env.diagnostics.join("\n"), /DEPLOY_ENV=production, but .* says this is a preview deployment/);
    // Without DEPLOY_ENV it is closed as well, and never production.
    assert.equal(readEnv({ ...live, DEPLOY_ENV: undefined, ...unreadable }).indexable, false);
  }
  // Absent is different from empty: the running server may simply not be given the variable.
  assert.equal(readEnv({ ...live, NETLIFY: "true" }).indexable, true);
  assert.equal(readEnv({ ...live, RENDER: "true" }).indexable, true);
  assert.equal(readEnv({ ...live, RENDER: "true", IS_PULL_REQUEST: "false" }).indexable, true);
  // No combination of these signals makes production by itself.
  for (const signals of [{ NETLIFY: "true", CONTEXT: "production" }, { RENDER: "true", IS_PULL_REQUEST: "false" }, { NETLIFY: "true" }]) {
    assert.equal(readEnv({ ...live, DEPLOY_ENV: undefined, ...signals }).indexable, false, JSON.stringify(signals));
  }
});

test("production accepts only a public https origin; http is for local development", () => {
  for (const source of [{ DEPLOY_ENV: "production" }, { VERCEL_ENV: "production" }]) {
    assert.throws(() => readEnv({ ...live, ...source, SITE_URL: "http://vnest.example" }), /not a public https origin/);
  }
  assert.equal(readEnv({ DEPLOY_ENV: "development", SITE_URL: "http://localhost:3000" }).siteUrl.protocol, "http:");
});

test("an empty DEPLOY_ENV counts as not set", () => {
  const onVercel = readEnv({ ...live, DEPLOY_ENV: "", VERCEL_ENV: "production" });
  assert.equal(onVercel.deployEnv, "production", "the platform's answer is used");
  assert.equal(onVercel.indexable, true);
  assert.match(onVercel.diagnostics.join("\n"), /DEPLOY_ENV is set but empty/);
  const blank = readEnv({ ...live, DEPLOY_ENV: "   " });
  assert.equal(blank.deployEnvSource, "unknown");
  assert.equal(blank.indexable, false);
});

test("an unidentified deployment is never production: closed, and it says so", () => {
  const built = { NODE_ENV: "production" };
  const unknown = readEnv({ ...live, DEPLOY_ENV: undefined, ...built });
  assert.equal(unknown.deployEnvSource, "unknown");
  assert.equal(unknown.deployEnv, "development");
  assert.equal(unknown.indexable, false);
  assert.match(unknown.diagnostics.join("\n"), /No deployment environment is declared/);
  assert.match(unknown.diagnostics.join("\n"), /SITE_INDEXABLE=true has no effect: the deployment is not identified, not production/);

  // With nothing set at all it would publish localhost addresses: closed, and reported.
  const bare = readEnv(built);
  assert.equal(bare.indexable, false);
  assert.match(bare.diagnostics.join("\n"), /SITE_URL is not set: canonical and share addresses use http:\/\/localhost:3000/);
  // A preview without a public address is reported too.
  assert.match(readEnv({ ...built, DEPLOY_ENV: "preview" }).diagnostics.join("\n"), /SITE_URL is not set/);
  assert.match(readEnv({ ...built, VERCEL_ENV: "preview", SITE_URL: "http://localhost:3000" }).diagnostics.join("\n"), /SITE_URL is a local address/);

  // Local development and a run declared as development stay quiet.
  assert.deepEqual(readEnv({}).diagnostics, []);
  assert.deepEqual(readEnv({ NODE_ENV: "development" }).diagnostics, []);
  assert.deepEqual(readEnv({ ...built, DEPLOY_ENV: "development" }).diagnostics, []);
});

test("indexing is asked for with the exact word, and a request that cannot be met is explained", () => {
  for (const SITE_INDEXABLE of ["TRUE", "1", "yes"]) {
    const env = readEnv({ ...live, SITE_INDEXABLE });
    assert.equal(env.indexable, false, SITE_INDEXABLE);
    assert.match(env.diagnostics.join("\n"), /is not "true", so indexing stays off/);
  }
  assert.deepEqual(readEnv({ ...live, SITE_INDEXABLE: "false" }).diagnostics, []);
  assert.match(readEnv({ ...live, BOOKING_PROVIDER: "mock" }).diagnostics.join("\n"), /SITE_INDEXABLE=true has no effect: mock data is in use/);
  assert.match(readEnv({ ...live, DEPLOY_ENV: "preview" }).diagnostics.join("\n"), /has no effect: the deployment is preview, not production/);
  assert.throws(() => readEnv({ DEPLOY_ENV: "Production" }), /DEPLOY_ENV="Production" is not valid/);
  assert.throws(() => readEnv({ VERCEL_ENV: "staging" }), /VERCEL_ENV="staging" is not valid/);
});

test("invalid values fail loudly", () => {
  assert.throws(() => readEnv({ BOOKING_PROVIDER: "ezcloud" }), /BOOKING_PROVIDER="ezcloud" is not valid/);
  assert.throws(() => readEnv({ MOCK_LATENCY_MS: "fast" }), /MOCK_LATENCY_MS/);
  assert.throws(() => readEnv({ SITE_URL: "not a url" }), /SITE_URL/);
  assert.throws(() => readEnv({ MOCK_AVAILABILITY_SCENARIO: "nope" }), /MOCK_AVAILABILITY_SCENARIO/);
});

// Regression for verification finding F2: production used to fall back to http://localhost:3000 in silence.
test("production refuses to start without a public https SITE_URL", () => {
  const production = { DEPLOY_ENV: "production" };
  assert.throws(() => readEnv(production), /SITE_URL is required when the deployment is production/);
  assert.throws(() => readEnv({ ...production, SITE_URL: "  " }), /SITE_URL is required/);
  assert.throws(() => readEnv({ VERCEL_ENV: "production" }), /SITE_URL is required/, "a Vercel production deployment is production too");
  for (const local of ["http://localhost:3000", "https://localhost", "https://127.0.0.1:3000", "https://[::1]", "https://vnest.local", "https://vnest.test"]) {
    assert.throws(() => readEnv({ ...production, SITE_URL: local }), /not a public https origin/, local);
  }
  assert.throws(() => readEnv({ ...production, SITE_URL: "http://vnest.example" }), /not a public https origin/);
  assert.throws(() => readEnv({ ...production, SITE_URL: "ftp://vnest.example" }), /Expected http or https/);
  assert.equal(readEnv({ ...production, SITE_URL: "https://vnest.example" }).siteUrl.origin, "https://vnest.example");
});

test("development and previews may still use localhost, and are never indexable", () => {
  for (const DEPLOY_ENV of ["development", "preview"]) {
    const env = readEnv({ DEPLOY_ENV, SITE_INDEXABLE: "true", CONTENT_SOURCE: "files", BOOKING_PROVIDER: "none" });
    assert.equal(env.siteUrl.origin, "http://localhost:3000");
    assert.equal(env.indexable, false);
  }
});

test("routes: the primary language has no prefix and stay criteria are carried", () => {
  const criteria = { checkIn: parseIsoDate("2026-12-10")!, checkOut: parseIsoDate("2026-12-12")!, adults: 3 };
  assert.equal(routes.home(), "/");
  assert.equal(routes.home("en"), "/en");
  assert.equal(routes.stays("vi", { criteria, filters: { destination: "area" } }), "/stays?destination=area&checkIn=2026-12-10&checkOut=2026-12-12&adults=3");
  assert.equal(routes.property("a-b"), "/stays/a-b");
  assert.equal(routes.property("a-b", "en", criteria), "/en/stays/a-b?checkIn=2026-12-10&checkOut=2026-12-12&adults=3");
  assert.equal(routes.room("a-b", "room", "vi"), "/stays/a-b/rooms/room");
  assert.equal(routes.api.availability(criteria, "a-b"), "/api/availability?property=a-b&checkIn=2026-12-10&checkOut=2026-12-12&adults=3");
  assert.equal(routes.api.availability(criteria), "/api/availability?checkIn=2026-12-10&checkOut=2026-12-12&adults=3");
  assert.equal(routes.dev.bookingSearchResults({ criteria: { adults: 2 }, filters: { property: "a-b" } }), "/dev/booking-search/results?property=a-b");
});

test("client-draft content is local-only and never indexable", () => {
  const local = readEnv({ DEPLOY_ENV: "development", CONTENT_SOURCE: "client-draft", BOOKING_PROVIDER: "none", SITE_INDEXABLE: "true" });
  assert.equal(local.contentSource, "client-draft");
  assert.equal(local.indexable, false);
  assert.equal(readEnv({ CONTENT_SOURCE: "client-draft", BOOKING_PROVIDER: "none" }).deployEnv, "development", "an unidentified deployment counts as development");
  assert.throws(() => readEnv({ ...live, CONTENT_SOURCE: "client-draft" }), /private local review only/);
  assert.throws(() => readEnv({ DEPLOY_ENV: "preview", CONTENT_SOURCE: "client-draft", BOOKING_PROVIDER: "none" }), /private local review only/);
});
