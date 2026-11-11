/**
 * CTA correction QA (9/11/2026): the homepage accordion back on its approved solid Copper CTA (no wipe) with an
 * understated link, and the partner page's two-state wipe (white → full Copper, left to right). Repeats every earlier
 * check (client text from the client's document, preselection, captions, brand ecosystem, layout, console) and adds the
 * CTA checks of the brief. 390 / 768 / 1024 / 1440, Vietnamese and English.
 *   node docs/qa/partner-cta-2026-11-09/scripts/qa-cta-correction.mjs http://localhost:3401
 */
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { chromium } from "/Users/noe/Documents/GitHub/Cigarettes-After-Sex/node_modules/.pnpm/playwright@1.62.1/node_modules/playwright/index.mjs";

const BASE = process.argv[2] ?? "http://localhost:3401";
const OUT = new URL("../qa-results-correction.txt", import.meta.url);
const WIDTHS = [390, 768, 1024, 1440];
const SERVICES = ["van-hanh", "tu-van-mo-hinh", "nhuong-quyen"];

// The client document, with the two approved brand-name corrections (brand-copy.ts, BRAND_NAME_NORMALISATION).
const DOC = readFileSync(new URL("../../../content/homepage-content-2026-11-05/vnest-website-content-2026-11-05-final.txt", import.meta.url), "utf8")
  .replace(/\bVnest\b/g, "VNest")
  .replace(/\bThe Nang Suites\b/g, "The Nắng Suites");
const split = DOC.indexOf("B. ENGLISH");
const all = (text, re) => [...text.matchAll(re)].map((m) => m[1].trim());
const parse = (text) => {
  const bullets = all(text, /^\t•\t(.+)$/gm);
  return {
    card: all(text, /^Service Card: (.+)$/gm),
    description: all(text, /^Expanded Description: (.+)$/gm),
    highlights: [bullets.slice(0, 3), bullets.slice(3, 6), bullets.slice(6, 9)],
    positioning: all(text, /^Brand Positioning: (.+)$/gm),
    faq: [...text.matchAll(/^(\d)\. (.+)\n(.+)$/gm)].map((m) => ({ q: m[2].trim(), a: m[3].trim() })),
  };
};
const WANT = { vi: parse(DOC.slice(0, split)), en: parse(DOC.slice(split)) };
const norm = (s) => s.replace(/\s+/g, " ").trim();
// Claims the page must never make (owner brief, 9/11/2026, §4 Section 03).
const CLAIMS = /\d+\s?%|năm kinh nghiệm|years of experience|cam kết lợi nhuận|guaranteed|đảm bảo doanh thu|tỷ suất|ROI|occupancy rate|công suất \d/i;

let passed = 0;
const failures = [];
const lines = [];
async function check(name, fn) {
  try {
    await fn();
    passed++;
  } catch (error) {
    failures.push(`${name}: ${error.message.split("\n")[0]}`);
  }
}

const browser = await chromium.launch();

/** WCAG contrast of two computed `rgb()` colours. */
function contrast(a, b) {
  const lum = (c) => {
    const [r, g, bl] = c.match(/[\d.]+/g).slice(0, 3).map(Number).map((v) => {
      const x = v / 255;
      return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const COPPER = "rgb(154, 104, 60)";
const WHITE = "rgb(255, 255, 255)";
const OLIVE = "rgb(55, 65, 47)";

/** The homepage's approved solid Copper CTA: white label and arrow, rounded 10 px, no wipe layer, no arrow cell. */
async function assertSolidCta(locator, label) {
  const info = await locator.evaluate((el) => ({
    bg: getComputedStyle(el).backgroundColor,
    color: getComputedStyle(el).color,
    radius: getComputedStyle(el).borderRadius,
    kids: [...el.children].map((c) => `${c.tagName}:${c.textContent}`),
    clipped: [el, ...el.querySelectorAll("*")].filter((n) => getComputedStyle(n).clipPath !== "none").length,
    underlined: [el, ...el.querySelectorAll("*")].filter((n) => getComputedStyle(n).textDecorationLine.includes("underline")).length,
    height: el.getBoundingClientRect().height,
  }));
  assert.equal(info.bg, COPPER, `${label}: solid Copper`);
  assert.equal(info.color, WHITE, `${label}: white label`);
  assert.equal(info.radius, "10px", `${label}: the approved corner radius`);
  assert.deepEqual(info.kids, ["SPAN:→"], `${label}: label and its white arrow, nothing else`);
  assert.equal(info.clipped, 0, `${label}: no wipe layer`);
  assert.equal(info.underlined, 0, `${label}: no underline`);
  assert.ok(info.height >= 47.5, `${label}: target`);
  assert.ok(contrast(info.color, info.bg) >= 4.5, `${label}: contrast`);
}

/** The partner page's two-state wipe at rest: white, Dark Olive label, Copper arrow, one edge, the Copper face hidden. */
async function assertPartnerCta(locator, label) {
  const info = await locator.evaluate((el) => {
    const [face, fill] = el.children;
    return {
      parts: [...el.children].map((c) => c.tagName),
      bg: getComputedStyle(el).backgroundColor,
      edge: getComputedStyle(el).boxShadow,
      outline: getComputedStyle(el).outlineStyle,
      ink: getComputedStyle(face).color,
      arrow: getComputedStyle(face.lastElementChild).color,
      fillHidden: fill.getAttribute("aria-hidden"),
      fillBg: getComputedStyle(fill).backgroundColor,
      fillInk: getComputedStyle(fill).color,
      fillArrow: getComputedStyle(fill.lastElementChild).color,
      fillClip: getComputedStyle(fill).clipPath,
      sameText: face.textContent === fill.textContent,
      underlined: [el, ...el.querySelectorAll("*")].filter((n) => getComputedStyle(n).textDecorationLine.includes("underline")).length,
      height: el.getBoundingClientRect().height,
    };
  });
  assert.deepEqual(info.parts, ["SPAN", "SPAN"], `${label}: resting face + Copper face`);
  assert.equal(info.bg, WHITE, `${label}: white at rest`);
  assert.match(info.edge, /inset/, `${label}: one subtle edge`);
  assert.equal((info.edge.match(/inset/g) ?? []).length, 1, `${label}: a single edge, no double outline`);
  assert.equal(info.outline, "none", `${label}: no ring at rest`);
  assert.equal(info.ink, OLIVE, `${label}: Dark Olive label`);
  assert.equal(info.arrow, "rgb(168, 116, 68)", `${label}: Copper arrow`);
  assert.equal(info.fillHidden, "true", `${label}: the Copper face is hidden from screen readers`);
  assert.equal(info.fillBg, COPPER, `${label}: Copper face`);
  assert.equal(info.fillInk, WHITE, `${label}: white label on Copper`);
  assert.equal(info.fillArrow, WHITE, `${label}: white arrow on Copper`);
  assert.match(info.fillClip, /inset\(0px 100% 0px 0px\)/, `${label}: Copper face hidden at rest`);
  assert.ok(info.sameText, `${label}: both faces say the same`);
  assert.equal(info.underlined, 0, `${label}: no underline`);
  assert.ok(info.height >= 47.5, `${label}: target ${info.height}`);
  assert.ok(contrast(info.ink, info.bg) >= 7 && contrast(info.fillInk, info.fillBg) >= 4.5, `${label}: readable in both states`);
}

async function open(path, width, lang) {
  const mobile = width < 1024;
  const context = await browser.newContext({ viewport: { width, height: mobile ? 844 : 900 }, isMobile: mobile, hasTouch: mobile, reducedMotion: "reduce" });
  const page = await context.newPage();
  const errors = [];
  page.on("console", (m) => {
    const text = m.text();
    if ((m.type() === "error" && !text.startsWith("Failed to load resource")) || /hydrat/i.test(text)) errors.push(text);
  });
  page.on("pageerror", (e) => errors.push(String(e)));
  const sep = path.includes("?") ? "&" : "?";
  await page.goto(`${BASE}${path}${lang === "en" ? `${sep}lang=en` : `${sep}lang=vi`}`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  return { page, context, errors, mobile };
}

/** No sideways scroll, nothing drawn outside `selector`, no clipped text inside it. */
async function layout(page, selector) {
  return page.evaluate((sel) => {
    const out = { page: document.documentElement.scrollWidth - window.innerWidth, wide: [], clipped: [] };
    for (const section of document.querySelectorAll(sel)) {
      const box = section.getBoundingClientRect();
      for (const el of section.querySelectorAll("*")) {
        if (el.closest("[inert], [aria-hidden='true'], dialog") || getComputedStyle(el).position === "fixed") continue;
        const r = el.getBoundingClientRect();
        if (r.width > 0 && (r.left < box.left - 1 || r.right > box.right + 1)) out.wide.push(`${el.tagName}.${el.className}`.slice(0, 70));
      }
      for (const el of section.querySelectorAll("p, li, h1, h2, h3, a, button, dd, dt, summary, figcaption, span")) {
        if (el.closest("[inert], .sr-only")) continue; // screen-reader-only text is clipped on purpose
        if (el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflowX !== "visible") out.clipped.push(`${el.tagName}:${el.textContent.slice(0, 40)}`);
      }
    }
    return out;
  }, selector);
}

function assertLayout(result, label) {
  assert.ok(result.page <= 0, `${label}: page scrolls sideways by ${result.page}px`);
  assert.deepEqual(result.wide, [], `${label}: outside its section`);
  assert.deepEqual(result.clipped, [], `${label}: clipped text`);
}

/* ── Homepage: the approved accordion ── */

async function homepage(width, lang) {
  const tag = `home ${lang} ${width}`;
  const want = WANT[lang];
  const { page, context, errors, mobile } = await open("/dev/demo?intro=0", width, lang);
  try {
    const section = page.locator("#hop-tac");
    await check(`${tag}: Concept B is the homepage section`, async () => {
      assert.equal(await section.getAttribute("data-section"), "partner-services");
      assert.equal(await section.getAttribute("lang"), lang);
      assert.equal(await section.locator("button[aria-expanded]").count(), 3);
      assert.equal(await section.locator("button[aria-expanded='true']").getAttribute("data-service"), "van-hanh", "01 open on arrival");
    });
    for (const [i, id] of SERVICES.entries()) {
      const trigger = section.locator(`button[data-service="${id}"]`);
      if ((await trigger.getAttribute("aria-expanded")) !== "true") await (mobile ? trigger.tap() : trigger.click());
      await page.waitForTimeout(80);
      const row = section.locator(`[data-service="${id}"]`).first();
      await check(`${tag} ${id}: client copy and one CTA`, async () => {
        assert.equal(await trigger.getAttribute("aria-expanded"), "true");
        assert.ok(norm(await trigger.innerText()).includes(norm(want.card[i])), "card line");
        const region = section.locator(`[id="${await trigger.getAttribute("aria-controls")}"]`);
        assert.equal(await region.evaluate((el) => el.inert), false);
        assert.ok(norm(await region.innerText()).includes(norm(want.description[i])), "description");
        const ctas = region.locator("a");
        assert.equal(await ctas.count(), 1);
        await assertSolidCta(ctas, `${tag} ${id} CTA`);
        assert.equal(await region.locator("[class*=photoNote]").count(), 0, "no caption on the photograph");
        assert.doesNotMatch(await region.innerText(), /Ảnh minh hoạ|Illustration ·/i);
        assert.match(await ctas.getAttribute("href"), new RegExp(`dich-vu=${id}.*#tu-van$`));
        assert.equal(await section.locator("[role=region]:not([inert])").count(), 1, "one row open");
      });
      await check(`${tag} ${id}: visual on the index column; text and CTA on the card line's column`, async () => {
        const x = await row.evaluate((el) => {
          const left = (s) => Math.round(el.querySelector(s).getBoundingClientRect().left);
          return { no: left("[class*=no]"), line: left("[class*=line]"), name: left("[class*=name]"), frame: left("[class*=frame]"), text: left("[class*=text]"), cta: left("[class*=cta]") };
        });
        assert.ok(Math.abs(x.frame - x.no) <= 1, `visual ${x.frame} vs index ${x.no}`);
        assert.ok(Math.abs(x.text - x.line) <= 1, `description ${x.text} vs card line ${x.line}`);
        assert.ok(Math.abs(x.cta - x.text) <= 1, `CTA ${x.cta} vs description ${x.text}`);
      });
      await check(`${tag} ${id}: no overflow or clipped text`, async () => assertLayout(await layout(page, "#hop-tac"), tag));
    }
    const more = section.locator("[data-partner-page-link]");
    await check(`${tag}: one section-level link to the partner page, quieter than the CTAs`, async () => {
      assert.equal(await page.locator("[data-partner-page-link]").count(), 1);
      assert.equal(await more.getAttribute("href"), lang === "en" ? "/dev/demo/hop-tac?lang=en" : "/dev/demo/hop-tac");
      assert.equal(norm(await more.locator("[class*=moreLabel]").innerText()), lang === "en" ? "Explore partnership opportunities" : "Tìm hiểu thêm về hợp tác");
      // Understated: Dark Olive text, a Copper arrow, no fill, no permanent underline.
      const look = await more.evaluate((el) => ({
        bg: getComputedStyle(el).backgroundColor,
        color: getComputedStyle(el).color,
        underlined: [el, ...el.querySelectorAll("*")].filter((n) => getComputedStyle(n).textDecorationLine.includes("underline")).length,
        arrow: el.querySelector("[class*=moreArrow]").textContent.trim(),
      }));
      assert.equal(look.bg, "rgba(0, 0, 0, 0)");
      assert.equal(look.color, OLIVE);
      assert.equal(look.underlined, 0, "no permanent underline");
      assert.equal(look.arrow, "↗");
      const pos = await section.evaluate((el) => ({ more: el.querySelector("[data-partner-page-link]").getBoundingClientRect().left, line: el.querySelector("[class*=line]").getBoundingClientRect().left }));
      assert.ok(Math.abs(pos.more - pos.line) <= 1, `link ${pos.more} vs card line ${pos.line}`);
    });
    await check(`${tag}: a service CTA chooses its service in the form`, async () => {
      const trigger = section.locator('button[data-service="tu-van-mo-hinh"]');
      if ((await trigger.getAttribute("aria-expanded")) !== "true") await (mobile ? trigger.tap() : trigger.click());
      const cta = section.locator("[role=region]:not([inert]) a");
      await (mobile ? cta.tap() : cta.click());
      await page.waitForTimeout(300);
      assert.match(page.url(), /dich-vu=tu-van-mo-hinh#tu-van$/);
      assert.equal(await page.locator('#tu-van input[value="tu-van-mo-hinh"]').isChecked(), true);
      assert.ok(await page.locator("#tu-van").evaluate((el) => el.getBoundingClientRect().top < window.innerHeight), "form in view");
    });
    await check(`${tag}: the link opens the partner page in the same language`, async () => {
      await more.scrollIntoViewIfNeeded();
      await (mobile ? more.tap() : more.click());
      await page.waitForURL(/\/dev\/demo\/hop-tac/);
      await page.locator("h1").waitFor();
      assert.equal(norm(await page.locator("h1").innerText()), lang === "en" ? "Partner with VNest." : "Hợp tác cùng VNest.");
      assert.equal(await page.locator("main [lang]").first().getAttribute("lang"), lang);
    });
    await check(`${tag}: no console errors or hydration warnings`, async () => assert.deepEqual(errors, []));
  } finally {
    await context.close();
  }
}

/* ── The partner page ── */

async function partnerPage(width, lang) {
  const tag = `partner ${lang} ${width}`;
  const want = WANT[lang];
  const { page, context, errors, mobile } = await open("/dev/demo/hop-tac", width, lang);
  const tap = (locator) => (mobile ? locator.tap() : locator.click());
  try {
    await check(`${tag}: one h1, sections in order, noindex, title`, async () => {
      assert.equal(await page.locator("h1").count(), 1);
      const ids = await page.locator("main section[id]").evaluateAll((all) => all.map((s) => s.id));
      assert.deepEqual(ids, ["dich-vu", "the-manh", "cach-hop-tac", "thuong-hieu", "hoi-dap", "lien-he", "tu-van"]);
      assert.match((await page.locator('meta[name="robots"]').getAttribute("content")) ?? "", /noindex/);
      assert.equal(await page.title(), lang === "en" ? "Partner with VNest | VNest" : "Hợp tác cùng VNest | VNest");
      const h2s = await page.locator("main h2").count();
      assert.ok(h2s >= 7, `h2 count ${h2s}`);
    });
    await check(`${tag}: no unverified business claims`, async () => {
      assert.doesNotMatch(await page.locator("main").innerText(), CLAIMS);
    });
    await check(`${tag}: services show the client's copy and highlights`, async () => {
      for (const [i, id] of SERVICES.entries()) {
        const chapter = page.locator(`#dich-vu-${id}`);
        const text = norm(await chapter.innerText());
        assert.ok(text.includes(norm(want.card[i])), `${id} card line`);
        assert.ok(text.includes(norm(want.description[i])), `${id} description`);
        for (const h of want.highlights[i]) assert.ok(text.includes(norm(h)), `${id} highlight ${h}`);
        assert.equal(await chapter.locator("h3").count(), 1, `${id}: the name once`);
        const cta = chapter.locator("a[data-service]");
        assert.equal(await cta.count(), 1);
        assert.match(await cta.getAttribute("href"), new RegExp(`^/dev/demo/hop-tac\\?dich-vu=${id}${lang === "en" ? "&lang=en" : ""}#tu-van$`));
        assert.equal(await chapter.locator("img[src*='the-nang']").count(), 0, `${id}: no The Nắng Suites artwork`);
      }
    });
    await check(`${tag}: strengths, steps, brands`, async () => {
      assert.equal(await page.locator("#the-manh ol > li").count(), 3);
      assert.equal(await page.locator("#cach-hop-tac ol > li").count(), 3);
    });
    await check(`${tag}: the brand ecosystem is VNest and three official logos, nothing else`, async () => {
      const eco = page.locator("#thuong-hieu");
      assert.equal(await eco.locator("h2").count(), 1);
      assert.equal(await eco.locator("img[src*='vnest-symbol-approved']").count(), 1, "VNest's mark on the band");
      const members = eco.locator("[data-brand]");
      assert.deepEqual(await members.evaluateAll((all) => all.map((m) => m.dataset.brand)), ["bare", "pepper-house", "the-nang"]);
      // Official files at their own proportions (rendered aspect = file aspect), visibly sized. The logos load lazily.
      await eco.scrollIntoViewIfNeeded();
      await eco.locator("img").evaluateAll((imgs) => Promise.all(imgs.map((i) => (i.complete ? null : new Promise((r) => i.addEventListener("load", r, { once: true }))))));
      const marks = await members.evaluateAll((all) =>
        all.map((m) => {
          const img = m.querySelector("img");
          const r = img.getBoundingClientRect();
          return { id: m.dataset.brand, src: img.getAttribute("src"), alt: img.alt, file: img.naturalWidth / img.naturalHeight, shown: r.width / r.height, h: r.height, name: m.querySelector("span")?.textContent ?? null };
        }),
      );
      for (const m of marks) {
        assert.match(m.src, /\/official-logos\//, `${m.id} official file`);
        assert.ok(Math.abs(m.shown / m.file - 1) < 0.02, `${m.id} proportions ${m.shown} vs ${m.file}`);
        assert.ok(m.h >= 48, `${m.id} height ${m.h}`);
      }
      // A name is set only where the file does not spell it; Bare's lockup is named by its alt text.
      assert.deepEqual(
        marks.map((m) => [m.id, m.alt, m.name]),
        [
          ["bare", "Bare Boutique Stays", null],
          ["pepper-house", "", "Pepper House"],
          ["the-nang", "", "The Nắng Suites"],
        ],
      );
      // No photographs, descriptions, places, counts or offers in the section.
      assert.equal(await eco.locator("picture, p:not([class*=parentKicker]), dl, dd, a, [data-franchise]").count(), 0);
      const text = norm(await eco.innerText());
      assert.doesNotMatch(text, /TP\. Hồ Chí Minh|Đà Nẵng|Ho Chi Minh|Da Nang|\d|nhượng quyền|franchis/i);
    });
    await check(`${tag}: franchising still names only Bare Boutique Stays and Pepper House`, async () => {
      const text = norm(await page.locator("#dich-vu-nhuong-quyen").innerText());
      assert.ok(text.includes(norm(want.card[2])) && text.includes(norm(want.description[2])));
      assert.doesNotMatch(text, /Nắng/);
      assert.equal(await page.locator("#dich-vu-nhuong-quyen img[src*='the-nang']").count(), 0);
    });
    await check(`${tag}: FAQ is client questions 2, 4 and 5`, async () => {
      const qs = (await page.locator("#hoi-dap summary").allInnerTexts()).map(norm);
      assert.deepEqual(qs, [want.faq[1], want.faq[3], want.faq[4]].map((f) => norm(f.q)));
      assert.equal(norm(await page.locator("#hoi-dap details p").first().innerText()), norm(want.faq[1].a));
    });
    await check(`${tag}: one form, real contact channels, photos with alt text`, async () => {
      assert.equal(await page.locator("main form").count(), 1);
      assert.equal(await page.locator('main a[href="tel:+84906988261"]').count(), 1);
      assert.equal(await page.locator('main a[href="mailto:hello@vnest.com.vn"]').count(), 1);
      const photos = await page.locator("main picture img").evaluateAll((all) => all.map((i) => i.alt));
      assert.equal(photos.length, 3, `photos ${photos.length}: hero, service 01, Why VNest`);
      assert.ok(photos.every((alt) => alt.length > 10), "every photograph has alt text");
    });
    await check(`${tag}: no caption over or under any photograph`, async () => {
      assert.equal(await page.locator("main figcaption, main [class*=caption], main [class*=photoNote]").count(), 0);
      const text = norm(await page.locator("main").innerText());
      assert.doesNotMatch(text, /Ảnh minh hoạ|Illustration ·|Bare Chic Three|Pepper House 3rd Floor|Pepper House 4th Floor|Bare Chic One|Pale Blue Eyes/);
    });
    await check(`${tag}: every partner CTA is the two-state wipe at rest`, async () => {
      const ctas = page.locator("main a[href='#tu-van'][class*=cta], main a[data-service]");
      assert.equal(await ctas.count(), 4, "hero + three services");
      for (let i = 0; i < 4; i++) await assertPartnerCta(ctas.nth(i), `${tag} CTA ${i}`);
      const leftover = await page.locator("main").evaluate((m) => [...m.querySelectorAll("a")].filter((a) => /[→↗↑]/.test(a.textContent) && getComputedStyle(a).textDecorationLine.includes("underline")).length);
      assert.equal(leftover, 0, "no underlined arrow link");
    });
    await check(`${tag}: no layout shift while the page settles`, async () => {
      const cls = await page.evaluate(
        () =>
          new Promise((resolve) => {
            let total = 0;
            new PerformanceObserver((list) => {
              for (const e of list.getEntries()) if (!e.hadRecentInput) total += e.value;
            }).observe({ type: "layout-shift", buffered: true });
            setTimeout(() => resolve(total), 600);
          }),
      );
      assert.ok(cls < 0.02, `CLS ${cls}`);
    });
    await check(`${tag}: no overflow or clipped text`, async () => assertLayout(await layout(page, "main"), tag));
    await check(`${tag}: hero service links reach each service`, async () => {
      for (const id of SERVICES) {
        await tap(page.locator(`nav a[href="#dich-vu-${id}"]`));
        await page.waitForTimeout(150);
        const top = await page.locator(`#dich-vu-${id}`).evaluate((el) => el.getBoundingClientRect().top);
        assert.ok(top >= 0 && top < 200, `${id} at ${top}`);
      }
    });
    await check(`${tag}: each service CTA chooses its service in the form`, async () => {
      for (const id of SERVICES) {
        const cta = page.locator(`#dich-vu-${id} a[data-service]`);
        await cta.scrollIntoViewIfNeeded();
        await tap(cta);
        await page.waitForTimeout(250);
        assert.match(page.url(), new RegExp(`dich-vu=${id}.*#tu-van$`));
        assert.equal(await page.locator(`#tu-van input[value="${id}"]`).isChecked(), true);
        assert.ok(await page.locator("#tu-van").evaluate((el) => el.getBoundingClientRect().top < window.innerHeight), "form in view");
        assert.match(page.url(), /\/dev\/demo\/hop-tac/, "stays on the page");
      }
    });
    await check(`${tag}: the hero CTA reaches the form; a valid request says it was not sent`, async () => {
      await page.evaluate(() => window.scrollTo(0, 0));
      await tap(page.locator(".__never, main a[href='#tu-van']").first());
      await page.waitForTimeout(250);
      assert.ok(await page.locator("#tu-van").evaluate((el) => el.getBoundingClientRect().top < window.innerHeight));
      await page.locator('#tu-van input[name="name"]').fill("Nguyễn Văn A");
      await page.locator('#tu-van input[name="reach"]').fill("0905 123 456");
      await tap(page.locator('#tu-van button[type="submit"]'));
      const status = norm(await page.locator('#tu-van [role="status"]').innerText());
      assert.match(status, lang === "en" ? /^Not sent\./ : /^Chưa gửi\./);
    });
    await check(`${tag}: language switch keeps the page and the service`, async () => {
      const other = lang === "en" ? "vi" : "en";
      // The header's own switch (the menu dialog has a second one).
      const sw = page.locator(`header [data-testid=language-switch]:not(dialog *) a[data-locale="${other}"]`);
      if (!(await sw.isVisible())) return; // phones: the switch is in the menu; checked at the wider widths
      await tap(sw);
      await page.waitForURL(other === "en" ? /lang=en/ : (url) => !url.toString().includes("lang=en"));
      await page.waitForTimeout(300);
      const url = new URL(page.url());
      assert.equal(url.pathname, "/dev/demo/hop-tac");
      assert.equal(url.searchParams.get("dich-vu"), "nhuong-quyen", "the chosen service stays in the address");
      assert.equal(norm(await page.locator("h1").innerText()), other === "en" ? "Partner with VNest." : "Hợp tác cùng VNest.");
    });
    await check(`${tag}: no console errors or hydration warnings`, async () => assert.deepEqual(errors, []));
  } finally {
    await context.close();
  }
}

/** Where the Copper face's right edge is, as a share of the button (0 = hidden, 1 = covering it all). */
const progress = (locator) =>
  locator.evaluate((el) => {
    const m = getComputedStyle(el.children[1]).clipPath.match(/inset\(0px ([\d.]+)(px|%)/);
    if (!m) return getComputedStyle(el.children[1]).clipPath === "inset(0px)" ? 1 : NaN;
    const right = m[2] === "%" ? Number(m[1]) / 100 : Number(m[1]) / el.getBoundingClientRect().width;
    return 1 - right;
  });

/**
 * Sample points across the button: is the topmost thing at each the Copper face (or its content)? The face ignores the
 * pointer (so the link stays the target), which hit-testing would skip; it takes the pointer only while sampled.
 */
const coveredEverywhere = (locator) =>
  locator.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const fill = el.children[1];
    const was = fill.style.pointerEvents;
    fill.style.pointerEvents = "auto";
    const xs = [0.02, 0.15, 0.3, 0.5, 0.7, 0.85, 0.95, 0.985];
    const ys = [0.15, 0.5, 0.85];
    const ok = xs.flatMap((fx) => ys.map((fy) => document.elementsFromPoint(r.left + r.width * fx, r.top + r.height * fy)[0])).every((top) => top === fill || fill.contains(top));
    fill.style.pointerEvents = was;
    return ok;
  });

/** The clip-path transition running on the Copper face right now, if any: its duration (ms) and play state. */
const running = (locator) =>
  locator.evaluate((el) => {
    const a = el.children[1].getAnimations().find((x) => x.transitionProperty === "clip-path");
    return a ? { duration: Number(a.effect.getTiming().duration), state: a.playState } : null;
  });

/** The partner wipe: hover to full Copper, reverse, focus, reduced motion; the homepage CTA: no wipe. */
async function ctaBehaviour(lang) {
  for (const width of [1440, 1024]) {
    for (const motion of ["no-preference", "reduce"]) {
      const tag = `cta ${lang} ${width} ${motion}`;
      const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: motion });
      const page = await context.newPage();
      await page.goto(`${BASE}/dev/demo/hop-tac?lang=${lang}`, { waitUntil: "networkidle" });
      for (const [name, selector] of [
        ["hero", "main a[href='#tu-van'][class*=cta]"],
        ["service", "#dich-vu-tu-van-mo-hinh a[data-service]"],
      ]) {
        const cta = page.locator(selector);
        await cta.scrollIntoViewIfNeeded();
        await page.mouse.move(0, 0);
        await page.waitForTimeout(450);
        await check(`${tag} ${name}: at rest the Copper face is hidden`, async () => assert.equal(await progress(cta), 0));
        await check(`${tag} ${name}: transition ${motion === "reduce" ? "off" : "250–350 ms"}`, async () => {
          const d = await cta.evaluate((el) => getComputedStyle(el.children[1]).transitionDuration);
          if (motion === "reduce") assert.match(d, /^0s/);
          else assert.ok(parseFloat(d) >= 0.25 && parseFloat(d) <= 0.35, d);
        });
        const arrowAt = () => cta.evaluate((el) => [...el.querySelectorAll("svg")].map((s) => Math.round(s.getBoundingClientRect().left)));
        const restArrow = await arrowAt();
        await cta.hover();
        if (motion !== "reduce") {
          const wipe = await running(cta);
          await page.waitForTimeout(100);
          await check(`${tag} ${name}: the wipe runs left to right`, async () => {
            assert.ok(wipe && wipe.duration >= 250 && wipe.duration <= 350 && wipe.state === "running", JSON.stringify(wipe));
            const p = await progress(cta);
            assert.ok(p > 0 && p <= 1, `under way ${p}`);
          });
        }
        await page.waitForTimeout(450);
        await check(`${tag} ${name}: hover ends fully Copper, white label, no white patch, one object`, async () => {
          assert.equal(await progress(cta), 1);
          assert.equal(await coveredEverywhere(cta), true, "the Copper face covers every sample point, the arrow area included");
          const look = await cta.evaluate((el) => ({ outline: getComputedStyle(el).outlineStyle, scale: getComputedStyle(el).scale, transform: getComputedStyle(el).transform }));
          assert.equal(look.outline, "none", "no ring on hover");
          assert.ok((look.scale === "none" || look.scale === "1") && look.transform === "none", "no scaling");
          assert.deepEqual(await arrowAt(), restArrow, "the arrow stays still");
        });
        await page.mouse.move(0, 0);
        if (motion !== "reduce") {
          const back = await running(cta);
          await check(`${tag} ${name}: it reverses smoothly`, async () => {
            assert.ok(back && back.duration >= 250 && back.duration <= 350 && back.state === "running", `a reverse transition runs: ${JSON.stringify(back)}`);
          });
        }
        await page.waitForTimeout(450);
        await check(`${tag} ${name}: back to rest`, async () => assert.equal(await progress(cta), 0));
      }
      await check(`${tag}: keyboard focus fills the button and shows a ring`, async () => {
        const cta = page.locator("#dich-vu-tu-van-mo-hinh a[data-service]");
        await page.locator("#dich-vu-tu-van-mo-hinh h3").click();
        for (let i = 0; i < 8 && !(await cta.evaluate((el) => el === document.activeElement)); i++) await page.keyboard.press("Tab");
        assert.equal(await cta.evaluate((el) => el === document.activeElement), true, "reached by Tab");
        await page.waitForTimeout(450);
        assert.equal(await progress(cta), 1);
        assert.equal(await cta.evaluate((el) => getComputedStyle(el).outlineStyle), "solid");
      });
      // The homepage: hover darkens the solid Copper; nothing wipes.
      await page.goto(`${BASE}/dev/demo?intro=0&lang=${lang}`, { waitUntil: "networkidle" });
      const home = page.locator("#hop-tac [role=region]:not([inert]) a");
      await home.scrollIntoViewIfNeeded();
      await home.hover();
      await page.waitForTimeout(400);
      await check(`${tag}: the homepage CTA has no wipe`, async () => {
        const look = await home.evaluate((el) => ({ bg: getComputedStyle(el).backgroundColor, clipped: [...el.querySelectorAll("*")].filter((n) => getComputedStyle(n).clipPath !== "none").length }));
        assert.equal(look.bg, "rgb(143, 96, 54)", "the approved hover: a slightly deeper Copper");
        assert.equal(look.clipped, 0);
        assert.equal(await page.locator("#hop-tac [class*=fill], #hop-tac [class*=face]").count(), 0, "no wipe layers on the homepage");
      });
      await context.close();
    }
  }
}

for (const lang of ["vi", "en"]) {
  await ctaBehaviour(lang);
  for (const width of WIDTHS) {
    await homepage(width, lang);
    await partnerPage(width, lang);
  }
}
await browser.close();

lines.push(`CTA correction QA · ${new Date().toISOString()} · ${BASE}`);
lines.push(`passed ${passed}, failed ${failures.length}`);
lines.push(...failures.map((f) => `FAIL ${f}`));
writeFileSync(OUT, `${lines.join("\n")}\n`);
console.log(lines.join("\n"));
process.exit(failures.length ? 1 : 0);

