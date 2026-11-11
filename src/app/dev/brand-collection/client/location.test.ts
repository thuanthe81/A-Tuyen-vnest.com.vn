import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readClientProperties, RULES } from "@/content/vnest-workbook/records";
import { clientCollection } from "./adapter";
import { LOCATION_EVIDENCE } from "@/content/vnest-workbook/location-evidence";
import { ROWS } from "@/content/vnest-workbook/workbook";

const records = readClientProperties();
const content = clientCollection(records);
const record = (id: string) => records.find((r) => r.id === id)!;
const card = (id: string) => content.properties.find((p) => p.id === id)!.location!;

describe("location: card labels", () => {
  it("shows city · former district where a source names it, else the city alone", () => {
    assert.deepEqual(
      content.properties.map((p) => [p.id, p.location!.label]),
      [
        ["bare-chic", "TP.HCM · Quận 1"],
        ["bare-hyphen", "TP.HCM"],
        ["bare-da-kao", "TP.HCM"],
        ["bare-han", "Đà Nẵng · Hải Châu"],
        ["the-nang-suites", "Đà Nẵng · Sơn Trà"],
        ["pepper-house", "TP.HCM · Quận 1"],
      ],
    );
  });

  it("backs every area label with at least one independent source, and never infers one", () => {
    for (const r of records) {
      const area = r.location.area;
      assert.equal(area.raw, null, "the workbook has no former district");
      if (area.display) {
        assert.equal(area.status, "corroborated");
        assert.equal(area.rule, RULES.formerDistrict);
        assert.ok((area.evidence ?? []).length > 0, `${r.id}: no evidence`);
        assert.ok(area.evidence!.every((e) => e.url.startsWith("https://") && e.says && e.checked === "2026-10-19"));
      } else assert.equal(area.status, "missing");
    }
    // A current ward name alone never produces a label: Bare Hyphen and Bare Đa Kao are in
    // "Phường Sài Gòn" and "phường Tân Định" but no source names their former district.
    assert.equal(record("bare-hyphen").location.area.display, null);
    assert.equal(record("bare-da-kao").location.area.display, null);
    assert.equal(record("bare-hyphen").location.area.clarification, "Q20");
  });

  it("keeps the area out of the Area filter", () => {
    assert.ok(content.properties.every((p) => p.area === null));
    assert.deepEqual(content.areas, []);
  });
});

describe("location: panel contents", () => {
  it("splits the supplied address into street and ward + city, keeping the raw cell", () => {
    for (const r of records) {
      const raw = ROWS.find((row) => row.row === r.rows[0])!.I!;
      assert.equal(r.location.address.raw, raw);
      assert.equal(r.location.ward.raw, raw);
      if (r.location.street.display) assert.equal(`${r.location.street.display}, ${r.location.ward.display}`, raw.trim());
    }
    assert.deepEqual([card("bare-chic").street, card("bare-chic").ward], ["12/18 Nguyễn Thị Minh Khai", "Phường Sài Gòn, Hồ Chí Minh"]);
    assert.deepEqual([card("bare-da-kao").street, card("bare-da-kao").ward], ["14/3 Nguyễn Đình Chiểu", "phường Tân Định, TP HCM"]);
  });

  it("hides The Nắng Suites' house number while it conflicts with an outside source", () => {
    const street = record("the-nang-suites").location.street;
    assert.deepEqual([street.status, street.display, street.clarification], ["conflict", null, "Q19"]);
    assert.ok(street.raw!.includes("K174/31"), "the raw value is kept as supplied");
    assert.equal(card("the-nang-suites").note, "Số nhà đang chờ VNest xác nhận · Phường hiện hành chờ VNest xác nhận.");
  });

  it("marks what is unconfirmed, and nothing where everything matches", () => {
    assert.equal(card("bare-chic").note, null);
    assert.equal(card("pepper-house").note, null);
    assert.equal(card("bare-da-kao").note, "Địa chỉ theo VNest, chưa đối chiếu được · Đường dẫn bản đồ chờ VNest xác nhận.");
    assert.match(card("bare-han").note!, /Phường hiện hành chờ VNest xác nhận/);
  });
});

describe("location: map links", () => {
  it("offers a map link only when the workbook link is free of conflict and resolves to the property's place", () => {
    for (const r of records) {
      const map = r.location.mapUrl;
      if (map.display) {
        assert.equal(map.status, "corroborated");
        assert.equal(map.display, r.map.display);
        assert.match(map.evidence![0]!.says, new RegExp(LOCATION_EVIDENCE[r.id]!.mapResolvesTo.kgmid));
      }
    }
    assert.deepEqual(
      content.properties.filter((p) => p.location!.mapUrl).map((p) => p.id),
      ["bare-chic", "bare-han", "the-nang-suites", "pepper-house"],
    );
  });

  it("withholds Bare Đa Kao's map in v2: a hyperlink record over J12 opens Bare Hyphen's link", () => {
    const map = record("bare-da-kao").location.mapUrl;
    assert.deepEqual([map.status, map.display, map.clarification], ["conflict", null, "Q22"]);
    assert.equal(card("bare-da-kao").mapUrl, null);
  });

  it("withholds Bare Hyphen's map: the cell text and its hyperlink point at different places", () => {
    const map = record("bare-hyphen").location.mapUrl;
    assert.deepEqual([map.status, map.display, map.clarification], ["conflict", null, "Q4"]);
    assert.equal(card("bare-hyphen").mapUrl, null);
    assert.equal(card("bare-hyphen").note, "Đường dẫn bản đồ chờ VNest xác nhận.");
  });
});
