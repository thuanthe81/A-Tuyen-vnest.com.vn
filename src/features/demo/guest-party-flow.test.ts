/**
 * Phase D (9/11/2026): the homepage bar's guest field (adults + children, no room stepper) and how children travel.
 * Children are carried and shown, never folded into adults, never allocated to rooms, and never sent to a provider as an
 * adults-only stay (no child policy is confirmed: guest-party.ts).
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import type { IsoDate } from "@/domain/dates";
import { describeAvailability } from "@/domain/hybrid-booking/availability-view";
import { resolveHandoffAction } from "@/domain/hybrid-booking/ezcloud-handoff";
import { resolvePropertyAvailability } from "@/integrations/booking/resolve-availability";
import {
  demoBookingResultsUrl,
  demoBookingStepFromMultiRoomUrl,
  demoHomeSearchHref,
  demoPropertyUrl,
  demoPropertyUrlFromMultiRoom,
  homeStayKey,
  stayFromQuery,
} from "./booking-flow";
import { parseMultiRoomQuery, serializeMultiRoomQuery } from "./booking-results-state";
import { stayKey, stayRequestFromState } from "./hybrid-results";
import { compactGuestSummaries, occupancySummary } from "./occupancy-copy";

const SLUGS = ["bare-chic", "bare-da-kao", "pepper-house"];
const stay = (adults: number) => ({
  criteria: { checkIn: "2026-12-10" as IsoDate, checkOut: "2026-12-12" as IsoDate, adults },
  filters: {},
});
const query = (url: string) => new URL(url, "http://x").searchParams;

test("homepage bar without a room stepper: the results start at the fewest rooms that fit the adults", () => {
  // No rooms from the field and none in the homepage address.
  const three = query(demoBookingResultsUrl(stay(3), { contextQuery: {} }));
  assert.equal(three.get("rooms"), "2,1");
  assert.equal(three.get("adults"), "3");
  assert.equal(three.has("children"), false, "no children, no parameter");
  assert.equal(query(demoBookingResultsUrl(stay(2), { contextQuery: {} })).get("rooms"), "1");
});

test("an explicit room choice already in the address is kept as it is, never resized for the adults", () => {
  const url = query(demoBookingResultsUrl(stay(3), { contextQuery: { rooms: "1" } }));
  assert.equal(url.get("rooms"), "1");
  assert.equal(url.get("adults"), "3", "the results page then asks the guest to correct it");
});

test("children travel beside the adults and are never added to them", () => {
  const url = query(demoBookingResultsUrl(stay(2), { contextQuery: {}, children: 2 }));
  assert.equal(url.get("adults"), "2");
  assert.equal(url.get("children"), "2");
  assert.equal(url.get("rooms"), "1", "children do not change the rooms");
});

test("children survive results → property page → booking step and Back (address round trip)", () => {
  const state = parseMultiRoomQuery({ property: "bare-da-kao", checkIn: "2026-12-10", checkOut: "2026-12-12", rooms: "2,1", adults: "3", children: "1" }, SLUGS);
  assert.equal(state.children, 1);
  assert.deepEqual(state.roomGroups.map((g) => g.adults), [2, 1], "rooms count adults only");
  const again = parseMultiRoomQuery(Object.fromEntries(new URLSearchParams(serializeMultiRoomQuery(state))), SLUGS);
  assert.equal(again.children, 1);
  assert.equal(query(demoPropertyUrlFromMultiRoom("bare-da-kao", state)!).get("children"), "1");
  assert.equal(query(demoBookingStepFromMultiRoomUrl(state)).get("children"), "1");
  const none = parseMultiRoomQuery({ property: "bare-da-kao", rooms: "1", adults: "2", children: "abc" }, SLUGS);
  assert.equal(none.children, undefined, "an unreadable value is no children");
});

test("a stay with children is a different stay for availability, and GoHost is not asked about it", async () => {
  const base = { checkIn: "2026-12-10" as IsoDate, checkOut: "2026-12-12" as IsoDate, roomGroups: parseMultiRoomQuery({ rooms: "1", adults: "2" }, SLUGS).roomGroups };
  const withChildren = stayRequestFromState({ ...base, children: 2 });
  const without = stayRequestFromState(base);
  assert.equal(withChildren.children, 2);
  assert.equal("children" in without, false);
  assert.notEqual(stayKey(withChildren), stayKey(without), "changing children marks earlier answers stale");

  const today = "2026-11-09" as IsoDate;
  const gohost = await resolvePropertyAvailability("bare-da-kao", withChildren, { env: {}, today, simulation: { "bare-da-kao": "available" } });
  assert.deepEqual(gohost, { status: "needs-provider-check", provider: "gohost", reason: "children-policy" }, "not even a simulation claims rooms");
  assert.match(describeAvailability(gohost).headline, /trẻ em/);
  const ezcloud = await resolvePropertyAvailability("bare-chic", withChildren, { env: {}, today });
  assert.equal(ezcloud.status, "needs-provider-check", "ezCloud stays a hand-off");
  const adultsOnly = await resolvePropertyAvailability("bare-da-kao", without, { env: {}, today });
  assert.equal(adultsOnly.status, "unconfigured", "without children nothing changes");
});

test("ezCloud hand-off transfers children only under a parameter name the provider confirmed", () => {
  const request = { checkIn: "2026-12-10" as IsoDate, checkOut: "2026-12-12" as IsoDate, roomAdults: [2], children: 1 };
  const plain = resolveHandoffAction("bare-han", request, { "bare-han": { status: "configured", destinationUrl: "https://booking.example.test/x" } });
  assert.equal(plain.kind === "external" && plain.transfers.children, false);
  const named = resolveHandoffAction("bare-han", request, {
    "bare-han": { status: "configured", destinationUrl: "https://booking.example.test/x", params: { children: "kids" } },
  });
  assert.ok(named.kind === "external" && named.transfers.children && new URL(named.href).searchParams.get("kids") === "1");
});

test("the homepage remembers a submitted search in its own address, for Back and refresh", () => {
  const href = demoHomeSearchHref({ pathname: "/dev/demo", search: "?intro=off&lang=en&prefs=x&room=r1" }, stay(3), { children: 1 });
  const url = query(href);
  assert.equal(new URL(href, "http://x").pathname, "/dev/demo");
  assert.equal(url.get("intro"), "off", "non-search parameters are kept");
  assert.equal(url.get("lang"), "en");
  assert.equal(url.get("checkIn"), "2026-12-10");
  assert.equal(url.get("checkOut"), "2026-12-12");
  assert.equal(url.get("adults"), "3");
  assert.equal(url.get("children"), "1");
  assert.equal(url.has("rooms"), false, "no rooms are invented on the homepage");
  assert.equal(url.has("property"), false, "all properties is the default");
  assert.equal(url.has("prefs") || url.has("room"), false, "room preferences belong to the results, not the homepage");
  // Parsed back exactly as the homepage parses its address.
  const parsed = stayFromQuery(Object.fromEntries(url));
  assert.deepEqual(parsed.criteria, stay(3).criteria);
});

test("the remembered homepage search keeps a property and an explicit room choice as they are", () => {
  const withProperty = { ...stay(3), filters: { property: "bare-da-kao" } };
  const url = query(demoHomeSearchHref({ pathname: "/dev/demo", search: "?rooms=1" }, withProperty, { roomAdults: [3] }));
  assert.equal(url.get("property"), "bare-da-kao");
  assert.equal(url.get("rooms"), "1", "one room, as chosen, not resized for three adults");
  assert.equal(url.get("adults"), "3");
  assert.equal(query(demoHomeSearchHref({ pathname: "/dev/demo", search: "" }, stay(4), { roomAdults: [2, 2] })).get("rooms"), "2,2");
  // Searching again with fewer details drops what the new search no longer has.
  const again = query(demoHomeSearchHref({ pathname: "/dev/demo", search: "?checkIn=2026-12-01&children=2&property=bare-chic" }, stay(2)));
  assert.equal(again.has("children"), false);
  assert.equal(again.has("property"), false);
  assert.equal(again.get("checkIn"), "2026-12-10");
});

test("compact bars: shorter guest readings keep adults and children apart and drop rooms before cutting a word", () => {
  const property = compactGuestSummaries(3, 2, 1);
  assert.deepEqual(property, ["3 người lớn · 1 trẻ · 2 phòng", "3 lớn · 1 trẻ · 2 phòng", "3 người lớn · 1 trẻ em", "3 người lớn · 1 trẻ", "3 lớn · 1 trẻ"]);
  assert.deepEqual(compactGuestSummaries(3, null, 1), ["3 người lớn · 1 trẻ", "3 lớn · 1 trẻ"], "homepage: no rooms to show");
  assert.deepEqual(compactGuestSummaries(3, 2, 0), ["3 khách"], "no children: the frozen reading, rooms dropped last");
  assert.deepEqual(compactGuestSummaries(2, null, 0), [], "homepage without children: the full reading is already short");
  for (const reading of [...property, ...compactGuestSummaries(12, 6, 6)]) {
    assert.doesNotMatch(reading, /\b(4|18) (khách|người lớn|lớn)\b/, "children are never added to the adults");
  }
  // Every shorter reading is shorter than the full one.
  const full = occupancySummary(3, 2, 1);
  for (const reading of property) assert.ok(reading.length < full.length, reading);
});

test("homepage brand cards carry the whole remembered search: dates, adults, children and chosen rooms", () => {
  const card = query(demoPropertyUrl("bare-da-kao", stay(3).criteria, undefined, { children: 1, rooms: "2,1" })!);
  assert.equal(card.get("checkIn"), "2026-12-10");
  assert.equal(card.get("adults"), "3");
  assert.equal(card.get("children"), "1");
  assert.equal(card.get("rooms"), "2,1");
  const plain = query(demoPropertyUrl("bare-da-kao", stay(3).criteria)!);
  assert.equal(plain.has("rooms") || plain.has("children"), false, "nothing added when the search has none");
});

test("the homepage knows when a cached render was made for another address (Back after a submitted search)", () => {
  const before = homeStayKey({ intro: "0" });
  const after = homeStayKey(Object.fromEntries(query(demoHomeSearchHref({ pathname: "/dev/demo", search: "?intro=0" }, stay(3), { children: 1 }))));
  assert.notEqual(before, after);
  assert.equal(homeStayKey({ intro: "0", lang: "en" }), before, "intro and lang are not part of the search");
  assert.equal(after, homeStayKey({ checkIn: "2026-12-10", checkOut: "2026-12-12", adults: "3", children: "1", lang: "en" }));
});
