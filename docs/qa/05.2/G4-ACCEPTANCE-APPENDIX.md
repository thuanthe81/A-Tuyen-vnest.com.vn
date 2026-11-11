# 05.2 Bare Chic, G4: acceptance appendix

Date: 20/10/2026.

**Owner's decision, 20/10/2026:** "APPROVED AS DESIGN DIRECTION, NOT FROZEN OR PRODUCTION-APPROVED." The direction to preserve covers:
- the hero collage;
- the 19-photo gallery structure;
- room-specific gallery navigation;
- the amenities presentation;
- the room-card hierarchy;
- "Khám phá các loại phòng".

None of the four checkpoint-1 departures is approved by this decision (§3). Nothing is committed, pushed, merged, deployed or frozen.

**Evidence.**
- `g4-acceptance/` from [`scripts/g4-acceptance.mjs`](scripts/g4-acceptance.mjs).
- `v2-g4/` from [`scripts/v2-refine.mjs`](scripts/v2-refine.mjs).
- G4 provenance in [`v2-refine/RESULTS.md`](v2-refine/RESULTS.md) § G4.

---

## 1. Source-to-gallery coverage

The Drive folders were listed again on 20/10, as metadata only (names, ids, sizes; nothing downloaded). They are **unchanged since 15/10**: no file added, none removed.

| Room folder (cell) | Source files | Of which in two folders | Unique, room-attributable | Integrated | Omitted |
|---|---|---|---|---|---|
| Bare Chic One (D4) | 6: 1.11, 1.42, 1.47, 1.55, 1.56, 1.59 | 1.56, 1.59 (also in Three) | 4 | **4**: 1.55, 1.11, 1.42, 1.47 | 1.56, 1.59 |
| Bare Chic Two (D5) | 6: 2.3, 2.4, 2.5, 2.9, 2.10, 2.32 | — | 6 | **6**: 2.3, 2.10, 2.4, 2.5, 2.9, 2.32 | — |
| Bare Chic Three (D6) | 6: 1.18, 1.27, 1.29, 1.56, 1.57, 1.59 | 1.56, 1.59 (also in One) | 4 | **4**: 1.57, 1.18, 1.29, 1.27 | 1.56, 1.59 |
| Bare Indochine (D7) | 5: 50, 51, 52, 53, 54 | — | 5 | **5**: 50, 51, 52, 53, 54 | — |
| **Total** | **23 files** | 4 files: 2 pictures, each in both folders | **19** attributable + **2** of unknown room = **21 unique pictures** | **19** | **4 files (2 pictures)** |

**Notes.**
- **Duplicates.** "Unique" counts 1.56 and 1.59 once each, because their copies in One and Three have the same names and byte sizes. They have different Drive file ids, and they are **not hash-verified**: that would need a download, which is not authorised. They stay out until VNest says which room they show (Q6).
- **Hashes.** All 19 integrated files have distinct sha256 hashes (`docs/content/g2/media-record.json`), so no picture is shown twice. Every one is read-only on disk, under `.local-media/` (git-ignored).
- **Attribution.** Each photograph is attributed by its Drive folder title, the only room evidence available. One case is worth a second look: 1.18.png (Three's folder) shows the same layout and sports-ground view as One's 1.55.png. The storeys share a design, so this is plausible, but it is not independently confirmed.
- **Not in this matrix.** These are rooms only. Bare Chic has **no photograph of the house as a whole** (facade, entrance, stairs, shared space), so the top gallery is labelled as a gallery of rooms (Q16).

## 2. Photographs containing people

| Source | Drive file id | sha256 of the original | What it shows | Q15 status | Public release |
|---|---|---|---|---|---|
| Bare Chic One / 1.11.png | `1wz8Pj30YbIFXTxmCf4d7OQWfuYAZduMy` | `a929f2da97f90f4202e1404744a80b63e2201363ab8840d7061e388e2eee8cbf` | A person seated by the window, reflected in the wall mirror | **Not granted**: no model release or usage rights on record | **Held** |
| Bare Chic Two / 2.32.png | `1F8898suE4nMMFs75dl8--b5dOL597Mae` | `73e431898b908f3c4c66b90280114e63266a5e30bfeac6e54b4cf66b8bf16a6c` | A person seated by the window, low light | **Not granted** | **Held** |
| Bare Chic Three / 1.18.png | `1weZPQ2CZkcMy9IZIxdi33oM63cDWyn6g` | `c3b76d798c3c1f2259e2d798bdaab97e46b213bf9f8c1c40b97017e175bd9592` | A person reclining on the window seat, reading | **Not granted** | **Held** |

**How the hold is enforced.**
- The hold is written into the data: `RELEASE_HOLDS` in `src/content/vnest-workbook/media.ts`, with id, hash, reason `person-visible`, question Q15 and authorisation `not-granted`.
- **`publicReleaseCandidates()`** builds any public-release image set from candidate keys. It returns nothing today, because no client photograph has public rights. Even when rights are granted for every photograph, it still removes these three until their own hold is lifted.
- A test pins all of this (`src/content/drafts/drafts.test.ts`).
- Independently:
  - every client photograph carries the rights value `client-supplied-pending`, which the content gate refuses on an approved record;
  - the files live only in git-ignored folders, so no deployment has them.
- In the private preview the three remain in their room galleries, as the approved direction shows. Their alt text says "một người" and never identifies anyone.

## 3. The four departures from checkpoint 1, with recommendations

None is approved by the G4 decision. Each recommendation below is mine; the decision is yours.

| # | Departure (checkpoint 1 → now) | Rationale | Impact | Reversible? | Required? | **Recommendation** |
|---|---|---|---|---|---|---|
| 1 | **Rooms: 02.2's room selection → this page's own room cards**, with a "not connected" line | 02.2 cannot show per-room galleries, reference prices or verified specifications without changing 02.2 (in review, out of scope). Showing both would list the rooms twice | No live availability or rate per room on this page; the 02.1 bar (frozen, unchanged) remains the way into booking | Yes: re-mount `PropertyRoomSelection` in `#rooms`; no data change | Not strictly | **Accept for the prototype, conditionally.** Keep the approved cards as the presentation. When a PMS is connected, bring 02.2's availability and rates **into these cards** as 02.2's planned compact variant (05.1 checkpoint 5), rather than placing a second list beside them. Record that as a 02.2 dependency |
| 2 | **"Giá tham khảo 1,100,000" beside the hero action (D3) → removed** | Under your rule of 20/10, a rate belongs only to its own row. L4 is Bare Chic One's, so a hero figure would read as the property's price | The price appears only on the Bare Chic One card, in the private preview | Yes, one line | Yes, as D3 was worded | **Accept the removal.** Revisit only if VNest answers Q24 ("one rate for all four rooms") **and** Q8 (publishable as a "from" price); until then a property-level figure would misstate the data |
| 3 | **Location: "TP.HCM · Quận 1", nearby list (15 places) and a policies placeholder → address, verified map and transport only** | Your 20/10 brief: verified address information only; no nearby claims without a per-property mapping; omit unconfirmed policies | Less local context on the page | Yes, each independently | Nearby and policies: **yes**, by the brief (Q28, Q25). "Quận 1": not strictly; it is corroborated by two independent sources, not invented | **Accept the omissions of nearby and policies.** Nearby context now belongs to City Notes, at city level (§6), not to "near this property" claims. **"Quận 1": keep it off** until VNest defines the area convention (Q20; districts were abolished in July 2025). **Then apply one rule to both surfaces**: today the Brand Collection card (`/b-client`) still shows "TP.HCM · Quận 1", which is inconsistent with this page. Changing the card is your call and is not done here |
| 4 | **Hero introduction: E4 sentences 2–3 → none (20/10 first build) → E4 sentence 3 (refinement)** | Avoid repeating the story; give one concise line under the name | The introduction is one sentence, verbatim; the rest of E4 follows without repeating it | Yes | — | **Accept the current state** (sentence 3, verbatim) until VNest supplies a tagline (Q21). Strictly, this is no longer a departure from checkpoint 1, which also had a verbatim excerpt; only the sentence chosen changed |

## 4. Gallery acceptance

Measured on the production build (`vnest-v2-client-preview`).
- 390 × 844 at 2× with touch emulation.
- 1440 × 900 with mouse and keyboard.
- Full results: `g4-acceptance/results.json`.

| Behaviour | 390 (touch) | 1440 (mouse, keyboard) |
|---|---|---|
| Swipe through the top gallery | **19 of 19 slides reached by touch swipes**; native scroll snapping | n/a (mosaic of 5 + "Xem tất cả 19 ảnh") |
| Image counter | "1/19" … "19/19", correct at every slide | n/a (no counter on the mosaic) |
| Room attribution | Every slide's room label matches its photograph's room (19 of 19). The sequence interleaves rooms: One, Two, Three, Indochine, … | Tiles: One, Two, Three, Indochine, One. Labels at the top, never covered |
| Open | Tap on slide 19 → viewer on that photograph: "Bare Chic Two 6/6", same room as the slide | Enter on the third tile → "Bare Chic Three 1/4"; a click on the large tile → "Bare Chic One 1/4" |
| Navigation | Swipe in the viewer: "Bare Chic Two 6/6" → "Bare Chic Three 1/4" → back to "Bare Chic Two 6/6" | ArrowLeft ×2: Three 1/4 → Two 6/6 → Two 5/6 (crosses rooms, counts within the room) |
| All photographs | Grid with 4 groups (One 4, Two 6, Three 4, Indochine 5) and 19 thumbnails | Same |
| Room galleries | Each card's "Xem ảnh phòng (n)" by tap: only that room, swiped through to n/n (4, 6, 4, 5) | Same counts (`v2-g4/`) |
| Close | The close button by tap: closed | Escape and the close button (click): closed |
| Focus restoration | To the slide that opened the viewer ("Xem ảnh 19/19 …"); to each room's button after its gallery | To the tile that opened it ("Xem ảnh 3/19 …", "Xem ảnh 1/19 …") |
| Page scroll | Locked while open, released on close | Same |
| Errors | 0 | 0 |

**Performance.**
- Throttled to slow 4G (150 ms, 1.6 Mbit/s down), cache disabled.
- CPU ×4 on the phone.
- Initial load, before any interaction.

| | 390 | 1440 |
|---|---|---|
| LCP (the first gallery photograph) | **1.36 s** | **1.08 s** |
| CLS | 0 | 0 |
| Load event | 2.26 s | 2.13 s |
| Images requested | 4 (104 KB) | 6 (76 KB) |
| Scripts | 10 files, 167 KB | same |
| HTML document | 14 KB | 14 KB |

Only the first photograph is eager. The others are lazy, and at 1440 the 14 photographs beyond the mosaic are not requested until the viewer opens. LCP is well inside the plan's 2.5 s budget.

**Not measured:**
- the script against the 05.1 shell baseline;
- a real device;
- Safari or VoiceOver. The touch tests are Chrome's emulation.

## 5. Production safety: QA warnings and unverified prices

**Finding (20/10).**
- `/dev/*` routes are built into every deployment, and nothing blocked them.
- The Bare Chic page treated any deployment that `env.ts` calls "development" as the private preview. That includes a production server started **without** `DEPLOY_ENV` ("unidentified").
- So such a host would have shown the review notice, the "Chờ VNest" notes and the workbook figures, under `noindex`.
- A declared production deployment would have shown the review notice and the draft content (without figures or notes).

**Fixed for the Bare Chic routes.**
- `src/features/property-detail/review-access.ts` makes `/dev/stays/bare-chic` and `/dev/stays/bare-chic-20-10` answer **404** unless `DEPLOY_ENV=development` is **declared**, as both local client-preview launch configurations do.
- The private preview, with figures and notes, needs the same condition.
- Tested in `review-access.test.ts` (refused cases):

| Deployment | Result |
|---|---|
| Production | 404, no private preview |
| Indexable production | 404, no private preview |
| Preview (`DEPLOY_ENV`) | 404, no private preview |
| Vercel preview | 404, no private preview |
| Unidentified server | 404, no private preview |

- A plain `npm run dev` (port 3200) no longer shows these two pages. Use `vnest-v2-client-preview` (3400) or `vnest-v2-client-preview-dev` (3401).

**Other safeguards that already held, and still do:**
- `CONTENT_SOURCE=client-draft` refuses to start on preview or production (`env.ts`). The draft record is never in `src/content/properties`, so production routes cannot serve it.
- In public mode the page states no figure and no "Chờ VNest" note. Checked at 390, 768 and 1440 with `?price=public`: 0 figures, 0 notes.
- The photographs are git-ignored and never deployed. Their rights value is refused on approved records.
- Every response is `noindex` unless production is indexable.

**Not fixed (outside this checkpoint's scope).**
- The same pattern exists in **`/dev/brand-collection/b-client`**: its private preview also keys on `deployEnv === "development"`, so an unidentified production host would show workbook figures there.
- Every other `/dev/*` route also ships in production builds.
- **Recommendation:** apply the same declared-development guard to `/b-client`, and decide whether all `/dev/*` routes should be 404 outside declared development (a one-place check in `src/proxy.ts`). Both need your approval: the first touches the Brand Collection, the second the site-wide proxy.

## 6. Checks for this appendix

| Command or check | Result |
|---|---|
| `npm run lint` | 0 errors (3 older warnings in QA scripts) |
| `npm run typecheck` | Clean |
| `npm test` | **261 of 261** |
| `npm run build` | Succeeds |
| `/a`, `/a-original`, `/b`, `/b-original` | 24 of 24 identical to the 20/10 baseline |
| `/b-client` (layout) | 6 of 6 identical |
| Git | Nothing staged; 0 client media files tracked |

**Files changed for this appendix:**
- `src/content/vnest-workbook/media.ts` (`RELEASE_HOLDS`, `publicReleaseCandidates`);
- `src/features/property-detail/review-access.ts` and its test (new);
- the two Bare Chic preview pages (`notFound()` guard);
- `src/content/drafts/drafts.test.ts`;
- `docs/qa/05.2/scripts/g4-acceptance.mjs` (new);
- this file.

The approved G4 sections are unchanged.
