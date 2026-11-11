import assert from "node:assert/strict";
import { test } from "node:test";
import { HERO_SELECTION, PROPERTY_COVER, SELECTION, selectionForProperty, selectionForRoom, selectionImage, withSelectedFirst } from "./image-selection";
import { RELEASE_HOLDS } from "./media";
import { selectedCover, selectedEntry, selectedRoomImages, type SelectionManifest } from "./selection-photos";

// The owner's image selection, 26/10/2026 (brief + mapping.csv). These pin the mapping as given.

const manifest: SelectionManifest = {
  photos: Object.fromEntries(SELECTION.map((i) => [i.key, { sha256: i.sha256, width: 2048, height: 1365, variants: [{ src: `/x/${i.key}/1600.jpg`, type: "image/jpeg", width: 1600, height: 1067, bytes: 1 }] }])),
};

test("seventeen images, numbered 1–17, each pinned by its own SHA-256", () => {
  assert.deepEqual(SELECTION.map((i) => i.n), Array.from({ length: 17 }, (_, i) => i + 1));
  assert.equal(new Set(SELECTION.map((i) => i.sha256)).size, 17);
  assert.equal(new Set(SELECTION.map((i) => i.key)).size, 17);
});

test("property covers are images 1, 5, 9, 11, 13 and 17", () => {
  assert.deepEqual(PROPERTY_COVER, { "bare-chic": 1, "bare-hyphen": 5, "bare-da-kao": 9, "bare-han": 11, "the-nang-suites": 13, "pepper-house": 17 });
  for (const [property, n] of Object.entries(PROPERTY_COVER)) assert.equal(selectionImage(n)!.propertyId, property);
  assert.deepEqual(HERO_SELECTION, Object.values(PROPERTY_COVER));
});

test("room mapping follows the brief; Pepper House 3rd Floor is one room with two photographs", () => {
  const rooms: [string, number[]][] = [
    ["bare-chic-one", [1]], ["bare-chic-two", [2]], ["bare-chic-three", [3]],
    ["bare-hyphen-one", [4]], ["bare-hyphen-two", [5]],
    ["bare-da-kao-one", [6]], ["bare-da-kao-two", [7]], ["bare-da-kao-three", [8]], ["bare-da-kao-four", [9]],
    ["bare-han-ground", [10]], ["bare-han-two", [11]], ["bare-han-three", [12]],
    ["pale-blue-eyes", [13]], ["blue-moon", [14]],
    ["pepper-house-3rd-floor", [15, 16]], ["pepper-house-4th-floor", [17]],
  ];
  for (const [room, ns] of rooms) assert.deepEqual(selectionForRoom(room).map((i) => i.n), ns, room);
  // The workbook spells it "Pepper House 3rd-floor": the same room.
  assert.deepEqual(selectionForRoom("Pepper House 3rd-floor").map((i) => i.n), [15, 16]);
  assert.equal(new Set(SELECTION.map((i) => i.roomId)).size, 16, "17 photographs, 16 rooms");
});

test("property galleries group the images as the brief lists them", () => {
  const groups = Object.fromEntries(Object.keys(PROPERTY_COVER).map((p) => [p, selectionForProperty(p).map((i) => i.n)]));
  assert.deepEqual(groups, { "bare-chic": [1, 2, 3], "bare-hyphen": [4, 5], "bare-da-kao": [6, 7, 8, 9], "bare-han": [10, 11, 12], "the-nang-suites": [13, 14], "pepper-house": [15, 16, 17] });
});

test("image 2 (a person) is held everywhere: no entry, no cover, no room photograph", () => {
  const two = selectionImage(2)!;
  assert.equal(two.hold?.reason, "person-visible");
  assert.ok(RELEASE_HOLDS.some((h) => h.key === "bare-chic-two-2-32"), "the same photograph is already a release hold");
  assert.equal(selectedEntry(manifest, two), null);
  assert.deepEqual(selectedRoomImages(manifest, "bare-chic-two"), []);
  assert.deepEqual(withSelectedFirst(["bare-chic-two-2-3", "bare-chic-two-2-10"], "Bare Chic Two", () => true), ["bare-chic-two-2-3", "bare-chic-two-2-10"]);
});

test("a selected photograph leads its room and its older copy steps aside; without it the room is unchanged", () => {
  const one = ["bare-chic-one-1-55", "bare-chic-one-1-11", "bare-chic-one-1-42", "bare-chic-one-1-47"];
  assert.deepEqual(withSelectedFirst(one, "Bare Chic One", () => true), ["sel-01-bare-chic-one", "bare-chic-one-1-55", "bare-chic-one-1-11", "bare-chic-one-1-47"]);
  assert.deepEqual(withSelectedFirst(one, "Bare Chic One", () => false), one);
  assert.deepEqual(withSelectedFirst(["pepper-house"], "pepper-house-3rd-floor", () => true), ["sel-15-pepper-house-3rd-floor-a", "sel-16-pepper-house-3rd-floor-b", "pepper-house"]);
});

test("a cover fails closed when the derived file is not the pinned original", () => {
  assert.equal(selectedCover(manifest, "bare-chic")!.image.n, 1);
  const changed = { photos: { ...manifest.photos, "sel-01-bare-chic-one": { ...manifest.photos["sel-01-bare-chic-one"]!, sha256: "other" } } };
  assert.equal(selectedCover(changed, "bare-chic"), null);
  assert.equal(selectedCover(null, "bare-chic"), null);
});
