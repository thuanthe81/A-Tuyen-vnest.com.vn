// Phase C revision (8/11/2026): Discovery for "Tất cả" and each brand (its stays, then its Coming Soon card), the filter
// toolbar, and each Coming Soon card close up (desktop tile and phone strip, 2x).
// Usage: node shots-c-rev.mjs http://localhost:3401 <out-dir>
import { chromium } from "/Users/noe/Documents/GitHub/Cigarettes-After-Sex/node_modules/.pnpm/playwright@1.62.1/node_modules/playwright/index.mjs";
const [base, out] = process.argv.slice(2);
const browser = await chromium.launch();
const FILTERS = [
  ["all", ""],
  ["bare", "bare"],
  ["pepper-house", "pepper-house"],
  ["the-nang", "the-nang"],
];

async function open(width, brand, scale = 1) {
  const mobile = width < 1024;
  const page = await browser.newPage({ viewport: { width, height: mobile ? 844 : 900 }, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: scale, reducedMotion: "reduce" });
  await page.goto(`${base}/dev/demo?intro=0${brand ? `&brand=${brand}` : ""}`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({ content: "#top{visibility:hidden!important} nextjs-portal{display:none!important}" });
  // Load and decode every Discovery photograph before the shot (they are lazy).
  await page.evaluate(async () => {
    const imgs = [...document.querySelectorAll("#kham-pha img")];
    imgs.forEach((i) => (i.loading = "eager"));
    await Promise.all(imgs.map((i) => (i.complete ? i.decode().catch(() => {}) : new Promise((r) => i.addEventListener("load", r, { once: true })).then(() => i.decode().catch(() => {})))));
  });
  await page.waitForTimeout(400);
  return page;
}

for (const width of [1440, 1024, 768, 430, 390, 375]) {
  for (const [name, brand] of FILTERS) {
    const page = await open(width, brand);
    await page.locator("#kham-pha").screenshot({ path: `${out}/discovery-${name}-${width}.png` });
    if (name === "all" && [1440, 768, 390].includes(width)) await page.locator("#kham-pha [role=group][aria-label='Lọc nơi ở']").screenshot({ path: `${out}/filters-${width}.png` });
    await page.close();
  }
}

// Each Coming Soon card on its own, sharp: desktop tile and phone strip.
for (const [width, kind] of [
  [1440, "tile"],
  [390, "strip"],
]) {
  for (const [name, brand] of FILTERS.slice(1)) {
    const page = await open(width, brand, 2);
    await page.locator("#kham-pha [data-coming-soon]").screenshot({ path: `${out}/card-${name}-${kind}.png` });
    await page.close();
  }
}
await browser.close();
