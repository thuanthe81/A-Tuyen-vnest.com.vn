// Partner journey screenshots (9/11/2026): the homepage Visual Accordion after its alignment polish (each service,
// desktop and phone, with the link to the partner page), and the partner page (full page desktop and phone, its key
// sections, English).
// Usage: node shots-partner-page.mjs http://localhost:3401 <out-dir>
import { chromium } from "/Users/noe/Documents/GitHub/Cigarettes-After-Sex/node_modules/.pnpm/playwright@1.62.1/node_modules/playwright/index.mjs";
const [base, out] = process.argv.slice(2);
const browser = await chromium.launch();
const SERVICES = ["van-hanh", "tu-van-mo-hinh", "nhuong-quyen"];

async function open(path, width) {
  const mobile = width < 1024;
  const page = await browser.newPage({ viewport: { width, height: mobile ? 844 : 900 }, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: mobile ? 2 : 1, reducedMotion: "reduce" });
  await page.goto(`${base}${path}`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  // Load every lazy photograph before the capture.
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 500) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 50));
    }
    window.scrollTo(0, 0);
  });
  await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
  await page.waitForTimeout(400);
  return page;
}

async function section(path, width, selector, file) {
  const page = await open(path, width);
  await page.addStyleTag({ content: "#top{visibility:hidden!important}" });
  await page.locator(selector).screenshot({ path: `${out}/${file}.png` });
  await page.close();
}

async function full(path, width, file) {
  const page = await open(path, width);
  await page.screenshot({ path: `${out}/${file}.png`, fullPage: true });
  await page.close();
}

// Homepage, Concept B after the alignment polish.
for (const [i, id] of SERVICES.entries()) {
  await section(`/dev/demo?intro=0&dich-vu=${id}`, 1440, "#hop-tac", `home-accordion-desktop-0${i + 1}-${id}`);
  await section(`/dev/demo?intro=0&dich-vu=${id}`, 390, "#hop-tac", `home-accordion-mobile-0${i + 1}-${id}`);
}
await section("/dev/demo?intro=0&dich-vu=tu-van-mo-hinh", 768, "#hop-tac", "home-accordion-768-02");
await section("/dev/demo?intro=0&dich-vu=nhuong-quyen", 1024, "#hop-tac", "home-accordion-1024-03");
await section("/dev/demo?intro=0&dich-vu=van-hanh&lang=en", 1440, "#hop-tac", "home-accordion-desktop-en-01");

// The partner page.
await full("/dev/demo/hop-tac", 1440, "partner-page-desktop-full");
await full("/dev/demo/hop-tac", 390, "partner-page-mobile-full");
await full("/dev/demo/hop-tac?lang=en", 1440, "partner-page-desktop-full-en");
for (const [selector, name] of [
  ["main section[aria-labelledby='hop-tac-title']", "01-hero"],
  ["#dich-vu", "02-services"],
  ["#the-manh", "03-why"],
  ["#cach-hop-tac", "04-process"],
  ["#thuong-hieu", "05-brands"],
  ["#hoi-dap", "06-faq"],
]) {
  await section("/dev/demo/hop-tac", 1440, selector, `partner-${name}-desktop`);
}
await section("/dev/demo/hop-tac", 390, "#dich-vu-nhuong-quyen", "partner-02-service-03-mobile");
await section("/dev/demo/hop-tac", 390, "#thuong-hieu", "partner-05-brands-mobile");
await browser.close();
