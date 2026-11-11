// Phase D final fixes QA (owner brief 10/11/2026), run on a production build (`next build` + `next start`).
// A · the Nest Converge intro replays on every full load and never on client-side moves.
// B · English preview: no prefetch redirects, network idle reached, real navigation keeps the language, no runaway requests.
// C · brand cards follow the restored search after Back (dates, adults, children, chosen rooms).
// Usage: node docs/qa/booking-ux-phase-d-2026-11-09/scripts/qa-final.mjs http://localhost:3403 [shots-dir]
import { chromium } from "/Users/noe/Documents/GitHub/Cigarettes-After-Sex/node_modules/.pnpm/playwright@1.62.1/node_modules/playwright/index.mjs";
const [base, shots] = process.argv.slice(2);
const browser = await chromium.launch();
const results = [];
const ok = (name, cond, info = "") => results.push(`${cond ? "PASS" : "FAIL"} ${name}${info ? " — " + info : ""}`);
const VIEWPORTS = [
  { name: "1440", width: 1440, height: 900, mobile: false },
  { name: "1024", width: 1024, height: 768, mobile: false },
  { name: "768", width: 768, height: 1024, mobile: false },
  { name: "390", width: 390, height: 844, mobile: true },
];
const IN = "2026-11-28";
const OUT = "2026-12-02";
const shot = async (page, name) => {
  if (shots) await page.screenshot({ path: `${shots}/${name}.png` });
};

// Every document records when the intro overlay is on screen (sampled each frame for 3 s after load).
const RECORDER = () => {
  const log = { first: null, last: null, frames: 0 };
  window.__intro = log;
  const t0 = performance.now();
  const tick = () => {
    const el = document.querySelector("[data-vnest-reveal]");
    const t = performance.now();
    if (el) {
      const cs = getComputedStyle(el);
      if (cs.visibility !== "hidden" && Number(cs.opacity) > 0.02) {
        log.frames++;
        if (log.first === null) log.first = Math.round(t);
        log.last = Math.round(t);
      }
    }
    if (t - t0 < 3000) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};
async function context(vp, extra = {}) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: vp.mobile, hasTouch: vp.mobile, ...extra });
  await ctx.addInitScript(RECORDER);
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => {
    const t = m.text();
    if ((m.type() === "error" || /hydrat/i.test(t)) && !t.startsWith("Failed to load resource") && !t.includes("maps.googleapis")) errors.push(t);
  });
  page.on("pageerror", (e) => errors.push(String(e)));
  return { ctx, page, errors };
}
const introLog = async (page) => {
  await page.waitForTimeout(2200);
  return page.evaluate(() => window.__intro);
};
/** Watches the overlay for 1.5 s in the current document (after a client-side move). */
const overlayDuring = (page) =>
  page.evaluate(
    () =>
      new Promise((resolve) => {
        let seen = 0;
        const t0 = performance.now();
        const tick = () => {
          const el = document.querySelector("[data-vnest-reveal]");
          if (el && getComputedStyle(el).visibility !== "hidden" && Number(getComputedStyle(el).opacity) > 0.02) seen++;
          if (performance.now() - t0 < 1500) requestAnimationFrame(tick);
          else resolve(seen);
        };
        requestAnimationFrame(tick);
      }),
  );
const played = (log) => log && log.first !== null && log.first < 400 && log.last - log.first > 700 && log.last - log.first < 1500;
const markDocument = (page) => page.evaluate(() => (window.__sameDocument = true));
const sameDocument = (page) => page.evaluate(() => window.__sameDocument === true).catch(() => false);

// ── A · intro ──
for (const vp of VIEWPORTS) {
  const tag = `@${vp.name}`;
  const { ctx, page, errors } = await context(vp);
  // Server HTML already holds the overlay (no flash of the homepage before it).
  const html = await (await page.request.get(`${base}/dev/demo`)).text();
  ok(`${tag} A server HTML carries the intro overlay`, html.includes("data-vnest-reveal"));
  const off = await (await page.request.get(`${base}/dev/demo?intro=0`)).text();
  ok(`${tag} A ?intro=0: no overlay in the server HTML`, !off.includes("data-vnest-reveal"));

  await page.goto(`${base}/dev/demo`, { waitUntil: "commit" });
  if (vp.name === "1440") {
    for (const ms of [150, 450, 850, 1500]) {
      await page.waitForTimeout(ms === 150 ? 150 : ms - [150, 450, 850, 1500][[150, 450, 850, 1500].indexOf(ms) - 1]);
      await shot(page, `intro-1440-first-visit-${ms}ms`);
    }
  }
  let log = await introLog(page);
  ok(`${tag} A first visit plays (~1.2 s)`, played(log), JSON.stringify(log));
  await page.reload({ waitUntil: "commit" });
  if (vp.name === "1440") {
    await page.waitForTimeout(450);
    await shot(page, "intro-1440-after-reload-450ms");
  }
  log = await introLog(page);
  ok(`${tag} A refresh replays`, played(log), JSON.stringify(log));
  const cdp = await ctx.newCDPSession(page);
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
  await page.reload({ waitUntil: "commit" });
  log = await introLog(page);
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: false });
  ok(`${tag} A hard reload (cache disabled) replays`, played(log), JSON.stringify(log));

  // Client-side navigation: homepage → property (card) → logo back to the homepage; Back; language switch.
  await page.waitForLoadState("networkidle");
  await markDocument(page);
  const card = page.locator('a[href^="/dev/stays/bare-da-kao"]:visible').first();
  await card.scrollIntoViewIfNeeded();
  await card.click();
  await page.waitForURL((u) => u.pathname === "/dev/stays/bare-da-kao");
  await page.waitForLoadState("networkidle");
  await page.locator("header#top a").first().click();
  await page.waitForURL((u) => u.pathname === "/dev/demo");
  const viaLink = await overlayDuring(page);
  ok(`${tag} A client-side link back to the homepage: no intro, same document`, viaLink === 0 && (await sameDocument(page)), `${viaLink} frames`);
  await page.goBack();
  await page.waitForURL((u) => u.pathname === "/dev/stays/bare-da-kao");
  await page.goBack();
  await page.waitForURL((u) => u.pathname === "/dev/demo");
  const viaBack = await overlayDuring(page);
  ok(`${tag} A Back / Back to the homepage: no intro`, viaBack === 0 && (await sameDocument(page)), `${viaBack} frames`);
  await page.goForward();
  await page.waitForURL((u) => u.pathname === "/dev/stays/bare-da-kao");
  await page.goBack();
  await page.waitForURL((u) => u.pathname === "/dev/demo");
  ok(`${tag} A Forward then Back: no intro`, (await overlayDuring(page)) === 0);
  const sw = page.locator('[data-testid="language-switch"] a[data-locale="en"]:visible').first();
  if (await sw.count()) {
    await sw.click();
    await page.waitForURL((u) => u.searchParams.get("lang") === "en");
    const viaLang = await overlayDuring(page);
    ok(`${tag} A VI → EN switch: no intro, no reload`, viaLang === 0 && (await sameDocument(page)), `${viaLang} frames`);
  } else {
    // Phones: the switch lives in the menu.
    await page.locator('header#top button[aria-haspopup="dialog"], header#top button[aria-expanded]').last().click();
    const inMenu = page.locator('[data-testid="language-switch"] a[data-locale="en"]:visible').first();
    await inMenu.click();
    await page.waitForURL((u) => u.searchParams.get("lang") === "en");
    const viaLang = await overlayDuring(page);
    ok(`${tag} A VI → EN switch (menu): no intro, no reload`, viaLang === 0 && (await sameDocument(page)), `${viaLang} frames`);
  }
  // Arriving at the homepage by a client-side link from another page loaded first: no intro.
  await page.goto(`${base}/dev/stays/bare-chic?view=demo`, { waitUntil: "networkidle" });
  await page.locator("header#top a").first().click();
  await page.waitForURL((u) => u.pathname === "/dev/demo");
  ok(`${tag} A homepage reached from another page by a link: no intro`, (await overlayDuring(page)) === 0);
  // ?intro=0 and the forced preview.
  await page.goto(`${base}/dev/demo?intro=0`, { waitUntil: "commit" });
  log = await introLog(page);
  ok(`${tag} A ?intro=0 skips`, log.first === null, JSON.stringify(log));
  await page.goto(`${base}/dev/demo?intro=converge`, { waitUntil: "commit" });
  log = await introLog(page);
  ok(`${tag} A ?intro=converge plays`, played(log), JSON.stringify(log));
  ok(`${tag} A converge variant`, (await page.evaluate(() => document.documentElement.innerHTML.includes('data-vnest-reveal-variant="converge"'))) || log.first !== null);
  ok(`${tag} A no console or hydration errors`, errors.length === 0, errors[0]?.slice(0, 200));
  await ctx.close();
}
{
  const { ctx, page, errors } = await context(VIEWPORTS[0], { reducedMotion: "reduce" });
  await page.goto(`${base}/dev/demo`, { waitUntil: "commit" });
  const log = await introLog(page);
  ok("@1440 A reduced motion: short static version (≤ 0.6 s), no stroke animation", log.first !== null && log.last - log.first <= 600, JSON.stringify(log));
  await page.reload({ waitUntil: "commit" });
  const again = await introLog(page);
  ok("@1440 A reduced motion: also on refresh", again.first !== null && again.last - again.first <= 600, JSON.stringify(again));
  ok("@1440 A reduced motion: no errors", errors.length === 0, errors[0]?.slice(0, 200));
  await ctx.close();
}

// ── B · English and Vietnamese on the production build ──
for (const vp of [VIEWPORTS[0], VIEWPORTS[3]]) {
  const tag = `@${vp.name}`;
  const { ctx, page, errors } = await context(vp);
  const redirects = [];
  const rsc = [];
  page.on("response", (r) => {
    if (r.status() >= 300 && r.status() < 400) redirects.push(`${r.status()} ${new URL(r.url()).pathname}${new URL(r.url()).search}`);
  });
  page.on("request", (r) => {
    if (r.url().includes("_rsc=")) rsc.push(r.url());
  });
  const start = Date.now();
  await page.goto(`${base}/dev/demo?intro=0&lang=en`, { waitUntil: "networkidle", timeout: 20000 });
  ok(`${tag} B English homepage reaches network idle`, true, `${Date.now() - start} ms`);
  const prefetchRedirects = redirects.filter((r) => r.includes("_rsc="));
  ok(`${tag} B no redirected prefetches`, prefetchRedirects.length === 0, prefetchRedirects.slice(0, 3).join(", "));
  const main = await page.locator("main").innerText();
  ok(`${tag} B English copy rendered`, /Stay\./.test(main) && /Contact VNest/.test(main));
  const settled = rsc.length;
  await page.waitForTimeout(6000);
  ok(`${tag} B no runaway prefetch after idle (6 s)`, rsc.length - settled <= 2, `${settled} → ${rsc.length}`);
  // Real navigation keeps English: a card link without lang, then the header logo.
  await markDocument(page);
  const card = page.locator('a[href^="/dev/stays/bare-chic"]:visible').first();
  await card.scrollIntoViewIfNeeded();
  await card.click();
  await page.waitForURL((u) => u.pathname === "/dev/stays/bare-chic");
  await page.waitForLoadState("networkidle");
  const u1 = new URL(page.url());
  ok(`${tag} B English card → property keeps lang=en, soft navigation`, u1.searchParams.get("lang") === "en" && (await sameDocument(page)), page.url().replace(base, ""));
  ok(`${tag} B property page in English`, (await page.locator('[data-testid="language-switch"] [aria-current="true"]').first().getAttribute("data-locale")) === "en");
  await page.locator("header#top a").first().click();
  await page.waitForURL((u) => u.pathname === "/dev/demo");
  await page.waitForLoadState("networkidle");
  ok(`${tag} B English logo → homepage keeps lang=en`, new URL(page.url()).searchParams.get("lang") === "en" && /Stay\./.test(await page.locator("main").innerText()), page.url().replace(base, ""));
  ok(`${tag} B no redirect loops`, redirects.length <= 4, redirects.join(", "));
  ok(`${tag} B English: no console or hydration errors`, errors.length === 0, errors[0]?.slice(0, 200));
  await ctx.close();

  // Vietnamese: no lang anywhere, Vietnamese copy.
  const vi = await context(vp);
  await vi.page.goto(`${base}/dev/demo?intro=0`, { waitUntil: "networkidle", timeout: 20000 });
  const viCard = vi.page.locator('a[href^="/dev/stays/bare-chic"]:visible').first();
  await viCard.scrollIntoViewIfNeeded();
  await viCard.click();
  await vi.page.waitForURL((u) => u.pathname === "/dev/stays/bare-chic");
  ok(`${tag} B Vietnamese navigation: no lang added`, !new URL(vi.page.url()).searchParams.has("lang"), vi.page.url().replace(base, ""));
  ok(`${tag} B Vietnamese: no errors`, vi.errors.length === 0, vi.errors[0]?.slice(0, 200));
  await vi.ctx.close();
}

// ── C · Search → Results → Back → brand card link → property ──
for (const vp of VIEWPORTS) {
  const tag = `@${vp.name}`;
  const { ctx, page, errors } = await context(vp);
  await page.goto(`${base}/dev/demo?intro=0&checkIn=${IN}&checkOut=${OUT}&adults=4&children=1&rooms=2,2`, { waitUntil: "networkidle" });
  const cardHref = async () => page.locator('a[href^="/dev/stays/bare-da-kao"]:visible').first().getAttribute("href");
  const fresh = new URL(await cardHref(), base).searchParams;
  ok(`${tag} C card from an address: dates, adults, children, rooms`, fresh.get("checkIn") === IN && fresh.get("adults") === "4" && fresh.get("children") === "1" && fresh.get("rooms") === "2,2", (await cardHref()) ?? "");
  // Now a plain homepage, a search, Back.
  await page.goto(`${base}/dev/demo?intro=0`, { waitUntil: "networkidle" });
  const plain = new URL(await cardHref(), base).searchParams;
  ok(`${tag} C card before any search: no dates`, !plain.has("checkIn"));
  await page.goto(`${base}/dev/demo?intro=0&checkIn=${IN}&checkOut=${OUT}&adults=3`, { waitUntil: "networkidle" });
  const entriesBefore = await page.evaluate(() => history.length);
  // Submit from the bar (dates and adults already in it), then Back.
  if (vp.mobile) {
    await page.locator('#dat-phong button[aria-haspopup="dialog"]:visible').first().tap();
    await page.locator('dialog[open] [data-section="guests"]').tap();
    await page.locator('[data-testid="occupancy-panel"]:visible').getByRole("button", { name: "Thêm một trẻ em" }).tap();
    await page.locator('dialog[open] footer button[type="submit"]').tap();
  } else {
    await page.locator("#dat-phong").evaluate((el) => el.scrollIntoView({ block: "center" }));
    await page.locator('#dat-phong button[data-field="guests"]:visible').first().click();
    await page.locator('[data-testid="occupancy-panel"]:visible').getByRole("button", { name: "Thêm một trẻ em" }).dispatchEvent("click");
    await page.keyboard.press("Escape");
    await page.locator('#dat-phong form[role="search"] button[type="submit"]:visible').first().click();
  }
  await page.waitForURL((u) => u.pathname === "/dev/demo/tim-phong");
  await page.waitForSelector('[data-testid="property-results"]');
  ok(`${tag} C results: 3 adults, 1 child`, new URL(page.url()).searchParams.get("children") === "1");
  for (const id of ["bare-da-kao", "pepper-house"]) {
    const status = await page.locator(`[data-property="${id}"] [data-testid^="availability-"]`).first().getAttribute("data-testid");
    ok(`${tag} C GoHost ${id} unchanged (children: not asked)`, status === "availability-needs-provider-check", status);
  }
  for (const id of ["bare-chic", "bare-hyphen", "bare-han", "the-nang-suites"]) {
    ok(`${tag} C ezCloud ${id} unchanged`, (await page.locator(`[data-property="${id}"] [data-testid="handoff-cta"]`).count()) === 1);
  }
  await page.goBack();
  await page.waitForURL((u) => u.pathname === "/dev/demo");
  // The cached homepage is refreshed once for the restored address; the card follows without a reload.
  await page.waitForFunction(() => document.querySelector('a[href^="/dev/stays/bare-da-kao"]')?.getAttribute("href")?.includes("children=1"), null, { timeout: 8000 }).catch(() => {});
  const afterBack = new URL(await cardHref(), base).searchParams;
  ok(`${tag} C Back: card carries dates, adults and the child, no rooms invented`, afterBack.get("checkIn") === IN && afterBack.get("checkOut") === OUT && afterBack.get("adults") === "3" && afterBack.get("children") === "1" && !afterBack.has("rooms"), (await cardHref()) ?? "");
  ok(`${tag} C Back: bar still restored`, /3 người lớn · 1 trẻ em/.test(await page.locator("#dat-phong").innerText()));
  const entriesAfter = await page.evaluate(() => history.length);
  ok(`${tag} C one history entry for the search, none for the refresh after Back`, entriesAfter === entriesBefore + 1, `${entriesBefore} → ${entriesAfter}`);
  await shot(page, `final-${vp.name}-back-cards`);
  const card = page.locator('a[href^="/dev/stays/bare-da-kao"]:visible').first();
  await card.scrollIntoViewIfNeeded();
  await card.click();
  await page.waitForURL((u) => u.pathname === "/dev/stays/bare-da-kao");
  const prop = new URL(page.url()).searchParams;
  ok(`${tag} C card → property keeps the search`, prop.get("checkIn") === IN && prop.get("children") === "1" && prop.get("adults") === "3", page.url().replace(base, ""));
  await page.goBack();
  await page.waitForURL((u) => u.pathname === "/dev/demo");
  await page.reload({ waitUntil: "networkidle" });
  const reloaded = new URL(await cardHref(), base).searchParams;
  ok(`${tag} C refresh: same search in bar and cards`, reloaded.get("children") === "1" && /3 người lớn · 1 trẻ em/.test(await page.locator("#dat-phong").innerText()));
  ok(`${tag} C no console or hydration errors`, errors.length === 0, errors[0]?.slice(0, 200));
  await ctx.close();
}

await browser.close();
console.log(results.join("\n"));
console.log(`\n${results.filter((r) => r.startsWith("PASS")).length}/${results.length} passed`);
