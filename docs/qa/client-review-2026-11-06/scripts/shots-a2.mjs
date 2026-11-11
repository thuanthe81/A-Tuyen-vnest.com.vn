// Phase A corrections screenshots: menu, FAQ → contact → form → footer, hero frames, the keyboard-revealed pause.
// Usage: node shots-a2.mjs http://localhost:3401 <out-dir>
import { chromium } from "/Users/noe/Documents/GitHub/Cigarettes-After-Sex/node_modules/.pnpm/playwright@1.62.1/node_modules/playwright/index.mjs";
const [base, out] = process.argv.slice(2);
const VPS = [{ n: "390", width: 390, height: 844, isMobile: true, hasTouch: true }, { n: "1440", width: 1440, height: 900, isMobile: false, hasTouch: false }];
const browser = await chromium.launch();
for (const vp of VPS) {
  for (const lang of ["vi", "en"]) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: vp.isMobile, hasTouch: vp.hasTouch, reducedMotion: "reduce" });
    const page = await ctx.newPage();
    await page.goto(`${base}/dev/demo?intro=0${lang === "en" ? "&lang=en" : ""}`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(500);
    const sfx = lang === "en" ? "-en" : "";
    if (lang === "vi") {
      const top = await page.evaluate(() => document.getElementById("hoi-dap").getBoundingClientRect().top + scrollY);
      const height = await page.evaluate(() => document.documentElement.scrollHeight);
      await page.screenshot({ path: `${out}/faq-contact-form-footer-${vp.n}.png`, fullPage: true, clip: { x: 0, y: top, width: vp.width, height: height - top } });
      // The contact panel as it lands from the menu.
      await page.evaluate(() => document.getElementById("lien-he").scrollIntoView());
      await page.waitForTimeout(400);
      await page.screenshot({ path: `${out}/contact-viewport-${vp.n}.png` });
      // Keyboard-revealed pause.
      await page.evaluate(() => { scrollTo(0, 0); document.querySelector("header a")?.focus(); });
      for (let i = 0; i < 25; i++) {
        await page.keyboard.press("Tab");
        if (await page.evaluate(() => document.activeElement?.className.includes("heroPause"))) break;
      }
      await page.waitForTimeout(200);
      await page.screenshot({ path: `${out}/hero-keyboard-pause-${vp.n}.png` });
      await page.keyboard.press("Shift+Tab");
    }
    await page.evaluate(() => scrollTo(0, 0));
    await page.locator('header nav button[aria-haspopup="dialog"]').click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${out}/menu-${vp.n}${sfx}.png` });
    await ctx.close();
  }
  // Hero autoplay: three frames 2.6 s apart, normal motion, no controls on screen.
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: vp.isMobile, hasTouch: vp.hasTouch });
  const page = await ctx.newPage();
  await page.goto(`${base}/dev/demo?intro=0`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  const active = () => page.evaluate(() => [...document.querySelectorAll('[aria-roledescription="slide"]')].findIndex((s) => s.getAttribute("data-active") === "true"));
  for (let f = 0; f < 3; f++) {
    const a = await active();
    await page.waitForFunction((a) => [...document.querySelectorAll('[aria-roledescription="slide"]')].findIndex((s) => s.getAttribute("data-active") === "true") !== a, a, { timeout: 6000, polling: 20 });
    await page.waitForTimeout(900); // after the fade
    await page.screenshot({ path: `${out}/hero-frame-${f + 1}-${vp.n}.png` });
  }
  await ctx.close();
}
await browser.close();
