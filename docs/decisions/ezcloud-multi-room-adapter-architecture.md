# VNest V3 — Multi-Room Booking Journey & EzCloud Adapter Architecture

- **Date**: 2026-10-24
- **Status**: Approved for Demo Integration (`src/features/demo/`) · Provider Adapter Pending EzCloud Documentation
- **Related Documents**:
  - [02.1 — Floating Booking Search Bar](file:///Users/noe/Documents/GitHub/VNest%202/docs/decisions/02.1-floating-booking-search-bar.md)
  - [Booking Domain & Provider Interface](file:///Users/noe/Documents/GitHub/VNest%202/docs/BOOKING.md)

---

## 1. Audit of Frozen Section 02.1 Search State & Integration Points

### 1.1 Frozen Section 02.1 Core (`src/features/booking-search/` & `src/domain/search.ts`)

Section 02.1 is frozen per [02.1-floating-booking-search-bar.md](file:///Users/noe/Documents/GitHub/VNest%202/docs/decisions/02.1-floating-booking-search-bar.md). Its contract is:

- **State type** (`StaySearchState` in `src/domain/search.ts`):
  ```ts
  interface StaySearchState {
    criteria: {
      checkIn?: IsoDate;
      checkOut?: IsoDate;
      adults: number; // 1..8, default 2
    };
    filters: {
      property?: string;
      destination?: string;
      area?: string;
      roomType?: string;
    };
  }
  ```
- **URL synchronization**: `StaySearchProvider` (`src/features/booking-search/StaySearchProvider.tsx`) syncs `?property=<slug>&checkIn=YYYY-MM-DD&checkOut=YYYY-MM-DD&adults=<N>` via `history.replaceState` when `syncUrl` is enabled.
- **Presentation context**: `BookingPresentationProvider` (`src/features/booking-search/presentation.tsx`) allows the demo layer to supply `{ submitLabel: "BOOK NOW", submitLang: "en" }` without altering 02.1's layout, validation, or state reducer.

### 1.2 Integration Points Across the Demo Website

| Surface | Route | Integration Mechanism |
|---|---|---|
| Demo Homepage | `/dev/demo` | `StaySearchProvider` + `DemoBookingScope` (`src/features/demo/BookingCta.tsx`) wraps the header & hero 02.1 bars and `HomeCollection` |
| Bare Chic (Demo View) | `/dev/stays/bare-chic?view=demo` | `DemoPropertyShell` wraps the property page in `StaySearchProvider` + `DemoBookingScope`; room gallery viewer and room drawer use `<BookingCta room={room.name} />` |
| The Nắng Suites (Demo View) | `/dev/stays/the-nang-suites` | `DemoPropertyShell` wraps the property page in `StaySearchProvider` + `DemoBookingScope`; room gallery viewer and room drawer use `<BookingCta room={room.name} />` |
| Booking Results & Multi-Room Selection | `/dev/demo/tim-phong` | Dedicated Step 02–04 multi-room selection surface (`src/features/demo/BookingResults.tsx`) |
| Demo Booking Intent Summary | `/dev/demo/dat-phong` | Preserved Step 05 summary route reachable from the Review Selected Rooms modal on `/dev/demo/tim-phong` |

---

## 2. Smallest Safe Extension via Integration Adapter

Because `StaySearchProvider` and `BookingSearchBar` in `src/features/booking-search/` can be bridged cleanly through `src/features/demo/`, **zero changes were made to the frozen 02.1 core**.

### 2.1 State Contract (`MultiRoomSearchState` in `src/features/demo/booking-results-state.ts`)

```ts
export interface RoomGroupState {
  slotIndex: number;              // 1-based room slot (Room 1..6)
  adults: number;                 // 1..8 adults for this room group
  preferredRoomId: string | null; // Provisional unique room slug, or null
}

export interface MultiRoomSearchState {
  propertySlug: string | null;    // Selected property slug, or null for All Properties
  checkIn: IsoDate;
  checkOut: IsoDate;
  roomGroups: RoomGroupState[];   // 1..6 requested room groups
  focusedRoomId?: string | null;  // Optional room slug passed from a room viewer/drawer BOOK NOW
}
```

### 2.2 Deterministic URL Query Contract

All booking journey routes (`/dev/demo`, `/dev/stays/bare-chic?view=demo`, `/dev/stays/the-nang-suites`, `/dev/demo/tim-phong`, and `/dev/demo/dat-phong`) share a deterministic URL query serialization (`serializeMultiRoomQuery` / `parseMultiRoomQuery` in `src/features/demo/booking-results-state.ts` and `demoBookingResultsUrl` in `src/features/demo/booking-flow.ts`):

| Parameter | Format | Meaning |
|---|---|---|
| `property` | `<slug>` or `all` | Constrained property slug (`bare-chic`, `the-nang-suites`, etc.) or `all` for All Properties (`propertySlug = null`) |
| `checkIn` | `YYYY-MM-DD` | Check-in `IsoDate` |
| `checkOut` | `YYYY-MM-DD` | Check-out `IsoDate` |
| `rooms` | `1` (single room) or `a1,a2,...` (multi-room) | When 1 room is requested: `rooms=1&adults=<N>`. When multiple rooms are requested: comma-separated adult counts per room slot (e.g., `rooms=2,2` or `rooms=2,3,1`) |
| `adults` | `<total>` | Total requested adults across all room groups (always compatible with 02.1's `adults` field) |
| `prefs` | `slug1,slug2,...` | Comma-separated provisional room preferences aligned by slot index (e.g., `prefs=bare-chic-one,bare-chic-two`) |
| `room` | `<Room Name>` | Optional incoming room name when a guest clicks `BOOK NOW` inside a specific room's photo viewer or detail drawer; automatically assigned to the first compatible open slot on `/dev/demo/tim-phong` |

---

## 3. Distinguishing Room Types, Physical Units, and Inventory Quantity

The catalog and domain models strictly separate three concepts that must never be conflated:

| Concept | Field in `CatalogRoom` (`booking-results-data.ts`) | Meaning in Current Workbook | Meaning Once EzCloud Is Connected |
|---|---|---|---|
| **Room Type** (`Loại phòng`) | `roomType: string \| null` | Editorial/architectural classification from the room's own workbook row (`"Studio"` where verified on own row; `null` where merged/unverified) | Maps to EzCloud's room-type classification (`roomTypeId`) if EzCloud groups rooms by type, or remains editorial metadata |
| **Physical Units** (`Đơn vị vật lý`) | `physicalUnits: 1` | Each of the 22 named rooms in the VNest workbook (`Bare Chic One`, `Bare Chic Two`, `Suite One`, etc.) is a distinct, individually named physical apartment/suite (`1 căn độc bản`) | Prevents duplicate selection of the same unique physical room across multiple room slots in a single booking |
| **Inventory Quantity** (`Tồn kho khả dụng`) | `inventoryQuantity: number \| null` | Always `null` while no PMS is connected (`"Chờ phản hồi ezCloud / PMS"`). The catalog never claims a room is available for the selected dates | Live bookable count (`0..physicalUnits`) returned by EzCloud for the requested `checkIn`–`checkOut` window |

### Occupancy Eligibility Rules

- Only `Bare Chic One` has verified own-row capacity in the workbook (`verifiedMaxAdults: 2`, source cell `L4`). Merged cells in column `L` never lend capacity to rows `5..25`.
- When a room has `verifiedMaxAdults !== null`:
  - If `slot.adults <= room.verifiedMaxAdults` → `verified-fits` (selectable).
  - If `slot.adults > room.verifiedMaxAdults` → `exceeds-verified-capacity` (selection is blocked; if the room was already selected and the user increases `slot.adults` above `verifiedMaxAdults`, the preference is automatically cleared).
- When a room has `verifiedMaxAdults === null` (the other 21 named rooms):
  - Assessed as `capacity-unverified`. The UI never claims the room fits the guest group; it allows provisional preference selection with an explicit warning badge (`"Sức chứa chưa xác minh — cần kiểm tra khi kết nối PMS"`).

---

## 4. EzCloud Provider Adapter Architecture & Requirements

> **Important**: No EzCloud API endpoints, payloads, or authentication mechanisms are invented or assumed in this repository. Real booking, live rates, inventory confirmation, and payment remain out of scope until official EzCloud technical documentation and credentials are provided.

### 4.1 Target Adapter Location & Boundary

In accordance with `docs/BOOKING.md` and `src/domain/ports.ts`:

1. **Server-only adapter**: `src/integrations/booking/ezcloud/` implementing `BookingProvider` (`src/domain/ports.ts`).
2. **Browser boundary**: The browser never calls EzCloud directly. All availability queries go through `GET /api/availability` (`src/server/availability.ts`), and booking initiation goes through `beginBooking` on the server.
3. **Environment isolation**: Credentials will be validated in `src/config/env.ts` as server-only environment variables (never prefixed with `NEXT_PUBLIC_`).

### 4.2 Multi-Room & Multi-Property Adapter Translation Responsibilities

When EzCloud documentation is supplied, the `src/integrations/booking/ezcloud/` adapter will be responsible for translating between VNest's domain types and EzCloud's system:

```
Browser (/dev/demo/tim-phong)
   │  property, checkIn, checkOut, roomGroups (slots 1..k), prefs
   ▼
Next.js Server (/api/availability & beginBooking)
   │  AvailabilityRequest { criteria, scope, propertyIds }
   ▼
EzCloud Adapter (src/integrations/booking/ezcloud/)
   ├── Maps VNest propertySlug  ↔ EzCloud hotel/property identifier
   ├── Maps VNest room.id       ↔ EzCloud roomTypeId / physical unit identifier
   ├── Translates multi-room adult distribution (roomGroups)
   ├── Normalizes per-room inventoryQuantity, RateOffer[], and maxOccupancy
   └── Returns AvailabilityResult / BookingHandoff to VNest domain
```

Specifically:
- **Property Scope**: If `scope === "all-properties"`, `resolveSearchScope` passes all 6 VNest property IDs (`bare-chic`, `bare-hyphen`, `bare-da-kao`, `bare-han`, `the-nang-suites`, `pepper-house`). If EzCloud does not support a single multi-property query, the adapter will query mapped properties concurrently with per-property timeouts bounded below `booking.providerTimeoutMs` (`12,000 ms`) and report any individual failures in `AvailabilityAnswer.failures` so one slow property never hides the others.
- **Physical Unit vs. Room Type Mapping**: In VNest's catalog, each of the 22 rooms is an individually named room (`physicalUnits: 1`). If EzCloud groups multiple named units under a shared `roomTypeId`, the adapter mapping table must record both the EzCloud room-type identifier and the unit-level mapping (or return available unit count per room type).
- **Multi-Room Hold / Hand-off**: When multiple room groups (`roomGroups.length > 1`) have provisional preferences (`prefs`), the adapter must either:
  - Build a multi-room hand-off payload/redirect URL if EzCloud's booking engine supports multi-room cart/session creation, or
  - Declare the supported hand-off capability in `BookingCapabilities` so the UI presents only truthful next steps.

### 4.3 Information Required from EzCloud & VNest Before Implementation

Before writing `src/integrations/booking/ezcloud/`, the following items must be provided by EzCloud / VNest:

| # | Category | Specific Information Needed |
|---|---|---|
| 1 | **Integration Mode & Access** | Which EzCloud product/tier is used by VNest (e.g., ezCloudhotel / ezFolio / ezCms / OneInventory)? Does it provide a server-to-server REST/GraphQL API, a hosted booking engine redirect, an embeddable widget, or a combination? Sandbox/staging environment access and test credentials. |
| 2 | **Authentication & Security** | Exact authentication scheme, token lifecycle/rotation, IP allowlisting requirements, and webhook signature verification (if applicable). |
| 3 | **Property & Room Identifier Mapping** | Official EzCloud property IDs for all 6 VNest properties (`Bare Chic`, `Bare Hyphen`, `Bare Đa Kao`, `Bare Hàn`, `The Nắng Suites`, `Pepper House`) and exact room/unit IDs for all 22 named rooms, clarifying whether each named room is a distinct room type or a physical unit under a shared room type in EzCloud. |
| 4 | **Multi-Room & Occupancy Contract** | Whether EzCloud's availability and booking endpoints accept an array of room groups with per-room adult/child counts in a single request, and how per-room maximum occupancy (`maxOccupancy`) is returned. |
| 5 | **Rates, Currency & Taxes** | How rate plans (`RateOffer`), currency (`VND`), tax/service-charge inclusion (`included` / `excluded` / `unknown`), and cancellation policies are represented per room and date range. |
| 6 | **Stay Restrictions** | Whether minimum/maximum nights, closed-to-arrival (CTA), closed-to-departure (CTD), and cut-off times are returned in availability responses or via a separate rules endpoint. |
| 7 | **Quote / Offer Reference & Freshness** | Whether availability responses issue an opaque quote/offer token (`OfferRef`) required for hand-off, and how long a quoted price/inventory hold remains valid (`validUntil`). |
| 8 | **Multi-Room Hand-off & Checkout** | How a multi-room selection (2–6 rooms with distinct room IDs and guest counts) is handed off to EzCloud for reservation and payment, whether dates/guests/rooms survive the hand-off, how mid-flow sell-out conflicts are reported, and whether a return/confirmation callback URL is supported. |
| 9 | **Operational Limits** | Rate limits, expected p95 latency, timeout guidance, and caching rules. |
