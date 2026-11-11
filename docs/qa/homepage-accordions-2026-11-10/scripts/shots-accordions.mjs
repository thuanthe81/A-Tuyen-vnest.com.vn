// Homepage accordions screenshots (10/11/2026): Services all closed and with one row open (desktop), Services on a
// phone, the footer row's hover, and the FAQ all closed and with one question open (desktop and phone).
// Usage: node shots-accordions.mjs http://localhost:3401 <out-dir>
import { chromium } from "/Users/noe/Documents/GitHub/Cigarettes-After-Sex/node_modules/.pnpm/playwright@1.62.1/node_modules/playwright/index.mjs";
const [base, out] = process.argv.slice(2);
const browser = await chromium.launch();

async function open(width, lang = "vi") {
  const mobile = width < 1024;
  const page = await browser.newPage({ viewport: { width, height: mobile ? 844 : 900 }, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 2, reducedMotion: "reduce" });
  await page.goto(`${base}/dev/demo?intro=0&lang=${lang}`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({ content: "nextjs-portal{display:none!important} #top{visibility:hidden!important}" });
  return { page, mobile };
}

const press = (page, mobile, locator) => (mobile ? locator.tap() : locator.click());

for (const width of [1440, 390]) {
  const { page, mobile } = await open(width);
  const kind = mobile ? "mobile" : "desktop";
  const services = page.locator("#hop-tac");
  await services.scrollIntoViewIfNeeded();
  await services.screenshot({ path: `${out}/services-${kind}-all-closed.png` });
  await press(page, mobile, page.locator('#hop-tac button[data-service="tu-van-mo-hinh"]'));
  await page.waitForTimeout(400);
  await services.screenshot({ path: `${out}/services-${kind}-02-open.png` });
  if (!mobile) {
    await press(page, mobile, page.locator('#hop-tac button[data-service="tu-van-mo-hinh"]'));
    await page.waitForTimeout(300);
    const more = page.locator("[data-partner-page-link]");
    await more.scrollIntoViewIfNeeded();
    const b = await more.boundingBox();
    const clip = { x: b.x - 8, y: b.y - 90, width: b.width + 16, height: b.height + 110 };
    await page.screenshot({ path: `${out}/services-footer-default.png`, clip });
    await more.hover();
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${out}/services-footer-hover.png`, clip });
    await page.mouse.move(0, 0);
    await more.focus();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    await page.waitForTimeout(200);
    await page.screenshot({ path: `${out}/services-footer-focus.png`, clip });
  }
  const faq = page.locator("#hoi-dap");
  await faq.scrollIntoViewIfNeeded();
  await page.mouse.move(0, 0);
  await faq.screenshot({ path: `${out}/faq-${kind}-all-closed.png` });
  await press(page, mobile, page.locator("#hoi-dap summary").nth(1));
  await page.waitForTimeout(200);
  await faq.screenshot({ path: `${out}/faq-${kind}-one-open.png` });
  await page.close();
}

// English, desktop: all closed.
{
  const { page } = await open(1440, "en");
  await page.locator("#hop-tac").screenshot({ path: `${out}/services-desktop-all-closed-en.png` });
  await page.locator("#hoi-dap").screenshot({ path: `${out}/faq-desktop-all-closed-en.png` });
  await page.close();
}
await browser.close();
