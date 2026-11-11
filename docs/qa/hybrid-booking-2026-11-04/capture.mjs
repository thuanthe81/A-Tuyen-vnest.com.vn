/**
 * Evidence capture for Hybrid Booking V1: screenshots (desktop 1440, mobile 390) and one scripted mobile recording.
 * Run against a private review server:  VNEST_TEST_URL=http://localhost:3402 node docs/qa/hybrid-booking-2026-11-04/capture.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "/Users/noe/Documents/GitHub/Cigarettes-After-Sex/node_modules/.pnpm/playwright@1.62.1/node_modules/playwright/index.mjs";

const BASE = process.env.VNEST_TEST_URL ?? "http://localhost:3402";
const HERE = path.dirname(fileURLToPath(import.meta.url));
const STAY = "checkIn=2026-12-10&checkOut=2026-12-12&rooms=2,2&adults=4";
const browser = await chromium.launch();

async function shot(name, url, { width, height, mobile }, prepare) {
  const context = await browser.newContext({ viewport: { width, height }, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 1 });
  const page = await context.newPage();
  await page.goto(`${BASE}${url}`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.querySelectorAll("img").forEach((i) => (i.loading = "eager")));
  await page.waitForTimeout(900);
  if (prepare) await prepare(page);
  await page.screenshot({ path: path.join(HERE, "screens", `${name}.png`), fullPage: false });
  await context.close();
}
const DESKTOP = { width: 1440, height: 900, mobile: false };
const PHONE = { width: 390, height: 844, mobile: true };
const scrollTo = (selector) => (page) => page.locator(selector).first().evaluate((el) => el.scrollIntoView({ block: "center" })).then(() => page.waitForTimeout(500));

// 1. Homepage booking search
await shot("01-homepage-booking-search-desktop", "/dev/demo?intro=0", DESKTOP, scrollTo("#dat-phong"));
await shot("01-homepage-booking-search-mobile", "/dev/demo?intro=0", PHONE, scrollTo("#dat-phong"));
// 2. Mixed results (current real state: nothing verified) and the simulated mixed states
await shot("02-results-all-real-desktop", `/dev/demo/tim-phong?property=all&${STAY}`, DESKTOP);
await shot("02-results-all-real-desktop-gohost", `/dev/demo/tim-phong?property=all&${STAY}`, DESKTOP, scrollTo('[data-property="bare-da-kao"]'));
await shot("02-results-all-real-mobile", `/dev/demo/tim-phong?property=all&${STAY}`, PHONE, scrollTo('[data-property="bare-chic"]'));
await shot("02-results-mixed-simulated-desktop", `/dev/demo/tim-phong?property=all&${STAY}&sim=bare-da-kao:available,pepper-house:error`, DESKTOP, scrollTo('[data-property="bare-da-kao"]'));
await shot("02-results-mixed-simulated-mobile", `/dev/demo/tim-phong?property=all&${STAY}&sim=bare-da-kao:available,pepper-house:error`, PHONE, scrollTo('[data-property="bare-da-kao"]'));
await shot("02-results-provider-error-mobile", `/dev/demo/tim-phong?property=all&${STAY}&sim=bare-da-kao:available,pepper-house:error`, PHONE, scrollTo('[data-property="pepper-house"]'));
// 3. GoHost-ready property booking
await shot("03-gohost-rooms-simulated-available-desktop", `/dev/demo/tim-phong?property=bare-da-kao&${STAY}&sim=bare-da-kao:available`, DESKTOP);
await shot("03-gohost-rooms-unconfigured-mobile", `/dev/demo/tim-phong?property=bare-da-kao&${STAY}`, PHONE);
await shot("03-gohost-property-page-desktop", `/dev/stays/pepper-house?${STAY}`, DESKTOP, scrollTo("#rooms"));
// 4. ezCloud hand-off
await shot("04-ezcloud-handoff-desktop", `/dev/demo/tim-phong?property=bare-chic&${STAY}`, DESKTOP);
await shot("04-ezcloud-handoff-mobile", `/dev/demo/tim-phong?property=bare-han&${STAY}`, PHONE);
await shot("04-ezcloud-property-page-desktop", `/dev/stays/bare-hyphen?${STAY}`, DESKTOP, scrollTo("#rooms"));
await shot("04-ezcloud-property-page-mobile", `/dev/stays/the-nang-suites?${STAY}`, PHONE, scrollTo("#rooms"));

// 5. Scripted mobile recording (390x844): home search → results → GoHost rooms → Back → ezCloud hand-off → property page → gallery → viewer
const videoContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, recordVideo: { dir: path.join(HERE, "video"), size: { width: 390, height: 844 } } });
const page = await videoContext.newPage();
const pause = (ms) => page.waitForTimeout(ms);
await page.goto(`${BASE}/dev/demo?intro=0`, { waitUntil: "networkidle" });
await pause(800);
await page.goto(`${BASE}/dev/demo/tim-phong?property=all&${STAY}&sim=bare-da-kao:available,pepper-house:error`, { waitUntil: "networkidle" });
await pause(800);
for (const id of ["bare-chic", "bare-da-kao", "pepper-house"]) {
  await page.locator(`[data-property="${id}"]`).evaluate((el) => el.scrollIntoView({ block: "center", behavior: "smooth" }));
  await pause(1200);
}
await page.locator('[data-property="bare-da-kao"] [data-testid="open-property"]').tap();
await page.waitForFunction(() => document.querySelector("h1")?.textContent === "Chọn phòng");
await pause(1500);
await page.goBack();
await page.waitForSelector('[data-testid="property-results"]');
await pause(1000);
await page.locator('[data-property="bare-han"] [data-testid="handoff-cta"]').evaluate((el) => el.scrollIntoView({ block: "center" }));
await pause(700);
await page.locator('[data-property="bare-han"] [data-testid="handoff-cta"]').tap();
await page.waitForSelector('[data-testid="handoff-panel"]');
await pause(1800);
await page.locator('[data-testid="handoff-panel"] a', { hasText: "Xem phòng" }).tap();
await page.waitForURL(/\/dev\/stays\/bare-han/);
await page.waitForLoadState("networkidle");
await page.locator("#rooms").evaluate((el) => el.scrollIntoView({ behavior: "smooth", block: "start" }));
await pause(1500);
const first = page.locator("#rooms li[data-room-id]").first();
await first.scrollIntoViewIfNeeded();
for (let i = 0; i < 3; i += 1) {
  await first.locator('[data-testid="carousel-next"]').tap();
  await pause(500);
}
await first.locator('button[aria-label^="Mở thư viện"]').tap();
await pause(1500);
await page.keyboard.press("Escape");
await pause(800);
await videoContext.close();
const video = fs.readdirSync(path.join(HERE, "video")).find((f) => f.endsWith(".webm"));
if (video) fs.renameSync(path.join(HERE, "video", video), path.join(HERE, "video", "mobile-journey-390.webm"));
await browser.close();
console.log("captured", fs.readdirSync(path.join(HERE, "screens")).length, "screenshots and", video ? "1 video" : "no video");
