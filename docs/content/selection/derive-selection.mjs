// OWNER IMAGE SELECTION (26/10/2026): web derivatives for the 17 handed-over photographs.
// Local, private review only.
//
//   node --import ./test/register.mjs docs/content/selection/derive-selection.mjs           # check only
//   node --import ./test/register.mjs docs/content/selection/derive-selection.mjs --derive  # write derivatives + manifest
//
// What it enforces:
// - The list is SELECTION in src/content/vnest-workbook/image-selection.ts. Every file must match
//   both that list and the handoff's mapping.csv (file name, byte size, SHA-256), or nothing is written.
// - Originals stay where the owner put them (.local-media/vnest-hero-selection/…, git-ignored); they
//   are only read, never moved, re-encoded or overwritten.
// - Photographs on hold (a visible person, Q15) are not derived at all, so they cannot be served.
// - Output goes to public/dev-client-media/selection/ (git-ignored) with its OWN manifest.json; the
//   older manifest in public/dev-client-media/ is not read or rewritten.
// - The provenance record (no image data) is docs/content/selection/media-record.json.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../../../", import.meta.url));
const require = createRequire(ROOT);
const { SELECTION, SELECTION_AUTHORISATION, SELECTION_SOURCE_DIR } = await import("@/content/vnest-workbook/image-selection");

const SOURCE = `${ROOT}${SELECTION_SOURCE_DIR}`;
const OUT = `${ROOT}public/dev-client-media/selection`;
const RECORD = `${ROOT}docs/content/selection/media-record.json`;
/** Cards use up to ~800 CSS px ×2; the hero is full-bleed, so the original 2048 px width is kept as the top size. */
const WIDTHS = [480, 800, 1200, 1600, 2048];
const FORMATS = [
  { ext: "avif", type: "image/avif", options: { quality: 55 } },
  { ext: "webp", type: "image/webp", options: { quality: 76 } },
  { ext: "jpg", type: "image/jpeg", options: { quality: 82, mozjpeg: true } },
];
const derive = process.argv.includes("--derive");
const sha256 = (buffer) => createHash("sha256").update(buffer).digest("hex");

/** mapping.csv, quoted fields allowed. */
function readMapping() {
  const [header, ...lines] = readFileSync(`${SOURCE}/mapping.csv`, "utf8").trim().split(/\r?\n/);
  const cols = header.split(",");
  return lines.map((line) => {
    const cells = [...line.matchAll(/("([^"]|"")*"|[^,]*)(,|$)/g)].map((m) => m[1].replace(/^"|"$/g, "").replace(/""/g, '"'));
    return Object.fromEntries(cols.map((c, i) => [c, cells[i] ?? ""]));
  });
}

const mapping = readMapping();
const problems = [];
for (const image of SELECTION) {
  const row = mapping.find((r) => Number(r.order) === image.n);
  if (!row) problems.push(`${image.n}: not in mapping.csv`);
  else if (row.package_filename !== image.file || Number(row.bytes) !== image.bytes || row.sha256 !== image.sha256 || row.original_filename !== image.originalFilename || row.room !== image.room)
    problems.push(`${image.n}: registry and mapping.csv disagree`);
  const path = `${SOURCE}/${image.file}`;
  if (!existsSync(path)) problems.push(`${image.n}: ${image.file} missing`);
  else {
    const buffer = readFileSync(path);
    if (buffer.length !== image.bytes || sha256(buffer) !== image.sha256) problems.push(`${image.n}: ${image.file} does not match its recorded size/SHA-256`);
  }
}
if (mapping.length !== SELECTION.length) problems.push(`mapping.csv has ${mapping.length} rows, registry ${SELECTION.length}`);
if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log(`${SELECTION.length} files match mapping.csv and the registry (${SELECTION.filter((i) => i.hold).length} on hold).`);
if (!derive) process.exit(0);

const sharp = require("sharp");
mkdirSync(OUT, { recursive: true });
const manifest = { generatedOn: new Date().toISOString(), note: "Owner image selection, 26/10/2026. Local private review only. Git-ignored.", photos: {} };
const record = { authorisation: SELECTION_AUTHORISATION, source: SELECTION_SOURCE_DIR, images: [] };
for (const image of SELECTION) {
  const dir = `${OUT}/${image.key}`;
  const source = readFileSync(`${SOURCE}/${image.file}`);
  const meta = await sharp(source).metadata();
  const base = { n: image.n, key: image.key, file: image.file, originalFilename: image.originalFilename, propertyId: image.propertyId, room: image.room, bytes: image.bytes, sha256: image.sha256, width: meta.width, height: meta.height, format: meta.format, iccProfile: Boolean(meta.icc) };
  if (image.hold) {
    // Never derived; remove anything a previous run may have left.
    rmSync(dir, { recursive: true, force: true });
    record.images.push({ ...base, derived: false, hold: image.hold });
    console.log(`held    ${image.key} (${image.hold.reason}): not derived`);
    continue;
  }
  mkdirSync(dir, { recursive: true });
  const widths = WIDTHS.filter((w) => w <= meta.width);
  const variants = [];
  for (const width of widths) {
    for (const format of FORMATS) {
      const file = `${dir}/${width}.${format.ext}`;
      // PNG originals are fully opaque (checked 26/10); flatten anyway so JPEG never gets a black matte.
      const info = await sharp(source).rotate().flatten({ background: "#ffffff" }).resize({ width, withoutEnlargement: true }).toColorspace("srgb")[format.ext === "jpg" ? "jpeg" : format.ext](format.options).toFile(file);
      variants.push({ src: file.replace(`${ROOT}public`, ""), type: format.type, width: info.width, height: info.height, bytes: info.size });
    }
  }
  manifest.photos[image.key] = { sha256: image.sha256, width: meta.width, height: meta.height, variants };
  record.images.push({ ...base, derived: true, variants: variants.length });
  console.log(`derived ${image.key}: ${variants.length} files, widths ${widths.join(", ")}`);
}
writeFileSync(`${OUT}/manifest.json`, JSON.stringify(manifest, null, 2) + "\n");
writeFileSync(RECORD, JSON.stringify(record, null, 2) + "\n");
console.log(`Manifest: public/dev-client-media/selection/manifest.json · record: docs/content/selection/media-record.json`);
