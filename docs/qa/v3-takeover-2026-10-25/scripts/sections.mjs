// VNest V3 takeover, 25/10/2026: section captures (Services, Contact, FAQ, Footer) at 1440, 768, 390.
//   BASE=http://localhost:3402 SET=before node docs/qa/v3-takeover-2026-10-25/scripts/sections.mjs
// Run against `next start`. Writes <SET>/<width>-<section>.jpg. Full-page capture, then a crop per
// section, so nothing depends on the sticky header's position.
import { mkdirSync } from "node:fs";
import { pathToFileURL } from "node:url";
const ROOT = "/Users/noe/Documents/GitHub/VNest 2";
const { launch, quit, Page, sleep, sharp } = await import(pathToFileURL(`${ROOT}/docs/qa/brand-collection/scripts/lib.mjs`).href);
const BASE = process.env.BASE ?? "http://localhost:3402";
const SET = process.env.SET ?? "after";
const OUT = `${ROOT}/docs/qa/v3-takeover-2026-10-25/${SET}`;
mkdirSync(OUT, { recursive: true });
const VIEWS = [
  { name: "1440", w: 1440, h: 900, dpr: 1, mobile: false },
  { name: "768", w: 768, h: 1024, dpr: 1, mobile: true },
  { name: "390", w: 390, h: 844, dpr: 1, mobile: true }, // 1x: a 2x full page exceeds Chrome's capture height and wraps
];
const SECTIONS = { services: "#hop-tac", contact: "#lien-he", faq: "#hoi-dap", footer: "footer" };
console.log(await launch());
for (const view of VIEWS) {
  const p = await Page.open();
  await p.viewport(view.w, view.h, view.dpr, view.mobile);
  await p.media([{ name: "prefers-reduced-motion", value: "reduce" }].reduce((a, f) => ({ ...a, [f.name]: f.value }), {}));
  await p.goto(`${BASE}/dev/demo`, { settle: 2500 });
  // Walk the page once so lazy images load before the full capture.
  await p.eval(`(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); } scrollTo(0, 0); })()`);
  await sleep(1200);
  const rects = await p.eval(`(() => { const out = {}; for (const [k, s] of Object.entries(${JSON.stringify(SECTIONS)})) { const e = document.querySelector(s); if (!e) continue; const r = e.getBoundingClientRect(); out[k] = { x: 0, y: Math.round(r.top + scrollY), w: innerWidth, h: Math.round(r.height) }; } return out; })()`);
  const full = await p.shot(null, { full: true });
  const meta = await sharp(full).metadata();
  for (const [name, r] of Object.entries(rects)) {
    const s = view.dpr;
    const top = Math.max(0, r.y * s);
    const height = Math.min(meta.height - top, r.h * s);
    await sharp(full).extract({ left: 0, top, width: Math.min(meta.width, r.w * s), height }).jpeg({ quality: 84, mozjpeg: true }).toFile(`${OUT}/${view.name}-${name}.jpg`);
  }
  console.log(view.name, Object.keys(rects).join(", "));
  await p.close();
}
quit();
