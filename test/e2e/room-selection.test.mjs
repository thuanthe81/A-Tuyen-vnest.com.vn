/**
 * Simplified room selection (owner brief, 5/11/2026): real-browser checks on the property page.
 *   VNEST_TEST_URL=http://localhost:3402 node --test test/e2e/room-selection.test.mjs
 *   SHOTS=docs/qa/room-selection-simplify-2026-11-05/screens  (optional: writes state screenshots)
 * GoHost demo property: Bare Đa Kao (four rooms). ezCloud hand-off: Bare Chic.
 */
import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import { chromium } from "/Users/noe/Documents/GitHub/Cigarettes-After-Sex/node_modules/.pnpm/playwright@1.62.1/node_modules/playwright/index.mjs";

const BASE = process.env.VNEST_TEST_URL ?? "http://localhost:3402";
const SHOTS = process.env.SHOTS;
const DATES = "checkIn=2026-12-10&checkOut=2026-12-12";
const GOHOST = (query) => `${BASE}/dev/stays/bare-da-kao?view=demo&${query}`;
const ROOMS = ["bare-da-kao-one", "bare-da-kao-two", "bare-da-kao-three", "bare-da-kao-four"];
const VIEWPORTS = [
  { name: "1440", width: 1440, height: 900, isMobile: false, hasTouch: false },
  { name: "390", width: 390, height: 844, isMobile: true, hasTouch: true },
];

let browser;
before(async () => {
  browser = await chromium.launch();
});
after(async () => {
  await browser?.close();
});

async function open(viewport, url) {
  const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, isMobile: viewport.isMobile, hasTouch: viewport.hasTouch });
  const page = await context.newPage();
  const errors = [];
  page.on("console", (m) => {
    const text = m.text();
    if (m.type() === "error" && !text.startsWith("Failed to load resource") && !text.includes("maps.googleapis")) errors.push(text);
  });
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(url, { waitUntil: "networkidle" });
  return { page, context, errors };
}

const params = (page) => new URL(page.url()).searchParams;
const press = (locator, viewport) => (viewport.hasTouch ? locator.tap() : locator.click());
const slotNames = (page) => page.locator('[data-testid^="slot-pill-item-"]').evaluateAll((els) => els.map((el) => el.innerText.replace(/\s+/g, " ").replace(" ×", "").trim()));

async function noOverflow(page, viewport) {
  const { sw, iw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
  assert.ok(sw <= iw + 1, `no horizontal overflow at ${viewport.name}px (${sw} > ${iw})`);
}

async function shot(page, name) {
  if (!SHOTS) return;
  await page.addStyleTag({ content: "header#top{visibility:hidden!important}" });
  const card = page.locator('[role="region"][aria-label^="Tuỳ chọn lưu trú"]');
  await card.scrollIntoViewIfNeeded();
  await card.screenshot({ path: `${SHOTS}/${name}.png`, animations: "disabled" });
  const bar = page.locator('[data-testid="property-selection-summary-bar"]');
  if (await bar.count()) await bar.screenshot({ path: `${SHOTS}/${name}-bar.png`, animations: "disabled" });
  await page.addStyleTag({ content: "header#top{visibility:visible!important}" });
}

describe("room selection: one shared summary, room slots, one BOOK NOW", () => {
  for (const viewport of VIEWPORTS) {
    const cases = [
      { guests: 1, rooms: 1, split: "1" },
      { guests: 2, rooms: 1, split: "1" },
      { guests: 3, rooms: 2, split: "2,1" },
      { guests: 4, rooms: 2, split: "2,2" },
      { guests: 5, rooms: 3, split: "2,2,1" },
      { guests: 3, rooms: 3, split: "1,1,1" },
    ];
    for (const c of cases) {
      test(`@${viewport.name} ${c.guests} guests → ${c.rooms} room(s): slots, select, review`, async () => {
        // A room count from the address is kept; the guests are split over it internally (one or two per room).
        const { page, context, errors } = await open(viewport, GOHOST(`${DATES}&rooms=${c.rooms}&adults=${c.guests}`));
        await page.waitForFunction((want) => new URLSearchParams(location.search).get("rooms") === want, c.split);
        assert.equal(params(page).get("adults"), String(c.guests), "the guest total is kept");
        assert.equal(await page.locator('[data-testid="occupancy-correction"]').count(), 0, "a fitting stay needs no correction");
        const summary = page.locator('[data-testid="property-occupancy-summary"]');
        assert.match(await summary.innerText(), new RegExp(`${c.guests} khách · ${c.rooms} phòng`));
        assert.deepEqual(
          await slotNames(page),
          Array.from({ length: c.rooms }, (_, i) => `Phòng 0${i + 1} — Chưa chọn`),
        );
        // Removed: per-room guest steppers, the room-count stepper, "Đang chọn".
        const section = await page.locator("#rooms").innerText();
        assert.doesNotMatch(section, /Đang chọn/);
        assert.equal(await page.locator('#rooms [data-testid^="room-count-"], #rooms [aria-label^="Tăng khách"], #rooms [aria-label^="Giảm khách"]').count(), 0);
        assert.equal(await page.locator('[data-testid="summary-bar-book-now"]').count(), 1, "one BOOK NOW in the room step");

        for (let i = 0; i < c.rooms; i++) {
          const btn = page.locator(`[data-testid="select-room-${ROOMS[i]}"]`);
          await btn.scrollIntoViewIfNeeded();
          await press(btn, viewport);
          await page.waitForTimeout(120);
        }
        assert.deepEqual(
          (await slotNames(page)).map((t) => t.replace(/^Phòng 0\d — /, "")),
          ["Bare Đa Kao One", "Bare Đa Kao Two", "Bare Đa Kao Three", "Bare Đa Kao Four"].slice(0, c.rooms),
        );
        assert.match(await page.locator('[data-testid="summary-bar-status"]').innerText(), new RegExp(`${c.rooms}/${c.rooms} phòng đã chọn`, "i"));
        await press(page.locator('[data-testid="summary-bar-book-now"]'), viewport);
        const dialog = page.locator('dialog[data-testid="property-booking-dialog"][open]');
        await dialog.waitFor();
        assert.match(await dialog.innerText(), /chưa được kết nối/, "the review never implies a booking was made");
        const next = new URL(await dialog.locator('[data-testid="continue-property-booking-request"]').getAttribute("href"), BASE);
        assert.equal(next.searchParams.get("adults"), String(c.guests), "the guest total reaches the provider step");
        assert.equal(next.searchParams.get("rooms"), c.rooms === 1 ? "1" : c.split);
        if (c.guests === 3) await dialog.screenshot({ path: SHOTS ? `${SHOTS}/after-review-3g2r-${viewport.name}.png` : "/dev/null" }).catch(() => {});
        await dialog.locator('[data-testid="close-property-booking-dialog"]').click();
        await noOverflow(page, viewport);
        assert.deepEqual(errors, []);
        await context.close();
      });
    }

    test(`@${viewport.name} BOOK NOW guidance: no dates, then an incomplete selection`, async () => {
      const { page, context, errors } = await open(viewport, GOHOST("rooms=2,1&adults=3"));
      const book = page.locator('[data-testid="summary-bar-book-now"]');
      const guidance = page.locator('[data-testid="book-now-guidance"]');
      await press(book, viewport);
      await guidance.waitFor();
      assert.equal(await guidance.getAttribute("role"), "alert");
      assert.equal(await guidance.innerText(), "Chọn ngày nhận và trả phòng để tiếp tục.");
      assert.equal(await book.getAttribute("aria-describedby"), await guidance.getAttribute("id"));
      assert.equal(await page.locator('dialog[data-testid="property-booking-dialog"][open]').count(), 0, "no review without dates");
      assert.equal(await page.locator('[role="region"][aria-label="Chọn ngày nhận và trả phòng"]').count(), 1, "the calendar opens");
      await shot(page, `after-guidance-dates-${viewport.name}`);

      // Pick dates in the page calendar, then press again: the first empty room is named.
      const days = page.locator('[role="region"][aria-label="Chọn ngày nhận và trả phòng"] button:not([disabled])[aria-label*="tháng"]');
      await press(days.nth(10), viewport);
      await press(days.nth(12), viewport);
      await page.waitForFunction(() => new URLSearchParams(location.search).has("checkOut"));
      await press(book, viewport);
      await page.waitForFunction(() => document.querySelector('[data-testid="book-now-guidance"]')?.textContent?.includes("Phòng 01"));
      assert.equal(await guidance.innerText(), "Chọn loại phòng cho Phòng 01 để tiếp tục.");
      assert.equal(await page.locator('[data-testid="slot-pill-item-1"]').getAttribute("data-missing"), "true");
      await press(page.locator('[data-testid="select-room-bare-da-kao-two"]'), viewport);
      await page.waitForFunction(() => document.querySelector('[data-testid="book-now-guidance"]')?.textContent?.includes("Phòng 02"));
      await shot(page, `after-guidance-rooms-${viewport.name}`);
      await press(page.locator('[data-testid="select-room-bare-da-kao-three"]'), viewport);
      await page.waitForFunction(() => !document.querySelector('[data-testid="book-now-guidance"]'));
      await press(book, viewport);
      await page.locator('dialog[data-testid="property-booking-dialog"][open]').waitFor();
      assert.deepEqual(errors, []);
      await context.close();
    });

    test(`@${viewport.name} rooms: add, refuse with a reason, remove; identities kept; refresh and Back`, async () => {
      const { page, context, errors } = await open(viewport, GOHOST(`${DATES}&rooms=2,1&adults=3`));
      await press(page.locator('[data-testid="select-room-bare-da-kao-two"]'), viewport);
      await page.waitForFunction(() => new URLSearchParams(location.search).get("prefs") === "bare-da-kao-two,");
      const notice = page.locator('[data-testid="property-slot-notice"]');
      // A room for 3 guests that are already in 2 rooms: allowed, guests respread, the chosen room stays.
      await press(page.locator('[data-testid="add-room"]'), viewport);
      await page.waitForFunction(() => new URLSearchParams(location.search).get("rooms") === "1,1,1");
      assert.equal(params(page).get("adults"), "3");
      assert.match((await slotNames(page))[0], /Bare Đa Kao Two/);
      // No guest to spare.
      await press(page.locator('[data-testid="add-room"]'), viewport);
      assert.match(await notice.innerText(), /Mỗi phòng cần ít nhất 1 khách: 3 khách dùng được tối đa 3 phòng/);
      await press(page.locator('[data-testid="remove-slot-3"]'), viewport);
      await page.waitForFunction(() => new URLSearchParams(location.search).get("rooms") === "2,1");
      assert.equal(params(page).get("adults"), "3", "removing a room keeps three guests");
      assert.equal(await notice.innerText(), "", "the notice clears when the rooms change");
      // The second room is needed for 3 guests.
      await press(page.locator('[data-testid="remove-slot-2"]'), viewport);
      assert.match(await notice.innerText(), /3 khách cần ít nhất 2 phòng \(mỗi phòng tối đa 2 khách\)/);
      assert.equal(params(page).get("rooms"), "2,1");
      await shot(page, `after-remove-refused-${viewport.name}`);
      // Refresh keeps the stay and the chosen room.
      await page.reload({ waitUntil: "networkidle" });
      assert.equal(params(page).get("rooms"), "2,1");
      assert.equal(params(page).get("prefs"), "bare-da-kao-two,");
      assert.match((await slotNames(page))[0], /Bare Đa Kao Two/);
      // Back from another page returns to the same stay.
      await page.goto(`${BASE}/dev/demo?intro=0`, { waitUntil: "networkidle" });
      await page.goBack({ waitUntil: "networkidle" });
      assert.equal(params(page).get("rooms"), "2,1");
      assert.match((await slotNames(page))[0], /Bare Đa Kao Two/);
      await noOverflow(page, viewport);
      assert.deepEqual(errors, []);
      await context.close();
    });

    test(`@${viewport.name} the summary opens the shared field: guest cap, explicit room, never an automatic room`, async () => {
      const { page, context, errors } = await open(viewport, GOHOST(`${DATES}&rooms=2,2&adults=4&prefs=bare-da-kao-one,bare-da-kao-two`));
      await press(page.locator('[data-testid="property-occupancy-summary"]'), viewport);
      const panel = page.locator('[data-testid="occupancy-panel"]:visible');
      await panel.waitFor();
      const guestsUp = panel.getByRole("button", { name: "Thêm một người lớn" });
      assert.equal(await guestsUp.isDisabled(), true, "4 guests fill 2 rooms: no fifth guest without a room");
      assert.equal(await panel.locator('[data-testid="occupancy-note"]').innerText(), "Mỗi phòng tối đa 2 khách. Vui lòng thêm phòng nếu cần.");
      assert.equal(await panel.getByRole("button", { name: "Bớt một phòng" }).isDisabled(), true, "4 guests need both rooms");
      // The guest adds the room; the total stays 4 and the chosen rooms stay.
      await panel.getByRole("button", { name: "Thêm một phòng" }).click();
      await page.waitForFunction(() => new URLSearchParams(location.search).get("rooms") === "2,1,1");
      assert.equal(params(page).get("adults"), "4");
      await guestsUp.click();
      await page.waitForFunction(() => new URLSearchParams(location.search).get("adults") === "5");
      assert.equal(params(page).get("rooms"), "2,2,1", "a guest never adds a room");
      assert.equal(params(page).get("prefs"), "bare-da-kao-one,bare-da-kao-two,", "chosen rooms are kept");
      await page.keyboard.press("Escape");
      if (viewport.hasTouch) await page.locator("dialog[open] button[aria-label]").first().click().catch(() => {});
      await page.waitForTimeout(200);
      assert.match(await page.locator('[data-testid="property-occupancy-summary"]').innerText(), /5 khách · 3 phòng/);
      assert.equal(await page.locator('[data-testid^="slot-pill-item-"]').count(), 3);
      assert.deepEqual(errors, []);
      await context.close();
    });

    test(`@${viewport.name} outdated links: guests that do not fit are kept, flagged, and corrected only by the guest`, async () => {
      // 3 guests for 1 room: nothing changes until the guest picks a fix.
      const { page, context, errors } = await open(viewport, GOHOST(`${DATES}&rooms=1&adults=3`));
      const correction = page.locator('[data-testid="occupancy-correction"]');
      await correction.waitFor();
      assert.match(await correction.innerText(), /3 khách cho 1 phòng, nhưng mỗi phòng tối đa 2 khách/);
      assert.equal(params(page).get("rooms"), "1", "the room count is not changed");
      assert.equal(params(page).get("adults"), "3", "no guest is dropped");
      assert.match(await page.locator('[data-testid="property-occupancy-summary"]').innerText(), /3 khách · 1 phòng/);
      await shot(page, `after-deeplink-over-${viewport.name}`);
      await press(page.locator('[data-testid="select-room-bare-da-kao-one"]'), viewport);
      await press(page.locator('[data-testid="summary-bar-book-now"]'), viewport);
      await page.waitForFunction(() => document.querySelector('[data-testid="book-now-guidance"]')?.getAttribute("data-step") === "occupancy");
      assert.equal(await page.locator('dialog[data-testid="property-booking-dialog"][open]').count(), 0, "no review for a stay that does not fit");
      if (viewport.hasTouch) await page.locator("dialog[open]").evaluateAll((ds) => ds.forEach((d) => d.close()));
      else await page.keyboard.press("Escape");
      await press(page.locator('[data-testid="correct-add-rooms"]'), viewport);
      await page.waitForFunction(() => new URLSearchParams(location.search).get("rooms") === "2,1");
      assert.equal(params(page).get("adults"), "3");
      assert.equal(await correction.count(), 0);
      assert.match((await slotNames(page))[0], /Bare Đa Kao One/, "the chosen room is kept");
      await page.close();

      // 2 guests for 3 rooms: keep the rooms with a guest each.
      const under = await context.newPage();
      await under.goto(GOHOST(`${DATES}&rooms=3&adults=2`), { waitUntil: "networkidle" });
      const fix = under.locator('[data-testid="occupancy-correction"]');
      assert.match(await fix.innerText(), /3 phòng cho 2 khách, nhưng mỗi phòng cần ít nhất 1 khách/);
      assert.equal(new URL(under.url()).searchParams.get("adults"), "2", "no guest is invented");
      await press(under.locator('[data-testid="correct-more-guests"]'), viewport);
      await under.waitForFunction(() => new URLSearchParams(location.search).get("rooms") === "1,1,1" && new URLSearchParams(location.search).get("adults") === "3");
      assert.equal(await fix.count(), 0);
      assert.deepEqual(errors, []);
      await context.close();
    });

    test(`@${viewport.name} ezCloud hand-off keeps its single action and carries the stay`, async () => {
      const { page, context, errors } = await open(viewport, `${BASE}/dev/stays/bare-chic?view=demo&${DATES}&rooms=2,1&adults=3`);
      assert.match(await page.locator('[data-testid="property-occupancy-summary"]').innerText(), /3 khách · 2 phòng/);
      assert.equal(await page.locator('[data-testid^="slot-pill-item-"]').count(), 0);
      assert.equal(await page.locator('[data-testid="summary-bar-book-now"]').count(), 0);
      const href = new URL(await page.locator('[data-testid="property-handoff-cta"]').getAttribute("href"), BASE);
      assert.equal(href.searchParams.get("rooms"), "2,1");
      assert.equal(href.searchParams.get("adults"), "3");
      await noOverflow(page, viewport);
      // An outdated link on an ezCloud page: flagged, and the hand-off carries the stay as it is (never adjusted).
      await page.goto(`${BASE}/dev/stays/bare-chic?view=demo&${DATES}&rooms=1&adults=3`, { waitUntil: "networkidle" });
      assert.match(await page.locator('[data-testid="occupancy-correction"]').innerText(), /3 khách cho 1 phòng/);
      const asIs = new URL(await page.locator('[data-testid="property-handoff-cta"]').getAttribute("href"), BASE);
      assert.deepEqual([asIs.searchParams.get("rooms"), asIs.searchParams.get("adults")], ["1", "3"]);
      assert.deepEqual(errors, []);
      await context.close();
    });
  }
});
