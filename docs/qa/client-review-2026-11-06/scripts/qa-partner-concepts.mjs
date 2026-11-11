// Hợp tác cùng VNest redesign exploration (8/11/2026): QA of Concept A (/dev/partner-concepts/a) and Concept B
// (/dev/partner-concepts/b) at 375, 390, 430, 768, 1024 and 1440 px, Vietnamese and English.
// Checks: same service copy as the approved section, every service opens, one CTA visible, CTA leads to the approved
// form with the service chosen, no overflow or clipped text, no height change (A) / no jump under the pointer (B),
// keyboard, reduced motion, inert hidden content, official logos only (no The Nắng Suites), noindex, no console errors.
// Usage: node qa-partner-concepts.mjs http://localhost:3401
import { chromium } from "/Users/noe/Documents/GitHub/Cigarettes-After-Sex/node_modules/.pnpm/playwright@1.62.1/node_modules/playwright/index.mjs";

const base = process.argv[2] ?? "http://localhost:3401";
const WIDTHS = [375, 390, 430, 768, 1024, 1440];
const LOCALES = ["vi", "en"];
const SERVICES = ["van-hanh", "tu-van-mo-hinh", "nhuong-quyen"];
const browser = await chromium.launch();
let pass = 0;
const fails = [];
const check = (ok, label) => (ok ? pass++ : fails.push(label));

async function open(path, width, { reduce = true } = {}) {
  const mobile = width < 1024;
  const page = await browser.newPage({ viewport: { width, height: 900 }, isMobile: mobile, hasTouch: mobile, reducedMotion: reduce ? "reduce" : "no-preference" });
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(`${base}${path}`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  return { page, errors };
}

// 1. The approved section's copy, per service and language: the reference the concepts must match word for word.
const approved = {};
for (const locale of LOCALES) {
  const { page } = await open(`/dev/demo?intro=0${locale === "en" ? "&lang=en" : ""}`, 1440);
  approved[locale] = {};
  for (const id of SERVICES) {
    const card = page.locator(`#hop-tac button[data-service="${id}"]`);
    if ((await card.getAttribute("aria-expanded")) !== "true") await card.click();
    approved[locale][id] = {
      text: (await page.locator("#hop-tac [role=region] p").innerText()).trim(),
      cta: (await page.locator("#hop-tac [role=region] button").innerText()).replace("→", "").trim(),
      // The card's title without its sub-line (02 shows "Phát triển dự án (Tư vấn mô hình)").
      title: await card.evaluate((el) => el.querySelector("[class*=cardTitle]").firstChild.textContent.trim()),
    };
  }
  await page.close();
}

// Geometry shared by both concepts: overflow and clipping inside the section.
async function layout(page, tag) {
  const r = await page.evaluate(() => {
    const doc = document.documentElement;
    const section = document.querySelector("#hop-tac");
    const out = { overflow: doc.scrollWidth - window.innerWidth, clipped: [], outside: [] };
    for (const el of section.querySelectorAll("p, h2, h3, button, a, span, li")) {
      const style = getComputedStyle(el);
      if (style.visibility === "hidden" || el.closest("[inert]") || !el.getClientRects().length) continue;
      if (el.scrollWidth > el.clientWidth + 1 && style.overflow !== "visible" && el.clientWidth > 0) out.clipped.push(el.className || el.tagName);
    }
    // Everything drawn inside a visible visual stays inside its frame.
    for (const visual of section.querySelectorAll("[data-visual]")) {
      if (visual.closest("[inert]")) continue;
      const box = visual.getBoundingClientRect();
      for (const el of visual.querySelectorAll("img, span, li")) {
        const b = el.getBoundingClientRect();
        if (!b.width || getComputedStyle(el).display === "none") continue;
        if (b.left < box.left - 0.5 || b.right > box.right + 0.5 || b.top < box.top - 0.5 || b.bottom > box.bottom + 0.5) out.outside.push(`${visual.dataset.visual}:${el.className || el.tagName}`);
      }
    }
    return out;
  });
  check(r.overflow <= 0, `${tag}: horizontal overflow ${r.overflow}px`);
  check(r.clipped.length === 0, `${tag}: clipped text ${r.clipped.join(", ")}`);
  check(r.outside.length === 0, `${tag}: drawn outside its frame ${r.outside.join(", ")}`);
}

// What the visible state shows: one CTA, its href, the description, the visual.
async function visibleState(page) {
  return page.evaluate(() => {
    const section = document.querySelector("#hop-tac");
    const live = [...section.querySelectorAll("a[href*='dich-vu']")].filter((a) => !a.closest("[inert]") && getComputedStyle(a).visibility !== "hidden" && a.getClientRects().length);
    const holder = live[0]?.closest("[data-service]");
    return {
      ctas: live.length,
      href: live[0]?.getAttribute("href") ?? "",
      cta: live[0]?.textContent.replace("→", "").trim() ?? "",
      text: holder?.querySelector("p")?.textContent.trim() ?? "",
      visual: holder?.querySelector("[data-visual]")?.dataset.visual ?? "",
      service: holder?.dataset.service ?? "",
      imgs: [...section.querySelectorAll("img")].map((i) => i.getAttribute("src")),
      photoAlt: section.querySelector("[data-visual=photo] img")?.getAttribute("alt") ?? null,
      height: section.getBoundingClientRect().height,
    };
  });
}

const VISUAL = { "van-hanh": "photo", "tu-van-mo-hinh": "plan", "nhuong-quyen": "brands" };

for (const concept of ["a", "b"]) {
  for (const locale of LOCALES) {
    for (const width of WIDTHS) {
      const tag = `${concept.toUpperCase()} ${locale} ${width}`;
      const { page, errors } = await open(`/dev/partner-concepts/${concept}${locale === "en" ? "?lang=en" : ""}`, width);
      const robots = await page.locator('meta[name="robots"]').getAttribute("content");
      check(/noindex/.test(robots ?? ""), `${tag}: page not noindex (${robots})`);
      const heights = [];
      // On the homepage the section sits below the hero, Discovery and About; give the preview the same room above, so
      // B's "the row stays under the pointer" can be measured (at the very top of a page nothing can scroll up).
      if (concept === "b") await page.evaluate(() => document.querySelector("#hop-tac").insertAdjacentHTML("beforebegin", '<div data-qa-spacer style="height:2400px"></div>'));
      for (const id of SERVICES) {
        const control = page.locator(`#hop-tac button[data-service="${id}"]`);
        let clicked = concept === "a";
        if (concept === "a") await control.click();
        else if ((await control.getAttribute("aria-expanded")) !== "true") {
          clicked = true;
          await control.scrollIntoViewIfNeeded();
          const before = (await control.boundingBox()).y;
          await control.click();
          await page.waitForTimeout(50);
          const after = (await control.boundingBox()).y;
          check(Math.abs(after - before) <= 1, `${tag} ${id}: row moved under the pointer ${before} → ${after}`);
        }
        await page.waitForTimeout(50);
        const s = await visibleState(page);
        heights.push(s.height);
        check(s.ctas === 1, `${tag} ${id}: ${s.ctas} visible CTAs`);
        check(s.service === id, `${tag} ${id}: showing ${s.service}`);
        check(s.text === approved[locale][id].text, `${tag} ${id}: description differs from the approved section`);
        check(s.cta === approved[locale][id].cta, `${tag} ${id}: CTA "${s.cta}" ≠ "${approved[locale][id].cta}"`);
        check(s.href.includes(`dich-vu=${id}`) && s.href.endsWith("#tu-van") && (locale === "vi" || s.href.includes("lang=en")), `${tag} ${id}: CTA href ${s.href}`);
        check(s.visual === VISUAL[id], `${tag} ${id}: visual ${s.visual}`);
        if (clicked) check(new URL(page.url()).searchParams.get("dich-vu") === id, `${tag} ${id}: address does not keep the service`);
        const pressed = concept === "a" ? await control.getAttribute("aria-selected") : await control.getAttribute("aria-expanded");
        check(pressed === "true", `${tag} ${id}: control state ${pressed}`);
        // The title shown on the control is the client's.
        const shownTitle = (await control.innerText()).replace(/\s+/g, " ");
        check(shownTitle.includes(approved[locale][id].title), `${tag} ${id}: control title "${approved[locale][id].title}"`);
        await layout(page, `${tag} ${id}`);
      }
      if (concept === "a") check(Math.max(...heights) - Math.min(...heights) <= 0.5, `${tag}: section height changes with the service ${heights.join("/")}`);
      const s = await visibleState(page);
      check(!s.imgs.some((src) => /the-nang/.test(src)), `${tag}: The Nắng Suites artwork present`);
      check(s.imgs.filter((src) => /official-logos/.test(src)).every((src) => /bare-boutique-stays-transparent|pepper-house-transparent/.test(src)), `${tag}: unexpected logo file`);
      check(s.photoAlt === null || s.photoAlt.length > 20, `${tag}: photo alt missing`);
      check(errors.length === 0, `${tag}: console errors ${errors.join(" | ").slice(0, 300)}`);
      await page.close();
    }
  }
}

// Keyboard (desktop and phone). A: arrows / Home / End move and select; Tab reaches only the visible CTA.
// B: Enter and Space toggle a row; closed content cannot take focus.
for (const width of [1440, 390]) {
  {
    const { page } = await open("/dev/partner-concepts/a", width);
    const tabs = page.locator("#hop-tac [role=tab]");
    await tabs.first().focus();
    const sel = async () => page.evaluate(() => [document.activeElement?.dataset.service, document.querySelector("#hop-tac [role=tab][aria-selected=true]")?.dataset.service]);
    await page.keyboard.press("ArrowDown");
    check(JSON.stringify(await sel()) === JSON.stringify(["tu-van-mo-hinh", "tu-van-mo-hinh"]), `A ${width}: ArrowDown`);
    await page.keyboard.press("ArrowRight");
    check(JSON.stringify(await sel()) === JSON.stringify(["nhuong-quyen", "nhuong-quyen"]), `A ${width}: ArrowRight`);
    await page.keyboard.press("ArrowDown");
    check(JSON.stringify(await sel()) === JSON.stringify(["van-hanh", "van-hanh"]), `A ${width}: wraps to first`);
    await page.keyboard.press("End");
    check(JSON.stringify(await sel()) === JSON.stringify(["nhuong-quyen", "nhuong-quyen"]), `A ${width}: End`);
    await page.keyboard.press("Home");
    check(JSON.stringify(await sel()) === JSON.stringify(["van-hanh", "van-hanh"]), `A ${width}: Home`);
    await page.keyboard.press("Tab");
    const next = await page.evaluate(() => ({ tag: document.activeElement?.tagName, href: document.activeElement?.getAttribute("href") ?? "" }));
    check(next.tag === "A" && next.href.includes("dich-vu=van-hanh"), `A ${width}: Tab from the tabs reaches the visible CTA (${next.href})`);
    const tabStops = await page.evaluate(() => [...document.querySelectorAll("#hop-tac [role=tab]")].filter((t) => t.tabIndex === 0).length);
    check(tabStops === 1, `A ${width}: ${tabStops} tab stops in the tab list`);
    await page.close();
  }
  {
    const { page } = await open("/dev/partner-concepts/b", width);
    const second = page.locator('#hop-tac button[data-service="tu-van-mo-hinh"]');
    await second.focus();
    await page.keyboard.press("Enter");
    check((await second.getAttribute("aria-expanded")) === "true", `B ${width}: Enter opens`);
    await page.keyboard.press("Tab");
    const next = await page.evaluate(() => document.activeElement?.getAttribute("href") ?? "");
    check(next.includes("dich-vu=tu-van-mo-hinh"), `B ${width}: Tab reaches the open row's CTA (${next})`);
    await second.focus();
    await page.keyboard.press("Space");
    check((await second.getAttribute("aria-expanded")) === "false", `B ${width}: Space closes`);
    const focusable = await page.evaluate(() => [...document.querySelectorAll("#hop-tac a")].filter((a) => !a.closest("[inert]")).length);
    check(focusable === 0, `B ${width}: ${focusable} CTAs reachable with every row closed`);
    await page.close();
  }
}

// Reduced motion: no transition on the panel change (A) or the opening row (B); with motion, short ones (≤ 300 ms).
for (const reduce of [true, false]) {
  const { page: a } = await open("/dev/partner-concepts/a", 1440, { reduce });
  const fa = await a.evaluate(() => getComputedStyle(document.querySelector("#hop-tac [role=tabpanel]")).transitionDuration);
  const ms = (v) => Math.max(...v.split(",").map((x) => parseFloat(x) * (x.includes("ms") ? 1 : 1000)));
  check(reduce ? ms(fa) === 0 : ms(fa) > 0 && ms(fa) <= 300, `A reduce=${reduce}: panel transition ${fa}`);
  await a.close();
  const { page: b } = await open("/dev/partner-concepts/b", 1440, { reduce });
  const fb = await b.evaluate(() => getComputedStyle(document.querySelector("#hop-tac [data-open=true] [role=region]")).transitionDuration);
  check(reduce ? ms(fb) === 0 : ms(fb) > 0 && ms(fb) <= 300, `B reduce=${reduce}: row transition ${fb}`);
  await b.close();
}

// The CTA lands on the approved consultation form with the service chosen (both concepts, every service, both languages).
for (const concept of ["a", "b"]) {
  for (const locale of LOCALES) {
    for (const id of SERVICES) {
      const width = id === "tu-van-mo-hinh" ? 390 : 1440;
      const { page, errors } = await open(`/dev/partner-concepts/${concept}?dich-vu=${id}${locale === "en" ? "&lang=en" : ""}`, width);
      await page.locator("#hop-tac a[href*='dich-vu']:visible").first().click();
      await page.waitForURL(/\/dev\/demo/);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(400);
      const r = await page.evaluate(() => {
        const form = document.querySelector("#tu-van");
        const top = form?.getBoundingClientRect().top ?? 9999;
        return { checked: document.querySelector("#tu-van input[name=service]:checked")?.value, top, lang: document.querySelector("#hop-tac")?.getAttribute("lang") };
      });
      check(r.checked === id, `${concept} ${locale} ${id}: form service ${r.checked}`);
      check(r.top > -10 && r.top < 200, `${concept} ${locale} ${id}: form not in view (top ${Math.round(r.top)})`);
      check(r.lang === locale, `${concept} ${locale} ${id}: homepage language ${r.lang}`);
      check(errors.length === 0, `${concept} ${locale} ${id}: console errors ${errors.join(" | ").slice(0, 200)}`);
      await page.close();
    }
  }
}

console.log(`passed ${pass}, failed ${fails.length}`);
for (const f of fails) console.log(`FAIL ${f}`);
await browser.close();
process.exit(fails.length ? 1 : 0);
