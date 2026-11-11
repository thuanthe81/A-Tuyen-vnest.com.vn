// QA for section 05.2, checkpoint 1: /dev/stays/bare-chic on the client-preview configuration.
// Usage: BASE=http://localhost:3400 node docs/qa/05.2/scripts/cp1.mjs   (vnest-v2-client-preview)
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { launch, Page, quit, sleep } from "../../brand-collection/scripts/lib.mjs";

const BASE = process.env.BASE ?? "http://localhost:3400";
const ROUTE = "/dev/stays/bare-chic";
const DIR = fileURLToPath(new URL("../cp1/", import.meta.url));
mkdirSync(DIR, { recursive: true });
const VIEWS = [
  { name: "390", w: 390, h: 844, dpr: 2, mobile: true },
  { name: "768", w: 768, h: 1024, dpr: 2, mobile: true },
  { name: "1440", w: 1440, h: 900, dpr: 1, mobile: false },
];
const DATES = "?checkIn=2026-12-10&checkOut=2026-12-12&adults=2";

const MEASURE = `(() => {
  const cta = [...document.querySelectorAll("a")].find((a) => a.textContent.trim() === "Xem phòng trống");
  const r = cta.getBoundingClientRect();
  const imgs = [...document.querySelectorAll("main img")];
  const visible = (e) => e.getClientRects().length > 0;
  const small = [...document.querySelectorAll("main a, main button, header a, header button")].filter(visible).map((e) => { const b = e.getBoundingClientRect(); return { label: (e.getAttribute("aria-label") || e.textContent).trim().slice(0, 40), w: Math.round(b.width), h: Math.round(b.height) }; }).filter((c) => c.h < 44);
  return {
    title: document.title,
    robots: document.querySelector('meta[name=robots]')?.content ?? null,
    jsonLd: document.querySelectorAll('script[type="application/ld+json"]').length,
    headings: [...document.querySelectorAll("h1, h2, h3, h4")].map((h) => h.tagName + " " + h.textContent.trim().slice(0, 50)),
    main: document.querySelectorAll("main").length,
    overflowPx: document.documentElement.scrollWidth - innerWidth,
    cta: { href: cta.getAttribute("href"), inFirstScreen: r.bottom <= innerHeight, top: Math.round(r.top), height: Math.round(r.height) },
    price: document.querySelector("main h1")?.closest("div")?.innerText.match(/Giá tham khảo\\s*([\\d,]+)/)?.[1] ?? null,
    images: imgs.map((i) => ({ alt: i.alt.slice(0, 60), loaded: i.complete && i.naturalWidth > 0, loading: i.loading, src: (i.currentSrc || i.src).replace(location.origin, "").slice(0, 80) })),
    captions: [...document.querySelectorAll("main figcaption")].map((f) => f.textContent),
    placeholders: [...document.querySelectorAll('main [role="img"]')].map((e) => e.getAttribute("aria-label")),
    rooms: document.querySelector("#rooms")?.innerText.replace(/\\n+/g, " | ").slice(0, 700),
    mapLink: document.querySelector('#location a[target="_blank"]')?.getAttribute("href") ?? null,
    nearbyItems: document.querySelectorAll("#location li").length,
    amenities: [...document.querySelectorAll("#amenities li")].map((li) => li.textContent),
    under44: small,
  };
})()`;

console.log(await launch());
const out = { base: BASE, route: ROUTE, date: new Date().toISOString() };
for (const view of VIEWS) {
  for (const [state, search] of [["no-dates", ""], ["dates", DATES]]) {
    const p = await Page.open();
    p.errors = [];
    p.on("Runtime.exceptionThrown", (e) => p.errors.push(e.exceptionDetails.exception?.description?.slice(0, 160) ?? e.exceptionDetails.text));
    await p.viewport(view.w, view.h, view.dpr, view.mobile);
    await p.media([{ name: "prefers-reduced-motion", value: "reduce" }].reduce((o, f) => ({ ...o, [f.name]: f.value }), {}));
    await p.goto(BASE + ROUTE + search, { settle: 2500 });
    const key = `${view.name}-${state}`;
    await p.shot(`${DIR}/${key}-first-screen.png`);
    // Load every lazy image before the full-page capture.
    await p.eval(`(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight / 2) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); } scrollTo(0, 0); })()`);
    await sleep(1500);
    out[key] = { ...(await p.eval(MEASURE)), errors: p.errors };
    await p.shot(`${DIR}/${key}-full.jpg`, { full: true, quality: 80 });
    if (state === "dates") {
      // The hero CTA jumps to the rooms and keeps the stay in the address.
      await p.eval(`[...document.querySelectorAll("a")].find((a) => a.textContent.trim() === "Xem phòng trống").click()`);
      await sleep(800);
      out[key].afterCta = await p.eval(`({ hash: location.hash, search: location.search, roomsTop: Math.round(document.querySelector("#rooms").getBoundingClientRect().top) })`);
      await p.shot(`${DIR}/${key}-rooms.png`);
    }
    console.log(key, out[key].overflowPx, out[key].cta, out[key].errors.length);
    await p.close();
  }
}
writeFileSync(`${DIR}/results.json`, JSON.stringify(out, null, 2));
quit();
