/**
 * Occupancy correction: screenshots of the shared "Phòng & khách" panel, the results page's room controls and the property
 * page's room step. Usage: node capture.mjs <before|after> [base]
 */
import { fileURLToPath } from "node:url";
import { chromium } from "/Users/noe/Documents/GitHub/Cigarettes-After-Sex/node_modules/.pnpm/playwright@1.62.1/node_modules/playwright/index.mjs";

const label = process.argv[2] ?? "after";
const BASE = process.argv[3] ?? "http://localhost:3402";
const OUT = fileURLToPath(new URL("../screens/", import.meta.url));
const DATES = "checkIn=2026-12-10&checkOut=2026-12-12";
const browser = await chromium.launch();
const hideHeader = (page) => page.addStyleTag({ content: "header#top{visibility:hidden!important}" });

for (const vp of [
  { name: "1440", width: 1440, height: 900, isMobile: false, hasTouch: false },
  { name: "390", width: 390, height: 844, isMobile: true, hasTouch: true },
]) {
  const ctx = () => browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: vp.isMobile, hasTouch: vp.hasTouch });

  // 1. Homepage panel at 2 guests / 1 room, then one more guest.
  {
    const context = await ctx();
    const page = await context.newPage();
    await page.goto(`${BASE}/dev/demo?intro=0&rooms=1&adults=2`, { waitUntil: "networkidle" });
    if (vp.hasTouch) {
      await page.locator('#dat-phong button[aria-haspopup="dialog"]:visible').first().tap();
      await page.locator('dialog[open] [data-section="guests"]').tap();
    } else {
      await page.locator("#dat-phong").evaluate((el) => el.scrollIntoView({ block: "center" }));
      await page.locator('button[data-field="guests"]:visible').first().click();
    }
    const panel = page.locator('[data-testid="occupancy-panel"]:visible');
    await panel.waitFor();
    await page.waitForTimeout(450);
    await panel.screenshot({ path: `${OUT}${label}-panel-2g1r-${vp.name}.png` });
    await panel.getByRole("button", { name: "Thêm một khách" }).click({ noWaitAfter: true }).catch(() => {});
    await page.waitForTimeout(250);
    await panel.screenshot({ path: `${OUT}${label}-panel-after-plus-guest-${vp.name}.png` });
    await context.close();
  }

  // 2. Results page (GoHost property): the room controls and the "Phòng & khách" editor tab.
  {
    const context = await ctx();
    const page = await context.newPage();
    await page.goto(`${BASE}/dev/demo/tim-phong?property=bare-da-kao&${DATES}&rooms=2,1&adults=3`, { waitUntil: "networkidle" });
    await hideHeader(page);
    const bar = page.locator('section[aria-label="Tiến trình chọn phòng"]');
    if (await bar.count()) await bar.screenshot({ path: `${OUT}${label}-results-roombar-${vp.name}.png` });
    const aside = page.locator("aside").first();
    if (vp.width >= 1024 && (await aside.count())) await aside.screenshot({ path: `${OUT}${label}-results-summary-${vp.name}.png` });
    await page.getByRole("button", { name: "Chỉnh sửa ngày & tìm kiếm" }).click();
    await page.getByRole("tab", { name: /Phòng & khách/ }).click();
    await page.locator('[role="tabpanel"]').screenshot({ path: `${OUT}${label}-results-editor-${vp.name}.png` });
    await context.close();
  }

  // 3. Property page with an outdated address: 3 guests in 1 room.
  {
    const context = await ctx();
    const page = await context.newPage();
    await page.goto(`${BASE}/dev/stays/bare-da-kao?view=demo&${DATES}&rooms=1&adults=3`, { waitUntil: "networkidle" });
    await hideHeader(page);
    const card = page.locator('[role="region"][aria-label^="Tuỳ chọn lưu trú"]');
    await card.scrollIntoViewIfNeeded();
    await card.screenshot({ path: `${OUT}${label}-property-deeplink-3g1r-${vp.name}.png` });
    await context.close();
  }
}
await browser.close();
console.log("done", label);
