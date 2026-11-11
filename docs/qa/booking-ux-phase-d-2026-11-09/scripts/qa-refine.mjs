// Phase D final refinement QA (owner brief 10/11/2026): the homepage keeps a submitted search on Back and refresh, the
// compact bars' guest reading is never cut, and the children stepper's bound reads as the form's, not a rule.
// 1 Home → Results → Back · 2 Home → Results → Property → Back → Back · 3 refresh after submitting · 4 adults/children ·
// 5 dates · 6 explicit rooms kept · 7 compact header readable · 8 phone sheet restores · 9 GoHost / ezCloud unchanged.
// Usage: node docs/qa/booking-ux-phase-d-2026-11-09/scripts/qa-refine.mjs http://localhost:3401 [shots-dir]
import { chromium } from "/Users/noe/Documents/GitHub/Cigarettes-After-Sex/node_modules/.pnpm/playwright@1.62.1/node_modules/playwright/index.mjs";
const [base, shots] = process.argv.slice(2);
const browser = await chromium.launch();
const results = [];
const ok = (name, cond, info = "") => results.push(`${cond ? "PASS" : "FAIL"} ${name}${info ? " — " + info : ""}`);
const note = (name, info) => results.push(`INFO ${name} — ${info}`);
const VIEWPORTS = [
  { name: "1440", width: 1440, height: 900, mobile: false },
  { name: "1024", width: 1024, height: 768, mobile: false },
  { name: "768", width: 768, height: 1024, mobile: false },
  { name: "390", width: 390, height: 844, mobile: true },
];
const IN = "2026-11-28";
const OUT = "2026-12-02";
const CHECK_IN = /, 28 tháng 11, 2026/;
const CHECK_OUT = /, 2 tháng 12, 2026/;

async function open(vp, url) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: vp.mobile, hasTouch: vp.mobile });
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => {
    const t = m.text();
    if ((m.type() === "error" || /hydrat/i.test(t)) && !t.startsWith("Failed to load resource") && !t.includes("maps.googleapis")) errors.push(t);
  });
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(url, { waitUntil: "networkidle" });
  return { ctx, page, errors };
}
const press = (vp, loc) => (vp.mobile ? loc.tap() : loc.dispatchEvent("click"));
const q = (page) => new URL(page.url()).searchParams;
const shot = async (page, name) => {
  if (shots) await page.screenshot({ path: `${shots}/${name}.png` });
};
const settle = (page) => page.waitForLoadState("networkidle").then(() => page.waitForTimeout(400));

/** Opens the homepage guest panel (field on tablet/desktop, sheet section on phones). */
async function openGuests(page, vp) {
  if (vp.mobile) {
    await page.locator('#dat-phong button[aria-haspopup="dialog"]:visible').first().tap();
    await page.locator('dialog[open] [data-section="guests"]').tap();
  } else {
    await page.locator("#dat-phong").evaluate((el) => el.scrollIntoView({ block: "center" }));
    await page.locator('#dat-phong button[data-field="guests"]:visible').first().click();
  }
  const panel = page.locator('[data-testid="occupancy-panel"]:visible');
  await panel.waitFor();
  return panel;
}
async function submitHome(page, vp) {
  if (vp.mobile) await page.locator('dialog[open] footer button[type="submit"]').tap();
  else await page.locator('#dat-phong form[role="search"] button[type="submit"]:visible').first().click();
}
/** What the homepage hero bar shows (desktop fields, or the phone pill). */
async function heroReading(page, vp) {
  if (vp.mobile) return (await page.locator('#dat-phong button[aria-haspopup="dialog"]:visible').first().innerText()).replace(/\s+/g, " ");
  return (await page.locator("#dat-phong [data-field]:visible").allInnerTexts()).join(" | ").replace(/\s+/g, " ");
}
const restoredReading = (text, children) =>
  /28 thg 11/.test(text) && /2 thg 12/.test(text) && new RegExp(`3 người lớn · ${children} trẻ em`).test(text);

/** The compact (header) guest reading: shown text, whether it is cut, and its accessible reading. */
async function compactGuest(page, vp) {
  return page.evaluate((mobile) => {
    const header = document.querySelector("header#top");
    const button = mobile
      ? [...header.querySelectorAll('button[aria-haspopup="dialog"]')].find((b) => b.getClientRects().length && !b.hasAttribute("data-field"))
      : [...header.querySelectorAll('button[data-field="guests"]')].find((b) => b.getClientRects().length);
    if (!button) return null;
    const lines = [...button.querySelectorAll("span.truncate")].filter((s) => s.getClientRects().length);
    const line = lines[lines.length - 1];
    const shown = line.querySelector(":scope > span:not(.sr-only):not(.invisible)")?.textContent ?? line.textContent;
    const full = line.querySelector(":scope > .sr-only")?.textContent ?? shown;
    return { shown, full, cut: line.scrollWidth > line.clientWidth + 1, title: line.getAttribute("title"), width: line.clientWidth };
  }, vp.mobile);
}
async function scrollToCompact(page) {
  await page.mouse.wheel(0, 1800);
  await page.waitForTimeout(900);
}

for (const vp of VIEWPORTS) {
  const tag = `@${vp.name}`;
  const { ctx, page, errors } = await open(vp, `${base}/dev/demo?intro=0`);

  // ── Build a search: 3 adults, 1 child, a cross-month stay ──
  // (a new browser tab starts on about:blank, so the first page is already history entry 2)
  const historyAtLoad = await page.evaluate(() => history.length);
  let panel = await openGuests(page, vp);
  await press(vp, panel.getByRole("button", { name: "Thêm một người lớn" }));
  await press(vp, panel.getByRole("button", { name: "Thêm một trẻ em" }));
  if (!vp.mobile) await page.keyboard.press("Escape");
  const historyBefore = await page.evaluate(() => history.length);
  ok(`${tag} stepper changes add no history entry`, historyBefore === historyAtLoad, `${historyAtLoad} → ${historyBefore}`);
  ok(`${tag} stepper changes leave the address alone (only a submitted search is kept)`, !q(page).has("adults") && !q(page).has("children"), page.url());
  await submitHome(page, vp); // no dates: opens the calendar
  await page.waitForTimeout(400);
  await press(vp, page.getByRole("button", { name: CHECK_IN }).locator("visible=true").first());
  await press(vp, page.getByRole("button", { name: "Tháng sau" }).locator("visible=true").first());
  await press(vp, page.getByRole("button", { name: CHECK_OUT }).locator("visible=true").first());
  await page.waitForTimeout(300);
  await submitHome(page, vp);
  await page.waitForURL((u) => u.pathname === "/dev/demo/tim-phong");
  await page.waitForSelector('[data-testid="property-results"]');
  const r = q(page);
  ok(`${tag} results: stay as submitted`, r.get("checkIn") === IN && r.get("checkOut") === OUT && r.get("adults") === "3" && r.get("children") === "1" && r.get("rooms") === "2,1", page.url());
  ok(`${tag} one history entry for the search (homepage replaced in place)`, (await page.evaluate(() => history.length)) === historyAtLoad + 1);

  // ── 1 · Back → homepage keeps dates, adults and children ──
  await page.goBack();
  await page.waitForURL((u) => u.pathname === "/dev/demo");
  await settle(page);
  const h = q(page);
  ok(`${tag} 1 Back: homepage address carries the search`, h.get("checkIn") === IN && h.get("checkOut") === OUT && h.get("adults") === "3" && h.get("children") === "1" && h.get("intro") === "0", page.url());
  ok(`${tag} 1 Back: no rooms invented on the homepage`, !h.has("rooms"));
  const back = await heroReading(page, vp);
  ok(`${tag} 1/4/5 Back: bar shows the dates, 3 adults and 1 child`, restoredReading(back, 1), back);
  await shot(page, `refine-${vp.name}-01-back-restored`);

  // ── 8 · the phone sheet (or the panel) restores its values; edit without starting over ──
  panel = await openGuests(page, vp);
  ok(`${tag} 8 panel restores 3 adults, 1 child`, (await panel.locator("output").allInnerTexts()).join(",") === "3,1");
  if (vp.mobile) {
    const sheet = await page.locator("dialog[open]").innerText();
    ok(`${tag} 8 phone sheet restores the dates`, /28 thg 11/.test(sheet) && /2 thg 12/.test(sheet), sheet.replace(/\s+/g, " ").slice(0, 160));
    await shot(page, `refine-${vp.name}-02-sheet-restored`);
  }
  await press(vp, panel.getByRole("button", { name: "Thêm một trẻ em" }));
  if (!vp.mobile) await page.keyboard.press("Escape");
  await submitHome(page, vp);
  await page.waitForURL((u) => u.pathname === "/dev/demo/tim-phong");
  await page.waitForSelector('[data-testid="property-results"]');
  ok(`${tag} edited search: same dates, 2 children`, q(page).get("checkIn") === IN && q(page).get("children") === "2" && q(page).get("adults") === "3", page.url());

  // ── 9 · GoHost / ezCloud unchanged ──
  for (const id of ["bare-da-kao", "pepper-house"]) {
    const status = await page.locator(`[data-property="${id}"] [data-testid^="availability-"]`).first().getAttribute("data-testid");
    ok(`${tag} 9 GoHost ${id}: not asked with children`, status === "availability-needs-provider-check" && /trẻ em/.test(await page.locator(`[data-property="${id}"]`).innerText()), status);
  }
  for (const id of ["bare-chic", "bare-hyphen", "bare-han", "the-nang-suites"]) {
    ok(`${tag} 9 ezCloud ${id}: hand-off unchanged`, (await page.locator(`[data-property="${id}"] [data-testid="handoff-cta"]`).count()) === 1);
  }
  ok(`${tag} 9 results: no price`, !/₫/.test(await page.locator("main").innerText()));

  // ── 2 · Results → Property → Back → Back ──
  await press(vp, page.locator('[data-property="bare-da-kao"] [data-testid="open-property"]'));
  await page.waitForURL((u) => u.pathname === "/dev/stays/bare-da-kao");
  await settle(page);
  ok(`${tag} 2 property keeps the stay`, q(page).get("children") === "2" && q(page).get("adults") === "3" && q(page).get("checkIn") === IN, page.url());
  await page.goBack();
  await page.waitForURL((u) => u.pathname === "/dev/demo/tim-phong");
  await settle(page);
  ok(`${tag} 2 Back: results keep the stay`, q(page).get("children") === "2" && q(page).get("rooms") === "2,1", page.url());
  await page.goBack();
  await page.waitForURL((u) => u.pathname === "/dev/demo");
  await settle(page);
  const back2 = await heroReading(page, vp);
  ok(`${tag} 2 Back, Back: homepage shows the edited search`, restoredReading(back2, 2) && q(page).get("children") === "2", back2);

  // ── 3 · refresh keeps it ──
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  const refreshed = await heroReading(page, vp);
  ok(`${tag} 3 refresh: same search`, restoredReading(refreshed, 2) && q(page).get("checkOut") === OUT, refreshed);

  // ── 7 · compact header on the homepage ──
  await scrollToCompact(page);
  const home = await compactGuest(page, vp);
  if (home) {
    const okCut = !home.cut || vp.mobile;
    ok(`${tag} 7 homepage compact: "${home.shown}" ${home.cut ? "(cut)" : "whole"}`, okCut && /3 (người lớn|lớn) · 2 trẻ/.test(home.shown) && /3 người lớn · 2 trẻ em/.test(home.full), `full "${home.full}", title ${home.title ?? "—"}, ${home.width}px`);
    await shot(page, `refine-${vp.name}-03-home-compact`);
  } else note(`${tag} 7 homepage compact`, "no compact bar at this width");
  ok(`${tag} no console or hydration errors (homepage)`, errors.length === 0, errors[0]?.slice(0, 200));
  await ctx.close();

  // ── 6 · an explicit room choice in the homepage address is kept through submit and Back ──
  {
    const { ctx: c2, page: p2, errors: e2 } = await open(vp, `${base}/dev/demo?intro=0&checkIn=${IN}&checkOut=${OUT}&adults=4&rooms=2,2`);
    const before = await heroReading(p2, vp);
    ok(`${tag} 6 homepage from an address: dates and 4 adults shown`, /28 thg 11/.test(before) && /4 người lớn/.test(before), before);
    if (vp.mobile) await p2.locator('#dat-phong button[aria-haspopup="dialog"]:visible').first().tap();
    await submitHome(p2, vp);
    await p2.waitForURL((u) => u.pathname === "/dev/demo/tim-phong");
    ok(`${tag} 6 results keep the explicit rooms 2,2`, q(p2).get("rooms") === "2,2" && q(p2).get("adults") === "4", p2.url());
    await p2.goBack();
    await p2.waitForURL((u) => u.pathname === "/dev/demo");
    await settle(p2);
    ok(`${tag} 6 Back: homepage address keeps rooms 2,2`, q(p2).get("rooms") === "2,2" && q(p2).get("adults") === "4" && !q(p2).has("children"), p2.url());
    ok(`${tag} 6 no console errors`, e2.length === 0, e2[0]?.slice(0, 200));
    await c2.close();
  }

  // ── 7 · compact header on a property page (frozen combined field with children) ──
  {
    const { ctx: c3, page: p3, errors: e3 } = await open(vp, `${base}/dev/stays/bare-da-kao?checkIn=${IN}&checkOut=${OUT}&adults=3&children=1&rooms=2,1`);
    await scrollToCompact(p3);
    const prop = await compactGuest(p3, vp);
    if (prop) {
      const fine = !prop.cut || vp.mobile;
      ok(`${tag} 7 property compact: "${prop.shown}" ${prop.cut ? "(cut)" : "whole"}`, fine && /3 (người lớn|lớn) · 1 trẻ/.test(prop.shown) && prop.full.includes("3 người lớn · 1 trẻ em · 2 phòng"), `full "${prop.full}", title ${prop.title ?? "—"}, ${prop.width}px`);
      const button = vp.mobile
        ? p3.locator('header#top button[aria-haspopup="dialog"]:not([data-field]):visible').first()
        : p3.locator('header#top button[data-field="guests"]:visible').first();
      const name = await button.ariaSnapshot();
      ok(`${tag} 7 property compact: screen readers get the full reading, once`, name.split("3 người lớn · 1 trẻ em · 2 phòng").length === 2 && !/lớn · 1 trẻ(?! em)/.test(name), name.replace(/\s+/g, " ").slice(0, 160));
      await shot(p3, `refine-${vp.name}-04-property-compact`);
    } else note(`${tag} 7 property compact`, "no compact bar at this width");
    // Without children the frozen reading is unchanged where it fits.
    await p3.goto(`${base}/dev/stays/bare-da-kao?checkIn=${IN}&checkOut=${OUT}&adults=3&rooms=2,1`, { waitUntil: "networkidle" });
    await scrollToCompact(p3);
    const plain = await compactGuest(p3, vp);
    if (plain) note(`${tag} 7 property compact, no children`, `"${plain.shown}" ${plain.cut ? "(cut)" : "whole"} at ${plain.width}px; full "${plain.full}"`);
    ok(`${tag} 7 property: no console errors`, e3.length === 0, e3[0]?.slice(0, 200));
    await c3.close();
  }
}

// ── Guest limits: the children stepper's bound is the form's (1440) ──
{
  const vp = VIEWPORTS[0];
  const { ctx, page } = await open(vp, `${base}/dev/demo?intro=0`);
  const panel = await openGuests(page, vp);
  for (let i = 0; i < 8; i++) {
    const plus = panel.getByRole("button", { name: "Thêm một trẻ em" });
    if (await plus.isDisabled()) break;
    await plus.dispatchEvent("click");
  }
  const kids = (await panel.locator("output").allInnerTexts())[1];
  const limit = await panel.locator('[data-testid="children-form-limit-note"]').innerText().catch(() => "");
  ok("@1440 children stepper stops at the form's bound with a neutral note", kids === "6" && /liên hệ VNest/.test(limit) && !/tối đa|không được|quy định/i.test(limit), `${kids}: ${limit}`);
  ok("@1440 the adult limit still reads as the provisional request limit", /chọn số phòng/.test(await panel.locator('[data-testid="occupancy-note"]').innerText()));
  await shot(page, "refine-1440-05-children-bound");
  await ctx.close();
}
{
  const vp = VIEWPORTS[0];
  const { ctx, page } = await open(vp, `${base}/dev/stays/bare-da-kao?checkIn=${IN}&checkOut=${OUT}&adults=2&rooms=1&children=8`);
  await page.locator('header button[data-field="guests"]:visible').first().click();
  const panel = page.locator('[data-testid="occupancy-panel"]:visible');
  await panel.waitFor();
  const kids = (await panel.locator("output").allInnerTexts())[1];
  ok("@1440 an address with 8 children keeps 8 (never dropped or cut down)", kids === "8" && q(page).get("children") === "8", kids);
  ok("@1440 above the bound: count down only", (await panel.getByRole("button", { name: "Thêm một trẻ em" }).isDisabled()) && !(await panel.getByRole("button", { name: "Bớt một trẻ em" }).isDisabled()));
  await ctx.close();
}

await browser.close();
console.log(results.join("\n"));
const graded = results.filter((r) => !r.startsWith("INFO"));
console.log(`\n${graded.filter((r) => r.startsWith("PASS")).length}/${graded.length} passed`);
