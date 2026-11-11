/**
 * Occupancy correction (owner brief, 5/11/2026): rooms and guests are each the guest's own choice; N rooms take N to 2N
 * guests; a guest never adds a room; an outdated address is flagged and corrected only by the guest.
 * Phase D (9/11/2026): the homepage bar no longer shows the room stepper (adults + children only; rooms are chosen at room
 * selection), so the combined field's rules are checked on a property page's header bar, where the field is unchanged.
 *   VNEST_TEST_URL=http://localhost:3402 node --test test/e2e/occupancy.test.mjs
 *   SHOTS=docs/qa/occupancy-correction-2026-11-05/screens  (optional)
 */
import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import { chromium } from "/Users/noe/Documents/GitHub/Cigarettes-After-Sex/node_modules/.pnpm/playwright@1.62.1/node_modules/playwright/index.mjs";

const BASE = process.env.VNEST_TEST_URL ?? "http://localhost:3402";
const SHOTS = process.env.SHOTS;
const DATES = "checkIn=2026-12-10&checkOut=2026-12-12";
const RESULTS = `${BASE}/dev/demo/tim-phong`;
const CAP = "Mỗi phòng tối đa 2 khách. Vui lòng thêm phòng nếu cần.";
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

/** Opens a bar's guest panel (desktop field, or the phone sheet's section): the homepage hero bar or a page's header bar. */
async function openPanel(page, viewport, where = "header#top") {
  if (viewport.hasTouch) {
    await page.locator(`${where} button[aria-haspopup="dialog"]:visible`).first().tap();
    await page.locator('dialog[open] [data-section="guests"]').tap();
  } else {
    await page.locator(where).evaluate((el) => el.scrollIntoView({ block: "center" }));
    await page.locator(`${where} button[data-field="guests"]:visible`).first().click();
    await page.waitForTimeout(450);
  }
  const panel = page.locator('[data-testid="occupancy-panel"]:visible');
  await panel.waitFor();
  return panel;
}

async function panelState(panel) {
  // Steppers in order: adults, children (Phase D), rooms.
  const values = await panel.locator("output").allInnerTexts();
  const disabled = async (name) => panel.getByRole("button", { name }).isDisabled();
  return {
    guests: Number(values[0]),
    rooms: Number(values[2]),
    guestsUp: !(await disabled("Thêm một người lớn")),
    guestsDown: !(await disabled("Bớt một người lớn")),
    roomsUp: !(await disabled("Thêm một phòng")),
    roomsDown: !(await disabled("Bớt một phòng")),
    note: await panel.locator('[data-testid="occupancy-note"]').innerText(),
  };
}

describe("shared Phòng & khách field (property page header bar)", () => {
  for (const viewport of VIEWPORTS) {
    test(`@${viewport.name} every valid combination, 1 guest / 1 room up to 12 / 6; a guest never adds a room`, async () => {
      const { page, context, errors } = await open(viewport, `${BASE}/dev/stays/bare-da-kao?rooms=1&adults=1`);
      const panel = await openPanel(page, viewport);
      const tap = async (name) => {
        await panel.getByRole("button", { name }).click({ noWaitAfter: true });
        await page.waitForTimeout(120);
      };
      const seen = [];
      let state = await panelState(panel);
      for (;;) {
        // The steppers offer exactly the steps that keep N ≤ guests ≤ 2N.
        const { guests: g, rooms: r } = state;
        seen.push(`${g}/${r}`);
        assert.equal(state.guestsUp, g + 1 <= 2 * r, `${g}/${r} guests +`);
        assert.equal(state.guestsDown, g - 1 >= r, `${g}/${r} guests −`);
        assert.equal(state.roomsUp, r < 6 && g >= r + 1, `${g}/${r} rooms +`);
        assert.equal(state.roomsDown, r > 1 && g <= 2 * (r - 1), `${g}/${r} rooms −`);
        if (g === 2 * r && r < 6) assert.equal(state.note, CAP, `${g}/${r} cap note`);
        if (state.guestsUp) {
          await tap("Thêm một người lớn");
          const next = await panelState(panel);
          assert.equal(next.rooms, r, "adding a guest never adds a room");
          assert.equal(next.guests, g + 1);
          state = next;
        } else if (state.roomsUp) {
          await tap("Thêm một phòng");
          const next = await panelState(panel);
          assert.equal(next.guests, g, "adding a room keeps the guest total");
          assert.equal(next.rooms, r + 1);
          state = next;
        } else break;
      }
      assert.deepEqual(seen.slice(0, 5), ["1/1", "2/1", "2/2", "3/2", "4/2"]);
      assert.equal(seen.at(-1), "12/6");
      assert.equal(state.note, "Tối đa 6 phòng, 12 khách cho mỗi yêu cầu.");
      if (SHOTS) await panel.screenshot({ path: `${SHOTS}/after-panel-12g6r-${viewport.name}.png` });
      // Down again: removing a needed room is not offered; removing a guest is.
      assert.equal(state.roomsDown, false);
      await tap("Bớt một người lớn");
      await tap("Bớt một người lớn");
      const lower = await panelState(panel);
      assert.deepEqual([lower.guests, lower.rooms, lower.roomsDown], [10, 6, true]);
      await tap("Bớt một phòng");
      assert.deepEqual([(await panelState(panel)).guests, (await panelState(panel)).rooms], [10, 5]);
      assert.deepEqual(errors, []);
      await context.close();
    });

    test(`@${viewport.name} the cap and its message at 2 guests / 1 room`, async () => {
      const { page, context, errors } = await open(viewport, `${BASE}/dev/stays/bare-da-kao?rooms=1&adults=2`);
      const panel = await openPanel(page, viewport);
      const state = await panelState(panel);
      assert.deepEqual([state.guests, state.rooms, state.guestsUp], [2, 1, false]);
      assert.equal(state.note, CAP);
      if (SHOTS) await panel.screenshot({ path: `${SHOTS}/after-panel-2g1r-${viewport.name}.png` });
      assert.deepEqual(errors, []);
      await context.close();
    });
  }
});

describe("homepage bar (Phase D): adults and children, no room stepper", () => {
  for (const viewport of VIEWPORTS) {
    test(`@${viewport.name} rooms are not shown; adults up to the request limit; children apart; the results start at the fewest rooms`, async () => {
      const { page, context, errors } = await open(viewport, `${BASE}/dev/demo?intro=0`);
      const panel = await openPanel(page, viewport, "#dat-phong");
      assert.equal(await panel.getAttribute("data-room-field"), "hidden");
      assert.equal(await panel.getByRole("button", { name: /phòng$/ }).count(), 0, "no room stepper");
      const plus = panel.getByRole("button", { name: "Thêm một người lớn" });
      for (let i = 0; i < 12 && !(await plus.isDisabled()); i++) await plus.dispatchEvent("click");
      assert.equal((await panel.locator("output").allInnerTexts())[0], "12", "up to 6 rooms × 2, rooms chosen later");
      for (let i = 0; i < 9; i++) await panel.getByRole("button", { name: "Bớt một người lớn" }).dispatchEvent("click");
      await panel.getByRole("button", { name: "Thêm một trẻ em" }).dispatchEvent("click");
      assert.deepEqual(await panel.locator("output").allInnerTexts(), ["3", "1"]);
      assert.match(await panel.locator('[data-testid="child-policy-note"]').innerText(), /đang chờ VNest xác nhận/);
      if (!viewport.hasTouch) await page.keyboard.press("Escape");
      // Dates, then BOOK NOW: the results start at the fewest rooms for the adults; the child travels apart.
      if (viewport.hasTouch) await page.locator('dialog[open] [data-section="dates"]').tap();
      else await page.locator('#dat-phong button[data-field="checkIn"]:visible').first().dispatchEvent("click");
      const day = (re) => page.getByRole("button", { name: re }).locator("visible=true").first();
      for (let i = 0; i < 2 && (await day(/, 10 tháng 12, 2026/).count()) === 0; i++) await page.getByRole("button", { name: "Tháng sau" }).locator("visible=true").first().dispatchEvent("click");
      await day(/, 10 tháng 12, 2026/).dispatchEvent("click");
      await day(/, 12 tháng 12, 2026/).dispatchEvent("click");
      if (viewport.hasTouch) await page.locator('dialog[open] footer button[type="submit"]').tap();
      else await page.locator('#dat-phong form[role="search"] button[type="submit"]:visible').first().dispatchEvent("click");
      await page.waitForURL(/\/dev\/demo\/tim-phong/);
      assert.deepEqual([params(page).get("rooms"), params(page).get("adults"), params(page).get("children")], ["2,1", "3", "1"]);
      assert.deepEqual(errors, []);
      await context.close();
    });
  }
});

describe("results page: no per-room guest steppers, the same rule", () => {
  for (const viewport of VIEWPORTS) {
    test(`@${viewport.name} two steppers in the editor; refusals explained; Back and refresh keep the stay`, async () => {
      const { page, context, errors } = await open(viewport, `${RESULTS}?property=bare-da-kao&${DATES}&rooms=2,1&adults=3`);
      const body = await page.locator("main").innerText();
      assert.doesNotMatch(body, /Bớt khách cho Phòng|Thêm khách cho Phòng|Giảm khách Phòng|Tăng khách Phòng/);
      assert.equal(await page.locator('[aria-label^="Bớt khách Phòng"], [aria-label^="Thêm khách Phòng"], [aria-label^="Giảm khách Phòng"], [aria-label^="Tăng khách Phòng"]').count(), 0);
      if (SHOTS) await page.locator('section[aria-label="Tiến trình chọn phòng"]').screenshot({ path: `${SHOTS}/after-results-roombar-${viewport.name}.png` });
      if (SHOTS && viewport.width >= 1024) await page.locator("aside").first().screenshot({ path: `${SHOTS}/after-results-summary-${viewport.name}.png` });

      // Removing the needed second room is refused with a reason.
      await page.locator('[aria-label="Xoá Phòng 2"]:visible').first().click();
      assert.match(await page.locator('[data-testid="results-room-notice"]').innerText(), /3 khách cần ít nhất 2 phòng/);
      assert.equal(params(page).get("rooms"), "2,1");

      await page.getByRole("button", { name: "Chỉnh sửa ngày & tìm kiếm" }).click();
      await page.getByRole("tab", { name: /Phòng & khách/ }).click();
      const editor = page.locator('[role="tabpanel"]');
      const note = page.locator('[data-testid="rooms-guests-note"]');
      await editor.getByRole("button", { name: "Thêm một người lớn" }).click();
      await page.waitForFunction(() => new URLSearchParams(location.search).get("adults") === "4");
      assert.equal(params(page).get("rooms"), "2,2", "a guest never adds a room");
      assert.equal(await editor.getByRole("button", { name: "Thêm một người lớn" }).isDisabled(), true);
      assert.equal(await note.innerText(), CAP);
      if (SHOTS) await editor.screenshot({ path: `${SHOTS}/after-results-editor-cap-${viewport.name}.png` });
      await editor.getByRole("button", { name: "Thêm một phòng" }).click();
      await page.waitForFunction(() => new URLSearchParams(location.search).get("rooms") === "2,1,1");
      assert.equal(params(page).get("adults"), "4", "a room keeps the guest total");
      await editor.getByRole("button", { name: "Bớt một người lớn" }).click();
      await page.waitForFunction(() => new URLSearchParams(location.search).get("adults") === "3");
      assert.equal(await editor.getByRole("button", { name: "Bớt một người lớn" }).isDisabled(), true, "3 rooms need 3 guests");
      assert.equal(await editor.getByRole("button", { name: "Thêm một phòng" }).isDisabled(), true);
      await page.getByRole("button", { name: "Áp dụng" }).click();

      await page.reload({ waitUntil: "networkidle" });
      assert.deepEqual([params(page).get("rooms"), params(page).get("adults")], ["1,1,1", "3"]);
      await page.goto(`${BASE}/dev/demo?intro=0`, { waitUntil: "networkidle" });
      await page.goBack({ waitUntil: "networkidle" });
      assert.deepEqual([params(page).get("rooms"), params(page).get("adults")], ["1,1,1", "3"]);
      assert.deepEqual(errors, []);
      await context.close();
    });

    test(`@${viewport.name} outdated links on the results page: kept as they are, no provider check, corrected by the guest`, async () => {
      const { page, context, errors } = await open(viewport, `${RESULTS}?property=all&${DATES}&rooms=1&adults=3`);
      const correction = page.locator('[data-testid="occupancy-correction"]');
      await correction.waitFor();
      assert.match(await correction.innerText(), /3 khách cho 1 phòng/);
      assert.deepEqual([params(page).get("rooms"), params(page).get("adults")], ["1", "3"]);
      assert.match(await page.locator('[data-testid="property-results"]').innerText(), /Điều chỉnh số phòng và số khách để kiểm tra tình trạng phòng/);
      if (SHOTS) await correction.screenshot({ path: `${SHOTS}/after-results-deeplink-over-${viewport.name}.png` });
      await correction.getByRole("button", { name: /Giữ 1 phòng, 2 khách/ }).click();
      await page.waitForFunction(() => new URLSearchParams(location.search).get("adults") === "2");
      assert.equal(params(page).get("rooms"), "1");
      assert.equal(await correction.count(), 0);
      assert.deepEqual(errors, []);
      await context.close();
    });
  }
});
