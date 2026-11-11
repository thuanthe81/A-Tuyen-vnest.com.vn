// VNest V3 Stage 2/3 proposals (24/10/2026): full-page captures at 1440 and 390, plus the
// hover/focus preview state at 1440. Against `next start`.
//   BASE=http://localhost:3401 node docs/qa/v3-stage1-2026-10-24/scripts/proposals.mjs
import { mkdirSync } from "node:fs";
import { pathToFileURL } from "node:url";
const ROOT = "/Users/noe/Documents/GitHub/VNest 2";
const { launch, quit, Page, sleep } = await import(pathToFileURL(`${ROOT}/docs/qa/brand-collection/scripts/lib.mjs`).href);
const BASE = process.env.BASE ?? "http://localhost:3400";
const OUT = `${ROOT}/docs/qa/v3-stage1-2026-10-24/proposals`;
mkdirSync(OUT, { recursive: true });
const SHOTS = [
  ["brand-a", ""], ["brand-a", "&state=preview"], ["brand-b", ""], ["brand-b", "&state=preview"], ["services-a", ""], ["services-b", ""],
];
console.log(await launch());
for (const view of [{ name: "1440", w: 1440, h: 900, dpr: 1, mobile: false }, { name: "390", w: 390, h: 844, dpr: 2, mobile: true }]) {
  for (const [p, state] of SHOTS) {
    if (state && view.name === "390") continue;
    const page = await Page.open();
    await page.viewport(view.w, view.h, view.dpr, view.mobile);
    await page.goto(`${BASE}/dev/v3-proposals?p=${p}${state}`, { settle: 1200 });
    await page.eval(`Promise.all([...document.images].map((i) => (i.loading = "eager", i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; setTimeout(r, 4000); }))))`);
    await sleep(500);
    const overflow = await page.eval(`document.documentElement.scrollWidth > innerWidth`);
    await page.shot(`${OUT}/${p}${state ? "-preview" : ""}-${view.name}.${view.name === "390" ? "jpg" : "jpg"}`, { full: true, quality: 82 });
    console.log(view.name, p, state, overflow ? "OVERFLOW" : "ok");
    await page.close();
  }
}
quit();
