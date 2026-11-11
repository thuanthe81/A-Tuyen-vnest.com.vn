import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { readClientProperties } from "@/content/vnest-workbook/records";
import { cardPrices, indicativeCandidate, priceText, resolvePrice, roomRate, weekdayFigure, weekendFigure, type ApprovedFromPrice, type PmsQuote } from "@/content/vnest-workbook/pricing";
import { RATE_CELLS } from "@/content/vnest-workbook/rates";

const records = readClientProperties();
const rows = (id: string) => records.find((r) => r.id === id)!.rows;
const candidate = (id: string) => indicativeCandidate(rows(id))!;
const quote: PmsQuote = { amount: 2400000, currency: "VND", nights: 2, checkIn: "2026-11-02", checkOut: "2026-11-04", taxIncluded: null };
const approved: ApprovedFromPrice = { amount: 900000, currency: "VND", unit: null, taxIncluded: null, approvedOn: "test" };

describe("pricing: provisional candidates from the workbook", () => {
  it("takes the lowest weekday figure per property, with its exact source cell", () => {
    const expected: Record<string, [string, string]> = {
      "bare-chic": ["1,100,000", "L4"],
      "bare-hyphen": ["1,000,000", "L8"],
      "bare-da-kao": ["1,000,000", "L12"],
      "bare-han": ["1,110,000", "L17"],
      "the-nang-suites": ["840,000", "L20"],
      "pepper-house": ["1,215,000", "L24"],
    };
    for (const [id, [raw, cell]] of Object.entries(expected)) {
      const c = candidate(id);
      assert.deepEqual([c.raw, c.source[0]!.cell, c.source[0]!.sheet], [raw, cell, "Tổng quan 6 cơ sở"], id);
      // The figure is a substring of its cell, exactly as written.
      assert.ok(RATE_CELLS.find((x) => x.cell === cell)!.raw.includes(`Ngày thường: ${raw}`), id);
    }
  });

  it("gives a rate only to the room whose own cell states it: 14 rooms have one, 8 have none", () => {
    const all = records.flatMap((r) => r.rows).map(roomRate);
    assert.equal(all.length, 22);
    assert.deepEqual(
      all.filter((rate) => rate.kind === "missing").map((rate) => rate.row),
      [5, 6, 7, 9, 10, 14, 19, 25],
    );
    // A merge drawn over a room never lends it the first row's figure; it is named, for Q24.
    const chicTwo = roomRate(5);
    assert.deepEqual([chicTwo.kind, chicTwo.kind === "missing" && chicTwo.underMergeOf], ["missing", "L4"]);
    const chicOne = roomRate(4);
    assert.ok(chicOne.kind === "stated");
    assert.deepEqual([chicOne.weekday, chicOne.weekend, chicOne.source[0]!.cell, chicOne.drawnOver], ["1,100,000", "1,200,000", "L4", [5, 6, 7]]);
    assert.deepEqual(chicOne.clarifications, ["Q8", "Q24"]);
    const yellow = roomRate(20);
    assert.ok(yellow.kind === "stated" && yellow.drawnOver.length === 0 && yellow.weekend === "940,000");
  });

  it("keeps the card figures of 17/10 and reports rooms without their own rate in the data, not in the card text", () => {
    assert.deepEqual(candidate("bare-chic").missingRows, [5, 6, 7]);
    assert.deepEqual(candidate("bare-hyphen").missingRows, [9, 10]);
    assert.deepEqual(candidate("bare-da-kao").missingRows, [14]);
    assert.deepEqual(candidate("bare-han").missingRows, [19]);
    assert.deepEqual(candidate("the-nang-suites").missingRows, []);
    assert.deepEqual(candidate("pepper-house").missingRows, [25]);
    assert.deepEqual(candidate("bare-hyphen").clarifications, ["Q7", "Q8"]);
    assert.deepEqual(priceText({ kind: "unverified", candidate: candidate("bare-hyphen") }), { label: "Giá tham khảo", amount: "1,000,000", note: null });
  });

  it("returns no candidate when no room has a rate", () => {
    assert.equal(indicativeCandidate([9, 10]), null);
    assert.equal(weekdayFigure("Ngày cuối tuần: 1,200,000"), null);
    assert.equal(weekendFigure("Ngày thường: 1,100,000"), null);
  });
});

describe("pricing: presentation states and precedence", () => {
  const c = candidate("bare-chic");

  it("puts a verified PMS quote first, then an approved price, then the private-preview figure", () => {
    assert.equal(resolvePrice({ quote, approved, candidate: c, audience: "private-preview" }).kind, "quote");
    assert.equal(resolvePrice({ quote, approved, candidate: c, audience: "public" }).kind, "quote");
    assert.equal(resolvePrice({ approved, candidate: c, audience: "public" }).kind, "from");
    assert.equal(resolvePrice({ candidate: c, audience: "private-preview" }).kind, "unverified");
  });

  it("never shows an unapproved figure to the public", () => {
    assert.deepEqual(resolvePrice({ candidate: c, audience: "public" }), { kind: "unavailable", reason: "not-approved" });
    assert.deepEqual(resolvePrice({ audience: "private-preview" }), { kind: "unavailable", reason: "no-data" });
    const pub = cardPrices("public", records);
    assert.equal(Object.keys(pub).length, 6);
    for (const price of Object.values(pub)) assert.deepEqual(priceText(price), { label: null, amount: null, note: "Xem giá theo ngày" });
    assert.ok(!/\d/.test(JSON.stringify(Object.values(pub).map(priceText))), "no digit in any public card");
  });

  it("shows the private-preview figure as written, with no currency, unit or tax", () => {
    const text = priceText(resolvePrice({ candidate: c, audience: "private-preview" }));
    assert.deepEqual(text, { label: "Giá tham khảo", amount: "1,100,000", note: null });
    assert.ok(!/₫|VND|đồng|đêm|thuế|giá từ/i.test(JSON.stringify(text)));
  });

  it("supports the approved 'Giá từ' form, adding only confirmed attributes", () => {
    const plain = priceText({ kind: "from", price: approved });
    assert.equal(plain.label, "Giá từ");
    assert.match(plain.amount!, /^900\.000\s₫$/);
    assert.equal(plain.note, null);
    assert.equal(priceText({ kind: "from", price: { ...approved, unit: "night", taxIncluded: true } }).note, "mỗi đêm · đã gồm thuế");
  });

  it("shows a date-specific quote as such", () => {
    const text = priceText({ kind: "quote", quote });
    assert.equal(text.label, "Giá cho ngày đã chọn");
    assert.match(text.amount!, /^2\.400\.000\s₫$/);
    assert.equal(text.note, "2 đêm");
  });
});

describe("pricing: kept apart", () => {
  it("leaves the content adapter without prices and imports nothing from booking or the PMS", () => {
    const content = "../../../../content/vnest-workbook/";
    // The workbook records (and the Brand Collection projection) carry no price.
    for (const file of [content + "records.ts", "./adapter.ts"]) assert.ok(!/from "[^"]*(rates|pricing)"/.test(readFileSync(new URL(file, import.meta.url), "utf8")), file);
    for (const file of [content + "pricing.ts", content + "rates.ts", "./PriceArea.tsx"]) {
      const source = readFileSync(new URL(file, import.meta.url), "utf8");
      assert.ok(!/integrations\/booking|from "@\/(booking|integrations)/.test(source), `${file} imports booking code`);
    }
  });
});
