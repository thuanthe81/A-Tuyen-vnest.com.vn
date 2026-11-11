import { chromium } from "/Users/noe/Documents/GitHub/Cigarettes-After-Sex/node_modules/.pnpm/playwright@1.62.1/node_modules/playwright/index.mjs";
const [base, tag, out] = process.argv.slice(2);
const VPS = [{ n: "390", width: 390, height: 844, isMobile: true, hasTouch: true }, { n: "1440", width: 1440, height: 900, isMobile: false, hasTouch: false }];
const browser = await chromium.launch();
for (const vp of VPS) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: vp.isMobile, hasTouch: vp.hasTouch, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => m.type() === "error" && !m.text().startsWith("Failed to load resource") && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(`${base}/dev/demo?intro=0`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${out}/${tag}-hero-${vp.n}.png` });
  for (const id of ["ve-vnest"]) {
    await page.locator(`#${id}`).scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await page.locator(`#${id}`).screenshot({ path: `${out}/${tag}-about-${vp.n}.png` });
  }
  // FAQ through to the end of the page.
  const top = await page.evaluate(() => {
    const ids = ["hoi-dap", "lien-he"].map((id) => document.getElementById(id)).filter(Boolean);
    return Math.min(...ids.map((el) => el.getBoundingClientRect().top + scrollY));
  });
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.screenshot({ path: `${out}/${tag}-faq-contact-footer-${vp.n}.png`, fullPage: true, clip: { x: 0, y: top - 40, width: vp.width, height: height - top + 40 } });
  await page.evaluate(() => scrollTo(0, 0));
  const menu = page.locator('header nav button[aria-haspopup="dialog"]');
  await menu.click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}/${tag}-menu-${vp.n}.png` });
  console.log(vp.n, "errors:", JSON.stringify(errors), "overflow:", await page.evaluate(() => document.documentElement.scrollWidth - innerWidth));
  await ctx.close();
}
await browser.close();
