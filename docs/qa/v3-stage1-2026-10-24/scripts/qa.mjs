// VNest V3 Stage 1 (24/10/2026): interaction QA for R01–R04 at 1440 (mouse), 768 and 390 (touch).
//   BASE=http://localhost:3401 node docs/qa/v3-stage1-2026-10-24/scripts/qa.mjs
// Against `next start`. Writes results.json and step screenshots to ../after/qa-*.png.
import { writeFileSync, mkdirSync } from "node:fs";
import { pathToFileURL } from "node:url";
const ROOT = "/Users/noe/Documents/GitHub/VNest 2";
const { launch, quit, Page, sleep } = await import(pathToFileURL(`${ROOT}/docs/qa/brand-collection/scripts/lib.mjs`).href);
const BASE = process.env.BASE ?? "http://localhost:3400";
const OUT = `${ROOT}/docs/qa/v3-stage1-2026-10-24`;
mkdirSync(`${OUT}/after`, { recursive: true });
const VIEWS = [
  { name: "1440", w: 1440, h: 900, dpr: 1, mobile: false },
  { name: "768", w: 768, h: 1024, dpr: 1, mobile: true },
  { name: "390", w: 390, h: 844, dpr: 2, mobile: true },
];
const CLS = `window.__shifts=[];new PerformanceObserver(l=>{for(const e of l.getEntries())window.__shifts.push({v:e.value,i:e.hadRecentInput})}).observe({type:"layout-shift",buffered:true});`;
// Booking bars a guest can see right now: 02.1 forms (tablet/desktop) and 02.1 pills (phones), on screen, not inert.
const BARS = `(() => {
  const vis = (e) => { if (e.closest("[inert]") || !e.getClientRects().length) return false; const s = getComputedStyle(e); if (s.visibility === "hidden" || +s.opacity === 0) return false; const r = e.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight && r.width > 0; };
  const forms = [...document.querySelectorAll("form[role=search]")].filter((f) => !f.closest("dialog") && vis(f));
  const pills = [...document.querySelectorAll("button[aria-haspopup=dialog]")].filter((b) => b.textContent.startsWith("Tìm chỗ ở") && vis(b));
  return forms.length + pills.length;
})()`;
const FACTS = `(() => ({
  url: location.pathname + location.search,
  overflowX: document.documentElement.scrollWidth > innerWidth,
  brokenImages: [...document.images].filter((i) => i.complete && i.naturalWidth === 0 && i.getClientRects().length).map((i) => i.src),
  cls: +(window.__shifts ?? []).filter((x) => !x.i).reduce((a, x) => a + x.v, 0).toFixed(4),
}))()`;

const results = { base: BASE, date: "2026-10-24", views: [] };
console.log(await launch());

async function at(p, js) {
  return p.eval(`(() => { const e = ${js}; if (!e) return null; e.scrollIntoView({ block: "center", behavior: "instant" }); const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
}
async function press(p, view, js) {
  const c = await at(p, js);
  if (!c) throw new Error(`not found: ${js}`);
  await sleep(200);
  if (view.mobile) await p.tap(c.x, c.y);
  else await p.click(c.x, c.y);
}
async function pressHere(p, view, js) {
  const c = await p.eval(`(() => { const e = ${js}; if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
  if (!c) throw new Error(`not found: ${js}`);
  if (view.mobile) await p.tap(c.x, c.y);
  else await p.click(c.x, c.y);
}
const errors = [];

for (const view of VIEWS) {
  const r = { view: view.name, checks: {} };
  const ok = (name, value, detail) => (r.checks[name] = detail === undefined ? value : { pass: value, ...detail });
  const p = await Page.open();
  p.on("Runtime.exceptionThrown", (e) => errors.push({ view: view.name, text: e.exceptionDetails?.exception?.description?.slice(0, 200) }));
  p.on("Runtime.consoleAPICalled", (e) => e.type === "error" && errors.push({ view: view.name, text: e.args?.map((a) => a.value ?? a.description).join(" ").slice(0, 200) }));
  await p.viewport(view.w, view.h, view.dpr, view.mobile);
  await p.send("Page.addScriptToEvaluateOnNewDocument", { source: CLS });

  // ── Homepage ──
  await p.goto(`${BASE}/dev/demo`, { settle: 2500 });
  const header = await p.eval(`(() => { const h = document.querySelector("header"); const t = h.innerText; const sym = h.querySelector("img"); return { links: [...h.querySelectorAll(":scope > div a, :scope > div button")].filter((e) => e.getClientRects().length).map((e) => e.textContent.trim()), hasOldNav: /Khám phá nơi lưu trú|Về VNest|Hợp tác/.test(t), symbolH: Math.round(sym.getBoundingClientRect().height), wordH: Math.round(h.querySelectorAll("img")[1].getBoundingClientRect().height), height: Math.round(h.getBoundingClientRect().height) }; })()`);
  ok("R01 header: no Khám phá / Về VNest / Hợp tác in the bar", !header.hasOldNav, header);
  const booking = await p.eval(`(() => { const a = [...document.querySelectorAll("header a")].find((x) => x.textContent.trim() === "BOOKING"); if (!a) return null; const s = getComputedStyle(a); const r = a.getBoundingClientRect(); return { href: a.getAttribute("href"), bg: s.backgroundColor, color: s.color, h: Math.round(r.height), w: Math.round(r.width) }; })()`);
  ok("R01 BOOKING present, ≥44px, real link", !!booking && booking.h >= 44 && booking.href.endsWith("#dat-phong"), booking ?? {});
  const heroImgs = await p.eval(`[...document.querySelectorAll("section[aria-roledescription=carousel] img")].map((i) => ({ src: i.currentSrc.split("/").slice(-2).join("/"), done: i.complete && i.naturalWidth > 0 }))`);
  const slides = await p.eval(`document.querySelectorAll("section[aria-roledescription=carousel] [aria-roledescription=slide]").length`);
  ok("R04 carousel: 5 slides, only 1–2 photographs loaded at start", slides === 5 && heroImgs.length <= 2, { slides, mounted: heroImgs });
  ok("bars on first screen = 1", (await p.eval(BARS)) === 1, { count: await p.eval(BARS) });
  await p.shot(`${OUT}/after/qa-${view.name}-home.png`);
  const firstIndex = await p.eval(`[...document.querySelectorAll("[aria-roledescription=slide]")].findIndex((s) => s.getAttribute("aria-hidden") === "false")`);
  await sleep(7000);
  const laterIndex = await p.eval(`[...document.querySelectorAll("[aria-roledescription=slide]")].findIndex((s) => s.getAttribute("aria-hidden") === "false")`);
  ok("R04 auto-advance within ~6 s", laterIndex !== firstIndex, { firstIndex, laterIndex });
  // Keyboard: focus the third dot, Enter → that slide; rotation stops (live region polite).
  await p.eval(`document.querySelectorAll("section[aria-roledescription=carousel] ol button")[2].focus()`);
  await p.key("Enter");
  await sleep(1500);
  const afterDot = await p.eval(`({ current: [...document.querySelectorAll("section[aria-roledescription=carousel] ol button")].findIndex((b) => b.getAttribute("aria-current") === "true"), live: document.querySelector("[aria-roledescription=carousel] [aria-live]").getAttribute("aria-live"), caption: document.querySelector("[aria-roledescription=carousel] p[aria-hidden]")?.textContent })`);
  await sleep(6500);
  const stillDot = await p.eval(`[...document.querySelectorAll("section[aria-roledescription=carousel] ol button")].findIndex((b) => b.getAttribute("aria-current") === "true")`);
  ok("R04 dots keyboard-operable; choosing stops rotation", afterDot.current === 2 && afterDot.live === "polite" && stillDot === 2, { ...afterDot, after6s: stillDot });
  await p.eval(`document.activeElement.blur()`);
  // Prev/next by pointer.
  await press(p, view, `document.querySelector("button[aria-label='Ảnh sau']")`);
  await sleep(300);
  ok("R04 next control", (await p.eval(`[...document.querySelectorAll("section[aria-roledescription=carousel] ol button")].findIndex((b) => b.getAttribute("aria-current") === "true")`)) === 3);
  const textContrast = await p.eval(`(() => { const t = document.getElementById("demo-title").getBoundingClientRect(); const b = document.getElementById("dat-phong").getBoundingClientRect(); return { titleInHero: t.top > 0, bookingInFirstScreen: b.bottom <= innerHeight }; })()`);
  ok("hero: heading and booking bar inside the first screen", textContrast.titleInHero && textContrast.bookingInFirstScreen, textContrast);

  // BOOKING opens the hero bar's dates.
  await p.eval(`window.scrollTo(0, 0)`);
  await sleep(300);
  await pressHere(p, view, `[...document.querySelectorAll("header a")].find((x) => x.textContent.trim() === "BOOKING")`);
  await sleep(900);
  const opened = await p.eval(`({ calendar: !!document.querySelector("form[role=search] [role=dialog] [role=grid], form[role=search] div[role=dialog]"), sheet: !!document.querySelector("dialog[open] form[role=search]") })`);
  ok("R01 BOOKING opens the booking dates", view.mobile && view.w < 768 ? opened.sheet : opened.calendar, opened);
  await p.shot(`${OUT}/after/qa-${view.name}-booking-open.png`);
  await p.key("Escape");
  await p.eval(`document.querySelector("dialog[open]")?.close()`);
  await sleep(400);

  // Scrolled: the header carries the compact bar; still one bar.
  await p.eval(`window.scrollTo(0, document.querySelector("#kham-pha").getBoundingClientRect().top + scrollY + 200)`);
  await sleep(900);
  const scrolled = await p.eval(`({ bars: ${BARS}, headerTop: Math.round(document.querySelector("header").getBoundingClientRect().top), bookingHidden: ![...document.querySelectorAll("header a")].some((x) => x.textContent.trim() === "BOOKING"), cta: [...document.querySelectorAll("header [data-booking-slot] button, header [data-booking-slot] span")].some((e) => e.textContent.trim() === "BOOK NOW" && e.getClientRects().length) })`);
  ok("R02 homepage scrolled: one bar, in the header, BOOK NOW", scrolled.bars === 1 && scrolled.headerTop === 0 && scrolled.cta, scrolled);
  await p.shot(`${OUT}/after/qa-${view.name}-home-scrolled.png`);
  Object.assign(r, { home: await p.eval(FACTS) });

  // Menu still reaches everything; Escape closes; focus returns.
  await pressHere(p, view, `document.querySelector("header button[aria-haspopup=dialog]:not([data-field])") && [...document.querySelectorAll("header > div button")].find((b) => b.textContent.includes("Mở menu"))`);
  await sleep(500);
  const menu = await p.eval(`[...document.querySelectorAll("dialog[open] nav a")].map((a) => a.textContent.replace(/^\\d+/, "").trim())`);
  await p.key("Escape");
  await sleep(300);
  const back = await p.eval(`document.activeElement?.textContent.includes("Menu") ?? false`);
  ok("menu keeps Khám phá, Về VNest, Hợp tác, Liên hệ; Escape returns focus", menu.length === 4 && back, { menu, focusBack: back });

  // ── Bare Chic demo ──
  await p.goto(`${BASE}/dev/stays/bare-chic?view=demo`, { settle: 2500 });
  ok("R02 property top: one bar", (await p.eval(BARS)) === 1, { count: await p.eval(BARS) });
  await p.shot(`${OUT}/after/qa-${view.name}-property.png`);
  await p.eval(`window.scrollTo(0, 2200)`);
  await sleep(700);
  ok("R02 property scrolled: one bar", (await p.eval(BARS)) === 1, { count: await p.eval(BARS) });
  await p.eval(`window.scrollTo(0, 0)`);
  await sleep(300);
  await press(p, view, `document.querySelector("ul[aria-label*='ảnh'] li button")`);
  await sleep(1500);
  const viewer = await p.eval(`(() => { const d = document.querySelector("dialog[open]"); const img = d.querySelector("figure img").getBoundingClientRect(); const cta = [...d.querySelectorAll("button")].find((b) => b.textContent.includes("BOOK NOW")).getBoundingClientRect(); const close = d.querySelector("button[aria-label='Đóng']").getBoundingClientRect(); const over = (a, b) => !(a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top); return { ctaH: Math.round(cta.height), overPhoto: over(cta, img), overClose: over(cta, close), inViewport: cta.bottom <= innerHeight && cta.right <= innerWidth }; })()`);
  ok("R03 viewer BOOK NOW visible, ≥44px, not over photo or close", viewer.ctaH >= 44 && !viewer.overPhoto && !viewer.overClose && viewer.inViewport, viewer);
  await p.shot(`${OUT}/after/qa-${view.name}-viewer.png`);
  await pressHere(p, view, `[...document.querySelectorAll("dialog[open] button")].find((b) => b.textContent.includes("BOOK NOW"))`);
  await sleep(1200);
  const noDates = await p.eval(`({ viewerClosed: !document.querySelector("dialog[open] figure"), datesOpen: !!document.querySelector("header form[role=search] div[role=dialog]") || !!document.querySelector("dialog[open] form[role=search]") })`);
  ok("R03 BOOK NOW without dates: viewer closes, booking dates open", noDates.viewerClosed && noDates.datesOpen, noDates);
  await p.eval(`document.querySelector("dialog[open]")?.close()`);
  await p.key("Escape");

  // With a stay in the address: the drawer's BOOK NOW carries property, dates, guests and room.
  await p.goto(`${BASE}/dev/stays/bare-chic?view=demo&checkIn=2026-11-06&checkOut=2026-11-08&adults=3`, { settle: 2500 });
  const barShows = await p.eval(`document.querySelector("header [data-booking-slot]").innerText.replace(/\\n/g, " ")`);
  await press(p, view, `[...document.querySelectorAll("button")].filter((b) => b.textContent.startsWith("Xem chi tiết phòng"))[1]`);
  await sleep(1200);
  await p.shot(`${OUT}/after/qa-${view.name}-drawer.png`);
  await pressHere(p, view, `[...document.querySelectorAll("dialog[open] button")].find((b) => b.textContent.includes("BOOK NOW"))`);
  await sleep(2500);
  const step = await p.eval(`({ url: location.pathname + location.search, scrollY, h1: document.querySelector("h1")?.textContent, summary: document.querySelector("aside")?.innerText.replace(/\\n/g, " | "), notice: /hoàn thiện|chưa kết nối/.test(document.body.innerText), fake: /xác nhận đặt phòng|đặt phòng thành công|còn \\d+ phòng|confirmed/i.test(document.body.innerText) })`);
  ok("R03 drawer BOOK NOW → Booking Results with property, dates, 3 guests, room", step.url.includes("property=bare-chic") && step.url.includes("adults=3") && (step.url.includes("room=Bare+Chic+Two") || step.url.includes("prefs=bare-chic-two")) && step.scrollY === 0, { bar: barShows, ...step });
  ok("no fake booking: not-connected notice, no confirmation or availability wording", step.notice && !step.fake);
  await p.shot(`${OUT}/after/qa-${view.name}-step.png`, { full: true });
  ok("booking step: one bar", (await p.eval(BARS)) === 1);
  Object.assign(r, { step: await p.eval(FACTS) });
  await press(p, view, `[...document.querySelectorAll("main a")].find((a) => a.textContent.includes("Xem trang cơ sở Bare Chic") || a.textContent.startsWith("Xem các loại phòng"))`);
  await sleep(2500);
  const rooms = await p.eval(`({ url: location.pathname + location.search + location.hash, bar: document.querySelector("header [data-booking-slot]").innerText.replace(/\\n/g, " ") })`);
  ok("step → Bare Chic demo page, same stay in the bar", rooms.url.includes("view=demo") && /6 thg 11/.test(rooms.bar), rooms);
  Object.assign(r, { property: await p.eval(FACTS) });

  // ── The Nắng Suites ──
  await p.goto(`${BASE}/dev/stays/the-nang-suites`, { settle: 2500 });
  ok("R02 Nắng: one bar", (await p.eval(BARS)) === 1);
  Object.assign(r, { nang: await p.eval(FACTS) });
  await p.shot(`${OUT}/after/qa-${view.name}-nang.png`);

  // ── Reduced motion: no automatic rotation ──
  await p.media({ "prefers-reduced-motion": "reduce" });
  await p.goto(`${BASE}/dev/demo`, { settle: 1500 });
  await sleep(7500);
  const reduced = await p.eval(`({ current: [...document.querySelectorAll("section[aria-roledescription=carousel] ol button")].findIndex((b) => b.getAttribute("aria-current") === "true"), toggle: document.querySelector("button[aria-label*='trình chiếu']")?.getAttribute("aria-label") })`);
  ok("R04 reduced motion: stays on slide 1, offers to start", reduced.current === 0 && /Tiếp tục/.test(reduced.toggle), reduced);
  await p.media({});
  await p.close();
  results.views.push(r);
  console.log(view.name, Object.entries(r.checks).filter(([, v]) => (typeof v === "object" ? !v.pass : !v)).map(([k]) => k));
}
results.consoleErrors = errors;
writeFileSync(`${OUT}/results.json`, JSON.stringify(results, null, 1));
console.log("errors", errors.length);
quit();
