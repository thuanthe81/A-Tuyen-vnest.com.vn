# Final CEO demo polish — completed 23 October 2026

IN REVIEW for visual acceptance. Desktop Brand Collection direction is owner-approved and unchanged. No freeze, commit, push, merge or deployment.

Demo: http://localhost:3400/dev/demo

## Completed

- Resolved Nắng photography: checked actual v2 workbook hyperlinks and all four corresponding Drive folders. Retrieved four original candidates with provenance; selected Green River `3.png`, verified by workbook mapping, matching room-folder title and Nắng watermark. This one photo now replaces Nắng placeholders in the selected showcase, all-brands showcase and property card. The photo containing people stays excluded. Full evidence: [PHOTOGRAPHY.md](PHOTOGRAPHY.md), [source-record.json](source-record.json).
- Added responsive AVIF/WebP/JPEG derivatives, without upscaling. Original assets remain unchanged and ignored; all 22 pre-existing manifest entries are identical to their pre-edit values. The new demo-specific mapping requires the exact Drive ID and SHA-256, and leaves exploration routes and existing photo safeguards untouched.
- About: retained the requested editorial headline/lead, three-brand portfolio, approved local imagery and composition; removed the secondary philosophy paragraph for brevity.
- Partner: retained the olive B2B composition, requested headline/lead and working same-page CTA. Secondary copy now identifies the owner audience and scope requiring agreement, without implied operational guarantees or an unverified catalogue. Detailed management scope is explicitly pending VNest confirmation.
- Preserved the hero, logos/timeline/counts, filters, header/menu, frozen booking source, public-price safeguards, Bare Chic/drawer, City Notes and noninteractive social placeholders. No Nắng detail page or colour system.

## Screenshots

| View | Desktop 1440 | Mobile 390 |
|---|---|---|
| Nắng selected | [Screenshot](1440-nang.png) | [Screenshot](390-nang.png) |
| All brands | [Screenshot](1440-all.png) | [Screenshot](390-all.png) |
| About, full section | [Screenshot](1440-about-full.png) | [Screenshot](390-about-full.png) |
| Partner, full section | [Screenshot](1440-partner-full.png) | [Screenshot](390-partner-full.png) |

Also checked at 768px. Rendered captures reviewed for photo attribution, responsive composition, readable text and overflow. Source watermarks remain intact in originals and derivatives; showcase crops follow the existing cover behaviour.

## Validation

- `npm run check`: typecheck pass; 290/290 tests pass; lint zero errors, three pre-existing warnings in older QA scripts.
- `npm run build`: pass. Final lint: same three warnings, zero errors.
- `journey.mjs` / `results.json`: at 1440, 390 and 768, menu focus/close, all section links, Partner CTA → contact, Bare Chic same-tab navigation, gallery, room gallery, drawer/date handoff, City Notes and return-home passed. No console errors, failed requests, broken images, horizontal overflow, held-photo exposure or public price figures.
- `capture.mjs` / `capture.json`: two loaded Nắng image instances (showcase/card) in both all-brand and selected states at all three sizes; About/Partner images load, no horizontal overflow.
- Added two mapping tests covering swapped/missing/unverified source rejection and isolation to the Nắng property.
- Frozen Section 02.1 has no source diff.

## Remaining limits

No blocker remains for this requested polish. Bare Hàn retains its intentional photo placeholder; Nắng has no detail page by instruction. Existing booking-provider and official contact-channel gaps remain demo limitations. This work stays local and awaits visual acceptance.
