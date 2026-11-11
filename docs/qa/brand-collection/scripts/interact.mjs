// Real keyboard and pointer input against both concepts: focus order, selection, combined
// filters, conflict handling, the address, sample areas, reduced motion. Writes interactions.json
// and a few state screenshots. Usage: node docs/qa/brand-collection/scripts/interact.mjs
import { writeFileSync } from "node:fs";
import { BASE, HIDE_DEV, launch, OUT, Page, quit, ROUTES, sleep } from "./lib.mjs";

const PHONE = { w: 390, h: 844, dpr: 2, mobile: true };
const DESK = { w: 1440, h: 900, dpr: 1, mobile: false };

const STATE = `(() => ({
  cards: [...document.querySelectorAll("ul[aria-labelledby] h3")].map((h) => h.textContent),
  summary: document.querySelector("[aria-live]").textContent,
  chosen: [...document.querySelectorAll("section [aria-pressed=true], section [aria-checked=true]")].map((e) => e.getAttribute("aria-label")),
  address: location.search,
}))()`;
const FOCUS = `(() => { const e = document.activeElement; const cs = getComputedStyle(e); return { label: e.getAttribute("aria-label") || e.textContent.trim().slice(0, 40), role: e.getAttribute("role") || e.tagName.toLowerCase(), outline: cs.outlineStyle + " " + cs.outlineWidth + " " + cs.outlineColor }; })()`;
const center = (sel) => `(() => { const e = ${sel}; if (!e) throw new Error("missing: " + ${JSON.stringify(sel)}); e.scrollIntoView({ block: "center" }); const b = e.getBoundingClientRect(); return { x: Math.round(b.left + b.width / 2), y: Math.round(b.top + b.height / 2) }; })()`;
const byLabel = (prefix) => `document.querySelector('section [aria-label^="${prefix}"]')`;

async function open(route, view, search = "", media) {
  const p = await Page.open();
  p.errors = [];
  p.on("Runtime.exceptionThrown", (e) => p.errors.push(e.exceptionDetails.exception?.description?.slice(0, 160) ?? e.exceptionDetails.text));
  await p.viewport(view.w, view.h, view.dpr, view.mobile);
  if (media) await p.media(media);
  await p.goto(BASE + ROUTES[route] + search, { settle: 1200 });
  await p.eval(HIDE_DEV);
  return p;
}
const press = async (p, sel, view) => {
  const c = await p.eval(center(sel));
  if (view.mobile) await p.tap(c.x, c.y);
  else await p.click(c.x, c.y);
  await sleep(350);
};
const KEYS = { ArrowRight: 39, ArrowLeft: 37, ArrowDown: 40, ArrowUp: 38, Home: 36, End: 35 };
const key = (p, k) => p.key(k, { vk: KEYS[k] });

console.log(await launch());
const out = {};

// ---- 1. Keyboard: focus order through the section, and choosing with the keyboard ----
for (const concept of ["a", "b"]) {
  const p = await open(concept, DESK);
  await p.eval(`document.querySelector("section").scrollIntoView(); document.body.focus()`);
  // Start from the last control before the section, so the first Tab lands in it.
  await p.eval(`document.querySelector("[class*=review] a:last-of-type").focus()`);
  const order = [];
  for (let i = 0; i < 12; i++) {
    await p.key("Tab");
    order.push(await p.eval(FOCUS));
  }
  const log = { focusOrder: order };
  if (concept === "a") {
    await p.eval(`${byLabel("Bare Boutique Stays")}.focus()`);
    await p.key("Enter");
    log.enterOnBare = await p.eval(STATE);
    await p.key(" ");
    log.spaceAgainUnchooses = await p.eval(STATE);
  } else {
    await p.eval(`document.querySelector("[role=radio][aria-checked=true]").focus()`);
    await key(p, "ArrowRight");
    log.arrowRight = { ...(await p.eval(STATE)), focus: await p.eval(FOCUS) };
    await key(p, "End");
    log.end = await p.eval(STATE);
    await key(p, "Home");
    log.home = await p.eval(STATE);
    await key(p, "ArrowLeft");
    log.arrowLeftWraps = await p.eval(STATE);
    log.tabStopsInRadiogroup = await p.eval(`[...document.querySelectorAll("[role=radio]")].filter((r) => r.tabIndex === 0).length`);
  }
  await p.eval(`document.querySelector("section").scrollIntoView()`);
  await p.shot(`${OUT}/${concept}-1440-keyboard-focus.png`);
  log.errors = p.errors;
  out[`keyboard-${concept}`] = log;
  await p.close();
}

// ---- 2. Combined filters and conflicts, with real taps on a phone ----
for (const concept of ["a", "b"]) {
  const p = await open(concept, PHONE);
  const brand = (name) => (concept === "a" ? byLabel(name) : `document.querySelector('[role=radio][aria-label^="${name}"]')`);
  const city = (name) => `document.querySelector('[role=group][aria-label="Thành phố"] [aria-label^="${name}"]')`;
  const log = {};
  await press(p, brand("Bare Boutique Stays"), PHONE);
  log.bare = await p.eval(STATE);
  // Concept B on a phone shows City as a native select (the chips are hidden there).
  const compact = await p.eval(`!!document.querySelector("[class*=geoCompact] select") && getComputedStyle(document.querySelector("[class*=geoCompact]")).display !== "none"`);
  if (compact) {
    await p.eval(`(() => { const s = document.querySelector("[class*=geoCompact] select"); s.value = "da-nang"; s.dispatchEvent(new Event("change", { bubbles: true })); })()`);
    await sleep(350);
  } else await press(p, city("Đà Nẵng"), PHONE);
  log.cityControl = compact ? "select" : "chips";
  log.bareInDaNang = await p.eval(STATE);
  await p.eval(`document.querySelector("section").scrollIntoView()`);
  await sleep(300);
  await p.shot(`${OUT}/${concept}-390-bare-da-nang.png`);
  await press(p, brand("Pepper House"), PHONE);
  log.pepperHouseAfterDaNang = { ...(await p.eval(STATE)), note: await p.eval(`document.querySelector("[aria-live] span + span")?.textContent ?? null`) };
  await p.eval(`document.querySelector("[aria-live]").scrollIntoView({ block: "center" })`);
  await sleep(300);
  await p.shot(`${OUT}/${concept}-390-conflict-note.png`);
  await press(p, `[...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "Bỏ lọc")`, PHONE);
  log.reset = await p.eval(STATE);
  log.errors = p.errors;
  out[`combined-${concept}`] = log;
  await p.close();
}

// ---- 3. The address: a shared link, a reload, and a contradictory link ----
for (const concept of ["a", "b"]) {
  const log = {};
  let p = await open(concept, PHONE, "?brand=bare&city=da-nang");
  log.sharedLink = await p.eval(STATE);
  await p.close();
  p = await open(concept, PHONE, "?brand=pepper-house&city=da-nang&area=nowhere");
  log.contradictoryLink = await p.eval(STATE);
  await p.close();
  out[`address-${concept}`] = log;
}

// ---- 4. Area: unverified by default; sample areas only on request ----
for (const concept of ["a", "b"]) {
  const log = {};
  let p = await open(concept, PHONE);
  log.verified = await p.eval(`(() => { const s = [...document.querySelectorAll("section select")].filter((e) => e.offsetParent).at(-1); return { disabled: s.disabled, options: [...s.options].map((o) => o.textContent), describedBy: document.getElementById(s.getAttribute("aria-describedby"))?.textContent }; })()`);
  await p.close();
  p = await open(concept, PHONE, "?areas=sample");
  await p.eval(`(() => { const s = [...document.querySelectorAll("section select")].filter((e) => e.offsetParent).at(-1); s.value = "mau-2"; s.dispatchEvent(new Event("change", { bubbles: true })); })()`);
  await sleep(400);
  log.sampleArea2 = await p.eval(STATE);
  await p.eval(`document.querySelector("section").scrollIntoView()`);
  await sleep(300);
  await p.shot(`${OUT}/${concept}-390-sample-area.png`);
  out[`area-${concept}`] = log;
  await p.close();
}

// ---- 5. Reduced motion: nothing animates ----
for (const concept of ["a", "b"]) {
  const p = await open(concept, PHONE, "", { "prefers-reduced-motion": "reduce" });
  await p.eval(concept === "a" ? `${byLabel("Bare Boutique Stays")}.click()` : `document.querySelectorAll("[role=radio]")[1].click()`);
  await sleep(50);
  out[`reducedMotion-${concept}`] = await p.eval(`(() => {
    const names = (sel) => [...document.querySelectorAll(sel)].map((e) => { const s = getComputedStyle(e); return s.animationName + " " + s.animationDuration + " / " + s.transitionDuration; });
    return { cards: names("ul[aria-labelledby] li").slice(0, 2), selected: names("section [aria-pressed=true], section [aria-checked=true]").slice(0, 1), stage: names("section [class*=stage]") };
  })()`);
  await p.close();
}

writeFileSync(`${OUT}/interactions.json`, JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 1).slice(0, 6000));
quit();
