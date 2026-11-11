# Occupancy UX correction (5/11/2026)

Status: READY FOR OWNER ACCEPTANCE, not frozen. Production build on `vnest-v3-qa` (http://localhost:3402).
The 1–2 guests per room rule is **provisional and needs VNest confirmation before public release** (audit:
`docs/qa/room-selection-simplify-2026-11-05/REVIEW.md` §1).

## 1. The rule now

Rooms and guests are each the guest's own choice. N rooms take N to 2N guests (1 room: 1–2, 2: 2–4, 3: 3–6, … 6: 6–12).
**Nothing ever changes one to fit the other.**

| Situation | Behaviour |
| --- | --- |
| Guests reach rooms × 2 | "Thêm một khách" is disabled; note: **"Mỗi phòng tối đa 2 khách. Vui lòng thêm phòng nếu cần."** (at 6 rooms: "Tối đa 6 phòng, 12 khách cho mỗi yêu cầu.") |
| Adding a guest | Never adds a room (the previous automatic room is removed). |
| Adding a room | Keeps the guest total. Not offered when a room would be empty: "Mỗi phòng cần ít nhất 1 khách: thêm khách trước khi thêm phòng." |
| Removing a room the guests need | Not offered in the steppers. A × on a property-page slot or a "Xoá" on the results page explains it and changes nothing, e.g. "3 khách cần ít nhất 2 phòng (mỗi phòng tối đa 2 khách)." |
| Removing a guest | Not below one per room. |
| Per-room split | Internal and automatic (3 in 2 → 2 + 1; 5 in 3 → 2 + 2 + 1). No per-room guest steppers anywhere. |

One definition (`src/domain/hybrid-booking/room-occupancy.ts`: `guestRangeFor`, `occupancyFit`, `allocateGuests`,
`roomsCanGrow`, `roomsCanShrink`) drives every surface listed below, the address, and the server's stay check.

## 2. Surfaces

- **Shared "Phòng & khách" field** (homepage bar, property-page header, phone sheet): one guest stepper and one room
  stepper with the limits above, and one note. The bar's look is unchanged. The per-room split line ("Phòng 1: 2 khách ·
  Phòng 2: 1 khách") is no longer shown, since the split is internal.
- **GoHost property page:** unchanged from the accepted simplification (dates, summary that opens the shared field, room
  slots, one BOOK NOW). "+ Thêm phòng" and the slot × follow the same rule and explain a refusal.
- **Results page (`/dev/demo/tim-phong`):** per-room guest steppers removed from all three places: the editor's "Phòng &
  khách" tab (now the same two steppers, "Khách" and "Phòng", in the page's own stepper style), the "Đang chọn phòng" bar,
  and each room in the summary panel. Everything else on the page is unchanged: the layout, the slot pills, "+ Thêm phòng"
  (now always shown, explaining a refusal instead of disappearing), the review and the availability cards. The pills still
  label the automatic split as text ("Phòng 1 (2 khách)").

## 3. Outdated or edited addresses

An address whose guests do not fit its rooms (e.g. `rooms=1&adults=3`, or `rooms=3&adults=2`) is **kept as it is**: the
room count is not changed, and no guest is dropped or invented.
- **The notice:** on the property page (both providers) and the results page it says so and offers two explicit fixes.
  Over: "Dùng 2 phòng cho 3 khách" / "Giữ 1 phòng, 2 khách". Under: "Dùng 2 phòng cho 2 khách" / "Giữ 3 phòng, 3 khách".
- **The shared field:** its note says the same and offers only the steps that move towards a fit.
- **The address:** until corrected, it keeps `rooms` and `adults` as given; refresh and Back return the same notice.
- **Booking:** BOOK NOW explains the problem rather than opening the review, and the results review's "Tiếp tục" is
  withheld.
- **Providers:** nothing is asked of a provider about a different, adjusted stay. The server refuses the stay and the cards
  say "Điều chỉnh số phòng và số khách để kiểm tra tình trạng phòng" (new reason `occupancy-correction`). ezCloud
  hand-offs carry the stay unchanged.
- **No room count at all** (e.g. `adults=5` only): the search starts at the fewest rooms that hold the guests (5 → 3). That
  is an initial default, not a change.

## 4. QA (production build)

| Suite | Result |
| --- | --- |
| `test/e2e/occupancy.test.mjs` (new), 1440 and 390: shared field walked through every valid combination from 1 guest / 1 room to 12 / 6 (every step's enabled state checked, a guest never adds a room, a room keeps the guests); cap message at 2/1; results page with no per-room steppers, two editor steppers, guest cap, refused removal explained, refresh and Back; results-page outdated link (no provider check, corrected by the guest) | 8/8 |
| `test/e2e/room-selection.test.mjs`, 1440 and 390: 1/1, 2/1, 3/2, 4/2, 5/3, 3/3 (slots, select, review, guest total reaches the provider step); guidance; add, refuse, remove; refresh and Back; summary opens the field (cap, explicit room, never automatic); outdated links over and under, corrected by the guest; ezCloud hand-off, including an outdated link carried as it is | 22/22 |
| Regressions: hybrid booking (GoHost and ezCloud flows, results page, header field, Back) · mobile interactions (Chromium and WebKit) · About · homepage content | 79/79 · 16/16 · 16/16 · 11/11 |
| Unit (`npm run check`): every N/G combination, the internal split, grow/shrink, note wording, stepper limits, guidance, address parsing (over, under, list, none), explicit changes, server path (no provider call, `occupancy-correction`) | 425 pass; lint 0 errors (3 old warnings in `docs/qa` scripts); typecheck |
| Production build | PASS |

Tests that encoded the earlier automatic room were rewritten to the corrected behaviour; the diff shows each changed
expectation.

## 5. Screenshots (`screens/`, before → after, 1440 and 390)

- `*-panel-2g1r-*`, `*-panel-after-plus-guest-*`: before, a third guest added a room; after, the guest stepper stops at 2
  with the cap message (`after-panel-12g6r-*` shows the top of the range).
- `*-results-editor-*`: per-room list with − / + and "Xoá" → two steppers. `after-results-editor-cap-*`: the cap note.
- `*-results-roombar-*`, `*-results-summary-1440`: the per-room guest stepper removed.
- `*-property-deeplink-3g1r-*`: before, 3 guests silently spread over 2 rooms; after, 1 room kept with the correction
  notice. `after-deeplink-over-*`, `after-results-deeplink-over-*`: the notice on each page.

Script: `scripts/capture.mjs <before|after>`.

## 6. Open

1. Confirm the 1–2 guest rule with VNest, or obtain GoHost and ezCloud room limits, before public release.
2. The results page's slot pills still show the automatic split as text ("Phòng 1 (2 khách)"). Removing it would change
   that page's approved pills; left as is.

Nothing staged, committed, pushed or deployed.
