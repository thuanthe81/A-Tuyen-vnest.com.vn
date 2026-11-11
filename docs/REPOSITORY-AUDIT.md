# Repository safety audit

11/10/2026. Read-only: nothing was fetched, committed, removed, merged, pushed or rewritten to produce this. Remote state is as of the last fetch (10/10/2026 23:52); GitHub itself was not queried, because the `gh` tool is not installed here.

**Update, later on 11/10/2026.** This audit describes the state before stabilisation. Since then the work it lists as uncommitted has been preserved in local commits on `dev/v2-preservation`, and Level 1 of section "stop tracking the files" has been prepared as local commit `80640f9` on `chore/untrack-generated-files`. Neither branch is pushed. See `REVIEW_LOG.md`, "Repository stabilisation".

## 1. Where things stand

| | |
|---|---|
| Repository | `/Users/noe/Documents/GitHub/VNest 2`, remote `origin` = `https://github.com/Noe-09/VNest-2.git` |
| Checked-out branch | `feat/vnest-v2-booking-first` at `dbd3f70b`, level with `origin/feat/vnest-v2-booking-first` |
| `main` and `origin/main` | Both at `cf8d70eb`, "Merge pull request #1 from Noe-09/feat/vnest-v2-booking-first" |
| Merge-base of the feature branch and `origin/main` | `dbd3f70b`: the feature branch is fully contained in `main` (0 ahead, 2 behind) |
| Working tree | Uncommitted: Phase 01 safeguards, section 02.2, the section 02.1 scroll fix and documents. Nothing staged |

```
*   cf8d70eb  Merge pull request #1            (main, origin/main)
|\
| * dbd3f70b  Booking Bar Finish               (feat/vnest-v2-booking-first)  <- HEAD
| * cd2cce47  docs: approve and freeze 02.1
| * 1b75a6f9  feat: floating booking search
| * a933cbb7  chore: foundation baseline
* | ed22c4da  Section 1                        <- added the generated files
|/
* b0cb00c4  Initial commit
```

## 2. What is tracked that should not be

Commit `ed22c4da` ("Section 1", made on `main` on 10/10/2026 17:40) added 22,125 generated files and nothing else. The merge then joined them to the source. `main` now tracks 22,222 files; 97 are the project.

| Path | Files | Size | Note |
|---|---|---|---|
| `node_modules/` | 21,396 | 388 MB | Includes macOS-arm64 binaries, the largest 84.8 MB |
| `.next/` | 727 | 233 MB | Build and development caches, traces, a development log |
| `tsconfig.tsbuildinfo`, `next-env.d.ts` | 2 | small | Generated |

`.gitignore` on `main` already lists all four. It has no effect on them: ignoring only stops new files being added, it does not untrack files already committed. The local object store is 235 MB packed.

Inside the tracked `.next/`:

- `.next/cache/.previewinfo` and both `prerender-manifest.json` files hold Next.js preview-mode signing and encryption keys. They belong to one local build and are regenerated on every build, and no deployment uses them, so the exposure is low. They are still key material in a remote repository, and are not a reason to keep that build.
- 88 files contain absolute paths from this machine (`/Users/noe/...`).
- No `.env` file and no configured secret is tracked. `required-server-files.json` carries no environment values.

## 3. Consequences

| Area | Effect |
|---|---|
| CI | The workflow runs on pushes to `main`. `npm ci` deletes and reinstalls `node_modules`, so the job should still pass, but it checks out 620 MB first and the Linux install differs from the tracked macOS binaries. Whether the run on `cf8d70eb` passed was not checked |
| Repository size | Every clone downloads about 235 MB instead of well under 1 MB. One blob is 84.8 MB: above GitHub's 50 MB warning, below its 100 MB limit. A later dependency update could cross it and be rejected |
| Daily work on `main` | Every build rewrites tracked files under `.next/`, and every install rewrites `node_modules/`, so the working tree is permanently "modified" and commits pick up noise |
| Switching branches | Checking out the feature branch from `main` deletes `node_modules/` and `.next/` from disk (they are tracked on one side, ignored on the other). This happened on 10/10/2026 and needed a reinstall |
| Future merges | Any branch built from `main` carries the files. Binary caches under `.next/` conflict and cannot be merged by hand |
| Deployment | A host that builds from `main` installs over tracked files; behaviour depends on the host. Not tested |

## 4. Proposed cleanup

Two levels. The first is safe and reversible and is recommended now. The second is optional and destructive.

**Level 1: stop tracking the files (recommended).** History is kept; nothing is rewritten; nothing is force-pushed.

1. Commit or stash the current work first, so the uncommitted section 02.2 files cannot be caught up in it.
2. From an up-to-date `main`, create a branch, for example `chore/untrack-generated-files`.
3. Run `git rm -r --cached node_modules .next tsconfig.tsbuildinfo next-env.d.ts`. `--cached` removes them from the index only; the files stay on disk.
4. Confirm with `git status` that the only staged changes are deletions under those four paths, and that `git ls-files | wc -l` is 97.
5. Commit, push the branch, open a pull request, let CI run, and merge it normally.
6. Afterwards, branch new work from the cleaned `main`. The feature branch can be brought up to date by merging `main` into it; because the feature branch never tracked these files, that merge is clean.

Effect: new clones still download the old 235 MB of history, but nothing generated is tracked or changes again.

**Level 2: remove the files from history (optional).** Only this recovers the size and removes the preview keys and local paths from the remote.

- Rewrite `main` so that `ed22c4da` never existed (for example with `git filter-repo --invert-paths` for the four paths), then force-push.
- It changes every commit id on `main` after the initial commit, invalidates pull request #1's merge commit, and requires every clone to be re-cloned. With one contributor and a two-day-old repository this is cheap today and gets more expensive with every commit.
- GitHub keeps unreachable objects for a time; full removal needs a request to GitHub Support.

Recommendation: do Level 1 now. Decide on Level 2 before a second contributor or a deployment host is connected.

**Not done, and not to be done without approval:** any of the steps above.
