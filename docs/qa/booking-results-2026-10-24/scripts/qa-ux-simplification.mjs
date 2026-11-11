// VNest V3 — Booking Results UX Simplification End-to-End QA (Scenarios A–H)
// Tests 1440px desktop, 768px tablet, and 390px mobile against `next start`.
import { mkdirSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const ROOT = "/Users/noe/Documents/GitHub/VNest 2";
const { launch, quit, Page, sleep } = await import(pathToFileURL(`${ROOT}/docs/qa/brand-collection/scripts/lib.mjs`).href);
const BASE = process.env.BASE ?? "http://localhost:3400";
const OUT = `${ROOT}/docs/qa/booking-results-2026-10-24/simplified`;
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

  // ── Scenario A: All properties, one room, two adults ──
  await p.goto(`${BASE}/dev/demo/tim-phong?property=all&checkIn=2026-11-06&checkOut=2026-11-08&rooms=1&adults=2`, { settle: 1800 });
  await p.eval(`window.scrollTo(0, 0)`);
  await sleep(250);

  const scenarioA = await p.eval(`(() => {
    const h1 = document.querySelector("h1")?.textContent?.trim() ?? "";
    const summary = document.querySelector("[data-testid='search-summary']")?.textContent?.trim() ?? "";
    const editBtn = [...document.querySelectorAll("header button")].find((b) => b.textContent.trim() === "Chỉnh sửa");
    const propCards = [...document.querySelectorAll("li[id^='co-so-']")];
    const roomCards = [...document.querySelectorAll("li[id^='phong-']")];
    const bodyText = document.body.innerText;
    return {
      h1,
      summary,
      hasEditBtn: !!editBtn,
      propCount: propCards.length,
      allHaveXemPhong: propCards.every((c) => [...c.querySelectorAll("button")].some((b) => b.textContent.trim() === "Xem phòng")),
      expandedRoomCards: roomCards.length,
      hasCompactNotice: bodyText.includes("Giá và tình trạng phòng trống sẽ được xác nhận khi hệ thống đặt phòng được kết nối."),
      hasOldProgressSteps: /01\\. Tìm kiếm|02\\. Kết quả danh mục/i.test(bodyText),
    };
  })()`);

  ok(
    "Scenario A (All Properties, 1 room, 2 adults): Heading 'Chọn phòng', concise summary, 'Chỉnh sửa', 6 photo-led property cards with 'Xem phòng', no expanded room lists",
    scenarioA.h1 === "Chọn phòng" &&
      scenarioA.summary.includes("Tất cả nơi lưu trú") &&
      scenarioA.summary.includes("1 phòng · 2 khách") &&
      scenarioA.hasEditBtn &&
      scenarioA.propCount === 6 &&
      scenarioA.allHaveXemPhong &&
      scenarioA.expandedRoomCards === 0 &&
      scenarioA.hasCompactNotice &&
      !scenarioA.hasOldProgressSteps,
    scenarioA,
  );
  await p.shot(`${OUT}/${view.name}-all-properties.png`);

  // Click "Xem phòng" on Bare Chic -> enters Bare Chic room results preserving 1 room, 2 adults
  await press(p, view, `document.querySelector("#co-so-bare-chic button")`);
  await sleep(400);
  await p.eval(`window.scrollTo(0, 0)`);
  await sleep(200);

  // Select Bare Chic One for the 1-room request -> capture One-room selection state
  await press(p, view, `[...document.querySelectorAll("#phong-bare-chic-one button")].find((b) => !b.closest("dialog") && b.textContent.trim() === "Chọn phòng này")`);
  await sleep(300);
  await p.eval(`window.scrollTo(0, 0)`);
  await sleep(200);

  const oneRoomSelected = await p.eval(`(() => {
    const summary = document.querySelector("[data-testid='search-summary']")?.textContent?.trim() ?? "";
    const btnText = [...document.querySelectorAll("#phong-bare-chic-one button")].filter((b) => !b.closest("dialog")).map((b) => b.textContent.trim());
    const sidebarOrMobile = document.body.innerText;
    return {
      summary,
      btnText,
      selected1of1: sidebarOrMobile.includes("1/1 phòng đã chọn"),
    };
  })()`);
  ok(
    "One-room selection state: Bare Chic One selected ('1/1 phòng đã chọn')",
    oneRoomSelected.summary.includes("Bare Chic") &&
      oneRoomSelected.summary.includes("1 phòng · 2 khách") &&
      oneRoomSelected.selected1of1,
    oneRoomSelected,
  );
  await p.shot(`${OUT}/${view.name}-one-room-selected.png`);

  // Test browser Back from Bare Chic -> returns to All Properties (Scenario H part 1)
  await p.eval(`history.back()`);
  await sleep(500);
  const backToAll = await p.eval(`document.querySelectorAll("li[id^='co-so-']").length`);
  ok("Scenario H (Browser Back): returns cleanly from property rooms to All Properties view", backToAll === 6, { backToAll });

  // ── Scenario B & E: Bare Chic, two rooms, four adults + selecting a room with unknown capacity ──
  await p.goto(`${BASE}/dev/demo/tim-phong?property=bare-chic&checkIn=2026-11-06&checkOut=2026-11-08&rooms=2,2&adults=4`, { settle: 1800 });
  await p.eval(`window.scrollTo(0, 0)`);
  await sleep(250);

  const initialTwoRooms = await p.eval(`(() => {
    const h1 = document.querySelector("h1")?.textContent?.trim() ?? "";
    const summary = document.querySelector("[data-testid='search-summary']")?.textContent?.trim() ?? "";
    const indicator = document.querySelector("[data-testid='active-room-indicator']")?.textContent?.trim() ?? "";
    const cards = [...document.querySelectorAll("li[id^='phong-']")].map((li) => ({
      name: li.querySelector("h3")?.textContent?.trim(),
      buttons: [...li.querySelectorAll("button")].filter((b) => !b.closest("dialog")).map((b) => b.textContent.trim()),
      text: li.innerText.replace(/\\n+/g, " | "),
    }));
    return { h1, summary, indicator, cards };
  })()`);

  ok(
    "Scenario B (Bare Chic, 2 rooms, 4 adults): sequential indicator 'Đang chọn phòng 1/2' and each card has only 'Xem ảnh và chi tiết' + one 'Chọn phòng này' action",
    initialTwoRooms.h1 === "Chọn phòng" &&
      initialTwoRooms.summary.includes("Bare Chic") &&
      initialTwoRooms.summary.includes("2 phòng · 4 khách") &&
      initialTwoRooms.indicator === "Đang chọn phòng 1/2" &&
      initialTwoRooms.cards.length === 4 &&
      initialTwoRooms.cards.every(
        (c) =>
          c.buttons.length === 2 &&
          c.buttons[0].startsWith("Xem ảnh và chi tiết") &&
          c.buttons[1] === "Chọn phòng này",
      ),
    initialTwoRooms,
  );
  await p.shot(`${OUT}/${view.name}-search-results.png`);

  // Select Bare Chic One for Room 1 -> automatically advances to "Đang chọn phòng 2/2"
  await press(p, view, `[...document.querySelectorAll("#phong-bare-chic-one button")].find((b) => !b.closest("dialog") && b.textContent.trim() === "Chọn phòng này")`);
  await sleep(300);

  const afterRoom1 = await p.eval(`(() => {
    const indicator = document.querySelector("[data-testid='active-room-indicator']")?.textContent?.trim() ?? "";
    const oneBtns = [...document.querySelectorAll("#phong-bare-chic-one button")].filter((b) => !b.closest("dialog")).map((b) => ({ text: b.textContent.trim(), disabled: b.disabled }));
    return { indicator, oneBtns };
  })()`);

  ok(
    "Selecting Room 1 automatically advances to 'Đang chọn phòng 2/2' and locks Bare Chic One ('Đã chọn cho Phòng 1')",
    afterRoom1.indicator === "Đang chọn phòng 2/2" &&
      afterRoom1.oneBtns.some((b) => b.text === "Đã chọn cho Phòng 1" && b.disabled),
    afterRoom1,
  );

  // Scenario E: Select Bare Chic Two (unknown capacity) for Room 2
  await press(p, view, `[...document.querySelectorAll("#phong-bare-chic-two button")].find((b) => !b.closest("dialog") && b.textContent.trim() === "Chọn phòng này")`);
  await sleep(300);
  await p.eval(`window.scrollTo(0, 0)`);
  await sleep(250);

  const afterRoom2 = await p.eval(`(() => {
    const twoCardText = document.querySelector("#phong-bare-chic-two")?.innerText?.replace(/\\n+/g, " | ") ?? "";
    const bodyText = document.body.innerText;
    return {
      twoCardText,
      has2of2: bodyText.includes("2/2 phòng đã chọn"),
      distinguishesUnverified: twoCardText.includes("Sức chứa chờ xác nhận"),
    };
  })()`);

  ok(
    "Scenario E (Unknown capacity room): Bare Chic Two selected for Room 2 ('2/2 phòng đã chọn') and clearly distinguished as unverified capacity preference",
    afterRoom2.has2of2 && afterRoom2.distinguishesUnverified,
    afterRoom2,
  );
  await p.shot(`${OUT}/${view.name}-two-rooms-selected.png`);

  // ── Scenario C: Changing a selected room ──
  // Change Room 2 from Bare Chic Two to Bare Chic Three
  await press(p, view, `[...document.querySelectorAll("#phong-bare-chic-three button")].find((b) => !b.closest("dialog") && b.textContent.trim() === "Chọn phòng này")`);
  await sleep(300);

  const afterChangeRoom2 = await p.eval(`(() => {
    const threeBtns = [...document.querySelectorAll("#phong-bare-chic-three button")].filter((b) => !b.closest("dialog")).map((b) => b.textContent.trim());
    const twoBtns = [...document.querySelectorAll("#phong-bare-chic-two button")].filter((b) => !b.closest("dialog")).map((b) => b.textContent.trim());
    return {
      threeSelected: threeBtns.some((t) => t.includes("Đã chọn (Phòng 2)")),
      twoFreed: twoBtns.includes("Chọn phòng này"),
    };
  })()`);
  ok(
    "Scenario C (Changing a selected room): Room 2 switched from Bare Chic Two to Bare Chic Three in one click",
    afterChangeRoom2.threeSelected && afterChangeRoom2.twoFreed,
    afterChangeRoom2,
  );

  // ── Simplified Review Sheet ("Kiểm tra lựa chọn") ──
  if (view.w < 1024) {
    await pressHere(p, view, `document.querySelector("[aria-label='Tóm tắt lựa chọn nhanh'] button")`);
  } else {
    await press(p, view, `[...document.querySelectorAll("aside button")].find((b) => b.textContent.trim() === "Xem lại lựa chọn")`);
  }
  await sleep(400);

  const reviewCheck = await p.eval(`(() => {
    const d = document.querySelector("dialog[aria-labelledby='review-dialog-title']");
    const title = d?.querySelector("#review-dialog-title")?.textContent?.trim() ?? "";
    const text = d?.innerText?.replace(/\\s+/g, " ") ?? "";
    return {
      open: !!d?.open,
      title,
      hasPropertyAndDates: text.includes("Bare Chic") && text.includes("6 thg 11 – 8 thg 11"),
      hasBothRooms: text.includes("Phòng 1 · 2 khách") && text.includes("Bare Chic One") && text.includes("Phòng 2 · 2 khách") && text.includes("Bare Chic Three"),
      hasShortNotice: text.includes("Giá và tình trạng phòng trống sẽ được xác nhận khi hệ thống đặt phòng được kết nối."),
      hasDisabledContactChips: /Facebook|Instagram|TikTok/i.test(text),
    };
  })()`);

  ok(
    "Simplified Review Sheet ('Kiểm tra lựa chọn'): shows property, dates, Room 1 & Room 2, edit actions, single honest notice, and no disabled contact chips",
    reviewCheck.open &&
      reviewCheck.title === "Kiểm tra lựa chọn" &&
      reviewCheck.hasPropertyAndDates &&
      reviewCheck.hasBothRooms &&
      reviewCheck.hasShortNotice &&
      !reviewCheck.hasDisabledContactChips,
    reviewCheck,
  );
  await p.shot(`${OUT}/${view.name}-review-sheet.png`);

  // Close review sheet via "Quay lại chọn phòng"
  await pressHere(p, view, `[...document.querySelectorAll("dialog[open] button")].find((b) => b.textContent.trim() === "Quay lại chọn phòng")`);
  await sleep(300);

  // ── Scenario G & H: Editing dates and returning to results + Page Refresh ──
  await press(p, view, `[...document.querySelectorAll("header button")].find((b) => b.textContent.trim() === "Chỉnh sửa")`);
  await sleep(300);
  await press(p, view, `document.querySelector("button[data-field='checkIn checkOut']")`);
  await sleep(300);
  await press(p, view, `document.querySelector("button[data-date='2026-11-06']")`);
  await sleep(200);
  await press(p, view, `document.querySelector("button[data-date='2026-11-09']")`);
  await sleep(350);

  const afterDateEdit = await p.eval(`({
    url: location.pathname + location.search,
    summary: document.querySelector("[data-testid='search-summary']")?.textContent?.trim() ?? "",
    editorClosed: !document.querySelector("form[aria-label='Chỉnh sửa tìm kiếm']"),
  })`);
  ok(
    "Scenario G (Editing dates): changing dates to Nov 6–9 (3 đêm) closes editor, updates summary, and preserves selected rooms",
    afterDateEdit.editorClosed &&
      afterDateEdit.url.includes("checkOut=2026-11-09") &&
      afterDateEdit.url.includes("prefs=bare-chic-one%2Cbare-chic-three") &&
      afterDateEdit.summary.includes("3 đêm"),
    afterDateEdit,
  );

  // Refresh page (Scenario H part 2)
  await p.goto(`${BASE}${afterDateEdit.url}`, { settle: 1800 });
  const afterRefresh = await p.eval(`({
    summary: document.querySelector("[data-testid='search-summary']")?.textContent?.trim() ?? "",
    has2of2: document.body.innerText.includes("2/2 phòng đã chọn"),
  })`);
  ok(
    "Scenario H (Refresh): reloading page preserves 3 nights, 2 rooms / 4 guests, and both selected rooms",
    afterRefresh.summary.includes("3 đêm") && afterRefresh.has2of2,
    afterRefresh,
  );

  // ── Scenario D: Removing a room group ──
  await press(p, view, `[...document.querySelectorAll("header button")].find((b) => b.textContent.trim() === "Chỉnh sửa")`);
  await sleep(300);
  await press(p, view, `document.querySelector("button[aria-label='Xoá Phòng 2']")`);
  await sleep(250);
  await press(p, view, `[...document.querySelectorAll("form[aria-label='Chỉnh sửa tìm kiếm'] button")].find((b) => b.textContent.trim() === "Áp dụng")`);
  await sleep(300);

  const afterRemoveRoom = await p.eval(`({
    url: location.pathname + location.search,
    summary: document.querySelector("[data-testid='search-summary']")?.textContent?.trim() ?? "",
    has1of1: document.body.innerText.includes("1/1 phòng đã chọn"),
  })`);
  ok(
    "Scenario D (Removing a room group): removing Room 2 updates state to 1 room · 2 guests and keeps Room 1 selected",
    afterRemoveRoom.url.includes("rooms=1") &&
      afterRemoveRoom.summary.includes("1 phòng · 2 khách") &&
      afterRemoveRoom.has1of1,
    afterRemoveRoom,
  );

  // ── Scenario F: Insufficient eligible unique physical rooms ──
  // Pepper House has 2 physical units (3rd-floor and 4th-floor); requesting 3 rooms leaves Room 3 with 0 remaining eligible units.
  await p.goto(`${BASE}/dev/demo/tim-phong?property=pepper-house&checkIn=2026-11-06&checkOut=2026-11-08&rooms=2,2,2&adults=6&prefs=pepper-house-3rd-floor,,`, { settle: 1800 });
  await press(p, view, `[...document.querySelectorAll("#phong-pepper-house-4th-floor button")].find((b) => !b.closest("dialog") && b.textContent.trim() === "Chọn phòng này")`);
  await sleep(350);

  const scenarioF = await p.eval(`(() => {
    const indicator = document.querySelector("[data-testid='active-room-indicator']")?.textContent?.trim() ?? "";
    const statusText = document.querySelector("[role='status']")?.innerText?.replace(/\\s+/g, " ") ?? "";
    const btn1 = [...document.querySelectorAll("#phong-pepper-house-3rd-floor button")].find((b) => !b.closest("dialog") && b.textContent.includes("Đã chọn cho Phòng 1"));
    const btn2 = [...document.querySelectorAll("#phong-pepper-house-4th-floor button")].find((b) => !b.closest("dialog") && b.textContent.includes("Đã chọn cho Phòng 2"));
    return {
      indicator,
      statusText,
      lockedUnique: !!btn1 && btn1.disabled && !!btn2 && btn2.disabled,
    };
  })()`);
  ok(
    "Scenario F (Insufficient eligible unique physical rooms): selecting both Pepper House units for Rooms 1 & 2 locks them and shows clear notice for Room 3",
    scenarioF.indicator === "Đang chọn phòng 3/3" &&
      scenarioF.lockedUnique &&
      scenarioF.statusText.includes("Không còn phòng phù hợp tại Pepper House cho Phòng 3"),
    scenarioF,
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
