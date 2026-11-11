import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { collection, type BrandId, type CityId } from "../data";
import { counts, fromSearch, matches, NO_FILTERS, reduce, summary, type Context, type FilterAction, type FilterState } from "../filter";
import { readClientProperties, RULES, slug } from "@/content/vnest-workbook/records";
import { clientCollection } from "./adapter";
import { PHOTOGRAPHY_AUTHORISED, PROPOSED_IMAGES } from "@/content/vnest-workbook/media";
import type { Sourced } from "@/content/vnest-workbook/sourced";
import { ROWS, type WorkbookRow } from "@/content/vnest-workbook/workbook";

const records = readClientProperties();
const content = clientCollection(records);
const context: Context = content;
const run = (...actions: FilterAction[]) => actions.reduce<FilterState>((state, action) => reduce(context, state, action), NO_FILTERS);
const ids = (state: FilterState) => matches(content.properties, state).map((property) => property.id);
const record = (id: string) => records.find((r) => r.id === id)!;
const cell = (ref: string) => {
  const [, column, row] = /^([A-Z])(\d+)$/.exec(ref)!;
  return (ROWS.find((r) => r.row === Number(row)) as Record<string, unknown> | undefined)?.[column!];
};

describe("client content: the six properties", () => {
  it("reads six properties from 22 rows, in workbook order, with the mock's ids", () => {
    assert.equal(ROWS.length, 22);
    assert.deepEqual(
      records.map((r) => r.id),
      collection("verified").properties.map((p) => p.id),
    );
    assert.deepEqual(
      records.map((r) => r.rows.length),
      [4, 4, 4, 4, 4, 2],
    );
  });

  it("shows short names on cards and keeps the complete official names", () => {
    assert.deepEqual(
      content.properties.map((p) => p.name),
      ["Bare Chic", "Bare Hyphen", "Bare Đa Kao", "Bare Hàn", "The Nắng Suites", "Pepper House"],
    );
    assert.deepEqual(
      records.map((r) => r.officialName.display),
      ["Bare Chic - Bare Boutique Stays", "Bare Hyphen - Bare Boutique Stays", "Bare Đa Kao - Bare Boutique Stays", "Bare Hàn - Bare Boutique Stays", "The Nắng Suites", "Pepper House"],
    );
    for (const r of records.slice(0, 4)) assert.deepEqual([r.name.status, r.name.rule, r.name.clarification], ["normalized", RULES.shortName, "Q13"]);
    for (const r of records.slice(4)) assert.equal(r.name.status, "client-supplied");
  });

  it("maps three brands, with their properties", () => {
    assert.deepEqual(
      content.brands.map((b) => [b.id, b.name, b.logo]),
      [
        ["bare", "Bare Boutique Stays", null],
        ["the-nang", "The Nắng Suites", null],
        ["pepper-house", "Pepper House", null],
      ],
    );
    const byBrand = (brand: BrandId) => content.properties.filter((p) => p.brand === brand).map((p) => p.id);
    assert.deepEqual(byBrand("bare"), ["bare-chic", "bare-hyphen", "bare-da-kao", "bare-han"]);
    assert.deepEqual(byBrand("the-nang"), ["the-nang-suites"]);
    assert.deepEqual(byBrand("pepper-house"), ["pepper-house"]);
  });

  it("reads cities from the addresses", () => {
    const byCity = (city: CityId) => content.properties.filter((p) => p.city === city).map((p) => p.id);
    assert.deepEqual(byCity("ho-chi-minh"), ["bare-chic", "bare-hyphen", "bare-da-kao", "pepper-house"]);
    assert.deepEqual(byCity("da-nang"), ["bare-han", "the-nang-suites"]);
    for (const r of records) assert.deepEqual([r.city.status, r.city.rule], ["derived", RULES.city]);
  });

  it("has no areas, so the Area control is hidden", () => {
    assert.deepEqual(content.areas, []);
    assert.ok(content.properties.every((p) => p.area === null));
  });
});

describe("client content: traceability", () => {
  const values = (r: (typeof records)[number]): [string, Sourced<unknown>][] => Object.entries(r).filter(([, v]) => v && typeof v === "object" && "status" in v) as [string, Sourced<unknown>][];

  it("gives every value a source cell in the workbook and a status", () => {
    for (const r of records) {
      for (const [key, value] of values(r)) {
        assert.ok(value.source.length > 0, `${r.id}.${key} has no source`);
        for (const ref of value.source) {
          assert.equal(ref.sheet, "Tổng quan 6 cơ sở");
          assert.ok(cell(ref.cell) !== undefined || value.status === "missing", `${r.id}.${key}: ${ref.cell} is not in the snapshot`);
        }
        if (value.status === "normalized" || value.status === "derived") assert.ok(value.rule, `${r.id}.${key} has no rule`);
        assert.notEqual(value.status, "confirmed", "nothing is confirmed by VNest yet");
      }
    }
  });

  it("keeps raw values exactly as in the workbook", () => {
    for (const r of records) {
      assert.equal(r.officialName.raw, cell(r.officialName.source[0]!.cell));
      assert.equal(r.address.raw, cell(r.address.source[0]!.cell));
      assert.equal(r.description.raw, cell(r.description.source[0]!.cell));
    }
    // Stray whitespace stays in the raw value; only the display value is trimmed, by a rule.
    assert.equal(record("bare-hyphen").address.raw, "29A/18 Nguyễn Đình Chiểu, Phường Sài Gòn, Hồ Chí Minh\r\n\r\n");
    assert.deepEqual([record("bare-hyphen").address.display, record("bare-hyphen").address.rule], ["29A/18 Nguyễn Đình Chiểu, Phường Sài Gòn, Hồ Chí Minh", RULES.trimmed]);
  });

  it("detects the workbook's contradictions from the data, and shows none of them", () => {
    // v2 (20/10): two hyperlink records over J12; the range record opens Bare Hyphen's link (Q22).
    const daKao = record("bare-da-kao");
    assert.deepEqual([daKao.map.status, daKao.map.display, daKao.map.clarification], ["conflict", null, "Q22"]);
    assert.ok(daKao.map.raw!.includes("https://share.google/YV37L6mKA2VrWBO2S"), "raw keeps every record, uncorrected");
    // J8: the range record matches the text, the cell record still opens Bare Chic (Q4).
    const hyphen = record("bare-hyphen");
    assert.deepEqual([hyphen.map.status, hyphen.map.display, hyphen.map.clarification], ["conflict", null, "Q4"]);
    assert.equal(record("bare-chic").map.status, "client-supplied");

    // A repeated description would still be caught; v2 has none.
    assert.ok(records.every((r) => r.description.status === "client-supplied"));
  });

  it("v2 gives Bare Hàn its own description and The Nắng Suites its own photo folders", () => {
    const han = record("bare-han");
    assert.ok(!han.description.raw!.includes("Bare Đa Kao"), "no longer Bare Đa Kao's text");
    assert.deepEqual([han.description.status, han.description.clarification], ["client-supplied", "Q27"]);
    for (const id of ["bare-han", "the-nang-suites"]) {
      assert.deepEqual(record(id).picture.sharesFoldersWith, []);
      assert.deepEqual([record(id).photoFolders.status, record(id).picture.reason], ["client-supplied", "rights-pending"]);
    }
  });

  it("asks the Đà Nẵng address question and the description questions", () => {
    assert.deepEqual(
      records.filter((r) => r.address.clarification === "Q14").map((r) => r.id),
      ["bare-han", "the-nang-suites"],
    );
    assert.equal(record("the-nang-suites").description.clarification, "Q27");
    assert.equal(record("pepper-house").description.clarification, "Q26");
  });

  it("holds a map link when any hyperlink record over the cell disagrees with its text", () => {
    const base: WorkbookRow = { row: 99, B: "Nhà A - Bare Boutique Stays", C: "Phòng 1", D: "x", DLink: "https://drive.google.com/drive/folders/test", I: "1 Đường B, Hồ Chí Minh", J: "https://share.google/a" };
    const one = (row: WorkbookRow) => readClientProperties([row])[0]!;
    assert.throws(() => one({ ...base, JLink: "https://share.google/a" }), /no location evidence/, "an unknown property has no evidence record");
    const fake = { ...base, B: "Bare Chic - Bare Boutique Stays" };
    assert.equal(one({ ...fake, JLink: "https://share.google/a" }).map.status, "client-supplied");
    const split = one({ ...fake, JLink: "https://share.google/a", JLinkRecords: [{ ref: "J99", target: "https://share.google/b" }, { ref: "J99:J100", target: "https://share.google/a" }] });
    assert.deepEqual([split.map.status, split.map.display], ["conflict", null], "the record applied last matches, an earlier one does not");
  });

  it("leaves a name whole when its suffix is not a brand", () => {
    const row: WorkbookRow = { row: 99, B: "Nhà A - Chi nhánh 2", C: "Phòng 1", D: "x", DLink: "https://drive.google.com/drive/folders/test", I: "1 Đường B, Đà Nẵng" };
    assert.throws(() => readClientProperties([row]), /names no known brand/);
    assert.equal(slug("Bare Đa Kao"), "bare-da-kao");
    assert.equal(slug("The Nắng Suites"), "the-nang-suites");
  });
});

describe("client content: pictures", () => {
  it("gives every property a labelled placeholder; photographs are added only by photos.ts (G2)", () => {
    assert.equal(typeof PHOTOGRAPHY_AUTHORISED, "boolean");
    for (const p of content.properties) {
      assert.equal(p.picture.src, "/dev-fixtures/brand-collection/placeholder.svg");
      assert.ok(p.placeholder?.reason);
    }
    assert.deepEqual(
      content.properties.map((p) => p.placeholder!.reason),
      // v2: The Nắng Suites has folders of its own, so no property waits on a folder conflict now.
      ["Ảnh chờ cấp quyền sử dụng", "Ảnh chờ cấp quyền sử dụng", "Ảnh chờ cấp quyền sử dụng", "Ảnh chờ cấp quyền sử dụng", "Ảnh chờ cấp quyền sử dụng", "Ảnh chờ cấp quyền sử dụng"],
    );
  });

  it("keeps the proposed mapping for exactly the four properties it was made for", () => {
    assert.deepEqual(Object.keys(PROPOSED_IMAGES), ["bare-chic", "bare-hyphen", "bare-da-kao", "pepper-house"]);
    for (const r of records) {
      const proposed = r.picture.proposed;
      // Bare Hàn and The Nắng Suites: nothing proposed yet (their v2 folders were not reviewed).
      if (r.picture.reason === "folder-conflict" || !PROPOSED_IMAGES[r.id]) assert.equal(proposed.length, 0);
      else {
        assert.deepEqual(
          proposed.map((image) => image.role),
          ["primary", "alternate"],
        );
        for (const image of proposed) {
          assert.equal(image.rights, "client-supplied-unconfirmed");
          assert.equal(image.authorisation, null);
          // The proposed folder is one this property's own rows link to.
          for (const ref of image.linkedFrom) {
            const row = Number(ref.slice(1));
            assert.ok(r.rows.includes(row), `${image.file}: ${ref} is not a row of ${r.id}`);
            assert.ok(ROWS.find((x) => x.row === row)!.DLink.includes(image.folderId), `${image.file}: ${ref} does not link to ${image.folderId}`);
          }
        }
      }
    }
  });
});

describe("client content: static only", () => {
  it("carries no price, rate or availability", () => {
    const keys = new Set<string>();
    const walk = (value: unknown): void => {
      if (Array.isArray(value)) value.forEach(walk);
      else if (value && typeof value === "object")
        for (const [key, inner] of Object.entries(value)) {
          keys.add(key);
          walk(inner);
        }
    };
    walk({ records, content, ROWS });
    for (const key of keys) assert.ok(!/price|rate|availab|weekday|weekend|^L$/i.test(key), `found the key "${key}"`);
    // The workbook's indicative rates (column L) are not in the snapshot at all.
    const text = JSON.stringify(ROWS);
    for (const figure of ["1,100,000", "840,000", "Ngày thường", "Ngày cuối tuần"]) assert.ok(!text.includes(figure), `found "${figure}"`);
  });

  it("imports nothing from booking or the PMS", () => {
    const content = "../../../../content/vnest-workbook/";
    for (const file of ["./adapter.ts", "./ClientReviewBar.tsx", ...["records.ts", "media.ts", "sourced.ts", "workbook.ts", "details.ts", "property-details.ts", "location-evidence.ts"].map((f) => content + f)]) {
      const source = readFileSync(new URL(file, import.meta.url), "utf8");
      assert.ok(!/integrations\/booking|from "@\/(booking|integrations)/.test(source), `${file} imports booking code`);
    }
  });
});

describe("client content: combined brand and city filters", () => {
  const cases: [BrandId | null, CityId | null, string[]][] = [
    [null, null, ["bare-chic", "bare-hyphen", "bare-da-kao", "bare-han", "the-nang-suites", "pepper-house"]],
    [null, "ho-chi-minh", ["bare-chic", "bare-hyphen", "bare-da-kao", "pepper-house"]],
    [null, "da-nang", ["bare-han", "the-nang-suites"]],
    ["bare", null, ["bare-chic", "bare-hyphen", "bare-da-kao", "bare-han"]],
    ["bare", "ho-chi-minh", ["bare-chic", "bare-hyphen", "bare-da-kao"]],
    ["bare", "da-nang", ["bare-han"]],
    ["the-nang", null, ["the-nang-suites"]],
    ["the-nang", "ho-chi-minh", []],
    ["the-nang", "da-nang", ["the-nang-suites"]],
    ["pepper-house", null, ["pepper-house"]],
    ["pepper-house", "ho-chi-minh", ["pepper-house"]],
    ["pepper-house", "da-nang", []],
  ];

  it("matches all twelve brand × city combinations", () => {
    for (const [brand, city, expected] of cases) assert.deepEqual(matches(content.properties, { brand, city, area: null }), content.properties.filter((p) => expected.includes(p.id)), `${brand} × ${city}`);
  });

  it("counts each choice against the other filter", () => {
    const all = counts(context, NO_FILTERS);
    assert.deepEqual([all.total, all.allBrands, all.brand("bare"), all.brand("the-nang"), all.brand("pepper-house"), all.city("ho-chi-minh"), all.city("da-nang")], [6, 6, 4, 1, 1, 4, 2]);
    const hcm = counts(context, run({ type: "city", city: "ho-chi-minh" }));
    assert.deepEqual([hcm.allBrands, hcm.brand("bare"), hcm.brand("the-nang"), hcm.brand("pepper-house")], [4, 3, 0, 1]);
    const dn = counts(context, run({ type: "city", city: "da-nang" }));
    assert.deepEqual([dn.allBrands, dn.brand("bare"), dn.brand("the-nang"), dn.brand("pepper-house")], [2, 1, 1, 0]);
    const bare = counts(context, run({ type: "brand", brand: "bare" }));
    assert.deepEqual([bare.allCities, bare.city("ho-chi-minh"), bare.city("da-nang")], [4, 3, 1]);
  });

  it("combines choices in either order", () => {
    assert.deepEqual(ids(run({ type: "brand", brand: "bare" }, { type: "city", city: "da-nang" })), ["bare-han"]);
    assert.deepEqual(ids(run({ type: "city", city: "ho-chi-minh" }, { type: "brand", brand: "bare" })), ["bare-chic", "bare-hyphen", "bare-da-kao"]);
  });

  it("resolves conflicts by the latest choice, says so, and never shows an empty list", () => {
    const a = run({ type: "brand", brand: "the-nang" }, { type: "city", city: "ho-chi-minh" });
    assert.deepEqual([a.brand, a.city, a.note], [null, "ho-chi-minh", "The Nắng Suites chưa có nơi ở tại TP. Hồ Chí Minh, nên bộ lọc thương hiệu đã được bỏ."]);
    const b = run({ type: "brand", brand: "pepper-house" }, { type: "city", city: "da-nang" });
    assert.deepEqual([b.brand, b.city, ids(b)], [null, "da-nang", ["bare-han", "the-nang-suites"]]);
    const c = run({ type: "city", city: "da-nang" }, { type: "brand", brand: "pepper-house" });
    assert.deepEqual([c.brand, c.city, c.note], ["pepper-house", null, "Pepper House chưa có nơi ở tại Đà Nẵng, nên bộ lọc địa điểm đã được bỏ."]);
    assert.deepEqual(ids(c), ["pepper-house"]);
  });

  it("resets to all six", () => {
    assert.deepEqual(run({ type: "brand", brand: "bare" }, { type: "city", city: "da-nang" }, { type: "reset" }), NO_FILTERS);
  });

  it("loads a contradictory address into a valid state", () => {
    const state = run({ type: "load", filters: fromSearch("?brand=pepper-house&city=da-nang&area=mau-3") });
    assert.deepEqual([state.brand, state.city, state.area], [null, "da-nang", null]);
    assert.equal(ids(state).length, 2);
  });

  it("summarises with the workbook's brand names", () => {
    assert.equal(summary(context, NO_FILTERS, 6), "Tất cả 6 nơi ở");
    assert.equal(summary(context, { brand: "bare", city: "da-nang", area: null }, 1), "1 nơi ở · Bare Boutique Stays · Đà Nẵng");
  });
});
