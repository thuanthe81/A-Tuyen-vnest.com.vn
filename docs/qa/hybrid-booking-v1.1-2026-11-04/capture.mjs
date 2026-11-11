/**
 * Evidence for Hybrid Booking V1.1: Pepper House (desktop 1440, mobile 390), the revised result cards, and one scripted
 * mobile recording of the discovery navigation.  VNEST_TEST_URL=http://localhost:3402 node docs/qa/hybrid-booking-v1.1-2026-11-04/capture.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "/Users/noe/Documents/GitHub/Cigarettes-After-Sex/node_modules/.pnpm/playwright@1.62.1/node_modules/playwright/index.mjs";

const BASE = process.env.VNEST_TEST_URL ?? "http://localhost:3402";
const HERE = path.dirname(fileURLToPath(import.meta.url));
const STAY = "checkIn=2026-12-10&checkOut=2026-12-12&rooms=2,2&adults=4";
const DESKTOP = { width: 1440, height: 900, mobile: false };
const PHONE = { width: 390, height: 844, mobile: true };
const browser = await chromium.launch();

async function shot(name, url, vp, prepare) {
  const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: vp.mobile, hasTouch: vp.mobile });
  const page = await context.newPage();
  await page.goto(`${BASE}${url}`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.querySelectorAll("img").forEach((i) => (i.loading = "eager")));
  await page.waitForTimeout(900);
  if (prepare) await prepare(page);
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(HERE, "screens", `${name}.png`) });
  await context.close();
}
const center = (selector) => (page) => page.locator(selector).first().evaluate((el) => el.scrollIntoView({ block: "center" }));
const top = (selector) => (page) => page.locator(selector).first().evaluate((el) => { el.scrollIntoView({ block: "start" }); window.scrollBy(0, -80); });
const openViewer = async (page) => {
  await page.locator("button", { hasText: /Xem tất cả \d+ ảnh/ }).first().click();
  await page.waitForTimeout(600);
};

// Revised result cards: "Chọn phòng" → property page; provider action secondary.
await shot("01-results-cards-desktop", `/dev/demo/tim-phong?property=all&${STAY}`, DESKTOP, center('[data-property="bare-da-kao"]'));
await shot("01-results-cards-mobile", `/dev/demo/tim-phong?property=all&${STAY}`, PHONE, center('[data-property="pepper-house"]'));
// Pepper House
await shot("02-pepper-house-hero-desktop", `/dev/stays/pepper-house?${STAY}`, DESKTOP);
await shot("02-pepper-house-hero-mobile", `/dev/stays/pepper-house?${STAY}`, PHONE);
await shot("03-pepper-house-rooms-desktop", `/dev/stays/pepper-house?${STAY}`, DESKTOP, top("#rooms"));
await shot("03-pepper-house-3rd-floor-mobile", `/dev/stays/pepper-house?${STAY}`, PHONE, top('li[data-room-id="pepper-house-3rd-floor"]'));
await shot("03-pepper-house-4th-floor-mobile", `/dev/stays/pepper-house?${STAY}`, PHONE, top('li[data-room-id="pepper-house-4th-floor"]'));
await shot("03-pepper-house-4th-floor-desktop", `/dev/stays/pepper-house?${STAY}`, DESKTOP, top('li[data-room-id="pepper-house-4th-floor"]'));
await shot("04-pepper-house-all-photos-desktop", `/dev/stays/pepper-house?${STAY}`, DESKTOP, openViewer);
await shot("04-pepper-house-all-photos-mobile", `/dev/stays/pepper-house?${STAY}`, PHONE, openViewer);

// Mobile recording: results → "Chọn phòng" (Bare Đa Kao page) → Back → Pepper House → rooms, swipe, viewer → Back → explicit availability search.
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, recordVideo: { dir: path.join(HERE, "video"), size: { width: 390, height: 844 } } });
const page = await ctx.newPage();
const pause = (ms) => page.waitForTimeout(ms);
const toCard = async (id) => { await page.locator(`[data-property="${id}"]`).evaluate((el) => el.scrollIntoView({ block: "center", behavior: "smooth" })); await pause(1100); };
await page.goto(`${BASE}/dev/demo/tim-phong?property=all&${STAY}`, { waitUntil: "networkidle" });
await pause(900);
await toCard("bare-da-kao");
await page.locator('[data-property="bare-da-kao"] [data-testid="open-property"]').tap();
await page.waitForSelector("#property-title");
await pause(1500);
await page.locator("#rooms").evaluate((el) => el.scrollIntoView({ behavior: "smooth" }));
await pause(1500);
await page.goBack();
await page.waitForSelector('[data-testid="property-results"]');
await pause(900);
await toCard("pepper-house");
await page.locator('[data-property="pepper-house"] [data-testid="open-property"]').tap();
await page.waitForSelector("#property-title");
await pause(1400);
for (const room of ["pepper-house-3rd-floor", "pepper-house-4th-floor"]) {
  const li = page.locator(`li[data-room-id="${room}"]`);
  await li.evaluate((el) => el.scrollIntoView({ block: "start", behavior: "smooth" }));
  await pause(1000);
  for (let i = 0; i < 3; i += 1) { await li.locator('[data-testid="carousel-next"]').tap(); await pause(550); }
}
await page.locator('li[data-room-id="pepper-house-4th-floor"] button[aria-label^="Mở thư viện"]').tap();
await pause(1500);
await page.keyboard.press("Escape");
await pause(600);
await page.goBack();
await page.waitForSelector('[data-testid="property-results"]');
await pause(800);
await toCard("pepper-house");
await page.locator('[data-property="pepper-house"] [data-testid="check-availability"]').tap();
await page.waitForFunction(() => document.querySelector("h1")?.textContent === "Chọn phòng");
await pause(1600);
await ctx.close();
const video = fs.readdirSync(path.join(HERE, "video")).find((f) => f.endsWith(".webm") && !f.startsWith("mobile-"));
if (video) fs.renameSync(path.join(HERE, "video", video), path.join(HERE, "video", "mobile-navigation-390.webm"));
await browser.close();
console.log("screens:", fs.readdirSync(path.join(HERE, "screens")).length, "video:", Boolean(video));
