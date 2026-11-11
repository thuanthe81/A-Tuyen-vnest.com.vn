// CEO demo journey QA (23/10/2026), one browser tab, real mouse (1440) and touch (390, 768) input,
// against `next start` (launch config vnest-v2-client-preview, port 3400; `npm run build` first).
//   node docs/qa/demo/scripts/journey.mjs
// /dev/demo: hero and 02.1 bar, sticky hand-over, menu overlay, every section link → Bare Chic card
// → gallery viewer → a room gallery → room drawer (and its hand-over to 02.1's dates) → City Notes
// → VNest mark back. Refined 21/10/2026.
// Records the 1440 and 390 journeys as animated WebP. Writes results.json and screenshots.
import { pathToFileURL } from "node:url";
import { statSync, writeFileSync } from "node:fs";
const ROOT = "/Users/noe/Documents/GitHub/VNest 2";
const { launch, quit, Page, sleep, sharp } = await import(pathToFileURL(`${ROOT}/docs/qa/demo/takeover-2026-10-22/browser.mjs`).href);
const BASE = process.env.BASE ?? "http://localhost:3400";
const OUT = `${ROOT}/docs/qa/demo/takeover-2026-10-22`;
const VIEWS = [
  { name: "1440", w: 1440, h: 900, dpr: 1, mobile: false },
  { name: "390", w: 390, h: 844, dpr: 2, mobile: true },
  { name: "768", w: 768, h: 1024, dpr: 1, mobile: true },
];
const CLS_PROBE = `window.__shifts = []; new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__shifts.push({ value: e.value, input: e.hadRecentInput }); }).observe({ type: "layout-shift", buffered: true });`;
const PAGE_FACTS = `(() => {
  const text = document.body.innerText;
  const imgs = [...document.images].filter((i) => i.getClientRects().length > 0 && i.loading !== "lazy" || i.complete);
  return {
    url: location.pathname + location.search,
    overflowX: document.documentElement.scrollWidth > innerWidth,
    brokenImages: [...document.images].filter((i) => i.complete && i.naturalWidth === 0 && i.getClientRects().length > 0).map((i) => i.currentSrc || i.src),
    cls: (window.__shifts ?? []).filter((x) => !x.input).reduce((a, x) => a + x.value, 0),
    h1: document.querySelector("h1")?.textContent.trim(),
    internal: ["Bản xem trước", "Chờ VNest", "chưa duyệt", "bản xem trước", "Xem như bản công khai", "Ô CHỜ", "ngoài phạm vi"].filter((s) => text.includes(s)),
    questionIds: text.match(/\\bQ\\d{1,2}\\b/g) ?? [],
    figures: text.match(/\\d{1,3}(,\\d{3})+/g) ?? [],
    dataSource: document.querySelectorAll("[data-source]").length,
  };
})()`;

const results = { base: BASE, views: [] };
console.log(await launch());

async function center(p, js) {
  return p.eval(`(() => { const e = ${js}; if (!e) return null; e.scrollIntoView({ block: "center", behavior: "instant" }); const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
}
async function press(p, view, js, label, log) {
  const c = await center(p, js);
  if (!c) throw new Error(`not found: ${label}`);
  await sleep(250);
  if (view.mobile) await p.tap(c.x, c.y);
  else await p.click(c.x, c.y);
  log.push(label);
}
async function waitFor(p, js, ms = 10000) {
  for (let t = 0; t < ms; t += 200) {
    if (await p.eval(js).catch(() => false)) return true;
    await sleep(200);
  }
  return false;
}
const tabs = async () => (await (await fetch("http://127.0.0.1:9334/json/list")).json()).filter((t) => t.type === "page").length;

for (const view of VIEWS) {
  const p = await Page.open();
  const errors = [];
  const failed = [];
  p.on("Runtime.exceptionThrown", (e) => errors.push(e.exceptionDetails?.exception?.description ?? e.exceptionDetails?.text));
  p.on("Runtime.consoleAPICalled", (e) => { if (e.type === "error" || e.type === "warning") errors.push(e.args.map((a) => a.value ?? a.description).join(" ")); });
  p.on("Network.responseReceived", (e) => { if (e.response.status >= 400) failed.push(`${e.response.status} ${e.response.url}`); });
  await p.send("Page.addScriptToEvaluateOnNewDocument", { source: CLS_PROBE });
  await p.viewport(view.w, view.h, view.dpr, view.mobile);
  const frames = [];
  if (view.record) {
    p.on("Page.screencastFrame", (e) => { frames.push({ t: e.metadata.timestamp, data: Buffer.from(e.data, "base64") }); p.send("Page.screencastFrameAck", { sessionId: e.sessionId }).catch(() => undefined); });
  }
  const log = [];
  const r = { view: view.name, steps: log };

  await p.goto(`${BASE}/dev/demo`, { settle: 1500 });
  if (view.record) await p.send("Page.startScreencast", { format: "jpeg", quality: 80, maxWidth: view.w, maxHeight: view.h, everyNthFrame: 1 });
  await p.eval("document.fonts.ready.then(() => true)");
  await sleep(800);
  r.start = await p.eval(PAGE_FACTS);
  // Hero: share of the first screen, poster loaded, no video (none is cleared), the 02.1 bar inside its lower edge.
  r.hero = await p.eval(`(() => {
    const hero = document.querySelector("section[aria-labelledby='demo-title']");
    const h = hero.getBoundingClientRect();
    const img = hero.querySelector("img");
    const bar = [...document.querySelectorAll("button")].find((b) => b.offsetParent !== null && /Tìm kiếm|Tất cả cơ sở|Chọn ngày/.test(b.textContent) && hero.contains(b));
    const b = bar?.getBoundingClientRect();
    return { heightShare: +(h.height / innerHeight).toFixed(2), posterLoaded: img.complete && img.naturalWidth > 0, video: !!hero.querySelector("video"), barInHero: !!b && b.bottom <= h.bottom && b.top >= h.top, barBottomInFirstScreen: !!b && b.bottom <= innerHeight };
  })()`);
  if (view.name !== "768") await p.shot(`${OUT}/${view.name}-1-home.png`);

  // Sticky hand-over: past the floating bar, the compact bar appears; back at the top it goes.
  await p.eval(`scrollTo(0, ${Math.round(view.h * 1.3)})`);
  await sleep(900);
  r.stickyShown = await p.eval(`(() => { const s = [...document.querySelectorAll("div.fixed")].find((d) => d.className.includes("top-0") && d.className.includes("inset-x-0")); return !!s && !s.inert; })()`);
  await p.eval("scrollTo(0, 0)");
  await sleep(700);
  r.stickyHiddenAtTop = await p.eval(`(() => { const s = [...document.querySelectorAll("div.fixed")].find((d) => d.className.includes("top-0") && d.className.includes("inset-x-0")); return !!s && s.inert; })()`);

  // Menu overlay: open, focus stays inside, Escape closes and focus returns; Đóng closes; a link navigates.
  const MENU_BUTTON = `[...document.querySelectorAll("header button")].find((b) => b.textContent.includes("Mở menu"))`;
  await press(p, view, MENU_BUTTON, "menu: open", log);
  await sleep(400);
  r.menuOpen = await p.eval(`!!document.querySelector("dialog[open][aria-label='Menu VNest']")`);
  for (let i = 0; i < 8; i++) await p.key("Tab");
  r.menuFocusTrapped = await p.eval(`!!document.activeElement?.closest("dialog[open]") || document.activeElement === document.body`);
  if (view.name !== "768") await p.shot(`${OUT}/${view.name}-2-menu.png`);
  await p.key("Escape", { vk: 27 });
  await sleep(400);
  r.menuClosedByEscape = await p.eval(`!document.querySelector("dialog[open]")`);
  r.menuFocusRestored = await p.eval(`document.activeElement?.textContent.includes("Mở menu")`);
  await press(p, view, MENU_BUTTON, "menu: open again", log);
  await sleep(300);
  await press(p, view, `[...document.querySelectorAll("dialog[open] button")].find((b) => b.textContent.includes("Đóng"))`, "menu: Đóng", log);
  await sleep(300);
  r.menuClosedByButton = await p.eval(`!document.querySelector("dialog[open]")`);

  // Every homepage link lands on its section, same tab.
  r.sectionLinks = {};
  const top = (id) => p.eval(`Math.round(document.getElementById("${id}").getBoundingClientRect().top)`);
  for (const [label, id] of [["Hợp tác cùng VNest", "hop-tac"], ["Về VNest", "ve-vnest"], ["Liên hệ", "lien-he"], ["Khám phá nơi lưu trú", "kham-pha"]]) {
    await p.eval("scrollTo(0, 0)");
    await sleep(300);
    await press(p, view, MENU_BUTTON, "menu", log);
    await sleep(300);
    await press(p, view, `[...document.querySelectorAll("dialog[open] a")].find((a) => a.textContent.includes(${JSON.stringify(label)}))`, `menu link: ${label}`, log);
    await sleep(1000);
    r.sectionLinks[label] = { closed: await p.eval(`!document.querySelector("dialog[open]")`), hash: await p.eval("location.hash"), top: await top(id) };
  }
  await press(p, view, `[...document.querySelectorAll("a")].find((a) => a.textContent.trim() === "Liên hệ hợp tác")`, "partner CTA", log);
  await sleep(1000);
  r.partnerCta = { hash: await p.eval("location.hash"), top: await top("lien-he") };
  await p.eval(`document.getElementById("hop-tac").scrollIntoView({ block: "start" })`);
  await sleep(400);
  if (view.name !== "768") await p.shot(`${OUT}/${view.name}-3-partner.png`);
  await p.eval(`document.getElementById("ve-vnest").scrollIntoView({ block: "start" })`);
  await sleep(400);
  if (view.name !== "768") await p.shot(`${OUT}/${view.name}-3-about.png`);

  // Into Bare Chic from its card, same tab.
  await press(p, view, `[...document.querySelectorAll("a")].find((a) => a.textContent.trim().startsWith("Bare Chic"))`, "card: Bare Chic", log);
  r.reachedBareChic = await waitFor(p, `location.pathname === "/dev/stays/bare-chic" && document.readyState === "complete" && !!document.querySelector("h1")`);
  await sleep(1500);
  await p.eval("document.fonts.ready.then(() => true)");
  r.tabsAfterCard = await tabs();
  r.bareChic = await p.eval(PAGE_FACTS);
  r.content = await p.eval(`(() => {
    const t = document.body.innerText;
    const map = [...document.querySelectorAll("a")].find((a) => a.textContent.includes("Xem bản đồ"));
    const amen = document.querySelector("section[aria-labelledby='amenities-title']");
    return {
      brand: t.includes("Bare Boutique Stays"),
      address: document.querySelector("address")?.innerText.replace(/\\s+/g, " ").trim(),
      mapHref: map?.href ?? null,
      galleryLabel: document.querySelector("ul[aria-label*='ảnh']")?.getAttribute("aria-label"),
      roomButtons: [...document.querySelectorAll("button")].map((b) => b.textContent.trim()).filter((s) => s.startsWith("Xem ảnh phòng")),
      amenities: [...amen.querySelectorAll("li")].map((li) => li.textContent.trim()),
      amenityDisclosure: !!amen.querySelector("details"),
      amenityIconsNeutral: [...amen.querySelectorAll("svg")].filter((s) => s.querySelector("circle[r='2.5']")).length,
      huynhHoa: document.body.innerHTML.includes("Bánh mì Huỳnh Hoa"),
      oldSpelling: document.body.innerHTML.includes("Huynh Hoa"),
      heldPhotos: ["1-11", "2-32", "1-18"].filter((k) => document.body.innerHTML.includes(k)),
      bookingNote: t.includes("Chưa có hệ thống đặt phòng nào được kết nối"),
    };
  })()`);
  if (view.name !== "768") {
    await p.eval("scrollTo(0, 0)");
    await sleep(300);
    await p.shot(`${OUT}/${view.name}-4-bare-chic.png`);
  }

  // The hero gallery viewer.
  await press(p, view, `document.querySelector("button[aria-label^='Xem ảnh 1/']")`, "gallery: photo 1", log);
  r.viewerOpened = await waitFor(p, `!!document.querySelector("dialog[open]")`, 3000);
  const before = await p.eval(`document.querySelector("dialog[open] img")?.currentSrc ?? ""`);
  await press(p, view, `document.querySelector("dialog[open] button[aria-label='Ảnh sau']")`, "viewer: next", log);
  await sleep(500);
  r.viewerNext = (await p.eval(`document.querySelector("dialog[open] img")?.currentSrc ?? ""`)) !== before;
  await p.key("Escape", { vk: 27 });
  await sleep(500);
  r.viewerClosedByEscape = await p.eval(`!document.querySelector("dialog[open]")`);

  // A room's own gallery, closed with Đóng.
  await press(p, view, `[...document.querySelectorAll("button")].find((b) => b.textContent.trim().startsWith("Xem ảnh phòng"))`, "room: Xem ảnh phòng", log);
  r.roomViewerOpened = await waitFor(p, `!!document.querySelector("dialog[open]")`, 3000);
  await press(p, view, `document.querySelector("dialog[open] button[aria-label='Đóng']")`, "viewer: Đóng", log);
  await sleep(500);
  r.roomViewerClosed = await p.eval(`!document.querySelector("dialog[open]")`);

  // Room drawer: open, photos step, inner scroll, CTA in view, Escape closes, focus returns.
  const DRAWER_BUTTON = `[...document.querySelectorAll("button")].find((b) => b.textContent.startsWith("Xem chi tiết phòng"))`;
  await press(p, view, DRAWER_BUTTON, "room: Xem chi tiết phòng", log);
  await sleep(600);
  const D = `document.querySelector("dialog[open][aria-label^='Chi tiết phòng']")`;
  r.drawer = await p.eval(`(() => { const d = ${D}; if (!d) return { open: false }; const r = d.getBoundingClientRect(); const foot = [...d.querySelectorAll("button")].find((b) => b.textContent.includes("Chọn ngày lưu trú")).getBoundingClientRect(); const body = d.children[1]; const img = d.querySelector("img"); return { open: true, widthShare: +(r.width / innerWidth).toFixed(2), heightShare: +(r.height / innerHeight).toFixed(2), ctaInView: foot.bottom <= innerHeight && foot.top >= 0, bodyScrolls: body.scrollHeight > body.clientHeight, firstImageLoaded: !!img && img.complete && img.naturalWidth > 0, imageClipped: !!img && img.getBoundingClientRect().right > r.right + 1, overflowX: d.scrollWidth > d.clientWidth, text: d.innerText.replace(/\\s+/g, " ").slice(0, 400) }; })()`);
  await press(p, view, `${D}.querySelector("button[aria-label='Ảnh sau']")`, "drawer: next photo", log);
  await sleep(700);
  r.drawerCounter = await p.eval(`${D}.querySelector("[aria-live]")?.textContent`);
  await p.eval(`${D}.children[1].scrollTop = 9999`);
  await sleep(200);
  r.drawerScrolledTo = await p.eval(`${D}.children[1].scrollTop`);
  if (view.name !== "768") await p.shot(`${OUT}/${view.name}-5-room-drawer.png`);
  await p.key("Escape", { vk: 27 });
  await sleep(400);
  r.drawerClosedByEscape = await p.eval(`!document.querySelector("dialog[open]")`);
  r.drawerFocusRestored = await p.eval(`document.activeElement?.textContent.startsWith("Xem chi tiết phòng")`);
  // Its next step opens the 02.1 bar's dates.
  await press(p, view, DRAWER_BUTTON, "room: Xem chi tiết phòng (again)", log);
  await sleep(500);
  await press(p, view, `[...${D}.querySelectorAll("button")].find((b) => b.textContent.includes("Chọn ngày lưu trú"))`, "drawer: Chọn ngày lưu trú", log);
  await sleep(900);
  r.drawerCta = await p.eval(`({ drawerClosed: !document.querySelector("dialog[open][aria-label^='Chi tiết phòng']"), scrollY: Math.round(scrollY), datesOpened: [...document.querySelectorAll("[role=dialog], dialog[open], [aria-expanded=true]")].some((e) => e.getClientRects().length > 0) })`);
  if (view.name !== "768") await p.shot(`${OUT}/${view.name}-6-dates-from-drawer.png`);
  await p.key("Escape", { vk: 27 });
  await sleep(400);

  // City Notes: tab, expand, collapse.
  const S = `document.querySelector("section[aria-labelledby] [role=tablist]").closest("section")`;
  await press(p, view, `${S}.querySelectorAll("[role=tab]")[1]`, "City Notes: Khám phá", log);
  await sleep(300);
  r.cityNotesTab = await p.eval(`${S}.querySelector("[aria-selected=true]").textContent.replace(/\\s+/g, " ").trim()`);
  await press(p, view, `${S}.querySelector("[aria-expanded]")`, "City Notes: Xem tất cả", log);
  await sleep(400);
  r.cityNotesExpanded = await p.eval(`[...${S}.querySelectorAll("li")].filter((li) => li.getClientRects().length > 0).length`);
  if (view.name !== "768") {
    await p.eval(`${S}.scrollIntoView({ block: "start" }); scrollBy(0, -24)`);
    await sleep(300);
    await p.shot(`${OUT}/${view.name}-7-city-notes.png`);
  }
  await press(p, view, `${S}.querySelector("[aria-expanded]")`, "City Notes: Thu gọn", log);
  await sleep(400);
  r.cityNotesCollapsed = await p.eval(`[...${S}.querySelectorAll("li")].filter((li) => li.getClientRects().length > 0).length`);

  // Home with the VNest mark, same tab.
  await p.eval("scrollTo(0, 0)");
  await sleep(300);
  await press(p, view, `document.querySelector("header a[aria-label='VNest, về trang chủ']")`, "VNest mark", log);
  r.logoToStart = await waitFor(p, `location.pathname === "/dev/demo"`);
  await sleep(800);
  r.tabsAtEnd = await tabs();

  if (view.record) {
    await p.send("Page.stopScreencast");
    const fps = 6, t0 = frames[0].t, t1 = frames.at(-1).t + 0.5;
    const picked = [];
    for (let t = t0, i = 0; t <= t1; t += 1 / fps) { while (i + 1 < frames.length && frames[i + 1].t <= t) i++; picked.push(frames[i].data); }
    const scaled = await Promise.all(picked.map((b) => sharp(b).resize({ width: view.record }).png().toBuffer()));
    const file = `${OUT}/journey-${view.name}.webp`;
    await sharp(scaled, { join: { animated: true } }).webp({ quality: 70, effort: 4, loop: 0, delay: picked.map(() => Math.round(1000 / fps)) }).toFile(file);
    r.recording = { file: file.replace(`${ROOT}/`, ""), seconds: +(t1 - t0).toFixed(1), kb: Math.round(statSync(file).size / 1024) };
  }
  r.consoleErrors = errors;
  r.failedRequests = failed;
  results.views.push(r);
  await p.close();
  console.log(view.name, "done");
}

// Full-page captures of the demo view, for the handoff.
for (const view of VIEWS.filter((v) => v.name !== "768")) {
  const p = await Page.open();
  await p.viewport(view.w, view.h, 1, view.mobile);
  await p.goto(`${BASE}/dev/stays/bare-chic?view=demo`, { settle: 1500 });
  // Bring every lazy image in before the full-page capture.
  await p.eval(`(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight / 2) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); } scrollTo(0, 0); })()`);
  await sleep(1200);
  await p.shot(`${OUT}/${view.name}-bare-chic-full.jpg`, { full: true, quality: 72 });
  await p.close();
}
quit();
writeFileSync(`${OUT}/results.json`, JSON.stringify(results, null, 1));
console.log(JSON.stringify(results, null, 1));
