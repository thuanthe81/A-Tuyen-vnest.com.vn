// QA for section 05.2, Bare Chic prototype on workbook v2 (20/10/2026): /dev/stays/bare-chic on the
// client-preview configuration. Captures 390, 768 and 1440, private and public price modes, and
// measures what the brief asks: one H1, landmarks, CTA in the first screen and where it leads,
// overflow, image loading and alt text, control sizes, layout shift, prices, things never stated.
// Usage: BASE=http://localhost:3400 node docs/qa/05.2/scripts/v2.mjs [label]   (vnest-v2-client-preview)
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { launch, Page, quit, sleep } from "../../brand-collection/scripts/lib.mjs";

const BASE = process.env.BASE ?? "http://localhost:3400";
const ROUTE = process.env.ROUTE ?? "/dev/stays/bare-chic";
const LABEL = process.argv[2] ?? "v2";
const DIR = fileURLToPath(new URL(`../${LABEL}/`, import.meta.url));
mkdirSync(DIR, { recursive: true });
const VIEWS = [
  { name: "390", w: 390, h: 844, dpr: 2, mobile: true },
  { name: "768", w: 768, h: 1024, dpr: 2, mobile: true },
  { name: "1440", w: 1440, h: 900, dpr: 1, mobile: false },
];

// Collected before any script of the page runs, so the page's own load is measured.
// The page has another dialog (the criteria bar's); the viewer is the one named for the photographs.
const VIEWER_SELECTOR = 'dialog[aria-label^="Ảnh"]';
const CLS_PROBE = `window.__cls = 0; new PerformanceObserver((list) => { for (const e of list.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: "layout-shift", buffered: true });`;

const MEASURE = `(() => {
  const main = document.querySelector("main");
  const cta = [...main.querySelectorAll("a")].find((a) => a.textContent.trim() === "Xem phòng trống");
  const r = cta.getBoundingClientRect();
  const h1 = document.querySelector("h1").getBoundingClientRect();
  const visible = (e) => e.getClientRects().length > 0 && getComputedStyle(e).visibility !== "hidden" && !e.closest("[inert]");
  const controls = [...document.querySelectorAll("main a, main button, header a, header button")].filter(visible);
  const small = controls.map((e) => { const b = e.getBoundingClientRect(); return { label: (e.getAttribute("aria-label") || e.textContent).trim().slice(0, 40), w: Math.round(b.width), h: Math.round(b.height) }; }).filter((c) => c.h < 44 && c.w > 0);
  const text = main.innerText;
  return {
    title: document.title,
    robots: document.querySelector('meta[name=robots]')?.content ?? null,
    jsonLd: document.querySelectorAll('script[type="application/ld+json"]').length,
    h1: [...document.querySelectorAll("h1")].map((h) => h.textContent.trim()),
    headings: [...document.querySelectorAll("h1, h2, h3")].map((h) => h.tagName + " " + h.textContent.trim().slice(0, 50)),
    landmarks: { main: document.querySelectorAll("main").length, nav: [...document.querySelectorAll("nav")].map((n) => n.getAttribute("aria-label")), header: document.querySelectorAll("header").length },
    overflowPx: document.documentElement.scrollWidth - innerWidth,
    cta: { href: cta.getAttribute("href"), inFirstScreen: r.bottom <= innerHeight, top: Math.round(r.top), bottom: Math.round(r.bottom), height: Math.round(r.height) },
    h1Box: { top: Math.round(h1.top), bottom: Math.round(h1.bottom), inFirstScreen: h1.bottom <= innerHeight },
    images: [...main.querySelectorAll("img")].map((i) => ({ alt: i.alt.slice(0, 70), loaded: i.complete && i.naturalWidth > 0, loading: i.getAttribute("loading"), fetchpriority: i.getAttribute("fetchpriority"), src: (i.currentSrc || i.src).replace(location.origin, "").slice(0, 90) })),
    captions: [...main.querySelectorAll("figcaption, li > p")].map((f) => f.textContent.trim()).filter(Boolean),
    placeholders: [...main.querySelectorAll('[role="img"]')].map((e) => e.getAttribute("aria-label")),
    rooms: document.querySelector("#rooms")?.innerText.replace(/\\n+/g, " | "),
    mapLink: [...main.querySelectorAll('a[target="_blank"]')].map((a) => a.getAttribute("href")),
    figuresOnPage: text.match(/\\d{1,3}(,\\d{3})+/g) ?? [],
    neverStated: ["Quận 1", "28m2", "28 m²", "2 người lớn", "Dinh Độc Lập", "Quanh đây", "14:00", "12:00", "Chính sách", "VND", "₫", "/đêm", "mỗi đêm", "còn phòng", "Còn trống"].filter((s) => text.includes(s)),
    reviewNotice: document.body.innerText.split("\\n")[0].slice(0, 220),
    under44: small,
    cls: Math.round(window.__cls * 10000) / 10000,
  };
})()`;

console.log(await launch());
const out = { base: BASE, route: ROUTE, date: new Date().toISOString() };
for (const view of VIEWS) {
  for (const [mode, search] of [["private", ""], ["public", "?price=public"]]) {
    const p = await Page.open();
    p.errors = [];
    p.on("Runtime.exceptionThrown", (e) => p.errors.push(e.exceptionDetails.exception?.description?.slice(0, 160) ?? e.exceptionDetails.text));
    p.on("Runtime.consoleAPICalled", (e) => e.type === "error" && p.errors.push("console: " + e.args.map((a) => a.value ?? a.description).join(" ").slice(0, 160)));
    await p.viewport(view.w, view.h, view.dpr, view.mobile);
    await p.media({ "prefers-reduced-motion": "reduce" });
    await p.send("Page.addScriptToEvaluateOnNewDocument", { source: CLS_PROBE });
    await p.goto(BASE + ROUTE + search, { settle: 2500 });
    const key = `${view.name}-${mode}`;
    await p.shot(`${DIR}/${key}-first-screen.png`);
    // Load every lazy image before the full-page capture.
    await p.eval(`(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight / 2) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 150)); } scrollTo(0, 0); })()`);
    await sleep(1500);
    out[key] = { ...(await p.eval(MEASURE)), errors: p.errors };
    // The pill is fixed: hide it for the full-page capture so it is not drawn mid-page.
    await p.eval(`document.querySelectorAll("[data-shown]").forEach((e) => (e.style.visibility = "hidden"))`);
    await p.shot(`${DIR}/${key}-full.jpg`, { full: true, quality: 82 });
    await p.eval(`document.querySelectorAll("[data-shown]").forEach((e) => (e.style.visibility = ""))`);
    if (mode === "private") {
      // The hero CTA jumps straight to the rooms, past the story and the photographs.
      await p.eval(`[...document.querySelectorAll("main a")].find((a) => a.textContent.trim() === "Xem phòng trống").click()`);
      await sleep(900);
      out[key].afterCta = await p.eval(`({ hash: location.hash, roomsTop: Math.round(document.querySelector("#rooms").getBoundingClientRect().top), scrollY: Math.round(scrollY), pillShown: document.querySelector("[data-shown]")?.dataset.shown ?? null })`);
      await p.shot(`${DIR}/${key}-rooms.png`);
      // Phone pill: shown between the hero and the rooms, hidden over the rooms.
      await p.eval(`scrollTo(0, document.querySelector("#rooms").offsetTop - innerHeight * 2)`);
      await sleep(600);
      out[key].pillMidPage = await p.eval(`document.querySelector("[data-shown]")?.dataset.shown ?? null`);
      if (view.name === "390") await p.shot(`${DIR}/${key}-pill.png`);
      // Viewer: opens from a photograph, moves with the arrow keys, closes with Escape and returns focus.
      await p.eval(`scrollTo(0, 0)`);
      const opener = await p.eval(`(() => { const b = document.querySelector("main ul button"); b.focus(); b.scrollIntoView({ block: "center" }); return b.getAttribute("aria-label"); })()`);
      await p.key("Enter");
      await sleep(500);
      const opened = await p.eval(`({ open: document.querySelector(${JSON.stringify(VIEWER_SELECTOR)}).open, caption: document.querySelector(${JSON.stringify(VIEWER_SELECTOR + " p")})?.textContent, focusInDialog: document.querySelector(${JSON.stringify(VIEWER_SELECTOR)}).contains(document.activeElement) })`);
      await p.key("ArrowRight", { vk: 39 });
      await sleep(300);
      const next = await p.eval(`document.querySelector(${JSON.stringify(VIEWER_SELECTOR + " p")})?.textContent`);
      await p.shot(`${DIR}/${key}-viewer.png`);
      await p.key("Escape");
      await sleep(400);
      const closed = await p.eval(`({ open: document.querySelector(${JSON.stringify(VIEWER_SELECTOR)}).open, focusBack: document.activeElement?.getAttribute("aria-label") })`);
      out[key].viewer = { opener, opened, next, closed };
      // Keyboard: the first stops from the top of the page, with a visible focus ring.
      await p.eval(`scrollTo(0, 0); document.body.tabIndex = -1; document.body.focus(); document.body.removeAttribute("tabindex")`);
      const stops = [];
      for (let i = 0; i < 12; i++) {
        await p.key("Tab");
        stops.push(await p.eval(`(() => { const e = document.activeElement; const s = getComputedStyle(e); return (e.getAttribute("aria-label") || e.textContent || e.tagName).trim().slice(0, 32) + (s.outlineStyle !== "none" && s.outlineWidth !== "0px" ? " [ring]" : ""); })()`));
      }
      out[key].tabOrder = stops;
    }
    console.log(key, "overflow", out[key].overflowPx, "cta", JSON.stringify(out[key].cta), "cls", out[key].cls, "errors", out[key].errors.length);
    await p.close();
  }
}
writeFileSync(`${DIR}/results.json`, JSON.stringify(out, null, 2));
quit();
