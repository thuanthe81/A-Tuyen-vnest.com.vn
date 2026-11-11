# Homepage content completion (5/11/2026)

Status: SUPERSEDED by the 05.11 Final copy, which was owner-accepted and frozen on 5/11/2026 (`docs/decisions/v3-homepage-content-brands-services-faq.md`). Kept for the field mapping and history. Production build on `vnest-v3-qa`:
Vietnamese http://localhost:3402/dev/demo · English (private preview) http://localhost:3402/dev/demo?lang=en

Source: client document "Vnest Website Content -04.11.2026.docx" (marked by the client "Nội dung nháp bàn giao", a draft
handoff). A plain-text copy is kept at `docs/content/homepage-content-2026-11-04/vnest-website-content-2026-11-04.txt`.
The unit and browser checks read their expected text from that copy, not from the code.

Scope kept to three existing homepage areas. No new page or section; layout, photos, card visuals and interactions are
unchanged. About VNest, hero, booking bar and booking logic, property and room content were not touched.

## 1. Field → component mapping

All client text is copied verbatim (Vietnamese from section A, English from section B), with two brand-name corrections
(§3). No English was machine-translated where the client supplied it.

### Part 1 — Three Hospitality Brands → Brand index `#thuong-hieu` (`HomeCollection.tsx`, copy in `brand-copy.ts`)

| Document field | Component | Where it shows |
| --- | --- | --- |
| Brand Hover (×3) | Desktop preview card (`.previewIntro`) | Hover or keyboard focus on a non-selected brand row, ≥ 1024 px. Replaces the DRAFT preview line. |
| Brand Positioning (×3) | About panel lead (`.panelLead`) | Selected brand's panel, every width. Replaces the DRAFT one-liner. |
| Brand About (×3) | About panel paragraph (`.panelAbout`) | Same panel, every width. Replaces the DRAFT paragraph. |
| Heading descriptors ("Adventurous Boutique Stays", "Comfortable Co-living", "Urban Living Collection") | Not placed | The existing UI has no slot for them. Adding one would add text to the cards. Owner decision (§4). |

Mobile and tablet (no hover): one tap on a brand opens its panel with Positioning and the full About, so every reader gets the
description. The Hover line is a short desktop teaser of the same idea.

### Part 2 — Three Vnest Services → Partner with VNest `#hop-tac` (`OwnerJourney.tsx`, copy in `owner-journey.ts`)

| Document field | Component |
| --- | --- |
| Service heading (EN: Hospitality Management / Project Development — Business Model Consulting / Brand Franchising) | Card title. Vietnamese keeps the CEO's official titles, which match the document. "Project Development (Business Model Consulting)" uses the existing title + sub pattern. |
| Service Card (×3) | Card line (`.cardLine`), replacing the old short lines. |
| Expanded Description (×3) | Shared detail region paragraph, replacing the DRAFT description. |
| Key Highlights (3 × 3) | The detail region's three-item list, now labelled "Điểm nổi bật" / "Key highlights", replacing the DRAFT items. |

Removed with the placeholders: the two old scope notes ("Không bao gồm thiết kế, thi công…" and "Thương hiệu áp dụng… chưa công
bố"). The client's text now states the scope itself and differs from them: Vnest *can introduce* design and construction
partners, and the franchise brands are named.

### Part 3 — Six FAQs → FAQ `#hoi-dap` (`OwnerJourney.tsx`, copy in `owner-journey.ts`)

| # | Question (vi / en) | Component |
| --- | --- | --- |
| 1 | Vnest cung cấp những dịch vụ gì… / What services does Vnest offer property owners? | `details` 1 (open by default) |
| 2 | …những loại hình bất động sản nào? / What types of property does Vnest manage? | `details` 2 |
| 3 | …gia tăng hiệu quả kinh doanh… / How does working with Vnest improve… | `details` 3 |
| 4 | …khi tôi chưa bắt đầu kinh doanh lưu trú? / How can Vnest help if I haven't started… | `details` 4 |
| 5 | Nhượng quyền Bare Boutique Stays và Pepper House… / How does franchising… work? | `details` 5 |
| 6 | Quy trình hợp tác… / What does the process of working with Vnest look like? | `details` 6 |

Client order kept; full answers; the one-open-at-a-time native `details`/`summary` accordion is unchanged.

## 2. Bilingual integration

- All client copy is `LocalizedText` resolved with the existing `resolveLocalized`. The three sections take the same `locale`
  as About VNest (`?lang=en` on `/dev/demo`; `site.enabledLocales` is still Vietnamese only) and carry `lang="vi|en"`.
- **Build-team DRAFT English (not in the document, needs approval):** the sections' own labels, i.e. the brand index kicker,
  title, "See all stays", "City", "Stays", "Explore stays", the preview hint and image alt; city names (Ho Chi Minh City, Da Nang);
  the services kicker and title, the three CTA labels ("Ask about hospitality management", "Ask about business model consulting",
  "Learn about brand franchising") and "Key highlights"; the FAQ kicker and title ("FAQ", "Frequently asked questions").
- Still Vietnamese in the English preview (outside this pass): header, hero, property grid, Contact form, footer.
- **Draft status (internal; kept here, not on the page):** the Services and FAQ copy comes from VNest's document of
  4/11/2026, which the client marks as a draft handoff ("bản nháp bàn giao"), pending final approval. The dashed notes that
  said so under the Services and FAQ titles were removed from the page on 5/11/2026 at the owner's request.

## 3. Brand-name consistency (owner decision, 5/11/2026)

Canonical brand names, in both languages: **VNest**, **The Nắng Suites**, **Bare Boutique Stays**, **Pepper House**.
In the integrated homepage content, two spellings in the client document are normalised. These are brand-name
corrections, not content rewrites; no other word was changed.

| Document | Website | Where |
| --- | --- | --- |
| Vnest | VNest | Services (descriptions, card line, highlight), FAQ questions and answers, "Brand Franchising + VNest Management" |
| The Nang Suites | The Nắng Suites | The Nắng brand About paragraph (vi and en) |

- **Exceptions to verbatim matching:** these two substitutions are the only ones. They live in one list,
  `BRAND_NAME_NORMALISATION` in `src/features/demo/brand-copy.ts`. The content tests apply exactly that list to the document
  text before comparing (the browser test mirrors it). A unit test confirms that the copy no longer contains either old spelling,
  that the source does contain them, and that reversing the two substitutions gives back the document text unchanged.
  The browser test checks that neither old spelling appears on the page in either language.
- Bare Boutique Stays and Pepper House already matched the document. Property names, URLs and slugs (for example
  `the-nang-suites`, `the-nang`) are unchanged.
- **Open before publication:** the official spelling of "The Nắng Suites" (with or without diacritics) still needs the
  client's confirmation. The client's own document writes "The Nang Suites".

## 4. Other flags for review (not changed)

1. **Brand descriptors** (Adventurous Boutique Stays, etc.) are not placed (see §1).
2. **FAQ 6 refers to "the form".** The Contact form is still a mock that sends nothing.

## 5. QA (production build, 5/11/2026)

| Check | Result |
| --- | --- |
| Unit: every brand, service and FAQ field matches the document (after the two brand-name corrections only), under the right heading and label, in the right language section; FAQ order; no placeholder left; English complete with no Vietnamese; brand-name normalisation checked (`homepage-content.test.ts`) | PASS (6 new) |
| Browser, vi and en at 375 / 390 / 768 / 1440 (`test/e2e/homepage-content.test.mjs`, expected text read from the document): each brand tab shows its Positioning and About; desktop hover shows the Hover line; each service card shows its line and opens its description and three highlights; the open card closes on a second press; six FAQs in order with full answers, one open at a time, Enter opens and closes; `lang` set; no "Vnest" / "The Nang Suites" on the page; no page or in-section overflow, no clipped text; no console errors | PASS (11/11) |
| Default page is Vietnamese; section anchors unchanged; the service CTA still carries the service to Contact | PASS |
| Regressions: hybrid booking e2e · mobile interactions · About VNest | 79/79 · 16/16 · 16/16 |
| `npm run check`: lint 0 errors (3 old warnings in `docs/qa` scripts), typecheck, unit tests | PASS (409) |
| Production build | PASS |

Screenshots (`screens/`): `brands-{vi,en}-{375,390,768,1440}.png`, `brands-{vi,en}-1440-hover.png` (preview card),
`services-{vi,en}-*.png` (first service open), `faq-{vi,en}-*.png` (first question open).

## 6. Files changed

`src/features/demo/brand-copy.ts` (new), `src/features/demo/HomeCollection.tsx`, `src/features/demo/owner-journey.ts`,
`src/features/demo/OwnerJourney.tsx`, `src/features/demo/OwnerJourney.module.css` (unused scope style removed),
`src/app/dev/demo/page.tsx` (locale passed to the three sections), `src/features/demo/homepage-content.test.ts` (new),
`src/features/demo/owner-journey.test.ts`, `src/features/demo/mobile-interactions.test.ts`, `test/e2e/homepage-content.test.mjs`
(new), `docs/content/homepage-content-2026-11-04/` (document text), this folder.
Nothing staged, committed, pushed or deployed.
