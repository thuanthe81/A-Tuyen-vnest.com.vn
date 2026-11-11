// VNest V3 Stage 1 (24/10/2026): before/after captures of the states the CEO commented on.
//   node docs/qa/v3-stage1-2026-10-24/scripts/capture.mjs before|after
// Against `next start` (launch config vnest-v2-client-preview, port 3400). Writes PNGs to ../<phase>/.
import { mkdirSync } from "node:fs";
import { pathToFileURL } from "node:url";
const ROOT = "/Users/noe/Documents/GitHub/VNest 2";
const { launch, quit, Page, sleep } = await import(pathToFileURL(`${ROOT}/docs/qa/brand-collection/scripts/lib.mjs`).href);
const BASE = process.env.BASE ?? "http://localhost:3400";
const PHASE = process.argv[2] ?? "after";
const OUT = `${ROOT}/docs/qa/v3-stage1-2026-10-24/${PHASE}`;
mkdirSync(OUT, { recursive: true });

const VIEWS = [
  { name: "1440", w: 1440, h: 900, dpr: 1, mobile: false },
  { name: "768", w: 768, h: 1024, dpr: 1, mobile: true },
  { name: "390", w: 390, h: 844, dpr: 2, mobile: true },
];
const BARE = "/dev/stays/bare-chic?view=demo";

async function settleImages(p) {
  await p.eval(`Promise.all([...document.images].filter((i) => !i.complete && i.loading !== "lazy").map((i) => new Promise((r) => { i.onload = i.onerror = r; setTimeout(r, 4000); })))`);
  await sleep(400);
}

console.log(await launch());
for (const view of VIEWS) {
  const p = await Page.open();
  await p.viewport(view.w, view.h, view.dpr, view.mobile);
  const shot = (name) => p.shot(`${OUT}/${view.name}-${name}.png`);

  await p.goto(`${BASE}/dev/demo`, { settle: 1500 });
  await settleImages(p);
  await shot("1-home");
  if (view.name === "1440") await p.shot(`${OUT}/1440-1-header.png`, { clip: { x: 0, y: 0, width: 1440, height: 96 } });
  await p.eval(`window.scrollTo(0, document.querySelector("#kham-pha")?.getBoundingClientRect().top + scrollY - 40)`);
  await sleep(900);
  await shot("2-home-scrolled");

  await p.goto(`${BASE}${BARE}`, { settle: 1500 });
  await settleImages(p);
  await shot("3-property-top");
  await p.eval(`window.scrollTo(0, 900)`);
  await sleep(700);
  await shot("4-property-scrolled");

  await p.eval(`window.scrollTo(0, 0); document.querySelector("ul[aria-label*='ảnh'] button")?.click()`);
  await sleep(1500);
  await shot("5-lightbox");
  await p.eval(`document.querySelector("dialog[open]")?.close()`);
  await sleep(300);

  await p.eval(`(() => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent.startsWith("Xem chi tiết phòng")); b?.scrollIntoView({ block: "center" }); b?.click(); })()`);
  await sleep(1500);
  await shot("6-room-drawer");
  await p.close();
  console.log("done", view.name);
}
quit();
