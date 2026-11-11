// VNest V3 Stage 2 refinement (24/10/2026): floating brand preview + discovery filter toolbar.
//   BASE=http://localhost:3401 node docs/qa/v3-stage1-2026-10-24/scripts/refine.mjs
// Against `next start`. Real mouse at 1440 and 1280; touch at 768 and 390.
// Writes refine-results.json and screenshots to ../refine/.
import { mkdirSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
const ROOT = "/Users/noe/Documents/GitHub/VNest 2";
const { launch, quit, Page, sleep } = await import(pathToFileURL(`${ROOT}/docs/qa/brand-collection/scripts/lib.mjs`).href);
const BASE = process.env.BASE ?? "http://localhost:3400";
const OUT = `${ROOT}/docs/qa/v3-stage1-2026-10-24`;
const SHOTS = `${OUT}/refine`;
mkdirSync(SHOTS, { recursive: true });
const VIEWS = [
  { name: "1440", w: 1440, h: 900, dpr: 1, mobile: false },
  { name: "1280", w: 1280, h: 800, dpr: 1, mobile: false },
  { name: "768", w: 768, h: 1024, dpr: 1, mobile: true },
  { name: "390", w: 390, h: 844, dpr: 2, mobile: true },
];
const CLS = `window.__shifts=[];new PerformanceObserver(l=>{for(const e of l.getEntries())window.__shifts.push({v:e.value,i:e.hadRecentInput,t:performance.now()})}).observe({type:"layout-shift",buffered:true});`;
const TABS = `[...document.querySelectorAll('#thuong-hieu [role=tab]')]`;
const PANEL = `document.querySelector('#thuong-hieu [role=tabpanel]')`;
const CARD = `document.querySelector('#thuong-hieu > [aria-hidden=true][data-brand]')`;
const rect = (js) => `(() => { const e = ${js}; if (!e) return null; const r = e.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), cx: r.x + r.width / 2, cy: r.y + r.height / 2, bottom: Math.round(r.bottom), right: Math.round(r.right) }; })()`;
const overlap = (a, b) => !!a && !!b && !(a.right <= b.x || b.right <= a.x || a.bottom <= b.y || b.bottom <= a.y);
const state = `({ selected: ${TABS}.find((t) => t.getAttribute('aria-selected') === 'true')?.dataset.brand, panel: ${PANEL}.dataset.brand, card: ${CARD}?.dataset.brand ?? null, placed: !!${CARD}?.dataset.placed })`;
const results = { base: BASE, date: "2026-10-24", views: [] };
const errors = [];
console.log(await launch());

for (const view of VIEWS) {
  const r = { view: view.name, checks: {} };
  const ok = (name, pass, detail = {}) => (r.checks[name] = { pass: !!pass, ...detail });
  const p = await Page.open();
  p.on("Runtime.exceptionThrown", (e) => errors.push({ view: view.name, text: e.exceptionDetails?.exception?.description?.slice(0, 200) }));
  p.on("Runtime.consoleAPICalled", (e) => e.type === "error" && errors.push({ view: view.name, text: e.args?.map((a) => a.value ?? a.description).join(" ").slice(0, 200) }));
  await p.viewport(view.w, view.h, view.dpr, view.mobile);
  await p.send("Page.addScriptToEvaluateOnNewDocument", { source: CLS });
  await p.goto(`${BASE}/dev/demo`, { settle: 2500 });
  const move = (x, y) => p.send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y });

  // ── Task 1: brand index at rest ──
  await p.eval(`document.getElementById('thuong-hieu').scrollIntoView({ block: 'start', behavior: 'instant' })`);
  await sleep(600);
  const rest = await p.eval(`${TABS}.map((t) => ({ brand: t.dataset.brand, imgs: t.querySelectorAll('img').length, draft: /DRAFT|giới thiệu/i.test(t.innerText), text: t.innerText.replace(/\\n/g, ' | ') }))`);
  ok("T1 rows at rest: logo, name, city only (no thumbnail, no draft text)", rest.every((x) => x.imgs === 1 && !x.draft), { rest });
  await p.shot(`${SHOTS}/${view.name}-1-brand-rest.png`);

  if (!view.mobile) {
    const layout = async () => p.eval(`({ rows: ${TABS}.map((t) => Math.round(t.getBoundingClientRect().top)), panel: ${rect(PANEL)}, link: Math.round(document.querySelector('#thuong-hieu a[href="#kham-pha"]').getBoundingClientRect().top) })`);
    const before = await layout();
    const shiftsBefore = await p.eval(`window.__shifts.length`);

    // Hover intent: a quick pass over a row opens nothing.
    const nang = await p.eval(rect(`${TABS}[1]`));
    await move(nang.cx, nang.cy);
    await sleep(50);
    await move(20, nang.cy);
    await sleep(350);
    ok("T1 hover intent: a quick pass does not open a preview", (await p.eval(state)).card === null);

    // Hover The Nắng Suites.
    await move(nang.cx, nang.cy);
    await sleep(450);
    const hn = await p.eval(state);
    const card = await p.eval(rect(CARD));
    const header = await p.eval(`Math.round(document.querySelector('header').getBoundingClientRect().bottom)`);
    const selectedRow = await p.eval(rect(`${TABS}.find((t) => t.getAttribute('aria-selected') === 'true')`));
    const ledger = await p.eval(rect(`document.querySelector('#thuong-hieu [role=tablist]')`));
    const after = await layout();
    const hit = await p.eval(`(() => { const c = ${CARD}.getBoundingClientRect(); const e = document.elementFromPoint(c.x + c.width / 2, c.y + c.height / 2); return !${CARD}.contains(e); })()`);
    const anim = await p.eval(`getComputedStyle(${CARD}).animationName`);
    ok("T1 hover Nắng: floating preview only, selection and panel unchanged", hn.card === "the-nang" && hn.placed && hn.selected === "bare" && hn.panel === "bare", hn);
    ok("T1 preview size: about 32–38vw, capped near 500px", card.w >= Math.min(0.3 * view.w, 440) && card.w <= 520, { width: card.w, vw: view.w });
    ok("T1 preview inside the viewport, below the header", card.y >= header && card.bottom <= view.h && card.right <= view.w && card.x >= 0, { card, header });
    ok("T1 preview never covers the navigation or the active row", card.x >= ledger.right && !overlap(card, selectedRow) && !overlap(card, nang), { card, ledger, selectedRow });
    ok("T1 preview is pointer-transparent (never blocks a click)", hit);
    ok("T1 no reflow: rows, panel and link did not move", JSON.stringify(before) === JSON.stringify(after), { before, after });
    ok("T1 subtle entrance animation", anim.endsWith("preview-in"), { anim });
    await p.shot(`${SHOTS}/${view.name}-2-hover-nang.png`);

    // Straight to Pepper House: switches at once, no flicker through "closed".
    const pepper = await p.eval(rect(`${TABS}[2]`));
    await move(pepper.cx, pepper.cy - 20);
    await sleep(40);
    const mid = await p.eval(state);
    await move(pepper.cx, pepper.cy);
    await sleep(300);
    const hp = await p.eval(state);
    const cardP = await p.eval(rect(CARD));
    ok("T1 hover Pepper: switches directly between rows", hp.card === "pepper-house" && mid.card !== null && hp.selected === "bare", { mid, hp });
    ok("T1 Pepper preview inside the viewport", cardP.y >= header && cardP.bottom <= view.h, { cardP });
    await p.shot(`${SHOTS}/${view.name}-3-hover-pepper.png`);

    // Hovering the selected brand previews nothing.
    const bare = await p.eval(rect(`${TABS}[0]`));
    await move(bare.cx, bare.cy);
    await sleep(300);
    ok("T1 the selected brand never previews", (await p.eval(state)).card === null);

    // Leave: closes after a short grace.
    await move(pepper.cx, pepper.cy);
    await sleep(300);
    await move(20, 20);
    await sleep(80);
    const grace = await p.eval(state);
    await sleep(300);
    ok("T1 leaving closes after a short grace", grace.card === "pepper-house" && (await p.eval(state)).card === null, { grace });

    // Escape keeps the selection; click commits and closes.
    await move(pepper.cx, pepper.cy);
    await sleep(400);
    await p.key("Escape");
    await sleep(150);
    const esc = await p.eval(state);
    ok("T1 Escape closes the preview and keeps the selection", esc.card === null && esc.selected === "bare", esc);
    await p.click(pepper.cx, pepper.cy);
    await sleep(450);
    const clicked = await p.eval(state);
    ok("T1 click commits, updates the About panel, closes the preview", clicked.selected === "pepper-house" && clicked.panel === "pepper-house" && clicked.card === null, clicked);
    await move(20, 20);
    await sleep(300);
    await p.eval(`document.getElementById('thuong-hieu').scrollIntoView({ block: 'start', behavior: 'instant' })`);
    await sleep(400);
    await p.shot(`${SHOTS}/${view.name}-4-selected-pepper.png`);

    // Keyboard: focus previews, Escape closes, Enter commits.
    await p.key("Shift", { code: "ShiftLeft", vk: 16 });
    await p.eval(`${TABS}.find((t) => t.getAttribute('aria-selected') === 'true').focus()`);
    await p.key("ArrowUp", { code: "ArrowUp", vk: 38 });
    await sleep(300);
    const kf = await p.eval(`({ ...${state}, focused: document.activeElement.dataset.brand, described: !!document.activeElement.getAttribute('aria-describedby') })`);
    await p.key("Escape");
    await sleep(150);
    const ke = await p.eval(state);
    await p.key("Enter");
    await sleep(400);
    const kn = await p.eval(state);
    ok("T1 keyboard: focus previews, Escape closes, Enter commits", kf.focused === "the-nang" && kf.card === "the-nang" && kf.described && ke.card === null && ke.selected === "pepper-house" && kn.selected === "the-nang" && kn.card === null, { kf, ke, kn });

    // Reduced motion: no entrance animation.
    await p.media({ "prefers-reduced-motion": "reduce" });
    await move(pepper.cx, pepper.cy);
    await sleep(400);
    ok("T1 reduced motion: preview appears without animation", (await p.eval(`${CARD} ? getComputedStyle(${CARD}).animationName : 'no card'`)) === "none");
    await move(20, 20);
    await p.media({});
    await sleep(300);
    const shifts = await p.eval(`window.__shifts.slice(${shiftsBefore}).filter((s) => !s.i).reduce((a, s) => a + s.v, 0)`);
    ok("T1 no unexpected layout shift during preview interaction", shifts < 0.001, { shifts });
  } else {
    // Touch: no preview; a tap selects directly; the panel follows below.
    const nang = await p.eval(rect(`${TABS}[1]`));
    await p.tap(nang.cx, nang.cy);
    await sleep(450);
    const tapped = await p.eval(state);
    const order = await p.eval(`${rect(PANEL)}.y > ${rect(`document.querySelector('#thuong-hieu [role=tablist]')`)}.bottom`);
    ok("T1 touch: tap selects directly, no floating preview, panel below", tapped.selected === "the-nang" && tapped.panel === "the-nang" && tapped.card === null && order, tapped);
    const logos = await p.eval(`${TABS}.map((t) => Math.round(t.querySelector('img').getBoundingClientRect().height))`);
    ok("T1 touch: logos readable (≥ 32px tall)", logos.every((h) => h >= 32), { logos });
    await p.eval(`document.getElementById('thuong-hieu').scrollIntoView({ block: 'start', behavior: 'instant' })`);
    await sleep(400);
    await p.shot(`${SHOTS}/${view.name}-4-selected-nang.png`);
  }

  // ── Task 2: discovery ──
  await p.goto(`${BASE}/dev/demo`, { settle: 2000 });
  await p.eval(`document.getElementById('kham-pha').scrollIntoView({ block: 'start', behavior: 'instant' })`);
  await sleep(500);
  const struct = await p.eval(`(() => {
    const sec = document.getElementById('kham-pha');
    const intro = sec.querySelector('header').getBoundingClientRect();
    const bar = sec.querySelector('[role=group][aria-label]').getBoundingClientRect();
    const grid = sec.querySelector('ul').getBoundingClientRect();
    const visible = (e) => !!e && e.getClientRects().length > 0 && getComputedStyle(e).display !== 'none';
    const groups = [...sec.querySelectorAll('[role=radiogroup]')];
    const rows = groups.map((g) => { const tops = [...g.querySelectorAll('span')].map((s) => Math.round(s.getBoundingClientRect().top)); return { label: g.getAttribute('aria-labelledby'), lines: new Set(tops).size, h: Math.round(Math.min(...[...g.querySelectorAll('span')].map((s) => s.getBoundingClientRect().height))) }; });
    const selects = [...sec.querySelectorAll('select')];
    return {
      introAbove: intro.bottom <= bar.top, barAboveGrid: bar.bottom <= grid.top, barWidth: Math.round(bar.width), sectionWidth: Math.round(sec.getBoundingClientRect().width),
      segmentedVisible: groups.some(visible), selectsVisible: selects.some(visible), rows,
      selectH: selects.filter(visible).map((s) => Math.round(s.getBoundingClientRect().height)),
      barHeight: Math.round(bar.height), lead: sec.querySelector('header p:last-child')?.textContent,
      options: { brand: [...selects[0].options].map((o) => o.text), city: [...selects[1].options].map((o) => o.text) },
    };
  })()`);
  ok("T2 order: introduction, then toolbar, then grid", struct.introAbove && struct.barAboveGrid, struct);
  ok("T2 all brands and all cities still offered", struct.options.brand.join("|") === "Mọi thương hiệu|Bare Boutique Stays|The Nắng Suites|Pepper House" && struct.options.city.join("|") === "Mọi thành phố|TP. Hồ Chí Minh|Đà Nẵng", struct.options);
  if (view.w >= 768) {
    ok("T2 segmented controls (no selects) at this width", struct.segmentedVisible && !struct.selectsVisible);
    ok("T2 no orphan wrapping: each filter on one line", struct.rows.every((x) => x.lines === 1), { rows: struct.rows });
    ok("T2 touch-size options (≥ 44px)", struct.rows.every((x) => x.h >= 44), { rows: struct.rows });
  } else {
    ok("T2 phone: two compact selects (no segmented)", struct.selectsVisible && !struct.segmentedVisible && struct.selectH.every((h) => h >= 44), { selectH: struct.selectH });
    ok("T2 phone: compact filter area", struct.barHeight <= 190, { barHeight: struct.barHeight });
  }
  await p.shot(`${SHOTS}/${view.name}-5-filters.png`);

  // Combinations. Desktop/tablet: real pointer on the segments; phone: the selects.
  const choose = async (kind, label) => {
    if (view.w >= 768) {
      const c = await p.eval(`(() => { const g = [...document.querySelectorAll('#kham-pha [role=radiogroup]')][${kind === "brand" ? 0 : 1}]; const s = [...g.querySelectorAll('span')].find((x) => x.textContent === ${JSON.stringify(label)}); const r = s.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
      if (view.mobile) await p.tap(c.x, c.y);
      else await p.click(c.x, c.y);
    } else {
      await p.eval(`(() => { const s = document.querySelectorAll('#kham-pha select')[${kind === "brand" ? 0 : 1}]; const o = [...s.options].find((x) => x.text === ${JSON.stringify(label)}); const set = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set; set.call(s, o.value); s.dispatchEvent(new Event('change', { bubbles: true })); })()`);
    }
    await sleep(350);
    return p.eval(`({ cards: [...document.querySelectorAll('#kham-pha ul > li h3')].map((h) => h.textContent.replace(' →', '')), result: document.getElementById('kham-pha-result').textContent, brand: document.querySelectorAll('#kham-pha select')[0].value, city: document.querySelectorAll('#kham-pha select')[1].value })`);
  };
  const combos = [];
  const expect = async (kind, label, n, note) => {
    const got = await choose(kind, label);
    const count = Number((got.result.match(/(\d+) nơi ở/) ?? [])[1]);
    combos.push({ step: `${kind}: ${label}`, n: got.cards.length, result: got.result });
    return got.cards.length === n && count === n && (!note || got.result.includes(note));
  };
  const combo = [
    await expect("brand", "Bare Boutique Stays", 4),
    await expect("city", "TP. Hồ Chí Minh", 3),
    await expect("city", "Đà Nẵng", 1),
    await expect("brand", "Pepper House", 1, "bộ lọc địa điểm đã được bỏ"),
    await expect("brand", "The Nắng Suites", 1),
    await expect("city", "Đà Nẵng", 1),
    await expect("brand", "Mọi thương hiệu", 2),
    await expect("city", "Mọi thành phố", 6),
  ];
  ok("T2 brand × city combinations and result counts", combo.every(Boolean), { combos });
  await choose("brand", "Bare Boutique Stays");
  await p.shot(`${SHOTS}/${view.name}-6-filters-bare.png`);
  await choose("brand", "Mọi thương hiệu");

  ok("no horizontal overflow", !(await p.eval(`document.documentElement.scrollWidth > innerWidth`)));
  await p.close();
  results.views.push(r);
  console.log(view.name, Object.entries(r.checks).filter(([, v]) => !v.pass).map(([k]) => k));
}
results.consoleErrors = errors;
writeFileSync(`${OUT}/refine-results.json`, JSON.stringify(results, null, 1));
console.log("errors", errors.length);
quit();
