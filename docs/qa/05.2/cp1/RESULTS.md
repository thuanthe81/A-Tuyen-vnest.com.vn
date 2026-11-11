# 05.2 Bare Chic, checkpoint 1 (foundation and structure): results

Date: 19/10/2026. Status: **built, awaiting the owner's review.** Not approved, not frozen, nothing committed.

**Preview.** `http://localhost:3400/dev/stays/bare-chic` on the **`vnest-v2-client-preview`** launch configuration. It is a production build started with `DEPLOY_ENV=development CONTENT_SOURCE=client-draft BOOKING_PROVIDER=none`. Add `?checkIn=2026-12-10&checkOut=2026-12-12&adults=2` to see the room selection with dates.

**Evidence.** Screenshots and `results.json` in this folder, from [`../scripts/cp1.mjs`](../scripts/cp1.mjs).

## What was built

| Decision | Built |
|---|---|
| Shared workbook modules | `src/app/dev/brand-collection/client/{workbook,rates,sourced,media,location-evidence,pricing}.ts` moved to **`src/content/vnest-workbook/`**. The adapter's core became `records.ts` there; the Brand Collection keeps only its projection (`client/adapter.ts`, `client/photos.ts`). `BrandId` and `CityId` now live in `vnest-workbook/ids.ts`, and the Brand Collection's `data.ts` re-exports them (type only). The photo manifest reader moved to `photo-manifest.ts` |
| New workbook snapshot | `vnest-workbook/details.ts`: verbatim cells for amenities (F), transport (K), guest groups (M), the room sheet (B–F with its merges) and the nearby sheet. Generated from the workbook's XML. Readers in `property-details.ts`: a merged cell is reported as **shared**, with the rows it covers |
| **D2** rights value | `MediaRights` gains `client-supplied-pending` (`src/domain/media.ts`). The existing validation rejects it on an approved record (test added). Property-card stand-in labels do not apply to it. Documented in `CONTENT_MODEL.md` |
| Layout id | `living-frames` registered in `src/content/layouts.ts` |
| **D4** G3 photos | Authorisation recorded verbatim in `vnest-workbook/media.ts` (`G3_AUTHORISATION`). The pipeline (`docs/content/g2/fetch-photos.mjs`) now runs a fetch plan with one authorisation per set. Existing originals were re-verified by sha256 and kept. Five files fetched (below) |
| Draft record | `src/content/drafts/bare-chic/record.ts`: a `PropertyRecord` (source `client-supplied`, status `draft`, layout `living-frames`) with a parallel `trace` holding each value's cells, status and open question. **Passes the content gate with 0 issues.** It is not registered in `src/content/properties`, which production serves and which stays empty |
| **D1** content source | `CONTENT_SOURCE=client-draft` (`src/config/env.ts`, `src/server/services.ts`). It refuses to start on a preview or production deployment and is never indexable (tests). Launch configuration `vnest-v2-client-preview` added (port 3400) |
| Preview route | `/dev/stays/bare-chic` renders per request, `noindex`. Sections in `src/features/property-detail/` (`PropertyDetail.tsx`, `view.ts`) use domain types only |

## Content: what the page states and what it does not

**Stated:**

- **Name:** "Bare Chic", from B4, as a short name (Q13 open).
- **Brand:** Bare Boutique Stays.
- **Location label:** "TP.HCM · Quận 1", corroborated in G2.1.
- **Introduction:** sentences 2–3 of E4, verbatim. A tagline is pending (**new Q21**).
- **Rooms:** the four room names (C4–C7).
- **Shared room facts:** "Studio · 28 m² · 2 người lớn", **once, labelled as shared by the four rooms**. D4:D7 and E4:E7 are merged over the four rooms; the capacity cell F4:F25 covers all 22 rooms of all six properties.
- **Amenities:** five items with "VNest đang hoàn thiện danh sách" (the source ends in ",..").
- **Transport:** "Grab, đi bộ, xe bus".
- **Address:** the address with its ward as supplied, and the verified "Xem bản đồ" link.
- **Nearby:** 15 places in two groups, with their addresses and a note that the list covers the central TP.HCM properties and gives no distances.
- **Reference price (D3):** "Giá tham khảo 1,100,000", once, beside the CTA, private preview only.

**Not stated:**

- per-room size, type, capacity, bedding or description (Q10, Q11);
- amenity icons: the content model reserves icons for VNest's own choice, so none is guessed. This overrides the plan's "icons where the list has one";
- policies: a placeholder line instead (Q9);
- distances or walking times;
- live availability or any price from a provider;
- structured data (the record is a draft).

**Photographs.** Every photograph names its room in a caption, and alt text describes what it shows. The content gate refused the opening frames as the property **gallery**, because all are room photographs. That is the brief's own rule, so they are a `media` section of the record captioned "Ảnh: Bare Chic One và Bare Indochine", and the gallery stays empty. **Bare Chic has no photograph of the property as a whole** (no exterior, entrance or shared space).

## G3 photographs (private local review; never committed)

| Key | File (folder) | sha256 | Pixels | Use |
|---|---|---|---|---|
| `bare-chic-two-2-3` | 2.3.png (Bare Chic Two) | `ab95e66c…7293bd4` | 2048×1365 | Bare Chic Two block |
| `bare-chic-three-1-29` | 1.29.png (Bare Chic Three) | `ad61fd24…cd27b25` | 2048×1365 | Bare Chic Three block |
| `bare-indochine-53` | 53.png (Bare Indochine) | `cbfcf4f8…fe22685d` | 2048×1365 | Bare Indochine block |
| `bare-indochine-54` | 54.png (Bare Indochine) | `3e15fd4a…ac085f47` | 2048×1365 | Opening, supporting frame |
| `bare-chic-one-1-47` | 1.47.png (Bare Chic One) | `f47e2782…aa62ba95` | 2048×1365 | Opening, supporting frame |

Full hashes are in `docs/content/g2/media-record.json`.

- **Format:** all PNG with a fully opaque alpha channel (255/255), so flattening to JPEG loses nothing.
- **Watermarks:** every one carries Bare's watermark (top-left on 53.png, bottom-right on the others). Not edited.
- **Processing:** the two Bare Indochine photographs look heavily processed (HDR-like).
- **Rights:** `client-supplied-pending`.

## Checks

| Check | Result |
|---|---|
| Content gate | Bare Chic draft: 0 issues, with or without the local photographs (missing photographs become labelled placeholders) |
| Tests | `npm run check`: **245/245**; lint 0 errors (3 earlier warnings in QA scripts); typecheck clean. New tests cover the draft record (provenance, no per-room facts, shared facts, verbatim intro, no icons, no distances, photos named by room, not served by production), the content source (local-only, never indexable), and availability (Bare Chic known and "not-configured"; mock content not served alongside) |
| First screen | "Xem phòng trống" is in the first screen at 390 (top 741 of 844), 768 (914 of 1024) and 1440 (480 of 900). Its first version missed this at 390 and 768, so the hero was reordered: primary frame, identity and CTA, then the supporting frames |
| CTA | A plain `#rooms` link; after it, `location.hash` is `#rooms` and the dates stay in the address |
| Booking | Without dates, 02.2 shows "Chọn ngày để xem giá và tình trạng phòng". With dates, "Đặt phòng trực tuyến chưa sẵn sàng — Chưa có hệ thống đặt phòng nào được kết nối, nên không có thông tin phòng trống hay giá." The API answers `{"status":"error","reason":"not-configured"}` for `bare-chic`. Nothing is simulated |
| SEO | `noindex, nofollow`; no JSON-LD; one H1 "Bare Chic"; one `main` |
| Images | 13 rendered, all loaded and all with alt text. Only the primary frame loads eagerly from this layout (02.2's room cards load their first two eagerly, its own choice) |
| Layout | 0 px overflow at 390, 768 and 1440; no control under 44 px tall; no page errors |
| Booking contracts, 02.1, `/stays` routes | `git diff` of `src/features/booking-search`, `src/domain/{booking,ports,availability}.ts`, `src/integrations/booking`, `src/app/stays`: **empty** |
| Brand Collection prototypes | `/a`, `/a-original`, `/b`, `/b-original`: identical to the 16/10 baseline. One run showed 189 px on `a-original` at 1440; a re-capture showed 0, so it was a capture glitch |
| `b-client` | The layout is identical. Photograph pixels vary between capture runs, before and after the move alike (the same 415,880 px region at 768 flips both ways); every difference lies inside photo areas. The regression script now has `HIDE_IMAGES=1` (layout only). A layout baseline `cp1-layout-a` was taken twice with 0 differences, as the reference for checkpoint 2 |

## Known limitations at checkpoint 1

- **Structure, not design.** Plain styling. The Living Frames composition, the viewer and the persistent pill are checkpoint 2; compact room blocks are checkpoint 3; finished amenities, location and nearby are checkpoint 4.
- **Two headings for rooms.** "Các phòng" (this layout) and "Phòng" (02.2's own heading) both appear. To be resolved with the compact room blocks in checkpoint 3.
- **The criteria bar leaves the preview on search.** The frozen bar submits to `/stays?property=bare-chic`, which leads to the production route `/stays/bare-chic`. On the client-preview server that route now resolves the draft and draws it in the **baseline** layout. Integrating `living-frames` into `/stays/[property]` is the step after approval.
- **Photographs in the frames section repeat the opening frames.** There are six photographs in all; the curated Living Frames set is checkpoint 2.
