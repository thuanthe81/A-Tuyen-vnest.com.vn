import assert from "node:assert/strict";
import { test } from "node:test";
import { CONSULTATION_LIMITS, cleanLine, cleanText, contactErrors, isEmailAddress, parseReach, validateConsultation } from "./consultation";

const valid = { service: "van-hanh", name: "Nguyễn Văn A", reach: "owner@example.com", asset: "", message: "", source: "/dev/demo", locale: "vi" };

test("empty form: service, name and contact are required", () => {
  const result = validateConsultation({});
  assert.equal(result.ok, false);
  assert.deepEqual(!result.ok && result.errors, { service: "required", name: "required", reach: "required" });
});

test("name + valid email, and name + valid phone, both pass", () => {
  const email = validateConsultation(valid);
  assert.ok(email.ok);
  assert.deepEqual(email.ok && email.request.reach, { kind: "email", value: "owner@example.com" });
  for (const phone of ["0901 234 567", "+84 90 123 4567", "090.123.4567", "(+84) 901234567"]) {
    const result = validateConsultation({ ...valid, reach: phone });
    assert.ok(result.ok, phone);
    assert.equal(result.ok && result.request.reach.kind, "phone");
  }
});

test("invalid contact input is refused", () => {
  for (const reach of ["12345", "an@vnest", "not-a-phone-or-email", "a b@example.com", "a@b@example.com", "x?cc=evil%40e.com@ex.com", "<a@example.com>"]) {
    assert.equal(contactErrors({ name: "An", reach }).reach, "invalid", reach);
  }
});

test("an email address can never carry a line break or a second header", () => {
  for (const reach of ["owner@example.com\r\nBcc: x@evil.com", "owner@example.com\nX: y", "owner@example.com,x@evil.com", "\"A\" <a@example.com>"]) {
    const cleaned = cleanLine(reach);
    assert.equal(isEmailAddress(cleaned), false, JSON.stringify(reach));
  }
});

test("optional fields are optional, and kept when given", () => {
  const result = validateConsultation({ ...valid, asset: " Căn hộ dịch vụ ", message: "Dòng 1\r\nDòng 2\n\n\n\nDòng 3" });
  assert.ok(result.ok);
  assert.equal(result.ok && result.request.asset, "Căn hộ dịch vụ");
  assert.equal(result.ok && result.request.message, "Dòng 1\nDòng 2\n\nDòng 3");
});

test("length limits", () => {
  const long = (n: number) => "a".repeat(n);
  const result = validateConsultation({ ...valid, name: long(CONSULTATION_LIMITS.name.max + 1), asset: long(121), message: long(2001) });
  assert.deepEqual(!result.ok && result.errors, { name: "too-long", asset: "too-long", message: "too-long" });
  assert.ok(validateConsultation({ ...valid, name: long(100), asset: long(120), message: long(2000) }).ok);
});

test("unknown service is invalid; every form choice is accepted", () => {
  const result = validateConsultation({ ...valid, service: "design" });
  assert.equal(!result.ok && result.errors.service, "invalid");
  for (const service of ["van-hanh", "tu-van-mo-hinh", "nhuong-quyen", "chua-ro"]) assert.ok(validateConsultation({ ...valid, service }).ok, service);
});

test("non-string values never pass as text", () => {
  const result = validateConsultation({ ...valid, name: ["An"], reach: { a: 1 } });
  assert.deepEqual(!result.ok && result.errors, { name: "required", reach: "required" });
});

test("control and invisible characters are removed; Vietnamese is normalised", () => {
  assert.equal(cleanLine("An\u0000\u200b\u202e Nguyễn\r\n"), "An Nguyễn");
  assert.equal(cleanLine("Nguyễn"), "Nguyễn");
  assert.equal(cleanText("a\u2028b\u0007c"), "a b c");
});

test("source path and language are never trusted as given", () => {
  const odd = validateConsultation({ ...valid, source: "https://evil.example/x?y=<z>", locale: "fr" });
  assert.ok(odd.ok);
  assert.equal(odd.ok && odd.request.source, "unknown");
  assert.equal(odd.ok && odd.request.locale, "vi");
  const en = validateConsultation({ ...valid, source: "/dev/demo/hop-tac", locale: "en" });
  assert.equal(en.ok && en.request.source, "/dev/demo/hop-tac");
  assert.equal(en.ok && en.request.locale, "en");
});

test("parseReach keeps what was typed and the digits apart", () => {
  assert.deepEqual(parseReach("0901 234 567"), { kind: "phone", value: "0901 234 567", digits: "0901234567" });
  assert.equal(parseReach("hello"), undefined);
});
