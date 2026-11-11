# Client review 6/11/2026 — implementation map

Branch `feat/vnest-v3-media-import`. Nothing is committed, staged, stashed or deployed by this work. The 21 staged files and
`stash@{0}` (GitHub Desktop, "!!GitHub_Desktop<main>") are left as they are.

Homepage = `/dev/demo` (`src/app/dev/demo/page.tsx`). Order today: header → hero → brand index (`#thuong-hieu`) → stays
(`#kham-pha`) → About (`#ve-vnest`) → services (`#hop-tac`) → consultation form (`#lien-he`) → FAQ (`#hoi-dap`) → footer
(VNest contact details).

The owner's 6/11 request is the approval to change the sections frozen on 5/11 (brands, services, FAQ). Client copy (05.11 Final)
stays verbatim.

## The 13 changes → files

| # | Change | Main files | Risk / note |
|---|--------|------------|-------------|
| A1 | Hero: no dots, arrows or captions; 3 s dwell; soft fade; pause kept | `HeroCarousel.tsx`, `Demo.module.css`, `site-copy.ts` | e2e read the active slide from the dots → read `data-active` instead |
| A2 | About CTA → "Liên hệ VNest" to `#lien-he` | `about-copy.ts`, `AboutVNest.tsx`, `DiscoverLink.tsx` | about-copy and about-vnest tests expect the old CTA (owner-approved change) |
| A3 | Menu: no numbers; Khám phá · Hợp tác · Hỏi đáp · Liên hệ | `SiteHeader.tsx`, `site-copy.ts`, `links.ts` | "Về VNest" leaves the menu (not in the requested list); the footer keeps it |
| A4 | FAQ → contact details → form → minimal footer; one background; no DRAFT labels | `OwnerJourney.tsx`, `OwnerJourney.module.css`, `DemoFooter.tsx`, `page.tsx` | footer is shared by property pages → homepage gets a `minimal` variant, other pages unchanged |
| B1 | Brand order Bare → Pepper House → The Nắng | brand adapter / `HomeCollection.tsx`, filters | property ids, slugs, routes, provider mapping unchanged |
| B2 | Simpler brand index (logo, name, one marker; no thread lines, no white selected state) | `HomeCollection.tsx/.module.css` | |
| B3 | Hover/focus preview, click locks; tap on touch | `HomeCollection.tsx` | replaces the floating preview card; no layout jumps |
| B4 | Detail panel: big logo, no repeated name, cities / properties in two columns | `HomeCollection.tsx/.module.css` | copy verbatim |
| B5 | One "Visit us ↗" per brand to its official website | brand URL config (new, in content layer) | **BLOCKED: no verified brand website exists in the repo or the client docs.** Only Facebook pages were supplied |
| C1–C3 | Discovery: no duplicate label, no "Tất cả nơi ở"; "Tất cả" + brands; cities HCM / Đà Nẵng only, "available" vs "selected" | `HomeCollection.tsx`, `useCollection.ts` (brand-collection) | invalid brand × city must resolve visibly, never zero results |
| C4 | Coming Soon teaser (generic + per brand), not bookable | new component in `features/demo` | no names, dates, addresses, counts or prices |
| D1 | Services: stronger kicker; open panel without duplicate title, larger copy, stronger CTA; evaluate dropping highlights | `OwnerJourney.tsx/.module.css` | highlights stay in `owner-journey.ts` |
| D2 | Booking bar: no room selector; guest panel with age bands | `features/booking-search/*`, `domain/search.ts`, `OccupancyPanel.tsx` | children are NOT VNest policy; rooms stay in the model, property pages and adapters |
| D3 | Calendar: one month | `DateRangeCalendar.tsx` callers | cross-month ranges must still work |
| D4 | Backend handoff doc | `docs/handoff/BACKEND-HANDOFF.md` | |

## Technical risks

- Shared components: `DemoFooter` (all demo pages), `DateRangeCalendar` / `BookingBar` (homepage, property pages, results,
  booking step). Changes are made behind props or apply everywhere on purpose (calendar).
- Children: `SearchCriteria.children` is reserved and never parsed; GoHost and ezCloud payloads carry adults only. Age bands need an
  explicit model and must not be added to adults or to the 2-per-room rule without VNest's policy.
- Hydration: the homepage already has a known CLS from OwnerJourney (noted 5/11). Re-ordering sections must not add hydration errors.
- e2e suites rely on `li[data-room-id]`, `data-slot-room`, `#lien-he` form fields and the menu dialog label.
