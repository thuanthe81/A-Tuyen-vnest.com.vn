// Phase D booking journey QA (owner brief 9/11/2026): homepage guest field (adults + children, no room stepper), the
// single-month calendar (cross-month stay), results, property detail room selection, review and the booking step.
// Checks persistence (address, Back, refresh), missing-date validation, GoHost / ezCloud behaviour with children, no prices,
// no confirmation claims, no horizontal overflow, and no console errors (including React's setState-in-render warning).
// Usage: node docs/qa/booking-ux-phase-d-2026-11-09/scripts/qa-d.mjs http://localhost:3401 [shots-dir]
import { chromium } from "/Users/noe/Documents/GitHub/Cigarettes-After-Sex/node_modules/.pnpm/playwright@1.62.1/node_modules/playwright/index.mjs";
const [base, shots] = process.argv.slice(2);
const browser = await chromium.launch();
const results = [];
const ok = (name, cond, info = "") => results.push(`${cond ? "PASS" : "FAIL"} ${name}${info ? " — " + info : ""}`);
const VIEWPORTS = [
  { name: "1440", width: 1440, height: 900, mobile: false },
  { name: "768", width: 768, height: 1024, mobile: false },
  { name: "390", width: 390, height: 844, mobile: true },
];
const CHECK_IN = /, 28 tháng 11, 2026/;
const CHECK_OUT = /, 2 tháng 12, 2026/;
const CONFIRM_CLAIMS = /đặt phòng thành công|đã xác nhận đặt phòng|booking confirmed|đã giữ phòng cho bạn/i;

async function open(vp, url) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: vp.mobile, hasTouch: vp.mobile });
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => {
    const t = m.text();
    if (m.type() === "error" && !t.startsWith("Failed to load resource") && !t.includes("maps.googleapis")) errors.push(t);
  });
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(url, { waitUntil: "networkidle" });
  return { ctx, page, errors };
}
// Desktop presses are dispatched clicks: an auto-scroll would slide the hero bar under the sticky header and close its panel.
const press = (vp, loc) => (vp.mobile ? loc.tap() : loc.dispatchEvent("click"));
const q = (page) => new URL(page.url()).searchParams;
async function overflow(page, vp) {
  const sw = await page.evaluate(() => document.documentElement.scrollWidth);
  return sw <= vp.width + 1 ? "" : `${sw} > ${vp.width}`;
}
async function shot(page, name) {
  if (shots) await page.screenshot({ path: `${shots}/${name}.png` });
}

for (const vp of VIEWPORTS) {
  const tag = `@${vp.name}`;
  const { ctx, page, errors } = await open(vp, `${base}/dev/demo?intro=0`);

  // ── Homepage bar: one guest field, adults + children, no room stepper ──
  let panel;
  if (vp.mobile) {
    await page.locator('#dat-phong button[aria-haspopup="dialog"]:visible').first().tap();
    await page.locator('dialog[open] [data-section="guests"]').tap();
  } else {
    await page.locator("#dat-phong").evaluate((el) => el.scrollIntoView({ block: "center" }));
    await page.locator('#dat-phong button[data-field="guests"]:visible').first().click();
  }
  panel = page.locator('[data-testid="occupancy-panel"]:visible');
  await panel.waitFor();
  ok(`${tag} homepage panel has no room stepper`, (await panel.getAttribute("data-room-field")) === "hidden" && (await panel.getByRole("button", { name: /phòng$/ }).count()) === 0);
  ok(`${tag} homepage panel: adults and children steppers`, (await panel.getByRole("group", { name: "Người lớn" }).count()) === 1 && (await panel.getByRole("group", { name: "Trẻ em" }).count()) === 1);
  ok(`${tag} children start at 0, cannot go below`, (await panel.getByRole("button", { name: "Bớt một trẻ em" }).isDisabled()) === true);
  await press(vp, panel.getByRole("button", { name: "Thêm một người lớn" }));
  await press(vp, panel.getByRole("button", { name: "Thêm một trẻ em" }));
  const values = await panel.locator("output").allInnerTexts();
  ok(`${tag} 3 adults, 1 child, kept apart`, values.join(",") === "3,1", values.join(","));
  ok(`${tag} child policy note shown once children are added`, (await panel.locator('[data-testid="child-policy-note"]').count()) === 1);
  ok(`${tag} rooms-later note`, /chọn số phòng ở bước chọn phòng/.test(await panel.locator('[data-testid="occupancy-note"]').innerText()));
  await shot(page, `journey-${vp.name}-01-guests`);
  if (!vp.mobile) {
    const field = page.locator('#dat-phong button[data-field="guests"]:visible').first();
    const text = await field.innerText();
    const cut = await field.locator("span").nth(1).evaluate((el) => el.scrollWidth > el.clientWidth + 1);
    ok(`${tag} field reads "Khách · 3 người lớn · 1 trẻ em", not truncated`, /Khách[\s\S]*3 người lớn · 1 trẻ em/i.test(text) && !cut, text.replace(/\s+/g, " "));
    await page.keyboard.press("Escape");
  }

  // ── Missing dates: BOOK NOW does not navigate, it opens the calendar ──
  if (vp.mobile) {
    await page.locator('dialog[open] footer button[type="submit"]').tap();
  } else {
    await page.locator('#dat-phong form[role="search"] button[type="submit"]:visible').first().click();
  }
  await page.waitForTimeout(400);
  ok(`${tag} no dates: stays on the homepage`, new URL(page.url()).pathname === "/dev/demo");
  const months = page.locator("[data-month]:visible");
  ok(`${tag} no dates: the calendar opens`, (await months.count()) >= 1);

  // ── Single-month calendar, cross-month stay ──
  ok(`${tag} calendar shows exactly one month`, (await months.count()) === 1, String(await months.count()));
  const prev = page.getByRole("button", { name: "Tháng trước" }).locator("visible=true");
  ok(`${tag} previous month disabled on the current month`, (await prev.first().isDisabled()) === true);
  await press(vp, page.getByRole("button", { name: CHECK_IN }).locator("visible=true").first());
  await press(vp, page.getByRole("button", { name: "Tháng sau" }).locator("visible=true").first());
  ok(`${tag} next month: still one month, December`, (await months.count()) === 1 && (await months.first().getAttribute("data-month")) === "2026-12-01");
  await shot(page, `journey-${vp.name}-02-calendar-next`);
  await press(vp, page.getByRole("button", { name: CHECK_OUT }).locator("visible=true").first());
  await page.waitForTimeout(300);
  ok(`${tag} calendar: no overflow`, !(await overflow(page, vp)), await overflow(page, vp));

  // ── Search → results ──
  if (vp.mobile) await page.locator('dialog[open] footer button[type="submit"]').tap();
  else await page.locator('#dat-phong form[role="search"] button[type="submit"]:visible').first().click();
  await page.waitForURL((u) => u.pathname === "/dev/demo/tim-phong");
  await page.waitForSelector('[data-testid="property-results"]');
  const p = q(page);
  ok(`${tag} results address: cross-month dates, 3 adults, 1 child, fewest rooms`, p.get("checkIn") === "2026-11-28" && p.get("checkOut") === "2026-12-02" && p.get("adults") === "3" && p.get("children") === "1" && p.get("rooms") === "2,1", page.url());
  const summary = await page.locator('[data-testid="search-summary"]').innerText();
  ok(`${tag} results summary names the children`, /2 phòng · 3 người lớn · 1 trẻ em/.test(summary), summary.replace(/\s+/g, " "));
  for (const id of ["bare-da-kao", "pepper-house"]) {
    const card = page.locator(`[data-property="${id}"]`);
    const status = await card.locator('[data-testid^="availability-"]').first().getAttribute("data-testid");
    ok(`${tag} GoHost ${id} with children: not checked, says why`, status === "availability-needs-provider-check" && /trẻ em/.test(await card.innerText()), status);
  }
  for (const id of ["bare-chic", "the-nang-suites"]) {
    ok(`${tag} ezCloud ${id}: hand-off unchanged`, (await page.locator(`[data-property="${id}"] [data-testid="handoff-cta"]`).count()) === 1);
  }
  ok(`${tag} results: no price`, (await page.locator('[data-testid="verified-price"]').count()) === 0 && !/₫/.test(await page.locator("main").innerText()));
  ok(`${tag} results: no overflow`, !(await overflow(page, vp)), await overflow(page, vp));
  await shot(page, `journey-${vp.name}-03-results`);

  // Results editor: one month, children row.
  await press(vp, page.getByRole("button", { name: "Chỉnh sửa ngày & tìm kiếm" }));
  await press(vp, page.getByRole("tab", { name: /Ngày lưu trú/ }));
  ok(`${tag} results calendar shows one month`, (await page.locator("[data-month]:visible").count()) === 1);
  await press(vp, page.getByRole("tab", { name: /Phòng & khách/ }));
  ok(`${tag} results editor has a children row`, (await page.locator('[data-testid="editor-children-value"]').innerText()) === "1 trẻ em");
  ok(`${tag} results editor shows the child policy`, (await page.locator('[data-testid="child-policy-note"]:visible').count()) === 1);
  await press(vp, page.getByRole("button", { name: "Áp dụng" }));

  // ── Property detail (GoHost: Bare Đa Kao) ──
  await press(vp, page.locator('[data-property="bare-da-kao"] [data-testid="open-property"]'));
  await page.waitForURL((u) => u.pathname === "/dev/stays/bare-da-kao");
  await page.waitForLoadState("networkidle");
  const pp = q(page);
  ok(`${tag} property address keeps the stay and the children`, pp.get("children") === "1" && pp.get("adults") === "3" && pp.get("rooms") === "2,1" && pp.get("checkIn") === "2026-11-28", page.url());
  const occ = page.locator('[data-testid="property-selection-summary-bar"], [aria-label^="Phòng & khách:"]');
  const occText = await page.locator('button[aria-label^="Phòng & khách:"]').first().getAttribute("aria-label");
  ok(`${tag} property summary: 3 adults, 1 child, 2 rooms`, /3 người lớn · 1 trẻ em · 2 phòng/.test(occText ?? ""), occText ?? "");
  void occ;
  // Page calendar (the path of the old setState-in-render warning): one month.
  await press(vp, page.locator('[data-testid="property-dates-trigger"]'));
  const region = page.locator('[role="region"][aria-label="Chọn ngày nhận và trả phòng"]');
  await region.waitFor();
  ok(`${tag} property calendar shows one month`, (await region.locator("[data-month]").count()) === 1);
  await press(vp, page.getByRole("button", { name: "Đóng lịch" }));
  // Choose a room for each slot, then BOOK NOW.
  await press(vp, page.locator('[data-testid="select-room-bare-da-kao-two"]'));
  await press(vp, page.locator('[data-testid="select-room-bare-da-kao-three"]'));
  await press(vp, page.locator('[data-testid="summary-bar-book-now"]'));
  const dialog = page.locator('dialog[data-testid="property-booking-dialog"][open]');
  await dialog.waitFor();
  const dialogText = await dialog.innerText();
  ok(`${tag} review lists the child apart, with the policy note`, /1 trẻ em đi cùng/.test(dialogText) && /đang chờ VNest xác nhận/.test(dialogText));
  ok(`${tag} review: no confirmation claim, no price`, !CONFIRM_CLAIMS.test(dialogText) && !/₫/.test(dialogText));
  await shot(page, `journey-${vp.name}-04-review`);
  ok(`${tag} property: no overflow`, !(await overflow(page, vp)), await overflow(page, vp));
  await press(vp, dialog.locator('a[href*="/dev/demo/dat-phong"]').first());
  await page.waitForURL((u) => u.pathname === "/dev/demo/dat-phong");
  await page.waitForLoadState("networkidle");
  const stepText = await page.locator("main").innerText();
  ok(`${tag} booking step: children listed with the policy note`, (await page.locator('[data-testid="step-children"]').count()) === 1);
  ok(`${tag} booking step: honest, no confirmation, no price`, /chưa được kết nối/.test(stepText) && !CONFIRM_CLAIMS.test(stepText) && !/₫/.test(stepText));
  await shot(page, `journey-${vp.name}-05-step`);

  // Back → property page with everything; refresh keeps it.
  await page.goBack();
  await page.waitForURL((u) => u.pathname === "/dev/stays/bare-da-kao");
  await page.waitForLoadState("networkidle");
  const back = q(page);
  ok(`${tag} Back: property keeps children, rooms and room choices`, back.get("children") === "1" && back.get("rooms") === "2,1" && (back.get("prefs") ?? "").includes("bare-da-kao-two"), page.url());
  await page.reload({ waitUntil: "networkidle" });
  const afterReload = await page.locator('button[aria-label^="Phòng & khách:"]').first().getAttribute("aria-label");
  ok(`${tag} refresh: summary still has the child`, /1 trẻ em/.test(afterReload ?? ""), afterReload ?? "");
  ok(`${tag} refresh: room choices kept`, (await page.locator('[data-testid^="slot-pill-item-"]').allInnerTexts()).join(" ").includes("Two"));

  // Header field on property pages keeps the room stepper (frozen 4/11 field) and adds children.
  if (vp.mobile) {
    await page.locator('header button[aria-haspopup="dialog"]:visible').first().tap();
    await page.locator('dialog[open] [data-section="guests"]').tap();
  } else {
    await page.locator('header button[data-field="guests"]:visible').first().click();
  }
  const ppanel = page.locator('[data-testid="occupancy-panel"]:visible');
  await ppanel.waitFor();
  ok(`${tag} property header panel keeps rooms and shows children`, (await ppanel.getAttribute("data-room-field")) === "shown" && (await ppanel.locator("output").allInnerTexts()).join(",") === "3,1,2");
  await press(vp, ppanel.getByRole("button", { name: "Bớt một trẻ em" }));
  await page.waitForFunction(() => !new URLSearchParams(location.search).has("children"));
  ok(`${tag} removing the child updates the address; rooms and adults unchanged`, q(page).get("rooms") === "2,1" && q(page).get("adults") === "3");

  const cannot = errors.filter((e) => e.includes("Cannot update a component"));
  ok(`${tag} no setState-in-render warning`, cannot.length === 0, cannot[0]?.slice(0, 120));
  ok(`${tag} no console errors`, errors.length === 0, errors[0]?.slice(0, 160));
  await ctx.close();
}

// ezCloud property page with children: hand-off stays honest, children not dropped silently.
{
  const vp = VIEWPORTS[0];
  const { ctx, page, errors } = await open(vp, `${base}/dev/stays/bare-chic?view=demo&checkIn=2026-11-28&checkOut=2026-12-02&rooms=1&adults=2&children=2`);
  const text = await page.locator("main").innerText();
  ok("@1440 ezCloud page: hand-off unconfigured, no price", /chưa được kết nối|Kiểm tra giá & đặt phòng/i.test(text) && !/₫/.test(text));
  const label = await page.locator('button[aria-label^="Phòng & khách:"]').first().getAttribute("aria-label").catch(() => null);
  ok("@1440 ezCloud page: children kept in the header field", /2 trẻ em/.test((await page.locator("header#top").innerText()) + (label ?? "")));
  ok("@1440 ezCloud page: no console errors", errors.length === 0, errors[0]?.slice(0, 160));
  await ctx.close();
}

// Homepage adults: up to the request limit (12), rooms decided later; nothing silently capped below it.
{
  const vp = VIEWPORTS[0];
  const { ctx, page } = await open(vp, `${base}/dev/demo?intro=0`);
  await page.locator("#dat-phong").evaluate((el) => el.scrollIntoView({ block: "center" }));
  await page.locator('#dat-phong button[data-field="guests"]:visible').first().click();
  const panel = page.locator('[data-testid="occupancy-panel"]:visible');
  for (let i = 0; i < 12; i++) {
    const plus = panel.getByRole("button", { name: "Thêm một người lớn" });
    if (await plus.isDisabled()) break;
    await plus.dispatchEvent("click");
  }
  const adults = (await panel.locator("output").allInnerTexts())[0];
  ok("@1440 homepage adults stop at 12 (6 rooms × 2) with a reason", adults === "12" && /Tối đa 6 phòng, 12 người lớn/.test(await panel.innerText()), adults);
  await ctx.close();
}

await browser.close();
console.log(results.join("\n"));
console.log(`\n${results.filter((r) => r.startsWith("PASS")).length}/${results.length} passed`);
