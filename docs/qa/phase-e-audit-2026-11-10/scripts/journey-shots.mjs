// Phase E audit (10/11/2026): screenshots of the booking journey on a production build, desktop and phone.
// Homepage guest field → results (GoHost + ezCloud states) → GoHost property room selection → review dialog →
// /dev/demo/dat-phong; ezCloud property hand-off; partner form validation; homepage menu; English homepage.
// Usage: node docs/qa/phase-e-audit-2026-11-10/scripts/journey-shots.mjs http://localhost:3405 <out-dir>
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "/Users/noe/Documents/GitHub/Cigarettes-After-Sex/node_modules/.pnpm/playwright@1.62.1/node_modules/playwright/index.mjs";

const [base, out] = process.argv.slice(2);
mkdirSync(`${out}/shots`, { recursive: true });
const day = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
const IN = day(30);
const OUT = day(32);
const log = [];
const note = (s) => {
  log.push(s);
  process.stdout.write(s + "\n");
};

const browser = await chromium.launch();
for (const vp of [
  { name: "1440", width: 1440, height: 900, mobile: false },
  { name: "390", width: 390, height: 844, mobile: true },
]) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: vp.mobile, hasTouch: vp.mobile });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text().slice(0, 160)));
  const shot = (name, full = false) => page.screenshot({ path: `${out}/shots/journey-${vp.name}-${name}.jpg`, type: "jpeg", quality: 70, fullPage: full });
  const tap = (loc) => (vp.mobile ? loc.tap() : loc.click());
  const step = async (name, fn) => {
    try {
      await fn();
      note(`OK   ${vp.name} ${name}`);
    } catch (e) {
      note(`FAIL ${vp.name} ${name}: ${String(e).split("\n")[0].slice(0, 160)}`);
    }
  };

  await step("intro plays on first load, then hero", async () => {
    await page.goto(`${base}/dev/demo`, { waitUntil: "load" });
    await page.waitForTimeout(300);
    await shot("00-intro");
    await page.waitForTimeout(3500);
    await shot("01-hero");
  });
  await step("menu opens", async () => {
    const menu = page.getByRole("button", { name: /^(Menu|Mở menu)/i }).first();
    await tap(menu);
    await page.waitForTimeout(600);
    await shot("02-menu");
    await page.keyboard.press("Escape");
    await page.waitForTimeout(400);
  });
  await step("homepage guest field (adults + children)", async () => {
    if (vp.mobile) {
      await page.locator('#dat-phong button[aria-haspopup="dialog"]:visible').first().tap();
      await page.locator('dialog[open] [data-section="guests"]').tap();
    } else {
      await page.locator("#dat-phong").evaluate((el) => el.scrollIntoView({ block: "center" }));
      await page.locator('#dat-phong button[data-field="guests"]:visible').first().click();
    }
    await page.locator('[data-testid="occupancy-panel"]:visible').waitFor({ timeout: 5000 });
    await page.waitForTimeout(300);
    await shot("03-guest-panel");
    await page.keyboard.press("Escape");
  });
  await step("results page: GoHost unconfigured + ezCloud hand-off", async () => {
    await page.goto(`${base}/dev/demo/tim-phong?checkIn=${IN}&checkOut=${OUT}&adults=3&children=1`, { waitUntil: "load" });
    await page.waitForTimeout(1500);
    await shot("04-results");
    await shot("04-results-full", true);
  });
  await step("GoHost property: select two rooms → review dialog", async () => {
    await page.goto(`${base}/dev/stays/bare-da-kao?checkIn=${IN}&checkOut=${OUT}&adults=3&rooms=2`, { waitUntil: "load" });
    await page.waitForTimeout(1200);
    await page.locator("#rooms").evaluate((el) => el.scrollIntoView({ block: "start" }));
    await page.waitForTimeout(400);
    await tap(page.locator('[data-testid="select-room-bare-da-kao-two"]'));
    await tap(page.locator('[data-testid="select-room-bare-da-kao-three"]'));
    await page.waitForTimeout(500);
    await shot("05-rooms-selected");
    await tap(page.locator('[data-testid="summary-bar-book-now"]'));
    const dialog = page.locator('dialog[data-testid="property-booking-dialog"][open]');
    await dialog.waitFor({ timeout: 5000 });
    await page.waitForTimeout(400);
    await shot("06-review-dialog");
    const href = await dialog.locator('[data-testid="continue-property-booking-request"]').getAttribute("href");
    await page.goto(new URL(href, base).href, { waitUntil: "load" });
    await page.waitForTimeout(800);
    await shot("07-dat-phong", true);
    note(`INFO ${vp.name} dat-phong text: ${(await page.locator("main").innerText()).replace(/\s+/g, " ").slice(0, 400)}`);
  });
  await step("ezCloud property: hand-off state", async () => {
    await page.goto(`${base}/dev/stays/bare-chic?view=demo&checkIn=${IN}&checkOut=${OUT}&adults=2`, { waitUntil: "load" });
    await page.waitForTimeout(1200);
    const cta = page.locator('[data-testid="property-handoff-cta"]:visible').first();
    await cta.scrollIntoViewIfNeeded();
    await shot("08-ezcloud-room-step");
    note(`INFO ${vp.name} ezCloud CTA: "${(await cta.innerText()).trim()}" → ${await cta.getAttribute("href")}`);
  });
  await step("partner page form: empty submit shows errors, valid submit says not sent", async () => {
    await page.goto(`${base}/dev/demo/hop-tac#tu-van`, { waitUntil: "load" });
    await page.waitForTimeout(1000);
    const form = page.locator("#tu-van form");
    await form.scrollIntoViewIfNeeded();
    await tap(form.locator('button[type="submit"]'));
    await page.waitForTimeout(300);
    await shot("09-form-invalid");
    await form.locator('input[name="name"]').fill("Audit Test");
    await form.locator('input[name="reach"]').fill("audit@example.test");
    await tap(form.locator('button[type="submit"]'));
    await page.waitForTimeout(300);
    note(`INFO ${vp.name} form status: ${(await form.locator('[role="status"]').innerText()).trim()}`);
    await shot("10-form-unsent");
  });
  await step("English homepage + switch back to VI keeps params", async () => {
    await page.goto(`${base}/dev/demo?intro=0&lang=en&checkIn=${IN}&checkOut=${OUT}&adults=2`, { waitUntil: "load" });
    await page.waitForTimeout(1200);
    await shot("11-home-en");
    const before = page.url();
    if (vp.mobile) {
      await tap(page.getByRole("button", { name: /menu/i }).first());
      await page.waitForTimeout(500);
    }
    await tap(page.locator('[data-testid="language-switch"]:visible a', { hasText: "VI" }).first());
    await page.waitForTimeout(1200);
    note(`INFO ${vp.name} switch: ${before.replace(base, "")} → ${page.url().replace(base, "")}`);
    note(`INFO ${vp.name} html lang after switch: ${await page.evaluate(() => document.documentElement.lang)}`);
  });
  note(`INFO ${vp.name} page errors: ${JSON.stringify([...new Set(errors)].slice(0, 6))}`);
  await ctx.close();
}
await browser.close();
writeFileSync(`${out}/journey.log`, log.join("\n") + "\n");
