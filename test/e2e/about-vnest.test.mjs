/**
 * About VNest V2 — "The Art of Staying": real-browser checks (Playwright Chromium).
 *   VNEST_TEST_URL=http://localhost:3402 node --test test/e2e/about-vnest.test.mjs
 */
import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import { chromium } from "/Users/noe/Documents/GitHub/Cigarettes-After-Sex/node_modules/.pnpm/playwright@1.62.1/node_modules/playwright/index.mjs";

const BASE = process.env.VNEST_TEST_URL ?? "http://localhost:3402";
const VIEWPORTS = [
  { name: "375", width: 375, height: 812, isMobile: true, hasTouch: true },
  { name: "390", width: 390, height: 844, isMobile: true, hasTouch: true },
  { name: "430", width: 430, height: 932, isMobile: true, hasTouch: true },
  { name: "768", width: 768, height: 1024, isMobile: true, hasTouch: true },
  { name: "1440", width: 1440, height: 900, isMobile: false, hasTouch: false },
];

let browser;
before(async () => {
  browser = await chromium.launch();
});
after(async () => {
  await browser?.close();
});

async function open(viewport) {
  const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, isMobile: viewport.isMobile, hasTouch: viewport.hasTouch });
  const page = await context.newPage();
  const errors = [];
  page.on("console", (m) => {
    if (m.type() === "error" && !m.text().startsWith("Failed to load resource")) errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(`${BASE}/dev/demo?intro=0`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  return { page, context, errors };
}

describe("About VNest V2", () => {
  for (const viewport of VIEWPORTS) {
    test(`@${viewport.name}: editorial banner, real text, no imagery, no overflow, not full-height`, async () => {
      const { page, context, errors } = await open(viewport);
      const section = page.locator("section#ve-vnest");
      assert.equal(await section.count(), 1, "the #ve-vnest anchor is kept");
      const facts = await section.evaluate((el) => {
        const style = getComputedStyle(el);
        const h2 = el.querySelector("h2");
        const accent = [...el.querySelectorAll("span")].find((s) => s.textContent === "Ở.");
        const rest = [...el.querySelectorAll("span")].find((s) => s.textContent === "Theo cách riêng.");
        const title = el.querySelector("h2");
        const lines = (node) => Math.round(node.getBoundingClientRect().height / parseFloat(getComputedStyle(node).lineHeight));
        return {
          background: style.backgroundColor,
          color: style.color,
          heading: h2?.textContent,
          headingId: h2?.id,
          labelledBy: el.getAttribute("aria-labelledby"),
          images: el.querySelectorAll("img, picture, svg, figure").length,
          lists: el.querySelectorAll("ul, ol, dl").length,
          text: el.innerText,
          height: el.getBoundingClientRect().height,
          accentColor: accent && getComputedStyle(accent).color,
          accentFont: accent && getComputedStyle(accent).fontFamily,
          accentStyle: accent && getComputedStyle(accent).fontStyle,
          accentSize: accent && parseFloat(getComputedStyle(accent).fontSize),
          titleSize: parseFloat(getComputedStyle(title).fontSize),
          restLines: rest && lines(rest),
          overflowX: document.documentElement.scrollWidth - window.innerWidth,
          sectionOverflow: el.scrollWidth - el.clientWidth,
        };
      });
      assert.equal(facts.background, "rgb(55, 65, 47)", "Dark Olive #37412F");
      assert.equal(facts.color, "rgb(241, 236, 228)", "text #F1ECE4");
      assert.equal(facts.heading, "ABOUT VNEST.");
      assert.equal(facts.labelledBy, facts.headingId, "the section is named by its heading");
      assert.equal(facts.images, 0, "no photographs or symbols");
      assert.equal(facts.lists, 0, "no brand list");
      assert.match(facts.text, /VNEST \/ OUR STORY/);
      assert.match(facts.text, /Ở\.\s*Theo cách riêng\./);
      assert.match(facts.text, /Từ Bare Boutique Stays đến The Nắng Suites và Pepper House/);
      assert.doesNotMatch(facts.text, /Mỗi không gian, một câu chuyện riêng|Hệ sinh thái lưu trú đang vận hành|Ấm áp/, "old About content removed");
      assert.equal(facts.accentColor, "rgb(168, 116, 68)", "copper #A87444");
      assert.match(facts.accentFont, /Cormorant/i);
      assert.equal(facts.accentStyle, "italic");
      assert.ok(facts.accentSize > facts.titleSize, `"Ở." (${facts.accentSize}px) is larger than the title (${facts.titleSize}px)`);
      assert.equal(facts.restLines, 1, '"Theo cách riêng." never breaks');
      assert.ok(facts.height < viewport.height * (viewport.width < 768 ? 1.05 : 0.75), `not full-height (${Math.round(facts.height)}px)`);
      assert.ok(facts.overflowX <= 0, "no horizontal page overflow");
      assert.ok(facts.sectionOverflow <= 0, "nothing overflows the section");
      const cta = section.getByRole("link", { name: /Liên hệ VNest/ });
      assert.ok((await cta.boundingBox()).height >= 44, "CTA is touch-sized");
      assert.deepEqual(errors, []);
      await context.close();
    });
  }

  // Client review 6/11/2026: the CTA reads "Liên hệ VNest" and leads to the contact section (was "Khám phá các không gian" → #kham-pha).
  test("CTA scrolls to the contact section without changing the address; it is a real link to #lien-he", async () => {
    const { page, context, errors } = await open(VIEWPORTS[1]);
    const before = page.url();
    const cta = page.locator("#ve-vnest").getByRole("link", { name: /Liên hệ VNest/ });
    assert.equal(await cta.getAttribute("href"), "/dev/demo#lien-he", "a real link to the contact section");
    await cta.scrollIntoViewIfNeeded();
    await cta.tap();
    await page.waitForFunction(() => Math.abs(document.getElementById("lien-he").getBoundingClientRect().top) < 120, null, { timeout: 5000 });
    assert.equal(page.url(), before, "no new history entry or hash");
    assert.deepEqual(errors, []);
    await context.close();
  });

  // Owner's Phase A corrections (7/11/2026): the menu is Khám phá nơi ở · Hợp tác cùng VNest · QA · Liên hệ; "Về VNest" is
  // reached from the footer.
  test("@390: the footer link 'Về VNest' still reaches the section", async () => {
    const { page, context, errors } = await open(VIEWPORTS[1]);
    await page.locator("footer a", { hasText: "Về VNest" }).tap();
    await page.waitForFunction(() => Math.abs(document.getElementById("ve-vnest").getBoundingClientRect().top) < 120, null, { timeout: 5000 });
    assert.equal(await page.evaluate(() => document.documentElement.style.overflow), "", "scroll lock released");
    assert.deepEqual(errors, []);
    await context.close();
  });

  test("the homepage keeps one h1 and About sits between the stays and the services", async () => {
    const { page, context } = await open(VIEWPORTS[4]);
    const order = await page.evaluate(() => [...document.querySelectorAll("main section[id]")].map((s) => s.id));
    const i = order.indexOf("ve-vnest");
    assert.ok(i > order.indexOf("kham-pha") && i < order.indexOf("hop-tac"), `order ${order.join(" > ")}`);
    assert.equal(await page.locator("h1").count(), 1);
    await context.close();
  });
});

describe("About VNest V2 — bilingual compositions", () => {
  const LANGS = {
    vi: { display: "Ở.", supporting: "Theo cách riêng.", cta: "Liên hệ VNest", url: "/dev/demo?intro=0" },
    en: { display: "Stay.", supporting: "Your way.", cta: "Contact VNest", url: "/dev/demo?intro=0&lang=en" },
  };
  for (const [lang, expected] of Object.entries(LANGS)) {
    for (const viewport of [VIEWPORTS[0], VIEWPORTS[1], VIEWPORTS[3], VIEWPORTS[4]]) {
      test(`${lang} @${viewport.name}: composition, no clipping, no awkward wrap, no overflow, no layout shift`, async () => {
        const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, isMobile: viewport.isMobile, hasTouch: viewport.hasTouch });
        const page = await context.newPage();
        const errors = [];
        page.on("pageerror", (e) => errors.push(String(e)));
        page.on("console", (m) => {
          if (m.type() === "error" && !m.text().startsWith("Failed to load resource")) errors.push(m.text());
        });
        // The section's own layout as first parsed (before the serif may have loaded), relative to the section, so movement
        // caused by other sections is not counted. Compared below with the layout once the fonts are ready.
        await page.addInitScript(() => {
          const snapshot = () => {
            const el = document.getElementById("ve-vnest");
            if (!el) return null;
            const box = el.getBoundingClientRect();
            return [...el.querySelectorAll("h2, p, a")].map((node) => {
              const r = node.getBoundingClientRect();
              return [Math.round(r.left - box.left), Math.round(r.top - box.top), Math.round(r.width), Math.round(r.height)];
            });
          };
          document.addEventListener("DOMContentLoaded", () => {
            window.__aboutFirst = snapshot();
            window.__aboutSnapshot = snapshot;
          });
        });
        await page.goto(`${BASE}${expected.url}`, { waitUntil: "networkidle" });
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(400);
        const facts = await page.locator("section#ve-vnest").evaluate((el) => {
          const accent = el.querySelector("p > span");
          const rest = accent?.nextElementSibling;
          const lines = (node) => Math.round(node.getBoundingClientRect().height / parseFloat(getComputedStyle(node).lineHeight));
          const clipped = [...el.querySelectorAll("p, h2, a, span")].filter((node) => node.scrollWidth > node.clientWidth + 1 && getComputedStyle(node).display !== "inline").map((node) => node.textContent);
          const box = el.getBoundingClientRect();
          const a = accent.getBoundingClientRect();
          const title = el.querySelector("h2");
          return {
            lang: el.lang,
            text: el.innerText,
            accent: accent?.textContent,
            rest: rest?.textContent,
            restLines: rest && lines(rest),
            sameRow: rest && Math.abs(rest.getBoundingClientRect().bottom - a.bottom) < a.height,
            accentInside: a.left >= box.left && a.right <= box.right && a.top >= box.top,
            accentSize: parseFloat(getComputedStyle(accent).fontSize),
            titleSize: parseFloat(getComputedStyle(title).fontSize),
            accentFont: getComputedStyle(accent).fontFamily,
            fontLoaded: document.fonts.check(`italic 500 40px ${getComputedStyle(accent).fontFamily.split(",")[0]}`, accent.textContent),
            titleLines: lines(title),
            clipped,
            overflowX: document.documentElement.scrollWidth - window.innerWidth,
            cta: el.querySelector("a")?.textContent?.replace(/[↗→]/, "").trim(),
            ctaHref: el.querySelector("a")?.getAttribute("href"),
            shift: (() => {
              const first = window.__aboutFirst;
              const now = window.__aboutSnapshot();
              if (!first || !now) return Infinity;
              return Math.max(...first.flatMap((row, i) => row.map((v, j) => Math.abs(v - now[i][j]))));
            })(),
          };
        });
        assert.equal(facts.lang, lang, "the section declares its language");
        assert.equal(facts.accent, expected.display);
        assert.equal(facts.rest, expected.supporting);
        assert.equal(facts.cta, expected.cta);
        assert.equal(facts.ctaHref, "/dev/demo#lien-he");
        if (lang === "en") assert.doesNotMatch(facts.text.replace("The Nắng Suites", ""), /[ơưđăâêôạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/i, "no Vietnamese copy on the English page");
        assert.match(facts.accentFont, /Cormorant/i);
        assert.equal(facts.fontLoaded, true, "the serif italic is loaded for these glyphs");
        assert.ok(facts.accentSize > facts.titleSize, `display word (${facts.accentSize}px) is the strongest type (title ${facts.titleSize}px)`);
        assert.equal(facts.restLines, 1, "the supporting line never breaks");
        assert.equal(facts.sameRow, true, "display word and supporting line share one row");
        assert.ok(facts.titleLines <= 2, `title on at most two lines (${facts.titleLines})`);
        assert.equal(facts.accentInside, true, "the display word (with its diacritic) is not cut by the section");
        assert.deepEqual(facts.clipped, [], "no clipped text");
        assert.ok(facts.overflowX <= 0, "no horizontal overflow");
        assert.ok(facts.shift <= 1, `the section's text does not move when the serif loads (max ${facts.shift}px)`);
        assert.deepEqual(errors, []);
        await context.close();
      });
    }
  }
});
