/** Renders the "Ở." accent in the lighter copper tint #C08A57 (3.58:1 on Dark Olive) beside the specified #A87444 (2.68:1),
 * for the owner's decision. Test browser only; the site is not changed.  node docs/qa/about-vnest-v2-2026-11-04/render-contrast-option.mjs */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "/Users/noe/Documents/GitHub/Cigarettes-After-Sex/node_modules/.pnpm/playwright@1.62.1/node_modules/playwright/index.mjs";
const BASE = process.env.VNEST_TEST_URL ?? "http://localhost:3402";
const HERE = path.dirname(fileURLToPath(import.meta.url));
const b = await chromium.launch();
for (const [vp, h] of [[1440, 900], [390, 844]]) {
  const p = await b.newPage({ viewport: { width: vp, height: h } });
  await p.goto(`${BASE}/dev/demo?intro=0`, { waitUntil: "networkidle" });
  await p.evaluate(() => document.fonts.ready);
  await p.evaluate(() => [...document.querySelectorAll("#ve-vnest span")].filter((s) => s.textContent === "Ở.").forEach((s) => (s.style.color = "#C08A57")));
  const s = p.locator("#ve-vnest");
  await s.scrollIntoViewIfNeeded();
  await s.screenshot({ path: path.join(HERE, "screens", `about-${vp}-option-copper-C08A57.png`) });
  await p.close();
}
await b.close();
