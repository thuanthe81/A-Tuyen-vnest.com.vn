import assert from "node:assert/strict";
import { test } from "node:test";
import { EDITORIAL_LAYOUTS } from "@/content/layouts";
import { isPublishable } from "@/domain/property";
import { validatePropertyRecord } from "@/domain/property-validation";
import { buildDetailView } from "@/features/property-detail/view";
import { THEMEABLE_TOKENS } from "@/styles/theme-contract";
import { buildBareHan, type PhotoLookup } from "./record";

const options = { layouts: EDITORIAL_LAYOUTS, themeableTokens: THEMEABLE_TOKENS };
const withPhotos: PhotoLookup = (key) => ({ src: `/dev-client-media/${key}/1600.jpg`, width: 1600, height: 1066 });
const withoutPhotos: PhotoLookup = () => null;

test("Bare Hàn draft passes the content gate, with or without local photographs", () => {
  for (const lookup of [withPhotos, withoutPhotos]) {
    assert.deepEqual(validatePropertyRecord(buildBareHan(lookup).record, options), []);
  }
});

test("Bare Hàn is a client-supplied draft, never published to production, with no PMS mapping", () => {
  const { record } = buildBareHan(withPhotos);
  assert.deepEqual([record.source, record.status, record.approvedLocales], ["client-supplied", "draft", ["vi"]]);
  assert.equal(isPublishable(record), false);
  assert.deepEqual(record.booking.providers, {});
  assert.deepEqual([record.rateReferences, record.policies, record.faqs], [[], [], []]);
});

test("Bare Hàn rooms: four Studio units (30 m² · 2 người lớn) in Đà Nẵng with R3 display metadata", () => {
  const { record, trace } = buildBareHan(withPhotos);
  const publicView = buildDetailView(trace, { audience: "public", bookingConnected: false });
  assert.equal(record.place.area.name.vi, "Đà Nẵng");
  assert.deepEqual(
    publicView.rooms.map((r) => [r.id, r.name, r.specs.map((s) => `${s.label}: ${s.value}`)]),
    [
      ["bare-han-ground", "Bare Hàn Ground", ["Loại phòng: Studio", "Diện tích: 30 m²", "Sức chứa: 2 người lớn"]],
      ["bare-han-one", "Bare Hàn One", ["Loại phòng: Studio", "Diện tích: 30 m²", "Sức chứa: 2 người lớn"]],
      ["bare-han-two", "Bare Hàn Two", ["Loại phòng: Studio", "Diện tích: 30 m²", "Sức chứa: 2 người lớn"]],
      ["bare-han-three", "Bare Hàn Three", ["Loại phòng: Studio", "Diện tích: 30 m²", "Sức chứa: 2 người lớn"]],
    ],
  );
});

test("Bare Hàn galleries: imports all 22 distinct person-free photographs across the 4 rooms (6 + 6 + 5 + 5), with selected covers leading", () => {
  const { record } = buildBareHan(withPhotos);
  const byRoom = Object.fromEntries(record.rooms.map((r) => [r.name.vi, r.mediaIds]));
  assert.deepEqual(byRoom, {
    "Bare Hàn Ground": [
      "sel-10-bare-han-ground",
      "bare-han-ground-26",
      "bare-han-ground-30",
      "bare-han-ground-31",
      "bare-han-ground-36",
      "bare-han-ground-42",
    ],
    "Bare Hàn One": [
      "bare-han-one-6",
      "bare-han-one-7",
      "bare-han-one-9",
      "bare-han-one-11",
      "bare-han-one-13",
      "bare-han-one-15",
    ],
    "Bare Hàn Two": [
      "sel-11-bare-han-two",
      "bare-han-two-52",
      "bare-han-two-53",
      "bare-han-two-58",
      "bare-han-two-61",
    ],
    "Bare Hàn Three": [
      "sel-12-bare-han-three",
      "bare-han-three-73",
      "bare-han-three-81",
      "bare-han-three-82",
      "bare-han-three-84",
    ],
  });
  const gallery = record.presentation.sections.find((s) => s.id === "gallery");
  assert.ok(gallery?.kind === "media");
  assert.equal(gallery.mediaIds.length, 22);
  assert.equal(record.identity.signatureMediaId, "sel-11-bare-han-two");
});
