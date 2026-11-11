# Booking property selector audit — 23 October 2026

## Cause

The homepage used `getServices().properties.listProperties()` for booking options. Under the local `CONTENT_SOURCE=client-draft` configuration, that repository comes from `draftPropertyRecords()`, which currently returns only `buildBareChic(...).record`. It is the detail-page catalogue, not the six-property workbook inventory. Consequently, the five missing options were genuinely absent from selector data—not simply hidden below the viewport.

Brand Collection already uses `readClientProperties()` → `clientCollection()`, with all six names, canonical IDs and sourced location labels. PropertyPicker accepts independent PropertyOption labels/IDs and the frozen search form serializes the selected canonical slug without requiring a PMS mapping.

## Correction and exact application files

- `src/app/dev/demo/page.tsx`: replace the detail-repository option source with `demoBookingOptions(content)` from the same collection rendered on the homepage.
- `src/features/demo/booking-options.ts`: map that inventory to id, slug, name and the identical Brand Collection location label. No duplicate hardcoded inventory or availability fields.
- `src/features/demo/booking-options.test.ts`: complete six-property inventory, label parity, canonical search filters and All Properties regression.

No core 02.1 files, dates, guest logic, search/PMS contracts or provider catalogue changed. The existing homepage overlay boundary from the preceding P0 fix already removes hero clipping, measures actual panel size, flips above/below, clamps to the viewport and enables internal scrolling. No additional positioning/CSS/z-index patch was necessary for seven choices.

## Review screenshots

- [Desktop, all seven choices](1440x900-hero-dropdown.png)
- [Desktop sticky](1440x900-sticky-dropdown.png)
- [Tablet](768x900-hero-dropdown.png)
- [Mobile, list start](390x844-hero-dropdown.png)
- [Mobile, last choice reachable](390x844-hero-dropdown-bottom.png)
- [Mobile sticky](390x844-sticky-dropdown-bottom.png)
- [Short desktop, scrollable list](1440x500-sticky-dropdown-bottom.png)

## Integrity

All six properties can be chosen as search scope. This does not register them with a provider or promise availability/rates. Search contracts remain unchanged; no fake booking data is added. The Nắng Suites detail route remains `/dev/stays/the-nang-suites`.

Local demo: http://localhost:3400/dev/demo. Existing uncommitted work and ignored images retained. No reset, clean, stash, branch switch, commit, push, merge or deployment. Stop for visual review.
