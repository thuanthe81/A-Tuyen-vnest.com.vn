// Usage: node docs/qa/client-review-2026-11-06/scripts/qa-a.mjs http://localhost:3401
import { chromium } from "/Users/noe/Documents/GitHub/Cigarettes-After-Sex/node_modules/.pnpm/playwright@1.62.1/node_modules/playwright/index.mjs";
const base = process.argv[2];
const W = [375, 390, 430, 768, 1024, 1440];
const browser = await chromium.launch();
const results = [];
const ok = (name, cond, info = "") => results.push(`${cond ? "PASS" : "FAIL"} ${name}${info ? " — " + info : ""}`);
for (const width of W) {
  const mobile = width < 1024;
  const ctx = await browser.newContext({ viewport: { width, height: mobile ? 844 : 900 }, isMobile: mobile, hasTouch: mobile });
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => m.type() === "error" && !m.text().startsWith("Failed to load resource") && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(`${base}/dev/demo?intro=0`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  const hero = await page.evaluate(() => {
    const s = document.querySelector('section[aria-roledescription="carousel"]');
    return { dots: s.querySelectorAll("ol").length, buttons: [...s.querySelectorAll("button")].filter((b) => !b.closest("[data-booking-slot]")).map((b) => b.getAttribute("aria-label")), caption: /TP\.HCM|Quận|Đà Nẵng ·/.test(s.querySelector("[class*=heroRow]").innerText) };
  });
  ok(`@${width} hero: no dots/arrows/caption, one pause control`, hero.dots === 0 && hero.buttons.length === 1 && !hero.caption, JSON.stringify(hero));
  const cur = () => page.evaluate(() => [...document.querySelectorAll('[aria-roledescription="slide"]')].findIndex((s) => s.getAttribute("data-active") === "true"));
  // Move the mouse away so desktop hover-pause does not apply.
  const a = await cur();
  await page.waitForFunction((a) => [...document.querySelectorAll('[aria-roledescription="slide"]')].findIndex((s) => s.getAttribute("data-active") === "true") !== a, a, { timeout: 8000 }).catch(() => {});
  const b = await cur();
  ok(`@${width} hero autoplay advances`, b !== a, `from ${a} to ${b}`);
  // Second interval: measure from a fresh change.
  const t1 = Date.now();
  await page.waitForFunction((b) => [...document.querySelectorAll('[aria-roledescription="slide"]')].findIndex((s) => s.getAttribute("data-active") === "true") !== b, b, { timeout: 8000 }).catch(() => {});
  const dwell2 = Date.now() - t1;
  ok(`@${width} hero dwell ≈ 3 s`, dwell2 > 2700 && dwell2 < 3800, `${dwell2} ms`);
  // Pause.
  await page.locator('section[aria-roledescription="carousel"] [class*=carouselButton]').click();
  const p0 = await cur();
  await page.mouse.move(5, 5);
  await page.waitForTimeout(4200);
  ok(`@${width} pause stops rotation`, (await cur()) === p0);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  ok(`@${width} no horizontal overflow`, overflow <= 0, `${overflow}px`);
  const order = await page.evaluate(() => [...document.querySelectorAll("main section[id]")].map((s) => s.id).filter((id) => ["hop-tac", "hoi-dap", "lien-he"].includes(id)));
  ok(`@${width} order services → FAQ → contact`, order.join() === "hop-tac,hoi-dap,lien-he", order.join(" > "));
  const contact = await page.evaluate(() => {
    const c = document.getElementById("lien-he");
    const info = c.querySelector("[class*=contactInfo]").getBoundingClientRect();
    const form = c.querySelector("form").getBoundingClientRect();
    return {
      infoFirst: info.top < form.top || info.left < form.left,
      h2: c.querySelectorAll("h2").length,
      draft: /DRAFT|Bản mô phỏng|chờ VNest|Đoạn 20/.test(document.body.innerText),
      bgSame: getComputedStyle(c).backgroundColor === getComputedStyle(document.querySelector("main")).backgroundColor,
      faqLine: getComputedStyle(document.querySelector("footer")).borderTopColor,
      tel: !!c.querySelector('a[href="tel:+84906988261"]'),
    };
  });
  ok(`@${width} contact: details before form, one h2, same background, no DRAFT labels`, contact.infoFirst && contact.h2 === 1 && !contact.draft && contact.bgSame && contact.tel, JSON.stringify(contact));
  // Menu.
  await page.evaluate(() => scrollTo(0, 0));
  await page.locator('header nav button[aria-haspopup="dialog"]').click();
  await page.waitForTimeout(300);
  const menu = await page.locator("header dialog[open] nav[aria-label=Menu] a").allInnerTexts();
  ok(`@${width} menu order, no numbers`, menu.join("|") === "Khám phá|Hợp tác|Hỏi đáp|Liên hệ", menu.join("|"));
  const menuFits = await page.evaluate(() => { const d = document.querySelector("dialog[open]"); return d.scrollHeight <= d.clientHeight + 1 && document.documentElement.scrollWidth <= document.documentElement.clientWidth; });
  ok(`@${width} menu fits without scrolling/overflow`, menuFits || width >= 768);
  await page.locator("header dialog[open] a", { hasText: "Liên hệ" }).first().click();
  await page.waitForTimeout(1200);
  const top = await page.evaluate(() => Math.round(document.getElementById("lien-he").getBoundingClientRect().top));
  ok(`@${width} menu 'Liên hệ' reaches #lien-he, menu closed`, top >= 0 && top < 160 && (await page.locator("dialog[open]").count()) === 0, `top=${top}`);
  // About CTA.
  const cta = page.locator("#ve-vnest a");
  ok(`@${width} About CTA`, (await cta.innerText()).startsWith("Liên hệ VNest") && (await cta.getAttribute("href")) === "/dev/demo#lien-he");
  await cta.scrollIntoViewIfNeeded();
  await cta.click();
  await page.waitForTimeout(1200);
  const top2 = await page.evaluate(() => Math.round(document.getElementById("lien-he").getBoundingClientRect().top));
  ok(`@${width} About CTA scrolls to contact`, top2 >= 0 && top2 < 160, `top=${top2}`);
  // Service CTA → form, then honest non-submission.
  await page.locator("#hop-tac [role=region] button").click();
  await page.waitForTimeout(1200);
  const formTop = await page.evaluate(() => Math.round(document.querySelector("#lien-he form").getBoundingClientRect().top));
  ok(`@${width} service CTA lands on the form`, formTop >= 0 && formTop < 200 && /dich-vu=van-hanh#lien-he$/.test(page.url()), `top=${formTop}`);
  await page.locator('#lien-he button[type="submit"]').click();
  const s1 = await page.locator('#lien-he [role="status"]').innerText();
  await page.locator('#lien-he input[name="name"]').fill("Nguyễn Văn A");
  await page.locator('#lien-he input[name="reach"]').fill("0901 234 567");
  await page.locator('#lien-he button[type="submit"]').click();
  const s2 = await page.locator('#lien-he [role="status"]').innerText();
  ok(`@${width} form never claims success`, /kiểm tra/.test(s1) && /^Chưa gửi/.test(s2) && !/thành công|đã gửi/i.test(s2));
  ok(`@${width} no console/hydration errors`, errors.length === 0, errors.join(" | ").slice(0, 300));
  await ctx.close();
}
// Reduced motion starts paused.
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await page.goto(`${base}/dev/demo?intro=0`, { waitUntil: "networkidle" });
  const label = await page.locator('section[aria-roledescription="carousel"] [class*=carouselButton]').getAttribute("aria-label");
  await page.waitForTimeout(4000);
  const idx = await page.evaluate(() => [...document.querySelectorAll('[aria-roledescription="slide"]')].findIndex((s) => s.getAttribute("data-active") === "true"));
  const transition = await page.evaluate(() => getComputedStyle(document.querySelector('[aria-roledescription="slide"]')).transitionDuration);
  ok("reduced motion: starts paused, no fade", idx === 0 && /Tiếp tục/.test(label) && transition === "0s", `${label}, ${transition}`);
  await ctx.close();
}
// English.
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(`${base}/dev/demo?intro=0&lang=en`, { waitUntil: "networkidle" });
  await page.locator('header nav button[aria-haspopup="dialog"]').click();
  const menu = await page.locator("header dialog[open] nav[aria-label=Menu] a").allInnerTexts();
  await page.keyboard.press("Escape");
  const about = await page.locator("#ve-vnest a").innerText();
  const contact = await page.locator("#lien-he").innerText();
  ok("EN: menu, About CTA, contact form", menu.join("|") === "Explore|Partner|FAQ|Contact" && about.startsWith("Contact VNest") && /Request a consultation/.test(contact) && /Start a conversation/.test(contact), `${menu.join("|")} / ${about}`);
  ok("EN: no page errors", errors.length === 0, errors.join(" | "));
  await ctx.close();
}
// Property page keeps the full footer.
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`${base}/dev/stays/pepper-house`, { waitUntil: "networkidle" });
  const f = await page.evaluate(() => { const f = document.querySelector("footer[data-variant]"); return { v: f?.dataset.variant, tel: !!f?.querySelector('a[href="tel:+84906988261"]'), cta: f?.querySelector('a[href="/dev/demo#lien-he"]')?.innerText }; });
  ok("property page keeps the full footer with contact + CTA", f.v === "full" && f.tel && /Gửi yêu cầu tư vấn/.test(f.cta ?? ""), JSON.stringify(f));
  await ctx.close();
}
await browser.close();
console.log(results.join("\n"));
console.log(`\n${results.filter((r) => r.startsWith("PASS")).length}/${results.length} passed`);
