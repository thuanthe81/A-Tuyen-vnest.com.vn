// Phase C revision, round 2 (owner, 8/11/2026). Discovery: the earlier filter layout with the new options; "Tất cả" shows
// only the real stays; one brand shows its real stays then its own Coming Soon card, last in the same list, built on the
// listing card shell (photo box + name lines on desktop, the mobile strip below 64rem) from the brand's own photograph,
// linked only to a confirmed brand website. Arrow CTAs without underline (About "Liên hệ VNest →", stay names, property
// pages' "Xem tất cả nơi ở →"). "Hợp tác cùng VNest": visible overline, dominant heading, even cards, a panel without the
// repeated title or highlight lines, one prominent CTA that still reaches the form. Plus the city rules, stay links,
// overflow, layout shift, keyboard, reduced motion, console/hydration errors. Vietnamese and the English preview.
// Usage: node docs/qa/client-review-2026-11-06/scripts/qa-c-rev2.mjs http://localhost:3401
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

// The Coming Soon card on screen: content, link, shell against a real stay card, brand photograph, no overlaps.
const teaserCheck = (page) =>
  page.evaluate(() => {
    const card = document.querySelector("#kham-pha [data-coming-soon]");
    if (!card) return null;
    const r = (el) => el.getBoundingClientRect();
    const hit = (a, b) => !(r(a).right <= r(b).left || r(a).left >= r(b).right || r(a).bottom <= r(b).top || r(a).top >= r(b).bottom);
    const stays = [...document.querySelectorAll('#kham-pha ul[aria-labelledby="kham-pha-title"] > li:not([data-trailing])')];
    const real = stays[0];
    const strip = card.dataset.variant === "strip";
    const realBox = strip ? real.querySelector("[class*=mobilePropertyLink]") : real.querySelector("img");
    const pic = card.querySelector("[class*=picture]");
    const photo = card.querySelector("[class*=photo]");
    const mark = card.querySelector("[class*=frame]") ?? card.querySelector("img[class*=logo]");
    const name = card.querySelector("h3");
    const label = card.querySelector("[class*=tileLabel], [class*=tag]");
    const realNameSize = strip ? getComputedStyle(real.querySelector("h3")).fontSize : getComputedStyle(real.querySelector("h3")).fontSize;
    return {
      brand: card.dataset.comingSoon,
      variant: card.dataset.variant,
      tag: card.tagName,
      href: card.getAttribute("href"),
      website: card.dataset.website,
      controls: card.querySelectorAll("a, button, input, select, [role=button]").length,
      text: card.textContent.replace(/\s+/g, " ").trim(),
      visibleText: [name, label].map((el) => el?.textContent.replace(/\s+/g, " ").trim()),
      logo: card.querySelector("img[class*=logo]")?.getAttribute("src") ?? "",
      parts: [card.querySelector("svg") ? "route" : "", card.querySelector("[class*=frame]") ? "frame" : "", card.querySelector("[class*=sun]") ? "sun" : ""].join(""),
      photoSrc: photo?.getAttribute("src") ?? null,
      photoBlur: photo ? getComputedStyle(photo).filter : "",
      stayPhotos: stays.map((li) => li.querySelector("img")?.getAttribute("src")),
      size: { w: r(pic).width, h: r(pic).height, rw: r(realBox).width, rh: r(realBox).height, radius: getComputedStyle(pic).borderTopLeftRadius, rradius: getComputedStyle(realBox).borderTopLeftRadius },
      nameSize: [getComputedStyle(name).fontSize, realNameSize],
      inside: [mark, name, label].every((el) => r(el).left >= r(card).left - 1 && r(el).right <= r(card).right + 1 && r(el).top >= r(card).top - 1 && r(el).bottom <= r(card).bottom + 1) && r(mark).top >= r(pic).top && r(mark).bottom <= r(pic).bottom,
      overlap: hit(mark, name) || hit(mark, label) || hit(name, label),
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
      ok(`${tag} ${b.id} card: only the brand name and "Sắp ra mắt", no body text`, t.visibleText.join("|") === `${b.name}|Sắp ra mắt`, t.visibleText.join("|"));
      ok(`${tag} ${b.id} card: never bookable (no controls, prices, numbers or booking words)`, t.controls === 0 && !/Chọn phòng|Xem giá|Đặt phòng|BOOK|còn phòng|giá|\d/i.test(t.text), t.text);
      ok(`${tag} ${b.id} card: its own motif and official logo`, t.parts === PART[b.id] && t.logo.includes(LOGO[b.id]), t.parts);
      ok(`${tag} ${b.id} card: built from the brand's own photograph (one of its listed stays), blurred`, !!t.photoSrc && t.stayPhotos.includes(t.photoSrc) && /blur/.test(t.photoBlur), t.photoSrc ?? "no photo");
      ok(
        `${tag} ${b.id} card: links to the confirmed brand website, or is not a link while none is confirmed`,
        t.tag === "A" ? /^https:\/\//.test(t.href) && !/facebook\.com|vnest/i.test(t.href) && t.website === "confirmed" : t.href === null && t.website === "pending",
        `${t.tag} ${t.website}`,
      );
      ok(`${tag} ${b.id} card: the listing card's shell (${mobile ? "mobile strip" : "photo box"}: same size and radius, same name size)`, t.variant === (mobile ? "strip" : "tile") && Math.abs(t.size.w - t.size.rw) < 1.5 && Math.abs(t.size.h - t.size.rh) < 1.5 && t.size.radius === t.size.rradius && t.nameSize[0] === t.nameSize[1], `${t.size.w.toFixed(0)}×${t.size.h.toFixed(0)}/${t.size.radius} vs ${t.size.rw.toFixed(0)}×${t.size.rh.toFixed(0)}/${t.size.rradius}; ${t.nameSize.join(" vs ")}`);
      ok(`${tag} ${b.id} card: mark, name and label inside, no overlaps`, t.inside && !t.overlap);
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

    // ── Arrow CTAs: no underline at rest, on hover or on focus; focus still visible.
    const about = page.locator("#ve-vnest a[href$='#lien-he']");
    await about.scrollIntoViewIfNeeded();
    const deco = (loc) => loc.evaluate((a) => getComputedStyle(a).textDecorationLine);
    const aboutRest = await deco(about);
    if (!mobile) await about.hover();
    const aboutHover = await deco(about);
    // Keyboard focus (Tab back onto the link), so :focus-visible applies as it does for keyboard users.
    await about.focus();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    const aboutFocus = await about.evaluate((a) => ({ line: getComputedStyle(a).textDecorationLine, outline: a.matches(":focus-visible") ? getComputedStyle(a).outlineStyle : "not focus-visible" }));
    ok(`${tag} About "${lang === "vi" ? "Liên hệ VNest" : "Contact VNest"} →": no underline at rest, hover or focus; focus outline visible`, aboutRest === "none" && aboutHover === "none" && aboutFocus.line === "none" && aboutFocus.outline === "solid", `${aboutRest}/${aboutHover}/${aboutFocus.line}/${aboutFocus.outline}`);
    if (!mobile) {
      const nameLink = page.locator('#kham-pha h3 a[href^="/dev/stays/"]').first();
      await nameLink.scrollIntoViewIfNeeded();
      await nameLink.hover();
      const n = await nameLink.evaluate((a) => ({ line: getComputedStyle(a).textDecorationLine, gap: (() => { const g = document.createRange(); g.selectNodeContents(a.lastElementChild.firstChild); const t = document.createRange(); t.selectNodeContents(a.firstChild); return g.getBoundingClientRect().left - t.getBoundingClientRect().right; })() }));
      ok(`${tag} stay name "→" links: no underline on hover, a space before the arrow`, n.line === "none" && n.gap >= 3, `${n.line} gap=${n.gap.toFixed(1)}`);
    }

    // ── "Hợp tác cùng VNest": overline, heading, cards, panel without repetition, one prominent CTA.
    await page.locator("#hop-tac").scrollIntoViewIfNeeded();
    const coop = await page.evaluate(() => {
      const sec = document.getElementById("hop-tac");
      const r = (el) => el.getBoundingClientRect();
      const kicker = sec.querySelector("p");
      const h2 = sec.querySelector("h2");
      const cards = [...sec.querySelectorAll("button[aria-expanded]")];
      const region = sec.querySelector("[role=region]");
      const text = region.querySelector("p");
      const cta = region.querySelector("button");
      const ks = getComputedStyle(kicker);
      return {
        kicker: { size: parseFloat(ks.fontSize), color: ks.color, weight: Number(ks.fontWeight) },
        h2: { size: parseFloat(getComputedStyle(h2).fontSize), lines: Math.round(r(h2).height / parseFloat(getComputedStyle(h2).lineHeight)) },
        cardHeights: cards.map((c) => Math.round(r(c).height)),
        cardTops: cards.map((c) => Math.round(r(c).top)),
        regionNamed: region.getAttribute("aria-label"),
        repeated: region.querySelectorAll("h3, h4, li").length,
        regionHasTitle: region.innerText.includes(cards.find((c) => c.getAttribute("aria-expanded") === "true").querySelector("[class*=cardTitle]").firstChild.textContent.trim() + "\n"),
        textSize: parseFloat(getComputedStyle(text).fontSize),
        measure: r(text).width / parseFloat(getComputedStyle(text).fontSize),
        buttons: region.querySelectorAll("button").length,
        cta: { h: r(cta).height, w: r(cta).width, size: parseFloat(getComputedStyle(cta).fontSize), lines: Math.round((r(cta).height - 0) / 56), inside: r(cta).right <= r(region).right && r(cta).left >= r(region).left },
        ctaLabelHeight: (() => { const range = document.createRange(); range.selectNodeContents(cta.firstChild); return range.getBoundingClientRect().height; })(),
      };
    });
    ok(`${tag} Hợp tác: the overline is visible (copper, ≥ 13 px, semibold)`, coop.kicker.size >= 13 && coop.kicker.color === "rgb(143, 96, 54)" && coop.kicker.weight >= 600, JSON.stringify(coop.kicker));
    ok(`${tag} Hợp tác: the heading stays dominant (≥ 32 px; one line on desktop in Vietnamese, at most two in English)`, coop.h2.size >= 32 && (width < 1024 || coop.h2.lines <= (lang === "vi" ? 1 : 2)), `${coop.h2.size}px, ${coop.h2.lines} line(s)`);
    if (width >= 768) ok(`${tag} Hợp tác: three cards in one row, even heights`, new Set(coop.cardTops).size === 1 && new Set(coop.cardHeights).size === 1, coop.cardHeights.join("/"));
    ok(`${tag} Hợp tác panel: no repeated title or highlight lines; named for screen readers`, coop.repeated === 0 && !coop.regionHasTitle && !!coop.regionNamed);
    ok(`${tag} Hợp tác panel: description at reading size and measure`, coop.textSize >= 17 && coop.measure <= 42, `${coop.textSize}px, ${coop.measure.toFixed(0)}em`);
    // One line from tablet up; phones allow a balanced second line for long labels (the arrow stays on the right).
    const maxLabel = width >= 768 ? 30 : 48;
    ok(`${tag} Hợp tác panel: one CTA, large (≥ 56 px tall, ≥ 15 px text), ${width >= 768 ? "one line" : "at most two lines"}, inside the panel`, coop.buttons === 1 && coop.cta.h >= 55.5 && coop.cta.size >= 15 && coop.ctaLabelHeight < maxLabel && coop.cta.inside, `${coop.cta.h}×${coop.cta.w.toFixed(0)} ${coop.cta.size}px label ${coop.ctaLabelHeight.toFixed(0)}`);
    for (const [i, id] of ["van-hanh", "tu-van-mo-hinh", "nhuong-quyen"].entries()) {
      const card = page.locator(`#hop-tac button[data-service="${id}"]`);
      if ((await card.getAttribute("aria-expanded")) !== "true") await press(page, mobile, card);
      await page.waitForTimeout(280);
      const p = await page.evaluate(() => {
        const region = document.querySelector("#hop-tac [role=region]");
        const cta = region.querySelector("button");
        const range = document.createRange();
        range.selectNodeContents(cta.firstChild);
        return { repeated: region.querySelectorAll("h3, li").length, label: range.getBoundingClientRect().height, overflow: document.documentElement.scrollWidth - innerWidth };
      });
      ok(`${tag} Hợp tác service ${i + 1}: panel without repetition, CTA label fits, no overflow`, p.repeated === 0 && p.label < maxLabel && p.overflow <= 0, `label ${p.label.toFixed(0)} overflow ${p.overflow}`);
    }
    // The CTA still reaches the consultation form with the service chosen.
    await press(page, mobile, page.locator("#hop-tac [role=region] button"));
    await page.waitForTimeout(900);
    const reach = await page.evaluate(() => ({ top: document.getElementById("tu-van").getBoundingClientRect().top, url: location.search + location.hash, checked: document.querySelector('#tu-van input[name="service"]:checked')?.value }));
    ok(`${tag} Hợp tác CTA: scrolls to the form with the service chosen`, Math.abs(reach.top) < 200 && /dich-vu=nhuong-quyen/.test(reach.url) && reach.checked === "nhuong-quyen", `${reach.top.toFixed(0)} ${reach.url} ${reach.checked}`);
    await page.locator("#kham-pha").evaluate((el) => el.scrollIntoView({ block: "start" }));

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

// Property pages: "Xem tất cả nơi ở →" (related stays) without underline, at rest and on hover.
for (const width of [1440, 390]) {
  const mobile = width < 1024;
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, isMobile: mobile, hasTouch: mobile });
  const page = await ctx.newPage();
  await page.goto(`${base}/dev/stays/bare-hyphen`, { waitUntil: "networkidle" });
  const link = page.locator("a", { hasText: "Xem tất cả nơi ở" }).filter({ has: page.locator('span[aria-hidden="true"]') }).first();
  await link.scrollIntoViewIfNeeded();
  const rest = await link.evaluate((a) => getComputedStyle(a).textDecorationLine);
  if (!mobile) await link.hover();
  const hover = await link.evaluate((a) => getComputedStyle(a).textDecorationLine);
  ok(`@${width} property page "Xem tất cả nơi ở →": no underline at rest or on hover`, rest === "none" && hover === "none", `${rest}/${hover}`);
  await ctx.close();
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
