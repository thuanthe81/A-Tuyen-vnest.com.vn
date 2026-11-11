// G4 acceptance (05.2, 20/10/2026): gallery behaviour and performance of /dev/stays/bare-chic at
// 390 px (touch) and 1440 px (mouse and keyboard), on the client-preview configuration.
// Usage: BASE=http://localhost:3400 node docs/qa/05.2/scripts/g4-acceptance.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { launch, Page, quit, sleep } from "../../brand-collection/scripts/lib.mjs";

const BASE = process.env.BASE ?? "http://localhost:3400";
const URL_ = `${BASE}/dev/stays/bare-chic`;
const DIR = fileURLToPath(new URL("../g4-acceptance/", import.meta.url));
mkdirSync(DIR, { recursive: true });
const OPEN = "dialog[open]";

const PERF_PROBE = `window.__lcp = 0; window.__lcpEl = ""; window.__cls = 0;
new PerformanceObserver((l) => { for (const e of l.getEntries()) { window.__lcp = e.startTime; window.__lcpEl = (e.element?.alt || e.element?.tagName || "") + ""; } }).observe({ type: "largest-contentful-paint", buffered: true });
new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: "layout-shift", buffered: true });`;
const PERF = `(() => { const r = performance.getEntriesByType("resource"); const nav = performance.getEntriesByType("navigation")[0];
  const img = r.filter((e) => e.initiatorType === "img" || /_next\\/image|dev-client-media/.test(e.name));
  const js = r.filter((e) => e.initiatorType === "script" || /\\.js(\\?|$)/.test(e.name));
  return { lcpMs: Math.round(window.__lcp), lcpElement: window.__lcpEl.slice(0, 60), cls: Math.round(window.__cls * 10000) / 10000, loadMs: Math.round(nav.loadEventEnd), images: img.length, imageKB: Math.round(img.reduce((s, e) => s + e.transferSize, 0) / 1024), scripts: js.length, scriptKB: Math.round(js.reduce((s, e) => s + e.transferSize, 0) / 1024), documentKB: Math.round(nav.transferSize / 1024) }; })()`;
const viewer = `(() => { const d = document.querySelector(${JSON.stringify(OPEN)}); if (!d) return { open: false, focus: (document.activeElement?.getAttribute("aria-label") || document.activeElement?.textContent || "").trim().slice(0, 70) }; return { open: true, caption: d.querySelector("p")?.textContent, img: d.querySelector("figure img")?.alt ?? null, focusInside: d.contains(document.activeElement) }; })()`;
const out = { date: new Date().toISOString(), url: URL_ };

console.log(await launch());

// 1. Performance, throttled: slow 4G (150 ms, 1.6 Mbit/s), CPU ×4 on the phone; cache off.
for (const v of [{ name: "390", w: 390, h: 844, dpr: 2, mobile: true, cpu: 4 }, { name: "1440", w: 1440, h: 900, dpr: 1, mobile: false, cpu: 1 }]) {
  const p = await Page.open();
  await p.viewport(v.w, v.h, v.dpr, v.mobile);
  await p.throttle({ network: true, cpu: v.cpu });
  await p.send("Page.addScriptToEvaluateOnNewDocument", { source: PERF_PROBE });
  await p.goto(URL_, { settle: 4000 });
  out[`perf-${v.name}`] = await p.eval(PERF);
  console.log("perf", v.name, JSON.stringify(out[`perf-${v.name}`]));
  await p.close();
}

// 2. Phone, 390 px, touch.
{
  const p = await Page.open();
  p.errors = [];
  p.on("Runtime.exceptionThrown", (e) => p.errors.push(e.exceptionDetails.text));
  await p.viewport(390, 844, 2, true);
  await p.goto(URL_, { settle: 2500 });
  const r = (out.phone = {});
  const strip = await p.eval(`(() => { const u = document.querySelector("main ul[aria-label]"); const b = u.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2, n: u.children.length }; })()`);
  // Swipe through every slide; at each, the counter and the slide's room label must agree with its photograph.
  r.slides = [];
  for (let i = 0; i < strip.n; i++) {
    const state = await p.eval(`(() => { const u = document.querySelector("main ul[aria-label]"); const i = Math.round(u.scrollLeft / u.clientWidth); const li = u.children[i]; const label = li.querySelector("span[aria-hidden]")?.textContent; const name = li.querySelector("button").getAttribute("aria-label"); return { index: i + 1, counter: document.querySelector("main p[aria-hidden]")?.textContent, label, labelMatchesPhoto: name.includes(": " + label + ":") }; })()`);
    r.slides.push(state);
    if (i < strip.n - 1) {
      await p.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: strip.x + 120, y: strip.y }] });
      for (let k = 1; k <= 8; k++) await p.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: strip.x + 120 - k * 30, y: strip.y }] });
      await p.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      await sleep(700);
    }
  }
  await p.shot(`${DIR}/390-last-slide.png`);
  // Tap the current slide: the viewer opens on that photograph, captioned with the same room.
  const tileLabel = r.slides.at(-1).label;
  await p.tap(strip.x, strip.y);
  await sleep(700);
  r.tapOpens = { tileLabel, ...(await p.eval(viewer)) };
  await p.shot(`${DIR}/390-viewer-from-tap.png`);
  // Swipe inside the viewer, both directions.
  const fig = await p.eval(`(() => { const b = document.querySelector(${JSON.stringify(OPEN)} + " figure").getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; })()`);
  const swipe = async (dir) => {
    await p.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: fig.x - dir * 100, y: fig.y }] });
    for (let k = 1; k <= 6; k++) await p.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: fig.x - dir * 100 + dir * k * 30, y: fig.y }] });
    await p.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await sleep(500);
    return (await p.eval(viewer)).caption;
  };
  r.viewerSwipeNext = await swipe(-1);
  r.viewerSwipeBack = await swipe(1);
  // Close with the close button (a tap), and focus returns to the slide that opened it.
  const close = await p.eval(`(() => { const b = document.querySelector(${JSON.stringify(OPEN)} + " button[aria-label='Đóng']").getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; })()`);
  await p.tap(close.x, close.y);
  await sleep(600);
  r.closeButton = await p.eval(viewer);
  r.scrollUnlocked = await p.eval(`document.documentElement.style.overflow === ""`);
  // "Xem tất cả 19 ảnh" → grid → a photo → "Tất cả ảnh" → close.
  const all = await p.eval(`(() => { const b = [...document.querySelectorAll("main button")].find((x) => x.textContent.includes("Xem tất cả")); b.scrollIntoView({ block: "center" }); const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
  await p.tap(all.x, all.y);
  await sleep(700);
  r.grid = await p.eval(`(() => { const d = document.querySelector(${JSON.stringify(OPEN)}); return { open: !!d, groups: [...d.querySelectorAll("h3")].map((h) => h.textContent), thumbnails: d.querySelectorAll("ul button").length }; })()`);
  await p.shot(`${DIR}/390-grid.png`);
  // Each room's gallery from its card, by tap: only that room, count as stated, close, focus back.
  r.rooms = [];
  const buttons = await p.eval(`document.querySelectorAll("#rooms button").length`);
  await p.key("Escape");
  await sleep(400);
  for (let i = 0; i < buttons; i++) {
    const b = await p.eval(`(() => { const b = document.querySelectorAll("#rooms button")[${i}]; b.scrollIntoView({ block: "center" }); const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, text: b.textContent }; })()`);
    await sleep(300);
    await p.tap(b.x, b.y);
    await sleep(600);
    const first = await p.eval(viewer);
    const total = Number(/\/(\d+)/.exec(first.caption ?? "")?.[1] ?? 1);
    const captions = [first.caption];
    for (let k = 1; k < total; k++) captions.push(await swipe(-1));
    const c = await p.eval(`(() => { const b = document.querySelector(${JSON.stringify(OPEN)} + " button[aria-label='Đóng']").getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; })()`);
    await p.tap(c.x, c.y);
    await sleep(500);
    r.rooms.push({ button: b.text, captions, after: await p.eval(viewer) });
  }
  r.errors = p.errors;
  await p.close();
}

// 3. Desktop, 1440 px, keyboard and mouse.
{
  const p = await Page.open();
  p.errors = [];
  p.on("Runtime.exceptionThrown", (e) => p.errors.push(e.exceptionDetails.text));
  await p.viewport(1440, 900, 1, false);
  await p.goto(URL_, { settle: 2500 });
  const r = (out.desktop = {});
  r.tiles = await p.eval(`[...document.querySelectorAll("main ul[aria-label] > li")].filter((li) => li.getClientRects().length).map((li) => ({ label: li.querySelector("span[aria-hidden]").textContent, name: li.querySelector("button").getAttribute("aria-label").slice(0, 40) }))`);
  // Keyboard: focus the third tile, Enter, ArrowLeft twice (wraps across rooms), Escape.
  await p.eval(`document.querySelectorAll("main ul[aria-label] button")[2].focus()`);
  await p.key("Enter");
  await sleep(600);
  r.open = await p.eval(viewer);
  await p.key("ArrowLeft", { vk: 37 });
  await sleep(300);
  r.left1 = (await p.eval(viewer)).caption;
  await p.key("ArrowLeft", { vk: 37 });
  await sleep(300);
  r.left2 = (await p.eval(viewer)).caption;
  await p.key("Escape");
  await sleep(400);
  r.afterEscape = await p.eval(viewer);
  // Mouse: click the large tile, then the close button.
  const tile = await p.eval(`(() => { const r = document.querySelector("main ul[aria-label] button").getBoundingClientRect(); return { x: r.left + 100, y: r.top + 100 }; })()`);
  await p.click(tile.x, tile.y);
  await sleep(600);
  r.clickOpen = await p.eval(viewer);
  const close = await p.eval(`(() => { const b = document.querySelector(${JSON.stringify(OPEN)} + " button[aria-label='Đóng']").getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; })()`);
  await p.click(close.x, close.y);
  await sleep(500);
  r.afterClose = await p.eval(viewer);
  r.errors = p.errors;
  await p.close();
}

writeFileSync(`${DIR}/results.json`, JSON.stringify(out, null, 2));
quit();
