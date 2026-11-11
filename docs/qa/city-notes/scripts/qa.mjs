// City Notes prototype QA (CS-7, 20/10/2026), against `next start` (launch config
// vnest-v2-client-preview, port 3400; run `npm run build` first). Run from the repository root:
//   node docs/qa/city-notes/scripts/qa.mjs
// Measures at 390, 768 and 1440: overflow, section height, targets, hydration (console errors,
// the hydrated marker), CLS during load and while interacting, keyboard and touch on the tabs,
// expand and collapse, the public audience, no-script, and the three-place phone variant.
// Writes results.json and the screenshots next to this folder.
import { pathToFileURL } from "node:url";
import { writeFileSync } from "node:fs";
const ROOT = "/Users/noe/Documents/GitHub/VNest 2";
const { launch, quit, Page, sleep } = await import(pathToFileURL(`${ROOT}/docs/qa/brand-collection/scripts/lib.mjs`).href);
const BASE = process.env.BASE ?? "http://localhost:3400";
const OUT = `${ROOT}/docs/qa/city-notes`;
const VIEWS = [
  { name: "390", w: 390, h: 844, dpr: 2, mobile: true },
  { name: "768", w: 768, h: 1024, dpr: 2, mobile: true },
  { name: "1440", w: 1440, h: 900, dpr: 1, mobile: false },
];

// Layout shifts, recorded from the first byte (buffered), with whether input preceded them.
const CLS_PROBE = `window.__shifts = []; new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__shifts.push({ value: e.value, input: e.hadRecentInput, t: Math.round(e.startTime) }); }).observe({ type: "layout-shift", buffered: true });`;
const S = `document.querySelector("section[aria-labelledby]")`;
const MEASURE = `(() => {
  const s = ${S};
  const visible = (e) => e.getClientRects().length > 0;
  const targets = [...s.querySelectorAll("button, a")].filter(visible).map((e) => { const r = e.getBoundingClientRect(); return { t: e.textContent.trim().slice(0, 32), w: Math.round(r.width), h: Math.round(r.height) }; });
  const panel = [...s.querySelectorAll("[role=tabpanel]")].find(visible);
  return {
    overflowX: document.documentElement.scrollWidth > innerWidth,
    sectionHeight: Math.round(s.getBoundingClientRect().height),
    hydrated: s.dataset.hydrated === "true",
    selected: s.querySelector("[aria-selected=true]")?.textContent.replace(/\\s+/g, " ").trim(),
    visiblePlaces: [...panel.querySelectorAll("li")].filter(visible).map((li) => li.querySelector("p").textContent),
    expanded: s.querySelector("[aria-expanded]")?.getAttribute("aria-expanded") ?? null,
    more: s.querySelector("[aria-expanded]")?.textContent.trim() ?? null,
    flags: [...s.querySelectorAll("li p:nth-child(3)")].filter(visible).map((p) => p.textContent),
    smallTargets: targets.filter((b) => b.h < 44 || b.w < 44),
    cls: (window.__shifts ?? []).filter((x) => !x.input).reduce((a, x) => a + x.value, 0),
    clsWithInput: (window.__shifts ?? []).filter((x) => x.input).reduce((a, x) => a + x.value, 0),
  };
})()`;

async function open(view, query = "", { script = true } = {}) {
  const p = await Page.open();
  const errors = [];
  p.on("Runtime.exceptionThrown", (e) => errors.push(e.exceptionDetails?.exception?.description ?? e.exceptionDetails?.text));
  p.on("Runtime.consoleAPICalled", (e) => { if (e.type === "error" || e.type === "warning") errors.push(e.args.map((a) => a.value ?? a.description).join(" ")); });
  await p.viewport(view.w, view.h, view.dpr, view.mobile);
  if (!script) await p.send("Emulation.setScriptExecutionDisabled", { value: true });
  else await p.send("Page.addScriptToEvaluateOnNewDocument", { source: CLS_PROBE });
  await p.goto(`${BASE}/dev/city-notes${query}`, { settle: 1500 });
  if (script) await p.eval("document.fonts.ready.then(() => true)");
  return { p, errors };
}

/** Scrolls so the section sits under the Vị trí ghost, and captures what one screen (or more) shows. */
async function shoot(p, view, file, { tall = false } = {}) {
  const box = await p.eval(`(() => { const r = ${S}.getBoundingClientRect(); return { top: r.top + scrollY, height: r.height }; })()`);
  const lead = view.mobile ? 72 : 140;
  const h = tall ? Math.max(view.h, Math.ceil(box.height + lead + 120)) : view.h;
  await p.viewport(view.w, h, view.dpr, view.mobile);
  await p.eval(`scrollTo(0, ${box.top - lead})`);
  await sleep(350);
  await p.shot(`${OUT}/${file}`);
  await p.viewport(view.w, view.h, view.dpr, view.mobile);
}

// Real input (touch on phones, mouse otherwise), so layout shifts after it count as expected ones.
async function press(p, view, selector) {
  const c = await p.eval(`(() => { const e = ${S}.querySelector(${JSON.stringify(selector)}); e.scrollIntoView({ block: "center" }); const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
  await sleep(150);
  if (view.mobile) await p.tap(c.x, c.y);
  else await p.click(c.x, c.y);
}
const results = { base: BASE, runs: [] };
console.log(await launch());

for (const view of VIEWS) {
  // 1. First state, private preview, TP. Hồ Chí Minh.
  {
    const { p, errors } = await open(view);
    await sleep(1500);
    const first = await p.eval(MEASURE);
    await shoot(p, view, `${view.name}-hcm-first.png`);
    // Touch or click the second tab, then expand.
    const tab = await p.eval(`(() => { const r = ${S}.querySelectorAll("[role=tab]")[1].getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
    if (view.mobile) await p.tap(tab.x, tab.y);
    else await p.click(tab.x, tab.y);
    const explore = await p.eval(MEASURE);
    await press(p, view, "[aria-expanded]");
    await sleep(400);
    const expanded = await p.eval(MEASURE);
    await shoot(p, view, `${view.name}-hcm-explore-expanded.png`, { tall: true });
    // Switching tab keeps the expansion (CS-4).
    await press(p, view, "[role=tab]");
    await sleep(200);
    const eatExpanded = await p.eval(MEASURE);
    await press(p, view, "[aria-expanded]");
    await sleep(400);
    const collapsed = await p.eval(MEASURE);
    const collapseFocus = await p.eval(`(() => { const r = ${S}.querySelector("[aria-expanded]").getBoundingClientRect(); return { inView: r.top >= 0 && r.bottom <= innerHeight }; })()`);
    results.runs.push({ view: view.name, check: "hcm private: first, tab, expand, switch, collapse", first, explore, expanded, eatExpanded, collapsed, collapseButtonInView: collapseFocus.inView, consoleErrors: errors });
    await p.close();
  }
  // 2. Keyboard (WAI-ARIA tabs), Đà Nẵng, private preview: the flags show.
  {
    const { p, errors } = await open(view, "?city=da-nang");
    const steps = [];
    await p.eval(`${S}.querySelector("[aria-selected=true]").focus()`);
    const state = () => p.eval(`({ focus: document.activeElement.getAttribute("role") + ":" + document.activeElement.textContent.replace(/\\s+/g, " ").trim(), selected: ${S}.querySelector("[aria-selected=true]").textContent.replace(/\\s+/g, " ").trim(), first: [...${S}.querySelectorAll("[role=tabpanel]")].find((x) => x.getClientRects().length > 0).querySelector("li p").textContent })`);
    for (const [key, vk] of [["ArrowRight", 39], ["ArrowRight", 39], ["ArrowLeft", 37], ["End", 35], ["Home", 36]]) {
      await p.key(key, { vk });
      steps.push({ key, ...(await state()) });
    }
    await p.key("ArrowRight", { vk: 39 });
    await p.key("Tab");
    steps.push({ key: "Tab", ...(await state()) });
    await p.key("Tab");
    steps.push({ key: "Tab", ...(await state()) });
    await p.key("Enter");
    await sleep(300);
    const afterEnter = await p.eval(MEASURE);
    await shoot(p, view, `${view.name}-dn-explore-expanded-private.png`, { tall: true });
    await p.key("Enter");
    await sleep(300);
    const afterSecondEnter = await p.eval(MEASURE);
    if (view.name === "1440") {
      await p.key("Enter");
      await sleep(300);
      await p.eval(`${S}.querySelector("[aria-expanded]").focus()`);
      await shoot(p, view, `${view.name}-keyboard-focus.png`);
    }
    results.runs.push({ view: view.name, check: "keyboard, da-nang private", steps, afterEnter, afterSecondEnter, consoleErrors: errors });
    await p.close();
  }
  // 3. Public audience: no flags, no review notes; D30 and D33 as the rules give them.
  {
    const { p, errors } = await open(view, "?city=da-nang&audience=public");
    await press(p, view, "[role=tab]:nth-child(2)");
    await press(p, view, "[aria-expanded]");
    await sleep(300);
    const m = await p.eval(MEASURE);
    const reviewNotes = await p.eval(`!!${S}.querySelector("aside")`);
    const dataSource = await p.eval(`${S}.querySelectorAll("[data-source]").length`);
    if (view.name !== "768") await shoot(p, view, `${view.name}-dn-explore-expanded-public.png`, { tall: true });
    results.runs.push({ view: view.name, check: "public, da-nang", ...m, reviewNotes, dataSource, consoleErrors: errors });
    await p.close();
  }
  // 4. Without script: both lists in full, no tabs, no button.
  {
    const { p } = await open(view, "?audience=public", { script: false });
    const m = await p.eval(`(() => { const s = ${S}; const vis = (e) => e.getClientRects().length > 0; return { places: [...s.querySelectorAll("li")].filter(vis).length, tabsVisible: vis(s.querySelector("[role=tablist]")), buttonVisible: !!s.querySelector("[aria-expanded]") && vis(s.querySelector("[aria-expanded]")), headings: [...s.querySelectorAll("h3")].filter(vis).map((h) => h.textContent), overflowX: document.documentElement.scrollWidth > innerWidth }; })()`);
    if (view.name === "390") await p.shot(`${OUT}/${view.name}-no-script.png`, { full: true });
    results.runs.push({ view: view.name, check: "no script", ...m });
    await p.close();
  }
}

// 5. Refinement 1: three places on phones, for comparison (390 only; 768 and up are unaffected).
for (const view of VIEWS) {
  const { p, errors } = await open(view, "?mobile=3&audience=public");
  const m = await p.eval(MEASURE);
  if (view.name === "390") await shoot(p, view, `390-hcm-first-mobile3.png`);
  const four = await (async () => {
    const o = await open(view, "?audience=public");
    const r = await o.p.eval(MEASURE);
    if (view.name === "390") await shoot(o.p, view, `390-hcm-first-public.png`);
    await o.p.close();
    return r;
  })();
  results.runs.push({ view: view.name, check: "three vs four on phones (public)", threeHeight: m.sectionHeight, threePlaces: m.visiblePlaces.length, fourHeight: four.sectionHeight, fourPlaces: four.visiblePlaces.length, consoleErrors: errors });
  await p.close();
}

quit();
writeFileSync(`${OUT}/results.json`, JSON.stringify(results, null, 1));
console.log(JSON.stringify(results, null, 1));
