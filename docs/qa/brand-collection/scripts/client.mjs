// QA for /dev/brand-collection/b-client (03.3-C1, 16/10/2026): Concept B with VNest's content.
// Screenshots at 390, 768 and 1440 px; content, combined filters, conflicts, reset and the address
// with real input; keyboard and focus; headings, names, contrast, targets; SEO tags; CLS and LCP.
// Usage (production server recommended for the performance numbers):
//   BASE=http://localhost:3300 node docs/qa/brand-collection/scripts/client.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import { BASE, HIDE_DEV, launch, OUT, Page, quit, sleep } from "./lib.mjs";

const DIR = `${OUT}/b-client`;
mkdirSync(DIR, { recursive: true });
const ROUTE = "/dev/brand-collection/b-client";
const VIEWS = [
  { name: "390", w: 390, h: 844, dpr: 2, mobile: true },
  { name: "768", w: 768, h: 1024, dpr: 2, mobile: true },
  { name: "1440", w: 1440, h: 900, dpr: 1, mobile: false },
];
const DESK = VIEWS[2];
const PHONE = VIEWS[0];

const STATE = `(() => ({
  cards: [...document.querySelectorAll("ul[aria-labelledby] li")].map((li) => li.querySelector("h3").textContent + " / " + (li.querySelector("h3").nextElementSibling.querySelector("button") ?? li.querySelector("h3").nextElementSibling).textContent),
  summary: document.querySelector("[aria-live]").textContent,
  chosen: [...document.querySelectorAll("section [aria-pressed=true], section [aria-checked=true]")].map((e) => e.getAttribute("aria-label")),
  compactCity: document.querySelector("[class*=geoCompact] select")?.value ?? null,
  address: location.search,
}))()`;

const MEASURE = `(() => {
  const section = document.querySelector("section");
  const visible = (e) => e.getClientRects().length > 0 && getComputedStyle(e).visibility !== "hidden";
  const s = section.getBoundingClientRect();
  const grid = document.querySelector("ul[aria-labelledby]");
  const first = grid.querySelector("li > :first-child").getBoundingClientRect();
  const controls = [...document.querySelectorAll("section button, section select, section a, [class*=result] button")].filter(visible);
  const placeholders = [...document.querySelectorAll("[class*=placeholderTag]")].map((t) => t.parentElement);
  return {
    viewport: [innerWidth, innerHeight],
    overflowPx: document.documentElement.scrollWidth - innerWidth,
    sectionHeight: Math.round(s.height),
    sectionTopToFirstCard: Math.round(first.top - s.top),
    index: [...document.querySelectorAll("[role=radio]")].map((r) => r.getAttribute("aria-label")),
    cityChips: [...document.querySelectorAll('[role=group][aria-label="Thành phố"] button')].filter(visible).map((b) => b.getAttribute("aria-label")),
    citySelect: [...document.querySelectorAll("section select")].filter(visible).map((sel) => [...sel.options].map((o) => o.textContent)),
    areaControls: [...document.querySelectorAll("section select, section label")].filter((e) => /Khu vực/.test(e.textContent)).length,
    stage: document.querySelector("[class*=plate]")?.innerText.replace(/\\n+/g, " · "),
    placeholders: placeholders.filter(visible).map((p) => { const r = p.getBoundingClientRect(); const reason = p.querySelector("[class*=placeholderReason]"); return { w: Math.round(r.width), h: Math.round(r.height), tag: p.querySelector("[class*=placeholderTag]").textContent, tagPx: getComputedStyle(p.querySelector("[class*=placeholderTag]")).fontSize, reason: reason && visible(reason) ? reason.textContent : null, reasonPx: reason && visible(reason) ? getComputedStyle(reason).fontSize : null }; }),
    prices: [...document.querySelectorAll("ul[aria-labelledby] li")].map((li) => { const price = li.querySelector("[data-kind]"); const clipped = [...li.querySelectorAll("p, h3")].filter((e) => e.scrollWidth > e.clientWidth + 1).map((e) => e.textContent); const pr = price?.getBoundingClientRect(); const tx = li.querySelector("h3").getBoundingClientRect(); return { name: li.querySelector("h3").textContent, kind: price?.dataset.kind ?? null, text: price ? [...price.children].map((c) => c.textContent).join(" | ") : null, layout: price ? (pr.left > tx.left + 20 ? "beside" : "below") : null, clipped }; }),
    landmarks: { main: document.querySelectorAll("main").length, h1: [...document.querySelectorAll("h1")].map((h) => ({ text: h.textContent, visuallyHidden: h.getBoundingClientRect().width <= 1 })) },
    controlsUnder44: controls.map((e) => { const b = e.getBoundingClientRect(); return { label: (e.getAttribute("aria-label") || e.textContent).trim().slice(0, 40), w: Math.round(b.width), h: Math.round(b.height) }; }).filter((c) => c.w < 44 || c.h < 44),
  };
})()`;

const center = (sel) => `(() => { const e = ${sel}; if (!e) throw new Error("missing: " + ${JSON.stringify(sel)}); e.scrollIntoView({ block: "center" }); const b = e.getBoundingClientRect(); return { x: Math.round(b.left + b.width / 2), y: Math.round(b.top + b.height / 2) }; })()`;
const radio = (name) => `document.querySelector('[role=radio][aria-label^="${name}"]')`;
const chip = (name) => `[...document.querySelectorAll('[role=group][aria-label="Thành phố"] button')].find((b) => b.getClientRects().length && b.getAttribute("aria-label").startsWith("${name}"))`;
const RESET = `[...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "Bỏ lọc")`;

async function open(view, search = "", media) {
  const p = await Page.open();
  p.errors = [];
  p.console = [];
  p.on("Runtime.exceptionThrown", (e) => p.errors.push(e.exceptionDetails.exception?.description?.slice(0, 160) ?? e.exceptionDetails.text));
  p.on("Runtime.consoleAPICalled", (e) => e.type === "error" && p.console.push(e.args.map((a) => a.value ?? a.description).join(" ").slice(0, 200)));
  await p.viewport(view.w, view.h, view.dpr, view.mobile);
  if (media) await p.media(media);
  await p.goto(BASE + ROUTE + search, { settle: 1200 });
  await p.eval(HIDE_DEV);
  return p;
}
const press = async (p, sel, view) => {
  const c = await p.eval(center(sel));
  if (view.mobile) await p.tap(c.x, c.y);
  else await p.click(c.x, c.y);
  await sleep(400);
};
/** City through whichever control the layout shows: chips, or the compact select on phones. */
async function chooseCity(p, view, id, name) {
  const compact = await p.eval(`(() => { const g = document.querySelector("[class*=geoCompact]"); return !!g && getComputedStyle(g).display !== "none"; })()`);
  if (compact) {
    await p.eval(`(() => { const s = document.querySelector("[class*=geoCompact] select"); s.value = "${id}"; s.dispatchEvent(new Event("change", { bubbles: true })); })()`);
    await sleep(400);
  } else await press(p, chip(name), view);
  return compact ? "select" : "chips";
}
/** The six-card collection alone, scrolled into view and clipped to the list. */
async function shootCards(p, file) {
  const box = await p.eval(`(() => { const g = document.querySelector("ul[aria-labelledby]"); g.scrollIntoView({ block: "start" }); const r = g.getBoundingClientRect(); return { x: 0, y: Math.max(0, r.top + scrollY - 16), width: innerWidth, height: Math.min(r.height - 32, 4000) + 32 }; })()`);
  await sleep(300);
  await p.shot(file, { clip: box });
}
const atSection = async (p) => {
  await p.eval(`scrollTo(0, Math.round(document.querySelector("section").getBoundingClientRect().top + scrollY))`);
  await sleep(350);
};

console.log(await launch());
const out = { base: BASE, route: ROUTE, date: new Date().toISOString() };

// ---- 1. Screenshots and measurements: all, Bare, Bare + Đà Nẵng, the conflict note ----
for (const view of VIEWS) {
  const p = await open(view);
  const log = {};
  await atSection(p);
  log.all = { ...(await p.eval(MEASURE)), state: await p.eval(STATE) };
  await p.shot(`${DIR}/${view.name}-all.png`);
  await p.shot(`${DIR}/${view.name}-all-full.jpg`, { full: true, quality: 82 });
  await shootCards(p, `${DIR}/${view.name}-cards.png`);

  await press(p, radio("Bare Boutique Stays"), view);
  await atSection(p);
  log.bare = { ...(await p.eval(MEASURE)), state: await p.eval(STATE) };
  await p.shot(`${DIR}/${view.name}-bare.png`);

  log.cityControl = await chooseCity(p, view, "da-nang", "Đà Nẵng");
  await atSection(p);
  log.bareDaNang = { state: await p.eval(STATE), stage: await p.eval(`document.querySelector("[class*=plate]").innerText`) };
  await p.shot(`${DIR}/${view.name}-bare-da-nang.png`);

  await press(p, radio("Pepper House"), view);
  log.pepperAfterDaNang = { ...(await p.eval(STATE)), note: await p.eval(`document.querySelector("[aria-live] span + span")?.textContent ?? null`) };
  await p.eval(`document.querySelector("[aria-live]").scrollIntoView({ block: "center" })`);
  await sleep(300);
  await p.shot(`${DIR}/${view.name}-conflict-note.png`);

  await press(p, RESET, view);
  log.reset = await p.eval(STATE);
  log.errors = p.errors;
  log.consoleErrors = p.console;
  out[`view-${view.name}`] = log;
  console.log(view.name, log.all.overflowPx, log.all.index, log.reset.summary);
  await p.close();
}

// ---- 1b. Public view (?price=public): no workbook figure anywhere ----
for (const view of [PHONE, DESK]) {
  const p = await open(view, "?price=public");
  out[`public-${view.name}`] = { prices: (await p.eval(MEASURE)).prices, digitsInPriceAreas: await p.eval(`[...document.querySelectorAll("[data-kind]")].some((e) => /\\d/.test(e.textContent))`), errors: p.errors };
  await shootCards(p, `${DIR}/${view.name}-cards-public.png`);
  await p.close();
}

// ---- 1c. Long names: wrapping and price alignment with a name far longer than any real one ----
for (const view of [PHONE, DESK]) {
  const p = await open(view, "", { "prefers-reduced-motion": "reduce" });
  await p.eval(`(() => { const h = document.querySelectorAll("ul[aria-labelledby] h3"); h[0].textContent = "The Nắng Suites Riverside Garden Residence"; h[1].textContent = "Bare Đa Kao"; })()`);
  await sleep(300);
  out[`longName-${view.name}`] = await p.eval(`(() => { const li = document.querySelectorAll("ul[aria-labelledby] li"); return [...li].slice(0, 2).map((l) => { const h = l.querySelector("h3").getBoundingClientRect(); const pr = l.querySelector("[data-kind]").getBoundingClientRect(); const amount = l.querySelector("[data-kind] p:last-child").getBoundingClientRect(); return { name: l.querySelector("h3").textContent, nameLines: Math.round(h.height / parseFloat(getComputedStyle(l.querySelector("h3")).lineHeight)), overlap: pr.left < h.right - 1 && pr.top < h.bottom - 1, priceRight: Math.round(pr.right), cardRight: Math.round(l.getBoundingClientRect().right), amountBottom: Math.round(amount.bottom), cityBottom: Math.round(l.querySelector("h3").nextElementSibling.getBoundingClientRect().bottom), clipped: [...l.querySelectorAll("p, h3")].filter((e) => e.scrollWidth > e.clientWidth + 1).length }; }); })()`);
  await shootCards(p, `${DIR}/${view.name}-cards-long-name.png`);
  await p.close();
}

// ---- 1d. Photographs (G2): chosen file per width, lazy loading, decode, crops ----
const IMAGES = `(() => [...document.querySelectorAll("picture img")].map((img) => { const r = img.getBoundingClientRect(); return { in: img.closest("ul[aria-labelledby]") ? "card" : "stage", property: img.closest("li")?.querySelector("h3")?.textContent ?? null, currentSrc: img.currentSrc.replace(location.origin, ""), rendered: [Math.round(r.width), Math.round(r.height)], natural: [img.naturalWidth, img.naturalHeight], loading: img.getAttribute("loading"), alt: img.getAttribute("alt"), objectPosition: getComputedStyle(img).objectPosition, complete: img.complete }; }))()`;
const FETCHED = `performance.getEntriesByType("resource").filter((e) => e.name.includes("/dev-client-media/")).map((e) => ({ file: e.name.replace(location.origin, ""), kb: Math.round(e.transferSize / 1024), at: Math.round(e.startTime) }))`;
// Also a retina desktop (no screenshots), where too small a file would show as blur.
for (const view of [...VIEWS, { name: "1440x2", w: 1440, h: 900, dpr: 2, mobile: false }]) {
  const shots = view.name !== "1440x2";
  const p = await open(view, "", { "prefers-reduced-motion": "reduce" });
  const log = { beforeScroll: { fetched: await p.eval(FETCHED) } };
  if (shots) await shootCards(p, `${DIR}/${view.name}-cards-photos.png`);
  else await p.eval(`document.querySelector("ul[aria-labelledby]").scrollIntoView()`);
  await sleep(1200);
  log.afterScroll = { fetched: await p.eval(FETCHED), images: await p.eval(IMAGES) };
  await p.eval(`document.querySelector('[role=radio][aria-label^="Bare Boutique Stays"]').click()`);
  await sleep(900);
  await atSection(p);
  if (shots) await p.shot(`${DIR}/${view.name}-stage-bare-photos.png`);
  log.bareStage = await p.eval(IMAGES);
  await p.eval(`document.querySelector('[role=radio][aria-label^="Pepper House"]').click()`);
  await sleep(900);
  await atSection(p);
  if (shots) await p.shot(`${DIR}/${view.name}-stage-pepper-photo.png`);
  log.pepperStage = await p.eval(IMAGES);
  log.errors = p.errors;
  out[`photos-${view.name}`] = log;
  await p.close();
}

// ---- 1e. Lazy loading: with the card grid pushed 4000 px down (test-only CSS injected before the
// page loads), card photographs must wait until the grid nears the viewport; stage photos load at once.
{
  const p = await Page.open();
  await p.viewport(PHONE.w, PHONE.h, PHONE.dpr, PHONE.mobile);
  await p.send("Network.setCacheDisabled", { cacheDisabled: true });
  // Injected as soon as <head> exists, before the parser reaches the images.
  await p.send("Page.addScriptToEvaluateOnNewDocument", { source: `new MutationObserver((_, o) => { if (document.head) { const s = document.createElement("style"); s.textContent = "ul[aria-labelledby]{margin-top:4000px!important}"; document.head.append(s); o.disconnect(); } }).observe(document, { childList: true, subtree: true })` });
  await p.goto(BASE + ROUTE, { settle: 2000 });
  const before = await p.eval(FETCHED);
  const gridTop = await p.eval(`Math.round(document.querySelector("ul[aria-labelledby]").getBoundingClientRect().top)`);
  await p.eval(`document.querySelector("ul[aria-labelledby]").scrollIntoView()`);
  await sleep(2000);
  const after = await p.eval(FETCHED);
  const cards = await p.eval(`[...document.querySelectorAll("ul[aria-labelledby] picture img")].map((i) => i.currentSrc.replace(location.origin, ""))`);
  out.lazyLoading = { gridTopBeforeScroll: gridTop, beforeScroll: before.map((f) => f.file), afterScroll: after.map((f) => f.file), cardFiles: cards, cardFilesFetchedBeforeScroll: cards.filter((c) => before.some((f) => f.file === c)) };
  await p.close();
}

// ---- 1f. Location labels and panel (G2.1): pointer, touch, keyboard, outside click, Escape, wrapping ----
const LOC = `(() => [...document.querySelectorAll("ul[aria-labelledby] li")].map((li) => { const b = li.querySelector("[aria-controls]"); const panel = b && document.getElementById(b.getAttribute("aria-controls")); const r = b?.getBoundingClientRect(); const pr = panel && !panel.hidden ? panel.getBoundingClientRect() : null; return { name: li.querySelector("h3").textContent, label: b?.textContent ?? null, accessibleName: b?.getAttribute("aria-label") ?? null, expanded: b?.getAttribute("aria-expanded") ?? null, target: r ? [Math.round(r.width), Math.round(r.height)] : null, panel: pr ? { text: panel.innerText.replace(/\\n+/g, " | "), left: Math.round(pr.left), right: Math.round(pr.right), width: Math.round(pr.width), role: panel.getAttribute("role"), label: panel.getAttribute("aria-label"), mapLink: panel.querySelector("a")?.getAttribute("href") ?? null, mapLinkName: panel.querySelector("a")?.textContent ?? null, clipped: [...panel.querySelectorAll("p, a")].filter((e) => e.scrollWidth > e.clientWidth + 1).length } : null }; }))()`;
/** The open panel, centred in the viewport, so a panel below the last row is fully in the shot. */
async function shootPanel(p, file) {
  await p.eval(`document.querySelector("[aria-expanded=true]").closest("li").querySelector("[role=region]").scrollIntoView({ block: "center" })`);
  await sleep(250);
  await p.shot(file);
}
const trigger = (name) => `[...document.querySelectorAll("ul[aria-labelledby] li")].find((li) => li.querySelector("h3").textContent === "${name}").querySelector("[aria-controls]")`;
for (const view of [PHONE, DESK]) {
  const p = await open(view, "", { "prefers-reduced-motion": "reduce" });
  const log = {};
  log.closed = await p.eval(LOC);
  await shootCards(p, `${DIR}/${view.name}-cards-location.png`);
  // Open with a real tap (phone) or click (desktop).
  await press(p, trigger("Bare Chic"), view);
  log.chicOpen = (await p.eval(LOC)).filter((c) => c.panel);
  await shootPanel(p, `${DIR}/${view.name}-location-open-chic.png`);
  // Opening another closes the first: the second press is outside the first panel.
  await press(p, trigger("The Nắng Suites"), view);
  log.nangOpen = (await p.eval(LOC)).filter((c) => c.panel || c.expanded === "true");
  await shootPanel(p, `${DIR}/${view.name}-location-open-nang.png`);
  // Outside click or tap closes.
  if (view.mobile) await p.tap(5, 5);
  else await p.click(5, 5);
  await sleep(300);
  log.afterOutside = (await p.eval(LOC)).filter((c) => c.expanded === "true").length;
  // Long address wrapping: Bare Hàn, plus a synthetic street far longer than any real one.
  await press(p, trigger("Bare Hàn"), view);
  log.hanOpen = (await p.eval(LOC)).filter((c) => c.panel);
  await p.eval(`(() => { const b = ${trigger("Bare Hàn")}; const s = document.getElementById(b.getAttribute("aria-controls")).querySelector("p:nth-of-type(2)"); s.textContent = "K169/14 Kiệt Trần Phú nối dài, ngõ sau Chợ Hàn, cạnh Nhà thờ Chính toà Đà Nẵng"; })()`);
  await sleep(200);
  log.longAddress = (await p.eval(LOC)).filter((c) => c.panel);
  await shootPanel(p, `${DIR}/${view.name}-location-long-address.png`);
  log.overflowPx = await p.eval("document.documentElement.scrollWidth - innerWidth");
  // A filter change closes any open panel (the list is re-rendered).
  await p.eval(`document.querySelector('[role=radio][aria-label^="Bare Boutique Stays"]').click()`);
  await sleep(600);
  log.afterFilter = { expanded: (await p.eval(LOC)).filter((c) => c.expanded === "true").length, cards: (await p.eval(LOC)).map((c) => c.name) };
  log.errors = p.errors;
  out[`location-${view.name}`] = log;
  await p.close();
}
// Keyboard: Tab to a label, Enter opens, Tab reaches the map link, Escape closes and returns focus; Space toggles.
{
  const p = await open(DESK, "", { "prefers-reduced-motion": "reduce" });
  const FOCUSED = `(() => { const e = document.activeElement; const cs = getComputedStyle(e); return { tag: e.tagName.toLowerCase(), text: (e.getAttribute("aria-label") || e.textContent).trim().slice(0, 60), outline: cs.outlineStyle + " " + cs.outlineWidth }; })()`;
  await p.eval(`${trigger("Pepper House")}.focus()`);
  const log = { start: await p.eval(FOCUSED) };
  await p.key("Enter");
  log.afterEnter = { expanded: await p.eval(`${trigger("Pepper House")}.getAttribute("aria-expanded")`), focus: await p.eval(FOCUSED) };
  await p.key("Tab");
  log.tabIntoPanel = await p.eval(FOCUSED);
  await p.key("Escape", { vk: 27 });
  log.afterEscape = { expanded: await p.eval(`${trigger("Pepper House")}.getAttribute("aria-expanded")`), focus: await p.eval(FOCUSED) };
  await p.key(" ");
  log.spaceOpens = await p.eval(`${trigger("Pepper House")}.getAttribute("aria-expanded")`);
  await p.key(" ");
  log.spaceCloses = await p.eval(`${trigger("Pepper House")}.getAttribute("aria-expanded")`);
  await p.eval(`${trigger("Bare Hyphen")}.focus()`);
  await p.key("Enter");
  log.hyphenPanel = (await p.eval(LOC)).filter((c) => c.panel);
  await p.eval(`document.querySelector("ul[aria-labelledby]").scrollIntoView({ block: "start" })`);
  await sleep(200);
  await shootCards(p, `${DIR}/1440-location-keyboard-hyphen.png`);
  log.errors = p.errors;
  out.locationKeyboard = log;
  await p.close();
}

// ---- 2. Every brand × city combination through the real controls (desktop chips) ----
{
  const brands = [["Tất cả thương hiệu", null], ["Bare Boutique Stays", "bare"], ["The Nắng Suites", "the-nang"], ["Pepper House", "pepper-house"]];
  const cities = [["Mọi thành phố", null], ["TP. Hồ Chí Minh", "ho-chi-minh"], ["Đà Nẵng", "da-nang"]];
  const matrix = {};
  for (const [brandName] of brands) {
    for (const [cityName] of cities) {
      const p = await open(DESK);
      await press(p, radio(brandName), DESK);
      await press(p, chip(cityName), DESK);
      const s = await p.eval(STATE);
      matrix[`${brandName} × ${cityName}`] = { cards: s.cards.map((c) => c.split(" / ")[0]), summary: s.summary, address: s.address, note: await p.eval(`document.querySelector("[aria-live] span + span")?.textContent ?? null`) };
      await p.close();
    }
  }
  out.matrixBrandThenCity = matrix;
  // The other order for the two conflicting pairs.
  const conflicts = {};
  for (const [cityName, brandName] of [["TP. Hồ Chí Minh", "The Nắng Suites"], ["Đà Nẵng", "Pepper House"]]) {
    const p = await open(DESK);
    await press(p, chip(cityName), DESK);
    await press(p, radio(brandName), DESK);
    conflicts[`${cityName} then ${brandName}`] = { ...(await p.eval(STATE)), note: await p.eval(`document.querySelector("[aria-live] span + span")?.textContent ?? null`) };
    await p.close();
  }
  out.conflictsCityThenBrand = conflicts;
}

// ---- 3. The address: shared link, reload, contradictory link ----
{
  const log = {};
  let p = await open(PHONE, "?brand=bare&city=da-nang");
  log.sharedLink = await p.eval(STATE);
  await p.eval("location.reload()");
  await sleep(2000);
  log.afterReload = await p.eval(STATE);
  await p.close();
  p = await open(PHONE, "?brand=pepper-house&city=da-nang&area=mau-3");
  log.contradictoryLink = await p.eval(STATE);
  await p.close();
  out.address = log;
}

// ---- 4. Keyboard: focus order and the radio group ----
{
  const p = await open(DESK);
  const FOCUS = `(() => { const e = document.activeElement; const cs = getComputedStyle(e); return { label: e.getAttribute("aria-label") || e.textContent.trim().slice(0, 40), role: e.getAttribute("role") || e.tagName.toLowerCase(), outline: cs.outlineStyle + " " + cs.outlineWidth + " " + cs.outlineColor }; })()`;
  const KEYS = { ArrowRight: 39, ArrowLeft: 37, Home: 36, End: 35 };
  await p.eval(`document.querySelector("[class*=review] a").focus()`);
  const order = [];
  for (let i = 0; i < 9; i++) {
    await p.key("Tab");
    order.push(await p.eval(FOCUS));
  }
  const log = { focusOrder: order };
  await p.eval(`document.querySelector("[role=radio][aria-checked=true]").focus()`);
  await p.key("ArrowRight", { vk: KEYS.ArrowRight });
  log.arrowRight = await p.eval(STATE);
  await p.key("End", { vk: KEYS.End });
  log.end = await p.eval(STATE);
  await p.key("Home", { vk: KEYS.Home });
  log.home = await p.eval(STATE);
  await p.key("ArrowLeft", { vk: KEYS.ArrowLeft });
  log.arrowLeftWraps = await p.eval(STATE);
  log.tabStopsInRadiogroup = await p.eval(`[...document.querySelectorAll("[role=radio]")].filter((r) => r.tabIndex === 0).length`);
  await p.key("Home", { vk: KEYS.Home });
  await p.key("ArrowRight", { vk: KEYS.ArrowRight });
  await atSection(p);
  await p.shot(`${DIR}/1440-keyboard-focus.png`);
  out.keyboard = log;
  await p.close();
}

// ---- 5. Structure, names, contrast, reduced motion ----
{
  const p = await open(PHONE, "", { "prefers-reduced-motion": "reduce" });
  out.structure = await p.eval(`(() => {
    const rgb = (c) => c.match(/[\\d.]+/g).slice(0, 3).map(Number);
    const lum = (c) => { const [r, g, b] = rgb(c).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
    const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return Math.round(((x + 0.05) / (y + 0.05)) * 100) / 100; };
    const bgOf = (e) => { for (let n = e; n; n = n.parentElement) { const c = getComputedStyle(n).backgroundColor; if (c && !c.endsWith(", 0)") && c !== "transparent") return c; } return "rgb(255, 255, 255)"; };
    const contrast = (sel) => { const e = document.querySelector(sel); if (!e) return null; const s = getComputedStyle(e); return { text: s.color, background: bgOf(e), ratio: ratio(s.color, bgOf(e)), size: s.fontSize, weight: s.fontWeight }; };
    const anim = (sel) => [...document.querySelectorAll(sel)].slice(0, 2).map((e) => getComputedStyle(e).animationName + " " + getComputedStyle(e).animationDuration);
    return {
      lang: document.documentElement.lang,
      headings: [...document.querySelectorAll("h1, h2, h3, h4")].map((h) => h.tagName + " " + h.textContent.trim().slice(0, 50) + (h.getClientRects().length ? "" : " (hidden)")),
      main: document.querySelectorAll("main").length,
      radiogroup: document.querySelector("[role=radiogroup]")?.getAttribute("aria-label"),
      liveRegion: document.querySelector("[aria-live]")?.getAttribute("aria-live"),
      listLabelledBy: document.getElementById(document.querySelector("ul[aria-labelledby]").getAttribute("aria-labelledby"))?.textContent,
      placeholdersHiddenFromAT: [...document.querySelectorAll("[class*=placeholderTag]")].every((t) => t.closest("[aria-hidden=true]")),
      imagesWithoutAlt: [...document.querySelectorAll("img")].filter((i) => !i.hasAttribute("alt")).length,
      contrast: {
        placeholderTag: contrast("ul [class*=placeholderTag]"),
        placeholderReason: contrast("ul [class*=placeholderReason]"),
                cardName: contrast("ul [class*=cardName]"),
        cardCity: contrast("ul [class*=cardCity]"),
        review: contrast("[class*=review] p"),
      },
      reducedMotion: { cards: anim("ul[aria-labelledby] li"), slicePlaceholders: anim("[class*=slicePlaceholder]") },
    };
  })()`);
  await p.close();
}

// ---- 6. SEO ----
{
  const p = await open(DESK);
  out.seo = await p.eval(`(() => ({
    title: document.title,
    robotsMeta: document.querySelector('meta[name=robots]')?.content ?? null,
    canonical: document.querySelector('link[rel=canonical]')?.href ?? null,
    description: document.querySelector('meta[name=description]')?.content ?? null,
    headHasClientAddress: /Nguyễn|Trần Phú|Võ Văn Kiệt|Hoàng Sa/.test(document.head.innerHTML),
    h1: document.querySelectorAll("h1").length,
  }))()`);
  const response = await fetch(BASE + ROUTE);
  out.seo.xRobotsTag = response.headers.get("x-robots-tag");
  out.seo.inSitemap = (await (await fetch(BASE + "/sitemap.xml")).text()).includes("brand-collection");
  out.seo.robotsTxt = (await (await fetch(BASE + "/robots.txt")).text()).trim().split("\n").slice(0, 6);
  await p.close();
}

// ---- 7. Performance: CLS through load and filtering, LCP, bytes ----
const OBSERVE = `(() => { window.__cls = 0; window.__lcp = null; new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: "layout-shift", buffered: true }); new PerformanceObserver((l) => { const e = l.getEntries().at(-1); window.__lcp = { time: Math.round(e.startTime), size: e.size, element: e.element ? e.element.tagName + "." + String(e.element.className).slice(0, 40) + " " + (e.element.textContent || "").trim().slice(0, 40) : null }; }).observe({ type: "largest-contentful-paint", buffered: true }); })()`;
out.performance = {};
for (const [name, view, throttle] of [["desktop", DESK, {}], ["phone-slow4g-cpu4", PHONE, { network: true, cpu: 4 }]]) {
  const p = await Page.open();
  await p.viewport(view.w, view.h, view.dpr, view.mobile);
  await p.throttle(throttle);
  await p.goto(BASE + ROUTE, { settle: 3000 });
  await p.eval(OBSERVE);
  await sleep(500);
  const load = await p.eval(`({ cls: Math.round(window.__cls * 10000) / 10000, lcp: window.__lcp, nav: (() => { const n = performance.getEntriesByType("navigation")[0]; return { ttfb: Math.round(n.responseStart), domContentLoaded: Math.round(n.domContentLoadedEventEnd), load: Math.round(n.loadEventEnd) }; })(), resources: (() => { const r = performance.getEntriesByType("resource"); const sum = (f) => Math.round(r.filter(f).reduce((a, e) => a + e.transferSize, 0) / 1024); return { count: r.length, totalKB: sum(() => true), scriptKB: sum((e) => e.initiatorType === "script" || e.name.endsWith(".js")), cssKB: sum((e) => e.name.endsWith(".css")), imageKB: sum((e) => e.initiatorType === "img"), images: r.filter((e) => e.initiatorType === "img").map((e) => e.name.replace(location.origin, "") + " " + e.transferSize + "B") }; })() })`);
  // Filter changes must not move anything that was not meant to move.
  await p.eval(`document.querySelector('[role=radio][aria-label^="Bare Boutique Stays"]').click()`);
  await sleep(800);
  await p.eval(`document.querySelector('[role=radio][aria-label^="Pepper House"]').click()`);
  await sleep(800);
  load.clsAfterFiltering = await p.eval(`Math.round(window.__cls * 10000) / 10000`);
  load.stageHeights = await p.eval(`(async () => { const h = []; for (const r of document.querySelectorAll("[role=radio]")) { r.click(); await new Promise((x) => setTimeout(x, 300)); h.push(Math.round(document.querySelector("[class*=stage]").getBoundingClientRect().height)); } return h; })()`);
  out.performance[name] = load;
  await p.close();
}

writeFileSync(`${DIR}/results.json`, JSON.stringify(out, null, 2));
quit();
console.log(JSON.stringify(out, null, 1).slice(0, 4000));
