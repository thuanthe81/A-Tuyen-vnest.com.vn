import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { EDITORIAL_LAYOUTS } from "@/content/layouts";
import { propertyRecords } from "@/content/properties";
import type { PropertyRecord } from "@/domain/property";
import { validatePropertyRecord } from "@/domain/property-validation";
import { mockPropertyRecords } from "@/integrations/content/mock/records";
import { THEMEABLE_TOKENS } from "@/styles/theme-contract";

const options = { layouts: EDITORIAL_LAYOUTS, themeableTokens: THEMEABLE_TOKENS };

// The content gate: CI fails when any record, real or sample, breaks a rule.
function assertValid(records: readonly PropertyRecord[]) {
  for (const record of records) {
    const issues = validatePropertyRecord(record, options).map((issue) => `${record.slug} › ${issue.path}: ${issue.message}`);
    assert.deepEqual(issues, []);
  }
  const slugs = records.map((record) => record.slug);
  assert.equal(new Set(slugs).size, slugs.length, "property slugs must be unique");
  const ids = records.map((record) => record.id);
  assert.equal(new Set(ids).size, ids.length, "property ids must be unique");
}

test("every real property record is valid", () => assertValid(propertyRecords));

test("real records are never sample data", () => {
  assert.deepEqual(propertyRecords.filter((record) => record.source === "mock"), []);
});

test("every mock record is valid, marked as mock, and never approved", () => {
  assertValid(mockPropertyRecords);
  for (const record of mockPropertyRecords) {
    assert.equal(record.source, "mock");
    assert.equal(record.status, "draft");
    // Stand-ins only: an empty placeholder, or a drawn fixture that shows no VNest property.
    assert.ok(record.media.images.every((image) => image.rights !== "client-approved"));
    assert.ok(record.media.images.every((image) => image.src === undefined || image.src.startsWith("/dev-fixtures/")));
    assert.match(record.identity.name.vi, /mẫu/, "a fixture's name must say it is a sample");
  }
});

test("there are six development fixtures, and every picture they name exists", () => {
  assert.equal(mockPropertyRecords.length, 6);
  for (const image of mockPropertyRecords.flatMap((record) => record.media.images)) {
    if (!image.src) continue;
    const file = readFileSync(new URL(`../../public${image.src}`, import.meta.url), "utf8");
    assert.match(file, /ẢNH MẪU · KHÔNG PHẢI HÌNH ẢNH VNEST/, `${image.src} must label itself as a sample`);
  }
});
