# G2: client photography for `/dev/brand-collection/b-client`

Status 18/10/2026: **authorised, fetched, derived and integrated for private local review; awaiting the owner's review.** Nothing is committed, deployed or published. Originals and derivatives are git-ignored.

**Authorisation** (recorded in `client/media.ts`, `G2_AUTHORISATION`). The owner's message of 18/10/2026, quoted:

> "Authorised: VNest permits private local review (never committed, deployed or published) of the four G2 photos: Bare Chic 1.55.png, Bare Hyphen a-16.jpg, Bare Đa Kao Bare ĐaKao_28 (6).jpg, Pepper House 03.jpg. Granted by: [name, capacity], reference: [where recorded]."

The name, capacity and reference were left as placeholders in that message. They are recorded as blank and are **for the owner to complete**. The authorisation covers these four files and this use only.

## The four candidates

These come from the approved media mapping in `src/app/dev/brand-collection/client/media.ts` (`PRIMARY_IMAGES`).

| Property | Drive folder | File | Drive file id | Bytes |
|---|---|---|---|---|
| Bare Chic | Bare Chic One | `1.55.png` | `1-LBqLAjsV3lNI5Y-FA1t8DIEYbG4hKKh` | 3,635,039 |
| Bare Hyphen | Bare Hyphen One | `a-16.jpg` | `10GZwC3dwPRjDFabf469USnJ_JZ4TXKI0` | 1,921,051 |
| Bare Đa Kao | Bare Đa Kao One | `Bare ĐaKao_28 (6).jpg` | `1Jdnn7yNc5cJISHoZ3JOCt3OiV7A_d-4A` | 2,262,885 |
| Pepper House | Pepper house 3rd-floor | `03.jpg` | `1XRJfeb0xCDizmjOw5A_idKnhkDjepTJ1` | 1,796,229 |

On 18/10, the check mode read the folder pages (metadata only). Drive still lists all four files with these names, ids and byte sizes.

**Rights status of all four:** `client-supplied-unconfirmed`. No photographer, credit line or licence has been stated (audit Q15).

Bare Hàn and The Nắng Suites keep their labelled placeholders. The code enforces this: a property whose photo folders conflict can never receive a photograph, even if a manifest lists one.

## What is in place

| Piece | What it does |
|---|---|
| `client/media.ts`, `G2_AUTHORISATION` | The one place an authorisation is recorded: who granted it, in what capacity, the date, the scope (`private-local-review` only), where it is written down, and the Drive file ids it covers. **Currently `null`** |
| `fetch-photos.mjs` (this folder) | **Check** (default): gate status, the plan, and a re-check of Drive metadata. **`--fetch`**: refuses unless the authorisation covers each file. It downloads the four primaries only; a download is accepted only if its byte size equals the recorded size and it decodes as an image, and it is held in memory until then. Originals go to `.local-media/client-photos/originals/`, read-only, never overwritten or modified. Writes `media-record.json` (sha256, pixel size, format, alpha, ICC, provenance, authorisation). **`--derive`**: re-checks each original's sha256, then writes AVIF, WebP and JPEG at 480, 800, 1200 and 1600 px wide (never upscaled; sRGB; EXIF orientation applied) plus `manifest.json` to `public/dev-client-media/` |
| `.gitignore` | `/.local-media/` and `/public/dev-client-media/`: originals and derivatives can never be committed |
| `client/photos.ts` | Server-side reader. A property gets its photograph only if all hold: an authorisation is recorded and covers the file; the manifest's file is that property's proposed primary; and its photo folders are not in conflict. Without a manifest nothing changes, so a fresh clone still renders |
| `shared.tsx`, `PropertyPicture` | Draws a photograph as `<picture>`: AVIF, then WebP, then JPEG `srcset`. `sizes` is `(min-width: 64rem) 24rem, 50vw` for cards and `(min-width: 64rem) 46rem, 100vw` for stage slices. Cards use `loading="lazy"` and `decoding="async"`. `alt=""` as before, since the name follows in text. Per-image crop through `OBJECT_POSITION` in `photos.ts`. The `<picture>` wrapper is `display: contents`, so the `<img>` takes exactly the box of today's placeholder: no change to the card or the stage |
| `b-client/page.tsx` | Applies photographs only in the private local preview (development, non-indexable build) |

**Verified 18/10 with nothing authorised:**

- `--fetch` and `--derive` refuse (exit 2); neither storage folder exists.
- The page renders no `<picture>`.
- `b-client` is pixel-identical to the morning's capture (6/6), and `/a`, `/a-original`, `/b` and `/b-original` to the 16/10 baseline (24/24).
- `npm run check`: 230/230 tests, including 6 for the photo gate on a synthetic manifest; lint 0 errors.
- The production build compiles.

## Done, 18/10/2026

1. Authorisation recorded, quoted verbatim.
2. `--fetch`: four originals downloaded, each matching its recorded byte size. All four are 2048×1365 (3:2) and sRGB. Bare Chic is a PNG with an alpha channel that is fully opaque (min = max = 255), so flattening to JPEG loses nothing. Stored read-only in `.local-media/client-photos/originals/`.
3. `--derive`: 48 files (4 widths × 3 formats × 4 photos) in `public/dev-client-media/`, plus `manifest.json`. At 800 px: AVIF 20–27 KB, WebP 26–38 KB, JPEG 44–59 KB.
4. Provenance in [`media-record.json`](media-record.json):

| Property | File | sha256 | Pixels | Format |
|---|---|---|---|---|
| Bare Chic | `1.55.png` | `4f9e82875a37f8244187b55806d90a814169eedb1653676e8e8e4453471f5155` | 2048×1365 | PNG, alpha (opaque) |
| Bare Hyphen | `a-16.jpg` | `48a4dd86c9818e081c3c93f14b34a92dc249178848aa15b16c3cba70b8722d90` | 2048×1365 | JPEG |
| Bare Đa Kao | `Bare ĐaKao_28 (6).jpg` | `fe3ad0dc790d7164ee3fba09d0474bd6e569a93a20cae80ff9ef7957c0a3f26d` | 2048×1365 | JPEG |
| Pepper House | `03.jpg` | `c1edf019938179033df3c1e7487bca8a0f8f780f39323371b838956d80c7efcd` | 2048×1365 | JPEG, sRGB profile |

**Rights:** still `client-supplied-unconfirmed`. No credit line or licence beyond this private review.

**Observed at full size:**

- **Watermarks.** The three Bare photographs carry Bare's own "bare BOUTIQUE STAYS" watermark: bottom-right on Bare Chic, bottom-left on Bare Hyphen, faint top-right on Bare Đa Kao. They are left as they are: originals and derivatives are not edited.
  - They show on the 3:2 cards, which display the whole frame.
  - The narrow stage slices crop them out.
  - Pepper House has no watermark.
- **People.** Bare Chic's window view shows a few distant, unidentifiable people on the sports ground.
- **Other text.** Bare Đa Kao has "breathe in breathe out" etched on the glass, which is part of the room.

**Crops** (`OBJECT_POSITION` in `client/photos.ts`). Cards are 3:2, like the photos, so they show the whole frame. Only the stage crops:

| Property | Position | What stays in the slice |
|---|---|---|
| Bare Chic | 55% | Window, desk, sofa |
| Bare Hyphen | 33% | The round-windowed timber door |
| Bare Đa Kao | 50% | Bamboo window and cup |
| Pepper House | 20% | Window onto the trees and canal, with the armchair |

**Image sizing** (`sizes`). Cards use `(min-width: 64rem) 24rem, 50vw`. Stage slices are sized by the stage's height, because a 3:2 photo has to cover a tall slice: `(min-width: 64rem) 31rem, 60vw`, or the full stage width when there is a single slice.

## Once authorised (procedure followed)


1. Record the authorisation in `G2_AUTHORISATION`, quoting the instruction, with the four file ids.
2. Run `node docs/content/g2/fetch-photos.mjs --fetch`, then `--derive`.
3. Inspect each photograph at full size: focus, any watermark, colour. Set `OBJECT_POSITION` where the 3:2 card crop or the narrow stage slices (about 0.6:1 on desktop, 0.75:1 on phones) lose the subject. If a primary fails, its alternate is used only with your approval.
4. QA at 390, 768 and 1440 px:
   - crops in cards and stage;
   - which file the browser picks at each width (`currentSrc`), and the bytes transferred;
   - the cards' lazy loading (no card image fetched before it nears the viewport);
   - LCP and CLS, both fixed and throttled;
   - contrast of the stage's overlaid slice labels on photographs;
   - no regression in `/a`, `/a-original`, `/b` and `/b-original`.
5. Stop for review. Nothing is committed: the photographs stay in the ignored folders.

## G3, 19/10/2026 (section 05.2)

**Authorisation.** The owner approved D4 on 19/10/2026: "D4 (G3: the five Bare Chic files, private local review only)". Recorded in `G3_AUTHORISATION`.

**Pipeline.** The pipeline now runs `FETCH_PLAN`, with one authorisation per set. G2 originals were re-verified and kept.

**Fetched.** Five files, all 2048×1365 PNG with opaque alpha, all watermarked: `2.3.png`, `1.29.png`, `53.png`, `54.png`, `1.47.png`. Provenance and sha256 are in `media-record.json`, and details in `docs/qa/05.2/cp1/RESULTS.md`.
