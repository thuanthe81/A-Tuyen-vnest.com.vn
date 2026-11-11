// CTA correction screenshots (9/11/2026): the homepage's restored solid Copper CTA, and the partner page's two-state
// wipe on the real page: hero at rest, at 50 % and at 100 %; a service CTA at rest and on hover; phones.
// The 50 % frame pauses the page's own CSS transition where the Copper face covers half of the button.
// Usage: node shots-cta-correction.mjs http://localhost:3401 <out-dir>
import { chromium } from "/Users/noe/Documents/GitHub/Cigarettes-After-Sex/node_modules/.pnpm/playwright@1.62.1/node_modules/playwright/index.mjs";
const [base, out] = process.argv.slice(2);
const browser = await chromium.launch();

async function open(path, width) {
  const mobile = width < 1024;
  const page = await browser.newPage({ viewport: { width, height: mobile ? 844 : 900 }, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 2 });
  await page.goto(`${base}${path}`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({ content: "nextjs-portal{display:none!important} #top{visibility:hidden!important}" });
  return page;
}

async function around(page, locator, file, pad = 16) {
  await locator.scrollIntoViewIfNeeded();
  await page.waitForTimeout(120);
  const b = await locator.boundingBox();
  await page.screenshot({ path: `${out}/${file}.png`, clip: { x: b.x - pad, y: b.y - pad, width: b.width + pad * 2, height: b.height + pad * 2 } });
}

/** Hover, then hold the transition where the Copper face has reached `share` of the button. */
async function holdAt(page, locator, share) {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(20);
  await locator.evaluate(async (el, target) => {
    const fill = el.children[1];
    const anim = fill.getAnimations().find((a) => a.transitionProperty === "clip-path");
    if (!anim) return;
    anim.pause();
    const total = Number(anim.effect.getTiming().duration);
    const covered = () => {
      const m = getComputedStyle(fill).clipPath.match(/inset\(0px ([\d.]+)(px|%)/);
      if (!m) return 1;
      return 1 - (m[2] === "%" ? Number(m[1]) / 100 : Number(m[1]) / el.getBoundingClientRect().width);
    };
    let lo = 0;
    let hi = total;
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      anim.currentTime = mid;
      if (covered() < target) lo = mid;
      else hi = mid;
    }
    anim.currentTime = hi;
  }, share);
}

// Homepage, the restored CTA (desktop open row 01; phone) and its understated link.
for (const width of [1440, 390]) {
  const page = await open("/dev/demo?intro=0&dich-vu=van-hanh", width);
  const cta = page.locator("#hop-tac [role=region]:not([inert]) a");
  await around(page, cta, `home-cta-${width === 1440 ? "desktop" : "mobile"}-default`);
  if (width === 1440) {
    await cta.hover();
    await page.waitForTimeout(300);
    await around(page, cta, "home-cta-desktop-hover");
    await page.mouse.move(0, 0);
    await page.locator("#hop-tac").screenshot({ path: `${out}/home-section-desktop.png` });
    await around(page, page.locator("[data-partner-page-link]"), "home-link-desktop-default");
  } else {
    await page.locator("#hop-tac").screenshot({ path: `${out}/home-section-mobile.png` });
  }
  await page.close();
}

// Partner page, hero: rest, 50 %, 100 %; focus.
{
  const page = await open("/dev/demo/hop-tac", 1440);
  const hero = page.locator("main a[href='#tu-van'][class*=cta]");
  await around(page, hero, "partner-hero-0-default");
  await holdAt(page, hero, 0.5);
  await around(page, hero, "partner-hero-1-wipe-50");
  await page.mouse.move(0, 0);
  await page.waitForTimeout(500);
  await hero.hover();
  await page.waitForTimeout(500);
  await around(page, hero, "partner-hero-2-wipe-100");
  await page.mouse.move(0, 0);
  await page.waitForTimeout(500);
  await hero.focus();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  await page.waitForTimeout(500);
  await around(page, hero, "partner-hero-3-focus");

  const service = page.locator("#dich-vu-tu-van-mo-hinh a[data-service]");
  await page.locator("body").click({ position: { x: 5, y: 5 } });
  await page.mouse.move(0, 0);
  await page.waitForTimeout(500);
  await around(page, service, "partner-service-0-default");
  await service.hover();
  await page.waitForTimeout(500);
  await around(page, service, "partner-service-2-hover");
  await page.mouse.move(0, 0);
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${out}/partner-page-desktop-full.png`, fullPage: true });
  await page.close();
}

// Phones: the partner CTAs at rest and pressed (keyboard focus shows the same full Copper).
{
  const page = await open("/dev/demo/hop-tac", 390);
  const hero = page.locator("main a[href='#tu-van'][class*=cta]");
  await around(page, hero, "partner-hero-mobile-default", 12);
  const service = page.locator("#dich-vu-van-hanh a[data-service]");
  await around(page, service, "partner-service-mobile-default", 12);
  await service.focus();
  await page.waitForTimeout(450);
  await around(page, service, "partner-service-mobile-focus", 12);
  await page.close();
}

// The review page.
for (const width of [1440, 390]) {
  const page = await open("/dev/partner-cta", width);
  await page.screenshot({ path: `${out}/review-page-${width === 1440 ? "desktop" : "mobile"}.png`, fullPage: true });
  await page.close();
}
await browser.close();
