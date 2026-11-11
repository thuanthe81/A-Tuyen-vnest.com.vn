// Phase D booking bar + calendar screenshots (before and after use the same script).
// Usage: node shots.mjs http://localhost:3401 <out-dir>
// Homepage bar (desktop field / phone pill), its guests panel, and its calendar, at 1440, 768 and 390.
import { chromium } from "/Users/noe/Documents/GitHub/Cigarettes-After-Sex/node_modules/.pnpm/playwright@1.62.1/node_modules/playwright/index.mjs";
const [base, out] = process.argv.slice(2);
const browser = await chromium.launch();
const hide = "#top{visibility:hidden!important} nextjs-portal{display:none!important}";
for (const width of [1440, 768, 390]) {
  const mobile = width < 768;
  const page = await browser.newPage({ viewport: { width, height: mobile ? 844 : 900 }, isMobile: mobile, hasTouch: mobile });
  await page.goto(`${base}/dev/demo?intro=0`, { waitUntil: "networkidle" });
  await page.addStyleTag({ content: hide });
  const bar = page.locator("#dat-phong");
  await bar.evaluate((el) => el.scrollIntoView({ block: "center" }));
  await page.waitForTimeout(400);
  if (!mobile) {
    await bar.screenshot({ path: `${out}/bar-${width}.png` });
    // Guests panel: the bar plus the panel that opens from it.
    await page.locator('#dat-phong button[data-field="guests"]:visible').first().click();
    await page.waitForTimeout(450);
    const panel = page.locator('#dat-phong [role="dialog"]:visible');
    await shotAround(page, bar, panel, `${out}/guests-${width}.png`);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(250);
    await page.locator('#dat-phong button[data-field="checkIn"]:visible').first().click();
    await page.waitForTimeout(450);
    const cal = page.locator('#dat-phong [role="dialog"]:visible');
    await shotAround(page, bar, cal, `${out}/calendar-${width}.png`);
  } else {
    await bar.screenshot({ path: `${out}/bar-${width}.png` });
    await page.locator('#dat-phong button[aria-haspopup="dialog"]:visible').first().tap();
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${out}/calendar-${width}.png` });
    await page.locator('dialog[open] [data-section="guests"]').tap();
    await page.waitForTimeout(350);
    await page.screenshot({ path: `${out}/guests-${width}.png` });
  }
  await page.close();
}
await browser.close();

async function shotAround(page, a, b, path) {
  const [ra, rb] = [await a.boundingBox(), await b.boundingBox()];
  if (!ra || !rb) return page.screenshot({ path });
  const x = Math.max(0, Math.min(ra.x, rb.x) - 16), y = Math.max(0, Math.min(ra.y, rb.y) - 16);
  const r = Math.max(ra.x + ra.width, rb.x + rb.width) + 16, btm = Math.max(ra.y + ra.height, rb.y + rb.height) + 16;
  await page.screenshot({ path, clip: { x, y, width: r - x, height: btm - y } });
}
