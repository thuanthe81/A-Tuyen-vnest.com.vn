import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { clientCollection } from "@/app/dev/brand-collection/client/adapter";
import { CITIES, type BrandId, type CityId } from "@/app/dev/brand-collection/data";
import { matches, NO_FILTERS, reduce, type FilterAction, type FilterState } from "@/app/dev/brand-collection/filter";
import { BRAND_ORDER } from "./brand-showcase";
import { COMING_SOON_BRANDS, COMING_SOON_COPY, comingSoonFor, comingSoonHref } from "./coming-soon";
import { cityAfterTap, cityChips, inBrandOrder } from "./discovery";

const content = clientCollection();
const run = (...actions: FilterAction[]) => actions.reduce<FilterState>((state, action) => reduce(content, state, action), NO_FILTERS);
const states = (brand: BrandId | null, city: CityId | null = null) => Object.fromEntries(cityChips(content.properties, { brand, city }).map((chip) => [chip.id, chip.state]));

describe("Discovery filters (Phase C, 7/11/2026; revised 8/11/2026)", () => {
  it("starts with all six real stays and no city selected", () => {
    assert.equal(matches(content.properties, NO_FILTERS).length, 6);
    assert.deepEqual(states(null), { "ho-chi-minh": "available", "da-nang": "available" });
  });

  it("offers only the two real cities, with no 'all cities' option", () => {
    assert.deepEqual(cityChips(content.properties, NO_FILTERS).map((chip) => chip.name), ["TP. Hồ Chí Minh", "Đà Nẵng"]);
    assert.equal(CITIES.length, 2);
  });

  it("shows availability per brand without selecting a city", () => {
    assert.deepEqual(states("bare"), { "ho-chi-minh": "available", "da-nang": "available" });
    assert.deepEqual(states("pepper-house"), { "ho-chi-minh": "only", "da-nang": "unavailable" });
    assert.deepEqual(states("the-nang"), { "ho-chi-minh": "unavailable", "da-nang": "only" });
  });

  it("keeps an active filter apart from an availability hint", () => {
    assert.deepEqual(states("pepper-house", "ho-chi-minh"), { "ho-chi-minh": "active", "da-nang": "unavailable" });
    assert.deepEqual(states(null, "da-nang"), { "ho-chi-minh": "available", "da-nang": "active" });
  });

  it("clears the active city when it is tapped again; an unavailable city does nothing", () => {
    const [hcm, dn] = cityChips(content.properties, { brand: "pepper-house", city: "ho-chi-minh" });
    assert.equal(cityAfterTap(hcm!), null);
    assert.equal(cityAfterTap(dn!), undefined);
    assert.equal(cityAfterTap(cityChips(content.properties, { brand: "bare", city: null })[1]!), "da-nang");
  });

  it("never leaves an unexplained empty list: a brand without stays in the chosen city drops the city and says so", () => {
    const state = run({ type: "city", city: "da-nang" }, { type: "brand", brand: "pepper-house" });
    assert.equal(state.city, null);
    assert.match(state.note ?? "", /Pepper House chưa có nơi ở tại Đà Nẵng/);
    assert.deepEqual(matches(content.properties, state).map((p) => p.id), ["pepper-house"]);
  });

  it("every choosable brand × city combination has stays", () => {
    for (const brand of [null, ...BRAND_ORDER]) {
      for (const chip of cityChips(content.properties, { brand, city: null })) {
        const city = cityAfterTap(chip);
        if (city === undefined) continue;
        assert.ok(matches(content.properties, { brand, city, area: null }).length > 0, `${brand ?? "Tất cả"} × ${chip.name}`);
      }
    }
  });

  it("lists the real stays in the approved brand order, keeping their order within a brand", () => {
    assert.deepEqual(inBrandOrder(content.properties).map((p) => p.id), ["bare-chic", "bare-hyphen", "bare-da-kao", "bare-han", "pepper-house", "the-nang-suites"]);
  });
});

describe("Coming Soon is presentation only, never inventory", () => {
  it("has one teaser per brand, in brand order, and none of them is a property", () => {
    assert.deepEqual(COMING_SOON_BRANDS, BRAND_ORDER);
    const ids = new Set(content.properties.map((p) => p.id));
    for (const brand of COMING_SOON_BRANDS) assert.ok(!ids.has(`coming-soon-${brand}`));
    assert.equal(content.properties.length, 6);
  });

  it("belongs to one brand: none with 'Tất cả', the chosen brand's otherwise (owner, 8/11/2026)", () => {
    assert.equal(comingSoonFor(NO_FILTERS), null);
    for (const brand of BRAND_ORDER) assert.equal(comingSoonFor({ brand }), brand);
  });

  it("leads only to a confirmed brand website, never a guess or a stand-in", () => {
    for (const brand of BRAND_ORDER) assert.equal(comingSoonHref(brand), null, `${brand}: no website confirmed yet, so no link`);
    const confirmed = { bare: { url: "https://bare.example", source: "test", checked: "test" }, "pepper-house": null, "the-nang": null };
    assert.equal(comingSoonHref("bare", confirmed), "https://bare.example");
    assert.equal(comingSoonHref("pepper-house", confirmed), null);
  });

  it("states nothing invented: no dates, prices, room counts, cities or booking words", () => {
    const text = JSON.stringify(COMING_SOON_COPY);
    assert.doesNotMatch(text, /\d/, "no numbers (dates, prices, counts)");
    assert.doesNotMatch(text, /Hồ Chí Minh|Đà Nẵng|Ho Chi Minh|Da Nang|Quận|District/i, "no cities");
    assert.doesNotMatch(text, /book now|đặt ngay|còn phòng|availability|giá/i, "no booking or availability");
  });
});
