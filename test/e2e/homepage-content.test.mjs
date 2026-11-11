/**
 * Homepage content completion (client document "05.11.2026_Final", which replaces the 04.11 draft): real-browser checks of the brand index, the three services
 * and the six FAQs, in Vietnamese and English (private `?lang=en` preview), at 375 / 390 / 768 / 1440.
 * The expected text is read from the document's own text (docs/content/homepage-content-2026-11-05/), not from the code.
 *   VNEST_TEST_URL=http://localhost:3402 node --test test/e2e/homepage-content.test.mjs
 *   SHOTS=docs/qa/homepage-content-2026-11-05/screens  (optional: writes section screenshots)
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { after, before, describe, test } from "node:test";
import { chromium } from "/Users/noe/Documents/GitHub/Cigarettes-After-Sex/node_modules/.pnpm/playwright@1.62.1/node_modules/playwright/index.mjs";

const BASE = process.env.VNEST_TEST_URL ?? "http://localhost:3402";
const SHOTS = process.env.SHOTS;
const VIEWPORTS = [
  { name: "375", width: 375, height: 812, isMobile: true, hasTouch: true },
  { name: "390", width: 390, height: 844, isMobile: true, hasTouch: true },
  { name: "768", width: 768, height: 1024, isMobile: true, hasTouch: true },
  { name: "1440", width: 1440, height: 900, isMobile: false, hasTouch: false },
];

// The two approved brand-name corrections (owner decision 5/11/2026), the only exceptions to verbatim matching. Mirrors
// BRAND_NAME_NORMALISATION in src/features/demo/brand-copy.ts.
const DOC = readFileSync(new URL("../../docs/content/homepage-content-2026-11-05/vnest-website-content-2026-11-05-final.txt", import.meta.url), "utf8")
  .replace(/\bVnest\b/g, "VNest")
  .replace(/\bThe Nang Suites\b/g, "The Nắng Suites");
const split = DOC.indexOf("B. ENGLISH");
const all = (text, re) => [...text.matchAll(re)].map((m) => m[1].trim());
function expected(text) {
  const bullets = all(text, /^\t•\t(.+)$/gm);
  const faq = [...text.matchAll(/^(\d)\. (.+)\n(.+)$/gm)].map((m) => ({ q: m[2].trim(), a: m[3].trim() }));
  return {
    hover: all(text, /^Brand Hover: (.+)$/gm),
    positioning: all(text, /^Brand Positioning: (.+)$/gm),
    about: all(text, /^Brand About: (.+)$/gm),
    card: all(text, /^Service Card: (.+)$/gm),
    description: all(text, /^Expanded Description: (.+)$/gm),
    highlights: [bullets.slice(0, 3), bullets.slice(3, 6), bullets.slice(6, 9)],
    faq,
  };
}
const EXPECTED = { vi: expected(DOC.slice(0, split)), en: expected(DOC.slice(split)) };

let browser;
before(async () => {
  browser = await chromium.launch();
});
after(async () => {
  await browser?.close();
});

async function open(viewport, lang) {
  const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, isMobile: viewport.isMobile, hasTouch: viewport.hasTouch });
  const page = await context.newPage();
  const errors = [];
  page.on("console", (m) => {
    if (m.type() === "error" && !m.text().startsWith("Failed to load resource")) errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(`${BASE}/dev/demo?intro=0${lang === "en" ? "&lang=en" : ""}`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  return { page, context, errors };
}

const norm = (s) => s.replace(/\s+/g, " ").trim();
const press = (page, locator, touch) => (touch ? locator.tap() : locator.click());

/** No horizontal page overflow, and no element inside the section wider than the section. */
async function assertNoOverflow(page, selector) {
  const result = await page.evaluate((sel) => {
    const section = document.querySelector(sel);
    const box = section.getBoundingClientRect();
    const wide = [...section.querySelectorAll("*")]
      .filter((el) => getComputedStyle(el).position !== "fixed" && el.getAttribute("aria-hidden") !== "true" && !el.closest("[aria-hidden='true']"))
      .filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && (r.left < box.left - 1 || r.right > box.right + 1);
      })
      .map((el) => `${el.tagName}.${el.className}`.slice(0, 80));
    const clipped = [...section.querySelectorAll("p, li, summary, h2, h3, button, dd")]
      .filter((el) => el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflowX !== "visible")
      .map((el) => `${el.tagName}:${el.textContent.slice(0, 40)}`);
    return { page: document.documentElement.scrollWidth - window.innerWidth, wide, clipped };
  }, selector);
  assert.ok(result.page <= 0, `${selector}: page scrolls sideways by ${result.page}px`);
  assert.deepEqual(result.wide, [], `${selector}: elements outside the section`);
  assert.deepEqual(result.clipped, [], `${selector}: clipped text`);
}

async function shot(page, selector, file) {
  if (!SHOTS) return;
  await page.addStyleTag({ content: "#top{visibility:hidden!important}" }).catch(() => {});
  await page.locator(selector).screenshot({ path: `${SHOTS}/${file}`, animations: "disabled" });
  await page.addStyleTag({ content: "#top{visibility:visible!important}" }).catch(() => {});
}

describe("Homepage content completion", () => {
  for (const lang of ["vi", "en"]) {
    const want = EXPECTED[lang];
    test(`the document parses into 3 brands, 3 services and 6 FAQs (${lang})`, () => {
      for (const key of ["hover", "positioning", "about", "card", "description"]) assert.equal(want[key].length, 3, key);
      assert.ok(want.highlights.every((h) => h.length === 3));
      assert.equal(want.faq.length, 6);
    });

    for (const viewport of VIEWPORTS) {
      const touch = viewport.hasTouch;
      test(`${lang} @ ${viewport.name}: brands, services and FAQs show the client's copy, readable, no overflow`, async () => {
        const { page, context, errors } = await open(viewport, lang);
        try {
          for (const id of ["thuong-hieu", "hop-tac", "hoi-dap"]) assert.equal(await page.locator(`#${id}`).getAttribute("lang"), lang, `#${id} lang`);
          for (const id of ["thuong-hieu", "hop-tac", "hoi-dap"]) assert.doesNotMatch(await page.locator(`#${id}`).innerText(), /DRAFT|Hạng mục \d|5–10 từ|do VNest cung cấp/, `#${id} placeholder`);
          for (const id of ["thuong-hieu", "hop-tac", "hoi-dap"]) assert.doesNotMatch(await page.locator(`#${id}`).innerText(), /\bVnest\b|The Nang Suites/, `#${id} brand spelling`);

          // 1. Brands. Phase B (owner, 7/11/2026): the rows are buttons, each controlling its own panel (was a tablist), in the
          // order Bare → Pepper House → The Nắng; nothing is selected at first. The client's copy is matched by brand, since the
          // document lists the brands as Bare, The Nắng, Pepper House. The checks themselves are unchanged.
          const DOC_INDEX = { bare: 0, "the-nang": 1, "pepper-house": 2 };
          const rows = page.locator("#thuong-hieu button[aria-controls]");
          assert.equal(await rows.count(), 3);
          assert.deepEqual(await rows.evaluateAll((els) => els.map((el) => el.dataset.brand)), ["bare", "pepper-house", "the-nang"]);
          assert.equal(await page.locator('#thuong-hieu button[aria-expanded="true"]').count(), 0, "no brand selected at first");
          for (let i = 0; i < 3; i++) {
            const d = DOC_INDEX[await rows.nth(i).getAttribute("data-brand")];
            await press(page, rows.nth(i), touch);
            await page.waitForTimeout(400);
            assert.equal(await rows.nth(i).getAttribute("aria-expanded"), "true");
            const panel = norm(await page.locator(`[id="${await rows.nth(i).getAttribute("aria-controls")}"]`).innerText());
            assert.ok(panel.includes(norm(want.positioning[d])), `brand ${i} positioning`);
            assert.ok(panel.includes(norm(want.about[d])), `brand ${i} about`);
            await assertNoOverflow(page, "#thuong-hieu");
            if (i === 0) await shot(page, "#thuong-hieu", `brands-${lang}-${viewport.name}.png`);
          }
          // Desktop: hovering another brand shows its Brand Hover line in the preview over the stage.
          if (!touch && viewport.width >= 1024) {
            await press(page, rows.nth(0), false);
            await page.mouse.move(0, 0);
            await rows.nth(1).hover();
            const preview = page.locator("#thuong-hieu [data-preview][data-shown]");
            await page.waitForTimeout(500);
            assert.ok(norm(await preview.innerText()).includes(norm(want.hover[DOC_INDEX["pepper-house"]])), "hover preview");
            await shot(page, "#thuong-hieu", `brands-${lang}-${viewport.name}-hover.png`);
            await rows.nth(2).hover();
            await page.waitForTimeout(400);
            assert.ok(norm(await preview.innerText()).includes(norm(want.hover[DOC_INDEX["the-nang"]])), "hover preview 3");
            await page.keyboard.press("Escape");
            await page.mouse.move(0, 0);
          }

          // 2. Services: three rows with the client's card line; each opens its description and one CTA. Since the owner's
          //    review of 8/11/2026 the panel neither repeats the service title nor lists the three highlights (they restated
          //    the description; the client's lines stay in owner-journey.ts and are checked by the unit tests). Since
          //    9/11/2026 the section is the Visual Accordion (client decision): each row has its own region, closed ones
          //    stay in the page as `inert`, the CTA is a link, and 02's planning drawing labels its layers with the
          //    highlights (decorative, aria-hidden), which the list check below therefore skips. Since 10/11/2026 every row
          //    starts closed (owner), and the link to the partner page is the section's footer row.
          const cards = page.locator("#hop-tac button[aria-expanded]");
          assert.equal(await cards.count(), 3);
          const expandedNow = () => cards.evaluateAll((all) => all.map((b) => b.getAttribute("aria-expanded")));
          assert.deepEqual(await expandedNow(), ["false", "false", "false"], "every service closed on arrival");
          assert.equal(await page.locator("#hop-tac [role=region]").evaluateAll((all) => all.every((el) => el.inert)), true, "every region closed on arrival");
          for (let i = 0; i < 3; i++) {
            assert.ok(norm(await cards.nth(i).innerText()).includes(norm(want.card[i])), `card ${i} line`);
            assert.equal(await cards.nth(i).getAttribute("aria-expanded"), "false", `service ${i} closed before it is chosen`);
            await press(page, cards.nth(i), touch);
            await page.waitForTimeout(300);
            assert.equal(await cards.nth(i).getAttribute("aria-expanded"), "true");
            assert.deepEqual(await expandedNow(), ["false", "false", "false"].map((v, k) => (k === i ? "true" : v)), `only service ${i} open`);
            const region = page.locator(`#hop-tac [id="${await cards.nth(i).getAttribute("aria-controls")}"]`);
            assert.equal(await region.getAttribute("role"), "region");
            assert.equal(await region.evaluate((el) => el.inert), false, `service ${i} region open`);
            assert.ok(norm(await region.innerText()).includes(norm(want.description[i])), `service ${i} description`);
            const listed = await region.evaluate((el) => [...el.querySelectorAll("li, h3")].filter((n) => !n.closest("[aria-hidden='true']")).length);
            assert.equal(listed, 0, `service ${i}: no highlight list or repeated title`);
            assert.equal(await region.locator("a, button").count(), 1, `service ${i}: one CTA`);
            await assertNoOverflow(page, "#hop-tac");
            if (i === 0) await shot(page, "#hop-tac", `services-${lang}-${viewport.name}.png`);
          }
          // Choosing the open card again closes it (existing interaction kept), which leaves none open.
          await press(page, cards.nth(2), touch);
          assert.equal(await cards.nth(2).getAttribute("aria-expanded"), "false");
          assert.equal(await page.locator("#hop-tac [role=region]").evaluateAll((all) => all.every((el) => el.inert)), true, "every region closed");

          // The section's footer row: one link to the partner page, its label on the names' column, its arrow on the
          // toggles' column, right after the last row.
          const more = page.locator("#hop-tac [data-partner-page-link]");
          assert.equal(await more.count(), 1);
          assert.equal(await more.getAttribute("href"), lang === "en" ? "/dev/demo/hop-tac?lang=en" : "/dev/demo/hop-tac");
          const footer = await page.locator("#hop-tac").evaluate((section) => {
            const link = section.querySelector("[data-partner-page-link]");
            const label = link.firstElementChild.getBoundingClientRect();
            const arrow = link.lastElementChild.getBoundingClientRect();
            const name = section.querySelector("button[aria-expanded] [class*=name]").getBoundingClientRect();
            const toggle = section.querySelector("button[aria-expanded] [class*=toggle]").getBoundingClientRect();
            const rows = section.querySelector("[class*=rows]").getBoundingClientRect();
            return { label: label.left, name: name.left, arrow: arrow.left + arrow.width / 2, toggle: toggle.left + toggle.width / 2, gap: link.getBoundingClientRect().top - rows.bottom, underline: getComputedStyle(link.firstElementChild).textDecorationLine };
          });
          assert.ok(Math.abs(footer.label - footer.name) <= 1, `label on the names' column (${footer.label} vs ${footer.name})`);
          assert.ok(Math.abs(footer.arrow - footer.toggle) <= 1.5, `arrow on the toggles' column (${footer.arrow} vs ${footer.toggle})`);
          assert.ok(Math.abs(footer.gap) <= 1, "right after the last row's divider");
          assert.equal(footer.underline, "none", "no permanent underline");

          // 3. FAQs: six client questions in order, full answers, one open at a time.
          const items = page.locator("#hoi-dap details");
          assert.equal(await items.count(), 6);
          const questions = (await page.locator("#hoi-dap summary").allInnerTexts()).map(norm);
          assert.deepEqual(questions, want.faq.map((f) => norm(f.q)));
          // Since 10/11/2026 every question starts closed (owner).
          assert.equal(await items.evaluateAll((all) => all.filter((d) => d.open).length), 0, "every question closed on arrival");
          for (let i = 0; i < 6; i++) {
            const summary = items.nth(i).locator("summary");
            assert.equal(await items.nth(i).evaluate((d) => d.open), false, `faq ${i} closed before it is chosen`);
            await press(page, summary, touch);
            await page.waitForTimeout(80);
            assert.equal(await items.nth(i).evaluate((d) => d.open), true, `faq ${i} opens`);
            assert.equal(norm(await items.nth(i).locator("p").innerText()), norm(want.faq[i].a), `faq ${i} answer`);
            const openCount = await items.evaluateAll((all) => all.filter((d) => d.open).length);
            assert.equal(openCount, 1, "one open at a time");
            await assertNoOverflow(page, "#hoi-dap");
          }
          // Choosing the open question again closes it, which leaves none open.
          await press(page, items.nth(5).locator("summary"), touch);
          assert.equal(await items.evaluateAll((all) => all.filter((d) => d.open).length), 0, "every question closed again");
          await shot(page, "#hoi-dap", `faq-${lang}-${viewport.name}.png`);

          // Keyboard: the summaries stay native, focusable disclosures.
          if (!touch) {
            const s = items.nth(2).locator("summary");
            await s.focus();
            await page.keyboard.press("Enter");
            assert.equal(await items.nth(2).evaluate((d) => d.open), true, "Enter opens a question");
            await page.keyboard.press("Enter");
            assert.equal(await items.nth(2).evaluate((d) => d.open), false, "Enter closes it");
          }
          assert.deepEqual(errors, []);
        } finally {
          await context.close();
        }
      });
    }
  }

  test("the default page is Vietnamese; the header, booking bar and section anchors are unchanged", async () => {
    const { page, context, errors } = await open(VIEWPORTS[3], "vi");
    try {
      assert.equal(await page.locator("#thuong-hieu").getAttribute("lang"), "vi");
      for (const id of ["thuong-hieu", "kham-pha", "ve-vnest", "hop-tac", "lien-he", "hoi-dap"]) assert.equal(await page.locator(`#${id}`).count(), 1, id);
      assert.ok((await page.locator("#hop-tac h2").innerText()).includes("Ba cách VNest đồng hành cùng chủ tài sản."));
      assert.ok((await page.locator("#hoi-dap h2").innerText()).includes("Câu hỏi thường gặp"));
      // The service CTA still carries the service to the consultation form. Since the owner's review of 7/11/2026 the form
      // is its own section after Contact, `#tu-van` (was inside `#lien-he`), so the address and the selector name it.
      // Since 10/11/2026 no service is open on arrival: the visitor opens 01 first.
      assert.equal(await page.locator("#hop-tac [role=region]:not([inert])").count(), 0, "no service open on arrival");
      await page.locator('#hop-tac button[data-service="van-hanh"]').click();
      await page.locator("#hop-tac [role=region]:not([inert]) a").click();
      await page.waitForTimeout(700);
      assert.match(page.url(), /dich-vu=van-hanh#tu-van$/);
      assert.equal(await page.locator('#tu-van input[value="van-hanh"]').isChecked(), true);
      assert.deepEqual(errors, []);
    } finally {
      await context.close();
    }
  });
});
