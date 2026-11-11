# VNest V3 — Integrated Multi-Room Booking Journey & Booking Results Review (`/dev/demo/tim-phong`)

- **Date:** 24/10/2026
- **Routes:**
  - Demo Homepage (`BOOK NOW` entry): `http://localhost:3402/dev/demo`
  - Property Demo Pages (`BOOK NOW` in header bar, photo viewer, and room drawer):
    - `http://localhost:3402/dev/stays/bare-chic?view=demo`
    - `http://localhost:3402/dev/stays/the-nang-suites`
  - Dedicated Booking Results & Multi-Room Selection: `http://localhost:3402/dev/demo/tim-phong`
  - Preserved Demo Booking Intent Summary (Step 05): `http://localhost:3402/dev/demo/dat-phong`
- **Architecture Decision Record:** [`docs/decisions/ezcloud-multi-room-adapter-architecture.md`](file:///Users/noe/Documents/GitHub/VNest%202/docs/decisions/ezcloud-multi-room-adapter-architecture.md)
- **Status:** **IN REVIEW** (Frozen Section 02.1 preserved 100% untouched via integration adapter; 24/24 non-demo regression captures have `0` changed pixels)

---

## 1. End-to-End Booking Journey Integration

All `BOOK NOW` entry points across the VNest V3 demo website now enter a single consistent booking journey:

```
Homepage BOOK NOW (/dev/demo)
Property Detail BOOK NOW (/dev/stays/bare-chic?view=demo, /dev/stays/the-nang-suites)
Gallery Viewer & Room Drawer BOOK NOW
   │
   ▼
02. Booking Results (/dev/demo/tim-phong)
   │  Constrained to selected property, or grouped across all 6 VNest properties (property=all)
   ▼
03. Multi-Room Selection (1..6 room groups, 1..8 adults per room, unique physical unit lock)
   │
   ▼
04. Review Selected Rooms Modal (Bước 04 · Xem lại lựa chọn dự kiến)
   │
   ▼
05. Demo Booking Intent Summary (/dev/demo/dat-phong) — Honest no-PMS next step & direct contact placeholders
```

### Preserving Frozen Section 02.1 via Integration Adapter
- **Zero edits** were made to `src/features/booking-search/` or `src/domain/search.ts`.
- `src/features/demo/booking-flow.ts` (`demoBookingResultsUrl`, `demoPropertyUrlFromMultiRoom`, `demoBookingStepFromMultiRoomUrl`, `stayFromQuery`) and `src/features/demo/BookingCta.tsx` (`useBookNow`, `DemoBookingGuard`, `PendingRoomContext`) bridge Section 02.1's `StaySearchState` to `MultiRoomSearchState` (`src/features/demo/booking-results-state.ts`).
- When a guest clicks `BOOK NOW` inside a room's photo viewer or detail drawer **with dates**, they arrive at `/dev/demo/tim-phong` with that room automatically assigned to the first compatible open room slot (`prefs=<room-slug>`).
- When a guest clicks `BOOK NOW` inside a room's photo viewer or detail drawer **without dates**, `PendingRoomContext` remembers the room while closing the modal and opening the 02.1 date picker; once dates are chosen and `BOOK NOW` is submitted, the room is carried into `/dev/demo/tim-phong`.

---

## 2. Multi-Room & Data Honesty Rules Enforced

1. **Distinction Between Room Types, Physical Units, and Inventory Quantity (`CatalogRoom` in `src/features/demo/booking-results-data.ts`):**
   - `Loại phòng` (`roomType`): Own-row verified classification from the workbook (`"Studio"` where verified on own row; `"Chưa xác minh riêng từng phòng"` where merged).
   - `Đơn vị vật lý` (`physicalUnits: 1`): Every one of the 22 named rooms in `VNest_Informationv2.xlsx` represents `1 căn độc bản` (a single unique physical unit).
   - `Tồn kho khả dụng` (`inventoryQuantity: null`): Explicitly displayed as `"Chờ phản hồi ezCloud / PMS"` — never pretending catalog rooms are available for the chosen dates.
2. **Unique Physical Unit Lock:**
   - Selecting `Bare Chic One` for `Phòng 1` locks `Bare Chic One` against duplicate selection in `Phòng 2..6` (`Phòng 2: Đã chọn ở Phòng 1 (căn độc bản)`) and offers a one-click `Chuyển sang Phòng N` action.
3. **Verified vs. Unverified Occupancy Eligibility:**
   - `Bare Chic One` (`verifiedMaxAdults: 2`, cell `L4`): Fits `1–2` adults; blocks selection when a slot has `>= 3` adults (`exceeds-verified-capacity`). Increasing a slot's adult count above `2` automatically clears `Bare Chic One` if it was assigned to that slot.
   - Other 21 rooms (`verifiedMaxAdults: null`, merged cells `F4:F25`): Never claimed to fit the guest count; labeled `Sức chứa chưa xác minh — cần kiểm tra khi kết nối PMS`.
4. **No Fictional Pricing or Totals:**
   - Zero daily rates, subtotals, taxes, or payment totals are calculated or displayed anywhere in the flow.

---

## 3. Automated & Visual QA Results

- `npm run lint`: **PASS** (0 errors)
- `npm run typecheck`: **PASS** (`tsc --noEmit` clean)
- `npm test`: **PASS** (`312 / 312` unit tests pass across 16 suites)
- `npm run build`: **PASS** (Next.js 16.3.8 production build)
- Non-demo pixel regression (`docs/qa/v3-stage1-2026-10-24/scripts/regress.mjs`): **PASS** (`24 / 24` captures across `390px`, `768px`, and `1440px` have `differentPixels: 0`)
- End-to-end headless browser QA (`docs/qa/booking-results-2026-10-24/scripts/qa-journey-integration.mjs` across `1440×920`, `768×1024`, and `390×844`):
  - Homepage `BOOK NOW` (1 room / 2 adults, All Properties) → `/dev/demo/tim-phong` with 6 grouped properties: **PASS**
  - Room card distinguishes `Loại phòng`, `Đơn vị vật lý` (`1 căn độc bản`), and `Tồn kho khả dụng` (`Chờ phản hồi ezCloud / PMS`): **PASS**
  - Property photo viewer `BOOK NOW` without dates closes viewer and opens date picker: **PASS**
  - Property room drawer `BOOK NOW` with dates → `/dev/demo/tim-phong` constrained to `Bare Chic` with `Bare Chic Two` pre-selected: **PASS**
  - Three room groups (`3 phòng · 7 người lớn`, `2 + 3 + 2`) & adding/removing rooms: **PASS**
  - Two rooms / four adults (`2 phòng · 4 người lớn`) & unique physical unit lock across slots: **PASS**
  - Changing dates (`Nov 6–8` → `Nov 6–9`, 3 nights) preserves room groups and provisional room preferences: **PASS**
  - Page refresh (`location.reload`) and back navigation preserve dates, guests, property, and room preferences: **PASS**
  - Review Selection modal (Step 04) → Step 05 (`/dev/demo/dat-phong`) & back to `/dev/demo/tim-phong`: **PASS**
  - Changing property (`Bare Chic` → `All 6 Properties` → `The Nắng Suites`) constrains catalog and clears incompatible preferences: **PASS**
  - Horizontal overflow: **PASS** (`false` at 1440px, 768px, 390px)
  - Broken images: **PASS** (`0`)
  - Runtime/console errors: **PASS** (`0`)

---

## UX Simplification (Owner Feedback — 24/10/2026)

Based on owner review of the multi-room Booking Results page, simplified `/dev/demo/tim-phong` around the principle **ONE SCREEN, ONE PRIMARY DECISION** so the guest understands what to do within ~5 seconds while preserving VNest's editorial aesthetic and full multi-room state integrity:

1. **Page Hierarchy Simplified:**
   - Removed the 5-step progress indicator from the main booking screen.
   - Replaced the lengthy heading and repeated search blocks with:
     - Heading: `"Chọn phòng"`
     - One concise search summary: `"Location / Property · Dates · X phòng · Y khách"`
     - One `"Chỉnh sửa"` action opening a clean inline editor (`Nơi lưu trú` / `Ngày lưu trú` / `Phòng & khách`).
2. **Technical Messaging Reduced:**
   - Removed repeated internal diagnostic labels (`PMS / ezCloud integration status`, `Đơn vị vật lý: 1 căn độc bản`, `Tồn kho khả dụng: Chờ phản hồi ezCloud / PMS`, repeated booking disclaimers) from room cards and sidebars.
   - Retained one compact, truthful notice near the top: `"Giá và tình trạng phòng trống sẽ được xác nhận khi hệ thống đặt phòng được kết nối."`
3. **All Properties Search Simplified (`property=all`):**
   - Organized results into 6 clean photo-led property cards (authorised cover photo, property name, city, concise introduction, and one primary CTA `"Xem phòng"`).
   - Clicking `"Xem phòng"` navigates directly into that property's room options while preserving stay dates and room/guest configuration.
   - Prevented combining rooms across different properties in a single reservation.
4. **Room Cards Redesigned:**
   - Each room card displays only: (1) one strong verified photo, (2) room name, (3) verified room fact if available (`Bare Chic One`: `"Studio · 28 m² · 2 người lớn"`) or honest unverified preference status (`"Sức chứa chờ xác nhận · Lựa chọn nguyện vọng phòng"`), (4) `"Xem ảnh và chi tiết"`, and (5) **one** primary action `"Chọn phòng này"`.
5. **Sequential Multi-Room Selection Flow:**
   - Displays `"Đang chọn phòng X/Y"` and `"Z khách"` at the top of the room list with compact room group pills.
   - Selecting `"Chọn phòng này"` assigns the room to the active group, shows a clear selected state, and automatically advances to the next unselected room group while preventing duplicate selection of the same unique physical unit.
6. **Simplified Booking Summary:**
   - **Desktop (`1440px`):** One compact sticky right-hand summary showing `"X/Y phòng đã chọn"`, room names after selection, and one primary CTA `"Xem lại lựa chọn"`.
   - **Mobile (`390px`):** One compact bottom summary bar showing `"X/Y phòng đã chọn"` and `"Xem lại lựa chọn"`.
7. **Concise Review Sheet (`"Kiểm tra lựa chọn"`):**
   - Shows Property, Dates, each Room & guest group (with `"Đổi phòng"`), one concise non-availability notice, `"Chỉnh sửa tìm kiếm"`, and `"Quay lại chọn phòng"`. Removed disabled contact chips from the review sheet.

### Automated QA Verification (`docs/qa/booking-results-2026-10-24/scripts/qa-ux-simplification.mjs`)
- **Scenario A (All properties, 1 room, 2 adults):** **PASS** (6 photo-led property cards with `"Xem phòng"`, clicking `"Xem phòng"` drills into property rooms preserving dates & guests).
- **Scenario B (Bare Chic, 2 rooms, 4 adults):** **PASS** (sequential `"Đang chọn phòng 1/2"` → `"Đang chọn phòng 2/2"`, auto-advance, unique unit protection).
- **Scenario C (Changing a selected room):** **PASS** (switching back to Room 1 and choosing another available room updates Room 1 cleanly).
- **Scenario D (Removing a room group):** **PASS** (removing a room group via `"Chỉnh sửa"` → `"Phòng & khách"` updates URL and state cleanly).
- **Scenario E (Selecting a room with unknown capacity):** **PASS** (distinguishes unverified room preference `"Sức chứa chờ xác nhận · Lựa chọn nguyện vọng phòng"` from verified capacity on `Bare Chic One`).
- **Scenario F (Insufficient eligible unique physical rooms):** **PASS** (requesting 3 rooms at `Pepper House`, which has 2 physical units, shows the truthful insufficient-rooms status notice after 2 rooms are assigned).
- **Scenario G (Editing dates and returning to results):** **PASS** (inline date editor updates check-in/check-out and night count).
- **Scenario H (Refresh and browser-back behavior):** **PASS** (reload and `history.back()` preserve selections and state via URL sync).
- **Captures (`docs/qa/booking-results-2026-10-24/simplified/`):**
  - `1440-search-results.png` & `390-search-results.png`
  - `1440-one-room-selected.png`
  - `1440-two-rooms-selected.png`
  - `1440-review-sheet.png` & `390-review-sheet.png`
  - `1440-all-properties.png` & `390-all-properties.png`

---

## Room-First Booking Results & Frictionless Multi-Room Selection (Owner Feedback — 24/10/2026)

### Root Causes of the Two Observed UX Issues
1. **"All Properties" showed a mandatory property-discovery grid first (`"Xem phòng"`):**
   - In `BookingResults.tsx`, `!selectedProperty` (`propertySlug === null`) rendered an intermediate 6-property overview grid (`propertyCardGrid`) instead of rendering the room-results workspace directly.
2. **Adding a second room required reopening the search editor, and same-room-type multi-unit selection was not distinguished from unique physical room protection:**
   - `handleAddRoom()` was only accessible inside the collapsed search editor (`editorOpen && editorTab === "rooms"`), and `booking-results-state.ts` treated every room option strictly as `physicalUnits: 1` without distinguishing multi-unit room categories (`optionKind: "room-type"`, `sameTypeUnitIds` / `roomTypeGroupId`) from unique physical units (`optionKind: "physical-unit"`).

### Redesign Summary (Tasks 1–7)
1. **Task 1 — Show Room Results Immediately (`property=all` & single property):**
   - Removed the intermediate property-card grid (`"Xem phòng"`). Searching `All Properties` lands directly on the 22-room catalog list with Property & City kicker metadata on each room card and inline City/Property filter chips.
   - Selecting a room at a property scopes subsequent multi-room selections to that property by default so a single reservation never silently combines rooms across different properties.
2. **Task 2 — Prioritize Bookable Information & Honest No-PMS State:**
   - One concise page-level provider notice; zero repeated warnings on cards.
   - Each room card shows verified photo, property & city kicker, room name, verified type/size (`Studio · 28 m²`, `Studio · 18 m²`, etc.), verified capacity (or honest `Sức chứa: chờ xác nhận`), category/unit badge, `"Xem chi tiết"`, and one primary selection action.
3. **Task 3 — Add Rooms Directly from Booking Results:**
   - Added prominent, minimal **`+ Thêm phòng`** buttons directly in the sticky desktop summary, the active selection bar, and the mobile bottom bar, plus inline per-room guest steppers (`− / +`) so guests never need to reopen the search editor to add/remove a room or adjust guest counts.
4. **Task 4 & Task 6 — Workbook Audit, Same-Room-Type Multi-Unit Selection & PMS Adapter:**
   - Audited `VNest_Informationv2.xlsx` and the `15/10` room sheet: each of the 22 named rows is a unique physical unit (`physicalUnits: 1`), while several properties have multiple physical units sharing a verified `roomType` (`Bare Hyphen`: 3 `Studio · 18 m²` units + 1 `Duplex studio`; `Bare Đa Kao`: 4 `Studio` units; `The Nắng Suites`: 4 `Studio` units).
   - Preserved unique physical unit protection (`Bare Chic One` cannot be selected twice) while adding `evaluateSameTypePool`, `selectAdditionalSameTypeUnit`, `summarizeSelectedRoomTypes`, and `applyProviderInventoryToCatalog` so guests can select multiple units of a multi-unit room type (`+ Chọn thêm 1 căn hạng Studio`, showing `2 × Hạng Studio`) without duplicating physical units or inventing inventory.
5. **Task 7 — Automated QA Scenarios (`1`–`10`) at `1440px`, `768px`, and `390px` (`docs/qa/booking-results-2026-10-24/scripts/qa-room-first.mjs`):**
   - All 10 scenarios pass at `1440px`, `768px`, and `390px` with `0` console errors, `0` broken images, and `0` horizontal overflow.
   - Captures saved in `docs/qa/booking-results-2026-10-24/room-first/`.


