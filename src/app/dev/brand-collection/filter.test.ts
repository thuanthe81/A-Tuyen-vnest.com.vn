import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { collection } from "./data";
import { counts, fromSearch, matches, NO_FILTERS, reduce, summary, toSearch, type FilterAction, type FilterState } from "./filter";

const verified = collection("verified");
const sample = collection("sample");
const run = (context: typeof verified, ...actions: FilterAction[]) => actions.reduce<FilterState>((state, action) => reduce(context, state, action), NO_FILTERS);
const names = (context: typeof verified, state: FilterState) => matches(context.properties, state).map((property) => property.name);

describe("brand collection filters", () => {
  it("shows all six properties by default", () => {
    assert.equal(matches(verified.properties, NO_FILTERS).length, 6);
  });

  it("shows exactly the four Bare properties when Bare is chosen", () => {
    assert.deepEqual(names(verified, run(verified, { type: "brand", brand: "bare" })), ["Bare Chic", "Bare Hyphen", "Bare Đa Kao", "Bare Hàn"]);
  });

  it("counts brands and cities against the other filters", () => {
    const c = counts(verified, run(verified, { type: "city", city: "da-nang" }));
    assert.deepEqual([c.brand("bare"), c.brand("the-nang"), c.brand("pepper-house"), c.allBrands], [1, 1, 0, 2]);
    const b = counts(verified, run(verified, { type: "brand", brand: "bare" }));
    assert.deepEqual([b.city("ho-chi-minh"), b.city("da-nang"), b.allCities], [3, 1, 4]);
  });

  it("combines brand and city", () => {
    assert.deepEqual(names(verified, run(verified, { type: "brand", brand: "bare" }, { type: "city", city: "da-nang" })), ["Bare Hàn"]);
    assert.deepEqual(names(verified, run(verified, { type: "city", city: "ho-chi-minh" }, { type: "brand", brand: "bare" })), ["Bare Chic", "Bare Hyphen", "Bare Đa Kao"]);
  });

  it("never reaches an empty list: the latest choice clears a conflicting one, with a note", () => {
    const brandAfterCity = run(verified, { type: "city", city: "da-nang" }, { type: "brand", brand: "pepper-house" });
    assert.equal(brandAfterCity.city, null);
    assert.deepEqual(names(verified, brandAfterCity), ["Pepper House"]);
    assert.match(brandAfterCity.note ?? "", /Pepper House chưa có nơi ở tại Đà Nẵng/);

    const cityAfterBrand = run(verified, { type: "brand", brand: "pepper-house" }, { type: "city", city: "da-nang" });
    assert.equal(cityAfterBrand.brand, null);
    assert.deepEqual(names(verified, cityAfterBrand), ["Bare Hàn", "The Nắng Suites"]);
  });

  it("has no area to offer while areas are unverified", () => {
    assert.equal(counts(verified, NO_FILTERS).areaOptions.length, 0);
  });

  it("with sample areas, an area chooses its city and a new city drops it", () => {
    const area = run(sample, { type: "area", area: "mau-2" });
    assert.equal(area.city, "ho-chi-minh");
    assert.deepEqual(names(sample, area), ["Bare Hyphen", "Pepper House"]);
    assert.equal(run(sample, { type: "area", area: "mau-2" }, { type: "city", city: "da-nang" }).area, null);
    assert.deepEqual(counts(sample, run(sample, { type: "city", city: "da-nang" })).areaOptions.map((a) => a.id), ["mau-3"]);
  });

  it("reset clears everything", () => {
    assert.deepEqual(run(verified, { type: "brand", brand: "bare" }, { type: "city", city: "da-nang" }, { type: "reset" }), NO_FILTERS);
  });

  it("reads and writes the address, ignoring unknown values", () => {
    assert.deepEqual(fromSearch("?brand=bare&city=da-nang&x=1"), { brand: "bare", city: "da-nang", area: null });
    assert.deepEqual(fromSearch("?brand=nope&city=hanoi"), { brand: null, city: null, area: null });
    assert.equal(toSearch("?areas=sample&brand=the-nang", { brand: "bare", city: null, area: null }), "?areas=sample&brand=bare");
  });

  it("loading a contradictory address drops the brand rather than showing nothing", () => {
    const state = run(verified, { type: "load", filters: { brand: "pepper-house", city: "da-nang", area: "unknown" } });
    assert.deepEqual([state.brand, state.city, state.area], [null, "da-nang", null]);
  });

  it("summarises what is shown", () => {
    assert.equal(summary(verified, NO_FILTERS, 6), "Tất cả 6 nơi ở");
    assert.equal(summary(verified, { brand: "bare", city: "da-nang", area: null }, 1), "1 nơi ở · Bare Boutique Stays · Đà Nẵng");
  });
});
