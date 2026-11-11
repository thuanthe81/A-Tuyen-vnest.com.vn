import assert from "node:assert/strict";
import { test } from "node:test";
import { EDITORIAL_LAYOUTS } from "@/content/layouts";
import { isPublishable } from "@/domain/property";
import { validatePropertyRecord } from "@/domain/property-validation";
import { buildDetailView } from "@/features/property-detail/view";
import { THEMEABLE_TOKENS } from "@/styles/theme-contract";
import { buildPepperHouse, type PhotoLookup } from "./record";

const options = { layouts: EDITORIAL_LAYOUTS, themeableTokens: THEMEABLE_TOKENS };
const withPhotos: PhotoLookup = (key) => ({ src: `/dev-client-media/${key}/1600.jpg`, width: 1600, height: 1066 });
const withoutPhotos: PhotoLookup = () => null;

test("Pepper House draft passes the content gate, with or without local photographs", () => {
  for (const lookup of [withPhotos, withoutPhotos]) {
    assert.deepEqual(validatePropertyRecord(buildPepperHouse(lookup).record, options), []);
  }
});

test("Pepper House is a client-supplied draft, never published to production, with no live PMS mapping yet", () => {
  const { record } = buildPepperHouse(withPhotos);
  assert.deepEqual([record.source, record.status, record.approvedLocales], ["client-supplied", "draft", ["vi"]]);
  assert.equal(isPublishable(record), false);
  assert.deepEqual(record.booking.providers, {});
  assert.deepEqual([record.rateReferences, record.policies, record.faqs], [[], [], []]);
});

test("Pepper House rooms: exact two official room names in workbook order (rows 24–25) with R3 display metadata", () => {
  const { record, trace } = buildPepperHouse(withPhotos);
  const publicView = buildDetailView(trace, { audience: "public", bookingConnected: false });
  assert.equal(record.place.area.name.vi, "TP. Hồ Chí Minh");
  assert.equal(record.place.address?.vi, "19 Hoàng Sa, Phường Sài Gòn, TP HCM");
  assert.equal(publicView.location.mapUrl, "https://share.google/EtwVNoPbiCmG7Tvbj");
  assert.deepEqual(
    publicView.rooms.map((r) => [r.id, r.name, r.specs.map((s) => `${s.label}: ${s.value}`)]),
    [
      [
        "pepper-house-3rd-floor",
        "Pepper House 3rd-floor",
        ["Loại phòng: Studio", "Diện tích: 40 m²", "Sức chứa: 2 người lớn"],
      ],
      [
        "pepper-house-4th-floor",
        "Pepper House 4th-floor",
        ["Loại phòng: Studio", "Diện tích: 40 m²", "Sức chứa: 2 người lớn"],
      ],
    ],
  );
});

test("Pepper House galleries: 6 photographs for 3rd-floor and 5 for 4th-floor, owner selections first, floors never mixed", () => {
  const { record } = buildPepperHouse(withPhotos);
  const byRoom = Object.fromEntries(record.rooms.map((r) => [r.name.vi, r.mediaIds]));
  assert.deepEqual(byRoom, {
    // Room-card cover 02.jpg (owner decision 4/11); 08.jpg (sel-15) stays in the room's photographs.
    "Pepper House 3rd-floor": [
      "pepper-house-3rd-floor-02",
      "sel-15-pepper-house-3rd-floor-a",
      "sel-16-pepper-house-3rd-floor-b",
      "pepper-house-3rd-floor-03",
      "pepper-house-3rd-floor-09",
      "pepper-house-3rd-floor-04",
    ],
    "Pepper House 4th-floor": [
      "sel-17-pepper-house-4th-floor",
      "pepper-house-4th-floor-81",
      "pepper-house-4th-floor-72",
      "pepper-house-4th-floor-79",
      "pepper-house-4th-floor-76",
    ],
  });
  // Every image belongs to exactly the room whose gallery shows it.
  for (const room of record.rooms) {
    for (const id of room.mediaIds) {
      assert.equal(record.media.images.find((image) => image.id === id)?.roomTypeId, room.id, `${id} belongs to ${room.id}`);
    }
  }
  const [third, fourth] = record.rooms;
  assert.equal(third!.mediaIds.filter((id) => fourth!.mediaIds.includes(id)).length, 0, "no photograph in both rooms");
  const gallery = record.presentation.sections.find((s) => s.id === "gallery");
  assert.ok(gallery?.kind === "media");
  assert.equal(gallery.mediaIds.length, 11);
  // The property gallery (and the hero mosaic built from it) keeps the owner's selection order: unchanged by the room cover.
  assert.deepEqual(gallery.mediaIds.slice(0, 6), [
    "sel-15-pepper-house-3rd-floor-a",
    "sel-16-pepper-house-3rd-floor-b",
    "pepper-house-3rd-floor-03",
    "pepper-house-3rd-floor-02",
    "pepper-house-3rd-floor-09",
    "pepper-house-3rd-floor-04",
  ]);
  assert.equal(record.identity.signatureMediaId, "sel-17-pepper-house-4th-floor", "the approved property cover is unchanged");
});
