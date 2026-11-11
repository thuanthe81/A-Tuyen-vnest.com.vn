# Stock media for the Living Frames media reality check

**Private local exploration only.** Approved by the project owner on 13/10/2026 for one
controlled local test of `/dev/property-gallery/living-frames/media-a` and `/media-b`.

- These are third-party stock assets. **None shows a VNest property**, and none may be
  presented as one. Every use on a page carries a "not VNest" disclosure.
- Not to be published, deployed, committed or pushed. The `.gitignore` beside this file
  keeps every media file out of version control; only this record is trackable.
- To be replaced by commissioned VNest photography and footage before any public use.
- No other stock asset belongs in this folder. Hà Nội-specific imagery was explicitly not
  approved (VNest's property locations are unconfirmed).

## Licence

All three are under the Pexels licence, https://www.pexels.com/license/, as read on
13/10/2026: free to use, attribution not required, modification allowed.

Restrictions that apply here:

- Identifiable people may not be shown in a bad light or offensively (none of the three
  shows a person).
- No implied endorsement by people or brands in the imagery. **V1 shows printed panels
  with a brand mark on the balcony outside the window in its first two seconds**; do not
  crop in on them, and prefer a frame without them for any wider use.
- No resale of unaltered copies, no redistribution on other stock or wallpaper platforms,
  no use as part of a trade mark.
- Pexels gives no warranty of property or model releases. These interiors and the
  building are someone's real premises, in places the creators name (below) or do not
  name. That is a further reason not to present them as VNest's.
- The licence text can change; it governs as it stood on the download date.

## Assets

Downloaded 13/10/2026, 21:52 (UTC+7), with `curl` from Pexels' own file servers.

| | V1 | P1 | P4 |
|---|---|---|---|
| Title on Pexels | Cozy Modern Bedroom with Minimalist Decor | Narrow Apartment Building with Balconies | Cozy Bedroom with Elegant Wall Sconces |
| Creator | Cá Bảo (`@tolaca`) | Theodore Nguyen (`@thejourneyofframes`) | Marion Batteur (`@marion-batteur-2148544082`) |
| Source page | https://www.pexels.com/video/cozy-modern-bedroom-with-minimalist-decor-39952442/ | https://www.pexels.com/photo/narrow-apartment-building-with-balconies-25712622/ | https://www.pexels.com/photo/cozy-bedroom-with-elegant-wall-sconces-30455215/ |
| File fetched | `https://videos.pexels.com/video-files/39952442/17049186_1920_1080_30fps.mp4` (the 1920×1080 file Pexels offers; reached from `https://www.pexels.com/download/video/39952442/?fps=29.97&h=1080&w=1920`) | `https://images.pexels.com/photos/25712622/pexels-photo-25712622.jpeg` | `https://images.pexels.com/photos/30455215/pexels-photo-30455215.jpeg` |
| Kept as | `_source/v1-pexels-39952442-1920x1080.mp4` | `_source/p1-pexels-25712622.jpeg` | `_source/p4-pexels-30455215.jpeg` |
| As fetched | 1920×1080, 29.97 fps, 9.78 s, no audio, 5,997,237 bytes | 3943×5915, 1,402,020 bytes | 4625×6937, 5,127,658 bytes |
| SHA-256 | `3302bff1…560d5c88` | `0345ec1e…0394ba9` | `4c00b210…592ea51e6` |
| Place, per the creator | not stated | Hồ Chí Minh City | not stated |
| Role in the test | Frame 01, the showcase | Frame 02, "Kiến trúc" | Frame 03, "Chi tiết" |

The original on Pexels of V1 is 3840×2160; the 1080p file was fetched because no rendition
here is larger than 1280×720.

## What was made from them

Modification is allowed by the licence. Nothing was retouched or regraded.

| File | From | What was done |
|---|---|---|
| `v1-room-1280.mp4` | V1 | Seconds 0.0 to 5.0 only (the camera move ends before an unrelated object enters the frame), 1280×720, H.264 High, about 2.2 Mbit/s, no audio, fast start |
| `v1-room-960.mp4` | V1 | The same cut at 960×540, about 1.2 Mbit/s, for narrow screens |
| `v1-room-poster-{640,960,1280,1920}.{avif,webp,jpg}` | V1 | The clip's first frame (0.0 s) as a still |
| `p1-facade-{240,360,480,720,1200}.{avif,webp,jpg}` | P1 | Resized whole; cropping is done by the page (4:5, towards the top) |
| `p4-detail-{240,360,480,720,1200}.{avif,webp,jpg}` | P4 | Resized whole; cropping is done by the page (1:1, towards the top) |

Video: Apple VideoToolbox through AVFoundation. Stills: sharp (AVIF quality 55, WebP 74,
JPEG 76). Metadata is not carried into the renditions.

## When the media is not on the machine (added 15/10/2026)

The files above are deliberately not in Git (`.gitignore` here), so a fresh checkout or another machine has only this file and the `.gitignore`. In that case `/dev/property-gallery/living-frames/media-a` and `/media-b` do not show broken pictures: `living-frames/stock-available.ts` checks that every rendition and both clips are present, and if any is missing the page renders the drawn stand-ins in the same geometry, with a notice ("Ảnh tham khảo không có trên máy này, đang hiện tranh vẽ mẫu"). The check runs at build time for these static pages and on each request in development.

To restore the media on another machine, copy this folder from the owner's machine, or re-download the three assets from the Pexels pages listed above and re-encode them as described in "What was made from them". The 15/10/2026 backup tarball holds untracked, non-ignored files only, so it does not contain them.
