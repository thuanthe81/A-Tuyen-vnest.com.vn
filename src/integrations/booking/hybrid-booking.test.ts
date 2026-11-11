import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, test } from "node:test";
import type { IsoDate } from "@/domain/dates";
import { describeAvailability } from "@/domain/hybrid-booking/availability-view";
import { parseSimulation } from "@/domain/hybrid-booking/availability-simulation";
import { bookingModeForProperty, usesExternalHandoff, usesNativeBooking } from "@/domain/hybrid-booking/booking-mode";
import { resolveHandoffAction, EZCLOUD_HANDOFF_BY_PROPERTY, type EzcloudHandoffConfig } from "@/domain/hybrid-booking/ezcloud-handoff";
import { createGoHostAdapter, type GoHostAdapter } from "./gohost-adapter";
import { staleAvailability, type StayRequest } from "@/domain/hybrid-booking/property-availability";
import { PROPERTY_PROVIDER_ASSIGNMENT } from "@/domain/hybrid-booking/provider-assignment";
import { readGoHostConfig } from "./provider-config";
import { resolveAllPropertyAvailability, resolvePropertyAvailability } from "./resolve-availability";
import { validateSelectionQuantities, validateStay } from "@/domain/hybrid-booking/stay-validation";
import { createRoomSlot } from "@/features/demo/booking-results-state";
import { stayRequestFromState } from "@/features/demo/hybrid-results";

const d = (value: string) => value as IsoDate;
const stay: StayRequest = { checkIn: d("2026-12-10"), checkOut: d("2026-12-12"), roomAdults: [2, 2] };
const today = d("2026-11-03");

describe("booking mode by property", () => {
  test("GoHost properties book natively and ezCloud properties hand off", () => {
    for (const id of ["bare-da-kao", "pepper-house"]) assert.equal(bookingModeForProperty(id), "native");
    for (const id of ["bare-chic", "bare-hyphen", "bare-han", "the-nang-suites"]) assert.equal(bookingModeForProperty(id), "external-handoff");
    assert.equal(usesNativeBooking("pepper-house"), true);
    assert.equal(usesExternalHandoff("bare-han"), true);
    assert.equal(bookingModeForProperty("bare-tan-dinh"), undefined, "Bare Tân Định is an alias, not a seventh property");
    assert.equal(Object.keys(PROPERTY_PROVIDER_ASSIGNMENT).length, 6);
  });
});

describe("stay and quantity validation (server side)", () => {
  test("accepts a valid stay and rejects bad dates, rooms and guests", () => {
    assert.deepEqual(validateStay(stay, today), { ok: true });
    assert.deepEqual(validateStay({ ...stay, checkOut: d("2026-12-10") }, today), { ok: false, issues: ["check-out-not-after-check-in"] });
    assert.deepEqual(validateStay({ ...stay, checkIn: d("2026-11-01"), checkOut: d("2026-11-04") }, today), { ok: false, issues: ["check-in-in-past"] });
    assert.deepEqual(validateStay({ roomAdults: [2] }, today), { ok: false, issues: ["dates-missing"] });
    assert.deepEqual(validateStay({ ...stay, roomAdults: [] }, today), { ok: false, issues: ["rooms-out-of-range"] });
    assert.deepEqual(validateStay({ ...stay, roomAdults: [0] }, today), { ok: false, issues: ["adults-out-of-range"] });
    assert.deepEqual(validateStay({ ...stay, checkOut: d("2027-02-10") }, today), { ok: false, issues: ["stay-too-long"] });
  });

  test("repeating a room name is not inventory: quantities pass only against verified units", () => {
    const selection = { preferredRoomIds: ["bare-da-kao-one", "bare-da-kao-one"] };
    assert.deepEqual(validateSelectionQuantities(selection, null), { ok: true, verified: false });
    assert.deepEqual(validateSelectionQuantities(selection, [{ roomId: "bare-da-kao-one", availableUnits: 1, quote: null }]), {
      ok: false,
      room: "bare-da-kao-one",
      requested: 2,
      available: 1,
    });
    assert.deepEqual(validateSelectionQuantities(selection, [{ roomId: "bare-da-kao-one", availableUnits: 2, quote: null }]), { ok: true, verified: true });
  });
});

describe("availability resolution", () => {
  test("with no GoHost configuration GoHost properties are unconfigured, never unavailable", async () => {
    const state = await resolvePropertyAvailability("pepper-house", stay, { env: {}, today });
    assert.equal(state.status, "unconfigured");
    assert.ok(state.status === "unconfigured" && state.missing.includes("missing-server-credentials"));
  });

  test("ezCloud properties always need the provider's own check", async () => {
    for (const id of ["bare-chic", "bare-hyphen", "bare-han", "the-nang-suites"]) {
      assert.deepEqual(await resolvePropertyAvailability(id, stay, { env: {}, today }), {
        status: "needs-provider-check",
        provider: "ezcloud",
        reason: "external-booking-engine",
      });
    }
  });

  test("a stay without valid dates asks for dates instead of claiming anything", async () => {
    const state = await resolvePropertyAvailability("bare-da-kao", { roomAdults: [2] }, { env: {}, today });
    assert.deepEqual(state, { status: "needs-provider-check", provider: "gohost", reason: "dates-required" });
  });

  test("guests that do not fit the rooms are never sent to the provider; the page is asked to correct them", async () => {
    let asked = false;
    const adapter: GoHostAdapter = {
      ...createGoHostAdapter(readGoHostConfig({})),
      searchAvailability: async () => {
        asked = true;
        throw new Error("must not be called");
      },
    };
    const state = await resolvePropertyAvailability("bare-da-kao", { ...stay, roomAdults: [3] }, { adapter, env: {}, today });
    assert.deepEqual(state, { status: "needs-provider-check", provider: "gohost", reason: "occupancy-correction" });
    assert.equal(asked, false);
    assert.equal(describeAvailability(state).headline, "Điều chỉnh số phòng và số khách để kiểm tra tình trạng phòng");
    // The results page sends an unfixed address as it is (3 guests, 1 room), never a silently adjusted stay.
    assert.deepEqual(stayRequestFromState({ ...stay, roomGroups: [createRoomSlot(1, 2, null)], guests: 3 }).roomAdults, [3]);
    assert.deepEqual(stayRequestFromState({ ...stay, roomGroups: [1, 1, 1].map((n, i) => createRoomSlot(i + 1, n, null)), guests: 2 }).roomAdults, [1, 1, 0]);
  });

  test("a throwing provider becomes an error state, not sold out, and other properties still resolve", async () => {
    const adapter: GoHostAdapter = {
      ...createGoHostAdapter(readGoHostConfig({})),
      searchAvailability: () => Promise.reject(new Error("socket hang up")),
    };
    const all = await resolveAllPropertyAvailability(stay, { adapter, today });
    assert.deepEqual(all["bare-da-kao"], { status: "error", provider: "gohost", code: "provider-error", retryable: true });
    assert.equal(all["pepper-house"]!.status, "error");
    assert.equal(all["bare-chic"]!.status, "needs-provider-check");
    assert.equal(Object.keys(all).length, 6);
  });

  test("a live response with free rooms is available and carries the provider quote; none free is unavailable", async () => {
    const quote = { source: "provider" as const, currency: "VND", totalAmount: 2_400_000, nights: 2, rateContext: "Giá linh hoạt", conditions: ["Đã gồm thuế"] };
    const base = createGoHostAdapter(readGoHostConfig({}));
    const withRooms = (rooms: { roomId: string; availableUnits: number; quote: typeof quote | null }[]): GoHostAdapter => ({
      ...base,
      searchAvailability: () => Promise.resolve({ ok: true, verifiedAt: "2026-11-03T00:00:00.000Z", data: { rooms } }),
      readRates: () => Promise.resolve({ ok: true, verifiedAt: "2026-11-03T00:00:00.000Z", data: { quotes: [] } }),
    });
    const free = await resolvePropertyAvailability("bare-da-kao", stay, { adapter: withRooms([{ roomId: "bare-da-kao-one", availableUnits: 1, quote }]), today });
    assert.equal(free.status, "available");
    assert.ok(free.status === "available" && free.simulated === false && free.startingQuote?.totalAmount === 2_400_000);
    const none = await resolvePropertyAvailability("bare-da-kao", stay, { adapter: withRooms([{ roomId: "bare-da-kao-one", availableUnits: 0, quote: null }]), today });
    assert.equal(none.status, "unavailable");
  });

  test("the adapter never starts a booking or reads a booking status in this milestone", async () => {
    const adapter = createGoHostAdapter(readGoHostConfig({ GOHOST_API_BASE_URL: "https://example.invalid", GOHOST_API_KEY: "test" }));
    assert.deepEqual(await adapter.initiateBooking(), { ok: false, reason: "booking-creation-disabled" });
    assert.deepEqual(await adapter.readBookingStatus("x"), { ok: false, reason: "booking-status-disabled" });
    const result = await adapter.searchAvailability({ propertyId: "bare-da-kao", stay: { ...stay, checkIn: stay.checkIn!, checkOut: stay.checkOut! } });
    assert.ok(!result.ok && result.failure.kind === "unconfigured", "missing property and room mappings keep it unconfigured even with credentials");
  });

  test("a non-https GoHost endpoint is ignored", () => {
    assert.equal(readGoHostConfig({ GOHOST_API_BASE_URL: "http://example.invalid" }).baseUrl, null);
  });
});

describe("ezCloud handoff", () => {
  test("every ezCloud property is unconfigured: no placeholder URL exists", () => {
    for (const id of ["bare-chic", "bare-hyphen", "bare-han", "the-nang-suites"]) {
      assert.deepEqual(EZCLOUD_HANDOFF_BY_PROPERTY[id], { status: "unconfigured" });
      assert.deepEqual(resolveHandoffAction(id, stay), { kind: "unconfigured" });
    }
  });

  test("a configured destination carries only the parameters the provider confirmed", () => {
    const registry: Record<string, EzcloudHandoffConfig> = {
      "bare-chic": { status: "configured", destinationUrl: "https://booking.example.test/bare-chic", params: { checkIn: "from", checkOut: "to" } },
      "bare-han": { status: "configured", destinationUrl: "https://booking.example.test/bare-han" },
      "bare-hyphen": { status: "configured", destinationUrl: "http://insecure.example.test/" },
    };
    const withDates = resolveHandoffAction("bare-chic", stay, registry);
    assert.ok(withDates.kind === "external");
    assert.equal(withDates.kind === "external" && withDates.href, "https://booking.example.test/bare-chic?from=2026-12-10&to=2026-12-12");
    assert.deepEqual(withDates.kind === "external" && withDates.transfers, { dates: true, guests: false, rooms: false, children: false });
    const bare = resolveHandoffAction("bare-han", stay, registry);
    assert.deepEqual(bare, { kind: "external", href: "https://booking.example.test/bare-han", transfers: { dates: false, guests: false, rooms: false, children: false } });
    assert.deepEqual(resolveHandoffAction("bare-hyphen", stay, registry), { kind: "unconfigured" }, "non-https destinations are refused");
  });
});

describe("availability wording", () => {
  test("an error or unconfigured integration never reads as sold out", () => {
    const error = describeAvailability({ status: "error", provider: "gohost", code: "timeout", retryable: true });
    assert.equal(error.retryable, true);
    assert.match(error.detail ?? "", /không phải là hết phòng/i);
    for (const view of [error, describeAvailability({ status: "unconfigured", provider: "gohost", missing: [] })]) {
      assert.doesNotMatch(`${view.headline} ${view.detail ?? ""}`, /Không còn phòng/);
      assert.equal(view.verifiedAvailable, false);
      assert.equal(view.price, undefined);
    }
  });

  test("only a verified available state shows availability or a price, and simulation is flagged", () => {
    const quote = { source: "simulation" as const, currency: "VND", totalAmount: 2_000_000, nights: 2, rateContext: "Giá mô phỏng", conditions: [] };
    const view = describeAvailability({ status: "available", provider: "gohost", verifiedAt: "x", simulated: true, startingQuote: quote, rooms: [] });
    assert.equal(view.verifiedAvailable, true);
    assert.equal(view.simulated, true);
    assert.equal(view.price?.simulated, true);
    assert.match(view.price?.amount ?? "", /2\.000\.000 ₫/);
    assert.equal(describeAvailability({ status: "needs-provider-check", provider: "ezcloud", reason: "external-booking-engine" }).price, undefined);
  });

  test("a verified state does not survive a changed stay", () => {
    const state = { status: "available" as const, provider: "gohost" as const, verifiedAt: "x", simulated: false, startingQuote: null, rooms: [] };
    assert.equal(staleAvailability(state).status, "needs-provider-check");
    const error = { status: "error" as const, provider: "gohost" as const, code: "timeout" as const, retryable: true };
    assert.deepEqual(staleAvailability(error), error);
  });

  test("the guest wording names no provider", () => {
    const states = [
      { status: "needs-provider-check", provider: "ezcloud", reason: "external-booking-engine" },
      { status: "unconfigured", provider: "gohost", missing: [] },
      { status: "error", provider: "gohost", code: "timeout", retryable: true },
    ] as const;
    for (const state of states) assert.doesNotMatch(JSON.stringify(describeAvailability(state)), /gohost|ezcloud/i);
  });
});

describe("simulation parsing", () => {
  test("accepts known properties and statuses only", () => {
    assert.deepEqual(parseSimulation("bare-da-kao:available, pepper-house:error,bogus:available,bare-chic:nonsense"), {
      "bare-da-kao": "available",
      "pepper-house": "error",
    });
    assert.deepEqual(parseSimulation(undefined), {});
  });
});

describe("server-only boundary", () => {
  test("no client component imports the server-only provider modules", () => {
    const root = path.resolve(import.meta.dirname, "../..");
    const serverOnly = /integrations\/booking\/(provider-config|gohost-adapter|resolve-availability)/;
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir)) {
        const full = path.join(dir, entry);
        if (statSync(full).isDirectory()) walk(full);
        else if (/\.tsx?$/.test(entry) && !/\.test\./.test(entry)) {
          const text = readFileSync(full, "utf8");
          if (/^["']use client["']/m.test(text.slice(0, 200)) && serverOnly.test(text)) offenders.push(path.relative(root, full));
        }
      }
    };
    walk(path.join(root, "features"));
    walk(path.join(root, "app"));
    assert.deepEqual(offenders, []);
  });
});
