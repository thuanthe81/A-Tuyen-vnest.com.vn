import assert from "node:assert/strict";
import { test } from "node:test";
import type { IsoDate } from "./dates.ts";
import type { PropertyRecord } from "./property.ts";
import { galleryMedia, isPublishable, resolveProperty } from "./property.ts";
import { validatePropertyRecord } from "./property-validation.ts";

const options = { layouts: ["baseline"], themeableTokens: ["--vn-action"] };

function record(overrides: Partial<PropertyRecord> = {}): PropertyRecord {
  return {
    id: "p1",
    slug: "test-property",
    source: "client-supplied",
    status: "draft",
    approvedLocales: ["vi"],
    identity: { name: { vi: "Tên" }, signatureMediaId: "img-1" },
    narrative: {},
    place: { area: { id: "a1", slug: "area", name: { vi: "Khu vực" } }, timeZone: "Asia/Ho_Chi_Minh" },
    media: {
      images: [{ kind: "image", id: "img-1", src: "/p/1.jpg", alt: { vi: "Mô tả" }, rights: "client-approved", width: 1600, height: 1000 }],
      videos: [],
    },
    amenities: [],
    nearby: [],
    rooms: [{ id: "r1", slug: "room-one", name: { vi: "Phòng" }, maxOccupancy: 2, amenities: [], mediaIds: ["img-1"] }],
    rateReferences: [],
    policies: [],
    faqs: [],
    seo: {},
    presentation: { layout: "baseline", sections: [{ kind: "collection", id: "s1", collection: "rooms" }] },
    booking: { providers: { any: { propertyRef: "X", roomRefs: { r1: "X1" } } } },
    ...overrides,
  };
}

const messages = (candidate: PropertyRecord) => validatePropertyRecord(candidate, options).map((issue) => `${issue.path}: ${issue.message}`);

test("a well-formed record has no issues, draft or approved", () => {
  assert.deepEqual(messages(record()), []);
  assert.deepEqual(messages(record({ status: "approved" })), []);
});

test("broken references are reported", () => {
  const broken = record({
    identity: { name: { vi: "Tên" }, signatureMediaId: "missing" },
    rateReferences: [{ id: "rate", roomTypeId: "nope", from: { amount: 0, currency: "vnd" }, basis: { vi: "x" }, verifiedOn: "2026-02-30" as IsoDate }],
    booking: { providers: { any: { propertyRef: " ", roomRefs: { ghost: "X" } } } },
  });
  assert.deepEqual(messages(broken), [
    'identity.signatureMediaId: refers to unknown media "missing"',
    'rateReferences.rate.roomTypeId: refers to unknown room type "nope"',
    "rateReferences.rate.from: must be a positive amount",
    "rateReferences.rate.from.currency: must be an ISO 4217 code",
    "rateReferences.rate.verifiedOn: must be a real calendar date",
    "booking.providers.any.propertyRef: is empty",
    'booking.providers.any.roomRefs: refers to unknown room type "ghost"',
  ]);
});

test("duplicate ids, bad slugs, unknown layouts, tokens and timezones are reported", () => {
  const base = record();
  const broken = record({
    slug: "Not A Slug",
    rooms: [...base.rooms, { ...base.rooms[0]!, slug: "Bad Slug" }],
    place: { ...base.place, timeZone: "Mars/Olympus" },
    presentation: { layout: "unknown", sections: [], theme: { tokens: { "--vn-space-4": "0" } } },
  });
  assert.deepEqual(messages(broken), [
    'slug: "Not A Slug" is not a lowercase, hyphen-separated slug',
    'rooms: duplicate id "r1"',
    'rooms.r1.slug: "Bad Slug" is not a valid slug',
    'presentation.layout: "unknown" is not a registered layout',
    'presentation.theme.tokens: "--vn-space-4" is not a themeable token',
    'place.timeZone: "Mars/Olympus" is not an IANA timezone',
  ]);
});

test("an approved language must be fully translated", () => {
  const english = record({ approvedLocales: ["vi", "en"], identity: { name: { vi: "Tên", en: "Name" } } });
  assert.deepEqual(messages(english), [
    'place.area.name: has no "en" text',
    'media.images[0].alt: has no "en" text',
    'rooms[0].name: has no "en" text',
  ]);
  assert.deepEqual(messages(record({ approvedLocales: ["en"] }))[0], 'approvedLocales: must include the primary language "vi"');
});

test("publication rules: mock is never approved, approved shows only cleared media", () => {
  assert.deepEqual(messages(record({ source: "mock", status: "approved" })), ["status: a mock record can never be approved"]);
  const base = record();
  const stock = record({ status: "approved", media: { images: [{ ...base.media.images[0]!, rights: "temporary-licensed" }], videos: [] } });
  assert.deepEqual(messages(stock), ['media.img-1.rights: is "temporary-licensed" on an approved record']);
  const pending = { ...base.media.images[0]!, rights: "client-supplied-pending" as const };
  assert.deepEqual(messages(record({ status: "draft", media: { images: [pending], videos: [] } })), [], "allowed on a draft");
  assert.deepEqual(messages(record({ status: "approved", media: { images: [pending], videos: [] } })), ['media.img-1.rights: is "client-supplied-pending" on an approved record']);
  const noFile = record({ media: { images: [{ kind: "image", id: "img-1", alt: { vi: "x" }, rights: "client-approved", width: 1, height: 1 }], videos: [] } });
  assert.deepEqual(messages(noFile), ["media.img-1.src: is missing on a non-placeholder image"]);
});

test("resolveProperty serves only approved and enabled languages, without the provider mapping", () => {
  const source = record({ approvedLocales: ["vi", "en"] });
  const property = resolveProperty(source, "vi", ["vi"]);
  assert.ok(property);
  assert.equal(property.identity.name, "Tên");
  assert.deepEqual(property.availableLocales, ["vi"]);
  assert.equal("booking" in property, false);
  assert.equal(resolveProperty(source, "en", ["vi"]), undefined);
  assert.equal(resolveProperty(record(), "en", ["vi", "en"]), undefined);
});

test("only approved, non-mock records are publishable", () => {
  assert.equal(isPublishable({ source: "client-supplied", status: "approved" }), true);
  assert.equal(isPublishable({ source: "client-supplied", status: "draft" }), false);
  assert.equal(isPublishable({ source: "mock", status: "approved" }), false);
});

test("gallery: every id must exist, appear once, and show the property rather than a room", () => {
  const images = [
    { kind: "image", id: "img-1", src: "/p/1.jpg", alt: { vi: "Mô tả" }, rights: "client-approved", width: 1600, height: 1000 },
    { kind: "image", id: "img-2", src: "/p/2.jpg", alt: { vi: "Mô tả" }, rights: "client-approved", width: 1600, height: 1000 },
    { kind: "image", id: "img-room", src: "/p/3.jpg", alt: { vi: "Mô tả" }, rights: "client-approved", width: 1600, height: 1000, roomTypeId: "r1" },
  ] as const;
  const withGallery = (galleryMediaIds: string[]) => record({ identity: { name: { vi: "Tên" }, signatureMediaId: "img-1", galleryMediaIds }, media: { images, videos: [] } });
  assert.deepEqual(messages(withGallery(["img-1", "img-2"])), []);
  assert.deepEqual(messages(withGallery(["img-1", "missing"])), ['identity.galleryMediaIds: refers to unknown media "missing"']);
  assert.deepEqual(messages(withGallery(["img-1", "img-1"])), ['identity.galleryMediaIds: lists "img-1" more than once']);
  assert.deepEqual(messages(withGallery(["img-room"])), ['identity.galleryMediaIds: "img-room" shows a room type; the gallery is for the property']);
});

test("gallery media: VNest's order, or the signature visual alone, or nothing", () => {
  const images = [
    { kind: "image", id: "img-1", src: "/p/1.jpg", alt: { vi: "Một" }, rights: "client-approved", width: 1600, height: 1000 },
    { kind: "image", id: "img-2", src: "/p/2.jpg", alt: { vi: "Hai" }, rights: "client-approved", width: 1600, height: 1000 },
  ] as const;
  const resolved = (identity: PropertyRecord["identity"]) => galleryMedia(resolveProperty(record({ identity, media: { images, videos: [] } }), "vi", ["vi"])!).map((asset) => asset.id);
  assert.deepEqual(resolved({ name: { vi: "Tên" }, signatureMediaId: "img-1", galleryMediaIds: ["img-2", "img-1"] }), ["img-2", "img-1"]);
  assert.deepEqual(resolved({ name: { vi: "Tên" }, signatureMediaId: "img-1" }), ["img-1"]);
  assert.deepEqual(resolved({ name: { vi: "Tên" }, signatureMediaId: "img-1", galleryMediaIds: [] }), ["img-1"]);
  assert.deepEqual(resolved({ name: { vi: "Tên" } }), []);
});

test("amenity icons come from the fixed list, and a room highlight is one short line", () => {
  assert.deepEqual(messages(record({ amenities: [{ id: "am", label: { vi: "Hồ bơi" }, icon: "pool" }] })), []);
  const unknownIcon = record({ amenities: [{ id: "am", label: { vi: "Hồ bơi" }, icon: "jacuzzi" as never }] });
  assert.deepEqual(messages(unknownIcon), ['amenities.am.icon: "jacuzzi" is not a known amenity icon']);

  const room = (highlight: string) => record({ rooms: [{ id: "r1", slug: "room-one", name: { vi: "Phòng" }, highlight: { vi: highlight }, amenities: [], mediaIds: [] }] });
  assert.deepEqual(messages(room("Ban công nhìn ra vườn")), []);
  assert.deepEqual(messages(room("Dòng một\nDòng hai")), ["rooms.r1.highlight: must be one line of at most 80 characters"]);
  assert.deepEqual(messages(room("x".repeat(81))), ["rooms.r1.highlight: must be one line of at most 80 characters"]);
  // An approved language must have the highlight translated, like every other text.
  const untranslated = { ...room("Ban công"), approvedLocales: ["vi", "en"] as const };
  assert.ok(messages(untranslated).includes('rooms[0].highlight: has no "en" text'));
});
