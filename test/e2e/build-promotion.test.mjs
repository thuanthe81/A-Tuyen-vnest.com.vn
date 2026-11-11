/**
 * Regression for Phase 01 verification findings F1 and F2, against real builds.
 *
 * F1  A build made with production, indexable settings and then started as a preview or as
 *     development used to send no X-Robots-Tag header and serve an allowing robots.txt.
 * F2  A production deployment without SITE_URL used to publish http://localhost:3000.
 *
 * Final safeguards: a deployment nobody has identified, or one whose signals disagree, stays
 *     closed and says why in its log.
 *
 * This builds the site, so it is not part of `npm test`. Run it with `npm run test:promotion`.
 */
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:net";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const next = fileURLToPath(new URL("../../node_modules/next/dist/bin/next", import.meta.url));

const PRODUCTION = { SITE_URL: "https://vnest.example", SITE_INDEXABLE: "true", DEPLOY_ENV: "production", CONTENT_SOURCE: "files", BOOKING_PROVIDER: "none" };
const PREVIEW = { ...PRODUCTION, DEPLOY_ENV: "preview" };
const DEVELOPMENT = { DEPLOY_ENV: "development" };
/** Production settings on a host that says nothing about which deployment this is. */
const UNIDENTIFIED = { ...PRODUCTION, DEPLOY_ENV: undefined };

/** Only what a deployment would set: nothing leaks in from the shell that runs the test. */
function environment(settings) {
  const { PATH, HOME, TMPDIR } = process.env;
  return { PATH, HOME, TMPDIR, NODE_ENV: "production", NEXT_TELEMETRY_DISABLED: "1", ...settings };
}

function build(settings) {
  return spawnSync(process.execPath, [next, "build"], { cwd: root, env: environment(settings), encoding: "utf8" });
}

function freePort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

const running = new Set();
after(() => running.forEach((child) => child.kill()));

/** Starts the current build with the given settings and returns what a crawler would see. */
async function crawl(settings) {
  const port = await freePort();
  const child = spawn(process.execPath, [next, "start", "--port", String(port)], { cwd: root, env: environment(settings) });
  running.add(child);
  let output = "";
  child.stdout.on("data", (chunk) => (output += chunk));
  child.stderr.on("data", (chunk) => (output += chunk));
  try {
    const origin = `http://127.0.0.1:${port}`;
    for (let attempt = 0; ; attempt += 1) {
      if (child.exitCode !== null) return { started: false, output };
      try {
        await fetch(origin);
        break;
      } catch {
        if (attempt > 150) throw new Error(`The server did not start:\n${output}`);
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }
    const [page, robots, sitemap, api] = await Promise.all(["/", "/robots.txt", "/sitemap.xml", "/api/availability"].map((path) => fetch(origin + path)));
    return {
      started: true,
      output,
      pageHeader: page.headers.get("x-robots-tag"),
      robotsHeader: robots.headers.get("x-robots-tag"),
      apiHeader: api.headers.get("x-robots-tag"),
      robots: await robots.text(),
      sitemap: await sitemap.text(),
    };
  } finally {
    child.kill();
    running.delete(child);
  }
}

const refuses = (seen) => {
  assert.equal(seen.started, true);
  assert.match(seen.pageHeader ?? "", /noindex/, "pages must carry X-Robots-Tag: noindex");
  assert.match(seen.robotsHeader ?? "", /noindex/);
  assert.match(seen.apiHeader ?? "", /noindex/);
  assert.match(seen.robots, /^Disallow: \/$/m, "robots.txt must disallow everything");
  assert.doesNotMatch(seen.robots, /Allow:|Sitemap:/);
  assert.doesNotMatch(seen.sitemap, /<loc>/, "the sitemap must be empty");
};

test("F2: a production build without a public SITE_URL fails instead of using localhost", () => {
  for (const SITE_URL of [undefined, "http://localhost:3000"]) {
    const result = build({ ...PRODUCTION, SITE_URL });
    assert.notEqual(result.status, 0, "the build must fail");
    assert.match(result.stdout + result.stderr, /SITE_URL/);
  }
});

test("a build made for production, with production settings", async (t) => {
  const built = build(PRODUCTION);
  assert.equal(built.status, 0, built.stdout + built.stderr);

  await t.test("is indexable when started as production (the control case)", async () => {
    const seen = await crawl(PRODUCTION);
    assert.equal(seen.started, true);
    assert.equal(seen.pageHeader, null);
    assert.match(seen.robots, /^Allow: \/$/m);
    assert.match(seen.robots, /^Sitemap: https:\/\/vnest\.example\/sitemap\.xml$/m);
    assert.doesNotMatch(seen.robots + seen.sitemap, /localhost/);
    assert.match(seen.apiHeader ?? "", /noindex/, "the API is never indexable");
  });

  await t.test("F1: refuses crawlers when the same artifacts are started as a preview", async () => refuses(await crawl(PREVIEW)));
  await t.test("F1: refuses crawlers when the same artifacts are started as development", async () => refuses(await crawl(DEVELOPMENT)));
  await t.test("F1: refuses crawlers when started on mock booking data", async () => refuses(await crawl({ ...PRODUCTION, BOOKING_PROVIDER: "mock" })));

  await t.test("refuses crawlers, and says why, when started with no deployment environment declared", async () => {
    const seen = await crawl(UNIDENTIFIED);
    refuses(seen);
    assert.match(seen.output, /\[vnest config\] No deployment environment is declared/);
    assert.match(seen.output, /\[vnest config\] SITE_INDEXABLE=true has no effect/);
  });
  await t.test("refuses crawlers when DEPLOY_ENV is empty", async () => refuses(await crawl({ ...PRODUCTION, DEPLOY_ENV: "" })));
  await t.test("refuses crawlers, and says why, when DEPLOY_ENV=production is set on a Vercel preview", async () => {
    const seen = await crawl({ ...PRODUCTION, VERCEL_ENV: "preview" });
    refuses(seen);
    assert.match(seen.output, /\[vnest config\] DEPLOY_ENV=production, but VERCEL_ENV says this is a preview deployment/);
  });
  await t.test("refuses crawlers when DEPLOY_ENV=production is set on a Netlify or Render preview", async () => {
    refuses(await crawl({ ...PRODUCTION, NETLIFY: "true", CONTEXT: "deploy-preview" }));
    refuses(await crawl({ ...PRODUCTION, RENDER: "true", IS_PULL_REQUEST: "true" }));
  });
  await t.test("is indexable as a Vercel production deployment, without DEPLOY_ENV", async () => {
    const seen = await crawl({ ...UNIDENTIFIED, VERCEL_ENV: "production" });
    assert.equal(seen.pageHeader, null);
    assert.match(seen.robots, /^Allow: \/$/m);
    assert.doesNotMatch(seen.output, /\[vnest config\]/, "a correct production deployment reports nothing");
  });

  await t.test("F2: refuses to start as production without SITE_URL", async () => {
    const seen = await crawl({ ...PRODUCTION, SITE_URL: undefined });
    assert.equal(seen.started, false);
    assert.match(seen.output, /SITE_URL is required/);
  });
});

test("a build made as a preview stays closed when its artifacts are started as production", async () => {
  const built = build(PREVIEW);
  assert.equal(built.status, 0, built.stdout + built.stderr);
  const seen = await crawl(PRODUCTION);
  assert.equal(seen.started, true);
  assert.match(seen.pageHeader ?? "", /noindex/, "the build-time lock must still hold");
});

test("a build nobody identified is closed, says so, and stays closed when started as production", async () => {
  const built = build(UNIDENTIFIED);
  assert.equal(built.status, 0, built.stdout + built.stderr);
  assert.match(built.stdout + built.stderr, /\[vnest config\] No deployment environment is declared/);
  const seen = await crawl(PRODUCTION);
  assert.equal(seen.started, true);
  assert.match(seen.pageHeader ?? "", /noindex/, "the build-time lock must still hold");
});

test("a build with nothing configured publishes no localhost address in silence", async () => {
  const built = build({});
  assert.equal(built.status, 0, built.stdout + built.stderr);
  assert.match(built.stdout + built.stderr, /\[vnest config\] SITE_URL is not set: canonical and share addresses use http:\/\/localhost:3000/);
  refuses(await crawl({}));
});
