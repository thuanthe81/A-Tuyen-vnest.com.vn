// Phase A, final contact refinement (owner, 7/11/2026): Contact restored as identity + standalone Dark Olive card;
// the consultation form is its own section (#tu-van) after it. FAQ → Contact → Form → minimal footer.
// Usage: node docs/qa/client-review-2026-11-06/scripts/qa-a3.mjs http://localhost:3401
import { chromium } from "/Users/noe/Documents/GitHub/Cigarettes-After-Sex/node_modules/.pnpm/playwright@1.62.1/node_modules/playwright/index.mjs";
const base = process.argv[2];
const W = [375, 390, 430, 768, 1024, 1440];
const browser = await chromium.launch();
const results = [];
const ok = (name, cond, info = "") => results.push(`${cond ? "PASS" : "FAIL"} ${name}${info ? " — " + info : ""}`);
const T = {
  vi: { title: "Bắt đầu một cuộc trò chuyện.", form: "Yêu cầu tư vấn", invalid: "Vui lòng kiểm tra", unsent: "Chưa gửi." },
  en: { title: "Start a conversation.", form: "Request a consultation", invalid: "Please check", unsent: "Not sent." },
};
const SERVICES = ["van-hanh", "tu-van-mo-hinh", "nhuong-quyen"];

async function open(width, lang, path = "/dev/demo?intro=0") {
  const mobile = width < 1024;
  const ctx = await browser.newContext({ viewport: { width, height: mobile ? 844 : 900 }, isMobile: mobile, hasTouch: mobile });
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => m.type() === "error" && !m.text().startsWith("Failed to load resource") && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));
  const url = `${base}${path}${lang === "en" ? (path.includes("?") ? "&" : "?") + "lang=en" : ""}`;
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(300);
  return { ctx, page, errors, mobile };
}

for (const width of W) {
  for (const lang of ["vi", "en"]) {
    const t = T[lang];
    const tag = `@${width} ${lang}`;
    const { ctx, page, errors, mobile } = await open(width, lang);

    // ── Structure: order, siblings, no shared container.
    const s = await page.evaluate((title) => {
      const faq = document.getElementById("hoi-dap");
      const contact = document.getElementById("lien-he");
      const consult = document.getElementById("tu-van");
      const footer = document.querySelector("footer");
      const after = (a, b) => !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
      const parent = contact.parentElement;
      const pcs = getComputedStyle(parent);
      const card = contact.querySelector("[class*=footerContact]");
      const brand = contact.querySelector("[class*=footerBrand]");
      const form = consult.querySelector("form");
      const r = (el) => el.getBoundingClientRect();
      const headings = [...document.querySelectorAll("h1,h2,h3,h4")].filter((h) => h.textContent.trim() === title);
      const outsideMenu = (sel) => [...document.querySelectorAll(sel)].filter((el) => !el.closest("dialog") && !el.closest("footer"));
      return {
        order: after(faq, contact) && after(contact, consult) && after(consult, footer),
        siblings: consult.parentElement === parent && !contact.contains(consult) && !consult.contains(contact),
        noFormInContact: contact.querySelectorAll("form, input, textarea").length,
        // Both sections sit directly in the page's <main> (full-width Light Beige page background), not in a card.
        parentPlain: parent.tagName === "MAIN" && pcs.borderRadius === "0px" && pcs.borderTopWidth === "0px" && parent.getBoundingClientRect().width >= innerWidth - 20,
        contactH2: contact.querySelectorAll("h2").length,
        contactH2Text: contact.querySelector("h2")?.textContent.trim(),
        labelled: document.getElementById(contact.getAttribute("aria-labelledby"))?.textContent.trim(),
        titleHeadings: headings.length,
        cardBg: getComputedStyle(card).backgroundColor,
        cardRadius: parseFloat(getComputedStyle(card).borderTopLeftRadius),
        cardTitleColor: getComputedStyle(card.querySelector("h2")).color,
        ctaBg: getComputedStyle(card.querySelector("[class*=footerCta]")).backgroundColor,
        ctaHref: card.querySelector("[class*=footerCta]").getAttribute("href"),
        brandLogo: !!brand?.querySelector("img[src*=vnest-wordmark]"),
        brandTag: brand?.textContent.includes("Hospitality Management"),
        brandIntro: !!brand?.querySelector("[class*=footerDescriptor]")?.textContent.trim(),
        sideBySide: r(card).left >= r(brand).right - 1,
        stacked: r(card).top >= r(brand).bottom - 1,
        cardWidthShare: r(card).width / r(contact).width,
        gap: r(form).top - r(card).bottom,
        formBg: getComputedStyle(form).backgroundColor,
        formRadius: parseFloat(getComputedStyle(form).borderTopLeftRadius),
        formTop: parseFloat(getComputedStyle(form).borderTopWidth),
        formH: consult.querySelector("h2")?.textContent.trim(),
        formHSize: parseFloat(getComputedStyle(consult.querySelector("h2")).fontSize),
        titleSize: parseFloat(getComputedStyle(card.querySelector("h2")).fontSize),
        consultLabelled: document.getElementById(consult.getAttribute("aria-labelledby"))?.textContent.trim(),
        fields: ["name", "reach", "asset", "message"].every((n) => form.querySelector(`[name=${n}]`)),
        radios: form.querySelectorAll("input[type=radio][name=service]").length,
        tel: outsideMenu('a[href^="tel:"]').length,
        mail: outsideMenu('a[href^="mailto:"]').length,
        address: outsideMenu("address").length,
        facebook: outsideMenu('a[href="https://www.facebook.com/vnest.com.vn"]').length,
        footerContact: document.querySelectorAll('footer a[href^="tel:"], footer h2, footer address').length,
        overflow: document.documentElement.scrollWidth - innerWidth,
      };
    }, t.title);
    ok(`${tag} order FAQ → Contact → Form → footer`, s.order);
    ok(`${tag} Contact and Form are separate sibling sections, no shared container`, s.siblings && s.noFormInContact === 0 && s.parentPlain, `formFieldsInContact=${s.noFormInContact} parentPlain=${s.parentPlain}`);
    ok(`${tag} Contact: one h2, the section's label`, s.contactH2 === 1 && s.contactH2Text === t.title && s.labelled === t.title, s.contactH2Text);
    ok(`${tag} contact heading appears once on the page`, s.titleHeadings === 1, `${s.titleHeadings}`);
    ok(`${tag} card Dark Olive #37412F, rounded, cream title, copper CTA`, s.cardBg === "rgb(55, 65, 47)" && s.cardRadius >= 12 && s.cardTitleColor === "rgb(241, 236, 228)" && s.ctaBg === "rgb(154, 104, 60)", `${s.cardBg} r=${s.cardRadius} ${s.cardTitleColor} ${s.ctaBg}`);
    ok(`${tag} identity: logo, Hospitality Management, introduction`, s.brandLogo && s.brandTag && s.brandIntro);
    ok(`${tag} layout ${mobile ? "stacked" : "two columns"}`, mobile ? s.stacked : s.sideBySide && s.cardWidthShare < 0.6, `share=${s.cardWidthShare.toFixed(2)}`);
    const [lo, hi] = width <= 430 ? [32, 48] : width >= 1024 ? [64, 96] : [32, 96];
    ok(`${tag} whitespace Contact → Form ${lo}–${hi}px`, s.gap >= lo && s.gap <= hi, `${s.gap.toFixed(0)}px`);
    ok(`${tag} form: own cream card, rounded on all sides`, s.formBg === "rgb(248, 244, 238)" && s.formRadius >= 12 && s.formTop >= 1, `${s.formBg} r=${s.formRadius}`);
    ok(`${tag} form: small own heading, not the contact heading`, s.formH === t.form && s.consultLabelled === t.form && s.formHSize < s.titleSize * 0.8, `${s.formHSize}px vs ${s.titleSize}px`);
    ok(`${tag} form: all fields and 4 service choices kept`, s.fields && s.radios === 4);
    ok(`${tag} contact details once (tel, mail, address, Facebook)`, s.tel === 1 && s.mail === 1 && s.address === 1 && s.facebook === 1, `${s.tel}/${s.mail}/${s.address}/${s.facebook}`);
    ok(`${tag} minimal footer: no contact block`, s.footerContact === 0);
    ok(`${tag} contact CTA is a real link to #tu-van`, s.ctaHref === "/dev/demo#tu-van");
    ok(`${tag} no horizontal overflow`, s.overflow <= 0, `${s.overflow}`);

    // ── Contact CTA: click → form section at the top, focus on its heading, no history entry, address unchanged.
    const before = await page.evaluate(() => ({ url: location.href, len: history.length }));
    await page.locator("#lien-he [class*=footerCta]").click();
    await page.waitForTimeout(900);
    const c = await page.evaluate(() => ({ top: document.getElementById("tu-van").getBoundingClientRect().top, focus: document.activeElement?.textContent.trim(), tag: document.activeElement?.tagName, url: location.href, len: history.length }));
    ok(`${tag} CTA scrolls to #tu-van and focuses its heading`, c.top >= -2 && c.top < 140 && c.tag === "H2" && c.focus === t.form, `top=${c.top.toFixed(0)} focus=${c.tag}:${c.focus}`);
    ok(`${tag} CTA adds no history entry`, c.url === before.url && c.len === before.len);

    // Keyboard: Enter on the focused CTA.
    await page.evaluate(() => scrollTo(0, 0));
    await page.locator("#lien-he [class*=footerCta]").focus();
    await page.keyboard.press("Enter");
    await page.waitForTimeout(900);
    const k = await page.evaluate(() => ({ top: document.getElementById("tu-van").getBoundingClientRect().top, tag: document.activeElement?.tagName }));
    ok(`${tag} CTA with keyboard Enter`, k.top >= -2 && k.top < 140 && k.tag === "H2", `top=${k.top.toFixed(0)}`);

    // ── Honest form: empty → invalid, valid → "not sent"; never success; no GET fallback.
    const submit = page.locator('#tu-van button[type="submit"]');
    await submit.click();
    const inv = await page.locator('#tu-van [role="status"]').textContent();
    await page.locator('#tu-van input[name="name"]').fill("Nguyễn Văn A");
    await page.locator('#tu-van input[name="reach"]').fill("0901 234 567");
    await submit.click();
    const un = await page.locator('#tu-van [role="status"]').textContent();
    const fake = await page.evaluate(() => /thành công|đã gửi|success|sent successfully|thank you|cảm ơn/i.test(document.getElementById("tu-van").innerText));
    ok(`${tag} form validates, says "not sent", never success`, inv.includes(t.invalid) && un.startsWith(t.unsent) && !fake && !page.url().includes("name="));
    ok(`${tag} typed values kept after "not sent"`, (await page.locator('#tu-van input[name="name"]').inputValue()) === "Nguyễn Văn A");
    ok(`${tag} no console/hydration errors`, errors.length === 0, errors.join(" | ").slice(0, 300));
    await ctx.close();

    // ── Service CTAs: each preselects its service and lands on the form.
    for (const id of SERVICES) {
      const o = await open(width, lang);
      await o.page.locator(`#hop-tac button[data-service="${id}"]`).click();
      const expanded = await o.page.locator(`#hop-tac button[data-service="${id}"]`).getAttribute("aria-expanded");
      if (expanded !== "true") await o.page.locator(`#hop-tac button[data-service="${id}"]`).click();
      await o.page.locator("#hop-tac [role=region] button").click();
      await o.page.waitForTimeout(1000);
      const r = await o.page.evaluate((id) => ({
        checked: document.querySelector(`#tu-van input[value="${id}"]`)?.checked,
        top: document.getElementById("tu-van").getBoundingClientRect().top,
        url: location.href,
        focus: document.activeElement?.tagName + ":" + (document.activeElement?.getAttribute("name") ?? ""),
      }), id);
      const focusOk = o.mobile ? r.focus.startsWith("H2") : r.focus === "INPUT:name";
      ok(`${tag} service ${id} → form preselected, #tu-van in view, focus ${o.mobile ? "heading" : "first field"}`, r.checked && r.top >= -2 && r.top < 140 && r.url.endsWith(`dich-vu=${id}#tu-van`) && focusOk, `top=${r.top.toFixed(0)} ${r.focus} ${r.url.split("?")[1]}`);
      await o.ctx.close();
    }
  }
}

// Shared link: a service in the address opens on the form with it chosen.
{
  const o = await open(1440, "vi", "/dev/demo?intro=0&dich-vu=nhuong-quyen#tu-van");
  await o.page.waitForTimeout(600);
  const r = await o.page.evaluate(() => ({ checked: document.querySelector('#tu-van input[value="nhuong-quyen"]').checked, top: document.getElementById("tu-van").getBoundingClientRect().top }));
  ok("@1440 deep link ?dich-vu=nhuong-quyen#tu-van → form, service chosen", r.checked && Math.abs(r.top) < 140, `top=${r.top.toFixed(0)}`);
  await o.ctx.close();
}

// Property page: the full footer is the same composition; its CTA reaches the homepage form.
for (const width of [390, 1440]) {
  const o = await open(width, "vi", "/dev/stays/pepper-house");
  const f = await o.page.evaluate(() => {
    const card = document.querySelector("footer [class*=footerContact]");
    return { card: !!card, bg: card && getComputedStyle(card).backgroundColor, h: card?.querySelector("h2")?.textContent.trim(), href: card?.querySelector("[class*=footerCta]")?.getAttribute("href"), brand: !!document.querySelector("footer [class*=footerDescriptor]") };
  });
  ok(`@${width} property page: full footer = identity + Dark Olive card`, f.card && f.bg === "rgb(55, 65, 47)" && f.h === T.vi.title && f.brand);
  await o.page.locator("footer [class*=footerCta]").click();
  await o.page.waitForURL(/\/dev\/demo#tu-van$/, { timeout: 15000 }).catch(() => {});
  await o.page.waitForLoadState("networkidle").catch(() => {});
  await o.page.waitForTimeout(800);
  const top = await o.page.evaluate(() => document.getElementById("tu-van")?.getBoundingClientRect().top ?? 9999);
  ok(`@${width} property footer CTA → /dev/demo#tu-van, form in view`, f.href === "/dev/demo#tu-van" && o.page.url().endsWith("/dev/demo#tu-van") && Math.abs(top) < 160, `top=${top.toFixed(0)}`);
  await o.page.goBack({ waitUntil: "networkidle" });
  ok(`@${width} browser Back returns to the property page`, new URL(o.page.url()).pathname === "/dev/stays/pepper-house");
  ok(`@${width} property page: no console/hydration errors`, o.errors.length === 0, o.errors.join(" | ").slice(0, 300));
  await o.ctx.close();
}

await browser.close();
console.log(results.join("\n"));
console.log(`\n${results.filter((r) => r.startsWith("PASS")).length}/${results.length} passed`);
