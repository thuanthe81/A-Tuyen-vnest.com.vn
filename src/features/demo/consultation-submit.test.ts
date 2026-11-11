import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { CONSULTATION_SERVICES } from "@/domain/consultation";
import { CONTACT_FORM_COPY } from "./contact-copy";
import { submitConsultation } from "./consultation-submit";
import { SERVICES, consultationErrorText, validateContact } from "./owner-journey";

const payload = { service: "van-hanh", name: "An", reach: "an@example.com", asset: "", message: "", source: "/dev/demo", locale: "vi", vnx_hp: "" };
const answering = (status: number, body: unknown) => (async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch;

test("submit: 'sent' only for the server's confirmed success", async () => {
  assert.deepEqual(await submitConsultation(payload, { fetch: answering(200, { ok: true, reference: "VN-1" }) }), { kind: "sent", reference: "VN-1" });
  // A 200 that does not say ok (a proxy page, a captive portal) is not a success.
  assert.deepEqual(await submitConsultation(payload, { fetch: answering(200, { hello: "world" }) }), { kind: "failed" });
  const html = (async () => new Response("<html>", { status: 200 })) as unknown as typeof fetch;
  assert.deepEqual(await submitConsultation(payload, { fetch: html }), { kind: "failed" });
});

test("submit: invalid, rate limited, provider failure, network failure", async () => {
  assert.deepEqual(await submitConsultation(payload, { fetch: answering(400, { ok: false, error: "invalid", fields: { reach: "invalid" } }) }), { kind: "invalid", fields: { reach: "invalid" } });
  assert.deepEqual(await submitConsultation(payload, { fetch: answering(429, { ok: false, error: "rate-limited" }) }), { kind: "limited" });
  for (const status of [400, 403, 413, 415, 500, 502, 503]) {
    assert.deepEqual(await submitConsultation(payload, { fetch: answering(status, { ok: false, error: "x" }) }), { kind: "failed" }, `${status}`);
  }
  const offline = (async () => {
    throw new TypeError("Failed to fetch");
  }) as unknown as typeof fetch;
  assert.deepEqual(await submitConsultation(payload, { fetch: offline }), { kind: "failed" });
});

test("the form's service choices are exactly the ones the server accepts", () => {
  assert.deepEqual([...SERVICES.map((s) => s.id), "chua-ro"], [...CONSULTATION_SERVICES]);
});

test("error codes become the form's sentences, in both languages", () => {
  assert.deepEqual(consultationErrorText({ name: "too-long", service: "required" }, "vi"), { name: "Họ tên quá dài (tối đa 100 ký tự).", service: "Vui lòng chọn dịch vụ quan tâm." });
  assert.deepEqual(validateContact({ name: "", reach: "x" }, "en"), { name: "Please enter your name.", reach: "That phone number or email address does not look right." });
});

test("state copy: Vietnamese as briefed, English present, no promise of a reply or a deadline", () => {
  assert.equal(CONTACT_FORM_COPY.submitting.vi, "Đang gửi...");
  assert.equal(CONTACT_FORM_COPY.sent.vi, "Yêu cầu của bạn đã được gửi đến VNest.");
  assert.equal(CONTACT_FORM_COPY.failed.vi, "Chưa thể gửi yêu cầu. Vui lòng thử lại hoặc liên hệ trực tiếp qua {email}.");
  for (const key of ["intro", "submitting", "sent", "sentThanks", "failed", "limited", "sentSimulated"] as const) {
    assert.ok(CONTACT_FORM_COPY[key].en.length > 0, key);
    const text = `${CONTACT_FORM_COPY[key].vi} ${CONTACT_FORM_COPY[key].en}`.toLowerCase();
    for (const promise of ["24", "giờ", "hours", "within", "trong vòng", "sẽ liên hệ", "will contact", "will reply", "đã đọc", "phản hồi"]) {
      assert.ok(!text.includes(promise), `${key}: ${promise}`);
    }
  }
  assert.ok(!CONTACT_FORM_COPY.intro.vi.includes("chưa hoạt động"));
});

test("no browser code imports the server, the email adapters or the env reader, and no file names the key", () => {
  const root = fileURLToPath(new URL("../../", import.meta.url));
  // Value imports only: `import type` is erased from the bundle (useAvailability.ts reads a response type that way).
  const serverOnly = /^import\s+(?!type\b)[^;]*?from\s+["']@\/(server|integrations|config\/env)\b/m;
  const offenders: string[] = [];
  const keyMentions: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const full = path.join(dir, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (/\.tsx?$/.test(entry) && !/\.test\./.test(entry)) {
        const text = readFileSync(full, "utf8");
        if (/^["']use client["']/m.test(text.slice(0, 200)) && serverOnly.test(text)) offenders.push(path.relative(root, full));
        if (text.includes("RESEND_API_KEY") && !full.endsWith(path.join("config", "env.ts")) && !full.endsWith(path.join("server", "services.ts"))) keyMentions.push(path.relative(root, full));
      }
    }
  };
  walk(root);
  assert.deepEqual(offenders, []);
  assert.deepEqual(keyMentions, []);
});
