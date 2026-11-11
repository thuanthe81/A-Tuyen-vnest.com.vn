// CTA treatment preview (9/11/2026): the page on desktop and phone (VI, EN), close-ups of each state, frame sequences of
// the hover wipe, and a check of the label/fill sync, contrast, focus and reduced motion.
// Usage: node shots-cta.mjs http://localhost:3401 <out-dir>
import { chromium } from "/Users/noe/Documents/GitHub/Cigarettes-After-Sex/node_modules/.pnpm/playwright@1.62.1/node_modules/playwright/index.mjs";
const [base, out] = process.argv.slice(2);
const browser = await chromium.launch();
const results = [];

async function open(path, width, motion = "no-preference") {
  const mobile = width < 1024;
  const page = await browser.newPage({ viewport: { width, height: mobile ? 844 : 900 }, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 2, reducedMotion: motion });
  const errors = [];
  page.on("console", (m) => (m.type() === "error" || /hydrat/i.test(m.text())) && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(`${base}${path}`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
  return { page, errors };
}

const around = async (page, locator, file, pad = 10) => {
  await locator.scrollIntoViewIfNeeded();
  const b = await locator.boundingBox();
  await page.screenshot({ path: `${out}/${file}.png`, clip: { x: b.x - pad, y: b.y - pad, width: b.width + pad * 2, height: b.height + pad * 2 } });
};

for (const [lang, q] of [["vi", "?lang=vi"], ["en", "?lang=en"]]) {
  for (const width of [1440, 390]) {
    const { page, errors } = await open(`/dev/partner-cta${q}`, width);
    await page.screenshot({ path: `${out}/preview-${lang}-${width === 1440 ? "desktop" : "mobile"}.png`, fullPage: true });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    results.push({ lang, width, overflow, errors });
    await page.close();
  }
}

// States and the wipe, desktop, VI.
for (const option of ["a", "b"]) {
  const { page } = await open("/dev/partner-cta?lang=vi", 1440);
  const frozen = page.locator(`[data-option="${option}"] [data-state-preview]`);
  for (const [i, name] of ["default", "hover", "focus"].entries()) await around(page, frozen.nth(i).locator("a"), `option-${option}-${name}`);
  const live = page.locator(`[data-option="${option}"] a[data-live="service"]`).nth(1);
  await live.scrollIntoViewIfNeeded();
  const box = await live.boundingBox();
  await around(page, live, `option-${option}-wipe-000ms`);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  let elapsed = 0;
  for (const t of [80, 160, 240, 400]) {
    await page.waitForTimeout(t - elapsed);
    elapsed = t;
    await around(page, live, `option-${option}-wipe-${String(t).padStart(3, "0")}ms`);
  }
  // Mid-wipe, the light label must be clipped exactly like the fill: the "on" layer is one element.
  await page.mouse.move(0, 0);
  await page.waitForTimeout(400);
  await page.close();
}

// Phone: rest and pressed (touch has no hover).
{
  const { page } = await open("/dev/partner-cta?lang=vi", 390);
  const live = page.locator('[data-option="a"] a[data-live="service"]').nth(0);
  await live.scrollIntoViewIfNeeded();
  await around(page, live, "option-a-mobile-default", 14);
  await live.focus();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  await page.waitForTimeout(400);
  await around(page, live, "option-a-mobile-focus", 14);
  await page.close();
}

// Checks: contrast of both states, focus ring, reduced motion, no underline, heights.
{
  const { page } = await open("/dev/partner-cta?lang=en", 1440, "reduce");
  const info = await page.evaluate(() =>
    [...document.querySelectorAll("a[data-live]")].map((a) => {
      const base = a.children[0];
      const on = a.children[1];
      return {
        live: a.dataset.live,
        h: a.getBoundingClientRect().height,
        underline: [a, ...a.querySelectorAll("*")].some((n) => getComputedStyle(n).textDecorationLine.includes("underline")),
        baseColor: getComputedStyle(base).color,
        onColor: getComputedStyle(on).color,
        fill: getComputedStyle(on).backgroundColor,
        onHidden: on.getAttribute("aria-hidden"),
        transition: getComputedStyle(on).transitionDuration,
        name: a.textContent.length,
      };
    }),
  );
  results.push({ reducedMotion: info });
  await page.close();
}
console.log(JSON.stringify(results, null, 1));
await browser.close();
