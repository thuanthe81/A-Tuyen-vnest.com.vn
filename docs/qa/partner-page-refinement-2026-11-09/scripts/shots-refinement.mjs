// Partner page refinement (9/11/2026): close-ups of the photography, the brand ecosystem and the CTAs (default and
// hover), plus full pages. Run before and after the change.
// Usage: node shots-refinement.mjs http://localhost:3401 <out-dir>
import { chromium } from "/Users/noe/Documents/GitHub/Cigarettes-After-Sex/node_modules/.pnpm/playwright@1.62.1/node_modules/playwright/index.mjs";
const [base, out] = process.argv.slice(2);
const browser = await chromium.launch();

async function open(path, width) {
  const mobile = width < 1024;
  const page = await browser.newPage({ viewport: { width, height: mobile ? 844 : 900 }, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 2, reducedMotion: "no-preference" });
  await page.goto(`${base}${path}`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 500) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 40));
    }
    window.scrollTo(0, 0);
  });
  await page.addStyleTag({ content: "nextjs-portal{display:none!important} #top{visibility:hidden!important}" });
  await page.waitForTimeout(300);
  return page;
}

/** An element with some room around it. */
async function shotAround(page, locator, file, pad = 24) {
  // Captions sat under the frames before 9/11: a taller pad keeps them in the before shots.
  await locator.scrollIntoViewIfNeeded();
  await page.waitForTimeout(150);
  const box = await locator.boundingBox();
  await page.screenshot({ path: `${out}/${file}.png`, clip: { x: Math.max(0, box.x - pad), y: Math.max(0, box.y - pad), width: box.width + pad * 2, height: box.height + pad * 2 } });
}

async function cta(path, width, selector, file) {
  const page = await open(path, width);
  const el = page.locator(selector).first();
  await shotAround(page, el, `${file}-default`);
  await el.hover();
  await page.waitForTimeout(450);
  await shotAround(page, el, `${file}-hover`);
  await el.focus();
  await page.mouse.move(0, 0);
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  await page.waitForTimeout(300);
  await shotAround(page, el, `${file}-focus`);
  await page.close();
}

const home = "/dev/demo?intro=0&dich-vu=van-hanh";
const partner = "/dev/demo/hop-tac";

// Photography (hero, Why VNest, service 01 on both pages).
for (const [path, width, selector, file] of [
  [partner, 1440, "main section[aria-labelledby='hop-tac-title'] [class*=heroFrame]", "photo-hero-desktop"],
  [partner, 1440, "#the-manh [class*=whyFrame]", "photo-why-desktop"],
  [partner, 1440, "#dich-vu-van-hanh [class*=chapterFrame]", "photo-service-01-partner-desktop"],
  [home, 1440, "#hop-tac [data-service='van-hanh'] [class*=frame]", "photo-service-01-home-desktop"],
  [partner, 390, "main section[aria-labelledby='hop-tac-title'] [class*=heroFrame]", "photo-hero-mobile"],
]) {
  const page = await open(path, width);
  await shotAround(page, page.locator(selector).first(), file, 40);
  await page.close();
}

// The brand ecosystem.
for (const width of [1440, 390]) {
  const page = await open(partner, width);
  await page.locator("#thuong-hieu").scrollIntoViewIfNeeded();
  await page.locator("#thuong-hieu").screenshot({ path: `${out}/brands-${width === 1440 ? "desktop" : "mobile"}.png` });
  await page.close();
}

// CTAs: the partner page's hero and service CTAs, the homepage row CTA and its link to the partner page.
await cta(partner, 1440, "main a[href='#tu-van']", "cta-hero-desktop");
await cta(partner, 1440, "#dich-vu-tu-van-mo-hinh a[data-service]", "cta-service-desktop");
await cta(home, 1440, "#hop-tac [role=region]:not([inert]) a", "cta-home-row-desktop");
await cta(home, 1440, "#hop-tac [data-partner-page-link]", "cta-home-more-desktop");
await cta(partner, 390, "#dich-vu-van-hanh a[data-service]", "cta-service-mobile");
// Full pages (after only: the first round's are in docs/qa/partner-page-2026-11-09/screens).
if (process.argv[4] === "full") {
  for (const [path, width, file] of [
    [partner, 1440, "partner-page-desktop-full"],
    [`${partner}?lang=en`, 1440, "partner-page-desktop-full-en"],
    [partner, 390, "partner-page-mobile-full"],
    [home, 1440, "home-accordion-desktop"],
    [home, 390, "home-accordion-mobile"],
  ]) {
    const page = await open(path, width);
    if (path.startsWith("/dev/demo?")) await page.locator("#hop-tac").screenshot({ path: `${out}/${file}.png` });
    else {
      await page.addStyleTag({ content: "#top{visibility:visible!important}" });
      await page.screenshot({ path: `${out}/${file}.png`, fullPage: true });
    }
    await page.close();
  }
}
await browser.close();
