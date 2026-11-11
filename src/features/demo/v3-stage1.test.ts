import assert from "node:assert/strict";
import { test } from "node:test";
import { HERO_SELECTION, SELECTION, selectionImage } from "@/content/vnest-workbook/image-selection";
import type { SelectionManifest } from "@/content/vnest-workbook/selection-photos";
import type { IsoDate } from "@/domain/dates";
import {
  demoBookingResultsUrl,
  demoBookingStepFromMultiRoomUrl,
  demoBookingUrl,
  demoPropertyUrl,
  demoPropertyUrlFromMultiRoom,
  stayFromQuery,
} from "./booking-flow";
import { HERO_AUTOPLAY_INTERVAL, heroSlides } from "./hero-slides";

// VNest V3 Stage 1 (24/10/2026): BOOK NOW's addresses. The hero carousel's set is the owner's
// image selection since 26/10/2026 (image-selection.ts).

const properties = [
  { id: "pepper-house", name: "Pepper House", location: { label: "TP. Hồ Chí Minh" } },
  { id: "bare-chic", name: "Bare Chic", location: { label: "TP. Hồ Chí Minh" } },
  { id: "the-nang-suites", name: "The Nắng Suites", location: { label: "Đà Nẵng" } },
  { id: "bare-hyphen", name: "Bare Hyphen", location: { label: "TP. Hồ Chí Minh" } },
  { id: "bare-da-kao", name: "Bare Đa Kao", location: { label: "TP. Hồ Chí Minh" } },
  { id: "bare-han", name: "Bare Hàn", location: { label: "Đà Nẵng" } },
];
const variant = (key: string, type: string, width: number) => ({ src: `/dev-client-media/selection/${key}/${width}.${type.split("/")[1]}`, type, width, height: Math.round(width / 1.5), bytes: 1 });
const manifestFor = (images = SELECTION): SelectionManifest => ({
  photos: Object.fromEntries(images.map((c) => [c.key, { sha256: c.sha256, width: 2048, height: 1365, variants: [480, 800, 1600, 2048].flatMap((w) => ["image/avif", "image/jpeg"].map((t) => variant(c.key, t, w))) }])),
});

test("hero carousel shows the six selected photographs, one per property, in the owner's order", () => {
  const slides = heroSlides(manifestFor(), properties);
  // Owner's Phase A corrections (7/11/2026): was 3000 ms; now 600 ms fade + about 2 s fully visible.
  assert.equal(HERO_AUTOPLAY_INTERVAL, 2600);
  assert.deepEqual(HERO_SELECTION, [1, 5, 9, 11, 13, 17]);
  assert.deepEqual(
    slides.map((s) => s.id),
    ["sel-01-bare-chic-one", "sel-05-bare-hyphen-two", "sel-09-bare-da-kao-four", "sel-11-bare-han-two", "sel-13-the-nang-pale-blue-eyes", "sel-17-pepper-house-4th-floor"],
  );
  assert.equal(slides[0]!.caption, "Bare Chic One · TP. Hồ Chí Minh");
  assert.equal(slides[4]!.caption, "The Nắng Suites · Pale Blue Eyes · Đà Nẵng");
  for (const slide of slides) {
    assert.ok(slide.alt.length > 20);
    assert.ok(slide.position && slide.tabletPosition && slide.mobilePosition, "one crop per breakpoint");
    assert.ok(!slide.fallback.srcSet.includes(" 480w"), "the hero never offers the 480px derivative");
  }
});

test("hero carousel fails closed: no manifest, a changed file, an unknown property", () => {
  assert.deepEqual(heroSlides(null, properties), []);
  const manifest = manifestFor();
  const first = selectionImage(1)!;
  for (const change of [{ sha256: "changed" }, { variants: [] }]) {
    const changed = { photos: { ...manifest.photos, [first.key]: { ...manifest.photos[first.key]!, ...change } } };
    assert.ok(!heroSlides(changed, properties).some((s) => s.id === first.key));
  }
  assert.ok(!heroSlides(manifest, properties.filter((p) => p.id !== "bare-han")).some((s) => s.id === "sel-11-bare-han-two"));
});

test("no photograph on hold (a person visible, Q15) can enter the carousel", () => {
  const held = SELECTION.filter((image) => image.hold);
  assert.deepEqual(held.map((image) => image.n), [2]);
  for (const image of held) assert.ok(!HERO_SELECTION.includes(image.n));
  assert.deepEqual(heroSlides(manifestFor(held), properties), []);
});

test("BOOK NOW carries property, dates, guests and room to the demo booking step", () => {
  const criteria = { checkIn: "2026-11-06" as IsoDate, checkOut: "2026-11-08" as IsoDate, adults: 3 };
  const url = demoBookingUrl({ criteria, filters: { property: "bare-chic" } }, "Bare Chic Two");
  assert.equal(url, "/dev/demo/dat-phong?property=bare-chic&checkIn=2026-11-06&checkOut=2026-11-08&adults=3&room=Bare+Chic+Two");
  const back = stayFromQuery(Object.fromEntries(new URL(url, "http://x").searchParams));
  assert.deepEqual(back, { criteria, filters: { property: "bare-chic" } });
  assert.equal(demoBookingUrl({ criteria: { adults: 2 }, filters: {} }), "/dev/demo/dat-phong");
});

test("a property's demo page keeps the demo view and the stay; properties without a demo page have none", () => {
  const criteria = { checkIn: "2026-11-06" as IsoDate, checkOut: "2026-11-08" as IsoDate, adults: 2 };
  assert.equal(demoPropertyUrl("bare-chic", criteria, "rooms"), "/dev/stays/bare-chic?view=demo&checkIn=2026-11-06&checkOut=2026-11-08#rooms");
  assert.equal(demoPropertyUrl("bare-hyphen", criteria, "rooms"), "/dev/stays/bare-hyphen?checkIn=2026-11-06&checkOut=2026-11-08#rooms");
  assert.equal(demoPropertyUrl("bare-da-kao", criteria, "rooms"), "/dev/stays/bare-da-kao?checkIn=2026-11-06&checkOut=2026-11-08#rooms");
  assert.equal(demoPropertyUrl("bare-han", criteria, "rooms"), "/dev/stays/bare-han?checkIn=2026-11-06&checkOut=2026-11-08#rooms");
  assert.equal(demoPropertyUrl("the-nang-suites", criteria), "/dev/stays/the-nang-suites?checkIn=2026-11-06&checkOut=2026-11-08");
  assert.equal(demoPropertyUrl("pepper-house", criteria), "/dev/stays/pepper-house?checkIn=2026-11-06&checkOut=2026-11-08");
  assert.equal(demoPropertyUrl("unknown-property", criteria), undefined);
  assert.equal(demoPropertyUrl(undefined), undefined);
});

test("a property page's stay always names that property, whatever the address says", () => {
  assert.deepEqual(stayFromQuery({ property: "pepper-house", checkIn: "2026-11-06" }, "bare-chic").filters, { property: "bare-chic" });
});

test("BOOK NOW enters Booking Results (/dev/demo/tim-phong) with property, dates, rooms, adults, and room preference", () => {
  const criteria = { checkIn: "2026-11-06" as IsoDate, checkOut: "2026-11-08" as IsoDate, adults: 2 };
  // All Properties -> property=all&rooms=1&adults=2
  assert.equal(
    demoBookingResultsUrl({ criteria, filters: {} }),
    "/dev/demo/tim-phong?property=all&checkIn=2026-11-06&checkOut=2026-11-08&rooms=1&adults=2",
  );
  // Selected property + room from viewer/drawer
  assert.equal(
    demoBookingResultsUrl({ criteria: { ...criteria, adults: 3 }, filters: { property: "bare-chic" } }, { room: "Bare Chic Two" }),
    "/dev/demo/tim-phong?property=bare-chic&checkIn=2026-11-06&checkOut=2026-11-08&rooms=2%2C1&adults=3&room=Bare+Chic+Two",
  );
  // Preserves existing multi-room context (rooms=2,2 and prefs=bare-chic-one,) when re-searching from a property page
  assert.equal(
    demoBookingResultsUrl(
      { criteria: { ...criteria, adults: 4 }, filters: { property: "bare-chic" } },
      { contextQuery: { rooms: "2,2", prefs: "bare-chic-one," }, room: "Bare Chic Two" },
    ),
    "/dev/demo/tim-phong?property=bare-chic&checkIn=2026-11-06&checkOut=2026-11-08&rooms=2%2C2&adults=4&prefs=bare-chic-one%2C&room=Bare+Chic+Two",
  );
  // The address's two rooms are kept when the bar asks for 5 guests: the results page asks to correct it (no room is added).
  assert.equal(
    demoBookingResultsUrl(
      { criteria: { ...criteria, adults: 5 }, filters: { property: "bare-chic" } },
      { contextQuery: { rooms: "2,2", prefs: "bare-chic-one," } },
    ),
    "/dev/demo/tim-phong?property=bare-chic&checkIn=2026-11-06&checkOut=2026-11-08&rooms=2%2C2&adults=5&prefs=bare-chic-one%2C",
  );
});

test("multi-room state links cleanly to property demo pages and Step 05 booking summary", () => {
  const state = {
    propertySlug: "bare-chic",
    checkIn: "2026-11-06" as IsoDate,
    checkOut: "2026-11-08" as IsoDate,
    roomGroups: [
      { slotIndex: 1, adults: 2, preferredRoomId: "bare-chic-one" },
      { slotIndex: 2, adults: 2, preferredRoomId: "bare-chic-two" },
    ],
  };
  assert.equal(
    demoPropertyUrlFromMultiRoom("bare-chic", state, "rooms"),
    "/dev/stays/bare-chic?view=demo&checkIn=2026-11-06&checkOut=2026-11-08&rooms=2%2C2&adults=4&prefs=bare-chic-one%2Cbare-chic-two#rooms",
  );
  assert.equal(
    demoBookingStepFromMultiRoomUrl(state),
    "/dev/demo/dat-phong?property=bare-chic&checkIn=2026-11-06&checkOut=2026-11-08&rooms=2%2C2&adults=4&prefs=bare-chic-one%2Cbare-chic-two",
  );
  assert.deepEqual(stayFromQuery({ property: "all", checkIn: "2026-11-06", checkOut: "2026-11-08", rooms: "2,3" }), {
    criteria: { checkIn: "2026-11-06", checkOut: "2026-11-08", adults: 5 },
    filters: {},
  });
});
