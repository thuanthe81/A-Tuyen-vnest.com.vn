// Screenshots and measurements for both concepts: 390, 768 and 1440 px; all brands and Bare chosen.
// Usage: node docs/qa/brand-collection/scripts/shots.mjs   (dev server on BASE, default :3200)
import { writeFileSync } from "node:fs";
import { BASE, HIDE_DEV, launch, OUT, Page, quit, ROUTES, sleep } from "./lib.mjs";

const VIEWS = [
  { name: "390", w: 390, h: 844, dpr: 2, mobile: true },
  { name: "768", w: 768, h: 1024, dpr: 2, mobile: true },
  { name: "1440", w: 1440, h: 900, dpr: 1, mobile: false },
];

// Runs in the page. "Brand area" is the section: heading, brand composition and the city/area filters.
const MEASURE = `(() => {
  const section = document.querySelector("main section, section");
  const s = section.getBoundingClientRect();
  const grid = document.querySelector("ul[aria-labelledby]");
  const firstImage = grid.querySelector("img").getBoundingClientRect();
  const controls = [...section.querySelectorAll("button, select, a")].concat([...document.querySelectorAll("[class*=result] button")]);
  const small = controls.map((e) => { const b = e.getBoundingClientRect(); return { label: (e.getAttribute("aria-label") || e.textContent).trim().slice(0, 40), w: Math.round(b.width), h: Math.round(b.height) }; }).filter((c) => c.w < 44 || c.h < 44);
  return {
    viewport: [innerWidth, innerHeight],
    overflowPx: document.documentElement.scrollWidth - innerWidth,
    sectionHeight: Math.round(s.height),
    sectionTopToFirstCardImage: Math.round(firstImage.top - s.top),
    firstCardImageVisibleWhenSectionAtTop: Math.max(0, Math.round(innerHeight - (firstImage.top - s.top))),
    cards: grid.children.length,
    cardNames: [...grid.querySelectorAll("h3")].map((h) => h.textContent),
    summary: document.querySelector("[aria-live]").textContent,
    pressed: [...section.querySelectorAll("[aria-pressed=true], [aria-checked=true]")].map((e) => (e.getAttribute("aria-label") || e.textContent).trim().slice(0, 50)),
    controlsUnder44: small,
    address: location.search,
  };
})()`;

const CHOOSE_BARE = {
  a: `document.querySelector('button[aria-label^="Bare Boutique Stays"]').click()`,
  b: `document.querySelector('[role=radio][aria-label^="Bare Boutique Stays"]').click()`,
};

console.log(await launch());
const results = {};
for (const concept of ["a", "b"]) {
  for (const view of VIEWS) {
    const p = await Page.open();
    p.errors = [];
    p.on("Runtime.exceptionThrown", (e) => p.errors.push(e.exceptionDetails.exception?.description?.slice(0, 160) ?? e.exceptionDetails.text));
    await p.viewport(view.w, view.h, view.dpr, view.mobile);
    await p.goto(BASE + ROUTES[concept], { settle: 1500 });
    await p.eval(HIDE_DEV);
    const top = await p.eval(`Math.round(document.querySelector("section").getBoundingClientRect().top + scrollY)`);
    for (const state of ["all", "bare"]) {
      if (state === "bare") {
        await p.eval(CHOOSE_BARE[concept]);
        await sleep(900);
      }
      await p.eval(`scrollTo(0, ${top})`);
      await sleep(400);
      const key = `${concept}-${view.name}-${state}`;
      results[key] = { ...(await p.eval(MEASURE)), errors: [...p.errors] };
      await p.shot(`${OUT}/${key}.png`);
      await p.shot(`${OUT}/${key}-full.jpg`, { full: true, quality: 82 });
      console.log(key, results[key].sectionHeight, results[key].sectionTopToFirstCardImage, results[key].cards, results[key].overflowPx);
    }
    await p.close();
  }
}
writeFileSync(`${OUT}/measurements.json`, JSON.stringify(results, null, 2));
quit();
