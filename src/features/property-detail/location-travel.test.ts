import assert from "node:assert/strict";
import { test } from "node:test";
import { formatStartingRate, PUBLIC_STARTING_RATES, publicStartingRate } from "@/content/vnest-workbook/public-rates";
import { formatKm, LOCATION_TRAVEL, roundMinutes, transportModes } from "./location-travel";

test("location figures are the recorded Google Maps readings, shown rounded", () => {
  assert.deepEqual([LOCATION_TRAVEL["bare-chic"]!.km, LOCATION_TRAVEL["bare-chic"]!.minutes, LOCATION_TRAVEL["bare-chic"]!.airport.code], [9.5, 29, "SGN"]);
  assert.deepEqual([LOCATION_TRAVEL["bare-da-kao"]!.km, LOCATION_TRAVEL["bare-da-kao"]!.minutes, LOCATION_TRAVEL["bare-da-kao"]!.airport.code], [8.5, 21, "SGN"]);
  assert.deepEqual([LOCATION_TRAVEL["the-nang-suites"]!.km, LOCATION_TRAVEL["the-nang-suites"]!.minutes, LOCATION_TRAVEL["the-nang-suites"]!.airport.code], [5.9, 15, "DAD"]);
  assert.equal(formatKm(9.5), "9,5 km");
  assert.equal(formatKm(8.5), "8,5 km");
  assert.deepEqual([roundMinutes(29), roundMinutes(21), roundMinutes(15), roundMinutes(2)], [30, 20, 15, 5]);
});

test("transport comes from the workbook text, capitalised, nothing added", () => {
  assert.deepEqual(transportModes("Grab, đi bộ, xe bus"), ["Grab", "Đi bộ", "Xe bus"]);
  assert.deepEqual(transportModes(null), []);
});

test("each map is Google's official embed of the verified place (no tiles, no drawn map)", () => {
  for (const [slug, kgmid] of [["bare-chic", "/g/11f6ywgqpw"], ["bare-da-kao", "/g/11z6464xjg"], ["the-nang-suites", "/g/11fnr8n47n"]] as const) {
    const embed = LOCATION_TRAVEL[slug]!.embed;
    assert.ok(embed.src.startsWith("https://www.google.com/maps/embed?pb="), slug);
    assert.ok(embed.src.includes(encodeURIComponent(embed.placeId).replace("%3A", "%3A")), `${slug}: embed carries the place id`);
    assert.equal(embed.kgmid, kgmid);
  }
});

test("no public starting rate is approved yet, so every room card shows the neutral label", () => {
  assert.deepEqual(PUBLIC_STARTING_RATES, {});
  assert.equal(publicStartingRate("bare-chic", "bare-chic-one"), null);
  const sample = { amount: 1200000, currency: "VND" as const, basis: "per-night" as const, approvedBy: "test", approvedOn: "2026-01-01", record: "test" };
  assert.equal(formatStartingRate(sample).replace(/\s/g, " "), "1.200.000 ₫");
});

test("a conflicting house number is dropped, the agreed street kept", async () => {
  const { streetNameOnly } = await import("./view");
  assert.equal(streetNameOnly("K174/31 Võ Văn Kiệt, Sơn Trà, Đà Nẵng"), "Võ Văn Kiệt");
  assert.equal(streetNameOnly("12/18 Nguyễn Thị Minh Khai, Phường Sài Gòn"), "Nguyễn Thị Minh Khai");
  assert.equal(streetNameOnly(null), null);
});
