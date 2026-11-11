import assert from "node:assert/strict";
import { test } from "node:test";
import { buildBareChic } from "@/content/drafts/bare-chic/record";
import { buildBareDaKao } from "@/content/drafts/bare-da-kao/record";
import { buildBareHan } from "@/content/drafts/bare-han/record";
import { buildBareHyphen } from "@/content/drafts/bare-hyphen/record";
import { buildNang } from "@/content/drafts/the-nang-suites/record";
import { orderedRoomsForProperty, WORKBOOK_ROOM_ORDER_BY_PROPERTY } from "@/content/vnest-workbook/property-details";
import { resolveProperty } from "@/domain/property";
import { buildBookingResultsCatalog } from "@/features/demo/booking-results-data";
import { buildHeroStrip } from "@/features/property-detail/hero-strip";
import { buildDetailView } from "@/features/property-detail/view";

const EXPECTED_WORKBOOK_ROOM_SEQUENCES: Readonly<
  Record<string, readonly { position: number; row: number; id: string; name: string }[]>
> = {
  "bare-chic": [
    { position: 1, row: 4, id: "bare-chic-one", name: "Bare Chic One" },
    { position: 2, row: 5, id: "bare-chic-two", name: "Bare Chic Two" },
    { position: 3, row: 6, id: "bare-chic-three", name: "Bare Chic Three" },
    { position: 4, row: 7, id: "bare-indochine", name: "Bare Indochine" },
  ],
  "bare-hyphen": [
    { position: 1, row: 8, id: "bare-hyphen-one", name: "Bare Hyphen One" },
    { position: 2, row: 9, id: "bare-hyphen-two", name: "Bare Hyphen Two" },
    { position: 3, row: 10, id: "bare-hyphen-three", name: "Bare Hyphen Three" },
    { position: 4, row: 11, id: "bare-hyphen-four", name: "Bare Hyphen Four" },
  ],
  "bare-da-kao": [
    { position: 1, row: 12, id: "bare-da-kao-one", name: "Bare Đa Kao One" },
    { position: 2, row: 13, id: "bare-da-kao-two", name: "Bare Đa Kao Two" },
    { position: 3, row: 14, id: "bare-da-kao-three", name: "Bare Đa Kao Three" },
    { position: 4, row: 15, id: "bare-da-kao-four", name: "Bare Đa Kao Four" },
  ],
  "bare-han": [
    { position: 1, row: 16, id: "bare-han-ground", name: "Bare Hàn Ground" },
    { position: 2, row: 17, id: "bare-han-one", name: "Bare Hàn One" },
    { position: 3, row: 18, id: "bare-han-two", name: "Bare Hàn Two" },
    { position: 4, row: 19, id: "bare-han-three", name: "Bare Hàn Three" },
  ],
  "the-nang-suites": [
    { position: 1, row: 20, id: "yellow-submarine", name: "Yellow Submarine" },
    { position: 2, row: 21, id: "pale-blue-eyes", name: "Pale Blue Eyes" },
    { position: 3, row: 22, id: "green-river", name: "Green River" },
    { position: 4, row: 23, id: "blue-moon", name: "Blue Moon" },
  ],
  "pepper-house": [
    { position: 1, row: 24, id: "pepper-house-3rd-floor", name: "Pepper House 3rd-floor" },
    { position: 2, row: 25, id: "pepper-house-4th-floor", name: "Pepper House 4th-floor" },
  ],
};

test("central workbook room ordering preserves official room names, stable IDs, and workbook row order across all 6 properties", () => {
  assert.deepEqual(Object.keys(WORKBOOK_ROOM_ORDER_BY_PROPERTY), Object.keys(EXPECTED_WORKBOOK_ROOM_SEQUENCES));

  for (const [propertyId, expected] of Object.entries(EXPECTED_WORKBOOK_ROOM_SEQUENCES)) {
    const actual = orderedRoomsForProperty(propertyId).map(({ position, row, id, name }) => ({
      position,
      row,
      id,
      name,
    }));
    assert.deepEqual(actual, expected, `${propertyId} matches VNest_Informationv2.xlsx room order`);
  }
});

test("all 5 property detail records and booking results catalog (all 6 properties) follow the central workbook room ordering", () => {
  const lookup = (key: string) => ({ src: `/dev-client-media/${key}/1600.jpg`, width: 1600, height: 1067 });
  const drafts = [
    buildBareChic(lookup),
    buildBareHyphen(lookup),
    buildBareDaKao(lookup),
    buildBareHan(lookup),
    buildNang(lookup),
  ];

  for (const { record, trace } of drafts) {
    const expected = EXPECTED_WORKBOOK_ROOM_SEQUENCES[record.id]!;
    const resolved = resolveProperty(record, "vi", ["vi"])!;
    const view = buildDetailView(trace, { audience: "public", bookingConnected: false });

    assert.deepEqual(
      resolved.rooms.map((r) => ({ id: r.id, name: r.name })),
      expected.map(({ id, name }) => ({ id, name })),
      `${record.id} resolved rooms match workbook sequence`,
    );
    assert.deepEqual(
      view.rooms.map((r) => ({ id: r.id, name: r.name })),
      expected.map(({ id, name }) => ({ id, name })),
      `${record.id} detail view rooms match workbook sequence`,
    );
  }

  const catalog = buildBookingResultsCatalog();
  for (const property of catalog) {
    const expected = EXPECTED_WORKBOOK_ROOM_SEQUENCES[property.id]!;
    assert.deepEqual(
      property.rooms.map((r) => ({ row: r.row, id: r.id, name: r.name })),
      expected.map(({ row, id, name }) => ({ row, id, name })),
      `${property.id} booking catalog rooms match workbook sequence`,
    );
  }
});

test("buildHeroStrip labels each official room once in workbook order, avoids duplicate labels on secondary tiles, and does not invent room positions for 2-room properties", () => {
  // 4-room property (e.g. The Nắng Suites) with 5 desktop mosaic tiles and 6 mobile strip slides
  const nangGroups = [
    {
      room: "Yellow Submarine",
      photos: [
        { id: "ys-1", src: "/img/ys-1.jpg", width: 800, height: 600, alt: "YS 1", room: "Yellow Submarine" },
        { id: "ys-2", src: "/img/ys-2.jpg", width: 800, height: 600, alt: "YS 2", room: "Yellow Submarine" },
      ],
    },
    {
      room: "Pale Blue Eyes",
      photos: [
        { id: "pbe-1", src: "/img/pbe-1.jpg", width: 800, height: 600, alt: "PBE 1", room: "Pale Blue Eyes" },
        { id: "pbe-2", src: "/img/pbe-2.jpg", width: 800, height: 600, alt: "PBE 2", room: "Pale Blue Eyes" },
      ],
    },
    {
      room: "Green River",
      photos: [{ id: "gr-1", src: "/img/gr-1.jpg", width: 800, height: 600, alt: "GR 1", room: "Green River" }],
    },
    {
      room: "Blue Moon",
      photos: [{ id: "bm-1", src: "/img/bm-1.jpg", width: 800, height: 600, alt: "BM 1", room: "Blue Moon" }],
    },
  ];
  const nangSlides = buildHeroStrip(nangGroups);
  assert.equal(nangSlides.length, 6);
  assert.deepEqual(
    nangSlides.map((s) => s.roomLabel),
    ["Yellow Submarine", "Pale Blue Eyes", "Green River", "Blue Moon", null, null],
  );
  assert.equal(new Set(nangSlides.map((s) => s.photo.src)).size, 6);

  // 2-room property (Pepper House): only 2 official room labels, never 4 artificial room positions
  const pepperGroups = [
    {
      room: "Pepper House 3rd-floor",
      photos: [
        { id: "ph-3-1", src: "/img/ph-3-1.jpg", width: 800, height: 600, alt: "PH 3rd 1", room: "Pepper House 3rd-floor" },
        { id: "ph-3-2", src: "/img/ph-3-2.jpg", width: 800, height: 600, alt: "PH 3rd 2", room: "Pepper House 3rd-floor" },
      ],
    },
    {
      room: "Pepper House 4th-floor",
      photos: [
        { id: "ph-4-1", src: "/img/ph-4-1.jpg", width: 800, height: 600, alt: "PH 4th 1", room: "Pepper House 4th-floor" },
        { id: "ph-4-2", src: "/img/ph-4-2.jpg", width: 800, height: 600, alt: "PH 4th 2", room: "Pepper House 4th-floor" },
      ],
    },
  ];
  const pepperSlides = buildHeroStrip(pepperGroups);
  assert.equal(pepperSlides.length, 4);
  assert.deepEqual(
    pepperSlides.map((s) => s.roomLabel),
    ["Pepper House 3rd-floor", "Pepper House 4th-floor", null, null],
  );
});
