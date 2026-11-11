// Phase A corrections (owner, 7/11/2026): full menu labels, Dark Olive contact + form below, hero with no visible controls.
// Usage: node docs/qa/client-review-2026-11-06/scripts/qa-a2.mjs http://localhost:3401
import { chromium } from "/Users/noe/Documents/GitHub/Cigarettes-After-Sex/node_modules/.pnpm/playwright@1.62.1/node_modules/playwright/index.mjs";
const base = process.argv[2];
const W = [375, 390, 430, 768, 1024, 1440];
const browser = await chromium.launch();
const results = [];
const ok = (name, cond, info = "") => results.push(`${cond ? "PASS" : "FAIL"} ${name}${info ? " — " + info : ""}`);
const HERO = 'section[aria-roledescription="carousel"]';
const active = (page) => page.evaluate(() => [...document.querySelectorAll('[aria-roledescription="slide"]')].findIndex((s) => s.getAttribute("data-active") === "true"));
const nextChange = async (page, from, timeout = 6000) => {
  const t = Date.now();
  await page.waitForFunction((a) => [...document.querySelectorAll('[aria-roledescription="slide"]')].findIndex((s) => s.getAttribute("data-active") === "true") !== a, from, { timeout, polling: 20 }).catch(() => {});
  return Date.now() - t;
};
const VI_MENU = "Khám phá nơi ở|Hợp tác cùng VNest|QA|Liên hệ";
const EN_MENU = "Explore stays|Partner with VNest|Q&A|Contact";

for (const width of W) {
  const mobile = width < 1024;
  const ctx = await browser.newContext({ viewport: { width, height: mobile ? 844 : 900 }, isMobile: mobile, hasTouch: mobile });
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => m.type() === "error" && !m.text().startsWith("Failed to load resource") && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(`${base}/dev/demo?intro=0`, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);

  // ── Hero: nothing visible to operate; timing; mouse over the hero does not stop it.
  const hero = await page.evaluate((sel) => {
    const s = document.querySelector(sel);
    const own = [...s.querySelectorAll("button, a, ol")].filter((b) => !b.closest("[data-booking-slot]"));
    const visible = own.filter((el) => { const r = el.getBoundingClientRect(); return r.width > 2 && r.height > 2; });
    const pause = s.querySelector("[class*=heroPause]");
    return {
      visibleControls: visible.length,
      pauseName: pause?.innerText || pause?.textContent,
      caption: /TP\.HCM|Quận|Đà Nẵng ·/.test(s.querySelector("[class*=heroRow]").innerText),
      fade: getComputedStyle(s.querySelector('[aria-roledescription="slide"]')).transitionDuration,
    };
  }, HERO);
  ok(`@${width} hero: no visible controls, dots, arrows or captions`, hero.visibleControls === 0 && !hero.caption, JSON.stringify(hero));
  ok(`@${width} hero: pause button exists for keyboard/screen readers`, /Tạm dừng/.test(hero.pauseName ?? ""), hero.pauseName);
  ok(`@${width} hero: 600 ms cross-fade`, hero.fade === "0.6s", hero.fade);
  if (!mobile) await page.mouse.move(width / 2, 300); // over the hero: must not pause any more
  const a = await active(page);
  await nextChange(page, a);
  const b = await active(page);
  const cycle = await nextChange(page, b);
  const c = await active(page);
  ok(`@${width} hero: changes automatically every ≈2.6 s (600 ms fade + ≈2 s fully visible)`, b !== a && c !== b && cycle > 2400 && cycle < 2950, `${a}→${b}→${c}, cycle ${cycle} ms`);

  // Keyboard: Tab from the top reaches the hidden pause button, which then appears without moving the layout.
  await page.evaluate(() => { scrollTo(0, 0); document.activeElement?.blur(); });
  const textTop = await page.evaluate(() => Math.round(document.querySelector("[class*=heroText]").getBoundingClientRect().top));
  let reached = false;
  for (let i = 0; i < 25 && !reached; i++) {
    await page.keyboard.press("Tab");
    reached = await page.evaluate(() => document.activeElement?.className.includes("heroPause"));
  }
  const shown = await page.evaluate(() => { const r = document.activeElement.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height), textTop: Math.round(document.querySelector("[class*=heroText]").getBoundingClientRect().top), inView: r.top >= 0 }; });
  ok(`@${width} keyboard: Tab reaches pause; it appears on focus, no layout shift`, reached && shown.w > 60 && shown.h >= 44 && shown.textTop === textTop && shown.inView, JSON.stringify(shown));
  await page.keyboard.press("Enter");
  const label = await page.evaluate(() => document.activeElement.innerText);
  await page.keyboard.press("Tab"); // leave the hero control: the guest's pause must hold
  const p0 = await active(page);
  await page.waitForTimeout(3200);
  ok(`@${width} keyboard pause holds after focus leaves`, /Tiếp tục/.test(label) && (await active(page)) === p0, label);

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  ok(`@${width} no horizontal overflow`, overflow <= 0, `${overflow}px`);

  // ── Contact: FAQ → Dark Olive panel → form (Beige) → minimal footer; one heading; no duplicated details.
  const order = await page.evaluate(() => [...document.querySelectorAll("main section[id]")].map((s) => s.id).filter((id) => ["hop-tac", "hoi-dap", "lien-he"].includes(id)));
  ok(`@${width} order services → FAQ → contact`, order.join() === "hop-tac,hoi-dap,lien-he", order.join(" > "));
  const contact = await page.evaluate(() => {
    const c = document.getElementById("lien-he");
    const panel = c.querySelector("[class*=contactPanel]");
    const form = c.querySelector("form");
    const h2 = c.querySelector("h2");
    const cta = panel.querySelector('a[href$="#tu-van"]');
    const pr = panel.getBoundingClientRect();
    const fr = form.getBoundingClientRect();
    const main = document.querySelector("main");
    const footer = document.querySelector("footer");
    const count = (sel) => main.querySelectorAll(sel).length + footer.querySelectorAll(sel).length;
    return {
      panelBg: getComputedStyle(panel).backgroundColor,
      h2Color: getComputedStyle(h2).color,
      h2Size: parseFloat(getComputedStyle(h2).fontSize),
      h2Text: h2.innerText.replace(/\s+/g, " "),
      headings: c.querySelectorAll("h2").length,
      bigHeadings: [...c.querySelectorAll("h2, h3")].filter((h) => parseFloat(getComputedStyle(h).fontSize) >= 28).length,
      ctaText: cta?.innerText,
      ctaBg: cta && getComputedStyle(cta).backgroundColor,
      formBelow: fr.top >= pr.bottom - 1 && Math.abs(fr.left - pr.left) < 1 && Math.abs(fr.width - pr.width) < 1,
      formBg: getComputedStyle(form).backgroundColor,
      tel: count('a[href="tel:+84906988261"]'),
      mail: count('a[href="mailto:hello@vnest.com.vn"]'),
      address: count("address"),
      facebook: count('a[href="https://www.facebook.com/vnest.com.vn"]'),
      draft: /DRAFT|Bản mô phỏng|chờ VNest|Đoạn 20/.test(document.body.innerText),
      footer: footer.dataset.variant,
      faqGap: Math.round(pr.top - document.getElementById("hoi-dap").getBoundingClientRect().bottom),
    };
  });
  ok(`@${width} contact panel: Dark Olive, cream heading, copper CTA → #tu-van`, contact.panelBg === "rgb(55, 65, 47)" && contact.h2Color === "rgb(241, 236, 228)" && contact.ctaBg === "rgb(154, 104, 60)" && /^Gửi yêu cầu tư vấn/.test(contact.ctaText ?? ""), JSON.stringify({ bg: contact.panelBg, h2: contact.h2Color, cta: contact.ctaBg, text: contact.ctaText }));
  ok(`@${width} one large contact heading`, contact.headings === 1 && contact.bigHeadings === 1 && contact.h2Text === "Bắt đầu một cuộc trò chuyện." && contact.h2Size >= 36, `${contact.h2Size}px`);
  ok(`@${width} form directly below the panel, on Beige`, contact.formBelow && contact.formBg === "rgb(248, 244, 238)", contact.formBg);
  ok(`@${width} hotline, email, address, Facebook once each; minimal footer; no DRAFT`, contact.tel === 1 && contact.mail === 1 && contact.address === 1 && contact.facebook === 1 && contact.footer === "minimal" && !contact.draft, JSON.stringify(contact));

  // Contact CTA → form (real anchor), focus moves to the form heading.
  const ctaLink = page.locator('#lien-he a[href="/dev/demo#tu-van"]');
  await ctaLink.scrollIntoViewIfNeeded();
  await ctaLink.click();
  await page.waitForTimeout(1200);
  const formAt = await page.evaluate(() => ({ top: Math.round(document.getElementById("tu-van").getBoundingClientRect().top), focus: document.activeElement?.tagName + ":" + document.activeElement?.textContent }));
  ok(`@${width} contact CTA scrolls to the form, focus on its heading`, formAt.top >= 0 && formAt.top < 140 && /^H3:Yêu cầu tư vấn/.test(formAt.focus), JSON.stringify(formAt));
  await page.locator('#tu-van button[type="submit"]').click();
  const s1 = await page.locator('#tu-van [role="status"]').innerText();
  await page.locator('#tu-van input[name="name"]').fill("Nguyễn Văn A");
  await page.locator('#tu-van input[name="reach"]').fill("0901 234 567");
  await page.locator('#tu-van button[type="submit"]').click();
  const s2 = await page.locator('#tu-van [role="status"]').innerText();
  const kept = await page.locator('#tu-van input[name="name"]').inputValue();
  ok(`@${width} form honestly non-operational, keeps what was typed`, /kiểm tra/.test(s1) && /^Chưa gửi/.test(s2) && !/thành công|đã gửi/i.test(s2) && kept === "Nguyễn Văn A");

  // ── Menu: full labels, every anchor, closes after a choice, fits a phone screen.
  for (const [text, id] of [["Khám phá nơi ở", "kham-pha"], ["Hợp tác cùng VNest", "hop-tac"], ["QA", "hoi-dap"], ["Liên hệ", "lien-he"]]) {
    await page.evaluate(() => scrollTo(0, 0));
    await page.locator('header nav button[aria-haspopup="dialog"]').click();
    await page.waitForTimeout(250);
    if (id === "kham-pha") {
      const m = await page.evaluate(() => {
        const d = document.querySelector("dialog[open]");
        const links = [...d.querySelectorAll("nav[aria-label=Menu] a")];
        return { labels: links.map((a) => a.innerText).join("|"), numbers: links.some((a) => /\d/.test(a.innerText)), fits: d.scrollHeight <= d.clientHeight + 1, clip: links.some((a) => a.scrollWidth > a.clientWidth + 1 || a.getBoundingClientRect().right > innerWidth), size: parseFloat(getComputedStyle(links[0]).fontSize), ve: links.some((a) => /Về VNest/.test(a.innerText)) };
      });
      ok(`@${width} menu: exact labels, no numbers, no "Về VNest", fits, no clipping`, m.labels === VI_MENU && !m.numbers && !m.ve && (m.fits || width >= 768) && !m.clip, JSON.stringify(m));
    }
    await page.locator("header dialog[open] nav[aria-label=Menu] a", { hasText: text }).first().click();
    await page.waitForTimeout(1300);
    const top = await page.evaluate((id) => Math.round(document.getElementById(id).getBoundingClientRect().top), id);
    ok(`@${width} menu '${text}' → #${id}, menu closed`, top >= -2 && top < 160 && (await page.locator("dialog[open]").count()) === 0, `top=${top}`);
  }
  // Escape closes the menu and returns focus to the menu button.
  await page.locator('header nav button[aria-haspopup="dialog"]').click();
  await page.waitForTimeout(250);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(250);
  ok(`@${width} menu: Escape closes, focus back on the button`, (await page.locator("dialog[open]").count()) === 0 && (await page.evaluate(() => document.activeElement?.getAttribute("aria-haspopup"))) === "dialog");
  // Footer still reaches About.
  ok(`@${width} footer keeps "Về VNest"`, (await page.locator('footer a[href$="#ve-vnest"]').count()) === 1);
  ok(`@${width} no console/hydration errors`, errors.length === 0, errors.join(" | ").slice(0, 300));
  await ctx.close();
}

// Reduced motion: a static hero (first photograph, no fade, no rotation); the keyboard control offers "play".
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await page.goto(`${base}/dev/demo?intro=0`, { waitUntil: "networkidle" });
  const label = await page.locator(`${HERO} [class*=heroPause]`).innerText();
  await page.waitForTimeout(5500);
  const idx = await active(page);
  const transition = await page.evaluate(() => getComputedStyle(document.querySelector('[aria-roledescription="slide"]')).transitionDuration);
  ok("reduced motion: static hero, no fade; control offers play", idx === 0 && /Tiếp tục/.test(label) && transition === "0s", `${label}, ${transition}`);
  await ctx.close();
}
// Hidden tab: rotation stops.
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`${base}/dev/demo?intro=0`, { waitUntil: "networkidle" });
  await page.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, get: () => true }); document.dispatchEvent(new Event("visibilitychange")); });
  const h0 = await active(page);
  await page.waitForTimeout(3500);
  const h1 = await active(page);
  await page.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, get: () => false }); document.dispatchEvent(new Event("visibilitychange")); });
  const resumed = (await nextChange(page, h1, 4000)) < 4000;
  ok("hidden tab pauses the hero; it resumes when visible", h0 === h1 && resumed, `${h0}/${h1}, resumed ${resumed}`);
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
  const contact = await page.locator("#lien-he").innerText();
  const pause = await page.locator(`${HERO} [class*=heroPause]`).textContent();
  ok("EN: menu labels, contact panel, form, pause label", menu.join("|") === EN_MENU && /Start a conversation/.test(contact) && /Request a consultation/.test(contact) && /Pause the slideshow/.test(pause), `${menu.join("|")}`);
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
