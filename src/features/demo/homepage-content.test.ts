import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { missingTranslations, type LocalizedText } from "@/domain/locale";
import { BRAND_COPY, BRAND_INDEX_UI, CITY_NAME, normaliseBrandNames } from "./brand-copy";
import { OWNER_FAQ, OWNER_JOURNEY_UI, SERVICES } from "./owner-journey";

/**
 * Homepage content completion (client document "Vnest Website Content - 05.11.2026_Final.docx", which replaces the 04.11 draft). Every client field must appear
 * word for word in the document text, in the right language section: A (Vietnamese) for `vi`, B (English) for `en`.
 *
 * Two documented exceptions (owner decision 5/11/2026, brand-name consistency): "Vnest" → "VNest" and
 * "The Nang Suites" → "The Nắng Suites". They are applied to the document text before matching; nothing else is.
 */
const SOURCE = readFileSync(join(process.cwd(), "docs/content/homepage-content-2026-11-05/vnest-website-content-2026-11-05-final.txt"), "utf8");
const DOC = normaliseBrandNames(SOURCE);
const split = DOC.indexOf("B. ENGLISH");
const VI = DOC.slice(0, split);
const EN = DOC.slice(split);

function assertFromDocument(field: LocalizedText, label: string) {
  assert.ok(VI.includes(field.vi), `${label} (vi) is not verbatim in section A: ${field.vi}`);
  assert.ok(field.en && EN.includes(field.en), `${label} (en) is not verbatim in section B: ${field.en}`);
}

test("Part 1: each brand's Hover, Positioning and About are the client's text, in both languages", () => {
  const pairs = [
    ["bare", "Bare Boutique Stays — Adventurous Boutique Stays"],
    ["the-nang", "The Nắng Suites — Comfortable Co-living"],
    ["pepper-house", "Pepper House — Urban Living Collection"],
  ] as const;
  for (const [id, heading] of pairs) {
    const copy = BRAND_COPY[id];
    for (const [key, prefix] of [["hover", "Brand Hover: "], ["positioning", "Brand Positioning: "], ["about", "Brand About: "]] as const) {
      assertFromDocument(copy[key], `${id}.${key}`);
      // The field belongs to this brand: it follows the brand's heading and the right label.
      for (const [section, text] of [[VI, copy[key].vi], [EN, copy[key].en!]] as const) {
        const at = section.indexOf(heading);
        assert.ok(at >= 0, heading);
        assert.ok(section.indexOf(`${prefix}${text}`, at) > at, `${id}.${key} under ${heading}`);
      }
    }
  }
});

test("Part 2: each service's card line, expanded description and three highlights are the client's text", () => {
  assert.deepEqual(
    SERVICES.map((s) => s.id),
    ["van-hanh", "tu-van-mo-hinh", "nhuong-quyen"],
  );
  for (const s of SERVICES) {
    assertFromDocument(s.line, `${s.id}.line`);
    assert.ok(VI.includes(`Service Card: ${s.line.vi}`) && EN.includes(`Service Card: ${s.line.en}`), `${s.id}.line label`);
    assertFromDocument(s.description, `${s.id}.description`);
    assert.ok(VI.includes(`Expanded Description: ${s.description.vi}`) && EN.includes(`Expanded Description: ${s.description.en}`));
    assert.equal(s.highlights.length, 3);
    s.highlights.forEach((h, i) => assertFromDocument(h, `${s.id}.highlights[${i}]`));
  }
  // English titles are the document's service headings.
  assert.ok(EN.includes("Hospitality Management") && EN.includes("Project Development — Business Model Consulting") && EN.includes("Brand Franchising"));
  assert.deepEqual(
    SERVICES.map((s) => [s.title.en, s.sub?.en]),
    [
      ["Hospitality Management", undefined],
      ["Project Development", "Business Model Consulting"],
      ["Brand Franchising", undefined],
    ],
  );
});

test("Part 3: the six FAQs are the client's questions and full answers, in the client's order", () => {
  assert.equal(OWNER_FAQ.length, 6);
  OWNER_FAQ.forEach((item, i) => {
    assert.ok(VI.includes(`${i + 1}. ${item.q.vi}\n${item.a.vi}`), `FAQ ${i + 1} (vi)`);
    assert.ok(EN.includes(`${i + 1}. ${item.q.en}\n${item.a.en}`), `FAQ ${i + 1} (en)`);
  });
});

test("no placeholder copy is left and every field has an English version", () => {
  const all = { BRAND_COPY, BRAND_INDEX_UI, CITY_NAME, SERVICES, OWNER_FAQ, OWNER_JOURNEY_UI };
  assert.deepEqual(missingTranslations(all, "vi"), []);
  assert.deepEqual(missingTranslations(all, "en"), []);
  const text = JSON.stringify(all);
  for (const marker of ["DRAFT", "Hạng mục", "do VNest cung cấp", "từ,", "chờ VNest duyệt. Cần"]) assert.ok(!text.includes(marker), marker);
});

test("the English copy carries no Vietnamese, apart from brand names", () => {
  const strip = (s: string) => s.replace(/The Nắng Suites/g, "");
  const english = [
    ...Object.values(BRAND_COPY).flatMap((b) => [b.hover.en, b.positioning.en, b.about.en]),
    ...Object.values(BRAND_INDEX_UI).map((t) => t.en),
    ...Object.values(CITY_NAME).map((t) => t.en),
    ...SERVICES.flatMap((s) => [s.title.en, s.sub?.en ?? "", s.line.en, s.description.en, s.cta.en, ...s.highlights.map((h) => h.en)]),
    ...OWNER_FAQ.flatMap((f) => [f.q.en, f.a.en]),
    ...Object.values(OWNER_JOURNEY_UI).map((t) => t.en),
  ].map((t) => strip(t ?? ""));
  for (const line of english) assert.doesNotMatch(line, /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i, line);
});

test("brand names use the canonical spelling, and the normalisation is the only change from the source", () => {
  const copy = JSON.stringify({ BRAND_COPY, SERVICES, OWNER_FAQ });
  assert.doesNotMatch(copy, /\bVnest\b/);
  assert.doesNotMatch(copy, /The Nang Suites/);
  // The source really does use the other spellings (so the exceptions are needed), and the rule touches nothing else.
  assert.match(SOURCE, /\bVnest\b/);
  assert.match(SOURCE, /The Nang Suites/);
  const undo = (t: string) => t.replace(/\bVNest\b/g, "Vnest").replace(/The Nắng Suites/g, "The Nang Suites");
  assert.doesNotMatch(SOURCE, /\bVNest\b|The Nắng Suites/);
  assert.equal(undo(DOC), SOURCE);
});

test("05.11 Final: deleted claims are gone, FAQ 5's sizes are the client's own, and no capacity is derived from them", () => {
  const copy = JSON.stringify({ BRAND_COPY, SERVICES, OWNER_FAQ });
  for (const removed of ["kinh nghiệm nhượng quyền", "hơn 10 năm", "franchise experience", "ten years", "Năm bước", "Five clear steps", "qua form", "through the form"]) {
    assert.ok(!copy.includes(removed), removed);
  }
  const faq5 = OWNER_FAQ[4]!.a;
  assert.match(faq5.vi, /15–35 m²/);
  assert.match(faq5.vi, /từ 35 m² trở lên/);
  assert.match(faq5.en!, /from 15 m² to 35 m²/);
  assert.match(faq5.en!, /units from 35 m²/);
  // The sizes are stated as the client wrote them; nothing turns them into a number of guests.
  assert.doesNotMatch(faq5.vi, /\d+\s*khách/);
  assert.doesNotMatch(faq5.en!, /\d+\s*(guests|people|persons)/);
  // The clarified model: brand rights always come with direct VNest management.
  assert.match(SERVICES[2]!.description.vi, /đồng thời trực tiếp quản lý vận hành/);
  assert.match(SERVICES[2]!.description.en!, /and directly manages operations/);
});
