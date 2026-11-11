# Living Frames: media reality check

13/10/2026. Evidence for a visual review; **nothing here is approved, committed or frozen**.

The question: does the Living Frames first screen become more compelling and professional
with photographic and filmed material, and is the layout strong enough to keep?

**Every photograph and the clip are third-party stock from Pexels, approved by the owner for
private local exploration only. None shows a VNest property.** Sources, licence and
restrictions: `public/dev-fixtures/stock-test/SOURCES.md`.

## What was built

| | Route | What it is |
|---|---|---|
| Illustrated | `/dev/property-gallery/living-frames` | The page as reviewed on 12/10, unchanged |
| A | `/dev/property-gallery/living-frames/media-a` | The same page and geometry with the three approved assets in the first screen |
| B | `/dev/property-gallery/living-frames/media-b` | As A, with the two still frames given more of the sheet from 768px |

- Trio A as approved: 01 the room (the clip), 02 the building, 03 a detail. Captions changed
  to match ("Phòng", "Kiến trúc", "Chi tiết"). Nothing else on the page was reworded.
- The clip plays once (5 s) and rests on its last frame; the control then offers to play it
  again. The drawn page's clip still loops.
- B changes one line of CSS: the sheet's columns go from 130 : 174 : 864 to 160 : 212 : 796.
  The booking bar, the order of things, the type and the phone layout are untouched. On a
  phone A and B are the same page, pixel for pixel (checked at 390×844 and 360×640).
- Only the three approved assets are used. The two section frames further down and four of
  the gallery's seven pictures are still the drawings.
- The line at the top of the two test pages has a small switch (Minh hoạ / A / B) from 768px.
  It is for the reviewer and is not part of the design.

## Findings

1. **The showcase is where real media pays.** With a photograph the first screen reads as a
   place to stay; with the drawing it read as a diagram. This holds at every width, and it
   holds with nothing playing: the still poster is a complete first screen
   (`compare-static-vs-held-*.jpg`).
2. **On a phone the layout needs nothing.** Showcase 390×260, then the name, then the
   booking action 221px above the fold (64px at 360×640); the two stills are 202×252 and
   143×143, large enough to read as pictures.
3. **On a desktop, A's still frames are thumbnails; B's are pictures.** At 1440 they go
   from 174×217 and 130×130 (9% and 4% of the showcase's area) to 212×265 and 160×160 (16%
   and 7%), for 14% less showcase area (865×486 to 796×448). The building reads as a
   building in B (`legibility-1440-a-vs-b-at-2x.jpg`).
4. **B is close to the sheet's limit.** The name stands above the upright frame, and the two
   together must not be taller than the showcase. B leaves 8px of slack at 1440 and 16px at
   1280 (A leaves 94px). A property name that wraps to a second line would push the
   showcase's top about 56px below the name's in B. At 1024 B is already 13px over.
5. **768 to about 1000px is the weak range in both.** A's stills are 102×128 and 76×76, and
   "03 Chi tiết" is wider than its 76px frame, so the two captions run together. B's are
   125×156 and 94×94 and the captions fit, but in both the showcase starts 72 to 84px below
   the name. Three columns do not fit a tablet held upright.
6. **The wide clip stutters on a slow connection.** On slow 4G the 1280px file (2.2 Mbit/s,
   more than the connection carries) stalls five or six times and takes about 7 s to play
   5 s. The 960px file used on phones plays through without a stall.
7. **Nothing moves.** Layout shift is 0 at load and after scrolling in every profile.

## Numbers

Lab data, headless Chrome 154, production build, median of three loads. Full detail and
method in `measurements.json`.

### Largest Contentful Paint

| Profile | Illustrated | A | B | LCP element (A, B) |
|---|---|---|---|---|
| Phone 390×844 @3x, slow 4G, 4× CPU | 876 ms | 2168 ms | 2136 ms | poster, 1280w AVIF, 58 KB |
| Tablet 768×1024 @2x, slow 4G, 4× CPU | 876 ms | 2052 ms | 2112 ms | poster, 1280w AVIF, 58 KB |
| Desktop 1440×900 @2x, slow 4G | 868 ms | 2776 ms | 2768 ms | poster, 1920w AVIF, 115 KB |
| Phone, no throttling | 48 ms | 52 ms | 56 ms | poster |
| Desktop @2x, no throttling | 104 ms | 84 ms | 100 ms | clip's first frame (see caveat) |

First Contentful Paint is 736 to 828 ms on slow 4G in every case: the name and the booking
action do not wait for the picture. The earlier round's estimate with a synthetic 188 KB
poster was 2804 ms on the phone profile; the real, optimised poster does better.

### Media files

| File | Size | Used for |
|---|---|---|
| `v1-room-1280.mp4` | 1,412,770 B (1.35 MB), 1280×720, 5.0 s, about 2.2 Mbit/s | frames wider than 480px |
| `v1-room-960.mp4` | 773,638 B (755 KB), 960×540, 5.0 s, about 1.2 Mbit/s | frames up to 480px |
| Poster AVIF | 17.5 / 35.9 / 58.1 / 114.6 KB at 640 / 960 / 1280 / 1920w | chosen by the browser |
| Building AVIF | 10.1 / 19.5 / 32.1 / 63.8 / 163.1 KB at 240 / 360 / 480 / 720 / 1200w | |
| Detail AVIF | 6.2 / 10.4 / 14.8 / 25.5 / 51.6 KB at 240 / 360 / 480 / 720 / 1200w | |

WebP and JPEG fallbacks exist for each. Source files as downloaded: clip 5,997,237 B
(1080p), building 1,402,020 B, detail 5,127,658 B.

Transferred before the load event, phone profile: 303 KB illustrated, 438 KB with media.
The clip is never requested before the load event.

### The clip

| Profile | File | First frame at | Stalls | Ended at |
|---|---|---|---|---|
| Phone, slow 4G | 960 | 3.4 s | none | 8.5 s |
| Tablet A, slow 4G | 1280 | 3.3 s | 5 to 6 | 10.2 s |
| Tablet B, slow 4G | 960 (its frame is under 480px) | 3.2 s | none | 8.3 s |
| Desktop, slow 4G | 1280 | 3.6 s | 5 to 6 | 10.5 s |
| Any, no throttling | either | under 0.1 s | none | 5.1 s |

### Crop and focal point

| | Frame | Of the picture shown |
|---|---|---|
| Showcase, 768px and up | 16:9 | all of it |
| Showcase, 390×844 | 390×260 (3:2) | the middle 84% of the width |
| Showcase, 360×640 | 360×218 | the middle 93% of the width |
| Building, in 4:5 | | full width, 83% of the height, weighted to the top |
| Detail, in 1:1 | | full width, 67% of the height, weighted to the top |

The bed and lamp stay inside the phone crop on the first frame and the last.

## Checks

All passed unless noted. Detail in `measurements.json` under `interaction`.

| Check | Result |
|---|---|
| Booking action in the first screen | Yes at 360×640, 390×844, 768, 1024, 1280, 1440, 1920, A and B |
| Horizontal overflow | 0px everywhere |
| Reduced motion | Poster only, clip not requested; pressing play still plays it |
| Save-Data, and a 2G connection | Poster only, clip not requested |
| `prefers-reduced-data` | **Not tested**: this Chrome would not emulate it |
| Pause | Holds the frame; remembered for the visit, so a reload does not start the clip or fetch it |
| Completion | Stops on its last frame; does not restart when scrolled away and back; replay works |
| Leaving the screen mid-play | Pauses, resumes on return |
| Clip cannot be loaded | Poster stands, the play control is withdrawn, gallery and booking still work. **Fixed during this test**: the control used to remain and do nothing |
| Poster cannot be loaded | The frame keeps its size over the built-in 32px preview; the clip still plays |
| Scripts off | Name, poster, both stills, disclosure and the booking link are all there |
| Keyboard | Every control reachable with a visible focus ring; Enter and Space work the clip; Enter on a frame opens the gallery at that picture, Escape returns focus to the frame; Enter on the booking action reaches the rooms with the dates kept |
| Touch | No target under 44px in the first screen; gallery opens from the control and from a frame; the corner booking button appears after the first one scrolls away and stands down at the rooms |
| Gallery | Reference pictures are shown whole from 768px and credited in their captions |
| Illustrated page | Unchanged apart from the cases noted in `measurements.json` |
| `npm run check` | Lint, typecheck and 182 tests pass |

## What only VNest's own media can settle

- **Whether it looks like one place.** Three assets from three unrelated buildings cannot
  show a property's own palette and character.
- **Whether it is distinctive.** The stock clip is a plain hand-held pass across a bedroom.
  It makes the page believable; it does not make it memorable. The first frame also shows
  printed panels with a brand mark on the balcony.
- **The whole page.** Below the first screen, and for four of the gallery's seven pictures,
  the page is still drawn.
- **Real names and captions.** B has 8px of slack for the name at 1440.
- **The small "tham khảo" marks** exist only because the pictures are not VNest's.

Not tested at all: Safari and iOS (autoplay and Low Power Mode behave differently there),
any real device, any real network.

## Files

- First screens: `{drawn,a,b}-{390,768,1440}-static.jpg`; with the clip finished:
  `{a,b}-{390,768,1440}-held.jpg`; whole pages: `*-full.jpg`.
- Other widths: `{a,b}-{360x640,1024,1280,1920}-static.jpg`.
- Comparisons: `compare-*.jpg`, `legibility-*.jpg`.
- Recordings: `recording-390-media.{webp,gif}` (20 s), `recording-1440-media-b.{webp,gif}` (16 s).
- States: `a-390-paused`, `-data-saver`, `-clip-unavailable`, `-poster-unavailable-preview`,
  `-no-script`, `-gallery-open`, `-gallery-at-detail`, `-rooms-bridge`; `b-1440-focus-*`,
  `b-1440-gallery-open`.
- `scripts/`: the measurement scripts and the two media tools, so the run can be repeated.
