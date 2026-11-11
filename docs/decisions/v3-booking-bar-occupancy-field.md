# V3 Booking bar — combined "Phòng & khách" field: Design Decision Record

Status: **APPROVED by the owner on 4/11/2026 ("Accept") — FROZEN.** Changes need the owner's approval.
Review package: `docs/qa/booking-bar-occupancy-2026-11-04/REVIEW.md`.

## 1. Section objective

Let guests choose guests and rooms in the search itself, as distinct, predictable values, without changing the approved
02.1 booking bar's direction or adding large controls.

## 2. Final approved design

- One field "Phòng & khách" reading "3 khách · 2 phòng" in the full bar, the compact header bar, the mobile hero pill and the sheet.
- Its panel: the bar's own steppers for Người lớn and Phòng, and one line with the per-room split and the rule.
- Rules (`booking-results-state.ts`): adding or removing a room never changes the guest total; a new guest joins the room with the
  fewest, a guest leaves the room with the most; at least one guest per room; room preferences stay with their rooms; the split is
  edited on the results page. No occupancy maximum is invented.
- Layout: desktop proportions 1.3 : 2.1 : 1.35; tablet 1.38 : 2.15 : 1.47 with 14 px field padding below 1024 px; compact bar
  1 : 1.17 : 1.07 with 12 px padding below 1024 px; mobile hero pill with a controlled two-line summary; mobile sticky pill keeps its
  single truncating line.
- Opt-in through `BookingPresentationProvider` (`occupancy`), so the frozen 02.1 surfaces (`/dev/booking-search`, `/stays`,
  `/stays/[property]`) are unchanged.

## 3. Why this design was selected

The owner chose Option B over (a) showing rooms only when more than one, and (c) keeping rooms in the results editor only, after the
visual proposal of 4/11 showed truncation at the approved widths. The refined version rebalances widths from measurements instead of
shortening the wording.

## 4. Alternative approaches considered

| Alternative | Trade-off | Why not chosen |
|---|---|---|
| (a) Rooms in the summary only when > 1 | Shorter, but the field still truncates with two rooms | Owner chose B |
| (c) Rooms only in the results editor | No bar change, but rooms cannot be set when searching | Owner chose B |
| Two-line summary in the mobile sticky pill | Complete reading | ~140 px available: it clipped mid-date; kept the approved single line |
| Shorter wording ("3 · 2P") | Fits | Unclear to guests |

## 5. UX and conversion reasoning

| Claim | Hypothesis or validated | Evidence |
|---|---|---|
| Guests understand "3 khách · 2 phòng" faster than separate fields | Hypothesis | Not user-tested |
| Keeping the guest total fixed when rooms change avoids misleading searches | Owner requirement | Brief 4/11/2026 |
| The complete summary is readable at 768–1440 px | Validated | Measured: every label on one line and every value whole |

## 6. SEO implementation

None: the bar is interactive search UI on private review routes; result URLs stay noindex.

## 7. Accessibility and performance decisions

Steppers are labelled groups with named buttons ("Thêm một phòng", …) and live outputs; all controls ≥ 44 px; the split line is
`aria-live="polite"`. No new dependency; the panel reuses existing components.

## 8. Component architecture

`presentation.tsx` (`occupancy` opt-in) → `BookingBar.tsx`, `MobileBookingSearch.tsx`, `GuestStepper.tsx` (optional wording);
demo layer: `OccupancyPanel.tsx`, rooms context in `BookingCta.tsx`, `booking-flow.ts` (rooms into the results address),
`PropertyRoomCollection.tsx` (two-way sync with the header field).

## 9. Backend integration requirements

When a provider supplies occupancy rules, validate the allocation on the server before any live booking (`stay-validation.ts`).

## 10. QA evidence and remaining limitations

| Check | Result | Evidence |
|---|---|---|
| 375 / 390 / 430 px | PASS: complete summary in the hero pill (≤ 2 lines), no overflow, journey with 0 console/hydration errors | `screens/`, `video/mobile-homepage-journey-390.webm` |
| 768 px | PASS (labels one line, values whole); worst case "18 khách · 6 phòng" cut by 3 px, fits from 820 px | `REVIEW.md` |
| 1440 px | PASS | `screens/compare-home-bar-1440.png` |
| Keyboard and screen reader | Named controls and live outputs; not tested with a screen reader | — |
| Lint, typecheck, tests, build | 0 errors; 400 unit; e2e 79/79 and 16/16; build PASS | `REVIEW.md` |
| Performance | Not measured | — |

Accepted compromises: the mobile sticky pill keeps a single truncating line; the 768 px worst case above; tablet field padding 14 px.
