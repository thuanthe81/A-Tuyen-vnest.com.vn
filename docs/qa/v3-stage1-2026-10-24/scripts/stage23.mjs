// VNest V3 Stage 2 (Brand Index A) and Stage 3 (Services B, Contact, FAQ, Footer), 24/10/2026.
//   BASE=http://localhost:3401 node docs/qa/v3-stage1-2026-10-24/scripts/stage23.mjs
// Against `next start`. Real mouse at 1440, touch at 768 and 390. Writes stage23-results.json and
// screenshots to ../stage23/.
import { mkdirSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
const ROOT = "/Users/noe/Documents/GitHub/VNest 2";
const { launch, quit, Page, sleep } = await import(pathToFileURL(`${ROOT}/docs/qa/brand-collection/scripts/lib.mjs`).href);
const BASE = process.env.BASE ?? "http://localhost:3400";
const OUT = `${ROOT}/docs/qa/v3-stage1-2026-10-24`;
const SHOTS = `${OUT}/stage23`;
mkdirSync(SHOTS, { recursive: true });
const VIEWS = [
  { name: "1440", w: 1440, h: 900, dpr: 1, mobile: false },
  { name: "768", w: 768, h: 1024, dpr: 1, mobile: true },
  { name: "390", w: 390, h: 844, dpr: 2, mobile: true },
];
const results = { base: BASE, date: "2026-10-24", views: [] };
const errors = [];
console.log(await launch());

const rect = (js) => `(() => { const e = ${js}; if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, cx: r.x + r.width / 2, cy: r.y + r.height / 2, bottom: r.bottom, right: r.right }; })()`;
const overlap = (a, b) => !!a && !!b && !(a.right <= b.x || b.right <= a.x || a.bottom <= b.y || b.bottom <= a.y);
async function bring(p, js, block = "center") {
  await p.eval(`(() => { const e = ${js}; e && e.scrollIntoView({ block: "${block}", behavior: "instant" }); })()`);
  await sleep(350);
  return p.eval(rect(js));
}
async function press(p, view, js) {
  const r = await bring(p, js);
  if (!r) throw new Error(`not found: ${js}`);
  if (view.mobile) await p.tap(r.cx, r.cy);
  else await p.click(r.cx, r.cy);
  await sleep(350);
}
const TABS = `[...document.querySelectorAll('#thuong-hieu [role=tab]')]`;
const PANEL = `document.querySelector('#thuong-hieu [role=tabpanel]')`;
const tabState = `${TABS}.map((t) => ({ brand: t.dataset.brand, selected: t.getAttribute('aria-selected') === 'true', preview: t.dataset.preview === 'true' }))`;

for (const view of VIEWS) {
  const r = { view: view.name, checks: {} };
  const ok = (name, pass, detail = {}) => (r.checks[name] = { pass: !!pass, ...detail });
  const p = await Page.open();
  p.on("Runtime.exceptionThrown", (e) => errors.push({ view: view.name, text: e.exceptionDetails?.exception?.description?.slice(0, 200) }));
  p.on("Runtime.consoleAPICalled", (e) => e.type === "error" && errors.push({ view: view.name, text: e.args?.map((a) => a.value ?? a.description).join(" ").slice(0, 200) }));
  const posts = [];
  p.on("Network.requestWillBeSent", (e) => e.request.method !== "GET" && posts.push(`${e.request.method} ${e.request.url}`));
  await p.viewport(view.w, view.h, view.dpr, view.mobile);
  await p.goto(`${BASE}/dev/demo`, { settle: 2500 });

  // ── Stage 2: structure ──
  const structure = await p.eval(`(() => {
    const tabs = ${TABS};
    const logos = tabs.map((t) => { const i = t.querySelector('img'); const r = i.getBoundingClientRect(); return { brand: t.dataset.brand, h: Math.round(r.height), ratio: +(r.width / r.height).toFixed(3), natural: +(i.naturalWidth / i.naturalHeight).toFixed(3) }; });
    return { count: tabs.length, names: tabs.map((t) => t.innerText.replace(/\\n/g, ' ')), hasAll: tabs.some((t) => /Tất cả/.test(t.innerText)), digits: tabs.some((t) => /\\d/.test(t.innerText)), logos, allLink: document.querySelector('#thuong-hieu a[href="#kham-pha"]')?.textContent.trim() };
  })()`);
  ok("S2 three brands, no 'Tất cả', no counts in the index", structure.count === 3 && !structure.hasAll && !structure.digits, structure);
  ok("S2 logos keep their own proportions (no distortion)", structure.logos.every((l) => Math.abs(l.ratio - l.natural) / l.natural < 0.03), { logos: structure.logos });
  ok("S2 Bare's thin script is drawn largest", structure.logos[0].h >= Math.max(structure.logos[1].h, structure.logos[2].h), { heights: structure.logos.map((l) => l.h) });
  await bring(p, `document.getElementById('thuong-hieu')`, "start");
  await sleep(500);
  await p.shot(`${SHOTS}/${view.name}-s2-brand-index.png`);

  if (!view.mobile) {
    // Hover = preview only, inside the row; never over the panel; click commits.
    const row2 = await p.eval(rect(`${TABS}[1]`));
    await p.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: row2.cx, y: row2.cy });
    await sleep(500);
    const hover = await p.eval(`({ state: ${tabState}, panel: ${PANEL}.dataset.brand })`);
    const card = await p.eval(rect(`document.querySelector('#thuong-hieu [aria-hidden=true][data-placed]')`));
    const rowRect = await p.eval(rect(`${TABS}[1]`));
    ok("S2 hover previews without selecting", hover.state[1].preview && !hover.state[1].selected && hover.panel === "bare", hover);
    ok("S2 floating preview opens beside the ledger, not over the hovered row", card && card.x >= rowRect.right && !overlap(card, rowRect), { card, rowRect });
    await p.shot(`${SHOTS}/${view.name}-s2-hover-preview.png`);
    // The panel CTA stays clickable while a preview is showing.
    const ctaHit = await p.eval(`(() => { const b = ${PANEL}.querySelector('button'); const r = b.getBoundingClientRect(); const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return b.contains(hit); })()`);
    ok("S2 a preview never blocks the panel's CTA (pointer-transparent)", ctaHit);
    await p.click(row2.cx, row2.cy);
    await sleep(500);
    const clicked = await p.eval(`({ state: ${tabState}, panel: ${PANEL}.dataset.brand })`);
    ok("S2 click commits the selection", clicked.state[1].selected && clicked.panel === "the-nang", clicked);
    await p.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 5, y: 5 });
    await sleep(300);
    await p.shot(`${SHOTS}/${view.name}-s2-nang-selected.png`);

    // Keyboard: arrows move focus and preview; Escape closes the preview; Enter commits.
    await p.eval(`${TABS}.find((t) => t.getAttribute('aria-selected') === 'true').focus()`);
    await p.key("ArrowDown", { code: "ArrowDown", vk: 40 });
    await sleep(300);
    const kb1 = await p.eval(`({ focused: document.activeElement.dataset.brand, state: ${tabState} })`);
    await p.key("Escape");
    await sleep(200);
    const kb2 = await p.eval(tabState);
    await p.key("Enter");
    await sleep(400);
    const kb3 = await p.eval(`({ state: ${tabState}, panel: ${PANEL}.dataset.brand })`);
    ok("S2 keyboard: arrow previews, Escape closes, Enter commits", kb1.focused === "pepper-house" && kb1.state[2].preview && !kb1.state[2].selected && !kb2[2].preview && kb3.panel === "pepper-house", { kb1, kb2, kb3 });
  } else {
    // Touch: a tap selects directly.
    await press(p, view, `${TABS}[2]`);
    const tapped = await p.eval(`({ state: ${tabState}, panel: ${PANEL}.dataset.brand })`);
    ok("S2 tap selects directly", tapped.state[2].selected && tapped.panel === "pepper-house", tapped);
    await bring(p, `document.getElementById('thuong-hieu')`, "start");
    await sleep(400);
    await p.shot(`${SHOTS}/${view.name}-s2-pepper-selected.png`);
  }
  await bring(p, PANEL, "start");
  await p.shot(`${SHOTS}/${view.name}-s2-panel.png`);

  // CTA → the collection, filtered to that brand, scrolled into view under the header.
  await press(p, view, `${PANEL}.querySelector('button')`);
  await sleep(1200);
  const explored = await p.eval(`({ url: location.search, top: Math.round(document.getElementById('kham-pha').getBoundingClientRect().top), header: Math.round(document.querySelector('header').getBoundingClientRect().bottom), cards: document.querySelectorAll('#kham-pha ul > li').length, pressed: [...document.querySelectorAll('#kham-pha [aria-pressed=true]')].map((b) => b.textContent) })`);
  ok("S2 About CTA filters the collection to the brand and scrolls to it", explored.url.includes("brand=pepper-house") && explored.cards === 1 && explored.top >= explored.header - 2 && explored.top < 260, explored);
  await p.shot(`${SHOTS}/${view.name}-s2-collection-filtered.png`);

  // Collection filters are covered in depth by refine.mjs; reset here before following a card.
  await p.eval(`document.querySelector('#kham-pha-result')?.parentElement?.querySelector('button')?.click()`);
  await sleep(300);
  ok("S2 all six back", (await p.eval(`document.querySelectorAll('#kham-pha ul > li').length`)) === 6);
  await press(p, view, `[...document.querySelectorAll('#kham-pha a')].find((a) => a.textContent.startsWith('Bare Chic'))`);
  await sleep(2500);
  const nav = await p.eval(`({ url: location.pathname + location.search, bars: document.querySelectorAll('header form[role=search], header [data-booking-slot]').length, h1: document.querySelector('h1')?.textContent })`);
  ok("S2 a card opens its property page in the same tab", nav.url === "/dev/stays/bare-chic?view=demo" && nav.h1 === "Bare Chic", nav);
  await p.goto(`${BASE}/dev/demo`, { settle: 2000 });

  // "Xem tất cả 6 nơi lưu trú"
  await press(p, view, `document.querySelector('#thuong-hieu a[href="#kham-pha"]')`);
  await sleep(1200);
  ok("S2 'Xem tất cả' reaches the collection", (await p.eval(`Math.round(document.getElementById('kham-pha').getBoundingClientRect().top)`)) < 260);

  // ── Stage 3 ──
  await bring(p, `document.getElementById('hop-tac')`, "start");
  await sleep(400);
  await p.shot(`${SHOTS}/${view.name}-s3-services.png`);
  const services0 = await p.eval(`({ cards: [...document.querySelectorAll('#hop-tac button[aria-expanded]')].map((b) => ({ text: b.innerText.split('\\n')[1], expanded: b.getAttribute('aria-expanded') })), regions: document.querySelectorAll('#hop-tac [role=region]').length })`);
  ok("S3 three cards visible, one detail region, first open", services0.cards.length === 3 && services0.regions === 1 && services0.cards[0].expanded === "true", services0);
  await press(p, view, `document.querySelectorAll('#hop-tac button[aria-expanded]')[2]`);
  const third = await p.eval(`(() => { const cards = [...document.querySelectorAll('#hop-tac button[aria-expanded]')]; const region = document.querySelector('#hop-tac [role=region]'); const rr = region.getBoundingClientRect(); const c3 = cards[2].getBoundingClientRect(); return { expanded: cards.map((c) => c.getAttribute('aria-expanded')), regions: document.querySelectorAll('#hop-tac [role=region]').length, label: region.getAttribute('aria-label'), regionBelowCard3: rr.top >= c3.bottom - 1, gap: Math.round(rr.top - c3.bottom), noFigures: !/\\d+\\s?%|triệu|VNĐ|đồng\\b/.test(region.innerText) }; })()`);
  ok("S3 choosing a card opens only its detail, directly below it", third.expanded.join() === "false,false,true" && third.regions === 1 && third.regionBelowCard3 && third.gap < 40 && third.noFigures, third);
  await p.shot(`${SHOTS}/${view.name}-s3-franchise-open.png`);
  await press(p, view, `document.querySelectorAll('#hop-tac button[aria-expanded]')[2]`);
  ok("S3 choosing the open card again closes it", (await p.eval(`document.querySelectorAll('#hop-tac [role=region]').length`)) === 0);
  await press(p, view, `document.querySelectorAll('#hop-tac button[aria-expanded]')[1]`);
  const scope = await p.eval(`document.querySelector('#hop-tac [role=region]').innerText`);
  ok("S3 'Phát triển dự án' states model consulting only", /Chỉ tư vấn mô hình/.test(scope) && /Không bao gồm thiết kế, thi công/.test(scope));
  await p.shot(`${SHOTS}/${view.name}-s3-consulting-open.png`);
  await press(p, view, `document.querySelector('#hop-tac [role=region] button')`);
  await sleep(1300);
  const contact = await p.eval(`({ checked: document.querySelector('input[name=service]:checked')?.value, focus: document.activeElement?.id, top: Math.round(document.getElementById('lien-he-title').getBoundingClientRect().top), header: Math.round(document.querySelector('header').getBoundingClientRect().bottom) })`);
  ok("S3 CTA → Contact with the service pre-selected, focus on its heading, clear of the header", contact.checked === "tu-van-mo-hinh" && contact.focus === "lien-he-title" && contact.top > contact.header && contact.top < view.h, contact);
  await p.shot(`${SHOTS}/${view.name}-s3-contact.png`);
  const fields = await p.eval(`({ inputs: document.querySelectorAll('#lien-he input:not([type=radio]), #lien-he textarea, #lien-he select').length, mock: document.querySelector('#lien-he form p')?.textContent })`);
  ok("S3 minimal fields (3) and a visible mockup label", fields.inputs === 3 && /mô phỏng/.test(fields.mock), fields);
  await press(p, view, `document.querySelector('#lien-he button[type=submit]')`);
  await sleep(600);
  const submitted = await p.eval(`({ url: location.pathname + location.search, note: document.querySelector('#lien-he [role=status]').textContent, success: /thành công|đã gửi|cảm ơn/i.test(document.getElementById('lien-he').innerText) })`);
  ok("S3 no fake submission: stays, explains, no success state, no request", submitted.url === "/dev/demo" && /Chưa gửi/.test(submitted.note) && !submitted.success && posts.length === 0, { ...submitted, posts });
  await p.shot(`${SHOTS}/${view.name}-s3-contact-attempt.png`);

  // FAQ: one open at a time; keyboard toggles.
  await press(p, view, `document.querySelectorAll('#hoi-dap summary')[1]`);
  const faq = await p.eval(`[...document.querySelectorAll('#hoi-dap details')].map((d) => d.open)`);
  await p.eval(`document.querySelectorAll('#hoi-dap summary')[3].focus()`);
  await p.key("Enter");
  await sleep(300);
  const faqKb = await p.eval(`[...document.querySelectorAll('#hoi-dap details')].map((d) => d.open)`);
  ok("S3 FAQ: one open at a time, keyboard operable", faq.join() === "false,true,false,false,false" && faqKb.join() === "false,false,false,true,false", { faq, faqKb });
  await bring(p, `document.getElementById('hoi-dap')`, "start");
  await p.shot(`${SHOTS}/${view.name}-s3-faq.png`);

  // Footer: every link is a real route on this site; pending items are not links.
  await bring(p, `document.querySelector('footer')`, "end");
  await p.shot(`${SHOTS}/${view.name}-s3-footer.png`);
  const links = await p.eval(`[...new Set([...document.querySelectorAll('footer a')].map((a) => a.getAttribute('href')))]`);
  const statuses = {};
  for (const href of links) {
    if (href.startsWith("#")) {
      statuses[href] = (await p.eval(`!!document.getElementById(${JSON.stringify(href.slice(1))})`)) ? 200 : 404;
      continue;
    }
    const [path, hash] = href.split("#");
    statuses[href] = (await fetch(`${BASE}${path}`)).status;
    if (hash && path === "/dev/demo") statuses[href] = (await p.eval(`!!document.getElementById(${JSON.stringify(hash)})`)) ? statuses[href] : 404;
  }
  const pendingNotLinks = await p.eval(`![...document.querySelectorAll('footer a')].some((a) => /Facebook|Instagram|TikTok|Hotline|Chính sách/.test(a.textContent))`);
  ok("S3 footer: only working routes; contacts, social, policy flagged not linked", Object.values(statuses).every((s) => s === 200) && pendingNotLinks, { statuses });

  // Page health and reduced motion.
  ok("no horizontal overflow (homepage)", !(await p.eval(`document.documentElement.scrollWidth > innerWidth`)));
  await p.media({ "prefers-reduced-motion": "reduce" });
  await p.goto(`${BASE}/dev/demo`, { settle: 1500 });
  await press(p, view, `document.querySelectorAll('#hop-tac button[aria-expanded]')[1]`);
  const anim = await p.eval(`({ detail: getComputedStyle(document.querySelector('#hop-tac [role=region]')).animationName, panel: getComputedStyle(${PANEL}).animationName })`);
  ok("reduced motion: no detail or panel animation", anim.detail === "none" && anim.panel === "none", anim);
  await p.media({});
  await p.close();
  results.views.push(r);
  console.log(view.name, Object.entries(r.checks).filter(([, v]) => !v.pass).map(([k]) => k));
}
results.consoleErrors = errors;
writeFileSync(`${OUT}/stage23-results.json`, JSON.stringify(results, null, 1));
console.log("errors", errors.length);
quit();
