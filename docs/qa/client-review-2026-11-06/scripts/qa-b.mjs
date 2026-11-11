// Phase B (owner, 7/11/2026): brand showcase #thuong-hieu. Order, neutral state, hover preview, selection, keyboard,
// reduced motion, detail panel composition, "Visit us" without a confirmed URL, alignment, overflow, VI/EN.
// Usage: node docs/qa/client-review-2026-11-06/scripts/qa-b.mjs http://localhost:3401
import { chromium } from "/Users/noe/Documents/GitHub/Cigarettes-After-Sex/node_modules/.pnpm/playwright@1.62.1/node_modules/playwright/index.mjs";
const base = process.argv[2];
const W = [1440, 1024, 768, 430, 390, 375];
const ORDER = ["bare", "pepper-house", "the-nang"];
const NAMES = { bare: "Bare Boutique Stays", "pepper-house": "Pepper House", "the-nang": "The Nắng Suites" };
const browser = await chromium.launch();
const results = [];
const ok = (name, cond, info = "") => results.push(`${cond ? "PASS" : "FAIL"} ${name}${info ? " — " + info : ""}`);
const row = (id) => `#thuong-hieu button[aria-controls][data-brand="${id}"]`;

async function open(width, lang, reduced = false) {
  const mobile = width < 1024;
  const ctx = await browser.newContext({ viewport: { width, height: mobile ? 844 : 900 }, isMobile: mobile, hasTouch: mobile, reducedMotion: reduced ? "reduce" : "no-preference" });
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => m.type() === "error" && !m.text().startsWith("Failed to load resource") && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(`${base}/dev/demo?intro=0${lang === "en" ? "&lang=en" : ""}`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.locator("#thuong-hieu").evaluate((el) => el.scrollIntoView({ block: "start" }));
  await page.waitForTimeout(300);
  return { ctx, page, errors, mobile };
}

/** Geometry and state of the section, in one read. */
const read = (page) =>
  page.evaluate(() => {
    const sec = document.getElementById("thuong-hieu");
    const r = (el) => el.getBoundingClientRect();
    const rows = [...sec.querySelectorAll("button[aria-controls]")];
    const nav = rows[0].parentElement;
    const stage = sec.querySelector("[class*=stage]");
    const head = sec.querySelector("header");
    const shown = (el) => el && getComputedStyle(el).visibility !== "hidden" && getComputedStyle(el).display !== "none" && parseFloat(getComputedStyle(el).opacity) > 0.95 && r(el).height > 0;
    const details = [...sec.querySelectorAll("article")];
    const visibleDetail = details.find(shown);
    const neutral = sec.querySelector("[class*=neutral]");
    const previews = [...sec.querySelectorAll("[data-preview]")];
    const clipped = [...sec.querySelectorAll("p, li, h2, h3, button, dd, dt")]
      .filter((el) => shown(el.closest("article") ?? el) && el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflowX !== "visible")
      .map((el) => el.textContent.slice(0, 30));
    return {
      order: rows.map((b) => b.dataset.brand),
      expanded: rows.map((b) => b.getAttribute("aria-expanded")),
      names: rows.map((b) => b.querySelector("[class*=rowName]").textContent),
      rowBoxes: rows.map((b) => ({ top: r(b).top, bottom: r(b).bottom, height: r(b).height })),
      rowBg: rows.map((b) => getComputedStyle(b).backgroundColor),
      rowLogoOpacity: rows.map((b) => parseFloat(getComputedStyle(b.querySelector("img")).opacity)),
      rowBorders: rows.map((b) => getComputedStyle(b).borderBottomWidth + "/" + getComputedStyle(b).boxShadow),
      navLines: ["::before", "::after"].map((p) => getComputedStyle(nav, p).content).concat(rows.map((b) => getComputedStyle(b, "::after").content)),
      logoRatio: rows.map((b) => {
        const img = b.querySelector("img");
        return Math.abs(r(img).width / r(img).height - img.naturalWidth / img.naturalHeight);
      }),
      nav: { top: r(nav).top, bottom: r(nav).bottom },
      stage: { top: r(stage).top, bottom: r(stage).bottom, height: r(stage).height, display: getComputedStyle(stage).display },
      headBottom: r(head).bottom,
      neutral: shown(neutral),
      bands: neutral ? [...neutral.children].map((b) => ({ top: r(b).top, height: r(b).height })) : [],
      detail: visibleDetail ? visibleDetail.dataset.brand : null,
      detailCount: details.filter(shown).length,
      preview: previews.filter(shown).map((p) => p.dataset.brand),
      previewText: previews.filter(shown).map((p) => p.innerText.replace(/\s+/g, " ").trim())[0] ?? "",
      hint: [...sec.querySelectorAll("p")].some((p) => /Chọn một thương hiệu|Choose a brand/.test(p.textContent) && shown(p)),
      overflow: document.documentElement.scrollWidth - innerWidth,
      clipped,
      facebook: sec.querySelectorAll('a[href*="facebook.com"]').length,
      exploreBtn: [...sec.querySelectorAll("button")].filter((b) => /Khám phá nơi ở|Explore stays/.test(b.textContent)).length,
      scrollY,
      secTop: r(sec).top,
    };
  });

const detailFacts = (page, id) =>
  page.evaluate((id) => {
    const d = document.querySelector(`#thuong-hieu article[data-brand="${id}"]`);
    const r = (el) => el.getBoundingClientRect();
    const h3 = d.querySelector("h3");
    const logo = h3.querySelector("img");
    const facts = [...d.querySelectorAll("[class*=fact]")].filter((el) => el.tagName === "DIV");
    const visit = d.querySelector("[data-brand-website]");
    const lead = d.querySelector("[class*=lead]");
    const about = d.querySelector("[class*=about]");
    return {
      h3Text: h3.textContent.trim(),
      h3Alt: logo?.alt,
      logoH: r(logo).height,
      logoRatio: Math.abs(r(logo).width / r(logo).height - logo.naturalWidth / logo.naturalHeight),
      factsSideBySide: facts.length === 2 && r(facts[1]).left >= r(facts[0]).right - 1 && Math.abs(r(facts[1]).top - r(facts[0]).top) < 2,
      factsStacked: facts.length === 2 && r(facts[1]).top >= r(facts[0]).bottom - 1,
      factsDivider: facts.length === 2 && getComputedStyle(facts[1]).borderLeftWidth,
      visitText: visit.textContent,
      visitHref: visit.getAttribute("href"),
      visitDisabled: visit.getAttribute("aria-disabled"),
      visitRole: visit.getAttribute("role"),
      visitCount: d.querySelectorAll("[data-brand-website]").length,
      lead: lead.textContent.length,
      about: about.textContent.length,
      leadLang: lead.textContent,
      aboutColor: getComputedStyle(about).color,
      inStage: r(d).height > 0,
    };
  }, id);

for (const width of W) {
  for (const lang of ["vi", "en"]) {
    const tag = `@${width} ${lang}`;
    const { ctx, page, errors, mobile } = await open(width, lang);
    let s = await read(page);
    ok(`${tag} order Bare → Pepper House → The Nắng`, JSON.stringify(s.order) === JSON.stringify(ORDER), s.order.join(","));
    ok(`${tag} canonical names`, s.names.join("|") === ORDER.map((id) => NAMES[id]).join("|"));
    ok(`${tag} neutral at first: nothing selected, no detail panel`, s.expanded.every((e) => e === "false") && s.detailCount === 0 && s.preview.length === 0);
    ok(`${tag} rows: no lines, no borders, no white block`, s.navLines.every((c) => c === "none" || c === "normal") && s.rowBorders.every((b) => b.startsWith("0px/none")) && s.rowBg.every((bg) => bg === "rgba(0, 0, 0, 0)"), s.navLines.join(","));
    ok(`${tag} logos keep their proportions`, s.logoRatio.every((d) => d < 0.03), s.logoRatio.map((d) => d.toFixed(3)).join(","));
    ok(`${tag} heading stands above the brand composition`, s.headBottom <= s.nav.top - 8);
    if (mobile) {
      ok(`${tag} neutral (phone/tablet): strip + hint, no empty stage`, s.hint && s.stage.display === "none" && !s.neutral);
    } else {
      ok(`${tag} neutral (desktop): three photo bands, aligned with the three rows`, s.neutral && s.bands.length === 3 && s.bands.every((b, i) => Math.abs(b.top - s.rowBoxes[i].top) < 2 && Math.abs(b.height - s.rowBoxes[i].height) < 2));
      ok(`${tag} rows and stage aligned top and bottom`, Math.abs(s.nav.top - s.stage.top) < 2 && Math.abs(s.nav.bottom - s.stage.bottom) < 2, `nav ${s.nav.top.toFixed(0)}–${s.nav.bottom.toFixed(0)} stage ${s.stage.top.toFixed(0)}–${s.stage.bottom.toFixed(0)}`);
      ok(`${tag} three rows of equal height`, s.rowBoxes.every((b) => Math.abs(b.height - s.rowBoxes[0].height) < 2), s.rowBoxes.map((b) => b.height.toFixed(0)).join(","));
    }
    ok(`${tag} no Facebook button, no "Khám phá nơi ở" button`, s.facebook === 0 && s.exploreBtn === 0);
    const stageH = s.stage.height;

    if (!mobile) {
      // ── Hover: restrained preview, slight scale, others subdued; client's Brand Hover line.
      for (const id of ORDER) {
        await page.locator(row(id)).hover();
        await page.waitForTimeout(60 + 90);
        const mid = await page.evaluate((id) => {
          const p = document.querySelector(`#thuong-hieu [data-preview][data-brand="${id}"]`);
          return { opacity: parseFloat(getComputedStyle(p).opacity), transform: getComputedStyle(p).transform };
        }, id);
        await page.waitForTimeout(450);
        s = await read(page);
        const described = await page.locator(row(id)).evaluate((b) => document.getElementById(b.getAttribute("aria-describedby") ?? "")?.textContent ?? "");
        const others = ORDER.map((o, i) => (o === id ? null : s.rowLogoOpacity[i])).filter((v) => v !== null);
        ok(`${tag} hover ${id}: preview with its Brand Hover line`, s.preview.join() === id && described.length > 20 && s.previewText.includes(described), described.slice(0, 40));
        ok(`${tag} hover ${id}: fades and settles in scale (no jump)`, mid.opacity > 0 && mid.opacity < 1 && mid.transform !== "none", `opacity@~60ms=${mid.opacity.toFixed(2)} ${mid.transform.slice(0, 22)}`);
        ok(`${tag} hover ${id}: emphasised, the other two subdued`, s.rowLogoOpacity[ORDER.indexOf(id)] === 1 && others.every((o) => o < 0.6) && s.rowBg[ORDER.indexOf(id)] !== "rgba(0, 0, 0, 0)");
        ok(`${tag} hover ${id}: stage size unchanged`, Math.abs(s.stage.height - stageH) < 1);
        if (lang === "vi" && width === 1440) await page.locator("#thuong-hieu").screenshot({ path: `${process.env.SHOTS ?? "/tmp"}/hover-${id}-${width}.png` }).catch(() => {});
      }
      await page.mouse.move(5, 5);
      await page.waitForTimeout(400);
      s = await read(page);
      ok(`${tag} pointer away: back to neutral`, s.neutral && s.preview.length === 0);
    }

    // ── Select each brand.
    for (const id of ORDER) {
      const before = await read(page);
      if (mobile) await page.locator(row(id)).tap();
      else await page.locator(row(id)).click();
      await page.mouse.move(5, 5).catch(() => {});
      await page.waitForTimeout(700);
      s = await read(page);
      const i = ORDER.indexOf(id);
      const f = await detailFacts(page, id);
      ok(`${tag} select ${id}: locked, its panel only`, s.expanded[i] === "true" && s.expanded.filter((e) => e === "true").length === 1 && s.detail === id && s.detailCount === 1 && s.preview.length === 0);
      ok(`${tag} select ${id}: logo is the heading (alt = name), no repeated name`, f.h3Text === "" && f.h3Alt === NAMES[id] && f.logoH >= (mobile && width < 768 ? 44 : 56) && f.logoRatio < 0.03, `logo ${f.logoH.toFixed(0)}px`);
      ok(`${tag} select ${id}: Positioning + About shown, readable colour`, f.lead > 50 && f.about > 150 && f.aboutColor === "rgb(111, 103, 91)");
      if (lang === "en") ok(`${tag} select ${id}: English copy`, !/[ăâđêôơưạảấầẩẫậắằẳẵặẹẻẽếềểễệịỉĩọỏốồổỗộớờởỡợụủứừửữựỳỷỹỵ]/i.test(f.leadLang));
      ok(`${tag} select ${id}: cities | stays ${width >= 480 ? "in two columns with a divider" : "stacked"}`, width >= 480 ? f.factsSideBySide && f.factsDivider === "1px" : f.factsStacked);
      ok(`${tag} select ${id}: one "Visit us ↗", not a link until a website is confirmed`, f.visitCount === 1 && /Visit us/.test(f.visitText) && f.visitHref === null && f.visitDisabled === "true" && f.visitRole === "link");
      ok(`${tag} select ${id}: selected row tinted (not white), others subdued`, s.rowBg[i] !== "rgba(0, 0, 0, 0)" && s.rowBg[i] !== "rgb(255, 255, 255)" && s.rowLogoOpacity[i] === 1 && s.rowLogoOpacity.filter((_, k) => k !== i).every((o) => o < 0.6));
      if (!mobile) {
        ok(`${tag} select ${id}: stage size and page position unchanged`, Math.abs(s.stage.height - stageH) < 1 && Math.abs(s.secTop - before.secTop) < 2);
        ok(`${tag} select ${id}: rows and panel aligned`, Math.abs(s.nav.top - s.stage.top) < 2 && Math.abs(s.nav.bottom - s.stage.bottom) < 2);
      } else {
        const header = await page.evaluate(() => document.getElementById("top").getBoundingClientRect().bottom);
        ok(`${tag} select ${id}: strip stays on screen, panel starts on screen`, s.nav.top >= header - 1 && s.nav.top < 844 && s.stage.top < 844 && s.stage.display !== "none", `strip ${s.nav.top.toFixed(0)} panel ${s.stage.top.toFixed(0)} header ${header.toFixed(0)}`);
        ok(`${tag} select ${id}: hint gone`, !s.hint);
      }
      ok(`${tag} select ${id}: no overflow, no clipped text`, s.overflow <= 0 && s.clipped.length === 0, `${s.overflow} ${s.clipped.join("|")}`);
    }
    ok(`${tag} no console/hydration errors`, errors.length === 0, errors.join(" | ").slice(0, 300));
    await ctx.close();

    // ── Keyboard: focus previews (desktop), Enter and Space lock, arrows move between brands.
    if (!mobile) {
      const k = await open(width, lang);
      await k.page.locator(row("bare")).focus();
      await k.page.keyboard.press("Tab");
      await k.page.keyboard.press("Shift+Tab");
      await k.page.waitForTimeout(400);
      let t = await read(k.page);
      ok(`${tag} keyboard focus previews like hover`, t.preview.join() === "bare");
      await k.page.keyboard.press("ArrowDown");
      await k.page.waitForTimeout(400);
      t = await read(k.page);
      const focused = await k.page.evaluate(() => document.activeElement?.dataset.brand);
      ok(`${tag} ArrowDown moves to Pepper House and previews it`, focused === "pepper-house" && t.preview.join() === "pepper-house");
      await k.page.keyboard.press("Enter");
      await k.page.waitForTimeout(500);
      t = await read(k.page);
      ok(`${tag} Enter locks Pepper House`, t.detail === "pepper-house" && t.preview.length === 0);
      await k.page.keyboard.press("ArrowDown");
      await k.page.keyboard.press("Space");
      await k.page.waitForTimeout(500);
      t = await read(k.page);
      ok(`${tag} Space locks The Nắng Suites`, t.detail === "the-nang");
      await k.page.keyboard.press("ArrowUp");
      await k.page.waitForTimeout(400);
      await k.page.keyboard.press("Escape");
      await k.page.waitForTimeout(400);
      t = await read(k.page);
      ok(`${tag} Escape closes the preview, the selection stays`, t.preview.length === 0 && t.detail === "the-nang");
      // Tab from the rows reaches the panel's stay links (the hidden panels are inert).
      await k.page.locator(row("the-nang")).focus();
      await k.page.keyboard.press("Tab");
      const next = await k.page.evaluate(() => ({ inPanel: !!document.activeElement?.closest('article[data-brand="the-nang"]'), text: document.activeElement?.textContent }));
      ok(`${tag} Tab continues into the selected panel`, next.inPanel, next.text);
      await k.ctx.close();
    }
  }
}

// Reduced motion: no transitions, no scale, same states.
for (const width of [1440, 390]) {
  const { ctx, page, mobile } = await open(width, "vi", true);
  if (!mobile) {
    await page.locator(row("pepper-house")).hover();
    await page.waitForTimeout(250);
    const m = await page.evaluate(() => {
      const p = document.querySelector('#thuong-hieu [data-preview][data-brand="pepper-house"]');
      return { d: getComputedStyle(p).transitionDuration, t: getComputedStyle(p).transform, o: getComputedStyle(p).opacity };
    });
    ok(`@${width} reduced motion: preview appears without transition or scale`, m.d.split(",").every((x) => x.trim() === "0s") && m.t === "none" && m.o === "1", JSON.stringify(m));
  } else {
    await page.locator(row("bare")).tap();
    await page.waitForTimeout(150);
    const m = await page.evaluate(() => getComputedStyle(document.querySelector('#thuong-hieu article[data-brand="bare"]')).animationName);
    ok(`@${width} reduced motion: panel appears without animation`, m === "none", m);
  }
  await ctx.close();
}

await browser.close();
console.log(results.join("\n"));
console.log(`\n${results.filter((r) => r.startsWith("PASS")).length}/${results.length} passed`);
