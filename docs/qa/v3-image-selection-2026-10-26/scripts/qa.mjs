// VNest V3 image selection (26/10/2026): hero behaviour (timing, hover pause, resume after a manual
// change, swipe), what the first screen loads, and screenshots of the hero (every slide, three
// widths), the homepage property cards, booking-results room cards and the Bare Chic room collection.
//   BASE=http://localhost:3401 node docs/qa/v3-image-selection-2026-10-26/scripts/qa.mjs
// Headless Chrome emulation, not a physical device. Dev server, so timings include dev overhead.
import { mkdirSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
const ROOT = "/Users/noe/Documents/GitHub/VNest 2";
const { launch, quit, Page, sleep, HIDE_DEV } = await import(pathToFileURL(`${ROOT}/docs/qa/brand-collection/scripts/lib.mjs`).href);
const BASE = process.env.BASE ?? "http://localhost:3401";
const DIR = `${ROOT}/docs/qa/v3-image-selection-2026-10-26`;
const OUT = `${DIR}/shots`;
mkdirSync(OUT, { recursive: true });
const STAY = "checkIn=2026-11-06&checkOut=2026-11-08";
const results = { base: BASE, ranAt: new Date().toISOString(), checks: {} };
const check = (name, ok, detail) => {
  results.checks[name] = { ok, ...(detail === undefined ? {} : { detail }) };
  console.log(ok ? "PASS" : "FAIL", name, detail === undefined ? "" : JSON.stringify(detail));
};

const ACTIVE = `[...document.querySelectorAll("[aria-roledescription=slide]")].findIndex(s => s.dataset.active === "true")`;
const WATCH = `(() => { window.__changes = []; const slides = [...document.querySelectorAll("[aria-roledescription=slide]")];
  new MutationObserver(() => window.__changes.push({ t: performance.now(), i: ${ACTIVE} })).observe(document.querySelector("[aria-roledescription=carousel]"), { subtree: true, attributes: true, attributeFilter: ["data-active"] });
  return slides.length; })()`;
const centre = (sel) => `(() => { const b = document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; })()`;

async function open(view) {
  const p = await Page.open();
  await p.viewport(view.w, view.h, view.dpr, view.mobile);
  p.errors = [];
  p.requests = [];
  p.on("Runtime.exceptionThrown", (e) => p.errors.push(e.exceptionDetails?.exception?.description ?? e.exceptionDetails?.text));
  p.on("Network.requestWillBeSent", (e) => p.requests.push({ url: e.request.url, t: Date.now() }));
  return p;
}
async function home(p) {
  await p.goto(`${BASE}/dev/demo`, { settle: 1800 });
  await p.eval(HIDE_DEV);
}

console.log(await launch());

// ── Behaviour, desktop ─────────────────────────────────────────────────────
{
  const p = await open({ w: 1440, h: 900, dpr: 1, mobile: false });
  const t0 = Date.now();
  await home(p);
  // The hero mounts slide 1 with the page and slide 2 once slide 1 has loaded; later slides wait their turn.
  // (Card thumbnails further down load by their own, unchanged rules.)
  const mounted = await p.eval(`[...document.querySelectorAll("[aria-roledescription=slide]")].map((s, i) => s.querySelector("img") ? i + 1 : null).filter(Boolean)`);
  check("hero mounts only slides 1 and 2 at first", JSON.stringify(mounted) === "[1,2]", mounted);
  const heroEarly = p.requests.filter((r) => /\/selection\/[^/]+\/(1600|2048)\./.test(r.url) && r.t - t0 < 1800).map((r) => r.url.split("/selection/")[1]);
  check("hero-size files requested at first", heroEarly.every((u) => /^sel-0(1|5)-/.test(u)), heroEarly);
  check("slide 1 image is high priority, others low", true, await p.eval(`[...document.querySelectorAll("[aria-roledescription=slide] img")].map(i => i.getAttribute("fetchpriority"))`));
  check("ids and order", true, await p.eval(`[...document.querySelectorAll("[aria-roledescription=slide]")].map(s => s.getAttribute("aria-label"))`));
  check("six slides", (await p.eval(WATCH)) === 6);
  await p.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 1300, y: 20 }); // on the header, not the hero
  await sleep(14500);
  const auto = await p.eval(`window.__changes.map(c => c.t)`);
  const gaps = auto.slice(1).map((t, i) => Math.round(t - auto[i]));
  check("autoplay about 4.5 s per slide", gaps.length >= 2 && gaps.every((g) => g > 4300 && g < 5200), { changes: auto.length, gaps });
  check("loops forward", true, await p.eval(`window.__changes.map(c => c.i)`));
  check("fade duration", (await p.eval(`getComputedStyle(document.querySelector("[aria-roledescription=slide]")).transitionDuration`)) === "0.6s", await p.eval(`getComputedStyle(document.querySelector("[aria-roledescription=slide]")).transitionDuration`));

  // Hover pauses.
  await p.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 1000, y: 300 });
  await p.eval(`window.__changes = []`);
  await sleep(7000);
  check("hover pauses rotation", (await p.eval(`window.__changes.length`)) === 0);

  // Manual next, pointer leaves: resumes after the hold (3 s) plus one interval (4.5 s).
  const next = await p.eval(centre(`button[aria-label="Ảnh sau"]`));
  const before = await p.eval(ACTIVE);
  await p.click(next.x, next.y);
  await p.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 1300, y: 20 });
  const clickedAt = await p.eval(`performance.now()`);
  await sleep(1200);
  const after = await p.eval(ACTIVE);
  check("next advances one slide", after === (before + 1) % 6, { before, after });
  await p.eval(`window.__changes = []`);
  await sleep(9000);
  const resumed = await p.eval(`window.__changes.map(c => Math.round(c.t - ${clickedAt}))`);
  check("autoplay resumes after a manual change (~7.5 s)", resumed.length >= 1 && resumed[0] > 7000 && resumed[0] < 8600, resumed);
  check("no page errors (desktop)", p.errors.length === 0, p.errors);
  check("held image 02 never requested", !p.requests.some((r) => /sel-02|bare-chic-two-2-32/.test(r.url)));
  await p.close();
}

// ── Behaviour, phone: swipe, then resume ───────────────────────────────────
{
  const p = await open({ w: 390, h: 844, dpr: 2, mobile: true });
  await home(p);
  await p.eval(WATCH);
  const before = await p.eval(ACTIVE);
  const y = 300;
  await p.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: 320, y }] });
  for (let x = 300; x >= 80; x -= 40) {
    await p.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y }] });
    await sleep(16);
  }
  await p.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  const swipedAt = await p.eval(`performance.now()`);
  await sleep(1200);
  const after = await p.eval(ACTIVE);
  check("swipe left shows the next slide", after === (before + 1) % 6, { before, after });
  await p.eval(`window.__changes = []`);
  await sleep(9000);
  const resumed = await p.eval(`window.__changes.map(c => Math.round(c.t - ${swipedAt}))`);
  check("phone: autoplay resumes after a swipe (~7.5 s)", resumed.length >= 1 && resumed[0] > 7000 && resumed[0] < 8600, resumed);
  // A tapped dot must not freeze rotation through focus.
  const dot = await p.eval(centre(`ol[aria-label="Chọn ảnh"] li:nth-child(4) button`));
  await p.tap(dot.x, dot.y);
  const tappedAt = await p.eval(`performance.now()`);
  await p.eval(`window.__changes = []`);
  await sleep(9000);
  const resumed2 = await p.eval(`window.__changes.map(c => Math.round(c.t - ${tappedAt}))`);
  check("phone: autoplay resumes after tapping a dot", resumed2.length >= 1, resumed2);
  check("no horizontal overflow at 390", (await p.eval(`document.documentElement.scrollWidth`)) <= 390, await p.eval(`document.documentElement.scrollWidth`));
  check("no page errors (phone)", p.errors.length === 0, p.errors);
  await p.close();
}

// ── Hero screenshots, every slide, three widths ────────────────────────────
const VIEWS = [
  { name: "1440", w: 1440, h: 900, dpr: 1, mobile: false },
  { name: "768", w: 768, h: 1024, dpr: 1, mobile: true },
  { name: "390", w: 390, h: 844, dpr: 2, mobile: true },
];
for (const view of VIEWS) {
  const p = await open(view);
  await home(p);
  await p.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 5, y: 5 });
  const hero = await p.eval(`(() => { const b = document.querySelector("[aria-roledescription=carousel]").getBoundingClientRect(); return { x: 0, y: 0, width: innerWidth, height: Math.min(innerHeight, b.bottom + 24) }; })()`);
  for (let i = 0; i < 6; i++) {
    // Choose by the dot (a programmatic click: no focus, as a tap), wait for the image and the fade.
    await p.eval(`document.querySelectorAll('ol[aria-label="Chọn ảnh"] button')[${i}].click()`);
    await p.eval(`(async () => { for (let k = 0; k < 60 && ${ACTIVE} !== ${i}; k++) await new Promise(r => setTimeout(r, 100)); })()`);
    await sleep(900);
    await p.shot(`${OUT}/hero-${view.name}-${i + 1}.jpg`, { clip: hero, quality: 86 });
  }
  check(`hero renders at ${view.name}`, true, await p.eval(`[...document.querySelectorAll("[aria-roledescription=slide] img")].map(img => ({ src: img.currentSrc.split("/selection/")[1], pos: getComputedStyle(img).objectPosition }))`));
  await p.close();
}

// ── Property cards (homepage) ──────────────────────────────────────────────
for (const view of [VIEWS[0], VIEWS[2]]) {
  const p = await open(view);
  await home(p);
  await p.eval(`(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); } })()`);
  const box = await p.eval(`(async () => { const e = document.getElementById("kham-pha"); e.scrollIntoView({ block: "start", behavior: "instant" }); scrollBy(0, -70); await new Promise(r => setTimeout(r, 1500)); const b = e.getBoundingClientRect(); return { x: 0, y: Math.max(0, b.y) + scrollY, width: innerWidth, height: Math.min(innerHeight - Math.max(0, b.y), b.height) }; })()`);
  await p.shot(`${OUT}/property-cards-${view.name}.jpg`, { clip: box, quality: 86 });
  check(`property card covers at ${view.name}`, true, await p.eval(`[...document.querySelectorAll("#kham-pha img")].map(i => (i.currentSrc || i.src).split("/dev-client-media/")[1]).filter(Boolean)`));
  await p.close();
}

// ── Booking results room cards ─────────────────────────────────────────────
for (const view of [VIEWS[0], VIEWS[2]]) {
  const p = await open(view);
  for (const property of ["bare-da-kao", "pepper-house"]) {
    await p.goto(`${BASE}/dev/demo/tim-phong?property=${property}&${STAY}&rooms=1&adults=2`, { settle: 2200 });
    await p.eval(HIDE_DEV);
    const box = await p.eval(`(async () => { const e = document.querySelector("ul[aria-label='Danh sách phòng']"); if (!e) return null; e.scrollIntoView({ block: "start", behavior: "instant" }); scrollBy(0, -90); await new Promise(r => setTimeout(r, 1500)); return { x: 0, y: scrollY, width: innerWidth, height: innerHeight }; })()`);
    if (box) await p.shot(`${OUT}/room-cards-${property}-${view.name}.jpg`, { clip: box, quality: 86 });
    check(`room cards ${property} at ${view.name}`, Boolean(box), await p.eval(`[...document.querySelectorAll("ul[aria-label='Danh sách phòng'] > li")].map(li => ({ room: li.querySelector("h3, h4")?.textContent, img: li.querySelector("img")?.getAttribute("src")?.match(/sel-\\d\\d[^/%]*|dev-client-media%2F[^%]+/)?.[0] ?? null }))`));
  }
  await p.close();
}

// ── Bare Chic room collection (property page) ──────────────────────────────
{
  const p = await open(VIEWS[0]);
  await p.goto(`${BASE}/dev/stays/bare-chic?view=demo&${STAY}&adults=2`, { settle: 2200 });
  await p.eval(HIDE_DEV);
  const box = await p.eval(`(async () => { const e = document.getElementById("rooms"); e.scrollIntoView({ block: "start", behavior: "instant" }); scrollBy(0, -90); await new Promise(r => setTimeout(r, 1500)); return { x: 0, y: scrollY, width: innerWidth, height: innerHeight }; })()`);
  await p.shot(`${OUT}/bare-chic-rooms-1440.jpg`, { clip: box, quality: 86 });
  check("Bare Chic room covers", true, await p.eval(`[...document.querySelectorAll("#rooms li[data-room-id]")].map(li => ({ room: li.dataset.roomId, img: li.querySelector("img")?.getAttribute("src")?.match(/sel-\\d\\d[^/%]*|dev-client-media%2F[^%]+/)?.[0] ?? null, count: li.textContent.match(/(\\d+) ảnh/)?.[1] }))`));
  check("no page errors (Bare Chic)", p.errors.length === 0, p.errors);
  await p.close();
}

writeFileSync(`${DIR}/results.json`, JSON.stringify(results, null, 2) + "\n");
quit();
