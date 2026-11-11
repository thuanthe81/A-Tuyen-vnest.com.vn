// Phase C (owner, 7/11/2026): brand heading without its link, Discovery without its eyebrow, brand and city filters,
// Coming Soon (entry + teasers, never bookable), the six real stays and their links, overflow, layout shift, keyboard,
// reduced motion, console/hydration errors. Vietnamese and the English preview (Discovery itself is Vietnamese-only).
// Usage: node docs/qa/client-review-2026-11-06/scripts/qa-c.mjs http://localhost:3401
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
    const cards = [...document.querySelectorAll(CARDS)];
    const shelf = document.getElementById("sap-ra-mat");
    const hrefOf = (li) => li.querySelector("a[href]:not([tabindex='-1'])")?.getAttribute("href") ?? li.querySelector("a[href]")?.getAttribute("href");
    return {
      count: cards.length,
      hrefs: cards.map(hrefOf),
      checked: [...k.querySelectorAll("[data-filter=brand] input")].findIndex((i) => i.checked),
      cities: [...k.querySelectorAll("[data-filter=city] button")].map((b) => ({ state: b.dataset.state, pressed: b.getAttribute("aria-pressed") })),
      result: document.getElementById("kham-pha-result").textContent.trim(),
      shelf: [...shelf.querySelectorAll("article")].map((a) => a.dataset.brand),
      entry: k.querySelector("header a")?.textContent.replace(/\s+/g, " ").trim(),
      toolbarH: k.querySelector("[role=group][aria-label='Lọc nơi ở']").getBoundingClientRect().height,
      url: location.search,
    };
  }, CARDS);

for (const width of W) {
  for (const lang of ["vi", "en"]) {
    const tag = `@${width} ${lang}`;
    const { ctx, page, errors, mobile } = await open(width, lang);

    // ── 1. Brand heading: the "Xem tất cả nơi ở" link is gone; the heading keeps a balanced gap to the brands.
    const head = await page.evaluate(() => {
      const sec = document.getElementById("thuong-hieu");
      const header = sec.querySelector("header");
      const comp = sec.querySelector("[class*=composition]");
      return { links: header.querySelectorAll("a").length, text: /Xem tất cả nơi ở|See all stays/.test(sec.innerText), gap: comp.getBoundingClientRect().top - header.getBoundingClientRect().bottom, h2: header.querySelector("h2").textContent.trim() };
    });
    ok(`${tag} brand heading: no "Xem tất cả nơi ở" link`, head.links === 0 && !head.text);
    ok(`${tag} brand heading: balanced gap to the brands`, head.gap >= 26 && head.gap <= 52, `${head.gap.toFixed(0)}px`);

    // ── 2. Discovery heading: no eyebrow; heading, description, then the Coming Soon entry.
    const intro = await page.evaluate(() => {
      const header = document.querySelector("#kham-pha header");
      const kids = [...header.children];
      const sec = document.getElementById("kham-pha");
      return {
        first: kids[0].tagName,
        h2: kids[0].textContent.trim(),
        order: kids.map((el) => el.tagName),
        eyebrow: [...header.querySelectorAll("p")].some((p) => /^Khám phá nơi ở$/i.test(p.textContent.trim())),
        topGap: kids[0].getBoundingClientRect().top - sec.getBoundingClientRect().top,
        stale: /Mọi thương hiệu|Mọi thành phố|Đang hiển thị tất cả/.test(sec.innerText),
        lang: sec.getAttribute("lang"),
      };
    });
    ok(`${tag} Discovery: no eyebrow, heading first`, intro.first === "H2" && intro.h2 === "Khám phá nơi ở" && !intro.eyebrow && intro.order.join() === "H2,P,A", intro.order.join());
    ok(`${tag} Discovery: no "Mọi thương hiệu", "Mọi thành phố" or status text`, !intro.stale);
    ok(`${tag} Discovery marked as Vietnamese`, intro.lang === "vi");

    // ── 3–4. Filters at first: "Tất cả" + brands in order; two cities, none selected; six stays in brand order.
    const chips = await page.locator("#kham-pha [data-filter=brand] label").allInnerTexts();
    ok(`${tag} brand filters: Tất cả, Bare, Pepper House, The Nắng`, chips.join("|") === "Tất cả|Bare Boutique Stays|Pepper House|The Nắng Suites", chips.join("|"));
    let s = await state(page);
    ok(`${tag} initial: all six stays, "Tất cả" on, no city selected`, s.count === 6 && s.checked === 0 && s.cities.length === 2 && s.cities.every((c) => c.state === "available" && c.pressed === "false"));
    ok(`${tag} initial: stays in brand order with their original URLs`, JSON.stringify(s.hrefs) === JSON.stringify(STAYS.map(HREF)), s.hrefs.join(","));
    ok(`${tag} initial: all three Coming Soon teasers, after the stays`, s.shelf.join() === "bare,pepper-house,the-nang");
    const toolbarH0 = s.toolbarH;

    // ── 5. Each brand: count, city availability (never auto-selected), its own teaser, the entry names it.
    for (const b of BRANDS) {
      await press(page, mobile, brandChip(page, b.name));
      await page.waitForTimeout(350);
      s = await state(page);
      ok(`${tag} ${b.id}: ${b.count} stay(s)`, s.count === b.count && s.hrefs.every((h) => h.startsWith("/dev/stays/")));
      ok(`${tag} ${b.id}: city availability ${b.cities.join("/")}, nothing selected`, JSON.stringify(s.cities.map((c) => c.state)) === JSON.stringify(b.cities) && s.cities.every((c) => c.pressed === "false"));
      ok(`${tag} ${b.id}: only its Coming Soon teaser; entry names the brand`, s.shelf.join() === b.id && s.entry.includes(b.name), s.entry);
      ok(`${tag} ${b.id}: the toolbar keeps its height (no reflow)`, Math.abs(s.toolbarH - toolbarH0) < 1, `${toolbarH0}→${s.toolbarH}`);
    }
    // Pepper House: the marked city is a hint, not a filter; tapping it filters, tapping again clears; Đà Nẵng explains.
    await press(page, mobile, brandChip(page, "Pepper House"));
    await press(page, mobile, city(page, "da-nang"), true);
    await page.waitForTimeout(250);
    s = await state(page);
    ok(`${tag} Pepper House + Đà Nẵng tap: explained, list unchanged`, s.count === 1 && /Pepper House chưa có nơi ở tại Đà Nẵng/.test(s.result) && s.cities[1].pressed === "false", s.result);
    await press(page, mobile, city(page, "ho-chi-minh"));
    await page.waitForTimeout(250);
    s = await state(page);
    ok(`${tag} Pepper House + TP. Hồ Chí Minh: active (filled), in the address`, s.cities[0].state === "active" && s.cities[0].pressed === "true" && s.count === 1 && /city=ho-chi-minh/.test(s.url));
    const look = await city(page, "ho-chi-minh").evaluate((b) => getComputedStyle(b).backgroundColor);
    await press(page, mobile, city(page, "ho-chi-minh"));
    await page.waitForTimeout(250);
    s = await state(page);
    const hint = await city(page, "ho-chi-minh").evaluate((b) => ({ bg: getComputedStyle(b).backgroundColor, border: getComputedStyle(b).borderTopColor }));
    ok(`${tag} tapping the active city clears it`, s.cities[0].pressed === "false" && s.cities[0].state === "only" && !/city=/.test(s.url));
    ok(`${tag} active filter (filled olive) looks different from the availability hint (olive ring)`, look === "rgb(55, 65, 47)" && hint.bg !== look && hint.border === "rgb(55, 65, 47)", `${look} vs ${hint.bg}/${hint.border}`);
    // A stale city never empties the list: Tất cả + Đà Nẵng, then Pepper House.
    await press(page, mobile, brandChip(page, "Tất cả"));
    await press(page, mobile, city(page, "da-nang"));
    await page.waitForTimeout(250);
    s = await state(page);
    ok(`${tag} Tất cả + Đà Nẵng: Bare Hàn and The Nắng Suites, no brand forced`, s.count === 2 && s.checked === 0 && s.cities[1].pressed === "true");
    await press(page, mobile, brandChip(page, "Pepper House"));
    await page.waitForTimeout(300);
    s = await state(page);
    ok(`${tag} then Pepper House: city dropped and explained, never empty`, s.count === 1 && s.cities.every((c) => c.pressed === "false") && /bộ lọc địa điểm đã được bỏ/.test(s.result), s.result);
    // Bare in Đà Nẵng, then back to everything.
    await press(page, mobile, brandChip(page, "Bare Boutique Stays"));
    await press(page, mobile, city(page, "da-nang"));
    await page.waitForTimeout(250);
    s = await state(page);
    ok(`${tag} Bare + Đà Nẵng: Bare Hàn only`, s.count === 1 && s.hrefs[0] === HREF("bare-han"));
    await press(page, mobile, page.locator("#kham-pha [class*=result] button"));
    await page.waitForTimeout(300);
    s = await state(page);
    ok(`${tag} "Bỏ lọc": all six again, nothing selected`, s.count === 6 && s.checked === 0 && s.cities.every((c) => c.pressed === "false"));

    // ── Coming Soon: distinct art, never bookable, not inventory.
    const cs = await page.evaluate(() => {
      const shelf = document.getElementById("sap-ra-mat");
      const cards = [...shelf.querySelectorAll("article")];
      const r = (el) => el.getBoundingClientRect();
      return {
        controls: shelf.querySelectorAll("a, button, input, select, [role=button]").length,
        booking: /BOOK NOW|Chọn phòng|Đặt phòng ngay|Kiểm tra|còn phòng|\d/.test(shelf.innerText),
        inStays: !!document.querySelector('ul[aria-labelledby="kham-pha-title"] article'),
        bgs: cards.map((c) => getComputedStyle(c).backgroundColor + "|" + getComputedStyle(c).backgroundImage.slice(0, 20)),
        parts: cards.map((c) => [c.querySelector("svg") ? "route" : "", c.querySelector("[class*=frame]") ? "frame" : "", c.querySelector("[class*=sun]") ? "sun" : ""].join("")),
        logos: cards.map((c) => c.querySelector("img")?.getAttribute("src") ?? ""),
        names: cards.map((c) => c.querySelector("h4").textContent),
        labels: cards.map((c) => c.textContent.includes("Sắp ra mắt")),
        textInside: cards.every((c) => [...c.querySelectorAll("p, h4, img")].every((el) => r(el).left >= r(c).left - 1 && r(el).right <= r(c).right + 1 && r(el).top >= r(c).top - 1 && r(el).bottom <= r(c).bottom + 1)),
        overlap: cards.some((c) => {
          const blocks = [...c.children].filter((el) => !el.matches("svg, [aria-hidden=true]") && r(el).width > 0);
          return blocks.some((a, i) => blocks.slice(i + 1).some((b) => !(r(a).right <= r(b).left || r(a).left >= r(b).right || r(a).bottom <= r(b).top || r(a).top >= r(b).bottom)));
        }),
        scroller: (() => {
          const ul = shelf.querySelector("ul");
          return { scrolls: ul.scrollWidth > ul.clientWidth + 1, tab: ul.getAttribute("tabindex") };
        })(),
      };
    });
    ok(`${tag} Coming Soon: no links, buttons or booking words; not among the stays`, cs.controls === 0 && !cs.booking && !cs.inStays);
    ok(`${tag} Coming Soon: three distinct compositions (route / frame / sun), own grounds, official logos`, cs.parts.join() === "route,frame,sun" && new Set(cs.bgs).size === 3 && cs.logos.every((src, i) => src.includes(["bare", "pepper", "nang"][i])), cs.parts.join());
    ok(`${tag} Coming Soon: brand names and "Sắp ra mắt" on every card`, cs.names.join("|") === "Bare Boutique Stays|Pepper House|The Nắng Suites" && cs.labels.every(Boolean));
    ok(`${tag} Coming Soon: text inside the card, no overlaps`, cs.textInside && !cs.overlap);
    if (mobile) ok(`${tag} Coming Soon: a swipeable row (keyboard-focusable), page does not scroll sideways`, cs.scroller.scrolls && cs.scroller.tab === "0");
    else ok(`${tag} Coming Soon: three columns, no inner scroll`, !cs.scroller.scrolls);

    // Entry → the teasers, focus on their heading.
    await page.evaluate(() => scrollTo(0, document.getElementById("kham-pha").offsetTop - 80));
    await press(page, mobile, page.locator("#kham-pha header a"));
    await page.waitForTimeout(900);
    const arrive = await page.evaluate(() => ({ top: document.getElementById("sap-ra-mat").getBoundingClientRect().top, focus: document.activeElement?.id }));
    ok(`${tag} Coming Soon entry scrolls to the teasers and focuses their heading`, arrive.top >= -2 && arrive.top < 170 && arrive.focus === "sap-ra-mat-title", `top=${arrive.top.toFixed(0)}`);

    // ── Links: every stay link answers 200.
    if (width === 1440 && lang === "vi") {
      for (const href of STAYS.map(HREF)) {
        const res = await page.request.get(`${base}${href}`);
        ok(`stay link ${href} → ${res.status()}`, res.status() === 200);
      }
    }

    // ── Page health.
    const health = await page.evaluate(() => {
      const clipped = [...document.querySelectorAll("#kham-pha p, #kham-pha h2, #kham-pha h3, #kham-pha h4, #kham-pha label, #kham-pha button, #thuong-hieu header *")].filter((el) => el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflowX !== "visible" && !el.classList.contains("sr-only")).map((el) => el.textContent.slice(0, 30));
      return { overflow: document.documentElement.scrollWidth - innerWidth, clipped, shift: window.__shift };
    });
    ok(`${tag} no horizontal overflow, no clipped text`, health.overflow <= 0 && health.clipped.length === 0, `${health.overflow} ${health.clipped.join("|")}`);
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
  ok("@1440 keyboard: ArrowRight from Tất cả chooses Bare Boutique Stays", s.checked === 1 && s.count === 4);
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

// Reduced motion: no transitions on the filters or the entry.
{
  const { ctx, page } = await open(390, "vi", true);
  const t = await page.evaluate(() => [document.querySelector("#kham-pha [data-filter=brand] span"), document.querySelector("#kham-pha [data-filter=city] button"), document.querySelector("#kham-pha header a")].map((el) => getComputedStyle(el).transitionDuration));
  ok("@390 reduced motion: filters and entry without transitions", t.every((d) => d.split(",").every((x) => x.trim() === "0s")), t.join(" / "));
  await ctx.close();
}

// A shared address with a filter opens filtered.
{
  const { ctx, page } = await open(1440, "vi");
  await page.goto(`${base}/dev/demo?intro=0&brand=the-nang`, { waitUntil: "networkidle" });
  await page.waitForTimeout(300);
  const s = await state(page);
  ok("@1440 ?brand=the-nang opens with The Nắng Suites, Đà Nẵng marked, its teaser", s.count === 1 && s.checked === 3 && s.cities[1].state === "only" && s.shelf.join() === "the-nang");
  await ctx.close();
}

await browser.close();
console.log(results.join("\n"));
console.log(`\n${results.filter((r) => r.startsWith("PASS")).length}/${results.length} passed`);
