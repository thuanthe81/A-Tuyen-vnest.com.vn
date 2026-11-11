import assert from "node:assert/strict";
import { test } from "node:test";
import { EDITORIAL_LAYOUTS } from "@/content/layouts";
import { propertyRecords } from "@/content/properties";
import { SELECTION } from "@/content/vnest-workbook/image-selection";
import { G3_IMAGES, G4_IMAGES, publicReleaseCandidates, RELEASE_HOLDS } from "@/content/vnest-workbook/media";
import { ROWS } from "@/content/vnest-workbook/workbook";
import { isPublishable } from "@/domain/property";
import { validatePropertyRecord } from "@/domain/property-validation";
import { THEMEABLE_TOKENS } from "@/styles/theme-contract";
import { BARE_CHIC_TWO_EXTENDED_IDS, buildBareChic, type PhotoLookup } from "./bare-chic/record";

const options = { layouts: EDITORIAL_LAYOUTS, themeableTokens: THEMEABLE_TOKENS };
const withPhotos: PhotoLookup = (key) => ({ src: `/dev-client-media/${key}/1600.jpg`, width: 1600, height: 1066 });
const withoutPhotos: PhotoLookup = () => null;

test("Bare Chic draft passes the content gate, with or without the local photographs", () => {
  for (const lookup of [withPhotos, withoutPhotos]) assert.deepEqual(validatePropertyRecord(buildBareChic(lookup).record, options), []);
});

test("it is a draft of client content, never published and not served by production", () => {
  const { record } = buildBareChic(withPhotos);
  assert.deepEqual([record.source, record.status, record.approvedLocales], ["client-supplied", "draft", ["vi"]]);
  assert.equal(isPublishable(record), false);
  assert.ok(!propertyRecords.some((r) => r.slug === "bare-chic"), "src/content/properties stays empty");
  assert.deepEqual(record.booking.providers, {}, "no PMS mapping");
  assert.deepEqual([record.rateReferences, record.policies, record.faqs], [[], [], []], "no verified price, no policies yet");
});

test("photographs: authorised ones as pending rights, otherwise labelled placeholders; every one names its room", () => {
  const present = buildBareChic(withPhotos).record.media.images;
  assert.ok(present.every((i) => i.rights === "client-supplied-pending" && i.src && i.roomTypeId));
  const absent = buildBareChic(withoutPhotos).record.media.images;
  assert.ok(absent.every((i) => i.rights === "placeholder" && !i.src && i.alt.vi.startsWith("Ảnh chờ: ")));
  const { record } = buildBareChic(withPhotos);
  assert.equal(record.identity.galleryMediaIds, undefined, "room photographs never stand for the property's gallery");
  const opening = record.presentation.sections.find((s) => s.id === "opening-frames");
  assert.ok(opening?.kind === "media" && opening.caption?.vi.includes("Bare Chic One"), "the opening frames say which rooms they show");
});

test("rooms: the four names from the v2 overview sheet; the 15/10 room facts are legacy, never shown", () => {
  const { record, trace } = buildBareChic(withPhotos);
  assert.deepEqual(record.rooms.map((r) => r.name.vi), ["Bare Chic One", "Bare Chic Two", "Bare Chic Three", "Bare Indochine"]);
  assert.deepEqual(
    trace.rooms.map((r) => r.name.source[0]),
    [4, 5, 6, 7].map((row) => ({ sheet: "Tổng quan 6 cơ sở", cell: `C${row}` })),
  );
  for (const room of record.rooms) assert.deepEqual([room.maxOccupancy, room.areaSqm, room.bedding, room.description], [undefined, undefined, undefined, undefined]);
  const { type, size, capacity } = trace.rooms[0]!.legacy;
  assert.deepEqual([type.raw, size.raw, capacity.raw], ["Studio", "28m2", "2 người lớn"], "kept as history");
  for (const fact of [type, size, capacity]) assert.deepEqual([fact.display, fact.status, fact.clarification, fact.source[0]!.sheet], [null, "not-reconfirmed", "Q23", "Cơ sở & danh sách phòng"]);
  assert.equal(capacity.coversRows.length, 22, "one capacity cell covered every room of every property");
});

test("no policies and no nearby places on the record: the v2 sheets do not support them for Bare Chic", () => {
  const { record, trace } = buildBareChic(withPhotos);
  assert.deepEqual([record.policies, record.nearby], [[], []]);
  assert.ok(!record.presentation.sections.some((s) => s.id === "policies" || s.id === "nearby"));
  // The policy sheet is read and kept, every line unpublishable: C ("Áp dụng cho cơ sở") is empty.
  assert.equal(trace.policies.length, 11);
  assert.ok(trace.policies.every((line) => line.publishable === false && line.appliesTo.status === "missing"));
  assert.deepEqual(
    trace.policies.filter((line) => line.value.display).map((line) => [line.item, line.value.display]),
    [
      ["Giờ nhận phòng", "14:00"],
      ["Giờ trả phòng", "12:00"],
      ["Nhận phòng sớm / trả phòng muộn", "Không áp dụng"],
      ["Trẻ em / vật nuôi / quy định đặc biệt", "Không áp dụng"],
    ],
  );
  assert.equal(trace.policies.filter((line) => line.value.status === "missing").length, 7);
  // The nearby block names four properties; it is kept in the trace, not presented as near Bare Chic.
  assert.match(trace.nearby.header.display!, /Bare Chic, Bare Đa Kao, Bare Hyphen, Pepper House/);
});

test("place: the address as supplied and the city from it; no former district", () => {
  const { record } = buildBareChic(withPhotos);
  assert.equal(record.place.address?.vi, "12/18 Nguyễn Thị Minh Khai, Phường Sài Gòn, Hồ Chí Minh");
  assert.equal(record.place.area.name.vi, "TP. Hồ Chí Minh");
  assert.ok(!JSON.stringify(record).includes("Quận 1"));
});

test("story: the description in two paragraphs, every word as supplied", () => {
  const { record, trace } = buildBareChic(withPhotos);
  const e4 = ROWS.find((r) => r.row === 4)!.E!;
  assert.equal(trace.story.display!.length, 2);
  assert.equal(trace.story.display!.join(" "), e4.trim());
  const story = record.presentation.sections.find((s) => s.id === "story");
  assert.ok(story?.kind === "narrative" && story.body.map((b) => b.vi).join(" ") === e4.trim());
});

test("introduction and amenities are the client's words, traced to their cells", () => {
  const { record, trace } = buildBareChic(withPhotos);
  const e4 = ROWS.find((r) => r.row === 4)!.E!;
  assert.ok(e4.includes(record.narrative.positioning!.vi), "the introduction is a verbatim excerpt");
  assert.equal(trace.intro.clarification, "Q21");
  assert.deepEqual(record.amenities.map((a) => a.label.vi), ["Bếp nhỏ", "Phòng tắm riêng", "Smart TV", "Wifi", "Điều hoà nhiệt độ"]);
  // Pictograms: an explicit per-label choice from the fixed list (owner's request, 20/10; Q31), never more.
  assert.deepEqual(
    record.amenities.map((a) => [a.label.vi, a.icon ?? null]),
    [
      ["Bếp nhỏ", "kitchen"],
      ["Phòng tắm riêng", null],
      ["Smart TV", null],
      ["Wifi", "wifi"],
      ["Điều hoà nhiệt độ", "air-conditioning"],
    ],
  );
  assert.equal(record.narrative.positioning?.vi, "Đó là một ngôi nhà gồm bốn tầng mà mỗi tầng là một căn studio riêng biệt, hiện đại và tiện nghi.");
  assert.equal(trace.amenities.incomplete, true);
});

test("photographs: each room's own, none shared, none repeated; the gallery holds every one once, grouped by room", () => {
  const { record } = buildBareChic(withPhotos);
  const byRoom = Object.fromEntries(record.rooms.map((r) => [r.name.vi, r.mediaIds]));
  assert.deepEqual(byRoom, {
    // Owner's image selection, 26/10/2026: image 1 (1.42.png, replacing its older copy) and image 3
    // lead their rooms; image 2 is on hold (a person), so Bare Chic Two keeps its cover.
    "Bare Chic One": ["sel-01-bare-chic-one", "bare-chic-one-1-55", "bare-chic-one-1-11", "bare-chic-one-1-47", "bare-chic-one-1-1"],
    "Bare Chic Two": [
      "bare-chic-two-2-3",
      "bare-chic-two-2-10",
      "bare-chic-two-2-4",
      "bare-chic-two-2-5",
      "bare-chic-two-2-9",
      "bare-chic-two-2-32",
      ...BARE_CHIC_TWO_EXTENDED_IDS,
    ],
    "Bare Chic Three": ["sel-03-bare-chic-three", "bare-chic-three-1-57", "bare-chic-three-1-18", "bare-chic-three-1-29", "bare-chic-three-1-27"],
    "Bare Indochine": ["bare-indochine-50", "bare-indochine-51", "bare-indochine-52", "bare-indochine-53", "bare-indochine-54"],
  });
  // Every photograph comes from its own room's Drive folder (G2's 1.55.png is Bare Chic One's).
  // The owner's selection names each image's room itself (mapping.csv).
  const folderRoom = new Map<string, string>([
    ["bare-chic-one-1-55", "Bare Chic One"],
    ["bare-chic-one-1-1", "Bare Chic One"],
    ...[...G3_IMAGES, ...G4_IMAGES].map((i): [string, string] => [i.key, i.folderTitle]),
    ...SELECTION.map((i): [string, string] => [i.key, i.room]),
    ...BARE_CHIC_TWO_EXTENDED_IDS.map((key): [string, string] => [key, "Bare Chic Two"]),
  ]);
  for (const [room, ids] of Object.entries(byRoom)) for (const id of ids) assert.equal(folderRoom.get(id), room, `${id} is from ${room}'s folder`);
  // Never the two files that sit in both Bare Chic One's and Three's folders (Q6) as Drive copies. The
  // owner's 26/10 selection assigns 1.59.png to Bare Chic Three (image 3, `sel-03-…`); 1.56.png stays out.
  assert.ok(!JSON.stringify(record.media.images).match(/1-56|1-59/));
  assert.ok(record.media.images.every((i) => !/giường đôi|giường đơn|m²|người lớn/.test(i.alt.vi)), "alt text states no bed size, area or capacity");
  const all = record.rooms.flatMap((r) => r.mediaIds);
  assert.equal(new Set(all).size, all.length, "no photograph under two rooms");
  for (const room of record.rooms) for (const id of room.mediaIds) assert.equal(record.media.images.find((i) => i.id === id)?.roomTypeId, room.id, `${id} is tagged with its own room`);
  const gallery = record.presentation.sections.find((s) => s.id === "gallery");
  assert.ok(gallery?.kind === "media");
  assert.deepEqual(gallery.mediaIds, all, "every photograph once, in room order");
  assert.equal(record.identity.galleryMediaIds, undefined, "room photographs never stand for the property as a whole");
});

test("photographs showing a person are held out of any public-release set (Q15)", () => {
  assert.deepEqual(
    RELEASE_HOLDS.map((h) => [h.file, h.folderTitle, h.authorisation]),
    [
      ["1.11.png", "Bare Chic One", "not-granted"],
      ["2.32.png", "Bare Chic Two", "not-granted"],
      ["1.18.png", "Bare Chic Three", "not-granted"],
    ],
  );
  const { record } = buildBareChic(withPhotos);
  const keys = record.media.images.map((i) => i.id);
  for (const hold of RELEASE_HOLDS) assert.ok(keys.includes(hold.key), `${hold.key} is a Bare Chic photograph`);
  assert.deepEqual(publicReleaseCandidates(keys), [], "no client photograph has public rights yet");
  const released = publicReleaseCandidates(keys, new Set(keys));
  assert.equal(released.length, keys.length - 3, "even with rights granted for all, the three held ones stay out");
  assert.ok(!released.some((k) => RELEASE_HOLDS.some((h) => h.key === k)));
  assert.ok(record.media.images.every((i) => i.rights === "client-supplied-pending"), "rights are pending for every photograph");
});
