// Phase A final contact refinement screenshots: Contact and the consultation form as two sections, the full
// FAQ → Contact → Form → footer run, and the form after the contact CTA (focused heading).
// Usage: node shots-a3.mjs http://localhost:3401 <out-dir>
import { chromium } from "/Users/noe/Documents/GitHub/Cigarettes-After-Sex/node_modules/.pnpm/playwright@1.62.1/node_modules/playwright/index.mjs";
const [base, out] = process.argv.slice(2);
const VPS = [
  { n: "390", width: 390, height: 844, isMobile: true, hasTouch: true },
  { n: "768", width: 768, height: 1024, isMobile: true, hasTouch: true },
  { n: "1440", width: 1440, height: 900, isMobile: false, hasTouch: false },
];
const browser = await chromium.launch();
for (const vp of VPS) {
  for (const lang of ["vi", "en"]) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: vp.isMobile, hasTouch: vp.hasTouch, reducedMotion: "reduce" });
    const page = await ctx.newPage();
    await page.goto(`${base}/dev/demo?intro=0${lang === "en" ? "&lang=en" : ""}`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(400);
    const sfx = `${vp.n}${lang === "en" ? "-en" : ""}`;
    // FAQ → Contact → Form → footer, full height.
    const top = await page.evaluate(() => document.getElementById("hoi-dap").getBoundingClientRect().top + scrollY);
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    await page.screenshot({ path: `${out}/faq-contact-form-footer-${sfx}.png`, fullPage: true, clip: { x: 0, y: top, width: vp.width, height: height - top } });
    // Contact and Form, each section on its own.
    await page.locator("#lien-he").screenshot({ path: `${out}/section-contact-${sfx}.png` });
    await page.locator("#tu-van").screenshot({ path: `${out}/section-form-${sfx}.png` });
    if (lang === "vi") {
      // Where the contact CTA lands: the form section at the top, its heading focused (keyboard).
      await page.evaluate(() => scrollTo(0, 0));
      await page.locator("#lien-he [class*=footerCta]").focus();
      await page.keyboard.press("Enter");
      await page.waitForTimeout(600);
      await page.screenshot({ path: `${out}/cta-lands-on-form-${vp.n}.png` });
    }
    await ctx.close();
  }
}
await browser.close();
