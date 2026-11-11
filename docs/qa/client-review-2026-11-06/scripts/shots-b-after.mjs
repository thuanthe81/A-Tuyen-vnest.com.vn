// Phase B "after" screenshots of the brand showcase: neutral state at every width; hover and selected for each brand on
// desktop; tap selection on phones and tablet; English; the full homepage for context.
// Usage: node shots-b-after.mjs http://localhost:3401 <out-dir>
import { chromium } from "/Users/noe/Documents/GitHub/Cigarettes-After-Sex/node_modules/.pnpm/playwright@1.62.1/node_modules/playwright/index.mjs";
const [base, out] = process.argv.slice(2);
const ORDER = ["bare", "pepper-house", "the-nang"];
const browser = await chromium.launch();
const row = (id) => `#thuong-hieu button[aria-controls][data-brand="${id}"]`;

async function open(width, lang = "vi") {
  const mobile = width < 1024;
  const ctx = await browser.newContext({ viewport: { width, height: mobile ? 844 : 900 }, isMobile: mobile, hasTouch: mobile, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await page.goto(`${base}/dev/demo?intro=0${lang === "en" ? "&lang=en" : ""}`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({ content: "#top{visibility:hidden!important} [data-nextjs-toast],nextjs-portal{display:none!important}" });
  const sec = page.locator("#thuong-hieu");
  await sec.evaluate((el) => el.scrollIntoView({ block: "start" }));
  // Load every lazy photograph in the section before the first picture.
  await page.evaluate(() => Promise.all([...document.querySelectorAll("#thuong-hieu img")].map((img) => (img.loading = "eager", img.decode().catch(() => {})))));
  await page.waitForTimeout(400);
  return { ctx, page, sec, mobile };
}

for (const width of [1440, 1024, 768, 430, 390, 375]) {
  const { ctx, page, sec, mobile } = await open(width);
  await sec.screenshot({ path: `${out}/1-neutral-${width}.png` });
  if (!mobile) {
    for (const [n, id] of ORDER.entries()) {
      await page.locator(row(id)).hover();
      await page.waitForTimeout(400);
      await sec.screenshot({ path: `${out}/${n + 2}-${id}-hover-${width}.png` });
      await page.locator(row(id)).click();
      await page.mouse.move(5, 5);
      await page.waitForTimeout(400);
      await sec.screenshot({ path: `${out}/${n + 2}-${id}-selected-${width}.png` });
    }
  } else {
    for (const id of ORDER) {
      await page.locator(row(id)).tap();
      await page.waitForTimeout(500);
      if (width === 390 || width === 768 || id === "bare") await sec.screenshot({ path: `${out}/5-mobile-${id}-selected-${width}.png` });
    }
    // What the visitor sees right after tapping: the strip under the header, the panel below it.
    await page.locator(row("pepper-house")).tap();
    await page.waitForTimeout(700);
    await page.addStyleTag({ content: "#top{visibility:visible!important}" });
    await page.screenshot({ path: `${out}/5-mobile-after-tap-viewport-${width}.png` });
  }
  await ctx.close();
}

// English.
for (const width of [1440, 390]) {
  const { ctx, page, sec, mobile } = await open(width, "en");
  if (!mobile) {
    await page.locator(row("the-nang")).hover();
    await page.waitForTimeout(400);
    await sec.screenshot({ path: `${out}/en-the-nang-hover-${width}.png` });
  }
  await (mobile ? page.locator(row("pepper-house")).tap() : page.locator(row("pepper-house")).click());
  await page.mouse.move(5, 5).catch(() => {});
  await page.waitForTimeout(500);
  await sec.screenshot({ path: `${out}/en-pepper-house-selected-${width}.png` });
  await ctx.close();
}

// Full homepage context (neutral brand section).
for (const width of [1440, 390]) {
  const { ctx, page } = await open(width);
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += 600) {
      scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    scrollTo(0, 0);
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${out}/6-homepage-full-${width}.png`, fullPage: true });
  await ctx.close();
}
await browser.close();
