# Repository checkpoint proposal, 15/10/2026

**Status: approved by the owner and carried out for checkpoints 1 to 4 on 15/10/2026: `b166f5b`, `dc93ae4`, `06f9a6e`, `1e7fbba` (local, not pushed). The backup and archive were verified as in §4. Checkpoint 5 (this file and the status records) was approved by the owner on 15/10/2026, with section number 03.3 and the status DIRECTION APPROVED, and is the commit that adds this file.** The counts below are as audited. At execution there were 396 untracked files, two more than audited: this document, and `living-frames/stock-available.ts`, the stock-media fallback the owner asked for, which made checkpoint 1 110 files.

Branch `design/vnest-property-gallery-exploration`, HEAD `df31d40`. Everything below is untracked work from the Living Frames and Brand Collection explorations (12 to 15/10/2026).

## 1. Audit findings

**Branch.** HEAD is the same commit as `dev/v2-preservation`, which is already on GitHub (`origin/dev/v2-preservation`). This branch has no upstream and has never been pushed. `main` is 7 commits ahead of this branch: the merged pull requests #1 to #4, the last of which **removed the in-review sections 02.2 and 05.1 from `main`**. Living Frames builds on 05.1 (`PropertySearchBar`, `useStayFromUrl`, the availability summary), so this work must stay on a branch based on `dev/v2-preservation`. It must not be based on `main`, nor merged into it.

**Tracked files.** None changed: `git diff HEAD` is empty. Every change is a new, untracked file.

**Frozen section 02.1 (booking bar).** Unchanged:
- `src/features/booking-search/` and `src/app/dev/booking-search/` are byte-identical to the authorised post-freeze hotfix `9b2febc`, and both 02.1 commits (`1b75a6f`, `9b2febc`) are in this branch's history.
- Three supporting files named in the 02.1 record (`src/config/routes.ts`, `src/domain/availability.ts`, `src/server/availability.ts`) differ from `9b2febc`. All three changes come from the earlier, already committed snapshot `73f11f0` (02.2 in review), not from this work.

**PMS and booking domain contracts.** Untouched. The Brand Collection imports only `@/seo/metadata`. The Living Frames prototypes import only for reading (property-page search bar, stay summary, config), and change nothing they import.

**Untracked inventory: 394 files, about 106 MB**

| Area | Files | Size | What it is |
|---|---|---|---|
| `src/app/dev/property-gallery/` | 36 | 0.1 MB | Gallery concepts A, B-original, B+, Living Frames (drawn, media-a, media-b) |
| `public/dev-fixtures/exploration/` | 62 | 1.5 MB | Drawn stand-in SVGs, and two clips made from those drawings |
| `public/dev-fixtures/stock-test/` | 2 visible | 0.0 MB | `SOURCES.md` and `.gitignore`. The Pexels media (17 MB on disk) is already ignored by that `.gitignore` |
| `docs/design/living-frames/` | 9 | 2.2 MB | Art direction and media shortlist boards |
| `docs/qa/living-frames/` | 128 | 70.6 MB | Evidence of three rounds; 44 MB of it is GIF copies of WebP recordings |
| `docs/qa/05.1-gallery-exploration/` | 35 | 13.7 MB | Evidence of the gallery concepts |
| `src/app/dev/brand-collection/` | 18 | 0.1 MB | Brand Collection A, A-original, B (selected), B-original, shared filter logic and its tests |
| `public/dev-fixtures/brand-collection/` | 4 | 0.04 MB | VNest symbol, wordmark and lockup SVGs, extracted unchanged from the client's artwork, with `SOURCES.md` |
| `docs/design/brand-collection/` | 2 | 0.03 MB | Rationale, recommendation history, comparison board |
| `docs/qa/brand-collection/` | 98 | 17.6 MB | Evidence, scripts, measurements |

**Secrets.** No `.env`, key, token or credential file, and no credential pattern in any untracked text file. (The only matches on "key" were filenames containing "keyboard".)

**Generated files.** No `node_modules`, `.next` or build output among the untracked files. The root `.gitignore` already covers them.

**A problem found and fixed during the audit.** The capture helper built its Chrome profile path with `URL.pathname`, which turns the space in "VNest 2" into `%20`. That created a stray 13 MB folder, `~/Documents/GitHub/VNest%202/`, beside the repository. I created it this session; it contained only that profile and has been deleted. The Brand Collection helper now uses `fileURLToPath`. The Living Frames helper (`docs/qa/living-frames/media-test/scripts/lib.mjs`) has the same line and should get the same one-line fix in checkpoint 2.

**Third-party media.** Of the media-test captures, 54 show the three Pexels assets that you approved for private local exploration only; the media itself is kept out of Git. I recommend treating those captures the same way: archive them, do not commit them. The tested measurements and `RESULTS.md` are kept, so nothing is lost from the record.

**Size.** Committing everything would add about 106 MB, 57.5 MB of it GIF duplicates. That goes against the retention rule in `docs/qa/README.md`: results files plus one capture per distinct state; the rest archived outside the repository with checksums.

## 2. Proposed checkpoint commits

Five commits, all local, on `design/vnest-property-gallery-exploration`, in this order, and none pushed until you approve a push. A commit preserves work; it is not approval. Totals: 210 files, 11.9 MB.

| # | Commit (draft message) | Files | Size |
|---|---|---|---|
| 1 | `feat(dev): preserve property gallery explorations and Living Frames prototypes (unapproved)` | 109 | 4.3 MB |
| 2 | `docs(qa): Living Frames and gallery exploration evidence, representative set` (also: the one-line profile path fix, and `chrome-profile/` added to the root `.gitignore`) | 33 | 3.1 MB |
| 3 | `feat(dev): brand collection prototypes; concept B selected, not frozen` | 24 | 0.2 MB |
| 4 | `docs(qa): brand collection evidence, representative set` | 44 | 4.3 MB |
| 5 | `docs: record Living Frames and Brand Collection status and the 15/10 QA archive`: `REVIEW_LOG.md`, `ROADMAP.md` and `docs/qa/README.md` entries, drafted for your review before committing | 3 (tracked) + this file | tiny |

(Revised 15/10: the separate `.gitignore` commit was folded into checkpoint 2, so there are five checkpoints, not six.) Why five, not one: each is reviewable on its own, and each can be reverted on its own. The prototypes (1, 3) build and run without their evidence (2, 4).

**One decision for you, on checkpoint 3:** it commits the VNest vectors extracted from `AI_edited_2026.ai`, about 44 KB in a private repository. They are needed for the Brand Collection to render. The identity is still a proposed client direction. If you would rather keep client artwork out of Git until it is final, I will leave `public/dev-fixtures/brand-collection/*.svg` untracked and add an ignore rule instead.

### What each checkpoint contains

1. The whole of `src/app/dev/property-gallery/`, `public/dev-fixtures/exploration/` and `docs/design/living-frames/`, plus `public/dev-fixtures/stock-test/.gitignore` and `SOURCES.md` (no media).
2. Every non-media file of `docs/qa/living-frames/` and `docs/qa/05.1-gallery-exploration/` (results, measurements, scripts including `vtool.swift`), plus 21 captures, none showing stock media:
```text
docs/qa/living-frames/lf-1440-first-screen.png
docs/qa/living-frames/lf-390-first-screen.png
docs/qa/living-frames/lf-390-reduced-motion-poster.png
docs/qa/living-frames/refine-01/after-1440x900.png
docs/qa/living-frames/refine-01/after-390x844.png
docs/qa/living-frames/refine-01/after-360x640.png
docs/qa/living-frames/refine-01/after-1440-bridge-to-rooms.png
docs/qa/living-frames/refine-01/after-390-bridge-to-rooms.png
docs/qa/living-frames/refine-01/after-390-gallery-open.png
docs/qa/living-frames/refine-01/compare-first-screen-1440x900.png
docs/qa/living-frames/refine-01/compare-first-screen-390x844.png
docs/qa/living-frames/media-test/drawn-1440-static.jpg
docs/qa/living-frames/media-test/drawn-390-static.jpg
docs/qa/05.1-gallery-exploration/bplus-1440-first-screen.png
docs/qa/05.1-gallery-exploration/bplus-390-first-screen.png
docs/qa/05.1-gallery-exploration/a-1440-first-screen.png
docs/qa/05.1-gallery-exploration/a-390-first-screen.png
docs/qa/05.1-gallery-exploration/b-original-1440-first-screen.png
docs/qa/05.1-gallery-exploration/b-original-390-first-screen.png
docs/qa/05.1-gallery-exploration/compare-1440-before-after.png
docs/qa/05.1-gallery-exploration/compare-390-before-after.png
```
3. The whole of `src/app/dev/brand-collection/`, `public/dev-fixtures/brand-collection/` and `docs/design/brand-collection/`.
4. Every non-media file of `docs/qa/brand-collection/` (`RESULTS.md`, the four JSON results, all scripts and their `.gitignore`), plus the 30 captures and recordings that the README and board link to, or that show a distinct state of the selected B:
```text
docs/qa/brand-collection/a-1440-all.png
docs/qa/brand-collection/a-1440-bare.png
docs/qa/brand-collection/a-1440-keyboard-focus.png
docs/qa/brand-collection/a-1440-recording.webp
docs/qa/brand-collection/a-390-all.png
docs/qa/brand-collection/a-390-bare-da-nang.png
docs/qa/brand-collection/a-390-bare.png
docs/qa/brand-collection/a-390-conflict-note.png
docs/qa/brand-collection/a-390-recording.webp
docs/qa/brand-collection/a-390-sample-area.png
docs/qa/brand-collection/a-768-all.png
docs/qa/brand-collection/a-768-bare.png
docs/qa/brand-collection/a-original/a-1440-bare.png
docs/qa/brand-collection/a-original/a-390-bare.png
docs/qa/brand-collection/b-1440-all.png
docs/qa/brand-collection/b-1440-bare.png
docs/qa/brand-collection/b-1440-keyboard-focus.png
docs/qa/brand-collection/b-1440-keyboard.webp
docs/qa/brand-collection/b-1440-recording.webp
docs/qa/brand-collection/b-390-all.png
docs/qa/brand-collection/b-390-bare-da-nang.png
docs/qa/brand-collection/b-390-bare.png
docs/qa/brand-collection/b-390-conflict-note.png
docs/qa/brand-collection/b-390-recording.webp
docs/qa/brand-collection/b-390-sample-area.png
docs/qa/brand-collection/b-768-all.png
docs/qa/brand-collection/b-768-bare.png
docs/qa/brand-collection/b-original/b-1440-all.png
docs/qa/brand-collection/b-original/b-1440-bare.png
docs/qa/brand-collection/b-original/b-390-bare.png
```

## 3. Not committed: archived outside the repository

184 files, 94.4 MB: GIF duplicates of WebP recordings (18), captures from superseded rounds, full-page captures, and the 54 captures showing Pexels media. Following the 11/10 precedent, they would be moved to `VNest-2-backups/qa-archive_2026-10-15/` (beside the project, same `docs/qa/` paths), with a `SHA256SUMS` file, and checked byte for byte before removal from the working tree. Moving them out means they cannot be committed by accident.

| Folder | Files | Size |
|---|---|---|
| `docs/qa/05.1-gallery-exploration/` | 26 | 12.4 MB |
| `docs/qa/brand-collection/` | 17 | 5.3 MB |
| `docs/qa/brand-collection/a-original/` | 18 | 3.4 MB |
| `docs/qa/brand-collection/b-original/` | 19 | 4.5 MB |
| `docs/qa/living-frames/` | 16 | 20.8 MB |
| `docs/qa/living-frames/media-test/` | 60 | 21.0 MB |
| `docs/qa/living-frames/refine-01/` | 28 | 26.9 MB |

## 4. How it would be carried out, once approved

1. Back up before anything moves. Nothing is deleted at any point:
   - Write a full tarball of every untracked file (all 394, about 106 MB) to `VNest-2-backups/vnest-2-untracked_2026-10-15.tar.gz`, and record its SHA-256.
   - Confirm its listing has 394 entries, and test that it extracts in a temporary folder.
   - Copy (not move) the 184 files in §3 to `VNest-2-backups/qa-archive_2026-10-15/`, and write `SHA256SUMS` for them from the originals.
   - Run `shasum -c` in the archive: all 184 must report OK.
   - Only then remove those 184 from the working tree. They remain in two verified copies: the archive folder and the tarball.
   - The ignored Pexels media in `public/dev-fixtures/stock-test/` is never moved or touched.
2. For each checkpoint, stage with `git add --pathspec-from-file`, and confirm `git diff --cached --stat` matches this proposal exactly.
3. Before each commit, check the staged tree on its own, in a temporary worktree: lint, typecheck, tests and a production build. That proves the commit stands without the files that are still untracked.
4. Commit locally with the drafted messages.
5. Stop. Push only on your word, as a new remote branch `design/vnest-property-gallery-exploration`, never to `main`.

## 5. Open before real-content integration

- **Area filter.** Your requirement is not to present an unverified Area filter as operational. B currently shows Area as a disabled select reading "Chờ xác minh". I propose hiding the Area control entirely until areas are verified, and keeping `?areas=sample` only as a review switch. That is a small change in the next step, not part of this checkpoint.
- **VNest property photographs.** VNest has already supplied property photographs, as Google Drive links listed in `VNest_Information.xlsx`. They have **not yet been imported** into this repository, and the workbook is not yet in this workspace (it is not in the repository or in Downloads). So the prototypes still use drawn stand-ins. When the photographs are imported, they are client originals. This checkpoint's rule applies to them too: client photography is not committed until you decide how it is stored.
