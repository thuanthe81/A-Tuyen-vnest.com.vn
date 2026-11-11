// Phase E audit (10/11/2026): one pass over every implemented review page, in Vietnamese and English, at 1440 / 768 / 390.
// Records metadata, headings, overflow, console errors, image alt text, layout shift, LCP, and leftover-language text.
// Screenshots: viewport at 1440 and 390 for every page; full page for the representative ones.
// Usage: node docs/qa/phase-e-audit-2026-11-10/scripts/audit-pages.mjs http://localhost:3405 <out-dir>
import { writeFileSync, mkdirSync } from "node:fs";
import { chromium } from "/Users/noe/Documents/GitHub/Cigarettes-After-Sex/node_modules/.pnpm/playwright@1.62.1/node_modules/playwright/index.mjs";

const [base, out] = process.argv.slice(2);
const AXE = new URL("../../../../node_modules/axe-core/axe.min.js", import.meta.url).pathname.replaceAll("%20", " ");
mkdirSync(`${out}/shots`, { recursive: true });

const day = (n) => {
  const d = new Date(Date.now() + n * 864e5);
  return d.toISOString().slice(0, 10);
};
const IN = day(30);
const OUT = day(32);

const PAGES = [
  { id: "home", path: "/dev/demo?intro=0", full: true },
  { id: "hop-tac", path: "/dev/demo/hop-tac", full: true },
  { id: "results", path: `/dev/demo/tim-phong?checkIn=${IN}&checkOut=${OUT}&adults=2`, full: true },
  { id: "dat-phong", path: `/dev/demo/dat-phong?property=bare-da-kao&checkIn=${IN}&checkOut=${OUT}&adults=2` },
  { id: "bare-chic", path: "/dev/stays/bare-chic?view=demo", full: true },
  { id: "bare-hyphen", path: "/dev/stays/bare-hyphen" },
  { id: "bare-da-kao", path: "/dev/stays/bare-da-kao", full: true },
  { id: "bare-han", path: "/dev/stays/bare-han" },
  { id: "pepper-house", path: "/dev/stays/pepper-house" },
  { id: "the-nang-suites", path: "/dev/stays/the-nang-suites" },
];
const VIEWPORTS = [
  { name: "1440", width: 1440, height: 900, mobile: false },
  { name: "768", width: 768, height: 1024, mobile: false },
  { name: "390", width: 390, height: 844, mobile: true },
];
const LOCALES = ["vi", "en"];

const OBSERVE = () => {
  window.__cls = 0;
  window.__lcp = 0;
  window.__shifts = [];
  new PerformanceObserver((list) => {
    for (const e of list.getEntries()) {
      if (e.hadRecentInput) continue;
      window.__cls += e.value;
      window.__shifts.push({
        v: +e.value.toFixed(4),
        t: Math.round(e.startTime),
        src: (e.sources || []).map((s) => (s.node && s.node.className ? String(s.node.className).slice(0, 60) : s.node?.nodeName)).slice(0, 3),
      });
    }
  }).observe({ type: "layout-shift", buffered: true });
  new PerformanceObserver((list) => {
    const last = list.getEntries().at(-1);
    if (last) window.__lcp = { t: Math.round(last.startTime), el: last.element ? last.element.nodeName + "." + String(last.element.className).slice(0, 50) : null };
  }).observe({ type: "largest-contentful-paint", buffered: true });
};

const COLLECT = (locale) => {
  const VI = /[ăâđêôơưàáạảãằắặẳẵầấậẩẫèéẹẻẽềếệểễìíịỉĩòóọỏõồốộổỗờớợởỡùúụủũừứựửữỳýỵỷỹĐ]/i;
  const EN_WORD = /\b(the|and|your|book|now|view|more|about|visit|stay|stays|room|rooms|guest|guests|search|check|select|close|next|previous|menu|contact|send|learn|explore|see|all|price|night|from|with|our|us|of|to)\b/i;
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none" && !el.closest("[aria-hidden=true]");
  };
  const texts = new Set();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const n = walker.currentNode;
    const t = n.textContent.replace(/\s+/g, " ").trim();
    if (!t || t.length < 2 || !n.parentElement || ["SCRIPT", "STYLE", "NOSCRIPT"].includes(n.parentElement.nodeName)) continue;
    if (!visible(n.parentElement)) continue;
    if (locale === "en" ? VI.test(t) : !VI.test(t) && EN_WORD.test(t) && /[a-z]{3}/i.test(t)) texts.add(t.slice(0, 140));
  }
  // aria-labels / alts in the other language too
  const attrs = new Set();
  for (const el of document.querySelectorAll("[aria-label],img[alt],[placeholder],[title]")) {
    for (const a of ["aria-label", "alt", "placeholder", "title"]) {
      const v = el.getAttribute(a);
      if (!v) continue;
      if (locale === "en" ? VI.test(v) : !VI.test(v) && EN_WORD.test(v)) attrs.add(`${a}: ${v.slice(0, 100)}`);
    }
  }
  const headings = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].filter((h) => visible(h) || h.closest("[hidden]") === null);
  const levels = headings.map((h) => +h.tagName[1]);
  const skips = [];
  for (let i = 1; i < levels.length; i++) if (levels[i] - levels[i - 1] > 1) skips.push(`${headings[i - 1].tagName}→${headings[i].tagName} "${headings[i].textContent.trim().slice(0, 40)}"`);
  const emptyHeadings = headings.filter((h) => !h.textContent.trim()).map((h) => h.tagName + (h.querySelector("img[alt]") ? " (img alt)" : " (EMPTY)"));
  const meta = (sel, attr = "content") => document.querySelector(sel)?.getAttribute(attr) ?? null;
  const ids = [...document.querySelectorAll("[id]")].map((e) => e.id);
  const dupIds = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
  const unlabeled = [...document.querySelectorAll("button, a[href], input, select, textarea")].filter((el) => {
    if (!visible(el)) return false;
    const name = (el.getAttribute("aria-label") || el.getAttribute("aria-labelledby") || el.textContent || el.getAttribute("title") || el.querySelector("img[alt]")?.alt || "").trim();
    if (["INPUT", "SELECT", "TEXTAREA"].includes(el.nodeName)) return !(el.labels?.length || el.getAttribute("aria-label") || el.getAttribute("aria-labelledby") || el.type === "hidden");
    return !name;
  }).map((el) => el.outerHTML.slice(0, 120));
  const deadLinks = [...document.querySelectorAll("a")].filter((a) => visible(a) && (!a.getAttribute("href") || a.getAttribute("href") === "#")).map((a) => a.textContent.trim().slice(0, 40));
  const external = [...new Set([...document.querySelectorAll("a[href^=http]")].map((a) => a.href))].slice(0, 30);
  const smallTargets = [...document.querySelectorAll("button, a[href]")].filter((el) => {
    if (!visible(el)) return false;
    const r = el.getBoundingClientRect();
    return r.width < 24 || r.height < 24;
  }).map((el) => `${el.nodeName} "${(el.getAttribute("aria-label") || el.textContent).trim().slice(0, 30)}" ${Math.round(el.getBoundingClientRect().width)}×${Math.round(el.getBoundingClientRect().height)}`);
  return {
    title: document.title,
    description: meta('meta[name="description"]'),
    robots: meta('meta[name="robots"]'),
    canonical: meta('link[rel="canonical"]', "href"),
    htmlLang: document.documentElement.lang,
    h1: [...document.querySelectorAll("h1")].map((h) => h.textContent.trim().slice(0, 80)),
    headingSkips: skips,
    emptyHeadings,
    overflowX: document.documentElement.scrollWidth - innerWidth,
    imagesNoAlt: [...document.images].filter((i) => !i.hasAttribute("alt")).map((i) => i.src.slice(-60)),
    brokenImages: [...document.images].filter((i) => i.complete && i.currentSrc && i.naturalWidth === 0).map((i) => i.currentSrc.slice(-70)),
    dupIds,
    unlabeled: unlabeled.slice(0, 10),
    deadLinks: deadLinks.slice(0, 20),
    external,
    smallTargets: smallTargets.slice(0, 15),
    otherLanguageText: [...texts].slice(0, 120),
    otherLanguageAttrs: [...attrs].slice(0, 60),
    cls: +window.__cls.toFixed(4),
    shifts: window.__shifts.slice(0, 8),
    lcp: window.__lcp,
    domNodes: document.getElementsByTagName("*").length,
  };
};

const browser = await chromium.launch();
const results = [];
for (const pg of PAGES) {
  for (const locale of LOCALES) {
    for (const vp of VIEWPORTS) {
      const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: vp.mobile, hasTouch: vp.mobile, deviceScaleFactor: 1 });
      const page = await ctx.newPage();
      await page.addInitScript(OBSERVE);
      const errors = [];
      page.on("console", (m) => {
        const t = m.text();
        if (m.type() === "error" || m.type() === "warning") errors.push(`${m.type()}: ${t.slice(0, 200)}`);
      });
      page.on("pageerror", (e) => errors.push(`pageerror: ${String(e).slice(0, 200)}`));
      const failed = [];
      page.on("response", (r) => {
        if (r.status() >= 400) failed.push(`${r.status()} ${r.url().replace(base, "").slice(0, 100)}`);
      });
      const url = base + pg.path + (locale === "en" ? (pg.path.includes("?") ? "&" : "?") + "lang=en" : "");
      let response;
      let gotoError = null;
      try {
        response = await page.goto(url, { waitUntil: "load", timeout: 30000 });
        await page.waitForTimeout(1800);
      } catch (e) {
        gotoError = String(e).slice(0, 200);
      }
      const headers = response ? response.headers() : {};
      // Scroll through to trigger lazy content, then back to top.
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.8) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 120));
        }
        window.scrollTo(0, 0);
        await new Promise((r) => setTimeout(r, 400));
      });
      const data = await page.evaluate(COLLECT, locale).catch((e) => ({ error: String(e) }));
      const tag = `${pg.id}-${locale}-${vp.name}`;
      if (vp.name !== "768") {
        // WCAG 2.x A/AA rules from axe-core (the copy installed with eslint-plugin-jsx-a11y).
        await page.addScriptTag({ path: AXE }).catch(() => {});
        data.axe = await page
          .evaluate(async () => {
            const r = await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] } });
            return r.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, sample: v.nodes.slice(0, 3).map((n) => `${n.target.join(" ")} :: ${(n.failureSummary || "").split("\n")[1]?.trim().slice(0, 140) ?? ""}`) }));
          })
          .catch((e) => [{ id: "axe-error", impact: null, nodes: 0, sample: [String(e).slice(0, 120)] }]);
      }
      if (vp.name !== "768" && (locale === "vi" || pg.id === "home" || pg.id === "hop-tac" || pg.id === "bare-chic")) {
        await page.screenshot({ path: `${out}/shots/${tag}.jpg`, type: "jpeg", quality: 70 });
        if (pg.full && locale === "vi") await page.screenshot({ path: `${out}/shots/${tag}-full.jpg`, type: "jpeg", quality: 60, fullPage: true });
      }
      results.push({ tag, url: url.replace(base, ""), status: response?.status(), finalUrl: page.url().replace(base, ""), xRobots: headers["x-robots-tag"] ?? null, gotoError, errors: [...new Set(errors)].slice(0, 12), failed: [...new Set(failed)].slice(0, 12), ...data });
      process.stdout.write(`${tag} `);
      await ctx.close();
    }
  }
}
await browser.close();
writeFileSync(`${out}/pages.json`, JSON.stringify(results, null, 2));
console.log(`\n${results.length} page views → ${out}/pages.json`);
