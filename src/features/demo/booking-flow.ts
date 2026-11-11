import {
  MAX_PARSEABLE_ADULTS,
  parseStaySearch,
  serializeCriteria,
  serializeStaySearch,
  type QueryInput,
  type SearchCriteria,
  type StaySearchState,
} from "@/domain/search";
import { occupancyFromQuery, requestedGuests, serializeMultiRoomQuery, type MultiRoomSearchState } from "./booking-results-state";
import {
  DEMO_BARE_CHIC,
  DEMO_BARE_DA_KAO,
  DEMO_BARE_HAN,
  DEMO_BARE_HYPHEN,
  DEMO_HOME,
  DEMO_PEPPER_HOUSE,
  DEMO_THE_NANG_SUITES,
} from "./links";

/**
 * VNest V3 Unified Multi-Room Booking Journey (24/10/2026):
 *
 *   Homepage / Property Detail BOOK NOW (Frozen Section 02.1)
 *   → Booking Results (/dev/demo/tim-phong)
 *   → Multi-room selection & provisional room preferences
 *   → Review selected rooms
 *   → Demo booking intent summary (/dev/demo/dat-phong, preserved for reviewing intent when PMS is not connected)
 *
 * Frozen Section 02.1 (`src/features/booking-search/`) is preserved untouched via this integration adapter.
 */
export const DEMO_BOOKING_RESULTS = `${DEMO_HOME}/tim-phong`;
export const DEMO_BOOKING = `${DEMO_HOME}/dat-phong`;

/** The properties that have a demo page, by the slug the booking search carries. */
export const DEMO_PROPERTY_PAGES: Readonly<Record<string, string>> = {
  "bare-chic": DEMO_BARE_CHIC,
  "bare-hyphen": DEMO_BARE_HYPHEN,
  "bare-da-kao": DEMO_BARE_DA_KAO,
  "bare-han": DEMO_BARE_HAN,
  "the-nang-suites": DEMO_THE_NANG_SUITES,
  "pepper-house": DEMO_PEPPER_HOUSE,
};

function firstQueryValue(value: string | readonly string[] | undefined): string | undefined {
  const single = typeof value === "string" ? value : value?.[0];
  const trimmed = single?.trim();
  return trimmed ? trimmed : undefined;
}

/**
 * Builds the Booking Results URL (`/dev/demo/tim-phong`) from a Section 02.1 `StaySearchState`,
 * preserving any multi-room distribution (`rooms`) and provisional room preferences (`prefs`)
 * already present in the current page URL (`contextQuery`), and carrying `room` when `BOOK NOW`
 * was triggered from a specific room's photo viewer or detail drawer.
 */
export function demoBookingResultsUrl(
  search: StaySearchState,
  options: { room?: string; contextQuery?: QueryInput; roomAdults?: readonly number[]; children?: number } = {},
): string {
  const { room, contextQuery, roomAdults: chosenRooms, children } = options;
  const params = new URLSearchParams();

  const propertySlug =
    search.filters.property && search.filters.property !== "all" ? search.filters.property : null;
  params.set("property", propertySlug ?? "all");

  if (search.criteria.checkIn) params.set("checkIn", search.criteria.checkIn);
  if (search.criteria.checkOut) params.set("checkOut", search.criteria.checkOut);

  // Rooms: the combined "Phòng & khách" field's own rooms when given, else the address's; the guest total is the bar's.
  // The room count is never changed to fit the guests (owner correction, 5/11/2026): a total that does not fit travels as
  // it is, and the results page asks the guest to correct it.
  const guests = search.criteria.adults;
  // One chosen room is the room count "1"; several are a per-room list (a single number in an address is a count).
  const fieldRooms = chosenRooms && chosenRooms.length > 0 ? (chosenRooms.length === 1 ? "1" : chosenRooms.join(",")) : undefined;
  const rawRooms = fieldRooms ?? (contextQuery ? firstQueryValue(contextQuery.rooms) : undefined);
  const { roomAdults } = occupancyFromQuery(rawRooms, String(guests));

  if (roomAdults.length === 1) {
    params.set("rooms", "1");
  } else {
    params.set("rooms", roomAdults.join(","));
  }
  params.set("adults", String(guests));
  // Children travel apart from the adults and the rooms (guest-party.ts): no child policy is confirmed.
  if (children) params.set("children", String(children));

  const rawPrefs = contextQuery ? firstQueryValue(contextQuery.prefs) : undefined;
  if (rawPrefs) {
    params.set("prefs", rawPrefs);
  }
  if (room) {
    params.set("room", room);
  }

  return `${DEMO_BOOKING_RESULTS}?${params.toString()}`;
}

/**
 * The homepage search an address carries, as one comparable string (the parameters `demoHomeSearchHref` writes). The
 * server renders the homepage for one address; when Back shows that render under a different address, the two differ.
 */
export function homeStayKey(query: QueryInput): string {
  return ["property", "checkIn", "checkOut", "adults", "rooms", "children"].map((key) => `${key}=${firstQueryValue(query[key]) ?? ""}`).join("&");
}

/** The address parameters a homepage search owns; everything else on the homepage address (intro, lang, sim) is kept. */
const HOME_SEARCH_PARAMS = ["property", "destination", "checkIn", "checkOut", "adults", "rooms", "children", "prefs", "room"] as const;

/**
 * The homepage address that remembers a submitted search (Phase D refinement, 10/11/2026), written in place of the
 * current entry just before the search opens the results, so Back and refresh bring the same search back. Same contract
 * as everywhere else: the 02.1 criteria (`property`, `checkIn`, `checkOut`, `adults`), `children` when there are any,
 * and `rooms` only when the guest chose them earlier (an address that carried them). Nothing is added or changed.
 */
export function demoHomeSearchHref(
  current: { pathname: string; search: string },
  search: StaySearchState,
  options: { roomAdults?: readonly number[]; children?: number } = {},
): string {
  const params = new URLSearchParams(current.search);
  for (const key of HOME_SEARCH_PARAMS) params.delete(key);
  const property = search.filters.property && search.filters.property !== "all" ? search.filters.property : undefined;
  for (const [key, value] of new URLSearchParams(serializeStaySearch(property ? search : { ...search, filters: {} }))) params.set(key, value);
  const rooms = options.roomAdults;
  if (rooms && rooms.length > 0) params.set("rooms", rooms.length === 1 ? "1" : rooms.join(","));
  if (options.children) params.set("children", String(options.children));
  const query = params.toString();
  return query ? `${current.pathname}?${query}` : current.pathname;
}

/** The preserved demo booking intent summary step (`/dev/demo/dat-phong`); supports both 02.1 and multi-room states. */
export function demoBookingUrl(search: StaySearchState, room?: string): string {
  const query = new URLSearchParams(serializeStaySearch(search));
  if (room) query.set("room", room);
  const text = query.toString();
  return text ? `${DEMO_BOOKING}?${text}` : DEMO_BOOKING;
}

/** Builds `/dev/demo/dat-phong` carrying the full multi-room selection state from Booking Results. */
export function demoBookingStepFromMultiRoomUrl(state: MultiRoomSearchState): string {
  const query = serializeMultiRoomQuery(state);
  return query ? `${DEMO_BOOKING}?${query}` : DEMO_BOOKING;
}

/** A property's demo page with the stay kept in its address, so its booking bar shows the same stay. */
export function demoPropertyUrl(
  slug: string | undefined,
  criteria?: SearchCriteria,
  hash?: string,
  /** The rest of a homepage search: `children` when any, `rooms` only when the guest chose them (kept as written). */
  party: { children?: number; rooms?: string } = {},
): string | undefined {
  const page = slug ? DEMO_PROPERTY_PAGES[slug] : undefined;
  if (!page) return undefined;
  const [path, existing = ""] = page.split("?");
  const query = new URLSearchParams(existing);
  if (criteria) new URLSearchParams(serializeCriteria(criteria)).forEach((value, key) => query.set(key, value));
  if (party.rooms) query.set("rooms", party.rooms);
  if (party.children) query.set("children", String(party.children));
  const text = query.toString();
  return `${path}${text ? `?${text}` : ""}${hash ? `#${hash}` : ""}`;
}

/** A property's demo page carrying the full multi-room search state (`checkIn`, `checkOut`, `rooms`, `adults`, `children`, `prefs`). */
export function demoPropertyUrlFromMultiRoom(
  slug: string | undefined,
  state: MultiRoomSearchState,
  hash?: string,
): string | undefined {
  const page = slug ? DEMO_PROPERTY_PAGES[slug] : undefined;
  if (!page) return undefined;
  const [path, existing = ""] = page.split("?");
  const query = new URLSearchParams(existing);
  if (state.checkIn) query.set("checkIn", state.checkIn);
  if (state.checkOut) query.set("checkOut", state.checkOut);
  if (state.roomGroups.length === 1) {
    query.set("rooms", "1");
  } else {
    query.set("rooms", state.roomGroups.map((g) => g.adults).join(","));
  }
  query.set("adults", String(requestedGuests(state)));
  if (state.children) query.set("children", String(state.children));
  else query.delete("children");
  if (state.roomGroups.some((g) => g.preferredRoomId !== null)) {
    query.set("prefs", state.roomGroups.map((g) => g.preferredRoomId ?? "").join(","));
  }
  const text = query.toString();
  return `${path}${text ? `?${text}` : ""}${hash ? `#${hash}` : ""}`;
}

/** The stay in a demo page's address (read on the server), with `property` as the one searched when given. */
export function stayFromQuery(query: QueryInput, property?: string): StaySearchState {
  const { state } = parseStaySearch(query);
  const criteria: SearchCriteria = { ...state.criteria };

  // If `adults` was omitted on a multi-room URL (`rooms=2,2`), derive total adults from `rooms`.
  if (firstQueryValue(query.adults) === undefined) {
    const rawRooms = firstQueryValue(query.rooms);
    if (rawRooms && rawRooms.includes(",")) {
      const sum = rawRooms
        .split(",")
        .map((s) => Number(s.trim()))
        .filter((n) => Number.isFinite(n) && n >= 1)
        .reduce((a, b) => a + b, 0);
      if (sum >= 1 && sum <= MAX_PARSEABLE_ADULTS) {
        criteria.adults = sum;
      }
    }
  }

  const normalizedFilters =
    state.filters.property === "all"
      ? (({ property: _all, ...rest }) => rest)(state.filters)
      : state.filters;

  return property ? { criteria, filters: { property } } : { criteria, filters: normalizedFilters };
}
