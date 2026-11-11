// Phase B "before" screenshots of the brand section (#thuong-hieu) as it was on 7/11/2026, before any Phase B change.
// Usage: node shots-b-before.mjs http://localhost:3401 <out-dir>
import { chromium } from "/Users/noe/Documents/GitHub/Cigarettes-After-Sex/node_modules/.pnpm/playwright@1.62.1/node_modules/playwright/index.mjs";
const [base, out] = process.argv.slice(2);
const W = [1440, 1024, 768, 430, 390, 375];
const browser = await chromium.launch();
for (const width of W) {
  const mobile = width < 1024;
  const ctx = await browser.newContext({ viewport: { width, height: mobile ? 844 : 900 }, isMobile: mobile, hasTouch: mobile, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await page.goto(`${base}/dev/demo?intro=0`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({ content: "#top{visibility:hidden!important}" });
  const sec = page.locator("#thuong-hieu");
  await sec.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await sec.screenshot({ path: `${out}/brands-initial-${width}.png` });
  if (!mobile) {
    await page.locator('#thuong-hieu [role=tab][data-brand="pepper-house"]').hover();
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${out}/brands-hover-pepper-${width}.png` });
    await page.mouse.move(0, 0);
  }
  await ctx.close();
}
await browser.close();
