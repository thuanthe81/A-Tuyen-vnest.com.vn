// Pixel regression for the existing prototypes (03.3-C1, 16/10/2026).
// Captures /a, /a-original, /b and /b-original at 390, 768 and 1440 px, all brands and Bare chosen,
// full page, with reduced motion so entrance animations cannot differ between runs.
// Usage:
//   node docs/qa/brand-collection/scripts/regress.mjs capture <label>   # e.g. baseline, after
//   node docs/qa/brand-collection/scripts/regress.mjs compare <labelA> <labelB>
import { mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { BASE, HIDE_DEV, launch, OUT, Page, quit, sharp, sleep } from "./lib.mjs";

const ROOT = `${OUT}/b-client/regression`;
// ROUTES=b-client,b … to capture other routes (default: the four existing prototypes).
const ROUTES = process.env.ROUTES ? process.env.ROUTES.split(",") : ["a", "a-original", "b", "b-original"];
const VIEWS = [
  { name: "390", w: 390, h: 844, dpr: 2, mobile: true },
  { name: "768", w: 768, h: 1024, dpr: 2, mobile: true },
  { name: "1440", w: 1440, h: 900, dpr: 1, mobile: false },
];
// Concept A's panels are buttons, B's index entries are radios; both are named after the brand.
const CHOOSE_BARE = `(document.querySelector('[role=radio][aria-label^="Bare Boutique Stays"]') ?? document.querySelector('button[aria-label^="Bare Boutique Stays"]')).click()`;

const [mode, a, b] = process.argv.slice(2);

if (mode === "capture") {
  const dir = `${ROOT}/${a}`;
  mkdirSync(dir, { recursive: true });
  console.log(await launch());
  for (const route of ROUTES) {
    for (const view of VIEWS) {
      const p = await Page.open();
      await p.viewport(view.w, view.h, view.dpr, view.mobile);
      await p.media({ "prefers-reduced-motion": "reduce" });
      await p.goto(`${BASE}/dev/brand-collection/${route}`, { settle: 1500 });
      await p.eval(HIDE_DEV);
      // HIDE_IMAGES=1 compares layout only: real photographs can decode or pick a srcset size
      // differently from run to run, which is not a layout change.
      if (process.env.HIDE_IMAGES) await p.eval(`(() => { const s = document.createElement("style"); s.textContent = "img{visibility:hidden!important}"; document.head.append(s); })()`);
      await sleep(300);
      await p.shot(`${dir}/${route}-${view.name}-all.png`, { full: true });
      await p.eval(CHOOSE_BARE);
      await sleep(900);
      await p.eval("scrollTo(0, 0)");
      await sleep(300);
      await p.shot(`${dir}/${route}-${view.name}-bare.png`, { full: true });
      await p.close();
      console.log(route, view.name);
    }
  }
  quit();
} else if (mode === "compare") {
  const files = readdirSync(`${ROOT}/${a}`).filter((f) => f.endsWith(".png") && (!process.env.ROUTES || process.env.ROUTES.split(",").some((r) => f.startsWith(`${r}-`) && /^\d/.test(f.slice(r.length + 1)))));
  const report = {};
  for (const file of files) {
    const [x, y] = await Promise.all([a, b].map((label) => sharp(`${ROOT}/${label}/${file}`).ensureAlpha().raw().toBuffer({ resolveWithObject: true })));
    if (x.info.width !== y.info.width || x.info.height !== y.info.height) {
      report[file] = { sizeA: [x.info.width, x.info.height], sizeB: [y.info.width, y.info.height], differentPixels: "size differs" };
      continue;
    }
    let diff = 0;
    for (let i = 0; i < x.data.length; i += 4) if (x.data[i] !== y.data[i] || x.data[i + 1] !== y.data[i + 1] || x.data[i + 2] !== y.data[i + 2] || x.data[i + 3] !== y.data[i + 3]) diff++;
    report[file] = { size: [x.info.width, x.info.height], differentPixels: diff };
  }
  const changed = Object.entries(report).filter(([, r]) => r.differentPixels !== 0);
  writeFileSync(`${ROOT}/compare-${a}-vs-${b}.json`, JSON.stringify({ files: files.length, changed: changed.length, report }, null, 2));
  console.log(`${files.length} captures compared, ${changed.length} differ`);
  for (const [file, r] of changed) console.log(" ", file, r.differentPixels);
} else {
  console.log("usage: regress.mjs capture <label> | compare <labelA> <labelB>");
}
