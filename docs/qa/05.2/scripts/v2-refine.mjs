// QA for section 05.2, Bare Chic refinement (20/10/2026): /dev/stays/bare-chic on the client-preview
// configuration. Captures 390, 768 and 1440, private and public price modes, and exercises the
// property gallery, each room's gallery, the amenities disclosure, the primary action and the pill.
// Usage: BASE=http://localhost:3400 node docs/qa/05.2/scripts/v2-refine.mjs [label]
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { launch, Page, quit, sleep } from "../../brand-collection/scripts/lib.mjs";

const BASE = process.env.BASE ?? "http://localhost:3400";
const ROUTE = process.env.ROUTE ?? "/dev/stays/bare-chic";
const LABEL = process.argv[2] ?? "v2-refine";
const DIR = fileURLToPath(new URL(`../${LABEL}/`, import.meta.url));
mkdirSync(DIR, { recursive: true });
const VIEWS = [
  { name: "390", w: 390, h: 844, dpr: 2, mobile: true },
  { name: "768", w: 768, h: 1024, dpr: 2, mobile: true },
  { name: "1440", w: 1440, h: 900, dpr: 1, mobile: false },
];
const CTA = "Khám phá các loại phòng";
const OPEN_VIEWER = "dialog[open]";

const CLS_PROBE = `window.__cls = 0; new PerformanceObserver((list) => { for (const e of list.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: "layout-shift", buffered: true });`;

const MEASURE = `(() => {
  const main = document.querySelector("main");
  const cta = [...main.querySelectorAll("a")].find((a) => a.textContent.trim() === ${JSON.stringify(CTA)});
  const r = cta.getBoundingClientRect();
  const h1 = document.querySelector("h1").getBoundingClientRect();
  const visible = (e) => e.getClientRects().length > 0 && getComputedStyle(e).visibility !== "hidden" && !e.closest("[inert]") && !e.closest("dialog");
  const controls = [...document.querySelectorAll("main a, main button, main summary, header a, header button")].filter(visible);
  const small = controls.map((e) => { const b = e.getBoundingClientRect(); return { label: (e.getAttribute("aria-label") || e.textContent).trim().slice(0, 40), w: Math.round(b.width), h: Math.round(b.height) }; }).filter((c) => c.h < 44 && c.w > 0);
  const text = main.innerText;
  return {
    robots: document.querySelector('meta[name=robots]')?.content ?? null,
    jsonLd: document.querySelectorAll('script[type="application/ld+json"]').length,
    h1: [...document.querySelectorAll("h1")].map((h) => h.textContent.trim()),
    headings: [...document.querySelectorAll("main h1, main h2, main h3")].filter((h) => !h.closest("dialog")).map((h) => h.tagName + " " + h.textContent.trim().slice(0, 50)),
    landmarks: { main: document.querySelectorAll("main").length, nav: [...document.querySelectorAll("nav")].map((n) => n.getAttribute("aria-label")), regions: [...main.querySelectorAll("section[aria-label], aside[aria-label]")].map((s) => s.getAttribute("aria-label")) },
    overflowPx: document.documentElement.scrollWidth - innerWidth,
    cta: { href: cta.getAttribute("href"), inFirstScreen: r.bottom <= innerHeight, top: Math.round(r.top), bottom: Math.round(r.bottom) },
    h1Box: { top: Math.round(h1.top), bottom: Math.round(h1.bottom), inFirstScreen: h1.bottom <= innerHeight },
    availabilityWording: text.includes("Xem phòng trống"),
    galleryTiles: [...main.querySelectorAll("ul[aria-label] > li")].filter((li) => li.getClientRects().length).map((li) => li.innerText.trim()),
    allPhotosButton: [...main.querySelectorAll("button")].find((b) => b.textContent.includes("Xem tất cả") && b.textContent.includes("ảnh"))?.textContent.trim() ?? null,
    roomButtons: [...main.querySelectorAll("#rooms button")].map((b) => b.textContent.trim()),
    rooms: document.querySelector("#rooms")?.innerText.replace(/\\n+/g, " | "),
    amenitiesClosed: [...main.querySelectorAll("ul")].find((u) => u.parentElement?.querySelector("#amenities-title"))?.innerText.replace(/\\n+/g, " | ") ?? null,
    mapLink: [...main.querySelectorAll('a[target="_blank"]')].map((a) => a.getAttribute("href")),
    figuresOnPage: text.match(/\\d{1,3}(,\\d{3})+/g) ?? [],
    neverStated: ["Quận 1", "28m2", "28 m²", "2 người lớn", "Studio ·", "giường đôi", "Dinh Độc Lập", "Quanh đây", "14:00", "12:00", "VND", "₫", "/đêm", "mỗi đêm", "còn phòng", "Còn trống", "About"].filter((s) => text.includes(s)),
    pendingNotes: [...main.querySelectorAll("aside")].map((a) => a.innerText.replace(/\\n+/g, " | ")),
    images: [...main.querySelectorAll("img")].filter((i) => !i.closest("dialog")).map((i) => ({ alt: i.alt.slice(0, 50), inButtonLabel: i.closest("button")?.getAttribute("aria-label")?.slice(0, 60) ?? null, loaded: i.complete && i.naturalWidth > 0, loading: i.getAttribute("loading"), src: (i.currentSrc || i.src).replace(location.origin, "").slice(0, 70) })),
    under44: small,
    cls: Math.round(window.__cls * 10000) / 10000,
  };
})()`;

const dialogState = `(() => { const d = document.querySelector(${JSON.stringify(OPEN_VIEWER)}); if (!d) return { open: false, focus: document.activeElement?.getAttribute("aria-label") || document.activeElement?.textContent?.trim().slice(0, 40) }; return { open: true, label: d.getAttribute("aria-label"), caption: d.querySelector("p")?.textContent, groups: [...d.querySelectorAll("h3")].map((h) => h.textContent), thumbs: d.querySelectorAll("section button").length, img: d.querySelector("figure img")?.alt ?? null, focusInside: d.contains(document.activeElement), focus: document.activeElement?.getAttribute("aria-label") || document.activeElement?.textContent?.trim().slice(0, 40), htmlOverflow: document.documentElement.style.overflow }; })()`;

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
    await p.eval(`(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight / 2) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 150)); } scrollTo(0, 0); })()`);
    await sleep(1500);
    out[key] = { ...(await p.eval(MEASURE)), errors: p.errors };
    await p.eval(`document.querySelectorAll("[data-shown]").forEach((e) => (e.style.visibility = "hidden"))`);
    await p.shot(`${DIR}/${key}-full.jpg`, { full: true, quality: 82 });
    await p.eval(`document.querySelectorAll("[data-shown]").forEach((e) => (e.style.visibility = ""))`);

    if (mode === "private") {
      const r = (out[key].interactions = {});
      // Primary action: straight to the rooms.
      await p.eval(`[...document.querySelectorAll("main a")].find((a) => a.textContent.trim() === ${JSON.stringify(CTA)}).click()`);
      await sleep(900);
      r.afterCta = await p.eval(`({ hash: location.hash, roomsTop: Math.round(document.querySelector("#rooms").getBoundingClientRect().top) })`);
      await p.shot(`${DIR}/${key}-rooms.png`);
      if (view.name === "390") {
        await p.eval(`scrollTo(0, document.querySelector("#rooms").offsetTop - innerHeight * 1.6)`);
        await sleep(600);
        r.pillMidPage = await p.eval(`document.querySelector("[data-shown]")?.dataset.shown ?? null`);
        await p.shot(`${DIR}/${key}-pill.png`);
        // Phone gallery: a swipe on the photo row moves to the next slide and the counter follows.
        await p.eval(`scrollTo(0, 0)`);
        await sleep(300);
        const before = await p.eval(`document.querySelector("main ul[aria-label]").scrollLeft`);
        const strip = await p.eval(`(() => { const b = document.querySelector("main ul[aria-label]").getBoundingClientRect(); return { x: b.left + b.width * 0.8, y: b.top + b.height / 2 }; })()`);
        await p.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: strip.x, y: strip.y }] });
        for (let i = 1; i <= 8; i++) await p.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: strip.x - i * 30, y: strip.y }] });
        await p.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
        await sleep(900);
        r.stripSwipe = await p.eval(`({ before: ${before}, after: document.querySelector("main ul[aria-label]").scrollLeft, counter: document.querySelector("main p[aria-hidden]")?.textContent })`);
        await p.shot(`${DIR}/${key}-gallery-swiped.png`);
      }
      // Property gallery: "Xem tất cả … ảnh" opens the grid, grouped by room.
      await p.eval(`scrollTo(0, 0)`);
      await p.eval(`[...document.querySelectorAll("main button")].find((b) => b.textContent.includes("Xem tất cả") && b.textContent.includes("ảnh")).focus()`);
      await p.key("Enter");
      await sleep(700);
      r.galleryGrid = await p.eval(dialogState);
      await p.shot(`${DIR}/${key}-gallery-grid.png`);
      // Choose the third photograph from the grid, then move with the arrow keys and back to the grid.
      await p.eval(`document.querySelector(${JSON.stringify(OPEN_VIEWER)}).querySelectorAll("section button")[2].click()`);
      await sleep(600);
      r.galleryPhoto = await p.eval(dialogState);
      await p.shot(`${DIR}/${key}-gallery-photo.png`);
      await p.key("ArrowRight", { vk: 39 });
      await sleep(400);
      r.galleryNext = await p.eval(dialogState);
      if (view.mobile) {
        // A swipe on the photograph moves to the next one.
        const fig = await p.eval(`(() => { const b = document.querySelector(${JSON.stringify(OPEN_VIEWER)} + " figure").getBoundingClientRect(); return { x: b.left + b.width * 0.75, y: b.top + b.height / 2 }; })()`);
        await p.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: fig.x, y: fig.y }] });
        for (let i = 1; i <= 6; i++) await p.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: fig.x - i * 25, y: fig.y }] });
        await p.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
        await sleep(500);
        r.gallerySwipe = await p.eval(dialogState);
      }
      await p.eval(`[...document.querySelector(${JSON.stringify(OPEN_VIEWER)}).querySelectorAll("button")].find((b) => b.textContent.includes("Tất cả ảnh")).click()`);
      await sleep(500);
      r.galleryBack = await p.eval(dialogState);
      await p.key("Escape");
      await sleep(500);
      r.galleryClosed = await p.eval(dialogState);
      // Each room's gallery: its own photographs only, with the count the button states.
      r.roomGalleries = [];
      const buttons = await p.eval(`[...document.querySelectorAll("#rooms button")].map((b) => b.textContent.trim())`);
      for (let i = 0; i < buttons.length; i++) {
        await p.eval(`(() => { const b = document.querySelectorAll("#rooms button")[${i}]; b.scrollIntoView({ block: "center" }); b.focus(); })()`);
        await p.key("Enter");
        await sleep(600);
        const seen = [];
        const first = await p.eval(dialogState);
        const total = Number(/\/(\d+)/.exec(first.caption ?? "")?.[1] ?? 1);
        seen.push(first.caption);
        for (let k = 1; k < total; k++) {
          await p.key("ArrowRight", { vk: 39 });
          await sleep(300);
          seen.push((await p.eval(dialogState)).caption);
        }
        if (i === 0) await p.shot(`${DIR}/${key}-room-gallery-${i + 1}.png`);
        await p.key("Escape");
        await sleep(400);
        r.roomGalleries.push({ button: buttons[i], label: first.label, captions: seen, focusBack: (await p.eval(dialogState)).focus });
      }
      // Amenities: the complete list behind one disclosure.
      await p.eval(`(() => { const s = document.querySelector("main details summary"); s.scrollIntoView({ block: "center" }); s.focus(); })()`);
      await p.key("Enter");
      await sleep(400);
      r.amenitiesOpen = await p.eval(`(() => { const d = document.querySelector("main details"); return { open: d.open, summary: d.querySelector("summary").innerText.trim(), text: d.innerText.replace(/\\n+/g, " | ") }; })()`);
      await p.shot(`${DIR}/${key}-amenities-open.png`);
      // Keyboard from the top of the page.
      await p.eval(`scrollTo(0, 0); document.body.tabIndex = -1; document.body.focus(); document.body.removeAttribute("tabindex")`);
      const stops = [];
      for (let i = 0; i < 18; i++) {
        await p.key("Tab");
        stops.push(await p.eval(`(() => { const e = document.activeElement; const s = getComputedStyle(e); return (e.getAttribute("aria-label") || e.textContent || e.tagName).trim().slice(0, 34) + (s.outlineStyle !== "none" && s.outlineWidth !== "0px" ? " [ring]" : ""); })()`));
      }
      r.tabOrder = stops;
    }
    console.log(key, "overflow", out[key].overflowPx, "cta", JSON.stringify(out[key].cta), "cls", out[key].cls, "errors", out[key].errors.length);
    await p.close();
  }
}
writeFileSync(`${DIR}/results.json`, JSON.stringify(out, null, 2));
quit();
