// Phase C "before": the brand heading and the Discovery section (#kham-pha) as they were after Phase B.
// Usage: node shots-c-before.mjs http://localhost:3401 <out-dir>
import { chromium } from "/Users/noe/Documents/GitHub/Cigarettes-After-Sex/node_modules/.pnpm/playwright@1.62.1/node_modules/playwright/index.mjs";
const [base, out] = process.argv.slice(2);
const browser = await chromium.launch();
for (const width of [1440, 768, 390]) {
  const mobile = width < 1024;
  const page = await browser.newPage({ viewport: { width, height: mobile ? 844 : 900 }, isMobile: mobile, hasTouch: mobile });
  await page.goto(`${base}/dev/demo?intro=0`, { waitUntil: "networkidle" });
  await page.addStyleTag({ content: "#top{visibility:hidden!important}" });
  await page.evaluate(() => Promise.all([...document.querySelectorAll("#kham-pha img")].map((i) => (i.loading = "eager", i.decode().catch(() => {})))));
  await page.locator("#thuong-hieu header").screenshot({ path: `${out}/brand-heading-${width}.png` });
  await page.locator("#kham-pha").screenshot({ path: `${out}/discovery-${width}.png` });
  await page.close();
}
await browser.close();
