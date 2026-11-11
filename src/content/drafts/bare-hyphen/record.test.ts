import assert from "node:assert/strict";
import { test } from "node:test";
import { EDITORIAL_LAYOUTS } from "@/content/layouts";
import { findImage, isPublishable, resolveProperty } from "@/domain/property";
import { validatePropertyRecord } from "@/domain/property-validation";
import { buildDetailView } from "@/features/property-detail/view";
import { THEMEABLE_TOKENS } from "@/styles/theme-contract";
import { resolvePropertySpaceGroups } from "../property-spaces";
import {
  BARE_HYPHEN_GALLERY_COUNTS,
  BARE_HYPHEN_ONE_THREE_SHARED_ASSETS,
  BARE_HYPHEN_ONE_THREE_SOURCE_FOLDER,
  BARE_HYPHEN_VERIFIED_MAP_URL,
  buildBareHyphen,
  buildBareHyphenSharedRepresentativeMetadata,
  type PhotoLookup,
} from "./record";

const options = { layouts: EDITORIAL_LAYOUTS, themeableTokens: THEMEABLE_TOKENS };
const withPhotos: PhotoLookup = (key) => ({ src: `/dev-client-media/${key}/1600.jpg`, width: 1600, height: 1066 });
const withoutPhotos: PhotoLookup = () => null;

test("Bare Hyphen draft passes the content gate, with or without local photographs", () => {
  for (const lookup of [withPhotos, withoutPhotos]) {
    assert.deepEqual(validatePropertyRecord(buildBareHyphen(lookup).record, options), []);
  }
});

test("Bare Hyphen is a client-supplied draft, never published to production, with no PMS mapping", () => {
  const { record } = buildBareHyphen(withPhotos);
  assert.deepEqual([record.source, record.status, record.approvedLocales], ["client-supplied", "draft", ["vi"]]);
  assert.equal(isPublishable(record), false);
  assert.deepEqual(record.booking.providers, {});
  assert.deepEqual([record.rateReferences, record.policies, record.faqs], [[], [], []]);
});

test("Bare Hyphen rooms: three Studio units (18 m²) and one Duplex studio unit (30 m²) with R3 display metadata", () => {
  const { trace } = buildBareHyphen(withPhotos);
  const publicView = buildDetailView(trace, { audience: "public", bookingConnected: false });
  assert.deepEqual(
    publicView.rooms.map((r) => [r.id, r.name, r.specs.map((s) => `${s.label}: ${s.value}`)]),
    [
      ["bare-hyphen-one", "Bare Hyphen One", ["Loại phòng: Studio", "Diện tích: 18 m²", "Sức chứa: 2 người lớn"]],
      ["bare-hyphen-two", "Bare Hyphen Two", ["Loại phòng: Studio", "Diện tích: 18 m²", "Sức chứa: 2 người lớn"]],
      ["bare-hyphen-three", "Bare Hyphen Three", ["Loại phòng: Studio", "Diện tích: 18 m²", "Sức chứa: 2 người lớn"]],
      ["bare-hyphen-four", "Bare Hyphen Four", ["Loại phòng: Duplex studio", "Diện tích: 30 m²", "Sức chứa: 2 người lớn"]],
    ],
  );
  assert.equal(publicView.location.mapUrl, BARE_HYPHEN_VERIFIED_MAP_URL);
});

test("Bare Hyphen One & Three share all 36 person-free photographs with distinct covers and ordering, without inflating unique property asset count", () => {
  const { record } = buildBareHyphen(withPhotos);
  const resolved = resolveProperty(record, "vi", ["vi"])!;
  const byRoom = Object.fromEntries(record.rooms.map((r) => [r.name.vi, r.mediaIds]));

  // 1. Both One and Three have all 36 photographs from the shared `one - three` collection
  assert.equal(BARE_HYPHEN_ONE_THREE_SHARED_ASSETS.length, 36);
  assert.equal(byRoom["Bare Hyphen One"]?.length, 36);
  assert.equal(byRoom["Bare Hyphen Two"]?.length, 20);
  assert.equal(byRoom["Bare Hyphen Three"]?.length, 36);
  assert.equal(byRoom["Bare Hyphen Four"]?.length, 26);

  // 2. Distinct curated covers and primary ordering for One vs Three
  assert.equal(byRoom["Bare Hyphen One"]?.[0], "sel-04-bare-hyphen-one");
  assert.equal(byRoom["Bare Hyphen Three"]?.[0], "bare-hyphen-three-a-16");
  assert.notEqual(byRoom["Bare Hyphen One"]?.[0], byRoom["Bare Hyphen Three"]?.[0]);
  assert.notDeepEqual(
    byRoom["Bare Hyphen One"]?.slice(0, 6),
    byRoom["Bare Hyphen Three"]?.slice(0, 6),
  );

  // 3. Both One and Three reference the exact same 36 underlying physical image assets (`src`)
  const oneSrcs = byRoom["Bare Hyphen One"]!.map((id) => findImage(resolved, id)?.src);
  const threeSrcs = byRoom["Bare Hyphen Three"]!.map((id) => findImage(resolved, id)?.src);
  assert.equal(new Set(oneSrcs).size, 36);
  assert.equal(new Set(threeSrcs).size, 36);
  assert.deepEqual(new Set(oneSrcs), new Set(threeSrcs));

  // 4. Unique physical asset accounting across the entire property (82 room + 22 property-level = 104 unique)
  const allRoomSrcs = record.rooms.flatMap((r) => r.mediaIds.map((id) => findImage(resolved, id)?.src));
  const uniqueRoomAssetCount = new Set(allRoomSrcs).size;
  assert.equal(uniqueRoomAssetCount, BARE_HYPHEN_GALLERY_COUNTS.uniqueRoomAssets); // 36 + 20 + 26 = 82

  const spaceGroups = resolvePropertySpaceGroups("bare-hyphen", withPhotos);
  assert.deepEqual(
    spaceGroups.map((g) => [g.room, g.photos.length]),
    [
      ["Mặt tiền & Lối vào (Exterior)", 7],
      ["Không gian chung (Common Space)", 15],
    ],
  );
  const spaceSrcs = spaceGroups.flatMap((g) => g.photos.map((p) => p.src));
  const totalUniquePropertyAssets = new Set([...allRoomSrcs, ...spaceSrcs]).size;
  assert.equal(totalUniquePropertyAssets, BARE_HYPHEN_GALLERY_COUNTS.totalUniquePropertyGalleryAssets); // 104

  const sharedMeta = buildBareHyphenSharedRepresentativeMetadata("Bare Hyphen Three", "a-25.jpg");
  assert.equal(sharedMeta.sourceProvenance, `${BARE_HYPHEN_ONE_THREE_SOURCE_FOLDER}/a-25.jpg`);
  assert.match(sharedMeta.notice, /Ảnh đại diện minh hoạ thiết kế chung/);
});
