# V3 Homepage: Three Brands, Partner with VNest, Six B2B FAQs (content and visual structure): Decision Record

Status: **OWNER-ACCEPTED on 5/11/2026. Content and approved visual structure FROZEN.** Any copy, structural or visual change
needs the owner's approval. **Final client publication approval is still pending** (§6).
Review packages: `docs/qa/homepage-content-final-2026-11-05/REVIEW.md` (05.11 Final copy) and
`docs/qa/homepage-content-2026-11-05/REVIEW.md` (first integration and field mapping).

## 1. Scope

Three existing sections of the V3 demo homepage (`/dev/demo`), in Vietnamese and in the private English preview
(`/dev/demo?lang=en`):

1. **Three Hospitality Brands** (`#thuong-hieu`): the brand index, its hover previews and the selected-brand panel.
2. **Partner with VNest, Three Services** (`#hop-tac`): three service cards and the shared expanded detail panel.
3. **Six B2B FAQs** (`#hoi-dap`): the one-open-at-a-time accordion.

About VNest, the hero, the property collection, booking, occupancy, property and room data, policies and the contact form are
outside this record.

## 2. Frozen content

The source of truth is the client document "Vnest Website Content - 05.11.2026_Final.docx". Its text is copied to
`docs/content/homepage-content-2026-11-05/vnest-website-content-2026-11-05-final.txt`; the 04.11 draft is history only.

| Field | Component | Code |
| --- | --- | --- |
| Brand Hover ×3 | Desktop hover/focus preview card | `src/features/demo/brand-copy.ts` (`BRAND_COPY.*.hover`) |
| Brand Positioning ×3 | Selected-brand panel, lead line | `BRAND_COPY.*.positioning` |
| Brand About ×3 | Selected-brand panel, paragraph | `BRAND_COPY.*.about` |
| Service Card ×3 | Service card line | `src/features/demo/owner-journey.ts` (`SERVICES[].line`) |
| Expanded Description ×3 | Shared detail panel | `SERVICES[].description` |
| Key Highlights ×9 | Detail panel list | `SERVICES[].highlights` |
| FAQ ×6 (questions and answers) | Accordion, client order | `OWNER_FAQ` |

Every field is the client's 05.11 wording, verbatim in both languages, with two approved brand-name exceptions
(`BRAND_NAME_NORMALISATION` in `brand-copy.ts`):
- "Vnest" is written **VNest**.
- "The Nang Suites" is written **The Nắng Suites**.

`src/features/demo/homepage-content.test.ts` enforces this against the document text.

**Section labels:** the Vietnamese headings, kickers and CTAs are the approved UI. Their English versions are the build team's
translations; they are part of this frozen structure but are not client copy.

## 3. Frozen visual structure

- **Brands:** a three-row ledger (logo, name, city) on the copper thread. Desktop has a hover/focus preview card (photo, logo,
  city, name, Hover line). The selected-brand panel shows photo, logo, name, cities, stays, Positioning, About, "Khám phá nơi
  ở" and Facebook. Below 1024 px a tap selects and the panel follows; there is no hover.
- **Services:** three equal cards (number, title, card line, chevron) acting as disclosures for one shared detail panel
  (title, description, three highlights, one service CTA to Contact). The panel opens full width under the row on desktop and
  under the chosen card on phones.
- **FAQs:** a heading column and a six-item native `details`/`summary` accordion, one open at a time, the first open on load.
- The draft-status notes under the Services and FAQ titles are removed (kept in QA documentation).
- Spacing, typography and colours as on 5/11/2026. Screenshots: `docs/qa/homepage-content-final-2026-11-05/screens/`.

## 4. Content rules carried with the freeze

- FAQ 5's room/space sizes (Bare 15–35 m², Pepper House from 35 m²) are shown as written. No guest capacity is derived from
  them.
- The franchising model: brand rights always come with direct VNest management; no standalone licence.
- The removed claims (Bare franchise experience; Pepper House's years of operation; "five steps"; submitting "through the
  form") must not return. A unit test guards this.

## 5. QA evidence (5/11/2026)

| Check | Result |
| --- | --- |
| Unit (verbatim mapping, both languages, normalisation, removed claims, FAQ 5 sizes) | 426 pass; lint 0 errors; typecheck |
| Homepage content e2e, vi and en at 375 / 390 / 768 / 1440 (content, clipping, overflow, interactions) | 11/11 |
| Longest texts (hover in view, equal service cards, franchising detail, FAQ 5) | Fit; no copy shortened |
| Regressions (booking, mobile, About, occupancy, room selection) | 79/79 · 16/16 · 16/16 · 8/8 · 22/22 |
| Production build | PASS |

## 6. Open before public release (client review)

1. **English FAQ 1 is shorter than the Vietnamese.** The Vietnamese also mentions periodic reporting and operating plans.
2. **Document status.** The filename says "Final", but the header still reads "Nov 4, 2026 · Nội dung nháp bàn giao" (draft
   handoff).
3. **"The Nắng Suites" spelling.** The client's document writes "The Nang Suites"; the official brand spelling needs client
   confirmation.
4. **Final client publication approval** of the copy.

English remains a private preview (`site.enabledLocales` is Vietnamese only). Nothing is committed or deployed.
