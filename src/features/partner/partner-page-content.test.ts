import assert from "node:assert/strict";
import { test } from "node:test";
import { OWNER_FAQ } from "@/features/demo/owner-journey";
import { brandFamily, familyCounts } from "./brand-family";
import {
  FAQ,
  PAGE_FAQ,
  PARTNER_HERO,
  PARTNER_META,
  PARTNER_PAGE_LINK,
  PARTNER_SECTIONS,
  PARTNER_STRENGTHS,
  PENDING_STRENGTHS,
  PROCESS_DETAILS,
  PROCESS_STEPS,
  familyLine,
} from "./partner-page-content";
import { PARTNER_PAGE, consultationHref, partnerPageHref } from "./routes";
import { FRANCHISE_BRANDS, SERVICE_VISUAL_COPY } from "./service-visuals";
import { existsSync } from "node:fs";
import { join } from "node:path";

/** Every text the partner page draws that is not the client's own (labels, headings, the proposed hero, steps). */
const DRAWN_DRAFTS = JSON.stringify([PARTNER_HERO, PARTNER_META, PARTNER_PAGE_LINK, PARTNER_SECTIONS, PARTNER_STRENGTHS.map((s) => s.label), PROCESS_STEPS]);

test("the page's own wording states no figure, percentage, return, guarantee or experience", () => {
  const text = DRAWN_DRAFTS.toLowerCase();
  assert.doesNotMatch(text, /\d/, "no digits: every figure comes from the records");
  for (const word of ["%", "lợi nhuận", "cam kết", "đảm bảo", "kinh nghiệm", "hàng đầu", "guarantee", "return", "profit", "experience", "leading", "years"]) {
    assert.ok(!text.includes(word), word);
  }
});

test("the FAQ index names the client's questions", () => {
  assert.match(OWNER_FAQ[FAQ.performance]!.q.vi, /gia tăng hiệu quả kinh doanh/);
  assert.match(OWNER_FAQ[FAQ.process]!.q.vi, /Quy trình hợp tác/);
  assert.match(OWNER_FAQ[FAQ.propertyTypes]!.q.vi, /loại hình bất động sản/);
  assert.match(OWNER_FAQ[FAQ.franchising]!.q.vi, /Nhượng quyền/);
});

test("strengths quote the client's FAQ 3 sentence by sentence, in both languages", () => {
  const source = OWNER_FAQ[FAQ.performance]!.a;
  const quoted = PARTNER_STRENGTHS.filter((s) => s.status === "from-client");
  assert.equal(quoted.length, 2);
  for (const point of quoted) {
    assert.notEqual(point.text, "records");
    if (point.text === "records") continue;
    for (const lang of ["vi", "en"] as const) {
      const text = point.text[lang]!;
      assert.ok(text.length > 40, `${point.id} ${lang} not empty`);
      // Only the opening link words may be cut; the rest is verbatim.
      assert.ok(source[lang]!.toLowerCase().includes(text.slice(1).toLowerCase()), `${point.id} ${lang} is client text`);
    }
  }
  assert.equal(PARTNER_STRENGTHS.filter((s) => s.text === "records").length, 1);
});

test("pending strengths and partnership details are documented, not drawn", () => {
  assert.ok(PENDING_STRENGTHS.length >= 3);
  for (const group of PROCESS_DETAILS) assert.equal(group.items.length, 0, `${group.id} stays empty until VNest supplies it`);
});

test("the three steps restate FAQ 6 (English sentence by sentence)", () => {
  const faq6 = OWNER_FAQ[FAQ.process]!.a.en!.toLowerCase();
  assert.equal(PROCESS_STEPS.length, 3);
  assert.ok(faq6.includes(PROCESS_STEPS[0]!.text.en!.toLowerCase().replace(/\.$/, "")));
  assert.ok(faq6.includes("reviews the property and the surrounding market"));
  assert.ok(faq6.includes("proposes a suitable model and scope of work"));
});

test("the page's FAQ shows client questions not used elsewhere on it", () => {
  assert.deepEqual(PAGE_FAQ, [OWNER_FAQ[FAQ.propertyTypes], OWNER_FAQ[FAQ.notStarted], OWNER_FAQ[FAQ.franchising]]);
  assert.ok(!PAGE_FAQ.includes(OWNER_FAQ[FAQ.performance]!) && !PAGE_FAQ.includes(OWNER_FAQ[FAQ.process]!));
});

test("franchising is Bare Boutique Stays and Pepper House only; the family has all three brands", () => {
  assert.deepEqual(
    FRANCHISE_BRANDS.map((b) => b.id),
    ["bare", "pepper-house"],
  );
  const family = brandFamily();
  // The homepage's brand order; the franchise flag stays in the data although the ecosystem no longer draws it.
  assert.deepEqual(
    family.map((b) => [b.id, b.franchise]),
    [
      ["bare", true],
      ["pepper-house", true],
      ["the-nang", false],
    ],
  );
  assert.ok(family.every((b) => b.stays.length > 0 && b.cities.length > 0), "stays and cities kept for later use");
  const counts = familyCounts(family, "vi");
  assert.equal(counts.stays, 6);
  assert.equal(
    familyLine("vi", { ...counts, names: family.map((b) => b.name) }),
    "Bare Boutique Stays, Pepper House và The Nắng Suites: 6 nơi ở tại TP. Hồ Chí Minh và Đà Nẵng.",
  );
  assert.equal(
    familyLine("en", { ...familyCounts(family, "en"), names: family.map((b) => b.name) }),
    "Bare Boutique Stays, Pepper House and The Nắng Suites: 6 stays in Ho Chi Minh City and Da Nang.",
  );
});

test("links: the partner page keeps the language; service CTAs carry their service to a form", () => {
  assert.equal(partnerPageHref("vi"), PARTNER_PAGE);
  assert.equal(partnerPageHref("en"), `${PARTNER_PAGE}?lang=en`);
  assert.equal(consultationHref("van-hanh", "vi"), "/dev/demo?intro=0&dich-vu=van-hanh#tu-van");
  assert.equal(consultationHref("nhuong-quyen", "en", PARTNER_PAGE), `${PARTNER_PAGE}?dich-vu=nhuong-quyen&lang=en#tu-van`);
});

test("the ecosystem gives each brand the same structure: an official mark and its name, which together spell it", () => {
  const family = brandFamily();
  for (const brand of family) {
    assert.ok(existsSync(join(process.cwd(), "public", brand.logo.src)), `${brand.id}: logo file exists`);
    assert.ok(brand.logo.src.includes("/official-logos/"), `${brand.id}: official artwork`);
    assert.ok(brand.logo.optical > 0.3 && brand.logo.optical <= 1, `${brand.id}: optical factor`);
    // What the mark spells plus the caption is the brand's name.
    assert.equal(`${brand.logo.alt} ${brand.logo.caption}`.trim(), brand.name, `${brand.id}: full name`);
  }
  assert.deepEqual(
    family.map((b) => [b.id, b.logo.alt, b.logo.caption]),
    [
      ["bare", "Bare", "Boutique Stays"],
      ["pepper-house", "", "Pepper House"],
      ["the-nang", "", "The Nắng Suites"],
    ],
  );
});

test("no caption is written over the service photograph", () => {
  assert.ok(!("photoNote" in SERVICE_VISUAL_COPY));
});
