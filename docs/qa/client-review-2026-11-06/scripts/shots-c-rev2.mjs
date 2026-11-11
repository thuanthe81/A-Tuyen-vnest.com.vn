// Phase C revision, round 2 (8/11/2026): Discovery per brand with its Coming Soon card (and "Tất cả"), each card close up
// (desktop tile, phone strip), "Hợp tác cùng VNest" at every width, and the arrow CTAs without underline (About banner
// at rest and on hover, a stay name on hover, the property page's "Xem tất cả nơi ở →").
// Usage: node shots-c-rev2.mjs http://localhost:3401 <out-dir>
import { chromium } from "/Users/noe/Documents/GitHub/Cigarettes-After-Sex/node_modules/.pnpm/playwright@1.62.1/node_modules/playwright/index.mjs";
const [base, out] = process.argv.slice(2);
const browser = await chromium.launch();
const WIDTHS = [1440, 1024, 768, 430, 390, 375];
const FILTERS = [
  ["all", ""],
  ["bare", "bare"],
  ["pepper-house", "pepper-house"],
  ["the-nang", "the-nang"],
];

async function open(width, path, scale = 1) {
  const mobile = width < 1024;
  const page = await browser.newPage({ viewport: { width, height: mobile ? 844 : 900 }, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: scale, reducedMotion: "reduce" });
  await page.goto(`${base}${path}`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({ content: "#top{visibility:hidden!important} nextjs-portal{display:none!important}" });
  return { page, mobile };
}

// Load and decode every Discovery photograph before the shot (they are lazy).
const settle = async (page) => {
  await page.evaluate(async () => {
    const imgs = [...document.querySelectorAll("#kham-pha img")];
    imgs.forEach((i) => (i.loading = "eager"));
    await Promise.all(imgs.map((i) => (i.complete ? i.decode().catch(() => {}) : new Promise((r) => i.addEventListener("load", r, { once: true })).then(() => i.decode().catch(() => {})))));
  });
  await page.waitForTimeout(400);
};

for (const width of WIDTHS) {
  for (const [name, brand] of FILTERS) {
    const { page } = await open(width, `/dev/demo?intro=0${brand ? `&brand=${brand}` : ""}`);
    await settle(page);
    await page.locator("#kham-pha").screenshot({ path: `${out}/discovery-${name}-${width}.png` });
    await page.close();
  }
  const { page } = await open(width, "/dev/demo?intro=0");
  await page.locator("#hop-tac").screenshot({ path: `${out}/hop-tac-${width}.png` });
  if (width === 1440 || width === 390) {
    await page.locator('#hop-tac button[data-service="nhuong-quyen"]').click();
    await page.waitForTimeout(300);
    await page.locator("#hop-tac").screenshot({ path: `${out}/hop-tac-service-3-${width}.png` });
  }
  await page.close();
}

// Each Coming Soon card close up, sharp.
for (const [width, kind] of [
  [1440, "tile"],
  [390, "strip"],
]) {
  for (const [name, brand] of FILTERS.slice(1)) {
    const { page } = await open(width, `/dev/demo?intro=0&brand=${brand}`, 2);
    await settle(page);
    await page.locator("#kham-pha [data-coming-soon]").screenshot({ path: `${out}/card-${name}-${kind}.png` });
    await page.close();
  }
}

// Arrow CTAs without underline.
for (const width of [1440, 390]) {
  const { page, mobile } = await open(width, "/dev/demo?intro=0", 2);
  const about = page.locator("#ve-vnest a[href$='#lien-he']");
  await about.scrollIntoViewIfNeeded();
  const clip = async (file) => {
    const b = await about.boundingBox();
    await page.screenshot({ path: `${out}/${file}`, clip: { x: Math.max(0, b.x - 24), y: b.y - 24, width: Math.min(width - Math.max(0, b.x - 24), b.width + 160), height: b.height + 48 } });
  };
  await page.locator("#ve-vnest").screenshot({ path: `${out}/cta-about-${width}.png` });
  await clip(`cta-about-closeup-${width}.png`);
  if (!mobile) {
    await about.hover();
    await page.waitForTimeout(250);
    await clip(`cta-about-hover-${width}.png`);
    const name = page.locator('#kham-pha h3 a[href^="/dev/stays/"]').first();
    await name.scrollIntoViewIfNeeded();
    await name.hover();
    await page.waitForTimeout(250);
    const card = page.locator('#kham-pha ul[aria-labelledby="kham-pha-title"] > li').first();
    await card.screenshot({ path: `${out}/cta-stay-name-hover-${width}.png` });
  }
  await page.close();
}
{
  const { page } = await open(1440, "/dev/stays/bare-hyphen", 2);
  const link = page.locator("a", { hasText: "Xem tất cả nơi ở" }).filter({ has: page.locator('span[aria-hidden="true"]') }).first();
  await link.scrollIntoViewIfNeeded();
  await link.hover();
  await page.waitForTimeout(250);
  const b = await link.boundingBox();
  await page.screenshot({ path: `${out}/cta-related-all-stays-hover-1440.png`, clip: { x: b.x - 420, y: b.y - 40, width: b.width + 444, height: b.height + 80 } });
  await page.close();
}
await browser.close();
