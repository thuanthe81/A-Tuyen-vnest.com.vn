// VNest V3 — End-to-End Multi-Room Booking Journey Integration QA
// Tests 1440px (desktop mouse), 768px (tablet touch), and 390px (mobile touch) against `next start`.
import { mkdirSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const ROOT = "/Users/noe/Documents/GitHub/VNest 2";
const { launch, quit, Page, sleep } = await import(pathToFileURL(`${ROOT}/docs/qa/brand-collection/scripts/lib.mjs`).href);
const BASE = process.env.BASE ?? "http://localhost:3402";
const OUT = `${ROOT}/docs/qa/booking-results-2026-10-24`;
mkdirSync(OUT, { recursive: true });

const VIEWS = [
  { name: "1440", w: 1440, h: 920, dpr: 1, mobile: false },
  { name: "768", w: 768, h: 1024, dpr: 1, mobile: true },
  { name: "390", w: 390, h: 844, dpr: 2, mobile: true },
];

const CLS = `window.__shifts=[];new PerformanceObserver(l=>{for(const e of l.getEntries())window.__shifts.push({v:e.value,i:e.hadRecentInput})}).observe({type:"layout-shift",buffered:true});`;

const FACTS = `(() => ({
  url: location.pathname + location.search,
  overflowX: document.documentElement.scrollWidth > innerWidth,
  scrollWidth: document.documentElement.scrollWidth,
  innerWidth,
  brokenImages: [...document.images].filter((i) => i.complete && i.naturalWidth === 0 && i.getClientRects().length).map((i) => i.src),
  cls: +(window.__shifts ?? []).filter((x) => !x.i).reduce((a, x) => a + x.v, 0).toFixed(4),
}))()`;

async function at(p, js) {
  return p.eval(`(() => { const e = ${js}; if (!e) return null; e.scrollIntoView({ block: "center", behavior: "instant" }); const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
}
async function press(p, view, js) {
  const c = await at(p, js);
  if (!c) throw new Error(`not found: ${js}`);
  await sleep(180);
  if (view.mobile) await p.tap(c.x, c.y);
  else await p.click(c.x, c.y);
}
async function pressHere(p, view, js) {
  const c = await p.eval(`(() => { const e = ${js}; if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
  if (!c) throw new Error(`not found: ${js}`);
  await sleep(150);
  if (view.mobile) await p.tap(c.x, c.y);
  else await p.click(c.x, c.y);
}

console.log(await launch());
const results = { base: BASE, date: "2026-10-24", views: [], consoleErrors: [] };

for (const view of VIEWS) {
  const r = { view: view.name, checks: {} };
  const ok = (name, value, detail) => (r.checks[name] = detail === undefined ? value : { pass: value, ...detail });
  const p = await Page.open();
  p.on("Runtime.exceptionThrown", (e) => results.consoleErrors.push({ view: view.name, text: e.exceptionDetails?.exception?.description?.slice(0, 200) }));
  p.on("Runtime.consoleAPICalled", (e) => e.type === "error" && results.consoleErrors.push({ view: view.name, text: e.args?.map((a) => a.value ?? a.description).join(" ").slice(0, 200) }));
  await p.viewport(view.w, view.h, view.dpr, view.mobile);
  await p.send("Page.addScriptToEvaluateOnNewDocument", { source: CLS });

  // ── 1. Homepage BOOK NOW (1 room / 2 adults, All Properties) → Booking Results ──
  await p.goto(`${BASE}/dev/demo?checkIn=2026-11-06&checkOut=2026-11-08&adults=2`, { settle: 2000 });
  if (view.w < 768) {
    // On mobile <768px, open the compact 02.1 pill sheet then submit BOOK NOW
    await pressHere(p, view, `[...document.querySelectorAll("#dat-phong button[aria-haspopup=dialog]")].find((b) => b.getClientRects().length)`);
    await sleep(400);
    await pressHere(p, view, `[...document.querySelectorAll("dialog[open] form[role=search] button[type=submit]")].find((b) => b.getClientRects().length)`);
  } else {
    await pressHere(p, view, `[...document.querySelectorAll("#dat-phong form[role=search] button[type=submit]")].find((b) => b.getClientRects().length)`);
  }
  await sleep(2000);

  const fromHomeAll = await p.eval(`(() => {
    const url = location.pathname + location.search;
    const sections = document.querySelectorAll("section[id^='co-so-']").length;
    const roomField = document.querySelector("button[data-field='guests rooms']")?.innerText?.replace(/\\n/g, " ") ?? "";
    const specsText = document.querySelector("#phong-bare-chic-one dl")?.innerText?.replace(/\\n/g, " | ") ?? "";
    const bodyText = document.body.innerText;
    return {
      url,
      sections,
      roomField,
      specsText,
      hasHonestNotice: bodyText.includes("Tính năng kiểm tra phòng trống và giá theo ngày đang được hoàn thiện."),
      hasFakeAvail: /Còn \\d+ phòng|Đặt phòng thành công|Xác nhận giữ chỗ/i.test(bodyText),
    };
  })()`);

  ok(
    "Homepage BOOK NOW (All Properties, 1 room / 2 adults) → /dev/demo/tim-phong with 6 grouped properties",
    fromHomeAll.url.startsWith("/dev/demo/tim-phong") &&
      fromHomeAll.url.includes("property=all") &&
      fromHomeAll.url.includes("rooms=1") &&
      fromHomeAll.url.includes("adults=2") &&
      fromHomeAll.sections === 6 &&
      fromHomeAll.roomField.includes("1 phòng · 2 người lớn") &&
      fromHomeAll.hasHonestNotice &&
      !fromHomeAll.hasFakeAvail,
    fromHomeAll,
  );
  ok(
    "Room card distinguishes roomType (Loại phòng), physicalUnits (1 căn độc bản), and inventoryQuantity (Chờ phản hồi ezCloud / PMS)",
    fromHomeAll.specsText.includes("Loại phòng") &&
      fromHomeAll.specsText.includes("Studio") &&
      fromHomeAll.specsText.includes("Đơn vị vật lý") &&
      fromHomeAll.specsText.includes("1 căn độc bản") &&
      fromHomeAll.specsText.includes("Tồn kho khả dụng") &&
      fromHomeAll.specsText.includes("Chờ phản hồi ezCloud / PMS"),
    { specsText: fromHomeAll.specsText },
  );
  await p.shot(`${OUT}/${view.name}-journey-1-home-all-properties.png`);

  // ── 2. Property page viewer & drawer BOOK NOW → Booking Results ──
  // 2a. Viewer BOOK NOW without dates opens date picker
  await p.goto(`${BASE}/dev/stays/bare-chic?view=demo`, { settle: 2000 });
  await press(p, view, `document.querySelector("ul[aria-label*='ảnh'] li button")`);
  await sleep(1000);
  await pressHere(p, view, `[...document.querySelectorAll("dialog[open] button")].find((b) => b.textContent.includes("BOOK NOW"))`);
  await sleep(900);
  const viewerNoDates = await p.eval(`({
    viewerClosed: !document.querySelector("dialog[open] figure"),
    datesOpen: !!document.querySelector("header form[role=search] div[role=dialog]") || !!document.querySelector("dialog[open] form[role=search]"),
  })`);
  ok("Property photo viewer BOOK NOW without dates closes viewer and opens date picker", viewerNoDates.viewerClosed && viewerNoDates.datesOpen, viewerNoDates);

  // 2b. Room drawer BOOK NOW with dates carries property, dates, guests, and auto-assigns room preference on Booking Results
  await p.goto(`${BASE}/dev/stays/bare-chic?view=demo&checkIn=2026-11-06&checkOut=2026-11-08&adults=2`, { settle: 2000 });
  await press(p, view, `[...document.querySelectorAll("button")].filter((b) => b.textContent.startsWith("Xem chi tiết phòng"))[1]`);
  await sleep(900);
  await pressHere(p, view, `[...document.querySelectorAll("dialog[open] button")].find((b) => b.textContent.includes("BOOK NOW"))`);
  await sleep(2000);

  const fromDrawer = await p.eval(`(() => {
    const url = location.pathname + location.search;
    const sections = document.querySelectorAll("section[id^='co-so-']").length;
    const summary = document.querySelector("aside")?.innerText?.replace(/\\n+/g, " | ") ?? "";
    return {
      url,
      sections,
      summary,
      preselectedBareChicTwo: url.includes("prefs=bare-chic-two") && summary.includes("Bare Chic Two"),
    };
  })()`);
  ok(
    "Property room drawer BOOK NOW → /dev/demo/tim-phong constrained to Bare Chic with Bare Chic Two pre-selected",
    fromDrawer.url.startsWith("/dev/demo/tim-phong") &&
      fromDrawer.url.includes("property=bare-chic") &&
      fromDrawer.sections === 1 &&
      fromDrawer.preselectedBareChicTwo,
    fromDrawer,
  );
  await p.shot(`${OUT}/${view.name}-journey-2-from-property-drawer.png`);

  // ── 3. Multi-Room Selection: 2 rooms / 4 adults & 3 room groups ──
  await p.goto(`${BASE}/dev/demo/tim-phong`, { settle: 1800 });
  await p.eval(`window.scrollTo(0, 0)`);
  await sleep(250);
  await p.shot(`${OUT}/${view.name}-1-initial-results.png`);
  await p.shot(`${OUT}/${view.name}-1-initial-full.png`, { full: true });

  // Open Multi-Room selector -> add Room 3, set Room 2 to 3 adults (3 rooms / 7 adults)
  await press(p, view, `document.querySelector("button[data-field='guests rooms']")`);
  await sleep(350);
  await p.shot(`${OUT}/${view.name}-2-room-selector-open.png`);
  await press(p, view, `[...document.querySelectorAll("button")].find((b) => b.textContent.includes("+ Thêm phòng (2/6)"))`);
  await sleep(250);
  await press(p, view, `document.querySelector("button[aria-label='Thêm người lớn cho Phòng 2']")`);
  await sleep(250);
  const threeGroups = await p.eval(`document.querySelector("button[data-field='guests rooms']")?.innerText?.replace(/\\n/g, " ") ?? ""`);
  ok("Three room groups (2 + 3 + 2 = 7 adults) supported", threeGroups.includes("3 phòng · 7 người lớn"), { threeGroups });
  await p.shot(`${OUT}/${view.name}-3-room-selector-3rooms.png`);

  // Remove Room 3 and restore Room 2 to 2 adults (2 rooms / 4 adults)
  await press(p, view, `document.querySelector("button[aria-label='Xoá Phòng 3']")`);
  await sleep(250);
  await press(p, view, `document.querySelector("button[aria-label='Bớt người lớn cho Phòng 2']")`);
  await sleep(250);
  await press(p, view, `[...document.querySelectorAll("button")].find((b) => b.textContent.includes("Xác nhận (2 phòng · 4 người lớn)"))`);
  await sleep(350);

  // Select Bare Chic One for Room 1 and Bare Chic Two for Room 2
  await press(p, view, `[...document.querySelectorAll("#phong-bare-chic-one button")].find((b) => b.textContent.includes("Chọn dự kiến cho Phòng 1"))`);
  await sleep(350);
  const uniqueCheck = await p.eval(`(() => {
    const oneCard = document.querySelector("#phong-bare-chic-one");
    const btn2 = [...oneCard.querySelectorAll("button")].find((b) => b.textContent.includes("Phòng 2: Đã chọn ở Phòng 1"));
    return { lockedForSlot2: !!btn2 && btn2.disabled };
  })()`);
  ok("Unique physical unit: Bare Chic One locked against duplicate selection in Room 2", uniqueCheck.lockedForSlot2, uniqueCheck);

  await press(p, view, `[...document.querySelectorAll("#phong-bare-chic-two button")].find((b) => b.textContent.includes("Chọn dự kiến cho Phòng 2"))`);
  await sleep(350);
  await p.eval(`document.querySelector("#phong-bare-chic-one")?.scrollIntoView({ block: "start", behavior: "instant" }); window.scrollBy(0, -24);`);
  await sleep(250);
  await p.shot(`${OUT}/${view.name}-4-rooms-selected.png`);

  // ── 4. Changing Dates & Refresh / Back Navigation Persistence ──
  await press(p, view, `document.querySelector("button[data-field='checkIn checkOut']")`);
  await sleep(350);
  await press(p, view, `document.querySelector("button[data-date='2026-11-06']")`);
  await sleep(200);
  await press(p, view, `document.querySelector("button[data-date='2026-11-09']")`);
  await sleep(400);

  const afterDateChange = await p.eval(`({
    url: location.pathname + location.search,
    summary: document.querySelector("aside")?.innerText?.replace(/\\n+/g, " | ") ?? "",
  })`);
  ok(
    "Changing dates to Nov 6–9 (3 nights) updates URL and preserves room groups and provisional room preferences",
    afterDateChange.url.includes("checkOut=2026-11-09") &&
      afterDateChange.url.includes("prefs=bare-chic-one%2Cbare-chic-two") &&
      afterDateChange.summary.includes("3 đêm") &&
      afterDateChange.summary.includes("Bare Chic One") &&
      afterDateChange.summary.includes("Bare Chic Two"),
    afterDateChange,
  );

  // Reload page to verify refresh persistence
  await p.goto(`${BASE}${afterDateChange.url}`, { settle: 1800 });
  const afterReload = await p.eval(`({
    url: location.pathname + location.search,
    summary: document.querySelector("aside")?.innerText?.replace(/\\n+/g, " | ") ?? "",
  })`);
  ok(
    "Page refresh preserves dates (3 nights), 2 rooms / 4 adults, and provisional preferences (Bare Chic One & Two)",
    afterReload.url.includes("checkOut=2026-11-09") &&
      afterReload.summary.includes("Đã chọn 2/2 phòng dự kiến") &&
      afterReload.summary.includes("Bare Chic One") &&
      afterReload.summary.includes("Bare Chic Two"),
    afterReload,
  );

  // ── 5. Review Selected Rooms (Step 04) → Preserved Demo Booking Step (Step 05, /dev/demo/dat-phong) & Back Navigation ──
  if (view.w < 1024) {
    await press(p, view, `document.querySelector("[aria-label='Tóm tắt lựa chọn nhanh'] button")`);
  } else {
    await press(p, view, `[...document.querySelectorAll("aside button")].find((b) => b.textContent.includes("Xem lại lựa chọn dự kiến"))`);
  }
  await sleep(450);
  await p.shot(`${OUT}/${view.name}-5-review-selection-modal.png`);

  // Navigate to Step 05 (/dev/demo/dat-phong) from the Review modal
  await press(p, view, `[...document.querySelectorAll("dialog[open] a")].find((a) => a.textContent.includes("Xem bản tóm tắt yêu cầu lưu trú"))`);
  await sleep(1800);
  const onStep05 = await p.eval(`({
    url: location.pathname + location.search,
    text: document.body.innerText.replace(/\\s+/g, " "),
  })`);
  ok(
    "Review modal links cleanly to Step 05 (/dev/demo/dat-phong) showing multi-room allocation and honest no-PMS notice",
    onStep05.url.startsWith("/dev/demo/dat-phong") &&
      onStep05.text.includes("2 phòng · 4 khách") &&
      onStep05.text.includes("Bare Chic One") &&
      onStep05.text.includes("Bare Chic Two") &&
      onStep05.text.includes("chưa được kết nối"),
    { url: onStep05.url },
  );
  await p.eval(`window.scrollTo(0, 0)`);
  await sleep(250);
  await p.shot(`${OUT}/${view.name}-journey-3-step05-summary.png`);

  // Click back link to Booking Results (/dev/demo/tim-phong)
  await press(p, view, `[...document.querySelectorAll("main a")].find((a) => a.textContent.includes("Quay lại trang kết quả") || a.textContent.includes("Quay lại bảng chọn phòng"))`);
  await sleep(1800);
  const backToResults = await p.eval(`({
    url: location.pathname + location.search,
    summary: document.querySelector("aside")?.innerText?.replace(/\\n+/g, " | ") ?? "",
  })`);
  ok(
    "Returning from Step 05 to Booking Results preserves dates, 2 rooms / 4 adults, and both selected rooms",
    backToResults.url.startsWith("/dev/demo/tim-phong") &&
      backToResults.summary.includes("Đã chọn 2/2 phòng dự kiến") &&
      backToResults.summary.includes("Bare Chic One") &&
      backToResults.summary.includes("Bare Chic Two"),
    backToResults,
  );

  // ── 6. Changing Property Scope (Bare Chic → All 6 Properties → The Nắng Suites) ──
  await press(p, view, `document.querySelector("button[data-field='property']")`);
  await sleep(300);
  await press(p, view, `[...document.querySelectorAll("button")].find((b) => b.textContent.includes("Tất cả 6 nơi lưu trú") && b.hasAttribute("aria-pressed"))`);
  await sleep(450);
  const allPropsCount = await p.eval(`document.querySelectorAll("section[id^='co-so-']").length`);
  ok("Changing property to All Properties shows all 6 grouped properties", allPropsCount === 6, { allPropsCount });
  await p.eval(`window.scrollTo(0, 0)`);
  await sleep(250);
  await p.shot(`${OUT}/${view.name}-6-all-properties-grouped.png`);

  // Switch property to The Nắng Suites
  await press(p, view, `document.querySelector("button[data-field='property']")`);
  await sleep(300);
  await press(p, view, `[...document.querySelectorAll("button")].find((b) => b.textContent.includes("The Nắng Suites") && b.hasAttribute("aria-pressed"))`);
  await sleep(450);
  const nangScope = await p.eval(`({
    url: location.pathname + location.search,
    sections: document.querySelectorAll("section[id^='co-so-']").length,
    h1: document.querySelector("h1")?.textContent?.trim() ?? "",
    summary: document.querySelector("aside")?.innerText?.replace(/\\n+/g, " | ") ?? "",
  })`);
  ok(
    "Changing property to The Nắng Suites constrains results to 1 property and clears incompatible Bare Chic preferences",
    nangScope.url.includes("property=the-nang-suites") &&
      nangScope.sections === 1 &&
      nangScope.h1.includes("The Nắng Suites") &&
      nangScope.summary.includes("Đã chọn 0/2 phòng dự kiến"),
    nangScope,
  );

  const pageFacts = await p.eval(FACTS);
  ok("No horizontal overflow and 0 broken images", !pageFacts.overflowX && pageFacts.brokenImages.length === 0, pageFacts);
  r.facts = pageFacts;

  await p.close();
  results.views.push(r);
  console.log(view.name, "failed checks:", Object.entries(r.checks).filter(([, v]) => (typeof v === "object" ? !v.pass : !v)).map(([k]) => k));
}

writeFileSync(`${OUT}/results.json`, JSON.stringify(results, null, 2));
console.log("consoleErrors:", results.consoleErrors.length);
quit();
