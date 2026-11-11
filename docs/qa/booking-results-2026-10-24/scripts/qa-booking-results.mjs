// VNest V3 — Dedicated Booking Results & Multi-Room Selection QA (/dev/demo/tim-phong)
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

  // 1. Load /dev/demo/tim-phong (defaults to Bare Chic, Nov 6-8 2026, 2 rooms, 4 adults)
  await p.goto(`${BASE}/dev/demo/tim-phong`, { settle: 2000 });
  await p.eval(`window.scrollTo(0, 0)`);
  await sleep(300);

  const initial = await p.eval(`(() => {
    const h1 = document.querySelector("h1")?.textContent?.trim() ?? "";
    const bodyText = document.body.innerText;
    const forms = [...document.querySelectorAll("form[role=search]")].filter((f) => f.getClientRects().length);
    const roomCards = [...document.querySelectorAll("li[id^='phong-']")].map((li) => li.querySelector("h3")?.textContent?.trim());
    return {
      h1,
      searchBars: forms.length,
      roomCards,
      hasHonestNotice: bodyText.includes("Tính năng kiểm tra phòng trống và giá theo ngày đang được hoàn thiện."),
      hasFakeAvailable: /Còn \\d+ phòng|Đặt phòng thành công|Xác nhận giữ chỗ/i.test(bodyText),
    };
  })()`);

  ok("single booking search bar on page", initial.searchBars === 1, { searchBars: initial.searchBars });
  ok("Bare Chic heading & 4 catalog rooms shown", initial.h1.includes("Bare Chic") && initial.roomCards.length === 4, initial);
  ok("honest PMS notice present and zero fake availability claims", initial.hasHonestNotice && !initial.hasFakeAvailable);

  await p.shot(`${OUT}/${view.name}-1-initial-results.png`);
  await p.shot(`${OUT}/${view.name}-1-initial-full.png`, { full: true });

  // 2. Open Multi-Room & Guest Selector and test adding/adjusting/removing room groups
  await press(p, view, `document.querySelector("button[data-field='guests rooms']")`);
  await sleep(400);
  await p.shot(`${OUT}/${view.name}-2-room-selector-open.png`);

  // Add Room 3
  await press(p, view, `[...document.querySelectorAll("button")].find((b) => b.textContent.includes("+ Thêm phòng (2/6)"))`);
  await sleep(300);
  // Increase Room 2 adults to 3
  await press(p, view, `document.querySelector("button[aria-label='Thêm người lớn cho Phòng 2']")`);
  await sleep(300);
  const afterRoomEdit = await p.eval(`(() => {
    const field = document.querySelector("button[data-field='guests rooms']")?.innerText?.replace(/\\n/g, " ") ?? "";
    return { field };
  })()`);
  ok("multi-room selector: added Room 3 and updated Room 2 to 3 adults (total 3 rooms, 7 adults)", afterRoomEdit.field.includes("3 phòng · 7 người lớn"), afterRoomEdit);
  await p.shot(`${OUT}/${view.name}-3-room-selector-3rooms.png`);

  // Remove Room 3 and restore Room 2 to 2 adults so we have the 2 rooms / 4 adults scenario
  await press(p, view, `document.querySelector("button[aria-label='Xoá Phòng 3']")`);
  await sleep(250);
  await press(p, view, `document.querySelector("button[aria-label='Bớt người lớn cho Phòng 2']")`);
  await sleep(250);
  await press(p, view, `[...document.querySelectorAll("button")].find((b) => b.textContent.includes("Xác nhận (2 phòng · 4 người lớn)"))`);
  await sleep(350);

  // 3. Provisional Room Preference Selection & Unique Physical Unit Enforcement
  // Select Bare Chic One for Room 1
  await press(p, view, `[...document.querySelectorAll("#phong-bare-chic-one button")].find((b) => b.textContent.includes("Chọn dự kiến cho Phòng 1"))`);
  await sleep(400);

  const afterSelectOne = await p.eval(`(() => {
    const oneCard = document.querySelector("#phong-bare-chic-one");
    const buttons = [...oneCard.querySelectorAll("button")].map((b) => ({ text: b.textContent.trim(), disabled: b.disabled }));
    const disabledForSlot2 = buttons.find((b) => b.text.includes("Phòng 2: Đã chọn ở Phòng 1"));
    return { buttons, disabledForSlot2: !!disabledForSlot2 && disabledForSlot2.disabled };
  })()`);
  ok("unique physical unit: Bare Chic One selected for Room 1 and prevented from duplicate selection for Room 2", afterSelectOne.disabledForSlot2, afterSelectOne);

  // Select Bare Chic Two for Room 2
  await press(p, view, `[...document.querySelectorAll("#phong-bare-chic-two button")].find((b) => b.textContent.includes("Chọn dự kiến cho Phòng 2"))`);
  await sleep(400);

  const afterSelectBoth = await p.eval(`(() => {
    const summary = document.querySelector("aside")?.innerText?.replace(/\\n+/g, " | ") ?? "";
    return {
      summary,
      hasBothRooms: summary.includes("Đã chọn 2/2 phòng dự kiến") && summary.includes("Bare Chic One") && summary.includes("Bare Chic Two"),
      unverifiedCapWarning: summary.includes("Sức chứa tối đa chưa xác minh"),
    };
  })()`);
  ok("both rooms selected with honest capacity distinction (verified vs unverified)", afterSelectBoth.hasBothRooms && afterSelectBoth.unverifiedCapWarning, afterSelectBoth);

  await p.eval(`document.querySelector("#phong-bare-chic-one")?.scrollIntoView({ block: "start", behavior: "instant" }); window.scrollBy(0, -24);`);
  await sleep(300);
  await p.shot(`${OUT}/${view.name}-4-rooms-selected.png`);

  // 4. Open Review Selection Dialog (Step 4 -> Step 5)
  if (view.w < 1024) {
    await press(p, view, `document.querySelector("[aria-label='Tóm tắt lựa chọn nhanh'] button")`);
  } else {
    await press(p, view, `[...document.querySelectorAll("aside button")].find((b) => b.textContent.includes("Xem lại lựa chọn dự kiến"))`);
  }
  await sleep(500);
  const reviewModal = await p.eval(`(() => {
    const d = document.querySelector("dialog[aria-labelledby='review-dialog-title']");
    return { open: !!d?.open, text: d?.textContent?.replace(/\\s+/g, " ") ?? "" };
  })()`);
  ok("Review Selection modal opens and clearly distinguishes provisional preferences from confirmed booking", reviewModal.open && /Bước 04/i.test(reviewModal.text) && /Lựa chọn dự kiến/i.test(reviewModal.text), reviewModal);
  await p.shot(`${OUT}/${view.name}-5-review-selection-modal.png`);
  await p.key("Escape");
  await p.eval(`document.querySelector("dialog[aria-labelledby='review-dialog-title']")?.close()`);
  await sleep(300);

  // 5. Switch to All 6 Properties ("Tất cả 6 nơi lưu trú") to verify grouping by property
  await press(p, view, `document.querySelector("button[data-field='property']")`);
  await sleep(300);
  await press(p, view, `[...document.querySelectorAll("button")].find((b) => b.textContent.includes("Tất cả 6 nơi lưu trú") && b.hasAttribute("aria-pressed"))`);
  await sleep(500);
  const allPropsCount = await p.eval(`document.querySelectorAll("section[id^='co-so-']").length`);
  ok("switching to All Properties groups results into all 6 VNest properties", allPropsCount === 6, { allPropsCount });
  await p.eval(`window.scrollTo(0, 0)`);
  await sleep(300);
  await p.shot(`${OUT}/${view.name}-6-all-properties-grouped.png`);

  const pageFacts = await p.eval(FACTS);
  ok("no horizontal overflow and 0 broken images", !pageFacts.overflowX && pageFacts.brokenImages.length === 0, pageFacts);
  r.facts = pageFacts;

  await p.close();
  results.views.push(r);
  console.log(view.name, Object.entries(r.checks).filter(([, v]) => (typeof v === "object" ? !v.pass : !v)).map(([k]) => k));
}

writeFileSync(`${OUT}/results.json`, JSON.stringify(results, null, 2));
console.log("consoleErrors:", results.consoleErrors.length);
quit();
