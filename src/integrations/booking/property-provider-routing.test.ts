import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  evaluatePropertyBookingReadiness,
  LIVE_BOOKING_PROVIDER_IDS,
  propertiesForBookingProvider,
  PROPERTY_BOOKING_PROVIDER_ROUTING,
  PROPERTY_PROVIDER_ASSIGNMENT,
  resolvePropertyBookingProviderRoute,
} from "./property-provider-routing";

describe("Property-to-booking-provider routing contracts (Priority 3)", () => {
  test("maps GoHost to Bare Đa Kao and Pepper House, and ezCloud to Bare Chic, Bare Hyphen, Bare Hàn, and The Nắng Suites", () => {
    assert.deepEqual(LIVE_BOOKING_PROVIDER_IDS, ["gohost", "ezcloud"]);
    assert.deepEqual(PROPERTY_PROVIDER_ASSIGNMENT, {
      "bare-da-kao": "gohost",
      "pepper-house": "gohost",
      "bare-chic": "ezcloud",
      "bare-hyphen": "ezcloud",
      "bare-han": "ezcloud",
      "the-nang-suites": "ezcloud",
    });
    assert.deepEqual(propertiesForBookingProvider("gohost"), ["bare-da-kao", "pepper-house"]);
    assert.deepEqual(propertiesForBookingProvider("ezcloud"), [
      "bare-chic",
      "bare-hyphen",
      "bare-han",
      "the-nang-suites",
    ]);
  });

  test("preserves official workbook room ordering in every provider route and invents no live identifiers", () => {
    assert.deepEqual(resolvePropertyBookingProviderRoute("pepper-house")?.officialRoomIds, [
      "pepper-house-3rd-floor",
      "pepper-house-4th-floor",
    ]);
    assert.deepEqual(resolvePropertyBookingProviderRoute("bare-da-kao")?.officialRoomIds, [
      "bare-da-kao-one",
      "bare-da-kao-two",
      "bare-da-kao-three",
      "bare-da-kao-four",
    ]);
    assert.deepEqual(resolvePropertyBookingProviderRoute("the-nang-suites")?.officialRoomIds, [
      "yellow-submarine",
      "pale-blue-eyes",
      "green-river",
      "blue-moon",
    ]);
    assert.deepEqual(resolvePropertyBookingProviderRoute("bare-han")?.officialRoomIds, [
      "bare-han-ground",
      "bare-han-one",
      "bare-han-two",
      "bare-han-three",
    ]);

    for (const route of Object.values(PROPERTY_BOOKING_PROVIDER_ROUTING)) {
      assert.equal(route.providerPropertyRef, null);
      for (const roomId of route.officialRoomIds) {
        assert.equal(route.roomRefs[roomId], null);
      }
    }
  });

  test("fails closed until official provider endpoints, server credentials, and room mappings are supplied", () => {
    const unconfigured = evaluatePropertyBookingReadiness("pepper-house");
    assert.equal(unconfigured.providerId, "gohost");
    assert.equal(unconfigured.providerName, "GoHost");
    assert.equal(unconfigured.status, "awaiting-provider-identifiers");
    assert.equal(unconfigured.readyForLiveBooking, false);
    assert.equal(unconfigured.resolvedMapping, null);
    assert.deepEqual(unconfigured.unmappedRoomIds, ["pepper-house-3rd-floor", "pepper-house-4th-floor"]);
    assert.deepEqual(unconfigured.blockers, [
      "missing-provider-endpoint",
      "missing-server-credentials",
      "missing-property-identifier",
      "missing-room-mappings",
      "missing-rate-plan-contract",
    ]);

    const partial = evaluatePropertyBookingReadiness("pepper-house", {
      providerId: "gohost",
      endpointUrl: null,
      hasServerCredentials: false,
      propertyMappings: {
        "pepper-house": {
          propertyRef: "GH-PEPPER",
          roomRefs: { "pepper-house-3rd-floor": "GH-PH-3F" },
        },
      },
    });
    assert.equal(partial.status, "partially-mapped");
    assert.equal(partial.readyForLiveBooking, false);
    assert.deepEqual(partial.unmappedRoomIds, ["pepper-house-4th-floor"]);
    assert.equal(partial.resolvedMapping, null);
  });
});
