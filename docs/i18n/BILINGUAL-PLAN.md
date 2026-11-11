# VNest V3: complete bilingual experience and VI | EN switcher. Audit and plan

Status: **PLAN APPROVED by the owner, 6/11/2026.** Decisions: (2) Back returns to the previous page in the chosen language;
(3) the build team drafts English for VNest's Vietnamese property content, marked for VNest approval; (4) phase by phase,
reviewed after each. Phase A in progress.

## 1. Audit: what exists

| Area | Finding |
| --- | --- |
| Localization model | `src/domain/locale.ts`: `LOCALES = ["vi", "en"]`, `LocalizedText {{ vi, en? }}`, `resolveLocalized`, `missingTranslations`. Property records resolve to one language before rendering. This is the architecture to extend; no second system. |
| Release gates | `site.enabledLocales = ["vi"]`. Each property also has `approvedLocales: ["vi"]`, and a language is served only where both allow it. |
| SEO plumbing | `buildMetadata` already emits a canonical per locale and hreflang alternates when a page has more than one complete locale. All `/dev/*` routes are noindex. The sitemap lists Vietnamese only. |
| Locale routing | None. There is no `/en` route and no `[lang]` segment; `<html lang>` is fixed to `vi` in `src/app/layout.tsx`. |
| Current English | Only `?lang=en` on `/dev/demo`, prop-drilled, covering four homepage sections (Brands, About, Services, FAQs). The 05.11 client copy for Brands, Services and FAQs is frozen. |
| Proxy | `src/proxy.ts` only sets the indexing header; it runs on every request. |

### Remaining Vietnamese in the supported flow

(Approximate counts from a scan of string literals and JSX text.)

| Surface | Main files | ≈ strings |
| --- | --- | --- |
| Header, menu, footer | `SiteHeader.tsx`, `DemoFooter.tsx` | 30 |
| Hero and discovery (property cards, filters) | `HomeSections.tsx`, `HomeCollection.tsx` (grid part), hero slides | 50 |
| Booking search bar and calendar (frozen 02.1) | `booking-search/copy.ts`, `format.ts` (dates, weekdays) | 50 |
| Occupancy field and messages | `occupancy-copy.ts`, `OccupancyPanel.tsx`, `booking-guidance.ts`, `booking-results-state.ts` | 30 |
| Property pages (six), room selection, drawers, gallery, location and policies | `PropertyRoomCollection.tsx`, `PropertyDetail.tsx`, `RoomDrawer.tsx`, `Lightbox.tsx`, `RoomCardCarousel.tsx`, `LocationAndPoliciesPanel.tsx`, `RelatedProperties.tsx`, `view.ts`, `location-travel.ts` | 130 |
| Results page, availability states, hand-off, booking step | `BookingResults.tsx`, `HybridResults.tsx`, `availability-view.ts`, `availability/copy.ts`, `dat-phong/page.tsx` | 200 |
| Contact form | `OwnerJourney.tsx` (contact part), `owner-journey.ts` (validation) | 25 |
| City Notes | `city-notes/*`, `vnest-workbook/city-notes.ts` | 25 |
| **UI subtotal** | | **≈ 540** |
| **Property content** (VNest's Vietnamese workbook: descriptions, room text, amenities, transport, guest groups, policies, nearby places, rates labels) | `vnest-workbook/details.ts`, `workbook.ts`, `records.ts`, `rates.ts`, `drafts/*/record.ts` | **≈ 300** |

There are also many internal labels (development pages, provenance notes, legacy sheets) that guests never see. They are out
of scope.

## 2. Proposed architecture (private preview now, public routes later)

1. **One locale per request.** On private `/dev/*` routes the language comes from `?lang=en`.
   - The proxy remembers the choice in a cookie. A later page opened without `lang` is redirected to carry it, so links and
     booking hand-offs keep the language without editing every link builder.
   - The proxy passes the locale to the server through a request header. Server pages read it with one helper;
     `<html lang>` follows it.
2. **Client side.** A small `LocaleProvider` / `useLocale()` gives client components the same locale. UI text lives in
   `LocalizedText` dictionaries next to each feature, the same pattern as `about-copy.ts` and `brand-copy.ts`, and is resolved
   with `resolveLocalized`.
3. **Switcher.** "VI | EN" in the header, with the active language marked (`aria-current`).
   - Placement: desktop beside BOOKING and Menu; on phones inside the header if it fits at 375 px, otherwise at the top of
     the menu.
   - Gate: shown only on private review routes until the release gate in §4 passes.
4. **State on switching.**
   - The URL already carries the booking state (property, dates, rooms, adults, room choices, results-page state), so it
     survives the switch.
   - Unsubmitted booking-bar fields are written into the URL at the moment of switching.
   - Switching *replaces* the history entry: language is a preference, not a step. Back then returns to the previous page in
     the chosen language, and refresh keeps it.
   - GoHost and ezCloud hand-off addresses are unchanged apart from carrying `lang`.
5. **Translations.**
   - The frozen 05.11 client copy (Brands, Services, FAQs) and the approved About copy are reused untouched.
   - Every other English string is a **build-team draft**. A script collects all of them into one review document,
     `docs/i18n/EN-TRANSLATION-SET.md`, as a VI → EN table per surface. A unit test enforces complete English, no Vietnamese
     left in English, and an unchanged frozen copy.
   - **Property content** is translated from VNest's own Vietnamese only, with no new amenities, policies, prices or claims.
     It goes into a separate table keyed to the workbook cell, so the verbatim Vietnamese snapshots stay untouched, and is
     marked for VNest approval per property.
   - `approvedLocales` stays `["vi"]` until VNest approves.

## 3. Recommended public bilingual structure (built only at release)

| Item | Recommendation |
| --- | --- |
| URLs | Vietnamese at the root (`/`, `/stays/bare-chic`), English under `/en` (`/en`, `/en/stays/bare-chic`). The slugs stay the same: the property names are brand names. |
| Implementation | A `[lang]` segment or explicit `/en` routes rendering the same components with the request locale. `?lang=` stays a preview-only mechanism. |
| Metadata | A localized title and description per page, `og:locale` `vi_VN` / `en_US`, and `<html lang>`. |
| Canonicals and hreflang | A self-canonical per language; `vi`, `en` and `x-default` (→ vi) alternates only for pages whose English is complete and approved. `buildMetadata` already supports this through `locales`. |
| Sitemap | Both language URLs with alternates, for approved pages only. |
| Booking and search URLs | Stay noindex (they depend on dates), canonical to the page without parameters. |
| Indexing gate | English pages stay noindex until `site.enabledLocales` includes `en` and each property's `approvedLocales` does. |

## 4. Release gate for the public switcher

The public switcher is enabled only when all of these hold:
- every user-facing page in the flow has complete English (the test passes with no exceptions);
- VNest has approved the UI translation set and each property's content translation;
- the `/en` routes and metadata exist;
- QA passes in both languages.

Until then the switcher exists only on the private review routes.

## 5. Proposed build order (each phase QA'd in vi and en at 375, 390, 768 and 1440)

| Phase | Content | Size |
| --- | --- | --- |
| A | Locale mechanism (proxy, header, provider), switcher, header and menu, hero, discovery, footer, booking bar and calendar, occupancy field, contact form; homepage fully English | ≈ 170 strings |
| B | The six property pages: room selection, drawers, gallery, location and policies, related properties, booking guidance and review | ≈ 150 strings |
| C | Results page, availability states, hand-off, booking step, City Notes | ≈ 220 strings |
| D | Property content translation (≈ 300 workbook strings across six properties), as drafts for VNest | largest |

Each phase ends with screenshots, the coverage report and a stop for your review, unless you prefer A–D in one pass with a
single review at the end.

## 6. Decisions needed from the owner

1. Approve the preview mechanism (`?lang=en` plus the remembered choice on private routes now; `/en` sub-path routes at
   release).
2. **Back after switching.** Recommended: return to the previous page in the chosen language. The alternative is to treat the
   switch as a history step, so Back undoes the switch.
3. **Property content.** May the build team draft English for VNest's Vietnamese property content (marked for VNest
   approval)? Otherwise the property pages stay partly Vietnamese in English until VNest supplies its own English.
4. **Review cadence.** Phase by phase (recommended), or all four phases before one review.
5. **Frozen 02.1 booking bar.** It is localized in wording only (layout unchanged); this brief lists it, so confirm that is
   intended.
