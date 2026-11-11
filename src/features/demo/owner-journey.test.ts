import assert from "node:assert/strict";
import { test } from "node:test";
import { SERVICES, isServiceId, serviceTitle, validateContact } from "./owner-journey";

test("the three official service headings, in the CEO's order", () => {
  assert.deepEqual(SERVICES.map((s) => serviceTitle(s)), ["Quản lý vận hành", "Phát triển dự án (Tư vấn mô hình)", "Nhượng quyền thương hiệu"]);
});

test("no service copy states a fee, a percentage, a return or a guarantee", () => {
  const text = JSON.stringify(SERVICES).toLowerCase();
  for (const word of ["%", "lợi nhuận", "cam kết", "đảm bảo", "guarantee", "return on"]) assert.ok(!text.includes(word), word);
});

test("service ids from the address are checked", () => {
  assert.equal(isServiceId("nhuong-quyen"), true);
  assert.equal(isServiceId("design"), false);
  assert.equal(isServiceId(null), false);
});

test("contact validation: name and a phone number or email", () => {
  assert.deepEqual(validateContact({ name: "", reach: "" }), { name: "Vui lòng nhập họ tên.", reach: "Vui lòng nhập số điện thoại hoặc email." });
  assert.deepEqual(validateContact({ name: "An", reach: "0901 234 567" }), {});
  assert.deepEqual(validateContact({ name: "An", reach: "+84 90 123 4567" }), {});
  assert.deepEqual(validateContact({ name: "An", reach: "an@vnest.vn" }), {});
  assert.equal(validateContact({ name: "An", reach: "12345" }).reach, "Số điện thoại hoặc email chưa đúng định dạng.");
  assert.equal(validateContact({ name: "An", reach: "an@vnest" }).reach, "Số điện thoại hoặc email chưa đúng định dạng.");
});
