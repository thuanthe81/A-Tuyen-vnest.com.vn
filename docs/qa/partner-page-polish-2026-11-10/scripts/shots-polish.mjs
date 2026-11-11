// Partner page polish screenshots (10/11/2026): the hero without its service list and the brand row, desktop
// (1440, 1024), tablet (768) and phone (390), plus full pages.
// Usage: node shots-polish.mjs http://localhost:3401 <out-dir>
import { chromium } from "/Users/noe/Documents/GitHub/Cigarettes-After-Sex/node_modules/.pnpm/playwright@1.62.1/node_modules/playwright/index.mjs";
const [base, out] = process.argv.slice(2);
const browser = await chromium.launch();
for (const width of [1440, 1024, 768, 390]) {
  const mobile = width < 1024;
  const page = await browser.newPage({ viewport: { width, height: mobile ? 844 : 900 }, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 2 });
  await page.goto(`${base}/dev/demo/hop-tac`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 500) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 40));
    }
    window.scrollTo(0, 0);
  });
  await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
  await page.waitForTimeout(300);
  if (width === 1440 || width === 390) await page.screenshot({ path: `${out}/partner-page-${width === 1440 ? "desktop" : "mobile"}-full.png`, fullPage: true });
  await page.addStyleTag({ content: "#top{visibility:hidden!important}" });
  await page.locator("main section[aria-labelledby='hop-tac-title']").screenshot({ path: `${out}/hero-${width}.png` });
  const brands = page.locator("#thuong-hieu");
  await brands.scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  await brands.screenshot({ path: `${out}/brands-${width}.png` });
  await page.close();
}
await browser.close();
