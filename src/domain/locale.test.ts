import assert from "node:assert/strict";
import { test } from "node:test";
import { isLocale, isLocalizedText, missingTranslations, resolveLocalized } from "./locale.ts";

const record = {
  id: "p1",
  name: { vi: "Tên", en: "Name" },
  rooms: [{ id: "r1", name: { vi: "Phòng" }, maxOccupancy: 2 }],
  refs: { "room-1": "X1" },
};

test("isLocale accepts only known languages", () => {
  assert.equal(isLocale("vi"), true);
  assert.equal(isLocale("en"), true);
  assert.equal(isLocale("fr"), false);
});

test("isLocalizedText needs Vietnamese and nothing but language keys", () => {
  assert.equal(isLocalizedText({ vi: "a" }), true);
  assert.equal(isLocalizedText({ vi: "a", en: "b" }), true);
  assert.equal(isLocalizedText({ en: "b" }), false);
  assert.equal(isLocalizedText({ vi: "a", other: "b" }), false);
  assert.equal(isLocalizedText("a"), false);
});

test("resolveLocalized flattens every text and leaves other values alone", () => {
  assert.deepEqual(resolveLocalized(record, "vi"), {
    id: "p1",
    name: "Tên",
    rooms: [{ id: "r1", name: "Phòng", maxOccupancy: 2 }],
    refs: { "room-1": "X1" },
  });
});

test("a missing translation falls back to Vietnamese and is reported", () => {
  const english = resolveLocalized(record, "en");
  assert.equal(english.name, "Name");
  assert.equal(english.rooms[0]?.name, "Phòng");
  assert.deepEqual(missingTranslations(record, "en"), ["rooms[0].name"]);
  assert.deepEqual(missingTranslations(record, "vi"), []);
});

test("blank text counts as missing", () => {
  assert.deepEqual(missingTranslations({ title: { vi: "  " } }, "vi"), ["title"]);
});
