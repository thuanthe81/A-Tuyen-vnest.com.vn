// CLIENT PHOTOGRAPHY PIPELINE (G2 for 03.3-C1, G3 and G4 for 05.2). Local, private review only.
//
//   node docs/content/g2/fetch-photos.mjs            # check: gates, plan, and that Drive still lists the files as recorded
//   node docs/content/g2/fetch-photos.mjs --fetch    # download every authorised file not yet on this machine
//   node docs/content/g2/fetch-photos.mjs --derive   # build web derivatives and the manifest from the originals
//
// Rules this script enforces:
// - The plan is FETCH_PLAN in src/content/vnest-workbook/media.ts. Each item is fetched only if
//   the authorisation recorded for its set covers it, with scope "private-local-review".
// - A download is accepted only if its byte size equals the size Drive listed on 15/10/2026 and
//   it decodes as an image. It is held in memory and written only after those checks.
// - Originals go to .local-media/client-photos/originals/ (ignored, not served), read-only, and are
//   never overwritten or modified: an existing original is re-checked against its recorded sha256.
//   Derivatives and the manifest go to public/dev-client-media/ (ignored).
// - The provenance record (no image data) is docs/content/g2/media-record.json; new items are added.
import { createHash } from "node:crypto";
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../../../", import.meta.url));
const require = createRequire(ROOT);
const { FETCH_PLAN, isAuthorised } = await import(new URL("src/content/vnest-workbook/media.ts", `file://${ROOT.replace(/ /g, "%20")}`).href);

const ORIGINALS = `${ROOT}.local-media/client-photos/originals`;
const PUBLIC_DIR = `${ROOT}public/dev-client-media`;
const RECORD = `${ROOT}docs/content/g2/media-record.json`;
/** Card widths are at most ~390 CSS px (×2 on phones); the stage slice and property frames at most ~1440 px. */
const WIDTHS = [480, 800, 1200, 1600];
const FORMATS = [
  { ext: "avif", type: "image/avif", options: { quality: 55 } },
  { ext: "webp", type: "image/webp", options: { quality: 74 } },
  { ext: "jpg", type: "image/jpeg", options: { quality: 80, mozjpeg: true } },
];

const mode = process.argv.includes("--fetch") ? "fetch" : process.argv.includes("--derive") ? "derive" : "check";
const sha256 = (buffer) => createHash("sha256").update(buffer).digest("hex");
const extOf = (mime) => (mime === "image/png" ? "png" : "jpg");
const originalPath = (item) => `${ORIGINALS}/${item.key}.${extOf(item.mime)}`;
const authorised = (item) => item.authorisation !== null && isAuthorised(item.driveFileId, item.authorisation);
const readRecord = () => (existsSync(RECORD) ? JSON.parse(readFileSync(RECORD, "utf8")) : { images: [] });

/** Reads a public folder page (metadata only: names, ids, sizes) and finds one file in it. */
async function listed(folderId, driveFileId) {
  const html = await (await fetch(`https://drive.google.com/drive/folders/${folderId}`, { headers: { "user-agent": "Mozilla/5.0" } })).text();
  const blob = /_DRIVE_ivd'\] = '(.*?)';/s.exec(html)?.[1];
  if (!blob) return null;
  const text = blob.replace(/\\x([0-9a-fA-F]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16))).replace(/\\\//g, "/").replace(/\\\\u003d/g, "=").replace(/\\\\/g, "\\");
  const entry = JSON.parse(text)[0]?.find((e) => e[0] === driveFileId);
  return entry ? { name: entry[2], mime: entry[3], bytes: entry[13] } : null;
}

if (mode === "check") {
  for (const item of FETCH_PLAN) {
    const now = await listed(item.folderId, item.driveFileId);
    const same = now && now.name === item.file && now.bytes === item.bytes && now.mime === item.mime;
    const here = existsSync(originalPath(item)) ? "on this machine" : "not fetched";
    console.log(`${item.set} ${authorised(item) ? "authorised" : "NOT AUTHORISED"} · ${same ? "Drive unchanged" : `DRIVE CHANGED ${JSON.stringify(now)}`} · ${here} · ${item.key}: ${item.folderTitle} / ${item.file}`);
  }
  process.exit(0);
}

if (mode === "fetch") {
  const sharp = require("sharp");
  mkdirSync(ORIGINALS, { recursive: true });
  const record = readRecord();
  record.images ??= [];
  for (const item of FETCH_PLAN) {
    if (!authorised(item)) {
      console.log(`skipped (not authorised) ${item.key}`);
      continue;
    }
    const target = originalPath(item);
    const recorded = record.images.find((i) => (i.key ?? i.property) === item.key);
    if (existsSync(target)) {
      if (!recorded || sha256(readFileSync(target)) !== recorded.sha256) throw new Error(`${target} exists but does not match its recorded sha256.`);
      console.log(`kept ${item.key} (already here, sha256 verified)`);
      continue;
    }
    const response = await fetch(`https://drive.usercontent.google.com/download?id=${item.driveFileId}&export=download`, { redirect: "follow" });
    const buffer = Buffer.from(await response.arrayBuffer());
    if (!response.ok || buffer.length !== item.bytes) throw new Error(`${item.file}: HTTP ${response.status}, ${buffer.length} B (expected ${item.bytes} B). Nothing written.`);
    const meta = await sharp(buffer).metadata();
    writeFileSync(target, buffer);
    chmodSync(target, 0o444);
    const { authorisation, ...provenance } = item;
    record.images.push({ ...provenance, authorisation: { grantedBy: authorisation.grantedBy, date: authorisation.date, scope: authorisation.scope, reference: authorisation.reference }, sha256: sha256(buffer), width: meta.width, height: meta.height, format: meta.format, hasAlpha: meta.hasAlpha, iccProfile: Boolean(meta.icc), localOriginal: target.replace(ROOT, ""), fetchedOn: new Date().toISOString() });
    console.log(`fetched ${item.key}: ${item.file} ${meta.width}×${meta.height} sha256 ${sha256(buffer).slice(0, 16)}…`);
  }
  writeFileSync(RECORD, JSON.stringify(record, null, 2));
  console.log(`Provenance record: ${RECORD.replace(ROOT, "")}. Next: --derive`);
  process.exit(0);
}

if (mode === "derive") {
  const sharp = require("sharp");
  const record = readRecord();
  const manifest = { generatedOn: new Date().toISOString(), note: "Local private review only (G2, G3, G4). Git-ignored.", photos: {} };
  for (const item of FETCH_PLAN) {
    if (!authorised(item) || !existsSync(originalPath(item))) continue;
    const source = readFileSync(originalPath(item));
    const recorded = record.images.find((i) => (i.key ?? i.property) === item.key);
    if (!recorded || sha256(source) !== recorded.sha256) throw new Error(`${item.key}: the original does not match its recorded sha256.`);
    const dir = `${PUBLIC_DIR}/${item.key}`;
    mkdirSync(dir, { recursive: true });
    const widths = WIDTHS.filter((w) => w < recorded.width).concat(recorded.width <= WIDTHS.at(-1) ? [recorded.width] : []);
    const variants = [];
    for (const width of widths) {
      for (const format of FORMATS) {
        const file = `${dir}/${width}.${format.ext}`;
        const info = await sharp(source).rotate().resize({ width, withoutEnlargement: true }).toColorspace("srgb")[format.ext === "jpg" ? "jpeg" : format.ext](format.options).toFile(file);
        variants.push({ src: file.replace(`${ROOT}public`, ""), type: format.type, width: info.width, height: info.height, bytes: info.size });
      }
    }
    manifest.photos[item.key] = { driveFileId: item.driveFileId, sha256: recorded.sha256, width: recorded.width, height: recorded.height, rights: item.rights, set: item.set, variants };
    console.log(`derived ${item.key}: ${variants.length} files, widths ${widths.join(", ")}`);
  }
  writeFileSync(`${PUBLIC_DIR}/manifest.json`, JSON.stringify(manifest, null, 2));
  console.log(`Manifest: ${PUBLIC_DIR.replace(ROOT, "")}/manifest.json`);
}
