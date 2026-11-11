/**
 * Search bar captures for the combined "Phòng & khách" field (Option B): run once on the build before the change
 * (LABEL=before) and once after (LABEL=after). Same pages, states and viewports, so the pairs compare like for like.
 *   LABEL=after VNEST_TEST_URL=http://localhost:3402 node docs/qa/booking-bar-occupancy-2026-11-04/capture-bar.mjs
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "/Users/noe/Documents/GitHub/Cigarettes-After-Sex/node_modules/.pnpm/playwright@1.62.1/node_modules/playwright/index.mjs";

const BASE = process.env.VNEST_TEST_URL ?? "http://localhost:3402";
const LABEL = process.env.LABEL ?? "after";
const HERE = path.dirname(fileURLToPath(import.meta.url));
const STAY = "checkIn=2026-12-10&checkOut=2026-12-12&rooms=2,1&adults=3";
const b = await chromium.launch();

async function shot(name, url, vp, act) {
  const c = await b.newContext({ viewport: { width: vp, height: vp < 768 ? 844 : 900 }, isMobile: vp < 768, hasTouch: vp < 768 });
  const p = await c.newPage();
  await p.goto(`${BASE}${url}`, { waitUntil: "networkidle" });
  await p.waitForTimeout(500);
  if (act) await act(p);
  await p.waitForTimeout(450);
  await p.screenshot({ path: path.join(HERE, "compare", `${name}-${vp}-${LABEL}.png`) });
  await c.close();
}
const toBar = (p) => p.locator("#dat-phong").evaluate((el) => el.scrollIntoView({ block: "center" }));

for (const vp of [1440, 768]) {
  await shot("home-bar", `/dev/demo?intro=0&${STAY}&property=the-nang-suites`, vp, toBar);
  await shot("home-bar-panel", `/dev/demo?intro=0&${STAY}`, vp, async (p) => {
    await toBar(p);
    await p.locator('button[data-field="guests"]:visible').first().click();
  });
  await shot("property-compact-bar", `/dev/stays/the-nang-suites?${STAY}`, vp);
}
for (const vp of [375, 390, 430]) {
  await shot("home-pill", `/dev/demo?intro=0&${STAY}&property=the-nang-suites`, vp, toBar);
  await shot("home-sheet", `/dev/demo?intro=0&${STAY}`, vp, async (p) => {
    await toBar(p);
    await p.locator('#dat-phong button[aria-haspopup="dialog"]:visible').first().tap();
    await p.waitForTimeout(400);
    await p.locator("dialog.vn-sheet[open]").getByRole("button", { name: /^Khách|^Phòng & khách/ }).first().tap();
  });
  await shot("property-compact-pill", `/dev/stays/the-nang-suites?${STAY}`, vp);
}
await b.close();
console.log("captured", LABEL);
