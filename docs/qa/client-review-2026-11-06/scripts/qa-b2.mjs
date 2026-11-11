// Phase B final polish (owner, 7/11/2026): no discovery status text, no permanent underlines on "Xem tất cả nơi ở →" or
// the property names, links still work, hover/focus feedback, preview card inside the stage, no layout shift.
// The full brand interaction is re-checked by qa-b.mjs.
// Usage: node docs/qa/client-review-2026-11-06/scripts/qa-b2.mjs http://localhost:3401
import { chromium } from "/Users/noe/Documents/GitHub/Cigarettes-After-Sex/node_modules/.pnpm/playwright@1.62.1/node_modules/playwright/index.mjs";
const base = process.argv[2];
const W = [1440, 1024, 768, 390, 375];
const browser = await chromium.launch();
const results = [];
const ok = (name, cond, info = "") => results.push(`${cond ? "PASS" : "FAIL"} ${name}${info ? " — " + info : ""}`);
const row = (id) => `#thuong-hieu button[aria-controls][data-brand="${id}"]`;

async function open(width, lang, path = "/dev/demo?intro=0") {
  const mobile = width < 1024;
  const ctx = await browser.newContext({ viewport: { width, height: mobile ? 844 : 900 }, isMobile: mobile, hasTouch: mobile });
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => m.type() === "error" && !m.text().startsWith("Failed to load resource") && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.addInitScript(() => {
    window.__shift = 0;
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) if (!e.hadRecentInput) window.__shift += e.value;
    }).observe({ type: "layout-shift", buffered: true });
  });
  await page.goto(`${base}${path}${lang === "en" ? "&lang=en" : ""}`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  return { ctx, page, errors, mobile };
}

for (const width of W) {
  for (const lang of ["vi", "en"]) {
    const tag = `@${width} ${lang}`;
    const { ctx, page, errors, mobile } = await open(width, lang);

    // 1. Discovery status: no idle sentence; the live region is still there for filter results.
    const status = await page.evaluate(() => {
      const live = document.getElementById("kham-pha-result");
      return { exists: !!live, live: live?.getAttribute("aria-live"), text: live?.textContent.trim(), page: /Đang hiển thị tất cả nơi ở|Showing all stays/.test(document.body.innerText) };
    });
    ok(`${tag} no "Đang hiển thị tất cả nơi ở" (or English) status`, status.exists && status.live === "polite" && status.text === "" && !status.page, JSON.stringify(status));

    // 2. "Xem tất cả nơi ở →": no underline on the text or the arrow, same words, same destination.
    await page.locator("#thuong-hieu").evaluate((el) => el.scrollIntoView({ block: "start" }));
    await page.waitForTimeout(250);
    const link = page.locator("#thuong-hieu header a");
    const l = await link.evaluate((a) => ({ text: a.textContent.trim(), href: a.getAttribute("href"), self: getComputedStyle(a).textDecorationLine, kids: [...a.querySelectorAll("*")].map((k) => getComputedStyle(k).textDecorationLine), color: getComputedStyle(a).color }));
    ok(`${tag} "${l.text}": no underline, arrow kept, #kham-pha`, l.self === "none" && l.kids.every((d) => d === "none") && /→$/.test(l.text) && l.href === "#kham-pha" && /^(Xem tất cả nơi ở|See all stays) →$/.test(l.text), l.text);
    if (!mobile) {
      await link.hover();
      await page.waitForTimeout(300);
      const h = await link.evaluate((a) => ({ color: getComputedStyle(a).color, line: getComputedStyle(a).textDecorationLine }));
      ok(`${tag} CTA hover: copper, still no underline`, h.color === "rgb(143, 96, 54)" && h.color !== l.color && h.line === "none", h.color);
    }
    await link.focus();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    const f = await page.evaluate(() => ({ cls: document.activeElement?.className, outline: getComputedStyle(document.activeElement).outlineStyle + " " + getComputedStyle(document.activeElement).outlineWidth }));
    ok(`${tag} CTA keyboard focus keeps a visible outline`, /allLink/.test(f.cls) && f.outline === "solid 2px", f.outline);
    if (mobile) await link.tap();
    else await link.click();
    await page.waitForTimeout(900);
    const top = await page.evaluate(() => document.getElementById("kham-pha").getBoundingClientRect().top);
    ok(`${tag} CTA still scrolls to the stays`, top >= -2 && top < 160, `top=${top.toFixed(0)}`);

    // 3. Property names in each brand panel: no underline, real links, hover copper, focus outline.
    await page.locator("#thuong-hieu").evaluate((el) => el.scrollIntoView({ block: "start" }));
    for (const id of ["bare", "pepper-house", "the-nang"]) {
      if (mobile) await page.locator(row(id)).tap();
      else await page.locator(row(id)).click();
      await page.waitForTimeout(450);
      const links = page.locator(`#thuong-hieu article[data-brand="${id}"] a[href^="/dev/stays/"]`);
      const info = await links.evaluateAll((as) => as.map((a) => ({ name: a.textContent.trim(), href: a.getAttribute("href"), line: getComputedStyle(a).textDecorationLine, color: getComputedStyle(a).color })));
      ok(`${tag} ${id}: property names are links without underline`, info.length > 0 && info.every((a) => a.line === "none" && a.href.startsWith("/dev/stays/")), info.map((a) => a.name).join(", "));
      if (!mobile) {
        await links.first().hover();
        await page.waitForTimeout(300);
        const hc = await links.first().evaluate((a) => ({ color: getComputedStyle(a).color, line: getComputedStyle(a).textDecorationLine }));
        ok(`${tag} ${id}: property hover turns copper, no underline`, hc.color === "rgb(143, 96, 54)" && hc.line === "none", hc.color);
        await page.mouse.move(5, 5);
      }
    }
    await page.locator(row("the-nang")).focus();
    await page.keyboard.press("Tab");
    const pf = await page.evaluate(() => ({ href: document.activeElement?.getAttribute("href"), outline: getComputedStyle(document.activeElement).outlineStyle + " " + getComputedStyle(document.activeElement).outlineWidth }));
    ok(`${tag} property link keyboard focus keeps a visible outline`, pf.href?.startsWith("/dev/stays/") && pf.outline === "solid 2px", JSON.stringify(pf));

    // 4. Preview (desktop): inside the stage, never over the rows or the heading, pointer-transparent; soft shadow.
    if (!mobile) {
      await page.locator(row("pepper-house")).hover();
      await page.waitForTimeout(500);
      const p = await page.evaluate(() => {
        const r = (el) => el.getBoundingClientRect();
        const pv = document.querySelector("#thuong-hieu [data-preview][data-shown]");
        const stage = pv.parentElement;
        const card = pv.querySelector("[class*=previewCard]");
        const nav = document.querySelector("#thuong-hieu [role=group]");
        const head = document.querySelector("#thuong-hieu header");
        const inside = (a, b) => a.left >= b.left - 1 && a.right <= b.right + 1 && a.top >= b.top - 1 && a.bottom <= b.bottom + 1;
        const apart = (a, b) => a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom;
        return { inStage: inside(r(pv), r(stage)) && inside(r(card), r(pv)), clearOfNav: apart(r(pv), r(nav)) && apart(r(pv), r(head)), events: getComputedStyle(pv).pointerEvents, shadow: getComputedStyle(card).boxShadow };
      });
      ok(`${tag} preview stays inside the stage, clear of the rows and heading, pointer-transparent`, p.inStage && p.clearOfNav && p.events === "none");
      ok(`${tag} preview card has its soft shadow`, p.shadow !== "none" && p.shadow.includes("rgba(24, 20, 14"), p.shadow.slice(0, 60));
      await page.mouse.move(5, 5);
    }

    const shift = await page.evaluate(() => window.__shift);
    ok(`${tag} no unexpected layout shift (CLS without input)`, shift < 0.02, shift.toFixed(4));
    ok(`${tag} no horizontal overflow`, (await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 0);
    ok(`${tag} no console/hydration errors`, errors.length === 0, errors.join(" | ").slice(0, 300));
    await ctx.close();
  }
}

// A property name still opens its page.
for (const width of [1440, 390]) {
  const { ctx, page, mobile } = await open(width, "vi");
  await page.locator("#thuong-hieu").evaluate((el) => el.scrollIntoView({ block: "start" }));
  if (mobile) await page.locator(row("bare")).tap();
  else await page.locator(row("bare")).click();
  await page.waitForTimeout(450);
  const target = page.locator('#thuong-hieu article[data-brand="bare"] a[href^="/dev/stays/bare-hyphen"]');
  if (mobile) await target.tap();
  else await target.click();
  await page.waitForURL(/\/dev\/stays\/bare-hyphen/, { timeout: 15000 }).catch(() => {});
  ok(`@${width} property link "Bare Hyphen" opens its page`, new URL(page.url()).pathname === "/dev/stays/bare-hyphen", page.url());
  await ctx.close();
}

await browser.close();
console.log(results.join("\n"));
console.log(`\n${results.filter((r) => r.startsWith("PASS")).length}/${results.length} passed`);
