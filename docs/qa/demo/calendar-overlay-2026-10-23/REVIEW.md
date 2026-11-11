# Homepage calendar overlay — P0 visual review, 23 October 2026

Entry: http://localhost:3400/dev/demo

## Root cause, measured before changes

The calendar is an absolutely positioned `div[role=dialog]` inside the frozen BookingBar form, not a portal. The homepage hero had `overflow: clip`. At 1440×1400, the bar's existing placement logic correctly chose below: panel y=851–1304, hero y=65–897. Everything below y=897 was clipped, including the last dates; `elementFromPoint` could not hit the last date. Its existing z-50 cannot override ancestor clipping. At 1440×900 it chose above and fit, explaining why the failure depended on viewport height. See before.json and before-1400.png.

The frozen component uses estimated panel heights and computes placement when opening; only the property list had a height bound. A homepage integration guard now measures actual panel dimensions and updates on resize/scroll/content-size changes, including visual-viewport changes.

## Exact implementation files

1. `src/features/demo/Demo.module.css`: hero overflow visible; booking slot positioned at z-index 1, above hero decoration and ordinary following content, below existing global overlays. Media remains in its existing inset box; no bar styling changed.
2. `src/features/demo/HomepageBookingOverlays.tsx`: new homepage-only layout boundary. Fits inline search dialogs above/below their anchor and within viewport margins. Short viewports scroll within the panel. Keeps panels in the original form so outside-click, keyboard bubbling, focus and date/guest handlers stay intact. Native full-screen mobile dialogs are untouched. No dependencies.
3. `src/app/dev/demo/page.tsx`: places that boundary around the homepage integration with `display: contents`, adding no layout box.

No Section 02.1 files, search state, selection logic, contracts, property pages, Brand Collection, About or Partner were edited. Existing uncommitted source and ignored client media preserved. No commit, push, merge, deployment, branch switch, reset, clean or stash.

## Screenshots

- [Desktop: complete below-bar calendar across the former clipping boundary](1440x1400-hero-calendar.png)
- [Desktop: above-bar placement](1440x900-hero-calendar.png)
- [Desktop: sticky calendar](1440x900-sticky-calendar.png)
- [Tablet: hero](768x900-hero-calendar.png), [sticky](768x900-sticky-calendar.png)
- [Mobile: hero](390x844-hero-calendar.png), [sticky](390x844-sticky-calendar.png)

Mobile testing is Chrome browser emulation, not physical iOS Safari. The existing native mobile dialog fills the viewport and scrolls between months; outside-click dismissal is not applicable because there is no outside area. Escape/close/reopen and retained dates are tested.

## Validation evidence

`check.log`: lint/typecheck and 292 tests pass. Three existing lint warnings in older QA scripts; no errors. `build.log`: production build passes. `results.json`: geometry, visible date hit-testing, month navigation (scroll on mobile), actual check-in/check-out clicks, selection persistence on reopen, keyboard arrows/Escape, and outside dismissal for inline desktop/tablet panels. Each viewport exercises hero and sticky states, with additional tall/short desktop cases. Sticky tests scroll through the hero boundary as a user would before scrolling past it.

`extra.json` records resize/scroll positioning and guest increment checks. Review status: awaiting owner visual review; not frozen.
