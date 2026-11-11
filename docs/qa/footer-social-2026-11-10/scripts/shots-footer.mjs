// Footer screenshots (10/11/2026): the footer's bottom row at desktop and phone widths, VI and EN, plus the tooltip.
// Usage: node shots-footer.mjs http://localhost:3401 <out-dir> [suffix]
import { chromium } from "/Users/noe/Documents/GitHub/Cigarettes-After-Sex/node_modules/.pnpm/playwright@1.62.1/node_modules/playwright/index.mjs";
const [base, out, suffix = ""] = process.argv.slice(2);
const browser = await chromium.launch();
const pages = [
  ["home", "/dev/demo?intro=0"],
  ["partner", "/dev/demo/hop-tac"],
  ["results", "/dev/demo/tim-phong"],
];
for (const [name, path] of pages) {
  for (const width of [1440, 1024, 768, 390, 375]) {
    for (const lang of ["vi", "en"]) {
      if (lang === "en" && ![1440, 390].includes(width)) continue;
      if (name !== "home" && ![1440, 390].includes(width)) continue;
      const mobile = width < 1024;
      const page = await browser.newPage({ viewport: { width, height: mobile ? 844 : 900 }, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 2, reducedMotion: "reduce" });
      const sep = path.includes("?") ? "&" : "?";
      await page.goto(`${base}${path}${sep}lang=${lang}`, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
      await page.addStyleTag({ content: "nextjs-portal{display:none!important} #top{visibility:hidden!important}" });
      const footer = page.locator("footer").last();
      await footer.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      await footer.screenshot({ path: `${out}/${name}-footer-${width}-${lang}${suffix}.png` });
      if (!mobile && lang === "vi" && name === "home" && width === 1440) {
        const icon = page.locator("[data-social]").first();
        if (await icon.count()) {
          const bottom = page.locator("footer [class*=footerBottom]").last();
          const b = await bottom.boundingBox();
          const clip = { x: b.x + b.width - 520, y: b.y - 48, width: 520, height: b.height + 56 };
          await page.screenshot({ path: `${out}/footer-right-default.png`, clip });
          await icon.hover();
          await page.waitForTimeout(350);
          await page.screenshot({ path: `${out}/footer-right-hover.png`, clip });
        }
      }
      await page.close();
    }
  }
}
await browser.close();
