/**
 * 05.11 Final copy: screenshots and fit measurements of the longest texts (Pepper House About, the Nắng hover line,
 * the franchising description, FAQ 5) in both languages at 1440 and 390. Usage: node longest.mjs [base]
 */
import { fileURLToPath } from "node:url";
import { chromium } from "/Users/noe/Documents/GitHub/Cigarettes-After-Sex/node_modules/.pnpm/playwright@1.62.1/node_modules/playwright/index.mjs";

const BASE = process.argv[2] ?? "http://localhost:3402";
const OUT = fileURLToPath(new URL("../screens/", import.meta.url));
const browser = await chromium.launch();
const report = [];
for (const lang of ["vi", "en"]) {
  for (const vp of [
    { name: "1440", width: 1440, height: 900, isMobile: false, hasTouch: false },
    { name: "390", width: 390, height: 844, isMobile: true, hasTouch: true },
  ]) {
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: vp.isMobile, hasTouch: vp.hasTouch });
    const page = await context.newPage();
    await page.goto(`${BASE}/dev/demo?intro=0${lang === "en" ? "&lang=en" : ""}`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({ content: "header#top{visibility:hidden!important}" });
    const press = (l) => (vp.hasTouch ? l.tap() : l.click());
    const tabs = page.locator("#thuong-hieu [role=tab]");

    // Pepper House panel (the longest About).
    await press(tabs.nth(2));
    await page.waitForTimeout(250);
    await page.locator("#thuong-hieu").screenshot({ path: `${OUT}brands-pepper-${lang}-${vp.name}.png` });
    const panel = await page.locator("#thuong-hieu [role=tabpanel]").evaluate((el) => Math.round(el.getBoundingClientRect().height));

    // Desktop hover preview on The Nắng Suites (the longest Vietnamese hover line): does the card fit the viewport?
    let preview = null;
    if (!vp.hasTouch) {
      await press(tabs.nth(0));
      await page.mouse.move(0, 0);
      await tabs.nth(1).hover();
      const card = page.locator('#thuong-hieu [data-placed="true"]');
      await card.waitFor();
      preview = await card.evaluate((el) => {
        const r = el.getBoundingClientRect();
        return { top: Math.round(r.top), bottom: Math.round(r.bottom), height: Math.round(r.height), inView: r.top >= 0 && r.bottom <= innerHeight };
      });
      await page.locator("#thuong-hieu").screenshot({ path: `${OUT}brands-hover-nang-${lang}-${vp.name}.png` });
      await page.mouse.move(0, 0);
    }

    // Franchising detail (the longest description).
    const cards = page.locator("#hop-tac button[aria-expanded]");
    await press(cards.nth(2));
    await page.waitForTimeout(350);
    await page.locator("#hop-tac").screenshot({ path: `${OUT}services-franchise-${lang}-${vp.name}.png` });
    const cardHeights = await cards.evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().height)));
    const detail = await page.locator("#hop-tac [role=region]").evaluate((el) => Math.round(el.getBoundingClientRect().height));

    // FAQ 5 open (the longest answer).
    const items = page.locator("#hoi-dap details");
    await press(items.nth(4).locator("summary"));
    await page.waitForTimeout(150);
    await page.locator("#hoi-dap").screenshot({ path: `${OUT}faq-5-${lang}-${vp.name}.png` });
    const faq5 = await items.nth(4).locator("p").evaluate((el) => Math.round(el.getBoundingClientRect().height));

    report.push({ lang, vp: vp.name, brandPanelPx: panel, preview, serviceCardsPx: cardHeights, franchiseDetailPx: detail, faq5AnswerPx: faq5 });
    await context.close();
  }
}
await browser.close();
console.log(JSON.stringify(report, null, 1));
