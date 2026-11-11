// Before / after screenshots for the 10/11 refinement. "Before" is reconstructed in the browser, labelled as such:
// - Back: the old homepage showed the empty bar of a fresh load (no address), which is what is captured;
// - compact header: the complete reading is put back into the field (what shipped 9/11, cut with "…").
// Usage: node docs/qa/booking-ux-phase-d-2026-11-09/scripts/shots-refine.mjs http://localhost:3401 <dir>
import { chromium } from "/Users/noe/Documents/GitHub/Cigarettes-After-Sex/node_modules/.pnpm/playwright@1.62.1/node_modules/playwright/index.mjs";
const [base, dir] = process.argv.slice(2);
const browser = await chromium.launch();
const STAY = "checkIn=2026-11-28&checkOut=2026-12-02&adults=3&children=1";
const sizes = [
  { w: 1440, h: 900 },
  { w: 1024, h: 768 },
  { w: 768, h: 1024 },
  { w: 390, h: 844, mobile: true },
];
for (const s of sizes) {
  const ctx = await browser.newContext({ viewport: { width: s.w, height: s.h }, isMobile: !!s.mobile, hasTouch: !!s.mobile });
  const page = await ctx.newPage();
  const bar = async (name) => {
    const el = page.locator("#dat-phong");
    await el.evaluate((e) => e.scrollIntoView({ block: "center" }));
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${dir}/${name}.png` });
  };
  // Homepage bar after Back: before (empty, as a fresh load) / after (restored from the address).
  await page.goto(`${base}/dev/demo?intro=0`, { waitUntil: "networkidle" });
  await bar(`before-back-home-${s.w}`);
  await page.goto(`${base}/dev/demo?intro=0&${STAY}`, { waitUntil: "networkidle" });
  await bar(`after-back-home-${s.w}`);
  // Compact header on a property page with children.
  await page.goto(`${base}/dev/stays/bare-da-kao?${STAY}&rooms=2,1`, { waitUntil: "networkidle" });
  await page.mouse.wheel(0, 1800);
  await page.waitForTimeout(900);
  const clip = { x: 0, y: 0, width: s.w, height: s.mobile ? 120 : 90 };
  await page.screenshot({ path: `${dir}/after-compact-property-${s.w}.png`, clip });
  await page.evaluate(() => {
    for (const line of document.querySelectorAll("header#top span[title]")) {
      const full = line.getAttribute("title");
      const shown = line.querySelector(":scope > span:not(.sr-only):not(.invisible)");
      if (shown && full) shown.textContent = full;
    }
  });
  await page.screenshot({ path: `${dir}/before-compact-property-${s.w}.png`, clip });
  await ctx.close();
}
await browser.close();
console.log("done");
