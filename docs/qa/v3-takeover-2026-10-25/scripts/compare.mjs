// Before/after sheet per width: rows Services, Contact, FAQ, Footer; left before, right after.
//   node docs/qa/v3-takeover-2026-10-25/scripts/compare.mjs
import { createRequire } from "node:module";
const require = createRequire("/Users/noe/Documents/GitHub/VNest 2/");
const sharp = require("sharp");
const DIR = "/Users/noe/Documents/GitHub/VNest 2/docs/qa/v3-takeover-2026-10-25";
for (const [w, col] of [["1440", 900], ["768", 600]]) {
  const rows = [];
  for (const s of ["services", "contact", "faq", "footer"]) {
    const pair = await Promise.all(["before", "after"].map(async (set) => sharp(`${DIR}/${set}/${w}-${s}.jpg`).resize({ width: col }).toBuffer({ resolveWithObject: true })));
    const h = Math.max(...pair.map((p) => p.info.height));
    rows.push({ pair, h });
  }
  const gap = 24;
  const height = rows.reduce((a, r) => a + r.h + gap, gap);
  const composites = [];
  let y = gap;
  for (const r of rows) {
    r.pair.forEach((p, i) => composites.push({ input: p.data, left: gap + i * (col + gap), top: y }));
    y += r.h + gap;
  }
  await sharp({ create: { width: col * 2 + gap * 3, height, channels: 3, background: "#d9d3c9" } }).composite(composites).jpeg({ quality: 80, mozjpeg: true }).toFile(`${DIR}/before-after-${w}.jpg`);
  console.log(w, "ok");
}
