# VNest V3 · Takeover after Antigravity (25/10/2026): review package

**Status: IN REVIEW, stopped for the owner's visual acceptance.** Nothing committed, pushed, merged, deployed or frozen. No branch switch, reset, stash or clean; no untracked asset touched; no imagery replaced.

**Demo route (local, `next start`):** <http://localhost:3402/dev/demo> (launch configuration `vnest-v3-qa`, added to `.claude/launch.json`). The older configuration `vnest-v2-client-preview` (port 3400) still works after a fresh `next start`. A `next start` process from 00:53 today still holds port 3400 and serves a build older than this one, so it is not a valid review target.

## 1. Takeover findings

The Antigravity report was checked against the code and the running build.

| Claim | Verified result |
|---|---|
| 315 tests, 27 routes | **True** before my changes (315/315; build OK). Now 319/319 (4 new tests) |
| Exactly one footer per property page | **True** (counted on the homepage, Bare Chic, The Nắng Suites, Booking Results and the booking step: 1 each) |
| Homepage → property opens at the top | **True** (`scrollY` 0 at all three widths) |
| Google Maps links | **True**: both `share.google` links redirect to the right places (Bare Chic `/g/11f6ywgqpw`, The Nắng Suites `/g/11fnr8n47n`, as in the 15/10 audit) |
| Related Properties excludes the current property | **True** (5 shown on each page) |
| Policy dialog "accessible, approved data" | **Partly.** Accessible (Escape, focus returns). It showed no workbook values, which is right (Q25), but it **invented process promises** ("sẽ được gửi kèm xác nhận đặt phòng", "trước khi hoàn tất yêu cầu"). **Fixed** |
| On-property BOOK NOW review | **P1: fake confirmation.** "Xác nhận yêu cầu chọn phòng" switched the dialog to "Đã ghi nhận lựa chọn phòng…" and "Hoàn tất", though nothing was recorded or sent. **Fixed** |
| Refresh / Back keep the selection | The state was kept, but **every refresh of a property page with rooms selected threw React hydration error #418** (server rendered "0/1", browser "2/2"). **Fixed** |
| Nắng room facts "restored in page.tsx" | **Inaccurate description; correct result.** The page reads facts through the shared builder; nothing is hard-coded |
| No horizontal overflow | **False at tablet widths.** Both property pages were 925 px (Bare Chic) and 875 px (Nắng) wide at 768 px: the new location panel's inner grid sized itself to its widest line. The old check missed it because mobile emulation widens the viewport with the content. **Fixed**, and the check now compares against the emulated width |

**Found during QA (not in the report):** the property page and Booking Results read the `rooms` address parameter differently. Booking Results treats `rooms=2` as two rooms and `rooms=2,3` as adults per room; the property page treated `rooms=2` as one room for two adults and wrote it that way. Going from the booking step back to a property turned "1 room · 2 guests" into "1 room · 1 guest". **Fixed:** the property page now uses the shared parser and format.

**No real blockers.** Content and integration dependencies are listed in §6.

## 2. What changed

**Stage 1 fixes (P1 only)**
- `property-detail/PropertyRoomCollection.tsx`:
  - the selection is read with `useSearchParams` (server and browser agree, so refresh hydrates cleanly);
  - it is parsed with the shared `parseMultiRoomQuery` and written in the same format as Booking Results;
  - the fake confirmation is replaced by **"Tiếp tục"**, a link to the honest booking step `/dev/demo/dat-phong` carrying the stay. That step restates the allocation and says no request was received, no room is held and nothing was paid.
- `demo/BookingResults.tsx`: the review sheet ends the same way ("Tiếp tục" once every room is chosen), so both journeys share one endpoint.
- `property-detail/LocationAndPoliciesPanel.tsx`: the policy dialog lists four topics, each "Chờ VNest xác nhận". No values, no promises.
- `PropertyDetail.module.css` and `LocationAndPoliciesPanel.module.css`: the aside track is `minmax(0, 1fr)`, and the map card stacks by the panel's own width (container query).

**Stages 2–4: Services B, Contact, FAQ, Footer.** These were already built on 24/10 (`OwnerJourney.tsx`, `DemoFooter.tsx`), so they were refined, not rebuilt:
- **Services:**
  - the three official CEO headings, unchanged;
  - the one shared detail region is now a white panel with a visible pointer to the chosen card (before, it was beige on beige and its pointer was invisible);
  - the copy and data moved to `demo/owner-journey.ts`;
  - choosing a card keeps the service in the address (`?dich-vu=`).
- **Contact:**
  - five fields: Họ tên, Số điện thoại hoặc email, Dịch vụ quan tâm (pre-filled), Loại tài sản (optional, **new**), Nội dung trao đổi (optional, renamed);
  - accessible validation: `aria-invalid`, an error tied to each field with `aria-describedby`, focus on the first error, and a polite live status;
  - the CTA scrolls to Contact, keeps the service and focuses the first empty field with a mouse or keyboard. On touch it focuses the heading, so the on-screen keyboard does not open uninvited;
  - a valid form says **"Chưa gửi…"** and why. There is no success state, no request is sent (measured: 0 non-GET requests), and the input is kept;
  - the submit button reads "chưa hoạt động".
- **FAQ:** six questions on the brief's topics (management, eligible assets, model consulting, franchising scope, partnership process, follow-up). One opens at a time and they work with the keyboard. Each answer is a DRAFT placeholder that names what VNest must supply.
- **Footer:**
  - real routes only;
  - each service link opens its own card;
  - "Khám phá 6 nơi ở", "Ba thương hiệu", both property pages and BOOKING are linked;
  - hotline/email/address, social accounts, policy pages and the legal entity are pending text, with no links or icons. The three social-network name pills were removed: VNest has no accounts yet;
  - one component, rendered once per page.
- **About VNest** is unchanged (kept until the owner approves its removal).

**Stage 5: CTA contrast.** White on Copper Bronze #A87444 is **4.0:1**, below WCAG AA (4.5:1) at the sizes BOOKING, BOOK NOW and the other CTAs use. CTA fills under white text now use **#9A683C**, the closest shade of the same copper that passes (4.75:1). It is set through the demo's own tokens; the frozen 02.1 code is untouched. #A87444 stays for marks, borders and decoration, and the logo artwork is unchanged. In the owner sections, small taupe and copper text uses darker shades of the same hues (#6F675B 4.7:1 on beige, #8F6036). **Owner decision, 25/10/2026: keep #9A683C for CTA fills under white text.** #A87444 remains the brand colour for marks, borders and decoration.

**Files.** New: `src/features/demo/owner-journey.ts`, `owner-journey.test.ts`, this folder. Changed: `OwnerJourney.tsx` and `.module.css`, `DemoFooter.tsx`, `BookingResults.tsx` and `.module.css`, `Demo.module.css`, `BookingCta.module.css`, `HomepageBookingOverlays.tsx`, `property-detail/PropertyRoomCollection.tsx` and `.module.css`, `LocationAndPoliciesPanel.tsx` and `.module.css`, `PropertyDetail.module.css`, `RelatedProperties.module.css`, `.claude/launch.json`.

## 3. Room metadata (1A): R3 implemented (owner decision, 25/10/2026)

**Decision.** The owner rejected R1 and R2 and chose **R3: merged-cell scope with the owner-confirmed workbook interpretation.** Grounds: VNest's admin confirmed the sheet is accurate.
- Each property-specific merge applies its type and area to every row it covers.
- The workbook-wide F4:F25 applies "2 người lớn" to all 22 rooms.
- Explicit per-row values stay the source of truth.

**What the cards show now** (both booking pages, the room drawer and the BOOK NOW review):

| Property | Shown on every room | From |
|---|---|---|
| Bare Chic (4) | Studio · 28 m² · 2 người lớn | D4:D7, E4:E7, F4:F25 |
| Bare Hyphen (4) | Studio · 18 m² (Four: Duplex studio · 30 m²) · 2 người lớn | own rows D8–E11, F4:F25 |
| Bare Đa Kao (4) | Studio · 13 / 19 / 19 / 17 m² · 2 người lớn | own rows D12–E15, F4:F25 |
| Bare Hàn (4) | Studio · 30 m² · 2 người lớn | D16:D19, E16:E19, F4:F25 |
| The Nắng Suites (4) | Studio · 21 / 23 / 30 / 36 m² · 2 người lớn | own rows D20–E23, F4:F25 |
| Pepper House (2) | Studio · 40 m² · 2 người lớn | D24:D25, E24:E25, F4:F25 |

**Implementation**
- `content/vnest-workbook/property-details.ts`:
  - `legacyFact` gives an explicit row value precedence over a merge;
  - `confirmedRoomFact` shows a value on every row its merge covers;
  - `factRange()` reports the range (e.g. "E4:E7");
  - `ROOM_FACT_INTERPRETATION` records R3: who decided it and when, display-only, written per-room confirmation pending (Q37).
- **Provenance:** each shown value keeps its raw text and anchor cell. Its rule names the range, the admin confirmation, "display metadata only: not provider-confirmed occupancy, eligibility or availability" and the pending written record. The `not-reconfirmed` trace of the 15/10 sheet is unchanged.
- **Display only:**
  - neither booking catalog turns "2 người lớn" into a limit any more (`verifiedMaxAdults` is null for every room, in `booking-results-data.ts` and `PropertyRoomCollection.tsx`);
  - this removes the earlier 2-adult block on Bare Chic One, so a selection is never dropped or refused because of workbook occupancy;
  - the capacity mechanism itself stays for limits ezCloud will supply, and a test keeps it covered.
- **Wording:** the card formatter used to rewrite "2 người lớn" (adults) as "2 khách" (guests). It now shows the workbook's wording.
- **Side effect of fuller type data:** Bare Chic, Bare Hàn and Pepper House rooms now group as one room type ("Studio"). Booking Results' summary can show "2 × Hạng Studio" above the named rooms, and the "+ Chọn thêm 1 phòng hạng Studio" shortcut appears there as it already did for Bare Hyphen. Unique-unit protection is unchanged: the same physical room is never assigned twice.
- **Frozen contracts:** 02.1 untouched; the address format is unchanged; existing selections are kept.
- **Tests:** `room-facts.test.ts` pins all 22 rows under R3, explicit-row precedence, ranges and the display-only rule. `view.test.ts` and `booking-results.test.ts` were updated from the superseded 21/10 rule. 320/320 pass.

**Before production publication:** written per-room confirmation from VNest is still desirable (Q37): type, area and occupancy per room. Real occupancy limits and availability must come from ezCloud when connected.

### Earlier analysis (kept for the record)

Source: the 15/10 workbook's sheet "Cơ sở & danh sách phòng" (`~/Downloads/VNest_Information.xlsx`; byte-identical to `VNest_Information (1).xlsx`), read from its XML.

| | What the sheet expresses |
|---|---|
| Own-row values | Bare Hyphen (4), Bare Đa Kao (4) and The Nắng Suites (4) give type and size on every row |
| D4:D7 / E4:E7 | One "Studio" and one "28m2" spanning Bare Chic's four rooms |
| D16:D19 / E16:E19, D24:D25 / E24:E25 | The same for Bare Hàn (Studio, 30m2) and Pepper House (Studio, 40m2). These rooms are named by floor ("Ground…Three", "3rd/4th-floor"), consistent with identical floor plates |
| F4:F25 | **One** "2 người lớn" spanning **all 22 rooms in all six properties**. It is the only merge that crosses property boundaries; every other merge (A, B, D, E) stops at one |

**What VNest confirmed:** the admin's general statement that the room information is accurate (relayed by the owner 21/10; written record pending, Q37). **What was shown before R3** followed the owner's 21/10 brief: own-row values; Bare Chic One "Studio · 28 m² · 2 khách"; Bare Chic Two, Three and Indochine show nothing. I did **not** change this, because it is an explicit owner decision.

**Structural observation for the owner:** showing a merged value on the first row only singles that room out. Bare Chic One carries "2 khách" although the same cell covers every room in the workbook. Two consistent options:

- **(R1, recommended)** type and area from within-property merges on every room they cover (Bare Chic 4 × "Studio · 28 m²", Bare Hàn 4 × "Studio · 30 m²", Pepper House 2 × "Studio · 40 m²"). Occupancy shown on **no** card until VNest gives it per room, because F4:F25 reads as a workbook-wide note. The 2-adult booking limit on Bare Chic One would then also go.
- **(R2)** keep the current display.

The confirmation request for VNest: "Studio · 28 m² for all four Bare Chic rooms? 2 adults for every room?"

Facts render with minimal icons (type, area, occupancy) and screen-reader labels. No verification text reaches guests.

## 4. QA

Run against `next start` on the final build. Headless Chrome with **device emulation: mouse at 1440, touch at 768 and 390. Not tested on a physical phone or with a screen reader.**

- `scripts/qa.mjs`: **129/129 checks pass** across the three widths; **0 console errors; 0 non-GET requests**. `results.json` has the detail.
  - **Guest A:** homepage BOOK NOW → Booking Results; one room; add a room directly; physical-unit lock; two different rooms; guest allocation (2 + 3); reassign; refresh; review → "Tiếp tục" → booking step; Back; remove a room; same type twice (Bare Hyphen Studio) → two different units.
  - **Guest B:** homepage → Bare Chic at the top; inline gallery (next button / swipe); 1 then 2 rooms with the unit lock; BOOK NOW review without a fake confirmation; Escape; refresh; booking step → property keeps "1 room · 2 guests · Bare Chic Two".
  - **Property pages (both):** one footer; no overflow or broken images; the property's own map link; related properties exclude it; policy dialog shows topics only and Escape returns focus; the footer's last link is not covered by the fixed selection bar.
  - **Partner:** one detail region follows the card; consulting scope text; CTA → Contact (in place, service kept, focus placed); five fields; empty submit gives accessible errors; valid submit sends nothing and says so; `?dich-vu=` survives a reload; six FAQ items, exclusive, keyboard; every footer link resolves (200 and the anchor exists); no social, `tel:` or `mailto:` links.
  - **Also:** brand preview on hover at 1440 / tap selects on touch; CTA fill computed as #9A683C.
- **Frozen and non-demo regression** (`../v3-stage1-2026-10-24/scripts/regress.mjs`, label `takeover-2026-10-25` vs the pre-V3 `before`): 02.1 preview, `/stays`, `/stays/bare-chic`, the frozen `/dev/stays/bare-chic-20-10`, `/b` and `/b-client`: **0 changed pixels in 18/18 captures**. The two Bare Chic review views (`/dev/stays/bare-chic`, `?price=public`) differ, as expected, because Antigravity redesigned the shared property layout after that baseline.
- **Suite:** lint 0 errors (3 old warnings in QA scripts), typecheck clean, **319/319 tests**, production build OK (all routes).
- **Final rerun after R3 (25/10/2026), on the final build:** `qa.mjs` **168/168 checks pass**: the 135 earlier checks plus 11 new ones at each width, at 1440, 768 and 390. **0 console errors, 0 non-GET requests, 0 server errors.** Evidence is in `results.json`.
  - **R1:** all 22 rooms show the R3 type · area · "2 người lớn" (22 cards, 0 wrong). Only visible text is counted, so closed dialogs no longer cause a double count.
  - **R2:** "2 người lớn" is display only. 3 adults can still choose Bare Chic One, with no "Tối đa" message.
  - **Studio pool on Booking Results:**
    - P1: the "+ Chọn thêm" shortcut stops after the 4 real Bare Chic rooms (3 presses), each assigned once;
    - P2: the label claims no count;
    - P3: "4 × Hạng Studio" on desktop, "4/4 phòng đã chọn" on touch;
    - P4: an assigned room shows "Đã chọn cho Phòng N" (disabled);
    - P5: a refresh keeps all four.
  - **Property page:**
    - Q1: two distinct Studio rooms, then change room 2;
    - Q2: the shortcut fills only the 2 remaining rooms, with no duplicates;
    - Q3: removing a room drops only that room;
    - Q4: a refresh keeps the selection exactly.
  - **Routes:**
    - U1: direct URLs answer 200 (homepage, Booking Results, Bare Chic, The Nắng Suites, booking step);
    - U2: homepage → The Nắng Suites by click (at the top, one footer), then Back to the homepage.
  - **Regression fixed during this audit:** the same-type shortcut read "(còn N phòng)", which a guest takes as availability. R3 spread it to Bare Chic, Bare Hàn and Pepper House. It now reads "+ Chọn thêm 1 phòng hạng Studio khác" on both pages.
  - **Frozen and non-demo regression** (label `takeover-r3-2026-10-25`): 18/18 identical. The 6 differing captures are the two Bare Chic review views (expected).
  - **Suite:** lint 0 errors, typecheck clean, 320/320 tests, build OK.
- **Not covered:** physical devices, screen readers, real smooth-scroll timing on iOS Safari, performance metrics.

## 5. Screenshots

- **Before / after, Services, Contact, FAQ, Footer:** `before-after-1440.jpg`, `before-after-768.jpg`. Single images are in `before/` and `after/` (`<width>-<section>.jpg`). The `before/390-*` captures were taken at 2× density, and the lower sections wrap; `after/390-*` are 1×.
- **Journeys** (`journeys/<width>-…`):
  - `A-results-two-rooms`, `A-review`;
  - `B-property-two-rooms`, `B-book-now-review`;
  - `P-bare-chic-footer`;
  - `S-services-consulting`, `S-contact-errors`, `S-contact-unsent`.

## 6. Remaining VNest content and integration dependencies

- **Services:** detail text (40–60 words) and three items (5–10 words) per service; confirmation that "Phát triển dự án" is model consulting only; franchising brands, scope and what may be published.
- **Contact:** the lead channel and its owner (email or API), the privacy and consent notice, a lead text (20–35 words), the asset-type list (if a pick-list is wanted), the follow-up process. Until then, submission stays off.
- **FAQ:** six approved answers (30–60 words each).
- **Footer:** hotline, email, address, legal entity and tax code, policy pages, VNest social accounts.
- **Rooms:** written per-room confirmation of type, area and occupancy before production publication, especially the merged Bare Chic, Bare Hàn and Pepper House values and the workbook-wide "2 người lớn" (§3, R3, Q37). Real occupancy limits come from ezCloud. Booking policies per property (Q25).
- **Booking:** the ezCloud connection (availability, rates, holds, payment). Until then the journey ends at the honest booking step.
- **Owner decisions:** whether About VNest stays on the homepage. (Decided 25/10: CTA copper #9A683C; room facts R3.)
