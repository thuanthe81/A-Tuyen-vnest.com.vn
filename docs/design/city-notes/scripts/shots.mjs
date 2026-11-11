// Renders the City Notes frames to PNG at 1440 and 390 px, and measures what the board claims
// (overflow, target sizes, tab semantics). Run from the repository root:
//   node docs/design/city-notes/scripts/shots.mjs
// The QA library is imported by a file:// URL: the folder name has a space (see client-data audit notes).
import { pathToFileURL } from "node:url";
import { writeFileSync } from "node:fs";
const ROOT = "/Users/noe/Documents/GitHub/VNest 2";
const { launch, quit, Page, sleep } = await import(pathToFileURL(`${ROOT}/docs/qa/brand-collection/scripts/lib.mjs`).href);
const FRAME = pathToFileURL(`${ROOT}/docs/design/city-notes/frames/city-notes.html`).href;
const OUT = `${ROOT}/docs/design/city-notes/boards`;

const STATES = [
  { id: "hcm-eat", query: "city=ho-chi-minh&tab=eat" },
  { id: "hcm-explore-open", query: "city=ho-chi-minh&tab=explore&open=1" },
  { id: "dn-eat", query: "city=da-nang&tab=eat" },
];
const SIZES = [
  { id: "desktop-1440", width: 1440, height: 900, mobile: false },
  { id: "mobile-390", width: 390, height: 844, mobile: true },
];

await launch();
const page = await Page.open();
const report = [];
for (const size of SIZES) {
  for (const state of STATES) {
    await page.viewport(size.width, size.height, 2, size.mobile);
    await page.goto(`${FRAME}?${state.query}`, { settle: 1200 });
    await page.eval("document.fonts.ready.then(() => true)");
    // Bring the section up to just under the end of the location ghost.
    const m = await page.eval(`(() => {
      const s = document.getElementById("city-notes");
      const r = s.getBoundingClientRect();
      const top = r.top + scrollY - (${size.mobile} ? 72 : 120);
      return { top, height: r.height, doc: document.documentElement.scrollWidth, vw: innerWidth };
    })()`);
    // A frame tall enough for the whole section, at least one screen.
    const h = Math.max(size.height, Math.ceil(m.height + (size.mobile ? 72 + 96 : 120 + 120)));
    await page.viewport(size.width, h, 2, size.mobile);
    await page.eval(`scrollTo(0, ${m.top})`);
    await sleep(300);
    await page.shot(`${OUT}/${size.id}-${state.id}.png`);
    const facts = await page.eval(`(() => {
      const q = (s) => [...document.querySelectorAll(s)];
      const small = q(".cn-tab, .cn-more, .pill a").filter((e) => e.getClientRects().length > 0).map((e) => ({ t: e.textContent.trim().slice(0, 30), w: Math.round(e.getBoundingClientRect().width), h: Math.round(e.getBoundingClientRect().height) })).filter((b) => b.h < 44 || b.w < 44);
      return {
        overflowX: document.documentElement.scrollWidth > innerWidth,
        sectionHeight: Math.round(document.getElementById("city-notes").getBoundingClientRect().height),
        shown: q(".cn-place:not([hidden])").length,
        tabs: q("[role=tab]").map((t) => t.textContent.replace(/\\s+/g, " ").trim() + (t.getAttribute("aria-selected") === "true" ? " [selected]" : "")),
        smallTargets: small,
        font: document.fonts.check('500 16px "Be Vietnam Pro"'),
      };
    })()`);
    report.push({ size: size.id, state: state.id, frameHeight: h, ...facts });
  }
}
// Keyboard: arrow keys move between tabs and switch the panel.
await page.viewport(1440, 900, 1, false);
await page.goto(`${FRAME}?city=ho-chi-minh&tab=eat`, { settle: 800 });
await page.eval(`document.getElementById("cn-tab-eat").focus()`);
await page.key("ArrowRight", { vk: 39 });
const kb = await page.eval(`({ focused: document.activeElement.id, selected: document.querySelector("[aria-selected=true]").id, first: document.querySelector(".cn-name").textContent })`);
report.push({ keyboard: kb });
await page.close();
quit();
writeFileSync(`${OUT}/shots.json`, JSON.stringify(report, null, 1));
console.log(JSON.stringify(report, null, 1));
