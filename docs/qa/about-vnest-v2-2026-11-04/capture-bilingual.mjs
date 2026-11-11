/** Both language compositions at 375/390/768/1440 (section only) plus the full homepage at 1440 and 390.
 *   VNEST_TEST_URL=http://localhost:3402 node docs/qa/about-vnest-v2-2026-11-04/capture-bilingual.mjs */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "/Users/noe/Documents/GitHub/Cigarettes-After-Sex/node_modules/.pnpm/playwright@1.62.1/node_modules/playwright/index.mjs";
const BASE = process.env.VNEST_TEST_URL ?? "http://localhost:3402";
const HERE = path.dirname(fileURLToPath(import.meta.url));
const b = await chromium.launch();
for (const lang of ["vi", "en"]) {
  for (const vp of [375, 390, 768, 1440]) {
    const c = await b.newContext({ viewport: { width: vp, height: vp < 768 ? 844 : 900 }, isMobile: vp < 768, hasTouch: vp < 768 });
    const p = await c.newPage();
    await p.goto(`${BASE}/dev/demo?intro=0${lang === "en" ? "&lang=en" : ""}`, { waitUntil: "networkidle" });
    await p.evaluate(() => document.fonts.ready);
    const s = p.locator("#ve-vnest");
    await s.scrollIntoViewIfNeeded();
    await p.waitForTimeout(400);
    await s.screenshot({ path: path.join(HERE, "screens", `bilingual-${lang}-${vp}.png`) });
    await c.close();
  }
}
await b.close();
console.log("captured");
