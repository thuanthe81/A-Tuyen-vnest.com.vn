/**
 * About VNest V2 evidence: the section at 375/390/430/768/1440 and the full homepage (LABEL=before on the old build,
 * LABEL=after on the new one).  LABEL=after VNEST_TEST_URL=http://localhost:3402 node docs/qa/about-vnest-v2-2026-11-04/capture.mjs
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "/Users/noe/Documents/GitHub/Cigarettes-After-Sex/node_modules/.pnpm/playwright@1.62.1/node_modules/playwright/index.mjs";
const BASE = process.env.VNEST_TEST_URL ?? "http://localhost:3402";
const LABEL = process.env.LABEL ?? "after";
const HERE = path.dirname(fileURLToPath(import.meta.url));
const b = await chromium.launch();
for (const vp of [375, 390, 430, 768, 1440]) {
  const c = await b.newContext({ viewport: { width: vp, height: vp < 768 ? 844 : 900 }, isMobile: vp < 768, hasTouch: vp < 768 });
  const p = await c.newPage();
  await p.goto(`${BASE}/dev/demo?intro=0`, { waitUntil: "networkidle" });
  await p.evaluate(() => document.querySelectorAll("img").forEach((i) => (i.loading = "eager")));
  await p.evaluate(() => document.fonts.ready);
  const section = p.locator("#ve-vnest");
  await section.scrollIntoViewIfNeeded();
  await p.waitForTimeout(500);
  await section.screenshot({ path: path.join(HERE, "screens", `about-${vp}-${LABEL}.png`) });
  if (vp === 1440 || vp === 390) {
    await p.evaluate(() => window.scrollTo(0, 0));
    await p.waitForTimeout(300);
    await p.screenshot({ path: path.join(HERE, "screens", `homepage-full-${vp}-${LABEL}.png`), fullPage: true });
  }
  await c.close();
}
await b.close();
console.log("captured", LABEL);
