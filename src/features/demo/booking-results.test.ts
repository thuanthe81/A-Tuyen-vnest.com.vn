import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { RELEASE_HOLDS } from "@/content/vnest-workbook/media";
import { applyProviderInventoryToCatalog, buildBookingResultsCatalog } from "./booking-results-data";
import {
  addRoomGroup,
  assignRoomPreference,
  assessRoomCapacity,
  buildRoomMetaMap,
  canAddRoom,
  clearRoomPreference,
  createRoomSlot,
  distributeAdultsAcrossRooms,
  evaluateRoomForSlot,
  evaluateSameTypePool,
  filterPropertiesForScope,
  moveRoomPreference,
  parseMultiRoomQuery,
  removeRoomGroup,
  requestedGuests,
  resizeRoomGroups,
  roomAdultsFromQuery,
  selectAdditionalSameTypeUnit,
  serializeMultiRoomQuery,
  setRoomGroupAdults,
  setRoomGroupCount,
  setTotalAdults,
  summarizeSelectedRoomTypes,
  type RoomGroupSlot,
  totalRequestedAdults,
  withOccupancy,
} from "./booking-results-state";

describe("Booking Results catalog (booking-results-data)", () => {
  const catalog = buildBookingResultsCatalog();

  test("contains all 6 verified VNest properties under 3 brands and 22 named rooms", () => {
    assert.equal(catalog.length, 6);
    assert.deepEqual(
      catalog.map((p) => p.id),
      ["bare-chic", "bare-hyphen", "bare-da-kao", "bare-han", "the-nang-suites", "pepper-house"],
    );
    const totalRooms = catalog.reduce((sum, p) => sum + p.rooms.length, 0);
    assert.equal(totalRooms, 22);
  });

  test("distinguishes roomType, physicalUnits (1), and live inventoryQuantity/availableUnits (null without PMS)", () => {
    for (const property of catalog) {
      for (const room of property.rooms) {
        assert.equal(room.optionKind, "physical-unit");
        assert.equal(room.physicalUnits, 1, `${room.name} must represent 1 physical unit`);
        assert.equal(room.availableUnits, null, `${room.name} must have null availableUnits without ezCloud PMS`);
        assert.equal(room.inventoryQuantity, null, `${room.name} must have null inventoryQuantity without ezCloud PMS`);
        assert.equal(room.ratePlan, null, `${room.name} must have null ratePlan without ezCloud PMS`);
        const expectedType = room.specs.find((s) => s.kind === "type")?.value ?? null;
        assert.equal(room.roomType, expectedType);
      }
    }
  });

  test("groups same-type physical units within each property strictly from own-row verified roomType facts", () => {
    const bareHyphen = catalog.find((p) => p.id === "bare-hyphen")!;
    const hyphenOne = bareHyphen.rooms.find((r) => r.id === "bare-hyphen-one")!;
    const hyphenFour = bareHyphen.rooms.find((r) => r.id === "bare-hyphen-four")!;
    assert.equal(hyphenOne.roomType, "Studio");
    assert.deepEqual(hyphenOne.sameTypeUnitIds, ["bare-hyphen-one", "bare-hyphen-two", "bare-hyphen-three"]);
    assert.equal(hyphenFour.roomType, "Duplex studio");
    assert.deepEqual(hyphenFour.sameTypeUnitIds, ["bare-hyphen-four"]);

    const bareDaKao = catalog.find((p) => p.id === "bare-da-kao")!;
    assert.deepEqual(bareDaKao.rooms[0]!.sameTypeUnitIds, [
      "bare-da-kao-one",
      "bare-da-kao-two",
      "bare-da-kao-three",
      "bare-da-kao-four",
    ]);

    const nang = catalog.find((p) => p.id === "the-nang-suites")!;
    assert.deepEqual(nang.rooms[0]!.sameTypeUnitIds, [
      "yellow-submarine",
      "pale-blue-eyes",
      "green-river",
      "blue-moon",
    ]);
  });

  test("R3: every room shows type, size and the workbook's occupancy, with cells; none of it becomes an eligibility limit", () => {
    const bareChic = catalog.find((p) => p.id === "bare-chic")!;
    for (const room of bareChic.rooms) {
      assert.deepEqual(
        room.specs.map((s) => [s.kind, s.value, s.cell]),
        [
          ["type", "Studio", "D4"],
          ["size", "28 m²", "E4"],
          ["capacity", "2 người lớn", "F4"],
        ],
        room.name,
      );
    }
    for (const property of catalog) {
      for (const room of property.rooms) {
        assert.equal(room.specs.length, 3, `${room.name}: type, size, occupancy`);
        assert.equal(room.verifiedMaxAdults, null, `${room.name}: display metadata is not provider-confirmed occupancy`);
      }
    }
  });

  test("excludes RELEASE_HOLDS photographs (visible person, Q15) from every room gallery", () => {
    const heldIds = new Set(RELEASE_HOLDS.map((h) => h.key));
    for (const property of catalog) {
      for (const room of property.rooms) {
        for (const photo of room.photos) {
          assert.equal(heldIds.has(photo.id), false, `Held photo ${photo.id} must not appear in ${room.name}`);
        }
      }
    }
  });

  test("applyProviderInventoryToCatalog overlays PMS room-type inventory & rates without mutating static catalog", () => {
    const overlaid = applyProviderInventoryToCatalog(catalog, [
      {
        roomId: "bare-chic-one",
        optionKind: "room-type",
        physicalUnits: 3,
        availability: { providerId: "ezcloud", availableUnits: 2 },
        ratePlan: { ratePlanId: "std", ratePlanName: "Tiêu chuẩn", totalStayPrice: 2400000, currency: "VND" },
      },
    ]);
    const originalRoom = catalog[0]!.rooms[0]!;
    const overlaidRoom = overlaid[0]!.rooms[0]!;
    assert.equal(originalRoom.physicalUnits, 1);
    assert.equal(originalRoom.availableUnits, null);
    assert.equal(overlaidRoom.optionKind, "room-type");
    assert.equal(overlaidRoom.physicalUnits, 3);
    assert.equal(overlaidRoom.availableUnits, 2);
    assert.equal(overlaidRoom.ratePlan?.totalStayPrice, 2400000);
  });
});

describe("Multi-room state, same-room-type quantity & unique-room protection (booking-results-state)", () => {
  const catalog = buildBookingResultsCatalog();
  const validSlugs = catalog.map((p) => p.id);
  const validRoomIds = new Set(catalog.flatMap((p) => p.rooms.map((r) => r.id)));
  const bareChic = catalog.find((p) => p.id === "bare-chic")!;
  const bareChicOne = bareChic.rooms.find((r) => r.id === "bare-chic-one")!;
  const bareHyphen = catalog.find((p) => p.id === "bare-hyphen")!;
  const bareHyphenOne = bareHyphen.rooms.find((r) => r.id === "bare-hyphen-one")!;

  test("defaults to Bare Chic, Nov 6–8 2026, 2 rooms and 4 adults (2 + 2) when opened without query parameters", () => {
    const state = parseMultiRoomQuery({}, validSlugs, validRoomIds);
    assert.equal(state.propertySlug, "bare-chic");
    assert.equal(state.checkIn, "2026-11-06");
    assert.equal(state.checkOut, "2026-11-08");
    assert.equal(state.roomGroups.length, 2);
    assert.deepEqual(
      state.roomGroups.map((g) => g.adults),
      [2, 2],
    );
    assert.equal(totalRequestedAdults(state.roomGroups), 4);
  });

  test("parses multi-room query parameters and preserves repeated demo room preferences across slots", () => {
    const state = parseMultiRoomQuery(
      {
        property: "bare-da-kao",
        checkIn: "2026-11-06",
        checkOut: "2026-11-08",
        rooms: "2,2,2",
        prefs: "bare-da-kao-one,bare-da-kao-one,bare-da-kao-one",
      },
      validSlugs,
      validRoomIds,
    );
    assert.deepEqual(
      state.roomGroups.map((g) => ({ slotId: g.slotId, roomId: g.roomId })),
      [
        { slotId: "room-1", roomId: "bare-da-kao-one" },
        { slotId: "room-2", roomId: "bare-da-kao-one" },
        { slotId: "room-3", roomId: "bare-da-kao-one" },
      ],
    );
  });

  test("adding or removing a room never changes the guest total; a room that is needed cannot be removed", () => {
    let groups = parseMultiRoomQuery({}, validSlugs, validRoomIds).roomGroups; // 2 rooms × 2 adults
    assert.equal(totalRequestedAdults(groups), 4);
    groups = addRoomGroup(groups);
    assert.equal(groups.length, 3);
    assert.equal(groups[2]!.slotIndex, 3);
    assert.deepEqual(groups.map((g) => g.adults), [2, 1, 1], "one guest moves from the fullest room");
    assert.equal(totalRequestedAdults(groups), 4, "adding a room keeps 4 guests");

    groups = setRoomGroupAdults(groups, 2, 3);
    assert.equal(groups[1]!.adults, 2, "a room never holds more than two guests");
    assert.equal(totalRequestedAdults(groups), 5);

    assert.equal(removeRoomGroup(groups, 1), groups, "5 guests need 3 rooms: removing one is refused, nothing changes");
    groups = setRoomGroupAdults(groups, 2, 1);
    groups = removeRoomGroup(groups, 1);
    assert.deepEqual(
      groups.map((g) => [g.slotIndex, g.adults]),
      [
        [1, 2],
        [2, 2],
      ],
      "the removed room's guests move to the neighbouring rooms",
    );
    assert.equal(totalRequestedAdults(groups), 4);
  });

  test("two guests in one room: add a room → 1 + 1, then no empty room can be added; the last room stays", () => {
    let groups: readonly RoomGroupSlot[] = [createRoomSlot(1, 2, null)];
    assert.equal(canAddRoom(groups), true);
    groups = addRoomGroup(groups);
    assert.deepEqual(groups.map((g) => g.adults), [1, 1]);
    assert.equal(canAddRoom(groups), false, "every room needs one guest: no guest to spare");
    assert.equal(addRoomGroup(groups), groups, "refused, never a silent extra guest");
    groups = removeRoomGroup(groups, 2);
    assert.deepEqual(groups.map((g) => g.adults), [2], "back to one room with the same two guests");
    assert.equal(removeRoomGroup(groups, 1), groups, "the last room cannot be removed");
    const three: readonly RoomGroupSlot[] = [createRoomSlot(1, 2, null), createRoomSlot(2, 1, null)];
    assert.equal(removeRoomGroup(three, 2), three, "3 guests cannot share one room");
  });

  test("room preferences stay with their rooms when a room is added or removed", () => {
    let groups: readonly RoomGroupSlot[] = [createRoomSlot(1, 2, "bare-da-kao-one")];
    groups = addRoomGroup(groups);
    assert.deepEqual(groups.map((g) => [g.adults, g.preferredRoomId]), [[1, "bare-da-kao-one"], [1, null]]);
    groups = removeRoomGroup(groups, 2);
    assert.deepEqual(groups.map((g) => [g.adults, g.preferredRoomId]), [[2, "bare-da-kao-one"]]);
  });

  test("combined field: changing the guest total keeps the allocation and preferences; the rooms never change", () => {
    const groups = [createRoomSlot(1, 2, "bare-da-kao-one"), createRoomSlot(2, 1, "bare-da-kao-two")];
    assert.deepEqual(setTotalAdults(groups, 4).map((g) => g.adults), [2, 2], "a new guest joins the room with the fewest");
    assert.deepEqual(setTotalAdults(groups, 5).map((g) => g.adults), [2, 2], "a fifth guest never adds a room (the stepper stops at 4)");
    assert.deepEqual(setTotalAdults(groups, 2).map((g) => g.adults), [1, 1], "a guest leaves the room with the most");
    assert.deepEqual(setTotalAdults(groups, 1).map((g) => g.adults), [1, 1], "never removes a room (the stepper stops at 2)");
    assert.equal(setTotalAdults(groups, 4)[0]!.preferredRoomId, "bare-da-kao-one");
    assert.equal(setTotalAdults(groups, 3), groups, "the same total is the same allocation");
  });

  test("explicit changes of guests and rooms: chosen rooms kept, a total that does not fit is kept apart", () => {
    const state = parseMultiRoomQuery({ property: "bare-da-kao", rooms: "2,1", adults: "3", prefs: "bare-da-kao-one,bare-da-kao-two" }, validSlugs, validRoomIds);
    const three = withOccupancy(state, 3, 3);
    assert.deepEqual(three.roomGroups.map((g) => [g.adults, g.preferredRoomId]), [[1, "bare-da-kao-one"], [1, "bare-da-kao-two"], [1, null]]);
    assert.equal(three.guests, undefined);
    const dropFirst = withOccupancy(state, 2, 2, 1);
    assert.deepEqual(dropFirst.roomGroups.map((g) => g.preferredRoomId), ["bare-da-kao-two", null], "the removed slot loses its own room");
    const over = withOccupancy(state, 5, 2);
    assert.equal(over.guests, 5, "5 guests in 2 rooms are kept, to be corrected");
    assert.equal(requestedGuests(over), 5);
    assert.match(serializeMultiRoomQuery(over), /rooms=2%2C2&adults=5/);
    assert.deepEqual(resizeRoomGroups(state.roomGroups, 4, 2).map((g) => g.adults), [2, 2]);
  });

  test("combined field: the allocation is read from the address and always adds up to the guests", () => {
    assert.deepEqual(roomAdultsFromQuery("2,1", 3), [2, 1]);
    assert.deepEqual(roomAdultsFromQuery("2,1", 4), [2, 2], "reconciled to the guest total");
    assert.deepEqual(roomAdultsFromQuery("2", 3), [2, 1], "a room count spreads the guests");
    assert.deepEqual(roomAdultsFromQuery(undefined, 3), [2, 1], "3 guests need 2 rooms");
    assert.deepEqual(roomAdultsFromQuery("3,1", 4), [2, 2], "an older address with 3 in a room is respread, no guest lost");
    assert.deepEqual(roomAdultsFromQuery("x,0", 2), [2], "nonsense is one room");
  });

  test("setting a room count or redistributing never invents or drops guests", () => {
    assert.deepEqual(setRoomGroupCount([createRoomSlot(1, 2, null), createRoomSlot(2, 1, null)], 3).map((g) => g.adults), [1, 1, 1]);
    assert.deepEqual(setRoomGroupCount([createRoomSlot(1, 2, null)], 3).map((g) => g.adults), [1, 1], "capped by the guests");
    assert.deepEqual(setRoomGroupCount([createRoomSlot(1, 1, null), createRoomSlot(2, 2, null)], 1).map((g) => g.adults), [1, 2], "3 guests keep 2 rooms");
    assert.deepEqual(setRoomGroupCount([createRoomSlot(1, 1, null), createRoomSlot(2, 1, null)], 1).map((g) => g.adults), [2]);
    // The split over an exact room count; the room count is never changed for the guests.
    assert.deepEqual(distributeAdultsAcrossRooms(3, 3), [1, 1, 1]);
    assert.deepEqual(distributeAdultsAcrossRooms(2, 3), [2, 1], "3 guests / 2 rooms");
    assert.deepEqual(distributeAdultsAcrossRooms(2, 4), [2, 2]);
    assert.deepEqual(distributeAdultsAcrossRooms(3, 5), [2, 2, 1]);
  });

  test("an outdated address that does not fit keeps its rooms and its guests, for the guest to correct", () => {
    const over = parseMultiRoomQuery({ property: "bare-da-kao", rooms: "1", adults: "3" }, validSlugs, validRoomIds);
    assert.equal(over.roomGroups.length, 1, "the room count is not changed");
    assert.equal(over.guests, 3, "and no guest is dropped");
    assert.match(serializeMultiRoomQuery(over), /rooms=1&adults=3/);
    const under = parseMultiRoomQuery({ property: "bare-da-kao", rooms: "3", adults: "2" }, validSlugs, validRoomIds);
    assert.equal(under.roomGroups.length, 3);
    assert.equal(under.guests, 2, "no guest is invented for the third room");
    const list = parseMultiRoomQuery({ property: "bare-da-kao", rooms: "3,1", adults: "4" }, validSlugs, validRoomIds);
    assert.deepEqual(list.roomGroups.map((g) => g.adults), [2, 2], "a per-room list that breaks the rule is split again over the same rooms");
    assert.equal(list.guests, undefined);
    const noRooms = parseMultiRoomQuery({ property: "bare-da-kao", adults: "5" }, validSlugs, validRoomIds);
    assert.deepEqual(noRooms.roomGroups.map((g) => g.adults), [2, 2, 1], "with no room count, the fewest rooms that hold the guests");
  });

  test("allows selecting the same displayed room across multiple slots in demo mode and enforces live PMS unit limits when connected", () => {
    const bareDaKao = catalog.find((p) => p.id === "bare-da-kao")!;
    const bareDaKaoOne = bareDaKao.rooms.find((r) => r.id === "bare-da-kao-one")!;
    const bareDaKaoThree = bareDaKao.rooms.find((r) => r.id === "bare-da-kao-three")!;

    // 1. Repeatable demo preference selection (availableUnits === null):
    const threeSlots = addRoomGroup(parseMultiRoomQuery({}, validSlugs, validRoomIds).roomGroups);
    const s1 = assignRoomPreference(threeSlots, 1, bareDaKaoOne);
    assert.equal(s1.assigned, true);
    assert.equal(s1.nextActiveSlot, 2);
    assert.equal(evaluateRoomForSlot(bareDaKaoOne, s1.groups[1]!, s1.groups).canSelect, true);

    const s2 = assignRoomPreference(s1.groups, 2, bareDaKaoOne);
    assert.equal(s2.assigned, true);
    assert.equal(s2.nextActiveSlot, 3);
    assert.equal(evaluateRoomForSlot(bareDaKaoOne, s2.groups[2]!, s2.groups).canSelect, true);

    const s3 = assignRoomPreference(s2.groups, 3, bareDaKaoOne);
    assert.equal(s3.assigned, true);
    assert.deepEqual(
      s3.groups.map((g) => ({ slotId: g.slotId, roomId: g.roomId })),
      [
        { slotId: "room-1", roomId: "bare-da-kao-one" },
        { slotId: "room-2", roomId: "bare-da-kao-one" },
        { slotId: "room-3", roomId: "bare-da-kao-one" },
      ],
    );

    // Changing only Room 2 to Bare Đa Kao Three preserves Rooms 1 and 3:
    const replaced2 = assignRoomPreference(s3.groups, 2, bareDaKaoThree);
    assert.equal(replaced2.assigned, true);
    assert.deepEqual(
      replaced2.groups.map((g) => ({ slotId: g.slotId, roomId: g.roomId })),
      [
        { slotId: "room-1", roomId: "bare-da-kao-one" },
        { slotId: "room-2", roomId: "bare-da-kao-three" },
        { slotId: "room-3", roomId: "bare-da-kao-one" },
      ],
    );

    // Clearing Room 3 and reselecting it:
    const cleared3 = clearRoomPreference(replaced2.groups, 3);
    assert.equal(cleared3[2]!.preferredRoomId, null);
    const reselected3 = assignRoomPreference(cleared3, 3, bareDaKaoOne);
    assert.equal(reselected3.groups[2]!.preferredRoomId, "bare-da-kao-one");

    // 2. Live PMS connected mode (availableUnits === 1 for a unique physical unit):
    const livePmsUnit = { ...bareChicOne, availableUnits: 1 };
    const initial = parseMultiRoomQuery({}, validSlugs, validRoomIds).roomGroups;
    const step1 = assignRoomPreference(initial, 1, livePmsUnit);
    assert.equal(step1.assigned, true);
    assert.equal(step1.groups[0]!.preferredRoomId, "bare-chic-one");
    assert.equal(step1.nextActiveSlot, 2);

    const evalForSlot2 = evaluateRoomForSlot(livePmsUnit, step1.groups[1]!, step1.groups);
    assert.equal(evalForSlot2.canSelect, false);
    assert.equal(evalForSlot2.assignedToOtherSlot, 1);

    const step2Duplicate = assignRoomPreference(step1.groups, 2, livePmsUnit);
    assert.equal(step2Duplicate.assigned, false);
    assert.equal(step2Duplicate.groups[1]!.preferredRoomId, null);

    // Moving livePmsUnit to Slot 2 clears Slot 1 so it is still only assigned once:
    const moved = moveRoomPreference(step1.groups, 2, livePmsUnit);
    assert.equal(moved.moved, true);
    assert.equal(moved.groups[0]!.preferredRoomId, null);
    assert.equal(moved.groups[1]!.preferredRoomId, "bare-chic-one");

    // Clearing removes the preference:
    const cleared = clearRoomPreference(moved.groups, 2);
    assert.equal(cleared[1]!.preferredRoomId, null);
  });

  test("allows selecting multiple units from a multi-unit room type up to provider/physical availability (Task 4 & Scenario 5)", () => {
    // 1. Direct multi-unit room-type option in data contract (e.g. physicalUnits=3, availableUnits=2):
    const multiUnitRoomType = {
      ...bareChicOne,
      id: "studio-category",
      name: "Hạng Studio",
      optionKind: "room-type" as const,
      physicalUnits: 3,
      availableUnits: 2,
    };
    let groups = addRoomGroup(parseMultiRoomQuery({}, validSlugs, validRoomIds).roomGroups); // 3 slots
    const first = assignRoomPreference(groups, 1, multiUnitRoomType);
    assert.equal(first.assigned, true);
    groups = first.groups;

    // Slot 2 CAN select the same multi-unit room-type option (2nd unit of 2 available):
    const second = assignRoomPreference(groups, 2, multiUnitRoomType);
    assert.equal(second.assigned, true);
    groups = second.groups;
    assert.equal(groups[0]!.preferredRoomId, "studio-category");
    assert.equal(groups[1]!.preferredRoomId, "studio-category");

    // Slot 3 CANNOT exceed availableUnits (2):
    const third = assignRoomPreference(groups, 3, multiUnitRoomType);
    assert.equal(third.assigned, false);
    assert.equal(third.groups[2]!.preferredRoomId, null);

    // 2. Provisional same-type multi-unit selection from workbook physical units (Bare Hyphen Studio pool = 3 units):
    let hyphenGroups: readonly RoomGroupSlot[] = [{ slotIndex: 1, adults: 2, preferredRoomId: "bare-hyphen-one" }];
    const poolBefore = evaluateSameTypePool(bareHyphenOne, bareHyphen.rooms, hyphenGroups);
    assert.equal(poolBefore.totalPoolUnits, 3);
    assert.equal(poolBefore.selectedPoolUnits, 1);
    assert.equal(poolBefore.remainingPoolUnits, 2);
    assert.equal(poolBefore.canAddAnotherOfSameType, true);
    assert.equal(poolBefore.nextCandidateRoom?.id, "bare-hyphen-two");

    // Adding a second unit of the same Studio room type automatically adds Room 2 and assigns bare-hyphen-two:
    const added2 = selectAdditionalSameTypeUnit(hyphenGroups, bareHyphenOne, bareHyphen.rooms);
    assert.equal(added2.added, true);
    assert.equal(added2.assignedSlotIndex, 2);
    assert.equal(added2.assignedRoomId, "bare-hyphen-two");
    hyphenGroups = [...added2.groups];
    assert.equal(hyphenGroups.length, 2);
    assert.equal(hyphenGroups[0]!.preferredRoomId, "bare-hyphen-one");
    assert.equal(hyphenGroups[1]!.preferredRoomId, "bare-hyphen-two");

    // Summarize by room type shows 2 × Hạng Studio:
    const allRoomsById = new Map(
      catalog.flatMap((p) => p.rooms.map((r) => [r.id, { room: r, property: p }] as const)),
    );
    const typeSummaries = summarizeSelectedRoomTypes(hyphenGroups, allRoomsById);
    assert.equal(typeSummaries.length, 1);
    assert.equal(typeSummaries[0]!.roomTypeLabel, "Hạng Studio");
    assert.equal(typeSummaries[0]!.quantity, 2);
    assert.deepEqual(typeSummaries[0]!.unitNames, ["Bare Hyphen One", "Bare Hyphen Two"]);
  });

  test("the occupancy rule caps every room at two; a provider-confirmed limit, once supplied, still applies", () => {
    // Owner rule (5/11/2026, room-occupancy.ts) supersedes R3's display-only reading: no room holds a third guest.
    const groupsWith3 = setRoomGroupAdults(parseMultiRoomQuery({}, validSlugs, validRoomIds).roomGroups, 1, 3);
    assert.equal(groupsWith3[0]!.adults, 2);
    assert.equal(assignRoomPreference(groupsWith3, 1, bareChicOne).assigned, true);
    const unverifiedCap = assessRoomCapacity(bareChicOne, 2);
    assert.equal(unverifiedCap.kind, "capacity-unverified");

    // The per-room provider mechanism stays for ezCloud / GoHost: a room carrying a stricter limit is checked against it.
    const providerLimited = { ...bareChicOne, verifiedMaxAdults: 1 };
    assert.equal(assessRoomCapacity(providerLimited, 1).kind, "verified-fits");
    assert.equal(assessRoomCapacity(providerLimited, 2).kind, "exceeds-verified-capacity");
    const attempt = assignRoomPreference(groupsWith3, 1, providerLimited);
    assert.equal(attempt.assigned, false);
    assert.equal(attempt.groups[0]!.preferredRoomId, null);
  });

  test("serializes and filters properties by scope", () => {
    const state = parseMultiRoomQuery({}, validSlugs, validRoomIds);
    const assigned = assignRoomPreference(state.roomGroups, 1, bareChicOne).groups;
    const queryStr = serializeMultiRoomQuery({ ...state, roomGroups: assigned });
    assert.match(queryStr, /property=bare-chic/);
    assert.match(queryStr, /rooms=2%2C2/);
    assert.match(queryStr, /prefs=bare-chic-one%2C/);

    assert.equal(filterPropertiesForScope(catalog, "bare-chic").length, 1);
    assert.equal(filterPropertiesForScope(catalog, null).length, 6);
  });

  test("round-trips single-room (1 room / N adults) and multi-room states identically across refresh", () => {
    const roomMeta = buildRoomMetaMap(catalog);
    const single2 = parseMultiRoomQuery(
      { property: "bare-chic", checkIn: "2026-11-06", checkOut: "2026-11-08", rooms: "1", adults: "2" },
      validSlugs,
      validRoomIds,
      roomMeta,
    );
    assert.equal(single2.roomGroups.length, 1);
    assert.equal(single2.roomGroups[0]!.adults, 2);
    const single2Str = serializeMultiRoomQuery(single2);
    assert.match(single2Str, /rooms=1&adults=2/);
    const single2Reloaded = parseMultiRoomQuery(
      Object.fromEntries(new URLSearchParams(single2Str)),
      validSlugs,
      validRoomIds,
      roomMeta,
    );
    assert.deepEqual(single2Reloaded.roomGroups, single2.roomGroups);

    const single3WithRoom = parseMultiRoomQuery(
      { property: "bare-chic", checkIn: "2026-11-06", checkOut: "2026-11-08", rooms: "1", adults: "3", room: "Bare Chic Two" },
      validSlugs,
      validRoomIds,
      roomMeta,
    );
    assert.equal(single3WithRoom.roomGroups.length, 1, "an older one-room address for 3 guests keeps its one room");
    assert.equal(single3WithRoom.guests, 3, "and its three guests, for the guest to correct");
    assert.equal(single3WithRoom.roomGroups[0]!.preferredRoomId, "bare-chic-two");
    assert.equal(single3WithRoom.focusedRoomId, "bare-chic-two");

    // Respreading guests never drops a selection, on reload or when guests change.
    const single3Kept = parseMultiRoomQuery(
      { property: "bare-chic", checkIn: "2026-11-06", checkOut: "2026-11-08", rooms: "1", adults: "3", room: "Bare Chic One" },
      validSlugs,
      validRoomIds,
      roomMeta,
    );
    assert.equal(single3Kept.roomGroups.length, 1);
    assert.equal(single3Kept.roomGroups[0]!.preferredRoomId, "bare-chic-one");
    assert.equal(single3Kept.focusedRoomId, "bare-chic-one");

    const withOne = assignRoomPreference(single2.roomGroups, 1, bareChicOne).groups;
    assert.equal(withOne[0]!.preferredRoomId, "bare-chic-one");
    const bumpedTo3 = setRoomGroupAdults(withOne, 1, 3, roomMeta);
    assert.equal(bumpedTo3[0]!.preferredRoomId, "bare-chic-one");
  });
});
