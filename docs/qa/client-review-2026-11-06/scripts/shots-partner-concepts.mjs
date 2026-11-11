// Hợp tác cùng VNest redesign exploration (8/11/2026): Concept A and B with each service selected at 1440 (desktop) and
// 390 (phone), a few English and in-between widths, and the approved section for comparison.
// Usage: node shots-partner-concepts.mjs http://localhost:3401 <out-dir>
import { chromium } from "/Users/noe/Documents/GitHub/Cigarettes-After-Sex/node_modules/.pnpm/playwright@1.62.1/node_modules/playwright/index.mjs";
const [base, out] = process.argv.slice(2);
const browser = await chromium.launch();
const SERVICES = ["van-hanh", "tu-van-mo-hinh", "nhuong-quyen"];

async function shoot(path, width, file, prepare) {
  const mobile = width < 1024;
  const page = await browser.newPage({ viewport: { width, height: mobile ? 844 : 900 }, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: mobile ? 2 : 1, reducedMotion: "reduce" });
  await page.goto(`${base}${path}`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({ content: "nextjs-portal{display:none!important} #top{visibility:hidden!important}" });
  if (prepare) await prepare(page);
  await page.waitForTimeout(350);
  await page.locator("#hop-tac").screenshot({ path: `${out}/${file}.png` });
  await page.close();
}

for (const concept of ["a", "b"]) {
  for (const [i, id] of SERVICES.entries()) {
    await shoot(`/dev/partner-concepts/${concept}?dich-vu=${id}`, 1440, `concept-${concept}-desktop-0${i + 1}-${id}`);
    await shoot(`/dev/partner-concepts/${concept}?dich-vu=${id}`, 390, `concept-${concept}-mobile-0${i + 1}-${id}`);
  }
  await shoot(`/dev/partner-concepts/${concept}?dich-vu=tu-van-mo-hinh&lang=en`, 1440, `concept-${concept}-desktop-en-02`);
  await shoot(`/dev/partner-concepts/${concept}?dich-vu=nhuong-quyen&lang=en`, 375, `concept-${concept}-mobile-en-03`);
  for (const width of [768, 1024]) await shoot(`/dev/partner-concepts/${concept}?dich-vu=nhuong-quyen`, width, `concept-${concept}-${width}-03`);
}

// The approved section, as it is on the demo homepage (services 01 and 03).
for (const width of [1440, 390]) {
  const kind = width < 1024 ? "mobile" : "desktop";
  await shoot("/dev/demo?intro=0", width, `approved-${kind}-01`);
  await shoot("/dev/demo?intro=0", width, `approved-${kind}-03`, (page) => page.locator('#hop-tac button[data-service="nhuong-quyen"]').click());
}
await browser.close();
