// Google Maps embed verification (25/10/2026): both property pages at 1440, 768 and 390.
//   BASE=http://localhost:3402 node docs/qa/v3-final-2026-10-25/scripts/map.mjs
// Checks: no iframe before the section is near, official embed src and title after scrolling, Google's
// map actually painted (screenshot pixels, not just the DOM), layout share, mobile scroll not captured.
// Writes shots/map-*.jpg and map-results.json. Headless Chrome emulation, not a physical device.
import { mkdirSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
const ROOT = "/Users/noe/Documents/GitHub/VNest 2";
const { launch, quit, Page, sleep, sharp } = await import(pathToFileURL(`${ROOT}/docs/qa/brand-collection/scripts/lib.mjs`).href);
const BASE = process.env.BASE ?? "http://localhost:3402";
const OUT = `${ROOT}/docs/qa/v3-final-2026-10-25`;
mkdirSync(`${OUT}/shots`, { recursive: true });
const VIEWS = [
  { name: "1440", w: 1440, h: 900, dpr: 1, mobile: false },
  { name: "768", w: 768, h: 1024, dpr: 1, mobile: true },
  { name: "390", w: 390, h: 844, dpr: 2, mobile: true },
];
const PAGES = [
  ["bare-chic", "/dev/stays/bare-chic?view=demo", "0x317529bd65e9671d%3A0x1aff14577a350dd4"],
  ["the-nang-suites", "/dev/stays/the-nang-suites", "0x3142172062a243ed%3A0xbf1dc451da67c4c2"],
];
const results = { base: BASE, date: "2026-10-25", note: "Headless Chrome, device emulation", views: [] };
console.log(await launch());
for (const view of VIEWS) {
  const r = { view: view.name, checks: {} };
  const p = await Page.open();
  const requests = [];
  p.on("Network.requestWillBeSent", (e) => /google\.com\/maps\/embed/.test(e.request.url) && requests.push(e.request.url));
  await p.viewport(view.w, view.h, view.dpr, view.mobile);
  for (const [slug, path, place] of PAGES) {
    requests.length = 0;
    await p.goto(BASE + path, { settle: 2000 });
    const early = await p.eval(`({ iframe: !!document.querySelector("#vi-tri iframe") })`);
    await p.eval(`(() => { const m = document.getElementById("vi-tri"); m.scrollIntoView({ block: "start", behavior: "instant" }); scrollBy(0, -90); })()`);
    let state = "";
    for (let i = 0; i < 30 && state !== "loaded" && state !== "failed"; i++) {
      await sleep(500);
      state = await p.eval(`document.querySelector("#vi-tri [data-map-state]").dataset.mapState`);
    }
    await sleep(2500); // let Google paint its tiles after the iframe load event
    const info = await p.eval(`(() => { const m = document.querySelector("#vi-tri [data-map-state]"); const f = m.querySelector("iframe"); const b = m.getBoundingClientRect(); const c = m.parentElement.getBoundingClientRect(); const i = m.parentElement.querySelector("[class*=info]").getBoundingClientRect(); return { src: f?.src ?? null, title: f?.title ?? null, loading: f?.loading, w: Math.round(b.width), h: Math.round(b.height), share: Math.round((b.width / c.width) * 100), mapAbove: b.bottom <= i.top + 1, sideBySide: Math.abs(b.top - i.top) < 2, rect: { x: b.x + scrollX, y: b.y + scrollY, width: b.width, height: b.height }, overflow: document.documentElement.scrollWidth > ${view.w} }; })()`);
    const file = `${OUT}/shots/map-${view.name}-${slug}.jpg`;
    const buf = await p.shot(null, { clip: info.rect });
    await sharp(buf).jpeg({ quality: 85 }).toFile(file);
    // Painted? A loaded Google map has many distinct colours; the fallback panel is flat beige + text.
    const { data, info: px } = await sharp(buf).resize(80, 50, { fit: "fill" }).raw().toBuffer({ resolveWithObject: true });
    const colours = new Set();
    for (let k = 0; k < data.length; k += px.channels) colours.add(`${data[k] >> 3},${data[k + 1] >> 3},${data[k + 2] >> 3}`);
    // Mobile scroll: a one-finger vertical drag that starts on the map must still scroll the page.
    let scrolls = null;
    if (view.mobile) {
      const before = await p.eval("scrollY");
      const c = { x: info.rect.x + info.rect.width / 2, y: info.rect.y - (await p.eval("scrollY")) + info.rect.height / 2 };
      await p.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: c.x, y: c.y }] });
      for (let s = 1; s <= 8; s++) {
        await p.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: c.x, y: c.y - s * 25 }] });
        await sleep(30);
      }
      await p.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      await sleep(600);
      scrolls = (await p.eval("scrollY")) - before;
    }
    r.checks[slug] = { state, earlyIframe: early.iframe, official: !!info.src?.startsWith("https://www.google.com/maps/embed?pb=") && info.src.includes(place), title: info.title, loading: info.loading, size: `${info.w}×${info.h}`, share: info.share, mapAbove: info.mapAbove, sideBySide: info.sideBySide, overflow: info.overflow, distinctColours: colours.size, embedRequests: requests.length, scrollFromMapPx: scrolls };
    console.log(view.name, slug, JSON.stringify(r.checks[slug]));
  }
  results.views.push(r);
  await p.close();
}
quit();
process.exit(0);
writeFileSync(`${OUT}/map-results.json`, JSON.stringify(results, null, 2));
