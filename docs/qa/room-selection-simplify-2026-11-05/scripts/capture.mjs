/**
 * Room selection simplification: section screenshots of the property room-selection control on a GoHost property and the
 * ezCloud hand-off. Usage: node capture.mjs <before|after> [base]
 */
import { fileURLToPath } from "node:url";
import { chromium } from "/Users/noe/Documents/GitHub/Cigarettes-After-Sex/node_modules/.pnpm/playwright@1.62.1/node_modules/playwright/index.mjs";

const label = process.argv[2] ?? "after";
const BASE = process.argv[3] ?? "http://localhost:3402";
const OUT = fileURLToPath(new URL("../screens/", import.meta.url));
const VIEWPORTS = [
  { name: "1440", width: 1440, height: 900, isMobile: false, hasTouch: false },
  { name: "390", width: 390, height: 844, isMobile: true, hasTouch: true },
];
const CASES = [
  { name: "gohost-3g2r-one-selected", path: "/dev/stays/bare-da-kao?view=demo&checkIn=2026-11-20&checkOut=2026-11-22&rooms=2,1&adults=3&prefs=bare-da-kao-two," },
  { name: "gohost-nodates", path: "/dev/stays/pepper-house?view=demo&rooms=1&adults=2" },
  { name: "ezcloud-handoff", path: "/dev/stays/bare-chic?view=demo&checkIn=2026-11-20&checkOut=2026-11-22&rooms=2,1&adults=3" },
];
const browser = await chromium.launch();
for (const vp of VIEWPORTS) {
  for (const c of CASES) {
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: vp.isMobile, hasTouch: vp.hasTouch });
    const page = await context.newPage();
    await page.goto(`${BASE}${c.path}`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    const card = page.locator('[role="region"][aria-label^="Tuỳ chọn lưu trú"]');
    await card.scrollIntoViewIfNeeded();
    await page.addStyleTag({ content: "header, [data-sticky-header], #top{visibility:hidden!important}" });
    await card.screenshot({ path: `${OUT}${label}-${c.name}-${vp.name}.png`, animations: "disabled" });
    const bar = page.locator('[data-testid="property-selection-summary-bar"]');
    if (await bar.count()) await bar.screenshot({ path: `${OUT}${label}-${c.name}-summarybar-${vp.name}.png`, animations: "disabled" }).catch(() => {});
    await context.close();
  }
}
await browser.close();
console.log("done", label);
