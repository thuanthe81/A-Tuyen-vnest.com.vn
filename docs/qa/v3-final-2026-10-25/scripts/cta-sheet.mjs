// CTA states sheet: rest / hover / keyboard focus at 1440 for both properties.
import { createRequire } from "node:module";
const require = createRequire("/Users/noe/Documents/GitHub/VNest 2/");
const sharp = require("sharp");
const D = "/Users/noe/Documents/GitHub/VNest 2/docs/qa/v3-final-2026-10-25/shots";
const rows = [];
for (const slug of ["bare-chic", "the-nang-suites"]) for (const st of ["rest", "hover", "focus"]) rows.push(await sharp(`${D}/1440-${slug}-cta-${st}.jpg`).toBuffer({ resolveWithObject: true }));
const w = Math.max(...rows.map((r) => r.info.width)), gap = 16;
const h = rows.reduce((a, r) => a + r.info.height + gap, gap);
let y = gap;
const comp = rows.map((r) => { const c = { input: r.data, left: gap, top: y }; y += r.info.height + gap; return c; });
await sharp({ create: { width: w + gap * 2, height: h, channels: 3, background: "#d9d3c9" } }).composite(comp).jpeg({ quality: 85 }).toFile(`${D}/../cta-states-1440.jpg`);
console.log("ok");
