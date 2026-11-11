import assert from "node:assert/strict";
import { test } from "node:test";
import { missingTranslations, resolveLocalized } from "@/domain/locale";
import { ABOUT_COPY } from "./about-copy";

test("About VNest copy is complete in English as well as Vietnamese", () => {
  assert.deepEqual(missingTranslations(ABOUT_COPY, "vi"), []);
  assert.deepEqual(missingTranslations(ABOUT_COPY, "en"), []);
});

test("the English About copy carries no Vietnamese, apart from the brand name The Nắng Suites", () => {
  const en = resolveLocalized(ABOUT_COPY, "en");
  const text = Object.values(en).join(" ").replace("The Nắng Suites", "");
  assert.doesNotMatch(text, /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i, text);
  assert.equal(en.display, "Stay.");
  assert.equal(en.supporting, "Your way.");
  // Client review 6/11/2026: the CTA now leads to the contact section (was "Explore our stays").
  assert.equal(en.cta, "Contact VNest");
});

test("the Vietnamese composition is unchanged", () => {
  const vi = resolveLocalized(ABOUT_COPY, "vi");
  assert.equal(vi.display, "Ở.");
  assert.equal(vi.supporting, "Theo cách riêng.");
  // Client review 6/11/2026: was "Khám phá các không gian" (to the stays).
  assert.equal(vi.cta, "Liên hệ VNest");
});
