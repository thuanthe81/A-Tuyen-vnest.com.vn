/**
 * Complete mobile homepage booking journey at 390×844 (touch), recorded, with an assertion and a screenshot per step.
 *   VNEST_TEST_URL=http://localhost:3402 node docs/qa/hybrid-booking-v1.1-final-2026-11-04/mobile-journey.mjs
 * Writes journey-log.json (every step: URL, scroll lock, open dialogs) and video/mobile-homepage-journey-390.webm.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "/Users/noe/Documents/GitHub/Cigarettes-After-Sex/node_modules/.pnpm/playwright@1.62.1/node_modules/playwright/index.mjs";

const BASE = process.env.VNEST_TEST_URL ?? "http://localhost:3402";
const HERE = path.dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2,
  recordVideo: { dir: path.join(HERE, "video"), size: { width: 390, height: 844 } },
});
const page = await context.newPage();
const consoleErrors = [];
const hydration = [];
page.on("console", (m) => {
  const text = m.text();
  if (/hydrat|did not match|#418|#423|#425/i.test(text)) hydration.push(text);
  if (m.type() === "error" && !text.startsWith("Failed to load resource")) consoleErrors.push(text);
});
page.on("pageerror", (e) => consoleErrors.push(`pageerror: ${e}`));
page.on("response", (r) => { if (r.status() >= 400 && r.url().startsWith(BASE)) consoleErrors.push(`${r.status()} ${r.url()}`); });

const log = [];
let n = 0;
async function step(name, check) {
  await page.waitForTimeout(450);
  const state = await page.evaluate(() => ({
    url: location.pathname + location.search,
    scrollLock: document.documentElement.style.overflow || "",
    openDialogs: document.querySelectorAll("dialog[open]").length,
    overflowX: document.documentElement.scrollWidth - innerWidth,
    nextRouterState: Boolean(history.state && history.state.__NA),
  }));
  if (check) await check(state);
  n += 1;
  const shot = `${String(n).padStart(2, "0")}-${name}.png`;
  await page.screenshot({ path: path.join(HERE, "screens", shot) });
  log.push({ step: n, name, ...state, screenshot: `screens/${shot}` });
  console.log(`${String(n).padStart(2, "0")} ${name}  ${state.url}  lock="${state.scrollLock}" dialogs=${state.openDialogs}`);
}
const q = (state) => new URL(state.url, BASE).searchParams;

// 1. Homepage
await page.goto(`${BASE}/dev/demo?intro=0`, { waitUntil: "networkidle" });
await step("homepage", (s) => { assert.equal(s.scrollLock, ""); assert.equal(s.overflowX <= 0, true); });

// 2. Open the search sheet by touch
await page.locator('#dat-phong button[aria-haspopup="dialog"]:visible').first().scrollIntoViewIfNeeded();
await page.locator('#dat-phong button[aria-haspopup="dialog"]:visible').first().tap();
const sheet = page.locator("dialog.vn-sheet[open]");
await sheet.waitFor({ state: "visible" });
await step("search-sheet-open", (s) => { assert.equal(s.openDialogs, 1); assert.equal(s.scrollLock, "hidden", "page scroll locked under the sheet"); });

// 3. Dates: 10 → 12 December
const tenth = sheet.getByRole("button", { name: /Thứ Năm, 10 tháng 12, 2026/ });
await tenth.scrollIntoViewIfNeeded();
await tenth.tap();
await sheet.getByRole("button", { name: /Thứ Bảy, 12 tháng 12, 2026/ }).tap();
await step("dates-selected", async () => {
  assert.match(await sheet.innerText(), /10 thg 12/);
  assert.match(await sheet.innerText(), /12 thg 12/);
});

// 4. Guests: 2 → 3
const guests = sheet.getByRole("button", { name: /^Khách/ }).first();
if (await guests.isVisible()) await guests.tap();
await sheet.getByRole("button", { name: "Thêm một khách" }).tap();
await step("guests-3", async () => assert.match(await sheet.innerText(), /Người lớn\s*3/));

// 5. Search all properties
await sheet.getByRole("button", { name: "BOOK NOW" }).tap();
await page.waitForURL(/\/dev\/demo\/tim-phong/);
await page.waitForSelector('[data-testid="property-results"]');
await step("results-all-properties", (s) => {
  const p = q(s);
  assert.equal(p.get("property"), "all"); assert.equal(p.get("checkIn"), "2026-12-10"); assert.equal(p.get("checkOut"), "2026-12-12");
  assert.equal(p.get("adults"), "3"); assert.equal(s.openDialogs, 0); assert.equal(s.scrollLock, "", "scroll lock released after the sheet");
  assert.equal(s.nextRouterState, true, "router entry state kept");
});

// 6. Rooms: 1 → 2 (the 02.1 sheet has no room field; the results editor sets it)
await page.getByRole("button", { name: "Chỉnh sửa ngày & tìm kiếm" }).tap();
await page.getByRole("tab", { name: /Phòng & khách/ }).tap();
await page.getByRole("button", { name: "+ Thêm phòng" }).first().tap();
await step("rooms-2-in-editor", async () => assert.match(await page.getByRole("tab", { name: /Phòng & khách/ }).innerText(), /2 phòng/));
await page.getByRole("button", { name: "Áp dụng" }).tap();
await step("rooms-applied", (s) => { const r = q(s).get("rooms"); assert.ok(r === "2,1" || r === "1,2" || r?.split(",").length === 2, `two rooms in the address (${r})`); assert.equal(q(s).get("adults") , String(r.split(",").reduce((a, b) => a + Number(b), 0))); });
const resultsUrl = log.at(-1).url;

// 7. Navigate to a property ("Chọn phòng" on Pepper House)
const card = page.locator('[data-property="pepper-house"]');
await card.scrollIntoViewIfNeeded();
await card.locator('[data-testid="open-property"]').tap();
await page.waitForURL((u) => u.pathname === "/dev/stays/pepper-house");
await page.waitForSelector("#property-title");
await step("property-page", (s) => {
  const p = q(s);
  assert.equal(p.get("checkIn"), "2026-12-10"); assert.equal(p.get("checkOut"), "2026-12-12");
  assert.equal(p.get("rooms")?.split(",").length, 2, "rooms carried"); assert.equal(s.scrollLock, ""); assert.equal(s.openDialogs, 0);
});
await page.locator("#rooms").scrollIntoViewIfNeeded();
await step("property-rooms", async () => assert.match(await page.locator('[data-testid="room-count-value"]').innerText(), /2 phòng/));

// 8. Back to the results
await page.goBack();
await page.waitForSelector('[data-testid="property-results"]');
await step("back-to-results", (s) => {
  assert.equal(s.url.replace(/%2C/g, ","), resultsUrl.replace(/%2C/g, ","), "Back restores the same search");
  assert.equal(s.scrollLock, ""); assert.equal(s.openDialogs, 0);
});

// 9. Edit the search: new dates 15 → 17 December
await page.evaluate(() => scrollTo(0, 0));
await page.getByRole("button", { name: "Chỉnh sửa ngày & tìm kiếm" }).tap();
await page.getByRole("tab", { name: /Ngày lưu trú/ }).tap();
const next = page.getByRole("button", { name: /Thứ Ba, 15 tháng 12, 2026/ });
if ((await next.count()) === 0) await page.getByRole("button", { name: "Tháng sau" }).first().tap();
await page.getByRole("button", { name: /Thứ Ba, 15 tháng 12, 2026/ }).tap();
await page.getByRole("button", { name: /Thứ Năm, 17 tháng 12, 2026/ }).tap();
await step("search-edited", async (s) => {
  const p = q(s);
  assert.equal(p.get("checkIn"), "2026-12-15"); assert.equal(p.get("checkOut"), "2026-12-17");
  assert.equal(p.get("rooms")?.split(",").length, 2, "rooms kept while editing dates"); assert.equal(p.get("adults"), q({ url: resultsUrl }).get("adults"));
  assert.match(await page.locator('[data-testid="search-summary"]').innerText(), /15 thg 12 – 17 thg 12 \(2 đêm\)/);
});

// 10. Refresh keeps the edited search
await page.reload({ waitUntil: "networkidle" });
await step("refresh-keeps-search", async (s) => {
  assert.equal(q(s).get("checkIn"), "2026-12-15");
  assert.match(await page.locator('[data-testid="search-summary"]').innerText(), /15 thg 12 – 17 thg 12/);
  assert.equal(s.scrollLock, ""); assert.equal(s.openDialogs, 0); assert.equal(s.overflowX <= 0, true);
});

await context.close();
const video = fs.readdirSync(path.join(HERE, "video")).find((f) => f.endsWith(".webm") && !f.startsWith("mobile-"));
if (video) fs.renameSync(path.join(HERE, "video", video), path.join(HERE, "video", "mobile-homepage-journey-390.webm"));
await browser.close();
fs.writeFileSync(path.join(HERE, "journey-log.json"), JSON.stringify({ viewport: "390x844 touch", steps: log, consoleErrors, hydrationWarnings: hydration }, null, 2));
console.log("console errors:", consoleErrors.length, "hydration warnings:", hydration.length);
assert.deepEqual(consoleErrors, []);
assert.deepEqual(hydration, []);
console.log("JOURNEY PASS");
