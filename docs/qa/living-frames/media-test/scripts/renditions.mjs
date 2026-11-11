import { createRequire } from "node:module";
import { statSync } from "node:fs";
const require = createRequire(process.cwd() + "/");
const sharp = require("sharp");
const D = "public/dev-fixtures/stock-test";
const jobs = [
  { src: process.argv[2], name: "v1-room-poster", widths: [640, 960, 1280, 1920] },
  { src: `${D}/_source/p1-pexels-25712622.jpeg`, name: "p1-facade", widths: [240, 360, 480, 720, 1200] },
  { src: `${D}/_source/p4-pexels-30455215.jpeg`, name: "p4-detail", widths: [240, 360, 480, 720, 1200] },
];
const rows = [];
for (const job of jobs) {
  for (const w of job.widths) {
    const base = sharp(job.src).rotate().resize({ width: w });
    for (const [ext, make] of [["avif", (i) => i.avif({ quality: 55, effort: 6 })], ["webp", (i) => i.webp({ quality: 74, effort: 6 })], ["jpg", (i) => i.jpeg({ quality: 76, mozjpeg: true })]]) {
      const out = `${D}/${job.name}-${w}.${ext}`;
      const info = await make(base.clone()).toFile(out);
      rows.push(`${job.name}-${w}.${ext}\t${info.width}x${info.height}\t${(statSync(out).size / 1024).toFixed(1)} KB`);
    }
  }
}
console.log(rows.join("\n"));
const tiny = await sharp(process.argv[2]).resize(32, 18).webp({ quality: 50 }).toBuffer();
console.log("PREVIEW data:image/webp;base64," + tiny.toString("base64"));
