import assert from "node:assert/strict";
import { test } from "node:test";
import type { ConsultationRecord } from "@/domain/consultation";
import { composeConsultationEmail, escapeHtml, formatSubmittedAt } from "./compose-email";
import { createEmailSink } from "./email-sink";
import { createMockTransport } from "./mock";
import { createResendTransport, RESEND_ENDPOINT } from "./resend";

const compose = {
  serviceLabel: (s: string) => ({ "van-hanh": "Quản lý vận hành", "chua-ro": "Chưa rõ, cần tư vấn" })[s] ?? s,
  sourceLabel: (p: string) => (p === "/dev/demo" ? "Trang chủ (bản xem trước)" : undefined),
  timeZone: "Asia/Ho_Chi_Minh",
  timeZoneLabel: "GMT+7, giờ Việt Nam",
};
const envelope = { to: "hello@vnest.com.vn", from: "VNest Website <website@vnest.com.vn>" };

const record = (over: Partial<ConsultationRecord> = {}): ConsultationRecord => ({
  service: "van-hanh",
  name: "Nguyễn Văn A",
  reach: { kind: "email", value: "owner@example.com" },
  asset: "",
  message: "",
  source: "/dev/demo",
  locale: "vi",
  receivedAt: new Date("2026-11-10T07:32:00Z"),
  reference: "VN-0A1B2C3D",
  ...over,
});

test("subject names the service; time is Vietnam time with its zone", () => {
  const mail = composeConsultationEmail(record(), envelope, compose);
  assert.equal(mail.subject, "[VNest Website] Yêu cầu tư vấn — Quản lý vận hành");
  assert.equal(formatSubmittedAt(new Date("2026-11-10T07:32:00Z"), "Asia/Ho_Chi_Minh"), "10/11/2026, 14:32");
  assert.match(mail.text, /Thời gian gửi: 10\/11\/2026, 14:32 \(GMT\+7, giờ Việt Nam\)/);
  assert.equal(mail.to, "hello@vnest.com.vn");
  assert.equal(mail.from, envelope.from);
});

test("body lists every field; optional ones only when given", () => {
  const bare = composeConsultationEmail(record(), envelope, compose);
  for (const label of ["Dịch vụ quan tâm: Quản lý vận hành", "Họ tên: Nguyễn Văn A", "Email: owner@example.com", "Trang gửi: Trang chủ (bản xem trước) — /dev/demo", "Ngôn ngữ: Tiếng Việt (VI)", "Mã yêu cầu: VN-0A1B2C3D"]) {
    assert.ok(bare.text.includes(label), label);
  }
  assert.ok(!bare.text.includes("Loại tài sản") && !bare.text.includes("Nội dung trao đổi"));
  const full = composeConsultationEmail(record({ asset: "Villa", message: "Dòng 1\nDòng 2", locale: "en" }), envelope, compose);
  assert.ok(full.text.includes("Loại tài sản: Villa"));
  assert.ok(full.text.includes("Nội dung trao đổi:\n  Dòng 1\n  Dòng 2"));
  assert.ok(full.text.includes("Ngôn ngữ: English (EN)"));
  assert.ok(full.html.includes("Dòng 1<br>Dòng 2"));
});

test("Reply-To only for an email address; a phone gets a tel link and no Reply-To", () => {
  assert.equal(composeConsultationEmail(record(), envelope, compose).replyTo, "owner@example.com");
  const phone = composeConsultationEmail(record({ reach: { kind: "phone", value: "0901 234 567", digits: "0901234567" } }), envelope, compose);
  assert.equal(phone.replyTo, undefined);
  assert.ok(phone.html.includes('href="tel:+84901234567"'));
  assert.ok(phone.text.includes("Số điện thoại: 0901 234 567"));
});

test("visitor input is escaped in HTML and never reaches the subject", () => {
  const evil = '<script>alert(1)</script><img src=x onerror="y">';
  const mail = composeConsultationEmail(record({ name: evil, asset: evil, message: `${evil}\n"quoted" & 'single'` }), envelope, compose);
  assert.ok(!mail.html.includes("<script>"));
  assert.ok(!mail.html.includes("<img"));
  assert.ok(mail.html.includes("&lt;script&gt;alert(1)&lt;/script&gt;"));
  assert.ok(mail.html.includes("&quot;quoted&quot; &amp; &#39;single&#39;"));
  assert.ok(!mail.subject.includes("script"));
  assert.ok(!/[\r\n]/.test(mail.subject));
  assert.equal(escapeHtml(`<>&"'`), "&lt;&gt;&amp;&quot;&#39;");
});

test("the mailto link percent-encodes the local part", () => {
  const mail = composeConsultationEmail(record({ reach: { kind: "email", value: "o'neil+vnest@example.com" } }), envelope, compose);
  assert.ok(mail.html.includes('href="mailto:o&#39;neil%2Bvnest@example.com"'), mail.html);
});

test("Resend: the request it makes, and success only on 2xx", async () => {
  const calls: { url: string; init: RequestInit }[] = [];
  const fakeFetch = (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return new Response(JSON.stringify({ id: "re_123" }), { status: 200 });
  }) as unknown as typeof fetch;
  const transport = createResendTransport({ apiKey: "re_test_key", timeoutMs: 1000, fetch: fakeFetch });
  const mail = composeConsultationEmail(record(), envelope, compose);
  const result = await transport.send(mail, { idempotencyKey: "vnest-consultation-VN-1" });
  assert.deepEqual(result, { ok: true, providerId: "re_123" });
  assert.equal(calls[0]?.url, RESEND_ENDPOINT);
  const headers = calls[0]?.init.headers as Record<string, string>;
  assert.equal(headers.Authorization, "Bearer re_test_key");
  assert.equal(headers["Idempotency-Key"], "vnest-consultation-VN-1");
  const body = JSON.parse(String(calls[0]?.init.body));
  assert.deepEqual(body.to, ["hello@vnest.com.vn"]);
  assert.equal(body.reply_to, "owner@example.com");
  assert.equal(body.from, envelope.from);
});

test("Resend: failures are failures, with no secret or address in the detail", async () => {
  const answer = (status: number, name: string) =>
    (async () => new Response(JSON.stringify({ name, message: "owner@example.com is invalid" }), { status })) as unknown as typeof fetch;
  const mail = composeConsultationEmail(record(), envelope, compose);
  const cases: [number, string, string][] = [
    [401, "missing_api_key", "misconfigured"],
    [403, "invalid_from_address", "misconfigured"],
    [422, "validation_error", "rejected"],
    [429, "rate_limit_exceeded", "unavailable"],
    [500, "internal_server_error", "unavailable"],
  ];
  for (const [status, name, reason] of cases) {
    const result = await createResendTransport({ apiKey: "re_secret", timeoutMs: 1000, fetch: answer(status, name) }).send(mail, { idempotencyKey: "k" });
    assert.equal(result.ok, false);
    assert.equal(!result.ok && result.reason, reason, `${status}`);
    const detail = !result.ok ? (result.detail ?? "") : "";
    assert.ok(!detail.includes("re_secret") && !detail.includes("@"), detail);
  }
  const offline = (async () => {
    throw new TypeError("fetch failed");
  }) as unknown as typeof fetch;
  assert.equal((await createResendTransport({ apiKey: "k", timeoutMs: 1000, fetch: offline }).send(mail, { idempotencyKey: "k" })).ok, false);
  const slow = ((_: string, init: RequestInit) =>
    new Promise((_resolve, reject) => init.signal?.addEventListener("abort", () => reject(init.signal?.reason)))) as unknown as typeof fetch;
  const timedOut = await createResendTransport({ apiKey: "k", timeoutMs: 20, fetch: slow }).send(mail, { idempotencyKey: "k" });
  assert.equal(!timedOut.ok && timedOut.reason, "timeout");
});

test("email sink: reports the transport's answer; the mock keeps messages in memory only", async () => {
  const ok = createMockTransport();
  const sink = createEmailSink({ transport: ok, recipient: "hello@vnest.com.vn", sender: envelope.from, ...compose });
  const sent = await sink.deliver(record(), { idempotencyKey: "a" });
  assert.equal(sent.ok, true);
  assert.equal(ok.outbox.length, 1);
  assert.equal(ok.outbox[0]?.message.to, "hello@vnest.com.vn");
  const failing = createEmailSink({ transport: createMockTransport({ outcome: "failed" }), recipient: "hello@vnest.com.vn", sender: envelope.from, ...compose });
  const failed = await failing.deliver(record(), { idempotencyKey: "b" });
  assert.deepEqual(failed, { ok: false, provider: "mock", reason: "unavailable", detail: "mock-failure" });
});
