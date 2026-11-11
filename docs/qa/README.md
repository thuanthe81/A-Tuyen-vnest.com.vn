# QA evidence: what is in the repository and what is archived outside it

Updated 15/10/2026. Evidence is a record of what was checked; it is not approval.

## In the repository

| Folder | Files | What they are |
|---|---|---|
| `phase-01/` | `safeguards.diff` | The diff of the F1 and F2 corrections |
| `02.2/` | `results.json` | The combined rendered-check run of 11/10/2026: 204 checks, all passing. It covers section 02.2, the section 02.1 regression, and the section 05.1 property page |
| `02.2/` | `results-handoff.json` | 10 hand-off checks, all passing |
| `02.2/` | 16 screenshots | A representative set of the 60 taken |
| `05.1/` | 3 screenshots | A representative set of the 7 taken |
| `05.1/` | `results.json` | **A byte-for-byte copy of `02.2/results.json`, not a separate run.** See below |

## Section 05.1 has no results file of its own

`05.1/results.json` is the same file as `02.2/results.json`. No rendered-check run was made for section 05.1 alone. What exists for 05.1 is the part of the combined run that concerns the property page: 14 of the 204 checks, whose names begin with `property`, `property page`, `property shell` or `results to property`. They cover the route, the stay carried in the URL, the first screen at 390 px, horizontal overflow at 390, 768 and 1440 px, the canonical address and noindex for a sample property.

The copy is kept as committed so the history stays truthful. It should be read as described here, and replaced by a 05.1-only results file the next time the 05.1 checks are run.

## Archived outside the repository

48 screenshots were moved out of the working tree on 11/10/2026 so they cannot be committed by accident: 44 from `02.2/` and 4 from `05.1/`. Each was compared byte for byte with the working-tree backup before the move.

| | |
|---|---|
| Location | `VNest-2-backups/qa-archive_2026-10-11/`, beside the project folder on the owner's machine, with the same `docs/qa/` paths |
| Integrity | `SHA256SUMS` in that folder lists all 48 files |
| Second copy | The working-tree backup `VNest-2-backups/vnest-2-worktree_2026-10-11_173458.tar.gz` |

Both copies are on one disk. They are not on GitHub.

Documents that name a screenshot not listed in this folder (for example the `-768.png` captures and most `b-*` captures in the section 02.2 draft record) refer to the archive.

## Archive of 15/10/2026: Living Frames, gallery exploration, Brand Collection

| Folder in the repository | What is kept |
|---|---|
| `living-frames/`, `living-frames/refine-01/`, `living-frames/media-test/` | Every results, measurement and script file; 13 captures, none showing Pexels media |
| `05.1-gallery-exploration/` | `bplus-measurements.json`; 8 captures |
| `brand-collection/` | `RESULTS.md`, four JSON results, the scripts; 30 captures and recordings that the docs link to |

184 files were moved to `VNest-2-backups/qa-archive_2026-10-15/` (same `docs/qa/` paths, `SHA256SUMS`, all 184 verified) after a full backup, `VNest-2-backups/vnest-2-untracked_2026-10-15.tar.gz` (SHA-256 `eee122bf18f711811991b08c73692ce5afbb19a0791ccc79d398a857fd0e77b8`), was verified by test extraction. **Captures showing the Pexels reference media are archived only, never committed**: that media was approved for private local exploration.

Results files in these folders name captures that are now in the archive. Read those names as archive paths.

## Retention

Keep in the repository: results files, and one screenshot per distinct state at 1440 px, plus 390 px where the layout differs in kind. When a section is frozen, drop captures from superseded rounds and keep the set that matches the frozen state.
