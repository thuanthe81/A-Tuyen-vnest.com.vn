// PEPPER HOUSE ROOM PHOTOGRAPHY, ADDITIVE IMPORT (owner brief V1.1, 4/11/2026).
//
//   node docs/content/pepper-house-2026-11-04/import-pepper-house.mjs           # check only (default): plan, hashes, collisions
//   node docs/content/pepper-house-2026-11-04/import-pepper-house.mjs --apply   # copy originals, derive, merge into the manifest
//
// Additive by construction, unlike docs/content/g2/fetch-photos.mjs --derive (which rewrites the whole manifest and must not be run):
// - the source folder is only read; originals are COPIED (never moved, renamed or modified) and the copy is made read-only;
// - every source file must match its pinned sha256, so a changed or swapped file stops the import;
// - nothing is overwritten: an existing manifest key, derivative folder, original copy or backup stops the import;
// - the current manifest is backed up first, and every existing entry is checked unchanged before the merged manifest is written.
// Same derivative recipe as the earlier imports: 480/800/1200/1600 px, AVIF q55, WebP q74, JPEG q80 (mozjpeg), sRGB, EXIF-rotated.
// Originals and derivatives stay git-ignored (/.local-media/, /public/dev-client-media/).
import { createHash } from "node:crypto";
import { chmodSync, copyFileSync, constants, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../../..");
const SOURCE = "/Users/noe/Documents/VNest Media/Pepper House";
const SET = "VNEST-MEDIA-PEPPER-HOUSE-2026-11-04";
const ORIGINALS = path.join(ROOT, ".local-media/client-photos/pepper-house-2026-11-04");
const PUBLIC_DIR = path.join(ROOT, "public/dev-client-media");
const MANIFEST = path.join(PUBLIC_DIR, "manifest.json");
const BACKUP = path.join(ROOT, ".local-media/backups/manifest.before-pepper-house-2026-11-04.json");
const RECORD = path.join(HERE, "media-record.json");
const WIDTHS = [480, 800, 1200, 1600];
const FORMATS = [
  { ext: "avif", type: "image/avif", options: { quality: 55 } },
  { ext: "webp", type: "image/webp", options: { quality: 74 } },
  { ext: "jpg", type: "image/jpeg", options: { quality: 80, mozjpeg: true } },
];

/**
 * Accepted: new photographs only. The folder "3th-floor" is Pepper House 3rd-floor, "4th-floor" is Pepper House 4th-floor;
 * each image was also checked visually (3rd: pale-blue walls, wood floor, navy sofa; 4th: concrete walls, tan sofa, cement tiles).
 * Already imported, not imported again: 3th-floor/01.jpg (sel-16), 03.jpg (G2 "pepper-house"), 08.jpg (sel-15), 4th-floor/pepperhouse-74.jpg (sel-17).
 * Excluded: 4th-floor/"pepperhouse-72 (1).jpg", byte-identical duplicate of pepperhouse-72.jpg.
 */
const ACCEPTED = [
  { key: "pepper-house-3rd-floor-02", roomId: "pepper-house-3rd-floor", rel: "3th-floor/02.jpg", sha256: "13459ae28b24a7f6" },
  { key: "pepper-house-3rd-floor-04", roomId: "pepper-house-3rd-floor", rel: "3th-floor/04.jpg", sha256: "35ed5da642d4abcd" },
  { key: "pepper-house-3rd-floor-09", roomId: "pepper-house-3rd-floor", rel: "3th-floor/09.jpg", sha256: "b3f656a5168cf614" },
  { key: "pepper-house-4th-floor-72", roomId: "pepper-house-4th-floor", rel: "4th-floor/pepperhouse-72.jpg", sha256: "bc42f29fd0818de7" },
  { key: "pepper-house-4th-floor-76", roomId: "pepper-house-4th-floor", rel: "4th-floor/pepperhouse-76.jpg", sha256: "c72714a8765d2121" },
  { key: "pepper-house-4th-floor-79", roomId: "pepper-house-4th-floor", rel: "4th-floor/pepperhouse-79.jpg", sha256: "664d7d430fa12c28" },
  { key: "pepper-house-4th-floor-81", roomId: "pepper-house-4th-floor", rel: "4th-floor/pepperhouse-81.jpg", sha256: "ba88dbee16a9699a" },
];

const apply = process.argv.includes("--apply");
const sha = (file) => createHash("sha256").update(readFileSync(file)).digest("hex");
const fail = (message) => {
  console.error(`REFUSED: ${message}`);
  process.exit(2);
};

const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
const before = JSON.stringify(manifest.photos);
const plan = ACCEPTED.map((item) => {
  const source = path.join(SOURCE, item.rel);
  if (!existsSync(source)) fail(`missing source ${item.rel}`);
  const hash = sha(source);
  if (!hash.startsWith(item.sha256)) fail(`${item.rel} changed: sha256 ${hash} does not start with ${item.sha256}`);
  if (manifest.photos[item.key]) fail(`manifest already has ${item.key}`);
  if (existsSync(path.join(PUBLIC_DIR, item.key))) fail(`derivative folder exists for ${item.key}`);
  if (existsSync(path.join(ORIGINALS, `${item.key}.jpg`))) fail(`original copy exists for ${item.key}`);
  return { ...item, source, hash, bytes: statSync(source).size };
});
console.log(`${plan.length} photographs, all hashes match, no collisions. Manifest has ${Object.keys(manifest.photos).length} entries.`);
for (const item of plan) console.log(`  ${item.key}  <- ${item.rel}  (${item.roomId})`);
if (!apply) {
  console.log("Check only. Run with --apply to import.");
  process.exit(0);
}

if (existsSync(BACKUP)) fail(`backup already exists: ${BACKUP}`);
mkdirSync(path.dirname(BACKUP), { recursive: true });
copyFileSync(MANIFEST, BACKUP, constants.COPYFILE_EXCL);
chmodSync(BACKUP, 0o444);
mkdirSync(ORIGINALS, { recursive: true });

const sharp = require("sharp");
const records = [];
for (const item of plan) {
  const original = path.join(ORIGINALS, `${item.key}.jpg`);
  copyFileSync(item.source, original, constants.COPYFILE_EXCL);
  chmodSync(original, 0o444);
  if (sha(original) !== item.hash) fail(`copy of ${item.rel} does not match its source`);
  const meta = await sharp(original).metadata();
  const width = meta.orientation && meta.orientation >= 5 ? meta.height : meta.width;
  const height = meta.orientation && meta.orientation >= 5 ? meta.width : meta.height;
  const outDir = path.join(PUBLIC_DIR, item.key);
  mkdirSync(outDir);
  const variants = [];
  for (const w of WIDTHS.filter((value) => value <= width)) {
    for (const format of FORMATS) {
      const file = path.join(outDir, `${w}.${format.ext}`);
      const info = await sharp(original).rotate().resize({ width: w, withoutEnlargement: true }).toColorspace("srgb")[format.ext === "jpg" ? "jpeg" : format.ext](format.options).toFile(file);
      variants.push({ src: `/dev-client-media/${item.key}/${w}.${format.ext}`, type: format.type, width: info.width, height: info.height, bytes: info.size });
    }
  }
  manifest.photos[item.key] = {
    driveFileId: `local:vnest-media:Pepper House/${item.rel}`,
    sha256: item.hash,
    width,
    height,
    rights: "client-supplied-pending",
    set: SET,
    variants,
  };
  records.push({ key: item.key, propertyId: "pepper-house", roomId: item.roomId, sourceRelPath: `Pepper House/${item.rel}`, localOriginal: path.relative(ROOT, original), sha256: item.hash, bytes: item.bytes, width, height, format: meta.format, variantsCount: variants.length });
  console.log(`derived ${item.key}: ${variants.length} files`);
}

// Every entry that existed before is byte-for-byte the same in the merged manifest.
const merged = JSON.parse(before);
for (const [key, value] of Object.entries(merged)) {
  if (JSON.stringify(manifest.photos[key]) !== JSON.stringify(value)) fail(`existing entry ${key} would change`);
}
manifest.updatedOn = new Date().toISOString();
writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));
const provenance = { generatedAt: manifest.updatedOn, set: SET, source: SOURCE, totalImported: records.length, items: records,
  alreadyImported: ["3th-floor/01.jpg (sel-16)", "3th-floor/03.jpg (G2 pepper-house)", "3th-floor/08.jpg (sel-15)", "4th-floor/pepperhouse-74.jpg (sel-17)"],
  excluded: [{ file: "4th-floor/pepperhouse-72 (1).jpg", reason: "byte-identical duplicate of 4th-floor/pepperhouse-72.jpg" }] };
writeFileSync(path.join(ORIGINALS, "provenance.json"), JSON.stringify(provenance, null, 2));
writeFileSync(RECORD, JSON.stringify(provenance, null, 2));
console.log(`Merged: ${Object.keys(manifest.photos).length} entries (was ${Object.keys(merged).length}). Backup: ${path.relative(ROOT, BACKUP)}`);
