# Hợp tác cùng VNest — homepage integration and dedicated partner page (9/11/2026)

Status: **built as a private preview, awaiting the owner's visual acceptance.**
- Not published, not indexed, not staged or committed.
- The GitHub Desktop stash and the 21 staged files are untouched.

| What | Local URL (dev server, `vnest-v2-client-preview-dev`) |
|---|---|
| Homepage, Concept B in place | http://localhost:3401/dev/demo?intro=0#hop-tac |
| Partner page | http://localhost:3401/dev/demo/hop-tac |
| English | add `?lang=en` (or use the VI / EN switch) |

The partner page sits under the demo homepage, `/dev/demo/hop-tac`, because the homepage itself is still a private
preview (`/dev/demo`; `/` is the Phase 01 placeholder). Its planned public address is `/hop-tac` (HANDOFF.md).

It is guarded three ways:
- It answers 404 unless the server is the declared local preview (`reviewAccess`).
- It is `noindex` (page metadata and the proxy's `X-Robots-Tag`).
- robots.txt disallows everything on this environment.

## 1. Homepage: Concept B (client decision)

The three-card Services section is replaced by the Visual Accordion (Concept B of the 8/11 exploration), unchanged
apart from the alignment polish below. It keeps:
- the three rows;
- the visuals: photo n° 16, the planning sheet, and the Bare + Pepper House + VNest composition;
- the client's 05.11 copy in both languages;
- open and closed states, keyboard (Enter, Space, Tab) and touch;
- each row's consultation CTA, which chooses its service in the form, keeps `?dich-vu=` and scrolls to `#tu-van`.

The FAQ, contact block and form below it are unchanged.

**Alignment polish.** The trigger row and the open content now share one column template (`--index`, `--toggle`,
`--gap` in `ServiceAccordion.module.css`). There are no offsets or transforms.
- The visual's left edge sits on the index column (01/02/03).
- The description starts on the card line's column (under the name on phones and tablets).
- The CTA starts on that same column.

QA measures all three at every width and service; each is within 1 px.

**Section-level link** after the rows: "Tìm hiểu thêm về hợp tác ↗" / "Explore partnership opportunities ↗", leading to
the partner page in the same language.
- It is an underlined olive text link on the description column, not a second filled button.
- There is one per section, not one per service.

## 2. The partner page

Order: Hero → Services → Why VNest → How it works → Brands → FAQ → Contact → Form. One `h1`, an `h2` per section and
`h3`s within. Everything except the form's behaviour is rendered on the server.

| # | Section | What it shows |
|---|---|---|
| 01 | Hero | Headline, supporting line, "Trao đổi về tài sản của bạn" (to the form). A photograph of Bare Chic Three (n° 3), credited "Bare Chic Three · TP. Hồ Chí Minh". An index of the three services (in-page links). |
| 02 | Services | Three chapters, visual and text side by side, alternating sides on desktop. Each has the index, the name (once), the client's card line as a lead, the full description, the client's three Key Highlights and one CTA that chooses the service in this page's form. Not a copy of the homepage accordion: the content is open, more spacious and grouped. |
| 03 | Why VNest | The page's one dark band. A photograph (Pepper House 3rd Floor, n° 15) and three verified points. Two are the client's FAQ 3 answer, one sentence each; one names the three brands and counts the stays and cities from the workbook records. Nothing else is claimed. |
| 04 | How it works | FAQ 6 as three numbered steps joined by a line (horizontal from tablet, vertical on phones). Space for owner and VNest responsibilities, models and revenue terms exists in the data and draws nothing while empty. |
| 05 | Brands | Bare Boutique Stays, The Nắng Suites and Pepper House. Each has a selected photograph, the official mark, its name, the client's positioning line, and its stays and cities from the records. Only Bare and Pepper House carry "Có mô hình nhượng quyền" (linking to service 03), and the client's card line for 03 closes the section. The Nắng Suites is shown as part of the family, never as a franchise offer, and no property is presented as a franchise project. |
| 06 | FAQ, contact, form | Client FAQs 2, 4 and 5; FAQs 3 and 6 are used above and FAQ 1 restates the services. VNest's contact card (hotline, email, address, Facebook). The homepage's own consultation form, which is still not connected: a valid request says "Chưa gửi…", never success. |

No icon grids, popups, scroll effects or counters. Motion is only the existing CTA arrow nudge, with none under reduced
motion.

## 3. Copy: approved and awaiting approval

| Kind | Where | Text |
|---|---|---|
| **Client, 05.11 Final (verbatim)** | Services | Names, sub-name, card lines, descriptions, Key Highlights |
| | Brands | Positioning lines |
| | FAQ | Questions 2, 4 and 5, with their answers |
| | Why VNest | Points 1 and 2: FAQ 3's two sentences |
| | Brands | The franchising note (03's card line) |
| **Client sentence, cut (needs VNest's OK)** | Why VNest | Point 2 drops FAQ 3's linking words "Song song đó," / "At the same time," |
| | How it works | The three steps split FAQ 6. The English is FAQ 6's English. The Vietnamese restates FAQ 6 clause by clause: "Bạn gửi thông tin cơ bản và nhu cầu của mình." / "VNest khảo sát tài sản và đánh giá thị trường xung quanh." / "VNest đề xuất mô hình và phạm vi công việc phù hợp." |
| **Approved UI, reused** | Services | Kicker and heading ("Ba cách VNest đồng hành cùng chủ tài sản.") |
| | Brands | Kicker "Hệ sinh thái lưu trú VNest", plus the "Nơi ở" and "Thành phố" labels |
| | FAQ | Kicker "Hỏi đáp" |
| | Form, contact, header, footer | As on the homepage |
| | CTA labels | Vietnamese CTA labels as approved |
| **Owner brief (proposed, not client copy)** | Hero, Vietnamese | "Hợp tác cùng VNest." / "Giải pháp quản lý, phát triển và vận hành không gian lưu trú dành cho chủ tài sản." / "Trao đổi về tài sản của bạn" |
| | Homepage link | "Tìm hiểu thêm về hợp tác" / "Explore partnership opportunities" |
| **Build-team DRAFT** | Hero | Kicker "Dành cho chủ tài sản" |
| | Hero, English | "Partner with VNest." / "Management, development and operation of hospitality spaces, for property owners." / "Talk to us about your property" |
| | Hero | "Ba dịch vụ" |
| | Services | "Trọng tâm" |
| | Why VNest | "Thế mạnh" / "Vì sao hợp tác cùng VNest?" |
| | Why VNest, point labels | "Giá và kênh bán theo thị trường", "Chất lượng vận hành, báo cáo định kỳ", "Hệ sinh thái VNest" |
| | Why VNest | Point 3's sentence pattern: "…: 6 nơi ở tại TP. Hồ Chí Minh và Đà Nẵng." |
| | How it works | "Cách hợp tác" / "Hợp tác bắt đầu từ một cuộc trao đổi." |
| | How it works | Step titles "Trao đổi nhu cầu", "Khảo sát và đánh giá", "Đề xuất mô hình" |
| | Brands | "Các thương hiệu trong hệ sinh thái VNest." and "Có mô hình nhượng quyền" |
| | FAQ | "Câu hỏi của chủ tài sản" |
| | All of the above | The English of every DRAFT label |
| | Photos | English alt text of the five new photographs |
| | Metadata | Page title and description |

All of it is in `src/features/partner/partner-page-content.ts`, marked by kind. A unit test keeps the page's own wording
free of digits, percentages, returns, guarantees, "experience" and "leading". QA scans the rendered page for
performance claims.

## 4. Remaining client content

- **Why VNest:** VNest's own strengths (they said they would send them). The subjects are listed in
  `PENDING_STRENGTHS`: team, track record or case studies, figures with a source, systems and channels, and owner
  reporting. Nothing is shown until VNest writes it.
- **How it works:** owner and VNest responsibilities, partnership models, operating responsibilities, and revenue or
  profit arrangements, if VNest wants them public (`PROCESS_DETAILS`, empty today).
- **Approval:**
  - of everything in the DRAFT and owner-brief rows above, in both languages;
  - of the two cut client sentences (FAQ 3, FAQ 6).
- **Photographs:**
  - confirm n° 3 (hero) and n° 15 (Why VNest), and n° 16 as the illustration of operations;
  - n° 3 carries Bare's own mark at its bottom right, as delivered. The hero frame shows it whole rather than cut; a
    clean copy or another photograph can replace it in one line.
- **Already open:** brand website URLs (none linked), publication approval of the 05.11 copy, and the form's lead
  channel and privacy notice (the form sends nothing).
- **Navigation:** whether the menu's "Hợp tác cùng VNest" and the footer's "Dịch vụ" should lead to this page instead
  of the homepage section. Unchanged until approved.

## 5. QA

`scripts/qa-partner-page.mjs` ran at 375, 390, 430, 768, 1024 and 1440 px, in Vietnamese and English: **312 passed,
0 failed** (`qa-results.txt`).

Homepage:
- Concept B is the section, with 01 open on arrival.
- Each service: the client's card line and description (read from the client document), one CTA leading to its
  service, one row open.
- The alignment of visual, description and CTA, within 1 px.
- No overflow and no clipped text.
- One section link, in the right language, styled as a link and aligned to the text column; it opens the partner page.
- A CTA chooses its service in the form, with the form in view.
- No console errors or hydration warnings.

Partner page:
- One `h1`, the sections in order, `noindex`, and the title in each language.
- No performance claims.
- Every service's card line, description and three highlights, matching the client document.
- One CTA per service, with the right address; no The Nắng Suites artwork in the services.
- Three strengths and three steps.
- Brands: positioning lines from the document; the franchise tag on Bare and Pepper House only; the 03 note.
- FAQ 2, 4 and 5 with their answers.
- One form, one hotline link and one email link in the page; every photograph has alt text.
- No overflow and no clipped text.
- The hero's service links reach each chapter.
- Each service CTA chooses its service and stays on the page; the hero CTA reaches the form; a valid request says
  "not sent".
- The language switch keeps the page and the chosen service.
- No console errors or hydration warnings.

Also:
- **Static checks and unit tests:** lint 0 errors (the 3 old warnings remain); `tsc` passes; unit tests 462/462,
  including the 8 new ones in `partner-page-content.test.ts`.
- **Production build:** `next build` succeeds and lists `/dev/demo/hop-tac`.
- **Existing browser tests, against this server:** homepage content 11/11, About 16/16, mobile interactions 16/16.
- **The dev server was restarted once.** Before the restart, 4 mobile tests failed because the server had been started
  before the Mac took its current LAN address (192.168.10.208), so it refused that origin. The same 16 tests pass after
  the restart.

**Test updates.** Two existing browser tests had selectors written for the old cards, and only those selectors changed,
because the client replaced the section:
- `homepage-content.test.mjs`: each row has its own region, closed regions are `inert`, the CTA is a link, and 02's
  drawing labels are decorative.
- `mobile-interactions.test.mjs`: the CTA is a link.

Their assertions (client text, one CTA, the service carried to the form) are unchanged.

## 6. Files

New:
- `src/features/partner/`
  - `ServiceAccordion.tsx`, `.module.css`: the approved accordion, moved from the exploration, with the alignment
    polish and the section link.
  - `ServiceVisual.tsx`, `.module.css`: moved, with a `notes` option.
  - `service-visuals.ts`, `selection-picture.ts`, `remember-service.ts`: moved and generalised.
  - `routes.ts`, `brand-family.ts`, `partner-page-content.ts` (+ `.test.ts`).
  - `page/PartnerPage.tsx`, `.module.css`, `page/ConsultLink.tsx`, `page/Picture.tsx`.
- `src/features/demo/Consultation.tsx`: the form, contact block and service hand-off, extracted from `OwnerJourney.tsx`
  without changes to what they show or do.
- `src/features/demo/OwnerFaq.tsx`: the FAQ list, extracted.
- `src/app/dev/demo/hop-tac/page.tsx`: the route.
- `docs/qa/partner-page-2026-11-09/`: this file, `HANDOFF.md`, `qa-results.txt`, `scripts/` and `screens/`.

Changed:
- `src/features/demo/OwnerJourney.tsx`: composes the accordion, FAQ, contact and form.
- `src/features/demo/OwnerJourney.module.css`: the old card rules removed.
- `src/app/dev/demo/page.tsx`: passes photo n° 16.
- Exploration previews (`src/app/dev/partner-concepts/a,b/page.tsx`, `src/features/partner-concepts/*`): imports and
  labels only. B's preview now shows the approved component.
- The two browser tests above.

Removed:
- `src/features/partner-concepts/PartnerAccordion.*` and `service-photo.ts` (moved, see above).

Not touched: booking and its providers (GoHost, ezCloud), Discovery, Coming Soon, Hero, About, the header, menu and
footer, and the proxy.

The other files that `git status` shows as changed are from earlier work.

## 7. Screenshots (`screens/`)

- **Homepage accordion:** `home-accordion-desktop-0{1,2,3}-*.png` (1440), `home-accordion-mobile-0{1,2,3}-*.png`
  (390 at 2x; the three side by side in `sheet-home-accordion-mobile.png`), `home-accordion-768-02.png`,
  `home-accordion-1024-03.png` and `home-accordion-desktop-en-01.png`.
- **Partner page, full:** `partner-page-desktop-full.png`, `partner-page-desktop-full-en.png` and
  `partner-page-mobile-full.png` (390 at 2x; also as four columns in `sheet-partner-page-mobile.png`).
- **Partner page, sections:** `partner-0{1..6}-*-desktop.png`, `partner-02-service-03-mobile.png` and
  `partner-05-brands-mobile.png`.
