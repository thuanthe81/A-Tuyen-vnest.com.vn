// Phase C Coming Soon artwork (8/11/2026): each brand's artwork inside its filtered property grid at 1440, 1024, 768, 390
// and 375 px, the filter toolbar with a brand chosen (no result line or "Bỏ lọc"), "Tất cả" (no card) at 1440 and 390, and
// each artwork close up (desktop tile and phone strip, 2x).
// Usage: node shots-c-final.mjs http://localhost:3401 <out-dir>
import { chromium } from "/Users/noe/Documents/GitHub/Cigarettes-After-Sex/node_modules/.pnpm/playwright@1.62.1/node_modules/playwright/index.mjs";
const [base, out] = process.argv.slice(2);
const browser = await chromium.launch();
const BRANDS = ["bare", "pepper-house", "the-nang"];

async function open(width, brand, scale = 1) {
  const mobile = width < 1024;
  const page = await browser.newPage({ viewport: { width, height: mobile ? 844 : 900 }, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: scale, reducedMotion: "reduce" });
  await page.goto(`${base}/dev/demo?intro=0${brand ? `&brand=${brand}` : ""}`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({ content: "#top{visibility:hidden!important} nextjs-portal{display:none!important}" });
  // Load and decode every Discovery image before the shot (the stay photographs are lazy).
  await page.evaluate(async () => {
    const imgs = [...document.querySelectorAll("#kham-pha img")];
    imgs.forEach((i) => (i.loading = "eager"));
    await Promise.all(imgs.map((i) => (i.complete ? i.decode().catch(() => {}) : new Promise((r) => i.addEventListener("load", r, { once: true })).then(() => i.decode().catch(() => {})))));
  });
  await page.waitForTimeout(400);
  return page;
}

const grid = (page) => page.locator('#kham-pha ul[aria-labelledby="kham-pha-title"]');

for (const width of [1440, 1024, 768, 390, 375]) {
  for (const brand of BRANDS) {
    const page = await open(width, brand);
    await grid(page).screenshot({ path: `${out}/grid-${brand}-${width}.png` });
    if (width === 1440 || width === 390) await page.locator("#kham-pha").screenshot({ path: `${out}/discovery-${brand}-${width}.png` });
    if (brand === "the-nang") await page.locator("#kham-pha [role=group][aria-label='Lọc nơi ở']").screenshot({ path: `${out}/toolbar-${width}.png` });
    await page.close();
  }
}
for (const width of [1440, 390]) {
  const page = await open(width, "");
  await grid(page).screenshot({ path: `${out}/grid-all-${width}.png` });
  await page.close();
}
for (const [width, kind] of [
  [1440, "desktop"],
  [390, "mobile"],
]) {
  for (const brand of BRANDS) {
    const page = await open(width, brand, 2);
    await page.locator("#kham-pha [data-coming-soon]").screenshot({ path: `${out}/artwork-${brand}-${kind}.png` });
    await page.close();
  }
}
await browser.close();
