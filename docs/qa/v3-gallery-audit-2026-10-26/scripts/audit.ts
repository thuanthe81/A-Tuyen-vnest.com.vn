// Photo-count audit per room (26/10/2026). Run:
//   DEPLOY_ENV=development CONTENT_SOURCE=client-draft node --import ./test/register.mjs docs/qa/v3-gallery-audit-2026-10-26/scripts/audit.ts
// "Before" = the same code with the owner's selection switched off (selection manifest null), i.e. what
// every room exposed before 26/10. "Now" = with the selection. Drive folders: the workbook-linked
// listings of 15/10 (docs/content/vnest-client-data.draft.json) and, for The Nắng Suites (v2 D20–D23),
// the listing read on 26/10 (nang-folder-listing-2026-10-26.json).
import { readFileSync, writeFileSync } from "node:fs";
import { buildBookingResultsCatalog } from "@/features/demo/booking-results-data";
import { readPhotoManifest } from "@/content/vnest-workbook/photo-manifest";
import { readSelectionManifest } from "@/content/vnest-workbook/selection-photos";
import { RELEASE_HOLDS } from "@/content/vnest-workbook/media";
import { SELECTION, selectionForRoom } from "@/content/vnest-workbook/image-selection";
import { slug } from "@/content/vnest-workbook/records";

const DIR = "docs/qa/v3-gallery-audit-2026-10-26";
const v1 = JSON.parse(readFileSync("docs/content/vnest-client-data.draft.json", "utf8")).mediaFolders as { driveFolderTitle: string; folderId: string; linkedFromRows: string[]; files: { name: string; driveFileId: string }[] }[];
const nang = JSON.parse(readFileSync(`${DIR}/nang-folder-listing-2026-10-26.json`, "utf8")).folders as { room: string; folderId: string; files: { name: string; id: string }[] }[];
const NANG_ROOMS = new Set(nang.map((f) => f.room));
function folderFor(room: string) {
  const n = nang.find((f) => f.room === room);
  if (n) return { title: n.room, id: n.folderId, files: n.files.map((f) => ({ name: f.name, id: f.id })) };
  const f = v1.find((x) => x.linkedFromRows.some((r) => slug(r) === slug(room)) && !NANG_ROOMS.has(room));
  return f ? { title: f.driveFolderTitle, id: f.folderId, files: f.files.map((x) => ({ name: x.name, id: x.driveFileId })) } : null;
}
const manifest = readPhotoManifest();
const photoDrive = new Map(Object.entries(manifest?.photos ?? {}).map(([k, v]) => [k, v.driveFileId]));
const before = buildBookingResultsCatalog(manifest, null);
const now = buildBookingResultsCatalog(manifest, readSelectionManifest());
const heldIds = new Set(RELEASE_HOLDS.map((h) => h.driveFileId));
// Local originals on hold (people) or excluded earlier for people, by room (PHOTOGRAPHY.md, 22–23/10).
const PEOPLE_EXCLUDED: Record<string, string[]> = { "blue-moon": ["4 (1).png", "24.png"] };

const rows = [];
for (const p of now) {
  for (const room of p.rooms) {
    const b = before.find((x) => x.id === p.id)!.rooms.find((r) => r.id === room.id)!;
    const folder = folderFor(room.name);
    const sel = selectionForRoom(room.id);
    const held = [
      ...RELEASE_HOLDS.filter((h) => slug(h.folderTitle) === room.id).map((h) => `${h.file} (person)`),
      ...sel.filter((i) => i.hold).map((i) => `img ${String(i.n).padStart(2, "0")} = ${i.originalFilename} (person)`),
      ...(PEOPLE_EXCLUDED[room.id] ?? []).map((f) => `${f} (person)`),
    ];
    // Distinct photographs: a selected image that "replaces" a key is the same photograph.
    const lost = b.photos.filter((ph) => !room.photos.some((x) => x.id === ph.id) && !sel.some((i) => i.replaces === ph.id));
    // G2 stored Bare Chic One's 1.55.png under the manifest key "bare-chic"; its record id is bare-chic-one-1-55.
    const shownDriveIds = new Set(room.photos.map((ph) => photoDrive.get(ph.id === "bare-chic-one-1-55" ? "bare-chic" : ph.id)).filter(Boolean));
    const shownNames = new Set(sel.filter((i) => !i.hold).map((i) => i.originalFilename));
    const notLocal = folder ? folder.files.filter((f) => !shownDriveIds.has(f.id) && !shownNames.has(f.name) && !heldIds.has(f.id) && !held.some((h) => h.startsWith(f.name))) : [];
    rows.push({
      property: p.name, propertyId: p.id, room: room.name, roomId: room.id,
      driveFolder: folder ? `${folder.title} (${folder.id})` : "—", driveFiles: folder?.files.length ?? null,
      approvedBefore: b.photos.length, approvedBeforeIds: b.photos.map((x) => x.id),
      cover: sel.find((i) => !i.hold) ? `img ${String(sel.find((i) => !i.hold)!.n).padStart(2, "0")}` : sel.length ? "held → kept earlier cover" : "— (none selected)",
      accessibleNow: room.photos.length, accessibleNowIds: room.photos.map((x) => x.id),
      lostDistinct: lost.map((x) => x.id),
      held, notYetLocal: notLocal.map((f) => f.name),
    });
  }
}
writeFileSync(`${DIR}/audit.json`, JSON.stringify({ ranAt: new Date().toISOString(), rows }, null, 2) + "\n");
for (const r of rows) console.log([r.property, r.room, r.driveFiles, r.approvedBefore, r.accessibleNow, r.cover, r.lostDistinct.length ? `LOST ${r.lostDistinct}` : "ok", r.held.join("; ") || "-", r.notYetLocal.length].join(" | "));
console.log("covers:", now.map((p) => `${p.id}=${p.coverPhoto?.fallback.src.split("/")[3]}`).join(", "));
console.log("selection images:", SELECTION.length);
