// VNest V3 takeover QA, 25/10/2026. Guest journeys (Booking Results, property page), partner journey
// (Services → Contact → FAQ → Footer) and cross-page checks at 1440 (mouse), 768 and 390 (touch).
//   BASE=http://localhost:3402 node docs/qa/v3-takeover-2026-10-25/scripts/qa.mjs
// Run against `next start`. Headless Chrome with device emulation: NOT a physical phone.
// Writes results.json and journey screenshots to ../journeys/.
import { mkdirSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
const ROOT = "/Users/noe/Documents/GitHub/VNest 2";
const { launch, quit, Page, sleep } = await import(pathToFileURL(`${ROOT}/docs/qa/brand-collection/scripts/lib.mjs`).href);
const BASE = process.env.BASE ?? "http://localhost:3402";
const OUT = `${ROOT}/docs/qa/v3-takeover-2026-10-25`;
const SHOTS = `${OUT}/journeys`;
mkdirSync(SHOTS, { recursive: true });
const VIEWS = [
  { name: "1440", w: 1440, h: 900, dpr: 1, mobile: false },
  { name: "768", w: 768, h: 1024, dpr: 1, mobile: true },
  { name: "390", w: 390, h: 844, dpr: 2, mobile: true },
];
const DATES = "checkIn=2026-11-06&checkOut=2026-11-08";
const results = { base: BASE, date: "2026-10-25", note: "Headless Chrome device emulation; not a physical phone or a screen reader.", views: [], consoleErrors: [], nonGetRequests: [] };
console.log(await launch());

const center = (js) => `(() => { const e = ${js}; if (!e) return null; e.scrollIntoView({ block: "center", behavior: "instant" }); const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`;
async function press(p, view, js) {
  const c = await p.eval(center(js));
  if (!c) throw new Error(`not found: ${js}`);
  await sleep(200);
  if (view.mobile) await p.tap(c.x, c.y);
  else await p.click(c.x, c.y);
  await sleep(350);
}
const q = (s) => `document.querySelector(${JSON.stringify(s)})`;
const byText = (scope, text) => `[...document.querySelectorAll(${JSON.stringify(scope)})].find((b) => b.getClientRects().length && b.textContent.trim().includes(${JSON.stringify(text)}))`;
const url = () => `location.pathname + location.search`;
// Overflow is measured against the emulated width: with mobile emulation a too-wide page widens the
// layout viewport itself, so scrollWidth > innerWidth alone misses it (found 25/10 on property pages).
const PAGE_FACTS_FOR = (w) => `(() => ({
  overflowX: document.documentElement.scrollWidth > ${w} || innerWidth !== ${w},
  pageWidth: document.documentElement.scrollWidth,
  brokenImages: [...document.images].filter((i) => i.complete && i.naturalWidth === 0 && i.getClientRects().length).map((i) => i.src).slice(0, 3),
  footers: document.querySelectorAll("footer").length,
  fakeConfirm: /Đã ghi nhận lựa chọn|Đặt phòng thành công|Xác nhận giữ chỗ|Đã gửi yêu cầu|Gửi thành công|Còn \\d+ phòng trống/i.test(document.body.innerText),
}))()`;
/** Is the element's rect covered by any fixed/sticky element at its centre? */
const covered = (js) => `(() => { const e = ${js}; if (!e) return "missing"; e.scrollIntoView({ block: "end", behavior: "instant" }); const r = e.getBoundingClientRect(); const top = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return top && (top === e || e.contains(top)) ? false : (top?.className?.toString().slice(0, 60) || top?.tagName || "unknown"); })()`;

for (const view of VIEWS) {
  const r = { view: view.name, checks: {} };
  const ok = (name, pass, detail = {}) => {
    r.checks[name] = { pass: !!pass, ...detail };
    if (!pass) console.log(`  FAIL ${view.name} ${name}`, JSON.stringify(detail).slice(0, 300));
  };
  const p = await Page.open();
  p.on("Runtime.exceptionThrown", (e) => results.consoleErrors.push({ view: view.name, text: e.exceptionDetails?.exception?.description?.slice(0, 240) }));
  p.on("Runtime.consoleAPICalled", (e) => e.type === "error" && results.consoleErrors.push({ view: view.name, text: e.args?.map((a) => a.value ?? a.description).join(" ").slice(0, 240) }));
  p.on("Network.requestWillBeSent", (e) => !["GET", "HEAD", "OPTIONS"].includes(e.request.method) && !e.request.url.includes("/_next/") && results.nonGetRequests.push(`${view.name} ${e.request.method} ${e.request.url}`));
  await p.viewport(view.w, view.h, view.dpr, view.mobile);
  const shot = (name) => p.shot(`${SHOTS}/${view.name}-${name}.jpg`);

  // ── GUEST A: Homepage → Search (BOOK NOW) → Booking Results → rooms → review ──
  await p.goto(`${BASE}/dev/demo?${DATES}&adults=2`, { settle: 2200 });
  if (view.w < 768) {
    await press(p, view, `[...document.querySelectorAll("#dat-phong button[aria-haspopup=dialog]")].find((b) => b.getClientRects().length)`);
    await press(p, view, `[...document.querySelectorAll("dialog[open] form[role=search] button[type=submit]")].find((b) => b.getClientRects().length)`);
  } else {
    await press(p, view, `[...document.querySelectorAll("#dat-phong form[role=search] button[type=submit]")].find((b) => b.getClientRects().length)`);
  }
  await sleep(2000);
  ok("A1 homepage BOOK NOW opens Booking Results with the stay", (await p.eval(url())).startsWith("/dev/demo/tim-phong") && (await p.eval(url())).includes("checkIn=2026-11-06"), { url: await p.eval(url()) });

  await p.goto(`${BASE}/dev/demo/tim-phong?property=bare-chic&${DATES}&rooms=1&adults=2`, { settle: 2200 });
  await press(p, view, byText("#phong-bare-chic-two button", "Chọn phòng"));
  ok("A2 one room selected", /prefs=bare-chic-two(&|$)/.test(decodeURIComponent(await p.eval(url()))), { url: await p.eval(url()) });
  await press(p, view, `[...document.querySelectorAll("[data-testid=direct-add-room-top], [data-testid=summary-add-room], [data-testid=mobile-add-room]")].find((b) => b.getClientRects().length)`);
  ok("A3 add a room directly (no editor)", decodeURIComponent(await p.eval(url())).includes("rooms=2,2"), { url: await p.eval(url()) });
  const lock = await p.eval(`(() => { const b = [...document.querySelectorAll("#phong-bare-chic-two button")].find((x) => /Đã chọn cho Phòng 1/.test(x.textContent)); return { text: b?.textContent.trim(), disabled: b?.disabled }; })()`);
  ok("A4 the same physical room is locked for room 2", lock.disabled === true, lock);
  await press(p, view, byText("#phong-bare-chic-three button", "Chọn phòng"));
  const two = decodeURIComponent(await p.eval(url()));
  ok("A5 two different rooms, no duplicate", two.includes("prefs=bare-chic-two,bare-chic-three"), { url: two });
  await shot("A-results-two-rooms");
  // Guest allocation: Bare Chic One is confirmed for 2 adults; 3 adults in a room blocks it for that room.
  await press(p, view, `[...document.querySelectorAll("button[aria-label='Thêm khách Phòng 2'], button[aria-label='Thêm khách cho Phòng 2'], button[aria-label='Tăng khách Phòng 2']")].find((b) => b.getClientRects().length)`);
  const alloc = decodeURIComponent(await p.eval(url()));
  const capacity = await p.eval(`[...document.querySelectorAll("#phong-bare-chic-one button")].map((b) => b.textContent.trim()).join(" | ")`);
  ok("A6 guest allocation per room (2 + 3)", alloc.includes("rooms=2,3"), { url: alloc, bareChicOne: capacity });
  // Reassign room 1: unassign, choose another.
  await press(p, view, `[...document.querySelectorAll("button[aria-label='Bớt khách Phòng 2'], button[aria-label='Bớt khách cho Phòng 2'], button[aria-label='Giảm khách Phòng 2']")].find((b) => b.getClientRects().length)`);
  await press(p, view, `[...document.querySelectorAll("button[aria-pressed]")].find((b) => b.getClientRects().length && /Phòng 1 \\(/.test(b.textContent))`);
  await press(p, view, byText("#phong-bare-indochine button", "Chọn phòng"));
  const re = decodeURIComponent(await p.eval(url()));
  ok("A7 reassign room 1's preference", /prefs=bare-indochine,bare-chic-three/.test(re), { url: re });
  // Refresh keeps everything.
  await p.goto(`${BASE}${await p.eval(url())}`, { settle: 2200 });
  ok("A8 refresh keeps dates, rooms, guests and preferences", decodeURIComponent(await p.eval(url())) === re, { url: decodeURIComponent(await p.eval(url())) });
  // Review → honest step.
  await press(p, view, `[...document.querySelectorAll("button")].find((b) => b.getClientRects().length && /Xem lại lựa chọn/.test(b.textContent))`);
  const review = await p.eval(`(() => { const d = document.querySelector("dialog[open]"); return { open: !!d, text: d?.innerText.replace(/\\n+/g, " | ").slice(0, 500), cont: d?.querySelector("[data-testid=continue-booking-request]")?.getAttribute("href") }; })()`);
  ok("A9 review sheet: honest notice and Tiếp tục to the booking step", review.open && /chưa có phòng nào được giữ/i.test(review.text) && review.cont?.startsWith("/dev/demo/dat-phong"), review);
  await shot("A-review");
  await press(p, view, `document.querySelector("dialog[open] [data-testid=continue-booking-request]")`);
  await sleep(1500);
  const step = await p.eval(`({ url: location.pathname, text: document.querySelector("main").innerText })`);
  ok("A10 booking step restates allocation, books nothing", step.url === "/dev/demo/dat-phong" && /Bare Indochine/.test(step.text) && /chưa nhận yêu cầu nào/.test(step.text), { url: step.url });
  await p.eval("history.back()");
  await sleep(2000);
  ok("A11 browser Back returns to the same selection", decodeURIComponent(await p.eval(url())).includes("prefs=bare-indochine,bare-chic-three"), { url: decodeURIComponent(await p.eval(url())) });
  // Remove a room.
  await press(p, view, `[...document.querySelectorAll("button[aria-label$='khỏi Phòng 2']")].find((b) => b.getClientRects().length)`);
  await press(p, view, `[...document.querySelectorAll("button[aria-label='Xoá Phòng 2']")].find((b) => b.getClientRects().length)`);
  ok("A12 remove a room", /rooms=1(&|$)/.test(decodeURIComponent(await p.eval(url()))), { url: decodeURIComponent(await p.eval(url())) });
  // Same room type: Bare Hyphen has three Studio · 18 m² units.
  await p.goto(`${BASE}/dev/demo/tim-phong?property=bare-hyphen&${DATES}&rooms=1&adults=2`, { settle: 2200 });
  await press(p, view, byText("#phong-bare-hyphen-one button", "Chọn phòng"));
  const sameType = await p.eval(`!!document.querySelector("[data-testid=add-same-type-bare-hyphen-one]")`);
  if (sameType) await press(p, view, q("[data-testid=add-same-type-bare-hyphen-one]"));
  const st = decodeURIComponent(await p.eval(url()));
  const prefs = (st.match(/prefs=([^&]*)/)?.[1] ?? "").split(",").filter(Boolean);
  ok("A13 same room type twice maps to two different physical units", sameType && prefs.length === 2 && new Set(prefs).size === 2 && prefs.every((x) => /^bare-hyphen-(one|two|three)$/.test(x)), { url: st });
  const resultsFacts = await p.eval(PAGE_FACTS_FOR(view.w));
  ok("A14 Booking Results: one footer, no overflow, no fake confirmation", resultsFacts.footers === 1 && !resultsFacts.overflowX && !resultsFacts.fakeConfirm && !resultsFacts.brokenImages.length, resultsFacts);

  // ── R3 room facts (owner, 25/10/2026): merged values on every covered room; display only ──
  const meta = (id) => `[...document.querySelectorAll("#phong-${id} [aria-label='Thông số phòng đã xác minh'] li")].filter((li) => li.getClientRects().length).map((li) => li.textContent.replace(/^.*?: /, "").trim()).join(" · ")`;
  await p.goto(`${BASE}/dev/demo/tim-phong?property=all&${DATES}&rooms=1&adults=3`, { settle: 2200 });
  // All 22 rooms of the 15/10 sheet under R3 (explicit rows first, merged ranges, F4:F25 everywhere).
  const A = "2 người lớn";
  const EXPECT = {
    "bare-chic-one": "Studio · 28 m²", "bare-chic-two": "Studio · 28 m²", "bare-chic-three": "Studio · 28 m²", "bare-indochine": "Studio · 28 m²",
    "bare-hyphen-one": "Studio · 18 m²", "bare-hyphen-two": "Studio · 18 m²", "bare-hyphen-three": "Studio · 18 m²", "bare-hyphen-four": "Duplex studio · 30 m²",
    "bare-da-kao-one": "Studio · 13 m²", "bare-da-kao-two": "Studio · 19 m²", "bare-da-kao-three": "Studio · 19 m²", "bare-da-kao-four": "Studio · 17 m²",
    "bare-han-ground": "Studio · 30 m²", "bare-han-one": "Studio · 30 m²", "bare-han-two": "Studio · 30 m²", "bare-han-three": "Studio · 30 m²",
    "yellow-submarine": "Studio · 21 m²", "pale-blue-eyes": "Studio · 23 m²", "green-river": "Studio · 30 m²", "blue-moon": "Studio · 36 m²",
    "pepper-house-3rd-floor": "Studio · 40 m²", "pepper-house-4th-floor": "Studio · 40 m²",
  };
  const cardIds = await p.eval(`[...document.querySelectorAll("[id^=phong-]")].map((c) => c.id.slice(6))`);
  const r3 = {};
  for (const id of cardIds) r3[id] = await p.eval(meta(id));
  const wrong = Object.entries(EXPECT).filter(([id, v]) => r3[id] !== `${v} · ${A}`).map(([id]) => `${id}: ${r3[id] ?? "missing"}`);
  ok("R1 all 22 rooms show the R3 type · area · 2 người lớn (visible text only, no double count)", cardIds.length === 22 && wrong.length === 0, { cards: cardIds.length, wrong });
  await press(p, view, byText("#phong-bare-chic-one button", "Chọn phòng"));
  const three = decodeURIComponent(await p.eval(url()));
  ok("R2 occupancy is not enforced: 3 adults can still prefer Bare Chic One (no 'Tối đa')", /prefs=bare-chic-one/.test(three) && !(await p.eval(`/Tối đa \\d+ khách|vượt/.test(document.querySelector("main").innerText)`)), { url: three });

  // ── Studio pool (same type ≠ unlimited inventory): Booking Results, Bare Chic's four Studio rooms ──
  await p.goto(`${BASE}/dev/demo/tim-phong?property=bare-chic&${DATES}&rooms=1&adults=2`, { settle: 2200 });
  await press(p, view, byText("#phong-bare-chic-one button", "Chọn phòng"));
  const steps = [];
  for (let i = 0; i < 6; i++) {
    const has = await p.eval(`(() => { const b = document.querySelector("[data-testid=add-same-type-bare-chic-one]"); return b && b.getClientRects().length ? b.textContent.trim() : null; })()`);
    if (!has) break;
    steps.push(has);
    await press(p, view, q("[data-testid=add-same-type-bare-chic-one]"));
  }
  const poolUrl = decodeURIComponent(await p.eval(url()));
  const poolPrefs = (poolUrl.match(/prefs=([^&]*)/)?.[1] ?? "").split(",").filter(Boolean);
  ok("P1 Studio shortcut stops at the 4 real Bare Chic rooms, each assigned once", steps.length === 3 && poolPrefs.length === 4 && new Set(poolPrefs).size === 4 && /rooms=2,2,2,2/.test(poolUrl), { steps: steps.length, prefs: poolPrefs, url: poolUrl });
  ok("P2 shortcut label claims no availability count", steps.every((t) => /^\+ Chọn thêm 1 phòng hạng Studio khác$/.test(t) && !/còn/.test(t)), { label: steps[0] });
  const summary = await p.eval(`[...document.querySelectorAll("[aria-label='Tổng hợp theo hạng phòng'] *")].filter((e) => e.getClientRects().length && !e.children.length).map((e) => e.textContent.trim()).join(" | ")`);
  const bar = await p.eval(`(document.body.innerText.match(/\\d+\\/\\d+ phòng đã chọn/i) ?? [""])[0]`);
  // Desktop shows the type summary; touch widths have no sidebar, only the selection bar with the count.
  ok("P3 summary: 4 × Hạng Studio on desktop; 4/4 selected on touch", view.mobile ? /^4\/4 phòng đã chọn$/i.test(bar) : /4 × Hạng Studio/.test(summary), { summary: summary.slice(0, 200), bar });
  const dup = await p.eval(`[...document.querySelectorAll("#phong-bare-chic-two button")].filter((b) => b.getClientRects().length).map((b) => b.textContent.trim() + (b.disabled ? " [disabled]" : ""))`);
  ok("P4 an already-assigned Studio room cannot be picked again", dup.some((t) => /Đã chọn/.test(t)) && !dup.some((t) => t === "Chọn phòng"), { bareChicTwo: dup });
  await p.goto(`${BASE}${await p.eval(url())}`, { settle: 2200 });
  ok("P5 refresh keeps the four distinct Studio preferences", decodeURIComponent(await p.eval(url())) === poolUrl, { url: decodeURIComponent(await p.eval(url())) });

  // ── Property page: two distinct Studio rooms, change, shortcut, remove ──
  await p.goto(`${BASE}/dev/stays/bare-chic?view=demo&${DATES}&adults=2`, { settle: 2200 });
  await press(p, view, q("[data-testid=select-room-bare-chic-two]"));
  await press(p, view, `[...document.querySelectorAll("[data-testid=property-add-room], button")].find((b) => b.getClientRects().length && b.textContent.trim() === "+ Thêm phòng")`);
  await press(p, view, q("[data-testid=select-room-bare-chic-three]"));
  const twoStudio = decodeURIComponent(await p.eval(url()));
  await press(p, view, q("[data-testid=select-room-bare-chic-three]")); // "Đã chọn (Phòng 2) · Bỏ chọn"
  await press(p, view, q("[data-testid=select-room-bare-indochine]"));
  const changed = decodeURIComponent(await p.eval(url()));
  ok("Q1 property page: two distinct Studio rooms, then change room 2", /prefs=bare-chic-two,bare-chic-three/.test(twoStudio) && /prefs=bare-chic-two,bare-indochine/.test(changed), { twoStudio, changed });
  const shortcut = `[...document.querySelectorAll("#rooms button")].find((b) => b.getClientRects().length && /Chọn thêm 1 phòng hạng/.test(b.textContent))`;
  const sc = [];
  for (let i = 0; i < 6; i++) {
    const t = await p.eval(`${shortcut}?.textContent.trim() ?? null`);
    if (!t) break;
    sc.push(t);
    await press(p, view, shortcut);
  }
  const full = decodeURIComponent(await p.eval(url()));
  const fullPrefs = (full.match(/prefs=([^&]*)/)?.[1] ?? "").split(",").filter(Boolean);
  ok("Q2 property shortcut fills only the remaining real Studio rooms, no duplicates, no count", fullPrefs.length === 4 && new Set(fullPrefs).size === 4 && sc.length === 2 && sc.every((t) => !/còn/.test(t)), { shortcutPresses: sc.length, prefs: fullPrefs });
  await press(p, view, `[...document.querySelectorAll("[data-testid=summary-bar-book-now], [data-testid=property-book-now-btn]")].find((b) => b.getClientRects().length)`);
  await press(p, view, `[...document.querySelectorAll("[data-testid=property-booking-dialog] button")].filter((b) => b.textContent.trim() === "Xoá").pop()`);
  const removed = decodeURIComponent(await p.eval(url()));
  const removedPrefs = (removed.match(/prefs=([^&]*)/)?.[1] ?? "").split(",").filter(Boolean);
  ok("Q3 removing a room from the review drops only that room", removedPrefs.length === 3 && fullPrefs.slice(0, 3).every((x) => removedPrefs.includes(x)), { removedPrefs });
  await p.key("Escape");
  await p.goto(`${BASE}${await p.eval(url())}`, { settle: 2200 });
  ok("Q4 refresh keeps the property selection exactly", decodeURIComponent(await p.eval(url())) === removed, { url: decodeURIComponent(await p.eval(url())) });

  // ── Routes: direct URLs (HTTP) and real in-browser navigation ──
  const direct = {};
  for (const path of ["/dev/demo", "/dev/demo/tim-phong", "/dev/stays/bare-chic?view=demo", "/dev/stays/the-nang-suites", "/dev/demo/dat-phong"]) direct[path] = (await fetch(BASE + path)).status;
  ok("U1 direct URLs answer 200 (no HTTP 500)", Object.values(direct).every((c) => c === 200), direct);
  await p.goto(`${BASE}/dev/demo`, { settle: 2200 });
  await press(p, view, `[...document.querySelectorAll("#kham-pha a[href*='/dev/stays/the-nang-suites']")].find((a) => a.getClientRects().length)`);
  await sleep(2200);
  const nang = await p.eval(`({ path: location.pathname, h1: document.querySelector("h1")?.textContent.trim(), y: Math.round(scrollY), footers: document.querySelectorAll("footer").length })`);
  await p.eval("history.back()");
  await sleep(2000);
  const backHome = await p.eval(`location.pathname`);
  ok("U2 homepage → The Nắng Suites by click, then Back to the homepage", nang.path === "/dev/stays/the-nang-suites" && nang.h1 === "The Nắng Suites" && nang.y === 0 && nang.footers === 1 && backHome === "/dev/demo", { nang, backHome });

  // ── GUEST B: Homepage → Property → photos → rooms → BOOK NOW ──
  await p.goto(`${BASE}/dev/demo`, { settle: 2200 });
  await press(p, view, `[...document.querySelectorAll("#kham-pha a[href*='/dev/stays/bare-chic']")].find((a) => a.getClientRects().length)`);
  await sleep(2200);
  const top = await p.eval(`({ url: location.pathname + location.search, y: Math.round(scrollY) })`);
  ok("B1 homepage → Bare Chic opens at the top", top.url.startsWith("/dev/stays/bare-chic") && top.y === 0, top);
  const carousel = `document.querySelector("#rooms [data-room-carousel]")`;
  const before = await p.eval(`${carousel}?.dataset.photoIndex`);
  if (view.mobile) {
    const c = await p.eval(center(carousel));
    await p.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: c.x + 80, y: c.y }] });
    await p.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: c.x - 20, y: c.y }] });
    await p.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: c.x - 90, y: c.y }] });
    await p.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await sleep(500);
  } else {
    await p.eval(center(carousel));
    await press(p, view, `document.querySelector("#rooms button[aria-label^='Ảnh sau']")`);
  }
  const after = await p.eval(`${carousel}?.dataset.photoIndex`);
  ok(`B2 inline room gallery moves (${view.mobile ? "swipe" : "next button"})`, before === "0" && after === "1", { before, after });
  await p.goto(`${BASE}/dev/stays/bare-chic?view=demo&${DATES}&adults=2`, { settle: 2200 });
  await press(p, view, `document.querySelector("[data-testid=select-room-bare-chic-two]")`);
  const c1 = await p.eval(`document.querySelector("[data-testid=property-selection-count]")?.textContent`);
  await press(p, view, `[...document.querySelectorAll("[data-testid=property-add-room], button")].find((b) => b.getClientRects().length && b.textContent.trim() === "+ Thêm phòng")`);
  const lockB = await p.eval(`document.querySelector("[data-testid=select-room-bare-chic-two]")?.textContent.trim()`);
  await press(p, view, `document.querySelector("[data-testid=select-room-bare-chic-three]")`);
  const c2 = await p.eval(`document.querySelector("[data-testid=property-selection-count]")?.textContent`);
  ok("B3 select 1 then 2 rooms on the property page; unit locked", /1\/1/.test(c1) && /2\/2/.test(c2) && /Đã chọn cho Phòng 1/.test(lockB), { c1, c2, lockB });
  await shot("B-property-two-rooms");
  await press(p, view, `[...document.querySelectorAll("[data-testid=summary-bar-book-now], [data-testid=property-book-now-btn]")].find((b) => b.getClientRects().length)`);
  const dlg = await p.eval(`(() => { const d = document.querySelector("[data-testid=property-booking-dialog]"); return { open: d?.open, text: d?.innerText.replace(/\\n+/g, " | ").slice(0, 600), cont: d?.querySelector("[data-testid=continue-property-booking-request]")?.getAttribute("href"), fake: !!d?.querySelector("[data-testid=confirm-property-booking-request], [data-testid=property-booking-confirmed-state]") }; })()`);
  ok("B4 BOOK NOW review: no fake confirmation, Tiếp tục to the booking step", dlg.open && !dlg.fake && /Chưa có phòng nào được giữ/.test(dlg.text) && dlg.cont?.includes("prefs=bare-chic-two%2Cbare-chic-three"), dlg);
  await shot("B-book-now-review");
  await p.key("Escape");
  ok("B5 Escape closes the review", !(await p.eval(`document.querySelector("[data-testid=property-booking-dialog]")?.open`)));
  const propUrl = await p.eval(url());
  await p.goto(`${BASE}${propUrl}`, { settle: 2200 });
  const afterReload = await p.eval(`document.querySelector("[data-testid=property-selection-count]")?.textContent`);
  ok("B6 refresh keeps the property selection (and hydrates cleanly, see console)", /2\/2/.test(afterReload), { afterReload });

  // One stay, one meaning across pages: booking step → property page keeps 1 room · 2 adults + preference.
  await p.goto(`${BASE}/dev/demo/dat-phong?property=bare-chic&${DATES}&rooms=1&adults=2&prefs=bare-chic-two`, { settle: 1800 });
  await press(p, view, `[...document.querySelectorAll("main a")].find((a) => a.getClientRects().length && /Xem các loại phòng tại Bare Chic/.test(a.textContent))`);
  await sleep(2200);
  const carried = await p.eval(`({ url: location.search, summary: document.querySelector("[data-testid=property-selection-summary-bar]")?.innerText.replace(/\\n+/g, " ") ?? document.querySelector("[data-testid=property-selection-count]")?.textContent })`);
  ok("B7 booking step → property page keeps 1 room · 2 guests and the preference", /1\/1/.test(carried.summary ?? "") && /2 khách/i.test(carried.summary ?? "") && /Bare Chic Two/.test(carried.summary ?? ""), carried);

  // ── Room card price region and CTA (25/10/2026) ──
  await p.goto(`${BASE}/dev/stays/bare-chic?view=demo&${DATES}&adults=2`, { settle: 2200 });
  const stripJs = `document.querySelector("#rooms li[data-room-id] [class*=bookingStrip]")`;
  const btnJs = `document.querySelector("#rooms li[data-room-id] [data-testid^=select-room]")`;
  const look = `(() => { const b = ${btnJs}; const s = ${stripJs}; const pr = s.querySelector("[data-price]"); const r = b.getBoundingClientRect(); return { bg: getComputedStyle(b).backgroundColor, w: Math.round(r.width), price: pr?.textContent.trim(), priceVisible: !!pr && pr.getClientRects().length > 0 && getComputedStyle(pr).visibility !== "hidden" && +getComputedStyle(pr).opacity > 0.5, described: b.getAttribute("aria-describedby") === pr?.id, full: Math.abs(r.width - s.getBoundingClientRect().width) < 2 }; })()`;
  const prices = await p.eval(`[...document.querySelectorAll("#rooms [data-price]")].filter((e) => e.getClientRects().length).map((e) => e.dataset.price + ":" + e.textContent.trim())`);
  ok("PR1 every Bare Chic room card shows its price region; no amount without an approved rate", prices.length === 4 && prices.every((x) => x === "pending:Xem giá theo ngày"), { prices });
  await p.eval(`${stripJs}.scrollIntoView({ block: "center", behavior: "instant" })`);
  await sleep(300);
  const rest = await p.eval(look);
  if (!view.mobile) {
    const c = await p.eval(`(() => { const r = ${stripJs}.getBoundingClientRect(); return { x: r.x + 30, y: r.y + r.height / 2 }; })()`);
    await p.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: c.x, y: c.y });
    await sleep(400);
    const hover = await p.eval(look);
    await p.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 2, y: 2 });
    await sleep(300);
    await p.eval(`${btnJs}.focus()`);
    await sleep(300);
    const focus = await p.eval(look);
    await p.eval(`document.activeElement.blur()`);
    ok("PR2 desktop: price leads at rest, hover and focus fill the action; price stays visible; no width jump", rest.bg === "rgba(0, 0, 0, 0)" && hover.bg === "rgb(154, 104, 60)" && focus.bg === "rgb(154, 104, 60)" && hover.priceVisible && focus.priceVisible && rest.w === hover.w && hover.w === focus.w && rest.described, { rest, hover, focus });
  } else {
    ok("PR2 touch: price on its own line, full-width filled 'Chọn phòng' always", rest.bg === "rgb(154, 104, 60)" && rest.full && rest.priceVisible && rest.described, rest);
  }

  // ── Location module ──
  for (const [slug, path, airport, km, mins] of [["bare-chic", "/dev/stays/bare-chic?view=demo", "Tân Sơn Nhất (SGN)", "khoảng 9,5 km", "khoảng 30 phút bằng ô tô"], ["the-nang-suites", "/dev/stays/the-nang-suites", "Đà Nẵng (DAD)", "khoảng 5,9 km", "khoảng 15 phút bằng ô tô"]]) {
    await p.goto(`${BASE}${path}`, { settle: 2000 });
    const loc = await p.eval(`(() => { const m = document.getElementById("vi-tri"); if (!m) return null; const dd = [...m.querySelectorAll("[class*=facts] dd")].map((d) => d.textContent.trim()); const map = m.querySelector("[data-map-state]"); const info = m.querySelector("[class*=info]"); const a = map.getBoundingClientRect(), b = info.getBoundingClientRect(); return { dd, modes: [...m.querySelectorAll("[class*=modes] li")].map((l) => l.textContent), cta: m.querySelector("[data-testid=property-google-maps-link]")?.target, policy: !!m.querySelector("[data-testid=open-policy-dialog]"), base: !!m.querySelector("[data-map-state]") && !m.querySelector("svg[class*=mapBase], [class*=tiles]"), sideBySide: Math.abs(a.top - b.top) < 2 && a.right <= b.left + 1, mapFirst: a.bottom <= b.top + 1, heroLink: !!document.querySelector("a[href='#vi-tri']"), cityNotesAfter: (() => { const cn = [...document.querySelectorAll("h2")].find((h) => /Ăn gì, đi đâu/.test(h.textContent)); return !cn || (m.compareDocumentPosition(cn) & Node.DOCUMENT_POSITION_FOLLOWING) > 0; })() }; })()`);
    ok(`L ${slug}: map + address, airport, distance, drive time, workbook transport, Google Maps (new tab), policies; layout`, !!loc && loc.dd.join("|") === [airport, km, mins].join("|") && loc.modes.join(",") === "Grab,Đi bộ,Xe bus" && loc.cta === "_blank" && loc.policy && loc.base && loc.heroLink && loc.cityNotesAfter && (view.w >= 1024 ? loc.sideBySide : view.w < 768 ? loc.mapFirst : true), loc ?? {});
  }

  // ── Property pages: map, policy dialog, related, footer, no obstruction ──
  for (const [slug, path, place] of [["bare-chic", "/dev/stays/bare-chic?view=demo", "fskgZreXVjowaoQCO"], ["the-nang-suites", "/dev/stays/the-nang-suites", "OZaB9ncAnVW8ijALJ"]]) {
    await p.goto(`${BASE}${path}`, { settle: 2200 });
    const facts = await p.eval(PAGE_FACTS_FOR(view.w));
    const map = await p.eval(`document.querySelector("[data-testid=property-google-maps-link]")?.href`);
    const related = await p.eval(`[...document.querySelectorAll("section")].filter((s) => /Khám phá thêm/.test(s.innerText.slice(0, 200))).flatMap((s) => [...s.querySelectorAll("h3")].map((h) => h.textContent.trim()))`);
    const h1 = await p.eval(`document.querySelector("h1")?.textContent.trim()`);
    ok(`P ${slug}: one footer, no overflow, no broken images`, facts.footers === 1 && !facts.overflowX && !facts.brokenImages.length && !facts.fakeConfirm, facts);
    ok(`P ${slug}: Google Maps link is this property's`, map?.includes(place), { map });
    ok(`P ${slug}: related properties exclude this one (5 shown)`, related.length === 5 && !related.includes(h1), { related, h1 });
    await press(p, view, q("[data-testid=open-policy-dialog]"));
    const pol = await p.eval(`(() => { const d = [...document.querySelectorAll("dialog")].find((x) => x.open); return { open: !!d, text: d?.innerText ?? "" }; })()`);
    await p.key("Escape");
    const focusBack = await p.eval(`document.activeElement?.dataset?.testid`);
    ok(`P ${slug}: policy dialog shows topics only (no values or promises), Escape returns focus`, pol.open && /Chờ VNest xác nhận/.test(pol.text) && !/sẽ được gửi kèm|trước khi hoàn tất|\\d{1,2}:\\d{2}/.test(pol.text) && focusBack === "open-policy-dialog", { text: pol.text.slice(0, 300), focusBack });
    ok(`P ${slug}: footer's last link not covered by a fixed bar`, (await p.eval(covered(`document.querySelector("footer a[href='#top']")`))) === false, { cover: await p.eval(covered(`document.querySelector("footer a[href='#top']")`)) });
    if (slug === "bare-chic") await shot("P-bare-chic-footer");
  }

  // ── PARTNER: Homepage → Services → card → CTA → Contact → FAQ → Footer ──
  await p.goto(`${BASE}/dev/demo`, { settle: 2200 });
  await press(p, view, q("#hop-tac [data-service=tu-van-mo-hinh]"));
  const region = await p.eval(`(() => { const r = document.querySelector("#hop-tac [role=region]"); const cards = [...document.querySelectorAll("#hop-tac [aria-expanded]")]; return { label: r?.getAttribute("aria-label"), regions: document.querySelectorAll("#hop-tac [role=region]").length, expanded: cards.filter((c) => c.getAttribute("aria-expanded") === "true").map((c) => c.dataset.service), scope: r?.innerText.includes("Không bao gồm thiết kế, thi công") }; })()`);
  ok("S1 one shared detail region follows the chosen card", region.regions === 1 && region.label === "Phát triển dự án (Tư vấn mô hình)" && region.expanded.join() === "tu-van-mo-hinh" && region.scope, region);
  await shot("S-services-consulting");
  await press(p, view, `document.querySelector("#hop-tac [role=region] button")`);
  await sleep(1300);
  const contact = await p.eval(`({ top: Math.round(document.getElementById("lien-he").getBoundingClientRect().top), chip: document.querySelector("#lien-he input[name=service]:checked")?.value, focus: document.activeElement?.name || document.activeElement?.id, url: location.search + location.hash })`);
  ok("S2 CTA scrolls to Contact, keeps the service, places focus", contact.top >= 0 && contact.top < 140 && contact.chip === "tu-van-mo-hinh" && (view.mobile ? contact.focus === "lien-he-title" : contact.focus === "name") && contact.url.includes("dich-vu=tu-van-mo-hinh"), contact);
  const fields = await p.eval(`[...document.querySelectorAll("#lien-he form label > span:first-child, #lien-he legend")].map((e) => e.textContent.replace(/\\s+/g, " ").trim())`);
  ok("S3 contact fields: name, phone/email, service, asset type (optional), notes (optional)", ["Dịch vụ quan tâm", "Họ tên", "Số điện thoại hoặc email", "Loại tài sản", "Nội dung trao đổi"].every((f) => fields.some((x) => x.startsWith(f))), { fields });
  await press(p, view, q("#lien-he button[type=submit]"));
  const invalid = await p.eval(`({ invalid: [...document.querySelectorAll("#lien-he [aria-invalid=true]")].map((e) => e.name), described: [...document.querySelectorAll("#lien-he [aria-invalid=true]")].every((e) => document.getElementById(e.getAttribute("aria-describedby"))?.textContent), focus: document.activeElement?.name, status: document.querySelector("#lien-he [role=status]").textContent })`);
  ok("S4 empty submit: accessible errors, focus on the first", invalid.invalid.join() === "name,reach" && invalid.described && invalid.focus === "name", invalid);
  await shot("S-contact-errors");
  await p.eval(`(() => { const set = (n, v) => { const e = document.querySelector("#lien-he [name=" + n + "]"); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(e, v); e.dispatchEvent(new Event("input", { bubbles: true })); }; set("name", "Nguyễn An"); set("reach", "an@example.com"); })()`);
  await press(p, view, q("#lien-he button[type=submit]"));
  const sent = await p.eval(`({ status: document.querySelector("#lien-he [role=status]").textContent, invalid: document.querySelectorAll("#lien-he [aria-invalid=true]").length, name: document.querySelector("#lien-he [name=name]").value })`);
  ok("S5 valid submit sends nothing and says so; input kept", sent.invalid === 0 && /^Chưa gửi/.test(sent.status) && sent.name === "Nguyễn An", sent);
  await shot("S-contact-unsent");
  await p.goto(`${BASE}/dev/demo?dich-vu=nhuong-quyen#hop-tac`, { settle: 2200 });
  const deep = await p.eval(`({ card: document.querySelector("#hop-tac [data-service=nhuong-quyen]")?.getAttribute("aria-expanded"), chip: document.querySelector("#lien-he input[name=service]:checked")?.value })`);
  ok("S6 a service link or refresh keeps the service (?dich-vu=)", deep.card === "true" && deep.chip === "nhuong-quyen", deep);
  const faq = await p.eval(`(() => { const d = [...document.querySelectorAll("#hoi-dap details")]; d[2].open = true; return new Promise((res) => setTimeout(() => res({ count: d.length, open: d.filter((x) => x.open).length, third: d[2].open }), 150)); })()`);
  ok("S7 FAQ: six questions, one open at a time", faq.count === 6 && faq.open === 1 && faq.third, faq);
  await p.eval(`document.querySelector("#hoi-dap details:nth-of-type(4) summary").focus()`);
  await p.key("Enter");
  ok("S8 FAQ opens with the keyboard", await p.eval(`document.querySelectorAll("#hoi-dap details")[3].open`));
  const links = await p.eval(`[...document.querySelectorAll("footer a")].map((a) => a.getAttribute("href"))`);
  const broken = [];
  for (const href of links) {
    if (/^(tel:|mailto:|https?:)/.test(href)) continue; // checked below as official channels
    const [path, hash] = href.split("#");
    if (path) {
      const res = await fetch(new URL(path, BASE));
      if (res.status !== 200) broken.push(`${href} ${res.status}`);
      if (hash) {
        const html = await res.text();
        if (!html.includes(`id="${hash}"`)) broken.push(`${href} #${hash} missing`);
      }
    } else if (hash && !(await p.eval(`!!document.getElementById(${JSON.stringify(hash)})`))) broken.push(`${href} missing`);
  }
  const channels = await p.eval(`[...document.querySelectorAll("footer a")].filter((a) => /^(tel:|mailto:|https?:\\/\\/(?!localhost))/.test(a.getAttribute("href"))).map((a) => a.getAttribute("href") + (a.target === "_blank" ? " [new tab]" : ""))`);
  const official = ["tel:+84906988261", "mailto:hello@vnest.com.vn", "https://www.facebook.com/vnest.com.vn [new tab]"];
  ok("S9 footer: internal links resolve; only the official hotline, email and Facebook are linked (no Instagram/TikTok)", !broken.length && channels.length === 3 && official.every((o) => channels.includes(o)), { links: links.length, broken, channels });
  const foot = await p.eval(`(() => { const f = document.querySelector("footer"); const c = f.querySelector("[aria-labelledby=footer-contact-title]"); return { headings: [...f.querySelectorAll("h2, h3")].map((h) => h.textContent.trim()), luuTru: /Lưu trú|Nơi lưu trú/.test(f.innerText), contactShare: Math.round((c.getBoundingClientRect().width / f.querySelector("[class*=footerInner]").getBoundingClientRect().width) * 100), phoneSize: parseFloat(getComputedStyle(f.querySelector("a[href^='tel:']")).fontSize) }; })()`);
  ok("F1 footer: no 'Lưu trú' column; Contact is the focal area (≈ half width on desktop, full on phones); large hotline", !foot.luuTru && (view.mobile && view.w < 1024 ? foot.contactShare >= 85 : foot.contactShare >= 40 && foot.contactShare <= 55) && foot.phoneSize >= 24, foot);
  const home = await p.eval(PAGE_FACTS_FOR(view.w));
  ok("S10 homepage: one footer, no overflow, no broken images", home.footers === 1 && !home.overflowX && !home.brokenImages.length, home);

  // ── Brand preview (hover on desktop, tap on touch) and CTA contrast ──
  if (!view.mobile) {
    const tab = await p.eval(center(`document.querySelectorAll("#thuong-hieu [role=tab]")[1]`));
    await p.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: tab.x, y: tab.y });
    await sleep(500);
    const prev = await p.eval(`[...document.querySelectorAll("#thuong-hieu [role=tab]")].map((t) => ({ sel: t.getAttribute("aria-selected"), preview: t.dataset.preview }))`);
    ok("BR hover previews without selecting", prev[1].preview === "true" && prev[1].sel === "false", { prev });
  } else {
    await press(p, view, `document.querySelectorAll("#thuong-hieu [role=tab]")[2]`);
    ok("BR tap selects a brand", (await p.eval(`document.querySelectorAll("#thuong-hieu [role=tab]")[2].getAttribute("aria-selected")`)) === "true");
  }
  const cta = await p.eval(`(() => { const pick = (e) => e && getComputedStyle(e).backgroundColor; return { booking: pick([...document.querySelectorAll("header a, header button")].find((b) => /BOOKING/.test(b.textContent) && b.getClientRects().length)), service: pick(document.querySelector("#hop-tac [role=region] button")) }; })()`);
  ok("C CTA fills use the text-safe copper (white text ≥ 4.5:1)", Object.values(cta).filter(Boolean).every((c) => c === "rgb(154, 104, 60)"), cta);

  results.views.push(r);
  await p.close();
}
quit();
const all = results.views.flatMap((v) => Object.entries(v.checks).map(([k, c]) => ({ view: v.view, k, pass: c.pass })));
results.summary = { checks: all.length, passed: all.filter((c) => c.pass).length, failed: all.filter((c) => !c.pass).map((c) => `${c.view} ${c.k}`), consoleErrors: results.consoleErrors.length, nonGetRequests: results.nonGetRequests.length };
writeFileSync(`${OUT}/results.json`, JSON.stringify(results, null, 2));
console.log(JSON.stringify(results.summary, null, 2));
