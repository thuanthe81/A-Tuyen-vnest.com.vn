/**
 * VNest V3 — Hybrid Booking V1: real-browser regression suite (Playwright Chromium).
 *
 * Asserts what the guest actually sees: truthful per-property states, the GoHost room flow, the ezCloud
 * hand-off state (no first-party selection, no placeholder link), Back/refresh behaviour, stale answers,
 * real photographs in every room gallery, zero horizontal overflow and zero console errors.
 *
 * Two private review servers (the routes answer 404 unless DEPLOY_ENV=development is declared):
 *   VNEST_TEST_URL  a server WITHOUT simulation (`vnest-v3-qa`, 3402): what any deployment shows; `?sim=` must be ignored.
 *   VNEST_SIM_URL   a server with AVAILABILITY_SIMULATION=private-review (`vnest-v3-qa-sim`, 3404) for the simulated states.
 *   VNEST_TEST_URL=http://localhost:3402 VNEST_SIM_URL=http://localhost:3404 node --test test/e2e/hybrid-booking.test.mjs
 * Set VNEST_VIDEO_DIR to record each journey as video.
 */
import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import { chromium } from "/Users/noe/Documents/GitHub/Cigarettes-After-Sex/node_modules/.pnpm/playwright@1.62.1/node_modules/playwright/index.mjs";

const BASE = process.env.VNEST_TEST_URL ?? "http://localhost:3402";
const SIM_BASE = process.env.VNEST_SIM_URL ?? "http://localhost:3404";
const SIM_RESULTS = `${SIM_BASE}/dev/demo/tim-phong`;
const VIDEO_DIR = process.env.VNEST_VIDEO_DIR;
const STAY = "checkIn=2026-12-10&checkOut=2026-12-12&rooms=2,2&adults=4";
const RESULTS = `${BASE}/dev/demo/tim-phong`;
const ORDER = ["bare-chic", "bare-hyphen", "bare-da-kao", "bare-han", "the-nang-suites", "pepper-house"];
const EZCLOUD = ["bare-chic", "bare-hyphen", "bare-han", "the-nang-suites"];
const GOHOST = ["bare-da-kao", "pepper-house"];
const STAY_PAGE = {
  "bare-chic": "bare-chic?view=demo",
  "bare-hyphen": "bare-hyphen",
  "bare-da-kao": "bare-da-kao",
  "bare-han": "bare-han",
  "the-nang-suites": "the-nang-suites",
  "pepper-house": "pepper-house",
};
const HANDOFF_LABEL = "Kiểm tra giá & đặt phòng";
const DISCOVERY_LABEL = "Chọn phòng";
const AVAILABILITY_LABEL = "Kiểm tra phòng trống";
const detailPath = (id) => `/dev/stays/${id}`;

const VIEWPORTS = [
  { name: "375", width: 375, height: 812, isMobile: true, hasTouch: true },
  { name: "390", width: 390, height: 844, isMobile: true, hasTouch: true },
  { name: "430", width: 430, height: 932, isMobile: true, hasTouch: true },
  { name: "768", width: 768, height: 1024, isMobile: true, hasTouch: true },
  { name: "1440", width: 1440, height: 900, isMobile: false, hasTouch: false },
];

let browser;
before(async () => {
  browser = await chromium.launch();
});
after(async () => {
  await browser?.close();
});

/** Opens a page at a viewport with console/runtime error capture. */
async function open(viewport, url, extra = {}) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    isMobile: viewport.isMobile,
    hasTouch: viewport.hasTouch,
    ...(VIDEO_DIR ? { recordVideo: { dir: VIDEO_DIR, size: { width: viewport.width, height: viewport.height } } } : {}),
    ...extra,
  });
  const page = await context.newPage();
  const errors = [];
  page.on("console", (msg) => {
    // A failed resource is judged below by its address: third-party embeds (Google Maps) may be unreachable in CI.
    if (msg.type() === "error" && !msg.text().startsWith("Failed to load resource")) errors.push(msg.text());
  });
  page.on("response", (response) => {
    if (response.status() >= 400 && new URL(response.url()).origin === new URL(url).origin) errors.push(`${response.status()} ${response.url()}`);
  });
  page.on("pageerror", (err) => errors.push(String(err)));
  const response = await page.goto(url, { waitUntil: "networkidle" });
  assert.equal(response?.status(), 200, `${url} must answer 200 (is DEPLOY_ENV=development declared?)`);
  return { page, context, errors };
}

async function noOverflow(page, viewport) {
  const { sw, iw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
  assert.ok(sw <= iw + 1, `no horizontal overflow at ${viewport.name}px (scrollWidth ${sw} > ${iw})`);
}

const cardIds = (page) => page.$$eval('[data-testid="property-results"] > li', (els) => els.map((el) => el.dataset.property));

describe("results: all properties", () => {
  for (const viewport of VIEWPORTS) {
    test(`six cards in fixed order, truthful states, no overflow @${viewport.name}`, async () => {
      const { page, context, errors } = await open(viewport, `${RESULTS}?property=all&${STAY}`);
      assert.deepEqual(await cardIds(page), ORDER, "collection order, never price order");
      const text = await page.locator('[data-testid="property-results"]').innerText();
      assert.doesNotMatch(text, /Còn phòng|Không còn phòng|hết phòng|Đã bán/i, "no availability claim without a provider answer");
      assert.equal(await page.locator('[data-testid="verified-price"]').count(), 0, "no price without a provider quote");
      assert.doesNotMatch(await page.locator("main").innerText(), /\d+ phòng trống/, "no cross-provider available-room count");
      for (const id of EZCLOUD) {
        const card = page.locator(`[data-property="${id}"]`);
        assert.equal(await card.locator('[data-testid="handoff-cta"]').innerText(), HANDOFF_LABEL);
        assert.equal(await card.locator("a[href^='http']").count(), 0, "no placeholder external link while unconfigured");
        assert.equal(await card.locator('[data-testid="availability-needs-provider-check"]').count(), 1);
      }
      for (const id of GOHOST) {
        const card = page.locator(`[data-property="${id}"]`);
        assert.equal(await card.locator('[data-testid="availability-unconfigured"]').count(), 1, "unconfigured GoHost is not 'sold out'");
        assert.equal(await card.locator('[data-testid="check-availability"]').innerText(), AVAILABILITY_LABEL, "explicit availability search");
      }
      for (const id of ORDER) {
        // One discovery journey for all six: "Chọn phòng", the name and the photo all open the property's own page.
        const card = page.locator(`[data-property="${id}"]`);
        assert.equal(await card.locator('[data-testid="open-property"]').innerText(), DISCOVERY_LABEL);
        for (const testid of ["open-property", "property-name-link", "property-photo-link"]) {
          const href = await card.locator(`[data-testid="${testid}"]`).getAttribute("href");
          assert.equal(new URL(href, BASE).pathname, detailPath(id), `${id} ${testid} opens its detail page`);
        }
      }
      assert.doesNotMatch(text, /gohost|ezcloud/i, "no provider terminology for guests");
      await noOverflow(page, viewport);
      assert.deepEqual(errors, [], "no console or runtime errors");
      await context.close();
    });
  }

  test("an unknown property falls back to all six, never an error", async () => {
    const { page, context } = await open(VIEWPORTS[4], `${RESULTS}?property=bare-tan-dinh&${STAY}`);
    assert.deepEqual(await cardIds(page), ORDER);
    await context.close();
  });

  test("dates, rooms and guests survive into the results and into a property's page", async () => {
    const { page, context } = await open(VIEWPORTS[4], `${RESULTS}?property=all&${STAY}`);
    assert.match(await page.locator('[data-testid="search-summary"]').innerText(), /10 thg 12.*12 thg 12 \(2 đêm\).*2 phòng.*4 khách/);
    const href = await page.locator('[data-property="pepper-house"] [data-testid="open-property"]').getAttribute("href");
    const query = new URL(href, BASE).searchParams;
    assert.equal(query.get("checkIn"), "2026-12-10");
    assert.equal(query.get("checkOut"), "2026-12-12");
    assert.equal(query.get("rooms"), "2,2");
    assert.equal(query.get("adults"), "4");
    await context.close();
  });
});

describe("homepage search → results", () => {
  /** Picks Dec 10–12 in the homepage bar, optionally choosing a property first, then submits with BOOK NOW. */
  async function searchFromHome(page, propertyId) {
    if (propertyId) {
      await page.locator('button[data-field="property"]:visible').first().click();
      await page.waitForTimeout(450); // the panel animates in
      await page.locator(`div[role="dialog"] input[type="radio"][value="${propertyId}"]`).click({ force: true }); // choosing a property closes the panel, so no check() verification
    }
    await page.locator('button[data-field="checkIn"]:visible').first().click();
    const tenth = page.getByRole("button", { name: /Thứ Năm, 10 tháng 12, 2026/ });
    // One month is shown on narrower screens: page forward to December.
    await page.waitForTimeout(450);
    if ((await tenth.count()) === 0) await page.getByRole("button", { name: "Tháng sau" }).first().dispatchEvent("click");
    await tenth.dispatchEvent("click");
    await page.getByRole("button", { name: /Thứ Bảy, 12 tháng 12, 2026/ }).dispatchEvent("click");
    await page.locator('button[type="submit"]:visible', { hasText: /BOOK NOW/ }).first().click();
  }

  for (const viewport of [VIEWPORTS[3], VIEWPORTS[4]]) {
    test(`all properties: dates and guests reach the six-property results @${viewport.name}`, async () => {
      const { page, context, errors } = await open(viewport, `${BASE}/dev/demo?intro=0`);
      await searchFromHome(page);
      await page.waitForURL(/\/dev\/demo\/tim-phong/);
      const query = new URL(page.url()).searchParams;
      assert.equal(query.get("property"), "all");
      assert.equal(query.get("checkIn"), "2026-12-10");
      assert.equal(query.get("checkOut"), "2026-12-12");
      assert.equal(query.get("adults"), "2", "guest count is not silently reset");
      await page.waitForSelector('[data-testid="property-results"]');
      assert.deepEqual(await cardIds(page), ORDER);
      assert.deepEqual(errors, []);
      await context.close();
    });

    test(`a GoHost property goes to its own room selection @${viewport.name}`, async () => {
      const { page, context } = await open(viewport, `${BASE}/dev/demo?intro=0`);
      await searchFromHome(page, "pepper-house");
      await page.waitForURL(/property=pepper-house/);
      await page.waitForFunction(() => document.querySelector("h1")?.textContent === "Chọn phòng");
      assert.equal(await page.locator('[data-testid="handoff-panel"]').count(), 0);
      assert.equal(await page.locator('ul[aria-label="Danh sách phòng"] > li').count(), 2, "Pepper House's own two rooms");
      await context.close();
    });

    test(`an ezCloud property goes to the hand-off state, never to GoHost's flow @${viewport.name}`, async () => {
      const { page, context } = await open(viewport, `${BASE}/dev/demo?intro=0`);
      await searchFromHome(page, "bare-han");
      await page.waitForURL(/property=bare-han/);
      await page.waitForSelector('[data-testid="handoff-panel"]');
      assert.equal(await page.locator('ul[aria-label="Danh sách phòng"]').count(), 0, "no room list to select from");
      await context.close();
    });
  }
});

describe("discovery: every card opens its property page", () => {
  for (const viewport of [VIEWPORTS[1], VIEWPORTS[4]]) {
    for (const id of ORDER) {
      test(`${id} @${viewport.name}: "Chọn phòng" → detail page with the stay; Back returns to the results`, async () => {
        const { page, context, errors } = await open(viewport, `${RESULTS}?property=all&${STAY}`);
        await page.locator(`[data-property="${id}"] [data-testid="open-property"]`).click();
        await page.waitForURL((url) => url.pathname === detailPath(id));
        await page.waitForSelector("#property-title");
        const query = new URL(page.url()).searchParams;
        assert.equal(query.get("checkIn"), "2026-12-10", "dates kept");
        assert.equal(query.get("checkOut"), "2026-12-12");
        assert.equal(query.get("adults"), "4", "guests kept");
        assert.ok(["2,2"].includes(query.get("rooms")), "rooms kept");
        assert.ok((await page.locator("#rooms li[data-room-id]").count()) >= 2, "the property's room collection is on the page");
        await page.goBack();
        await page.waitForSelector('[data-testid="property-results"]');
        assert.deepEqual(await cardIds(page), ORDER, "Back returns to the result list");
        assert.deepEqual(errors, []);
        await context.close();
      });
    }
  }

  test("the property name and photo also open the detail page", async () => {
    const { page, context } = await open(VIEWPORTS[4], `${RESULTS}?property=all&${STAY}`);
    await page.locator('[data-property="bare-da-kao"] [data-testid="property-name-link"]').click();
    await page.waitForURL((url) => url.pathname === detailPath("bare-da-kao"));
    await page.goBack();
    await page.waitForSelector('[data-testid="property-results"]');
    await page.locator('[data-property="pepper-house"] [data-testid="property-photo-link"]').click();
    await page.waitForURL((url) => url.pathname === detailPath("pepper-house"));
    await context.close();
  });
});

test("an edited search (rooms added on the results page) survives property page → Back", async () => {
  const { page, context, errors } = await open(VIEWPORTS[1], `${RESULTS}?property=all&checkIn=2026-12-10&checkOut=2026-12-12&rooms=1&adults=2`);
  await page.getByRole("button", { name: "Chỉnh sửa ngày & tìm kiếm" }).tap();
  await page.getByRole("tab", { name: /Phòng & khách/ }).tap();
  await page.getByRole("button", { name: "Thêm một phòng" }).first().tap();
  await page.getByRole("button", { name: "Áp dụng" }).tap();
  await page.waitForFunction(() => new URLSearchParams(location.search).get("rooms") === "1,1");
  await page.locator('[data-property="bare-da-kao"] [data-testid="open-property"]').tap();
  await page.waitForURL((url) => url.pathname === detailPath("bare-da-kao"));
  assert.equal(new URL(page.url()).searchParams.get("rooms"), "1,1");
  await page.goBack();
  await page.waitForSelector('[data-testid="property-results"]');
  await page.waitForTimeout(400);
  assert.equal(new URL(page.url()).searchParams.get("rooms"), "1,1", "the edited rooms are not reverted by Back");
  assert.match(await page.locator('[data-testid="search-summary"]').innerText(), /2 phòng · 2 khách/);
  assert.deepEqual(errors, []);
  await context.close();
});

describe("GoHost property: explicit availability search stays room-first", () => {
  test("Kiểm tra phòng trống opens that property's rooms only; Back returns to the list with one press", async () => {
    const { page, context, errors } = await open(VIEWPORTS[4], `${RESULTS}?property=all&${STAY}`);
    await page.locator('[data-property="bare-da-kao"] [data-testid="check-availability"]').click();
    await page.waitForFunction(() => document.querySelector("h1")?.textContent === "Chọn phòng");
    const rooms = await page.$$eval('ul[aria-label="Danh sách phòng"] > li', (els) => els.map((el) => el.dataset.property));
    assert.equal(rooms.length, 4);
    assert.ok(rooms.every((id) => id === "bare-da-kao"), "only that property's rooms");
    assert.match(new URL(page.url()).search, /property=bare-da-kao/);
    await page.goBack();
    await page.waitForSelector('[data-testid="property-results"]');
    assert.deepEqual(await cardIds(page), ORDER, "one Back press returns to the result list");
    assert.deepEqual(errors, []);
    await context.close();
  });
});

describe("ezCloud properties: hand-off state", () => {
  for (const id of EZCLOUD) {
    test(`${id}: honest unconfigured hand-off, no first-party selection, Back works`, async () => {
      const { page, context, errors } = await open(VIEWPORTS[1], `${RESULTS}?property=all&${STAY}`);
      await page.locator(`[data-property="${id}"] [data-testid="handoff-cta"]`).click();
      await page.waitForSelector('[data-testid="handoff-panel"]');
      assert.equal(await page.locator('[data-testid="handoff-panel"]').getAttribute("data-handoff"), "unconfigured");
      assert.match(await page.locator('[data-testid="handoff-unconfigured"]').innerText(), /chưa được kết nối/);
      assert.match(await page.locator('[data-testid="handoff-stay"]').innerText(), /10 thg 12.*2 phòng.*4 khách/);
      assert.equal(await page.locator("main a[href^='http']").count(), 0, "no placeholder external URL");
      assert.equal(await page.locator('main button:has-text("Chọn phòng")').count(), 0, "no room selection");
      assert.equal(await page.locator('main :text("Tiếp tục")').count(), 0, "no booking continuation");
      assert.equal(await page.locator('[data-testid="verified-price"]').count(), 0);
      await noOverflow(page, VIEWPORTS[1]);
      await page.goBack();
      await page.waitForSelector('[data-testid="property-results"]');
      assert.deepEqual(errors, []);
      await context.close();
    });
  }
});

describe("simulation is fail-closed", () => {
  test("a server without AVAILABILITY_SIMULATION ignores ?sim=: no simulated state, price or banner", async () => {
    const { page, context } = await open(VIEWPORTS[4], `${RESULTS}?property=all&${STAY}&sim=bare-da-kao:available,pepper-house:unavailable`);
    assert.equal(await page.locator('[data-testid="simulation-banner"]').count(), 0);
    assert.equal(await page.locator('[data-testid="verified-price"]').count(), 0);
    assert.equal(await page.locator('[data-property="bare-da-kao"] [data-testid="availability-unconfigured"]').count(), 1);
    assert.equal(await page.locator('[data-property="pepper-house"] [data-testid="availability-unconfigured"]').count(), 1);
    await context.close();
  });
});

describe("provider states are never confused", () => {
  test("a provider error is not sold out and can be retried; unavailable is only a verified answer", async () => {
    const { page, context } = await open(VIEWPORTS[4], `${SIM_RESULTS}?property=all&${STAY}&sim=bare-da-kao:error,pepper-house:unavailable`);
    const error = page.locator('[data-property="bare-da-kao"] [data-testid="availability-error"]');
    const errorText = await error.innerText();
    assert.match(errorText, /không phải là hết phòng/);
    assert.doesNotMatch(errorText, /Không còn phòng/);
    assert.equal(await error.locator("button", { hasText: "Thử lại" }).count(), 1);
    assert.match(await page.locator('[data-property="pepper-house"] [data-testid="availability-unavailable"]').innerText(), /Không còn phòng/);
    assert.equal(await page.locator('[data-testid="simulation-banner"]').count(), 1, "simulation is announced");
    await context.close();
  });

  test("a verified available state shows its price and labels a simulation as not real", async () => {
    const { page, context } = await open(VIEWPORTS[4], `${SIM_RESULTS}?property=all&${STAY}&sim=bare-da-kao:available`);
    const card = page.locator('[data-property="bare-da-kao"]');
    assert.match(await card.innerText(), /Còn phòng cho ngày bạn chọn/);
    assert.match(await card.locator('[data-testid="verified-price"]').innerText(), /₫.*Tổng 2 đêm.*Mô phỏng · không phải giá thật/s);
    assert.equal(await card.locator('[data-testid="open-property"]').innerText(), DISCOVERY_LABEL);
    assert.equal(await page.locator('[data-property="bare-chic"] [data-testid="verified-price"]').count(), 0, "ezCloud never shows a price");
    await context.close();
  });

  test("changing the stay hides verified answers until they are checked again, and keeps the review simulation", async () => {
    const { page, context } = await open(VIEWPORTS[4], `${SIM_RESULTS}?property=all&${STAY}&sim=bare-da-kao:available`);
    assert.equal(await page.locator('[data-testid="stale-bar"]').count(), 0);
    await page.getByRole("button", { name: "Chỉnh sửa ngày & tìm kiếm" }).click();
    await page.getByRole("tab", { name: /Phòng & khách/ }).click();
    await page.getByRole("button", { name: "Thêm một phòng" }).click();
    await page.getByRole("button", { name: "Áp dụng" }).click();
    await page.waitForSelector('[data-testid="stale-bar"]');
    assert.equal(await page.locator('[data-property="bare-da-kao"] [data-testid="verified-price"]').count(), 0, "a stale quote is not shown");
    await page.getByRole("button", { name: "Cập nhật kết quả" }).click();
    await page.waitForFunction(() => !document.querySelector('[data-testid="stale-bar"]') && /rooms=2%2C1%2C1|rooms=2,1,1/.test(location.search) && /adults=4/.test(location.search));
    assert.match(page.url(), /sim=bare-da-kao/);
    await context.close();
  });
});

describe("property pages", () => {
  for (const id of EZCLOUD) {
    test(`${id} page: one hand-off action, no first-party room selection`, async () => {
      const { page, context, errors } = await open(VIEWPORTS[1], `${BASE}/dev/stays/${STAY_PAGE[id]}${STAY_PAGE[id].includes("?") ? "&" : "?"}${STAY}`);
      assert.equal(await page.locator('[data-testid^="select-room-"]').count(), 0);
      assert.equal(await page.locator('[data-testid="property-booking-dialog"]').count(), 0);
      assert.equal(await page.locator('[data-testid="property-selection-summary-bar"]').count(), 0);
      const cta = page.locator('[data-testid="property-handoff-cta"]');
      assert.equal((await cta.innerText()).trim().toLowerCase(), HANDOFF_LABEL.toLowerCase());
      const href = new URL(await cta.getAttribute("href"), BASE);
      assert.equal(href.pathname, "/dev/demo/tim-phong");
      assert.equal(href.searchParams.get("property"), id);
      assert.equal(href.searchParams.get("checkIn"), "2026-12-10");
      assert.ok((await page.locator("h1").innerText()).length > 0);
      await noOverflow(page, VIEWPORTS[1]);
      assert.deepEqual(errors, []);
      await context.close();
    });
  }

  test("header BOOK NOW on an ezCloud page leads to the hand-off state with the stay", async () => {
    const { page, context } = await open(VIEWPORTS[4], `${BASE}/dev/stays/bare-hyphen?${STAY}`);
    await page.locator("header").getByRole("button", { name: /BOOK NOW/ }).click();
    await page.waitForURL(/\/dev\/demo\/tim-phong\?property=bare-hyphen/);
    await page.waitForSelector('[data-testid="handoff-panel"]');
    assert.match(page.url(), /checkIn=2026-12-10/);
    await context.close();
  });

  for (const id of GOHOST) {
    test(`${id} page: slot-based selection preserved, BOOK NOW opens it, nothing is held`, async () => {
      const { page, context, errors } = await open(VIEWPORTS[4], `${BASE}/dev/stays/${STAY_PAGE[id]}?${STAY}`);
      assert.ok((await page.locator('[data-testid^="select-room-"]').count()) >= 2);
      assert.equal(await page.locator('[data-testid="property-handoff-cta"]').count(), 0);
      // Header BOOK NOW with no room chosen: guidance, not a review (simplified room selection, 5/11/2026).
      await page.locator("header").getByRole("button", { name: /BOOK NOW/ }).click();
      const guidance = page.locator('[data-testid="book-now-guidance"]');
      await guidance.waitFor();
      assert.match(await guidance.innerText(), /Chọn loại phòng cho Phòng 01/);
      const dialog = page.locator('[data-testid="property-booking-dialog"]');
      assert.equal(await dialog.isVisible(), false);
      const slots = await page.locator('[data-testid^="slot-pill-item-"]').count();
      for (let i = 0; i < slots; i++) await page.locator('[data-testid^="select-room-"]').nth(i).click();
      await page.locator('[data-testid="summary-bar-book-now"]').click();
      await dialog.waitFor({ state: "visible" });
      assert.match(await dialog.innerText(), /chưa có phòng nào được giữ/);
      assert.deepEqual(errors, []);
      await context.close();
    });
  }
});

describe("room galleries use the authorised client photographs", () => {
  for (const viewport of [VIEWPORTS[1], VIEWPORTS[4]]) {
    for (const id of ORDER) {
      test(`${id} @${viewport.name}: every hero and room photo loads, the viewer opens`, async () => {
        const { page, context, errors } = await open(viewport, `${BASE}/dev/stays/${STAY_PAGE[id]}${STAY_PAGE[id].includes("?") ? "&" : "?"}checkIn=2026-12-10&checkOut=2026-12-12`);
        await page.evaluate(() => document.querySelectorAll("img").forEach((img) => (img.loading = "eager")));
        await page.waitForTimeout(800);
        const hero = await page.$$eval("img", (imgs) =>
          imgs.filter((img) => !img.closest("li[data-room-id], header, footer, nav")).map((img) => ({ src: img.currentSrc || img.src, ok: img.complete && img.naturalWidth > 0 })),
        );
        assert.ok(hero.length > 0, "the page has photographs");
        assert.deepEqual(hero.filter((img) => !img.ok), [], "no broken hero/gallery image");
        assert.ok(hero.every((img) => decodeURIComponent(img.src).includes("/dev-client-media/")), "authentic client media only, no stock or placeholder");
        const rooms = await page.$$eval("li[data-room-id]", (els) => els.map((el) => el.dataset.roomId));
        assert.ok(rooms.length > 0);
        for (const room of rooms) {
          const li = page.locator(`li[data-room-id="${room}"]`);
          const open = li.locator('button[aria-label^="Mở thư viện"]');
          const label = await open.getAttribute("aria-label");
          const total = Number(label.match(/\/(\d+)\)/)?.[1] ?? 1);
          const next = li.locator('[data-testid="carousel-next"]');
          for (let i = 0; i < total; i += 1) {
            const loaded = await li.locator("img").first().evaluate(async (img) => {
              img.loading = "eager";
              for (let t = 0; t < 40 && !(img.complete && img.naturalWidth > 0); t += 1) await new Promise((r) => setTimeout(r, 100));
              return { ok: img.complete && img.naturalWidth > 0, src: img.currentSrc || img.src };
            });
            assert.ok(loaded.ok, `${room} photo ${i + 1}/${total} loads (${loaded.src})`);
            assert.ok(decodeURIComponent(loaded.src).includes("/dev-client-media/"), `${room} photo is client media`);
            if (i < total - 1) await next.click();
          }
          await open.click();
          const viewer = page.locator("dialog[open]");
          await viewer.waitFor({ state: "visible" });
          assert.ok(await viewer.locator("img").first().evaluate(async (img) => {
            for (let t = 0; t < 40 && !(img.complete && img.naturalWidth > 0); t += 1) await new Promise((r) => setTimeout(r, 100));
            return img.complete && img.naturalWidth > 0;
          }), `${room} viewer image loads`);
          await page.keyboard.press("Escape");
          await viewer.waitFor({ state: "hidden" });
        }
        await noOverflow(page, viewport);
        assert.deepEqual(errors, [], "no console errors");
        await context.close();
      });
    }
  }
});

describe("homepage property cards open the property pages", () => {
  for (const viewport of [VIEWPORTS[1], VIEWPORTS[4]]) {
    for (const id of ["bare-da-kao", "pepper-house", "bare-chic"]) {
      test(`${id} @${viewport.name}: homepage card → detail page; Back returns home`, async () => {
        const { page, context, errors } = await open(viewport, `${BASE}/dev/demo?intro=0`);
        const card = page.locator(`main a[href^="${detailPath(id)}"]:visible`).first();
        await card.scrollIntoViewIfNeeded();
        await card.click();
        await page.waitForURL((url) => url.pathname === detailPath(id));
        await page.waitForSelector("#property-title");
        await page.goBack();
        await page.waitForURL((url) => url.pathname === "/dev/demo");
        assert.deepEqual(errors, []);
        await context.close();
      });
    }
  }
});

// The menu item reads "Khám phá nơi ở" again (owner's Phase A corrections, 7/11/2026); found by its destination, #kham-pha.
test("@390: Menu → 'Khám phá nơi ở' → card → Back returns to the homepage, not a stale page", async () => {
  const { page, context, errors } = await open(VIEWPORTS[1], `${BASE}/dev/demo?intro=0`);
  await page.locator('header nav[aria-label="Điều hướng chính"] button[aria-haspopup="dialog"]').click();
  await page.locator('header dialog[open] a[href="/dev/demo#kham-pha"]').click();
  await page.waitForFunction(() => location.hash === "#kham-pha");
  const card = page.locator(`main a[href^="${detailPath("bare-da-kao")}"]:visible`).first();
  await card.scrollIntoViewIfNeeded();
  await card.click();
  await page.waitForURL((url) => url.pathname === detailPath("bare-da-kao"));
  await page.waitForSelector("#property-title");
  await page.goBack();
  await page.waitForURL((url) => url.pathname === "/dev/demo");
  await page.waitForFunction(() => !document.querySelector("#property-title"), null, { timeout: 10000 });
  assert.deepEqual(errors, []);
  await context.close();
});

describe("Pepper House presentation", () => {
  const THIRD = /sel-15-pepper-house-3rd-floor|sel-16-pepper-house-3rd-floor|\/dev-client-media\/pepper-house\/|pepper-house-3rd-floor-/;
  const FOURTH = /sel-17-pepper-house-4th-floor|pepper-house-4th-floor-/;

  async function carouselSources(li) {
    const label = await li.locator('button[aria-label^="Mở thư viện"]').getAttribute("aria-label");
    const total = Number(label.match(/\/(\d+)\)/)?.[1] ?? 1);
    const sources = [];
    for (let i = 0; i < total; i += 1) {
      sources.push(
        await li.locator("img").first().evaluate(async (img) => {
          img.loading = "eager";
          for (let t = 0; t < 40 && !(img.complete && img.naturalWidth > 0); t += 1) await new Promise((r) => setTimeout(r, 100));
          const fit = getComputedStyle(img).objectFit;
          return { src: decodeURIComponent(img.currentSrc || img.src), ok: img.complete && img.naturalWidth > 0, fit };
        }),
      );
      if (i < total - 1) await li.locator('[data-testid="carousel-next"]').click();
    }
    return sources;
  }

  for (const viewport of [VIEWPORTS[0], VIEWPORTS[1], VIEWPORTS[2], VIEWPORTS[3], VIEWPORTS[4]]) {
    test(`@${viewport.name}: two separate rooms in order, each with only its own floor's photographs`, async () => {
      const { page, context, errors } = await open(viewport, `${BASE}/dev/stays/pepper-house?${STAY}`);
      const rooms = await page.$$eval("#rooms li[data-room-id]", (els) => els.map((el) => el.dataset.roomId));
      assert.deepEqual(rooms, ["pepper-house-3rd-floor", "pepper-house-4th-floor"], "approved room order, no duplicate rooms");
      const third = await carouselSources(page.locator('li[data-room-id="pepper-house-3rd-floor"]'));
      const fourth = await carouselSources(page.locator('li[data-room-id="pepper-house-4th-floor"]'));
      assert.equal(third.length, 6, "3rd-floor: 6 photographs");
      assert.equal(fourth.length, 5, "4th-floor: 5 photographs");
      for (const photo of third) {
        assert.ok(photo.ok, `loads: ${photo.src}`);
        assert.match(photo.src, THIRD, "3rd-floor shows only 3rd-floor photographs");
        assert.doesNotMatch(photo.src, FOURTH);
        assert.ok(["cover", "contain"].includes(photo.fit), `not stretched (object-fit ${photo.fit})`);
      }
      for (const photo of fourth) {
        assert.ok(photo.ok, `loads: ${photo.src}`);
        assert.match(photo.src, FOURTH, "4th-floor shows only 4th-floor photographs");
        assert.doesNotMatch(photo.src, THIRD);
        assert.ok(["cover", "contain"].includes(photo.fit), `not stretched (object-fit ${photo.fit})`);
      }
      assert.equal(new Set([...third, ...fourth].map((p) => p.src.replace(/\/\d+\.(avif|webp|jpg).*/, ""))).size, 11, "11 distinct photographs");
      await noOverflow(page, viewport);
      assert.deepEqual(errors, []);
      await context.close();
    });
  }

  test("@390: swipe, room drawers, 'Xem tất cả ảnh', and GoHost room selection in demo mode", async () => {
    const { page, context, errors } = await open(VIEWPORTS[1], `${BASE}/dev/stays/pepper-house?${STAY}`);
    // Touch swipe on the 4th-floor carousel advances it.
    const carousel = page.locator('[data-room-carousel="Pepper House 4th-floor"]');
    await carousel.scrollIntoViewIfNeeded();
    assert.equal(await carousel.getAttribute("data-photo-index"), "0");
    await carousel.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      const y = rect.top + rect.height / 2;
      const point = (x) => ({ identifier: 1, target: el, clientX: x, clientY: y, pageX: x, pageY: y });
      const fire = (type, touches, changed) => {
        const evt = new UIEvent(type, { bubbles: true, cancelable: true });
        Object.defineProperty(evt, "touches", { value: touches });
        Object.defineProperty(evt, "targetTouches", { value: touches });
        Object.defineProperty(evt, "changedTouches", { value: changed });
        el.dispatchEvent(evt);
      };
      const a = rect.left + rect.width * 0.8, b = rect.left + rect.width * 0.2;
      fire("touchstart", [point(a)], [point(a)]);
      fire("touchmove", [point((a + b) / 2)], [point((a + b) / 2)]);
      fire("touchend", [], [point(b)]);
    });
    await page.waitForTimeout(250);
    assert.equal(await carousel.getAttribute("data-photo-index"), "1", "swipe advances the 4th-floor carousel");
    assert.equal(await page.locator("dialog[open]").count(), 0, "a swipe never opens the viewer");

    // Both room drawers open and close.
    for (const room of ["Pepper House 3rd-floor", "Pepper House 4th-floor"]) {
      const li = page.locator(`li[data-room-id="${room.toLowerCase().replace(/ /g, "-")}"]`);
      await li.locator("button", { hasText: "Xem chi tiết phòng" }).click();
      const drawer = page.locator("dialog[open]").first();
      await drawer.waitFor({ state: "visible" });
      assert.match(await drawer.innerText(), new RegExp(room));
      await drawer.locator("button", { hasText: "Đóng" }).first().click();
      await page.waitForFunction(() => !document.querySelector("dialog[open]"));
    }

    // "Xem tất cả ảnh" lists every room photograph and opens the viewer.
    const all = page.locator("button", { hasText: /Xem tất cả \d+ ảnh/ });
    const count = Number((await all.innerText()).match(/(\d+)/)[1]);
    assert.ok(count >= 11, `all ${count} photographs offered`);
    await all.click();
    const viewer = page.locator("dialog[open]").first();
    await viewer.waitFor({ state: "visible" });
    assert.ok((await viewer.locator("section ul li button").count()) >= 11);
    await page.keyboard.press("Escape");
    await page.waitForFunction(() => !document.querySelector("dialog[open]"));

    // GoHost demo selection still works: selecting a room marks it, nothing is held.
    const first = page.locator('li[data-room-id="pepper-house-3rd-floor"]');
    await first.locator('[data-testid="select-room-pepper-house-3rd-floor"]').click();
    assert.equal(await first.getAttribute("data-selected"), "true");
    assert.equal(await page.locator('[data-testid="property-handoff-cta"]').count(), 0);
    assert.equal(await page.locator('[data-testid="verified-price"]').count(), 0, "no unverified price");
    assert.deepEqual(errors, []);
    await context.close();
  });
});

describe("rooms and guests are separate values", () => {
  const params = (page) => new URL(page.url()).searchParams;
  const summary = (page) => page.locator('[data-testid="search-summary"]').innerText();

  for (const viewport of [VIEWPORTS[1], VIEWPORTS[4]]) {
    test(`@${viewport.name}: 3 guests / 2 rooms → add a room keeps 3 → remove → Back and refresh keep it`, async () => {
      const { page, context, errors } = await open(viewport, `${RESULTS}?property=all&checkIn=2026-12-10&checkOut=2026-12-12&rooms=2,1&adults=3`);
      assert.match(await summary(page), /2 phòng · 3 khách/);
      await page.getByRole("button", { name: "Chỉnh sửa ngày & tìm kiếm" }).click();
      await page.getByRole("tab", { name: /Phòng & khách/ }).click();

      // A third room takes one guest each; then no empty room can be added.
      await page.getByRole("button", { name: "Thêm một phòng" }).click();
      await page.waitForFunction(() => new URLSearchParams(location.search).get("rooms") === "1,1,1");
      assert.equal(params(page).get("adults"), "3", "adding a room keeps three guests");
      assert.equal(await page.getByRole("button", { name: "Thêm một phòng" }).isDisabled(), true, "no guest to spare: adding is disabled");
      assert.match(await page.locator('[data-testid="rooms-guests-note"]').innerText(), /ít nhất 1 khách/);

      // Remove a room: the guests stay in the search.
      await page.getByRole("button", { name: "Bớt một phòng" }).click();
      await page.waitForFunction(() => new URLSearchParams(location.search).get("rooms") === "2,1");
      assert.equal(params(page).get("adults"), "3", "removing a room keeps three guests");
      assert.equal(await page.getByRole("button", { name: "Bớt một phòng" }).isDisabled(), true, "3 guests need 2 rooms");

      // Close the editor; the address is the search: Back from a property page and refresh keep it.
      await page.getByRole("button", { name: "Áp dụng" }).click();
      await page.locator('[data-property="pepper-house"] [data-testid="open-property"]').click();
      await page.waitForURL((url) => url.pathname === detailPath("pepper-house"));
      assert.equal(params(page).get("rooms"), "2,1");
      assert.equal(params(page).get("adults"), "3");
      await page.goBack();
      await page.waitForSelector('[data-testid="property-results"]');
      await page.waitForTimeout(300);
      assert.equal(params(page).get("rooms"), "2,1");
      await page.reload({ waitUntil: "networkidle" });
      assert.equal(params(page).get("rooms"), "2,1");
      assert.match(await summary(page), /2 phòng · 3 khách/);
      assert.deepEqual(errors, []);
      await context.close();
    });
  }

  test("property page (GoHost demo): adding and removing room slots keeps the guest total", async () => {
    const { page, context, errors } = await open(VIEWPORTS[1], `${BASE}/dev/stays/bare-da-kao?checkIn=2026-12-10&checkOut=2026-12-12&rooms=2,1&adults=3`);
    const add = page.locator('[data-testid="add-room"]');
    await add.scrollIntoViewIfNeeded();
    await add.click();
    await page.waitForFunction(() => new URLSearchParams(location.search).get("rooms") === "1,1,1");
    assert.equal(params(page).get("adults"), "3");
    // No guest to spare: the room is not added, and the page says why.
    await add.click();
    assert.match(await page.locator('[data-testid="property-slot-notice"]').innerText(), /Mỗi phòng cần ít nhất 1 khách/);
    assert.equal(params(page).get("rooms"), "1,1,1");
    await page.locator('[data-testid="remove-slot-3"]').click();
    await page.waitForFunction(() => new URLSearchParams(location.search).get("rooms") === "2,1");
    // Two rooms are needed for three guests: removing one more is explained, nothing changes.
    await page.locator('[data-testid="remove-slot-2"]').click();
    assert.match(await page.locator('[data-testid="property-slot-notice"]').innerText(), /3 khách cần ít nhất 2 phòng/);
    assert.equal(params(page).get("rooms"), "2,1");
    assert.equal(params(page).get("adults"), "3");
    // GoHost demo selection still works and still claims nothing.
    await page.locator('[data-testid="select-room-bare-da-kao-one"]').click();
    assert.equal(await page.locator('li[data-room-id="bare-da-kao-one"]').getAttribute("data-selected"), "true");
    assert.equal(await page.locator('[data-testid="verified-price"]').count(), 0);
    assert.deepEqual(errors, []);
    await context.close();
  });

  test("ezCloud pages are unchanged: hand-off, no room selection, stay carried", async () => {
    const { page, context } = await open(VIEWPORTS[1], `${BASE}/dev/stays/bare-han?checkIn=2026-12-10&checkOut=2026-12-12&rooms=2,1&adults=3`);
    assert.equal(await page.locator('[data-testid^="select-room-"]').count(), 0);
    assert.match(await page.locator('[data-testid="property-occupancy-summary"]').innerText(), /3 khách · 2 phòng/);
    const href = new URL(await page.locator('[data-testid="property-handoff-cta"]').getAttribute("href"), BASE);
    assert.equal(href.searchParams.get("rooms"), "2,1");
    assert.equal(href.searchParams.get("adults"), "3");
    await context.close();
  });
});

describe("Pepper House 3rd-floor cover", () => {
  test("room card leads with 02.jpg, 08.jpg stays in the room's photographs, the hero is unchanged", async () => {
    const { page, context, errors } = await open(VIEWPORTS[4], `${BASE}/dev/stays/pepper-house?${STAY}`);
    const li = page.locator('li[data-room-id="pepper-house-3rd-floor"]');
    const first = await li.locator("img").first().evaluate((img) => decodeURIComponent(img.currentSrc || img.src));
    assert.match(first, /pepper-house-3rd-floor-02/, "room-card cover is 02.jpg");
    const label = await li.locator('button[aria-label^="Mở thư viện"]').getAttribute("aria-label");
    assert.match(label, /\/6\)/, "still six photographs");
    const seen = [];
    for (let i = 0; i < 6; i += 1) {
      seen.push(await li.locator("img").first().evaluate((img) => decodeURIComponent(img.currentSrc || img.src)));
      if (i < 5) await li.locator('[data-testid="carousel-next"]').click();
    }
    assert.ok(seen.some((src) => /sel-15-pepper-house-3rd-floor-a/.test(src)), "08.jpg (sel-15) remains in the gallery");
    // Hero mosaic: the same photographs as before the cover change (owner selection order).
    const hero = await page.$$eval("#property-title", () => [...document.querySelectorAll("main img")].slice(0, 6).map((img) => decodeURIComponent(img.currentSrc || img.src)));
    const heroKeys = hero.map((src) => (src.match(/(sel-1[5-7][^/]*|pepper-house-[34]..-floor-\d+|\/pepper-house\/)/) ?? [""])[0]);
    assert.ok(heroKeys[0].startsWith("sel-15"), `hero still leads with the owner's selection (got ${heroKeys.join(", ")})`);
    assert.ok(heroKeys[1].startsWith("sel-17"), "hero second tile unchanged");
    assert.deepEqual(errors, []);
    await context.close();
  });
});

describe("combined 'Phòng & khách' field (Option B)", () => {
  const params = (page) => new URL(page.url()).searchParams;

  for (const viewport of [VIEWPORTS[3], VIEWPORTS[4]]) {
    // Phase D (9/11/2026): the homepage bar has no room stepper any more; the combined field is checked where it still
    // is, the header bar of a property page (ezCloud: its search goes to the results page).
    test(`@${viewport.name}: desktop panel — guests and rooms, complete summary, search carries the rooms`, async () => {
      const { page, context, errors } = await open(viewport, `${BASE}/dev/stays/the-nang-suites`);
      const field = page.locator('header#top button[data-field="guests"]:visible').first();
      assert.match(await field.innerText(), /Phòng & khách[\s\S]*2 khách · 1 phòng/i);
      await field.click();
      const panel = page.locator('[data-testid="occupancy-panel"]:visible');
      await panel.waitFor();
      // Let the panel finish opening (as a person would): clicking mid-animation makes Playwright scroll, and scrolling
      // past the hero hands over to the sticky bar, which closes the hero bar's panel by design (frozen 02.1).
      await page.waitForTimeout(400);
      const tap = async (name) => {
        await panel.getByRole("button", { name }).click({ noWaitAfter: true });
        await page.waitForTimeout(150);
      };
      // Two guests fill one room: the guest cap, explained; a guest never adds a room (owner correction, 5/11/2026).
      assert.equal(await panel.getByRole("button", { name: "Thêm một người lớn" }).isDisabled(), true);
      assert.equal(await panel.locator('[data-testid="occupancy-note"]').innerText(), "Mỗi phòng tối đa 2 khách. Vui lòng thêm phòng nếu cần.");
      await tap("Thêm một phòng");
      assert.match(await field.innerText(), /2 khách · 2 phòng/, "a room keeps the guests");
      await tap("Thêm một người lớn");
      assert.match(await field.innerText(), /3 khách · 2 phòng/);
      assert.equal(await panel.getByRole("button", { name: "Bớt một phòng" }).isDisabled(), true, "3 guests keep 2 rooms");
      // A third room takes one guest each, then no more.
      await tap("Thêm một phòng");
      assert.match(await field.innerText(), /3 khách · 3 phòng/);
      assert.equal(await panel.getByRole("button", { name: "Thêm một phòng" }).isDisabled(), true);
      assert.equal(await panel.getByRole("button", { name: "Bớt một người lớn" }).isDisabled(), true);
      assert.match(await panel.innerText(), /Mỗi phòng cần ít nhất 1 khách/);
      await tap("Bớt một phòng");
      assert.match(await field.innerText(), /3 khách · 2 phòng/, "removing a room keeps the guests");
      // Every panel control is touch-sized.
      const small = await panel.locator("button").evaluateAll((els) => els.filter((e) => e.getBoundingClientRect().height < 44).length);
      assert.equal(small, 0);
      await page.keyboard.press("Escape");
      // Dates, then BOOK NOW: the rooms reach the results.
      await page.locator('header#top button[data-field~="checkIn"]:visible').first().click();
      const tenth = page.getByRole("button", { name: /Thứ Năm, 10 tháng 12, 2026/ });
      await page.waitForTimeout(450);
      // One month on show: step forward until December.
      for (let i = 0; i < 12 && (await tenth.count()) === 0; i++) await page.getByRole("button", { name: "Tháng sau" }).first().dispatchEvent("click");
      await tenth.dispatchEvent("click");
      await page.getByRole("button", { name: /Thứ Bảy, 12 tháng 12, 2026/ }).dispatchEvent("click");
      await page.locator('button[type="submit"]:visible', { hasText: /BOOK NOW/ }).first().click();
      await page.waitForURL(/\/dev\/demo\/tim-phong/);
      // 3 rooms less one: the three guests are split over the two that remain.
      assert.equal(params(page).get("rooms"), "2,1");
      assert.equal(params(page).get("adults"), "3");
      await noOverflow(page, viewport);
      assert.deepEqual(errors, []);
      await context.close();
    });
  }

  test("property page: the header field and the room slots stay one search, both ways", async () => {
    const { page, context, errors } = await open(VIEWPORTS[4], `${BASE}/dev/stays/bare-da-kao?checkIn=2026-12-10&checkOut=2026-12-12&rooms=2,1&adults=3`);
    const field = page.locator('header#top button[data-field="guests"]:visible').first();
    assert.match(await field.innerText(), /3 khách · 2 phòng/);
    // Page → header: a room slot added here shows in the header field.
    await page.locator('[data-testid="add-room"]').click();
    await page.waitForFunction(() => new URLSearchParams(location.search).get("rooms") === "1,1,1");
    await page.waitForFunction(() => /3 khách · 3 phòng/.test(document.querySelector('header#top button[data-field="guests"]')?.textContent ?? ""), null, { timeout: 3000 });
    await page.locator('[data-testid="remove-slot-3"]').click();
    await page.waitForFunction(() => new URLSearchParams(location.search).get("rooms") === "2,1");
    // Header → page
    await field.click();
    const panel = page.locator('[data-testid="occupancy-panel"]:visible');
    await panel.getByRole("button", { name: "Thêm một phòng" }).click();
    await page.waitForFunction(() => new URLSearchParams(location.search).get("rooms") === "1,1,1");
    assert.equal(await page.locator('[data-testid^="slot-pill-item-"]').count(), 3);
    await panel.getByRole("button", { name: "Bớt một phòng" }).click();
    await page.waitForFunction(() => new URLSearchParams(location.search).get("rooms")?.split(",").length === 2);
    assert.equal(params(page).get("adults"), "3");
    // A room preference survives a bar change, and the demo selection still claims nothing.
    await page.keyboard.press("Escape");
    await page.locator('[data-testid="select-room-bare-da-kao-one"]').click();
    await field.click();
    await panel.getByRole("button", { name: "Thêm một người lớn" }).click();
    await page.waitForFunction(() => new URLSearchParams(location.search).get("adults") === "4");
    assert.match(new URL(page.url()).searchParams.get("prefs") ?? "", /bare-da-kao-one/);
    assert.equal(await page.locator('[data-testid="verified-price"]').count(), 0);
    assert.deepEqual(errors, []);
    await context.close();
  });

  for (const viewport of [VIEWPORTS[0], VIEWPORTS[1], VIEWPORTS[2]]) {
    test(`@${viewport.name}: mobile pill shows the complete summary on at most two lines, no overflow`, async () => {
      const { page, context, errors } = await open(viewport, `${BASE}/dev/demo?intro=0&property=the-nang-suites&checkIn=2026-12-10&checkOut=2026-12-12&rooms=2,1&adults=3`);
      const pill = page.locator('#dat-phong button[aria-haspopup="dialog"]:visible').first();
      await pill.scrollIntoViewIfNeeded();
      const text = await pill.innerText();
      assert.match(text, /The Nắng Suites/);
      assert.match(text, /10 thg 12 – 12 thg 12/);
      // Phase D: the homepage pill reads the guest field (adults, children); the address's rooms are kept, not shown.
      assert.match(text, /3 người lớn/);
      const summary = await pill.evaluate((el) => {
        const line = el.querySelector(".line-clamp-2");
        const lh = parseFloat(getComputedStyle(line).lineHeight);
        return { lines: Math.round(line.getBoundingClientRect().height / lh), clipped: line.scrollHeight > line.clientHeight + 1 };
      });
      assert.ok(summary.lines <= 2, `at most two lines (${summary.lines})`);
      assert.equal(summary.clipped, false, "nothing hidden by the clamp");
      await noOverflow(page, viewport);
      // Sheet: the steppers are touch-sized.
      await pill.tap();
      const sheet = page.locator("dialog.vn-sheet[open]");
      await sheet.getByRole("button", { name: /^Khách/ }).first().tap();
      const small = await sheet.locator('[data-testid="occupancy-panel"] button').evaluateAll((els) => els.filter((e) => e.getBoundingClientRect().height < 44).length);
      assert.equal(small, 0);
      assert.match(await sheet.innerText(), /Bạn chọn số phòng ở bước chọn phòng\./);
      assert.deepEqual(errors, []);
      await context.close();
    });
  }
});
