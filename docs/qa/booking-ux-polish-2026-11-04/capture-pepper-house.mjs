/** Pepper House 3rd-floor room-card cover (02.jpg) and the unchanged hero, desktop 1440 and mobile 390. */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "/Users/noe/Documents/GitHub/Cigarettes-After-Sex/node_modules/.pnpm/playwright@1.62.1/node_modules/playwright/index.mjs";
const BASE = process.env.VNEST_TEST_URL ?? "http://localhost:3402";
const HERE = path.dirname(fileURLToPath(import.meta.url));
const b = await chromium.launch();
for (const [name, vp] of [["desktop", { width: 1440, height: 900 }], ["mobile", { width: 390, height: 844 }]]) {
  const c = await b.newContext({ viewport: vp, isMobile: vp.width < 768, hasTouch: vp.width < 768 });
  const p = await c.newPage();
  await p.goto(`${BASE}/dev/stays/pepper-house?checkIn=2026-12-10&checkOut=2026-12-12&rooms=1&adults=3`, { waitUntil: "networkidle" });
  await p.evaluate(() => document.querySelectorAll("img").forEach((i) => (i.loading = "eager")));
  await p.waitForTimeout(900);
  await p.screenshot({ path: path.join(HERE, "screens", `pepper-house-hero-${name}.png`) });
  await p.locator('li[data-room-id="pepper-house-3rd-floor"]').evaluate((el) => { el.scrollIntoView({ block: "start" }); window.scrollBy(0, -90); });
  await p.waitForTimeout(700);
  await p.screenshot({ path: path.join(HERE, "screens", `pepper-house-3rd-floor-card-${name}.png`) });
  await c.close();
}
await b.close();
