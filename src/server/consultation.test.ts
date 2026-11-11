import assert from "node:assert/strict";
import { test } from "node:test";
import type { ConsultationDeliveryResult, ConsultationRecord, ConsultationSink } from "@/domain/consultation";
import { readEnv } from "@/config/env";
import { createConsultationHandler, type ConsultationDeps, type ConsultationInput } from "./consultation";
import { consultationServiceLabel } from "./consultation-labels";
import { consultationMode, createConsultation } from "./services";

const PERSONAL = ["Nguyễn Văn A", "owner@example.com", "0901 234 567", "Villa", "bí mật"];

function setup(over: Partial<ConsultationDeps> = {}, answer: () => Promise<ConsultationDeliveryResult> = async () => ({ ok: true, provider: "test" })) {
  const delivered: ConsultationRecord[] = [];
  const logs: string[] = [];
  const sink: ConsultationSink = {
    provider: "test",
    async deliver(record) {
      delivered.push(record);
      return answer();
    },
  };
  const handler = createConsultationHandler({
    mode: "live",
    sink: () => sink,
    rateLimits: { perClient: [{ windowMs: 600_000, max: 5 }], global: [{ windowMs: 3_600_000, max: 100 }] },
    duplicateWindowMs: 600_000,
    log: (_level, line) => logs.push(line),
    ...over,
  });
  return { handler, delivered, logs };
}

const body = (over: Record<string, unknown> = {}) =>
  JSON.stringify({ service: "van-hanh", name: "Nguyễn Văn A", reach: "owner@example.com", asset: "Villa", message: "bí mật", source: "/dev/demo", locale: "vi", vnx_hp: "", ...over });

const request = (over: Partial<ConsultationInput> = {}): ConsultationInput => ({
  body: body(),
  contentType: "application/json",
  origin: "http://localhost:3407",
  fetchSite: "same-origin",
  allowedHosts: ["localhost:3407"],
  clientAddress: "203.0.113.7",
  ...over,
});

test("success only once the sink confirms; the reply carries a reference and nothing personal", async () => {
  const { handler, delivered, logs } = setup();
  const outcome = await handler.handle(request());
  assert.equal(outcome.status, 200);
  assert.ok(outcome.body.ok);
  assert.match(outcome.body.ok ? outcome.body.reference : "", /^VN-[0-9A-F]{8}$/);
  assert.equal(delivered.length, 1);
  assert.equal(delivered[0]?.name, "Nguyễn Văn A");
  for (const word of PERSONAL) assert.ok(!logs.join("\n").includes(word), word);
});

test("provider failure is a 502, never a success, and is not logged with personal data", async () => {
  const { handler, logs } = setup({}, async () => ({ ok: false, provider: "test", reason: "unavailable", detail: "status=500 error=internal_server_error" }));
  const outcome = await handler.handle(request());
  assert.deepEqual(outcome, { status: 502, body: { ok: false, error: "delivery-failed" } });
  assert.match(logs.join("\n"), /delivery failed ref=VN-[0-9A-F]{8} provider=test reason=unavailable/);
  for (const word of PERSONAL) assert.ok(!logs.join("\n").includes(word), word);
  const thrown = setup({}, async () => {
    throw new Error("owner@example.com boom");
  });
  assert.equal((await thrown.handler.handle(request())).status, 502);
  assert.ok(!thrown.logs.join("\n").includes("owner@example.com"));
});

test("delivery off: 503 and nothing delivered", async () => {
  const { handler, delivered } = setup({ mode: "off", sink: () => undefined });
  assert.equal((await handler.handle(request())).status, 503);
  assert.equal(delivered.length, 0);
});

test("server-side validation answers with field codes", async () => {
  const { handler, delivered } = setup();
  const outcome = await handler.handle(request({ body: body({ name: "", reach: "12345", service: "x" }) }));
  assert.deepEqual(outcome, { status: 400, body: { ok: false, error: "invalid", fields: { name: "required", reach: "invalid", service: "invalid" } } });
  assert.equal(delivered.length, 0);
});

test("spam trap, wrong type, oversize, malformed JSON and cross-site requests are refused", async () => {
  const { handler, delivered } = setup();
  assert.equal((await handler.handle(request({ body: body({ vnx_hp: "http://spam" }) }))).body.ok, false);
  assert.equal((await handler.handle(request({ body: body({ vnx_hp: "http://spam" }) }))).status, 400);
  assert.equal((await handler.handle(request({ contentType: "text/plain" }))).status, 415);
  assert.equal((await handler.handle(request({ contentType: "application/x-www-form-urlencoded" }))).status, 415);
  assert.equal((await handler.handle(request({ body: body({ message: "a".repeat(20_000) }) }))).status, 413);
  assert.equal((await handler.handle(request({ body: "{not json" }))).status, 400);
  assert.equal((await handler.handle(request({ body: "[1]" }))).status, 400);
  assert.equal((await handler.handle(request({ origin: "https://evil.example" }))).status, 403);
  assert.equal((await handler.handle(request({ origin: null, fetchSite: "cross-site" }))).status, 403);
  assert.equal(delivered.length, 0);
});

test("rate limit per client address; another client is unaffected", async () => {
  const { handler } = setup();
  const statuses = [];
  for (let i = 0; i < 6; i++) statuses.push((await handler.handle(request({ body: body({ message: `m${i}` }) }))).status);
  assert.deepEqual(statuses, [200, 200, 200, 200, 200, 429]);
  assert.equal((await handler.handle(request({ clientAddress: "198.51.100.1" }))).status, 200);
});

test("duplicate submissions: a double click sends once; a retry after a failure sends again", async () => {
  let calls = 0;
  let fail = false;
  const { handler, delivered } = setup({}, async () => {
    calls++;
    await new Promise((resolve) => setTimeout(resolve, 20));
    return fail ? { ok: false, provider: "test", reason: "unavailable" } : { ok: true, provider: "test" };
  });
  const [a, b] = await Promise.all([handler.handle(request()), handler.handle(request())]);
  assert.equal(a.status, 200);
  assert.deepEqual(a, b);
  assert.equal(delivered.length, 1);
  // Sent again later (same content): answered as before, not re-sent.
  assert.deepEqual(await handler.handle(request()), a);
  assert.equal(calls, 1);

  fail = true;
  const other = request({ body: body({ message: "khác" }) });
  assert.equal((await handler.handle(other)).status, 502);
  fail = false;
  assert.equal((await handler.handle(other)).status, 200);
  assert.equal(calls, 3);
});

test("env: delivery is off by default; recipient defaults to hello@vnest.com.vn", () => {
  const env = readEnv({});
  assert.equal(env.consultation.delivery, "disabled");
  assert.equal(env.consultation.recipient, "hello@vnest.com.vn");
  assert.equal(consultationMode(env), "off");
});

test("env: resend needs a key and a sender; the mock is development only", () => {
  assert.throws(() => readEnv({ CONSULTATION_DELIVERY: "resend" }), /RESEND_API_KEY and CONSULTATION_SENDER/);
  assert.throws(() => readEnv({ CONSULTATION_DELIVERY: "resend", RESEND_API_KEY: "re_x" }), /CONSULTATION_SENDER/);
  assert.throws(() => readEnv({ CONSULTATION_DELIVERY: "resend", RESEND_API_KEY: "re_x", CONSULTATION_SENDER: "not an address" }), /CONSULTATION_SENDER/);
  assert.throws(() => readEnv({ CONSULTATION_DELIVERY: "resend", RESEND_API_KEY: "re_x", CONSULTATION_SENDER: "A <a@b.vn>\r\nBcc: x@y.z" }), /CONSULTATION_SENDER/);
  const live = readEnv({ CONSULTATION_DELIVERY: "resend", RESEND_API_KEY: "re_x", CONSULTATION_SENDER: "VNest Website <website@vnest.com.vn>" });
  assert.equal(consultationMode(live), "live");
  assert.equal(live.consultation.sender, "VNest Website <website@vnest.com.vn>");
  assert.throws(() => readEnv({ CONSULTATION_DELIVERY: "mock", DEPLOY_ENV: "preview" }), /local development only/);
  assert.throws(() => readEnv({ CONSULTATION_DELIVERY: "mock", DEPLOY_ENV: "production", SITE_URL: "https://vnest.com.vn" }), /local development only/);
  assert.equal(consultationMode(readEnv({ CONSULTATION_DELIVERY: "mock", DEPLOY_ENV: "development" })), "mock");
  assert.throws(() => readEnv({ CONSULTATION_RECIPIENT: "VNest <hello@vnest.com.vn>" }), /bare address/);
  assert.equal(readEnv({ CONSULTATION_RECIPIENT: "test-inbox@example.com" }).consultation.recipient, "test-inbox@example.com");
  assert.throws(() => readEnv({ CONSULTATION_DELIVERY: "smtp" }), /CONSULTATION_DELIVERY/);
});

test("composition: the mock sink honours ?mock= only in mock mode", async () => {
  const handler = createConsultation(readEnv({ CONSULTATION_DELIVERY: "mock", DEPLOY_ENV: "development" }));
  const failed = await handler.handle(request({ mockOutcome: "failed" }));
  assert.equal(failed.status, 502);
  const sent = await handler.handle(request({ body: body({ message: "x" }) }));
  assert.equal(sent.status, 200);
  const off = createConsultation(readEnv({}));
  assert.equal((await off.handle(request({ mockOutcome: "sent" }))).status, 503);
});

test("service labels in the email match the form", () => {
  assert.equal(consultationServiceLabel("van-hanh"), "Quản lý vận hành");
  assert.equal(consultationServiceLabel("tu-van-mo-hinh"), "Phát triển dự án (Tư vấn mô hình)");
  assert.equal(consultationServiceLabel("nhuong-quyen"), "Nhượng quyền thương hiệu");
  assert.equal(consultationServiceLabel("chua-ro"), "Chưa rõ, cần tư vấn");
});
