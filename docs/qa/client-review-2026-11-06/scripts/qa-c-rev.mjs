// Phase C revision (owner, 8/11/2026): no Coming Soon line above the filters and no Coming Soon section; the earlier
// filter layout (labelled rows, rounded white tracks) with the new options; "Tất cả" shows only the real stays; one brand
// shows its real stays then its own Coming Soon card, last in the same list, linked only to a confirmed brand website.
// Plus the city rules, stay links, overflow, layout shift, keyboard, reduced motion, console/hydration errors.
// Vietnamese and the English preview (Discovery itself is Vietnamese-only).
// Usage: node docs/qa/client-review-2026-11-06/scripts/qa-c-rev.mjs http://localhost:3401
import { chromium } from "/Users/noe/Documents/GitHub/Cigarettes-After-Sex/node_modules/.pnpm/playwright@1.62.1/node_modules/playwright/index.mjs";
const base = process.argv[2];
const W = [1440, 1024, 768, 430, 390, 375];
const BRANDS = [
  { id: "bare", name: "Bare Boutique Stays", count: 4, cities: ["available", "available"] },
  { id: "pepper-house", name: "Pepper House", count: 1, cities: ["only", "unavailable"] },
  { id: "the-nang", name: "The Nắng Suites", count: 1, cities: ["unavailable", "only"] },
];
const STAYS = ["bare-chic", "bare-hyphen", "bare-da-kao", "bare-han", "pepper-house", "the-nang-suites"];
// The homepage's links (src/app/dev/demo/page.tsx, unchanged): Bare Chic opens its demo view.
const HREF = (id) => (id === "bare-chic" ? "/dev/stays/bare-chic?view=demo" : `/dev/stays/${id}`);
const browser = await chromium.launch();
const results = [];
const ok = (name, cond, info = "") => results.push(`${cond ? "PASS" : "FAIL"} ${name}${info ? " — " + info : ""}`);
const CARDS = '#kham-pha ul[aria-labelledby="kham-pha-title"] > li';

async function open(width, lang, reduced = false) {
  const mobile = width < 1024;
  const ctx = await browser.newContext({ viewport: { width, height: mobile ? 844 : 900 }, isMobile: mobile, hasTouch: mobile, reducedMotion: reduced ? "reduce" : "no-preference" });
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => m.type() === "error" && !m.text().startsWith("Failed to load resource") && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.addInitScript(() => {
    window.__shift = 0;
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) if (!e.hadRecentInput) window.__shift += e.value;
    }).observe({ type: "layout-shift", buffered: true });
  });
  await page.goto(`${base}/dev/demo?intro=0${lang === "en" ? "&lang=en" : ""}`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  return { ctx, page, errors, mobile };
}

const press = (page, mobile, locator, force = false) => (mobile ? locator.tap({ force }) : locator.click({ force }));
const brandChip = (page, text) => page.locator("#kham-pha [data-filter=brand] label").filter({ hasText: new RegExp(`^${text}$`) });
const city = (page, id) => page.locator(`#kham-pha button[data-city="${id}"]`);

const state = (page) =>
  page.evaluate((CARDS) => {
    const k = document.getElementById("kham-pha");
    const items = [...document.querySelectorAll(CARDS)];
    const stays = items.filter((li) => !li.hasAttribute("data-trailing"));
    const hrefOf = (li) => li.querySelector("a[href]:not([tabindex='-1'])")?.getAttribute("href") ?? li.querySelector("a[href]")?.getAttribute("href");
    const teasers = [...k.querySelectorAll("[data-coming-soon]")];
    return {
      count: stays.length,
      hrefs: stays.map(hrefOf),
      teasers: teasers.map((t) => t.dataset.comingSoon),
      teaserLast: teasers.length === 0 || items.at(-1)?.contains(teasers[0]) === true,
      checked: [...k.querySelectorAll("[data-filter=brand] input")].findIndex((i) => i.checked),
      cities: [...k.querySelectorAll("[data-filter=city] button")].map((b) => ({ state: b.dataset.state, pressed: b.getAttribute("aria-pressed") })),
      result: document.getElementById("kham-pha-result").textContent.trim(),
      rowsH: k.querySelector("[class*=filterRows]").getBoundingClientRect().height,
      url: location.search,
    };
  }, CARDS);

// The Coming Soon card on screen: content, link, size against a real stay card, text inside, no overlaps.
const teaserCheck = (page) =>
  page.evaluate(() => {
    const card = document.querySelector("#kham-pha [data-coming-soon]");
    if (!card) return null;
    const r = (el) => el.getBoundingClientRect();
    const real = document.querySelector('#kham-pha ul[aria-labelledby="kham-pha-title"] > li:not([data-trailing])');
    const realBox = real.querySelector("img") && real.querySelector("[class*=mobilePropertyLink]") ? real.querySelector("[class*=mobilePropertyLink]") : real.querySelector("img");
    const blocks = [...card.children].filter((el) => !el.matches("svg, [aria-hidden=true]") && r(el).width > 0);
    return {
      brand: card.dataset.comingSoon,
      tag: card.tagName,
      href: card.getAttribute("href"),
      website: card.dataset.website,
      controls: card.querySelectorAll("a, button, input, select, [role=button]").length,
      text: card.textContent.replace(/\s+/g, " ").trim(),
      visibleText: [...card.querySelectorAll("p, h3")].map((el) => el.textContent.replace(/\s+/g, " ").trim()),
      logo: card.querySelector("img")?.getAttribute("src") ?? "",
      parts: [card.querySelector("svg") ? "route" : "", card.querySelector("[class*=frame]") ? "frame" : "", card.querySelector("[class*=sun]") ? "sun" : ""].join(""),
      size: { w: r(card).width, h: r(card).height, rw: r(realBox).width, rh: r(realBox).height, top: r(card).top, rtop: r(realBox).top },
      inside: [...card.querySelectorAll("p, h3, img")].every((el) => r(el).left >= r(card).left - 1 && r(el).right <= r(card).right + 1 && r(el).top >= r(card).top - 1 && r(el).bottom <= r(card).bottom + 1),
      overlap: blocks.some((a, i) => blocks.slice(i + 1).some((b) => !(r(a).right <= r(b).left || r(a).left >= r(b).right || r(a).bottom <= r(b).top || r(a).top >= r(b).bottom))),
    };
  });

const LOGO = { bare: "bare", "pepper-house": "pepper", "the-nang": "nang" };
const PART = { bare: "route", "pepper-house": "frame", "the-nang": "sun" };

for (const width of W) {
  for (const lang of ["vi", "en"]) {
    const tag = `@${width} ${lang}`;
    const { ctx, page, errors, mobile } = await open(width, lang);

    // ── 1. No Coming Soon line above the filters; no Coming Soon section anywhere.
    const intro = await page.evaluate(() => {
      const sec = document.getElementById("kham-pha");
      const header = sec.querySelector("header");
      return {
        order: [...header.children].map((el) => el.tagName).join(),
        h2: header.querySelector("h2").textContent.trim(),
        links: header.querySelectorAll("a").length,
        teaserLine: /Sắp ra mắt|Ý tưởng nơi ở mới/i.test(header.textContent),
        section: !!document.getElementById("sap-ra-mat"),
        stale: /Những nơi ở tiếp theo|Thông tin sẽ được công bố sau|Ý tưởng thương hiệu|Ý tưởng nơi ở mới/.test(document.body.textContent),
        mọi: /Mọi thương hiệu|Mọi thành phố|Đang hiển thị tất cả/.test(sec.innerText),
        lang: sec.getAttribute("lang"),
      };
    });
    ok(`${tag} Discovery intro: heading and description only (no "Sắp ra mắt …" line)`, intro.order === "H2,P" && intro.h2 === "Khám phá nơi ở" && intro.links === 0 && !intro.teaserLine, intro.order);
    ok(`${tag} no Coming Soon section, heading, lead or "Thông tin sẽ được công bố sau" anywhere`, !intro.section && !intro.stale);
    ok(`${tag} no "Mọi thương hiệu" / "Mọi thành phố" / status text`, !intro.mọi);
    ok(`${tag} Discovery marked as Vietnamese`, intro.lang === "vi");

    // ── 2. The earlier filter layout: a toolbar between two hairlines, a labelled row per filter, options on one rounded
    //       white track (filled Dark Olive when chosen). Phones: label above, brands 2 × 2. Tablet: label above, one row.
    //       Desktop: labels in one column, tracks in another, the result to the right.
    const layout = await page.evaluate(() => {
      const k = document.getElementById("kham-pha");
      const bar = k.querySelector("[role=group][aria-label='Lọc nơi ở']");
      const cs = getComputedStyle(bar);
      const rows = [...k.querySelectorAll("[class*=filterRow]:not([class*=filterRows])")];
      const r = (el) => el.getBoundingClientRect();
      return {
        hairlines: cs.borderTopStyle === "solid" && cs.borderBottomStyle === "solid",
        labels: rows.map((row) => row.querySelector("[class*=filterLabel]").textContent.trim()),
        tracks: rows.map((row) => {
          const track = row.querySelector("[data-filter]");
          const t = getComputedStyle(track);
          const label = r(row.querySelector("[class*=filterLabel]"));
          const opts = [...track.querySelectorAll("label > span, button")];
          return {
            white: t.backgroundColor === "rgb(255, 255, 255)",
            rounded: parseFloat(t.borderTopLeftRadius) >= 20,
            beside: label.right <= r(track).left && Math.abs(label.top + label.height / 2 - (r(track).top + r(track).height / 2)) < 12,
            above: label.bottom <= r(track).top,
            lines: new Set(opts.map((o) => Math.round(r(o).top))).size,
            left: Math.round(r(track).left),
            labelLeft: Math.round(label.left),
            pill: opts.every((o) => parseFloat(getComputedStyle(o).borderTopLeftRadius) >= 20),
            fullWidth: Math.abs(r(track).width - r(row).width) < 2,
          };
        }),
        activeBg: getComputedStyle(k.querySelector("[data-filter=brand] input:checked + span")).backgroundColor,
      };
    });
    ok(`${tag} filters: toolbar between two hairlines, rows labelled "Thương hiệu" and "Thành phố"`, layout.hairlines && layout.labels.join("|") === "Thương hiệu|Thành phố", layout.labels.join("|"));
    ok(`${tag} filters: options on rounded white tracks, pill options, chosen one filled Dark Olive`, layout.tracks.every((t) => t.white && t.rounded && t.pill) && layout.activeBg === "rgb(55, 65, 47)");
    if (width >= 1024) ok(`${tag} filters (desktop): labels in one column beside the tracks, tracks aligned, one line each`, layout.tracks.every((t) => t.beside && t.lines === 1) && layout.tracks[0].left === layout.tracks[1].left && layout.tracks[0].labelLeft === layout.tracks[1].labelLeft);
    else if (width >= 768) ok(`${tag} filters (tablet): label above each full-width track, one line each`, layout.tracks.every((t) => t.above && t.lines === 1 && t.fullWidth));
    else ok(`${tag} filters (phones): label above each full-width track; brands 2 × 2, cities one line`, layout.tracks.every((t) => t.above && t.fullWidth) && layout.tracks[0].lines === 2 && layout.tracks[1].lines === 1, layout.tracks.map((t) => t.lines).join("/"));

    // ── 3. Filters at first: "Tất cả" + brands in order; two cities, none selected; six real stays, no Coming Soon.
    const chips = await page.locator("#kham-pha [data-filter=brand] label").allInnerTexts();
    ok(`${tag} brand filters: Tất cả, Bare, Pepper House, The Nắng`, chips.join("|") === "Tất cả|Bare Boutique Stays|Pepper House|The Nắng Suites", chips.join("|"));
    const cityNames = await page.locator("#kham-pha [data-filter=city] button").allInnerTexts();
    ok(`${tag} city filters: TP. Hồ Chí Minh and Đà Nẵng only`, cityNames.join("|") === "TP. Hồ Chí Minh|Đà Nẵng", cityNames.join("|"));
    let s = await state(page);
    ok(`${tag} "Tất cả": the six real stays only, no Coming Soon card`, s.count === 6 && s.teasers.length === 0 && s.checked === 0);
    ok(`${tag} "Tất cả": no city selected`, s.cities.length === 2 && s.cities.every((c) => c.state === "available" && c.pressed === "false"));
    ok(`${tag} stays in brand order with their original URLs`, JSON.stringify(s.hrefs) === JSON.stringify(STAYS.map(HREF)), s.hrefs.join(","));
    const rows0 = s.rowsH;

    // ── 4. Each brand: its real stays, then its own Coming Soon card last in the same list.
    for (const b of BRANDS) {
      await press(page, mobile, brandChip(page, b.name));
      await page.waitForTimeout(350);
      s = await state(page);
      ok(`${tag} ${b.id}: ${b.count} real stay(s), then its own Coming Soon card, last`, s.count === b.count && s.teasers.join() === b.id && s.teaserLast && s.hrefs.every((h) => h.startsWith("/dev/stays/")));
      ok(`${tag} ${b.id}: city availability ${b.cities.join("/")}, nothing selected`, JSON.stringify(s.cities.map((c) => c.state)) === JSON.stringify(b.cities) && s.cities.every((c) => c.pressed === "false"));
      ok(`${tag} ${b.id}: the filter rows keep their size`, Math.abs(s.rowsH - rows0) < 1, `${rows0}→${s.rowsH}`);
      await page.locator("#kham-pha [data-coming-soon]").scrollIntoViewIfNeeded();
      await page.waitForTimeout(150);
      const t = await teaserCheck(page);
      ok(`${tag} ${b.id} card: only "Sắp ra mắt" and the brand name, no body text`, t.visibleText.join("|") === `Sắp ra mắt|${b.name}`, t.visibleText.join("|"));
      ok(`${tag} ${b.id} card: never bookable (no controls, prices, numbers or booking words)`, t.controls === 0 && !/Chọn phòng|Xem giá|Đặt phòng|BOOK|còn phòng|giá|\d/i.test(t.text), t.text);
      ok(`${tag} ${b.id} card: its own composition and official logo`, t.parts === PART[b.id] && t.logo.includes(LOGO[b.id]), t.parts);
      ok(
        `${tag} ${b.id} card: links to the confirmed brand website, or is not a link while none is confirmed`,
        t.tag === "A" ? /^https:\/\//.test(t.href) && !/facebook\.com|vnest/i.test(t.href) && t.website === "confirmed" : t.href === null && t.website === "pending",
        `${t.tag} ${t.website}`,
      );
      ok(`${tag} ${b.id} card: same size as a real stay card`, Math.abs(t.size.w - t.size.rw) < 1.5 && Math.abs(t.size.h - t.size.rh) < 1.5, `${t.size.w.toFixed(0)}×${t.size.h.toFixed(0)} vs ${t.size.rw.toFixed(0)}×${t.size.rh.toFixed(0)}`);
      ok(`${tag} ${b.id} card: text and logo inside, no overlaps`, t.inside && !t.overlap);
    }

    // Pepper House: the marked city is a hint, not a filter; tapping it filters, tapping again clears; Đà Nẵng explains.
    await page.locator("#kham-pha").evaluate((el) => el.scrollIntoView({ block: "start" }));
    await press(page, mobile, brandChip(page, "Pepper House"));
    await press(page, mobile, city(page, "da-nang"), true);
    await page.waitForTimeout(250);
    s = await state(page);
    ok(`${tag} Pepper House + Đà Nẵng tap: explained, list unchanged`, s.count === 1 && /Pepper House chưa có nơi ở tại Đà Nẵng/.test(s.result) && s.cities[1].pressed === "false", s.result);
    await press(page, mobile, city(page, "ho-chi-minh"));
    await page.waitForTimeout(250);
    s = await state(page);
    ok(`${tag} Pepper House + TP. Hồ Chí Minh: active (filled), in the address, its card still last`, s.cities[0].state === "active" && s.cities[0].pressed === "true" && s.count === 1 && /city=ho-chi-minh/.test(s.url) && s.teasers.join() === "pepper-house" && s.teaserLast);
    const look = await city(page, "ho-chi-minh").evaluate((b) => getComputedStyle(b).backgroundColor);
    await press(page, mobile, city(page, "ho-chi-minh"));
    await page.waitForTimeout(250);
    s = await state(page);
    const hint = await city(page, "ho-chi-minh").evaluate((b) => ({ bg: getComputedStyle(b).backgroundColor, ring: getComputedStyle(b).boxShadow }));
    ok(`${tag} tapping the active city clears it`, s.cities[0].pressed === "false" && s.cities[0].state === "only" && !/city=/.test(s.url));
    ok(`${tag} active filter (filled olive) looks different from the availability hint (olive ring)`, look === "rgb(55, 65, 47)" && hint.bg !== look && hint.ring.includes("rgb(55, 65, 47)"), `${look} vs ${hint.bg}/${hint.ring}`);
    // A stale city never empties the list: Tất cả + Đà Nẵng, then Pepper House.
    await press(page, mobile, brandChip(page, "Tất cả"));
    await press(page, mobile, city(page, "da-nang"));
    await page.waitForTimeout(250);
    s = await state(page);
    ok(`${tag} Tất cả + Đà Nẵng: Bare Hàn and The Nắng Suites, no Coming Soon`, s.count === 2 && s.checked === 0 && s.cities[1].pressed === "true" && s.teasers.length === 0);
    await press(page, mobile, brandChip(page, "Pepper House"));
    await page.waitForTimeout(300);
    s = await state(page);
    ok(`${tag} then Pepper House: city dropped and explained, never empty`, s.count === 1 && s.cities.every((c) => c.pressed === "false") && /bộ lọc địa điểm đã được bỏ/.test(s.result), s.result);
    await press(page, mobile, brandChip(page, "Bare Boutique Stays"));
    await press(page, mobile, city(page, "da-nang"));
    await page.waitForTimeout(250);
    s = await state(page);
    ok(`${tag} Bare + Đà Nẵng: Bare Hàn, then the Bare card`, s.count === 1 && s.hrefs[0] === HREF("bare-han") && s.teasers.join() === "bare");
    await press(page, mobile, page.locator("#kham-pha [class*=result] button"));
    await page.waitForTimeout(300);
    s = await state(page);
    ok(`${tag} "Bỏ lọc": all six again, nothing selected, no Coming Soon`, s.count === 6 && s.checked === 0 && s.cities.every((c) => c.pressed === "false") && s.teasers.length === 0);

    // ── Links: every stay link answers 200.
    if (width === 1440 && lang === "vi") {
      for (const href of STAYS.map(HREF)) {
        const res = await page.request.get(`${base}${href}`);
        ok(`stay link ${href} → ${res.status()}`, res.status() === 200);
      }
    }

    // ── Page health (with a brand chosen, so the Coming Soon card is on the page).
    await press(page, mobile, brandChip(page, "Bare Boutique Stays"));
    await page.waitForTimeout(300);
    const health = await page.evaluate(() => {
      const clipped = [...document.querySelectorAll("#kham-pha p, #kham-pha h2, #kham-pha h3, #kham-pha label, #kham-pha button, #kham-pha label span")].filter((el) => el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflowX !== "visible" && !el.classList.contains("sr-only")).map((el) => el.textContent.slice(0, 30));
      const k = document.getElementById("kham-pha");
      const spill = [...k.querySelectorAll("[data-filter] label > span, [data-filter] button")].filter((el) => el.scrollWidth > el.clientWidth + 1).map((el) => el.textContent.slice(0, 30));
      return { overflow: document.documentElement.scrollWidth - innerWidth, clipped, spill, shift: window.__shift };
    });
    ok(`${tag} no horizontal overflow, no clipped or spilling text`, health.overflow <= 0 && health.clipped.length === 0 && health.spill.length === 0, `${health.overflow} ${health.clipped.join("|")} ${health.spill.join("|")}`);
    ok(`${tag} no unexpected layout shift (CLS without input)`, health.shift < 0.02, health.shift.toFixed(4));
    ok(`${tag} no console/hydration errors`, errors.length === 0, errors.join(" | ").slice(0, 300));
    await ctx.close();
  }
}

// Keyboard (desktop): arrows move between brands (radio), Space toggles a city, focus is visible.
{
  const { ctx, page } = await open(1440, "vi");
  await page.locator("#kham-pha [data-filter=brand] input").first().focus();
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(300);
  let s = await state(page);
  ok("@1440 keyboard: ArrowRight from Tất cả chooses Bare Boutique Stays (and its card follows)", s.checked === 1 && s.count === 4 && s.teasers.join() === "bare");
  const ring = await page.evaluate(() => getComputedStyle(document.activeElement.nextElementSibling).outlineStyle);
  ok("@1440 keyboard: the focused brand shows an outline", ring === "solid");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Space");
  await page.waitForTimeout(300);
  s = await state(page);
  const cityRing = await page.evaluate(() => ({ id: document.activeElement?.dataset.city, outline: getComputedStyle(document.activeElement).outlineStyle }));
  ok("@1440 keyboard: Tab reaches TP. Hồ Chí Minh, Space toggles it, outline visible", cityRing.id === "ho-chi-minh" && s.cities[0].pressed === "true" && s.count === 3 && cityRing.outline === "solid");
  await page.keyboard.press("Space");
  await page.waitForTimeout(300);
  s = await state(page);
  ok("@1440 keyboard: Space again clears the city", s.cities[0].pressed === "false" && s.count === 4);
  await ctx.close();
}

// Reduced motion: no transitions on the filters.
{
  const { ctx, page } = await open(390, "vi", true);
  const t = await page.evaluate(() => [document.querySelector("#kham-pha [data-filter=brand] span"), document.querySelector("#kham-pha [data-filter=city] button")].map((el) => getComputedStyle(el).transitionDuration));
  ok("@390 reduced motion: filters without transitions", t.every((d) => d.split(",").every((x) => x.trim() === "0s")), t.join(" / "));
  await ctx.close();
}

// A shared address with a filter opens filtered, with the brand's card.
{
  const { ctx, page } = await open(1440, "vi");
  await page.goto(`${base}/dev/demo?intro=0&brand=the-nang`, { waitUntil: "networkidle" });
  await page.waitForTimeout(300);
  const s = await state(page);
  ok("@1440 ?brand=the-nang opens with The Nắng Suites, Đà Nẵng marked, then its card", s.count === 1 && s.checked === 3 && s.cities[1].state === "only" && s.teasers.join() === "the-nang" && s.teaserLast);
  await ctx.close();
}

await browser.close();
console.log(results.join("\n"));
console.log(`\n${results.filter((r) => r.startsWith("PASS")).length}/${results.length} passed`);
