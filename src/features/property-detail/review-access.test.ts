import assert from "node:assert/strict";
import { test } from "node:test";
import { readEnv } from "@/config/env";
import { reviewAccess } from "./review-access";

const access = (vars: Record<string, string>, nodeEnv = "production") => reviewAccess(readEnv({ ...vars, NODE_ENV: nodeEnv }));

test("the local client-preview configurations see the review pages and the private preview", () => {
  assert.deepEqual(access({ DEPLOY_ENV: "development", CONTENT_SOURCE: "client-draft", BOOKING_PROVIDER: "none" }), { route: true, privatePreview: true }, "next start, vnest-v2-client-preview");
  assert.deepEqual(access({ DEPLOY_ENV: "development", CONTENT_SOURCE: "client-draft", BOOKING_PROVIDER: "none" }, "development"), { route: true, privatePreview: true }, "next dev, vnest-v2-client-preview-dev");
});

test("no deployment ever serves them: production, preview, or a server nobody identified", () => {
  assert.deepEqual(access({ DEPLOY_ENV: "production", SITE_URL: "https://vnest.example" }), { route: false, privatePreview: false });
  assert.deepEqual(access({ DEPLOY_ENV: "production", SITE_URL: "https://vnest.example", SITE_INDEXABLE: "true", CONTENT_SOURCE: "files", BOOKING_PROVIDER: "none" }), { route: false, privatePreview: false });
  assert.deepEqual(access({ DEPLOY_ENV: "preview" }), { route: false, privatePreview: false });
  assert.deepEqual(access({ VERCEL_ENV: "preview" }), { route: false, privatePreview: false });
  assert.deepEqual(access({ DEPLOY_ENV: "development", VERCEL_ENV: "production" }), { route: true, privatePreview: true }, "declared development wins over a platform's production, and stays non-indexable");
  assert.deepEqual(access({}), { route: false, privatePreview: false }, "unidentified: env.ts says development, but this may be a public host");
});
