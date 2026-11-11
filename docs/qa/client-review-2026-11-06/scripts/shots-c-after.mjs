// Phase C "after": brand heading, Discovery heading, Discovery per brand filter, city states, the three Coming Soon
// cards (2x), desktop and mobile previews, the full homepage.
// Usage: node shots-c-after.mjs http://localhost:3401 <out-dir>
import { chromium } from "/Users/noe/Documents/GitHub/Cigarettes-After-Sex/node_modules/.pnpm/playwright@1.62.1/node_modules/playwright/index.mjs";
const [base, out] = process.argv.slice(2);
const browser = await chromium.launch();

async function open(width, scale = 1) {
  const mobile = width < 1024;
  const page = await browser.newPage({ viewport: { width, height: mobile ? 844 : 900 }, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: scale, reducedMotion: "reduce" });
  await page.goto(`${base}/dev/demo?intro=0`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({ content: "#top{visibility:hidden!important} nextjs-portal{display:none!important}" });
  await page.evaluate(() => Promise.all([...document.querySelectorAll("img")].map((i) => (i.loading = "eager", i.decode().catch(() => {})))));
  await page.waitForTimeout(300);
  return { page, mobile };
}
const chip = (page, text) => page.locator("#kham-pha [data-filter=brand] label").filter({ hasText: new RegExp(`^${text}$`) });
const settle = async (page) => {
  await page.evaluate(() => Promise.all([...document.querySelectorAll("#kham-pha img")].map((i) => (i.loading = "eager", i.decode().catch(() => {})))));
  await page.waitForTimeout(400);
};

for (const width of [1440, 1024, 768, 430, 390, 375]) {
  const { page, mobile } = await open(width);
  // 1. Headings.
  if ([1440, 768, 390].includes(width)) {
    const head = await page.locator("#thuong-hieu").boundingBox();
    const comp = await page.locator("#thuong-hieu [class*=composition]").boundingBox();
    await page.screenshot({ path: `${out}/1-brand-heading-${width}.png`, clip: { x: 0, y: head.y, width, height: comp.y - head.y + 140 }, fullPage: true });
    const intro = await page.locator("#kham-pha").boundingBox();
    const bar = await page.locator("#kham-pha [role=group][aria-label='Lọc nơi ở']").boundingBox();
    await page.screenshot({ path: `${out}/2-discovery-heading-${width}.png`, clip: { x: 0, y: intro.y, width, height: bar.y + bar.height - intro.y + 24 }, fullPage: true });
  }
  // 3. Discovery per filter.
  for (const [n, text] of [["all", "Tất cả"], ["bare", "Bare Boutique Stays"], ["pepper-house", "Pepper House"], ["the-nang", "The Nắng Suites"]]) {
    await (mobile ? chip(page, text).tap() : chip(page, text).click());
    await settle(page);
    if (n === "all" || [1440, 390].includes(width)) await page.locator("#kham-pha").screenshot({ path: `${out}/3-discovery-${n}-${width}.png` });
  }
  // City states on Pepper House: the hint, a tap on Đà Nẵng, then the active filter.
  if ([1440, 390].includes(width)) {
    const bar = page.locator("#kham-pha [role=group][aria-label='Lọc nơi ở']");
    await (mobile ? chip(page, "Pepper House").tap() : chip(page, "Pepper House").click());
    await page.waitForTimeout(300);
    await bar.screenshot({ path: `${out}/4-city-pepper-available-${width}.png` });
    await (mobile ? page.locator('#kham-pha button[data-city="da-nang"]').tap({ force: true }) : page.locator('#kham-pha button[data-city="da-nang"]').click({ force: true }));
    await page.waitForTimeout(300);
    await bar.screenshot({ path: `${out}/4-city-pepper-hint-${width}.png` });
    await (mobile ? page.locator('#kham-pha button[data-city="ho-chi-minh"]').tap() : page.locator('#kham-pha button[data-city="ho-chi-minh"]').click());
    await page.waitForTimeout(300);
    await bar.screenshot({ path: `${out}/4-city-pepper-active-${width}.png` });
  }
  await page.close();
}

// 5. The three Coming Soon cards, each on its own, sharp.
{
  const { page } = await open(1440, 2);
  const cards = page.locator("#sap-ra-mat article");
  for (const [i, id] of ["bare", "pepper-house", "the-nang"].entries()) await cards.nth(i).screenshot({ path: `${out}/5-coming-soon-${id}.png` });
  await page.locator("#sap-ra-mat").screenshot({ path: `${out}/5-coming-soon-shelf-1440.png` });
  await page.close();
}
{
  const { page } = await open(390, 2);
  await page.locator("#sap-ra-mat").screenshot({ path: `${out}/5-coming-soon-shelf-390.png` });
  await page.locator("#sap-ra-mat ul").evaluate((ul) => (ul.scrollLeft = ul.scrollWidth));
  await page.waitForTimeout(300);
  await page.locator("#sap-ra-mat").screenshot({ path: `${out}/5-coming-soon-shelf-390-swiped.png` });
  await page.close();
}

// 6. Full homepage.
for (const width of [1440, 390]) {
  const { page } = await open(width);
  await page.screenshot({ path: `${out}/6-homepage-full-${width}.png`, fullPage: true });
  await page.close();
}
await browser.close();
