// Proves City Notes changed no existing page: full-page captures of the Bare Chic pages and two
// Brand Collection prototypes at 390, 768 and 1440, images hidden (photographs decode differently
// between runs; layout is what is compared), reduced motion. Against `next start` on port 3400.
//   node docs/qa/city-notes/scripts/regress.mjs capture <label>
//   node docs/qa/city-notes/scripts/regress.mjs compare <labelA> <labelB>
import { pathToFileURL } from "node:url";
import { mkdirSync, readdirSync, writeFileSync } from "node:fs";
const ROOT = "/Users/noe/Documents/GitHub/VNest 2";
const { launch, quit, Page, sleep, sharp, HIDE_DEV } = await import(pathToFileURL(`${ROOT}/docs/qa/brand-collection/scripts/lib.mjs`).href);
const BASE = process.env.BASE ?? "http://localhost:3400";
const DIR = `${ROOT}/docs/qa/city-notes/regression`;
const ROUTES = { "bare-chic": "/dev/stays/bare-chic", "bare-chic-public": "/dev/stays/bare-chic?price=public", "bare-chic-20-10": "/dev/stays/bare-chic-20-10", "b-client": "/dev/brand-collection/b-client", b: "/dev/brand-collection/b" };
const VIEWS = [
  { name: "390", w: 390, h: 844, dpr: 1, mobile: true },
  { name: "768", w: 768, h: 1024, dpr: 1, mobile: true },
  { name: "1440", w: 1440, h: 900, dpr: 1, mobile: false },
];
const [mode, a, b] = process.argv.slice(2);

if (mode === "capture") {
  mkdirSync(`${DIR}/${a}`, { recursive: true });
  await launch();
  for (const [name, path] of Object.entries(ROUTES)) {
    for (const view of VIEWS) {
      const p = await Page.open();
      await p.viewport(view.w, view.h, view.dpr, view.mobile);
      await p.media({ "prefers-reduced-motion": "reduce" });
      await p.goto(`${BASE}${path}`, { settle: 1500 });
      await p.eval(HIDE_DEV);
      await p.eval(`(() => { const s = document.createElement("style"); s.textContent = "img,video{visibility:hidden!important}"; document.head.append(s); })()`);
      await p.eval("document.fonts.ready.then(() => true)");
      await sleep(400);
      await p.shot(`${DIR}/${a}/${name}-${view.name}.png`, { full: true });
      await p.close();
    }
    console.log("captured", name);
  }
  quit();
} else if (mode === "compare") {
  const report = {};
  for (const file of readdirSync(`${DIR}/${a}`).filter((f) => f.endsWith(".png"))) {
    const [x, y] = await Promise.all([a, b].map((label) => sharp(`${DIR}/${label}/${file}`).ensureAlpha().raw().toBuffer({ resolveWithObject: true })));
    if (x.info.width !== y.info.width || x.info.height !== y.info.height) {
      report[file] = { differentPixels: "size differs", a: [x.info.width, x.info.height], b: [y.info.width, y.info.height] };
      continue;
    }
    let diff = 0;
    for (let i = 0; i < x.data.length; i += 4) if (x.data[i] !== y.data[i] || x.data[i + 1] !== y.data[i + 1] || x.data[i + 2] !== y.data[i + 2]) diff++;
    report[file] = { size: [x.info.width, x.info.height], differentPixels: diff };
  }
  writeFileSync(`${DIR}/compare-${a}-${b}.json`, JSON.stringify(report, null, 1));
  console.log(JSON.stringify(report, null, 1));
}
