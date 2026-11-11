/**
 * VNest V3 — Real Mobile & Desktop Browser Interaction Regression Suite (Playwright Chromium + WebKit).
 *
 * Tests all 14 reported mobile interactions across 375px, 390px, 430px, 768px, and 1440px viewports,
 * asserting actual resulting UI behavior, hit-testing (elementFromPoint), scroll-lock cleanup,
 * zero horizontal overflow, and zero console/runtime errors.
 */
import assert from "node:assert/strict";
import os from "node:os";
import { after, before, describe, test } from "node:test";
import { chromium, webkit } from "/Users/noe/Documents/GitHub/Cigarettes-After-Sex/node_modules/.pnpm/playwright@1.62.1/node_modules/playwright/index.mjs";

const BASE = process.env.VNEST_TEST_URL ?? "http://localhost:3400";
// A stay 30–32 days from today in Vietnam. The fixed 6–8/11/2026 stay went into the past on 7/11/2026 and turned these
// checks into date failures ("check-in has passed"), not interaction failures (Phase D, 9/11/2026).
const dayInVietnam = (offset) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(Date.now() + offset * 86_400_000));
const STAY = `checkIn=${dayInVietnam(30)}&checkOut=${dayInVietnam(32)}`;
const LAN_IP =
  Object.values(os.networkInterfaces())
    .flatMap((entries) => entries ?? [])
    .find((entry) => entry.family === "IPv4" && !entry.internal)?.address ?? "127.0.0.1";
const LAN_BASE = `http://${LAN_IP}:${new URL(BASE).port || "3400"}`;

const VIEWPORTS = [
  { name: "375px (iPhone SE/Mini)", width: 375, height: 812, isMobile: true, hasTouch: true },
  { name: "390px (iPhone 14/15)", width: 390, height: 844, isMobile: true, hasTouch: true },
  { name: "430px (iPhone Pro Max)", width: 430, height: 932, isMobile: true, hasTouch: true },
  { name: "768px (iPad Mini / Tablet)", width: 768, height: 1024, isMobile: true, hasTouch: true },
  { name: "1440px (Desktop Regression)", width: 1440, height: 900, isMobile: false, hasTouch: false },
];

/** Helper to perform a realistic touch swipe on an element. */
async function touchSwipe(page, selector, startXRatio, endXRatio, yRatio = 0.5) {
  await page.evaluate(
    ({ sel, sxRatio, exRatio, yr }) => {
      const el = document.querySelector(sel);
      if (!el) throw new Error(`Swipe target not found: ${sel}`);
      const rect = el.getBoundingClientRect();
      const y = Math.round(rect.top + rect.height * yr);
      const startX = Math.round(rect.left + rect.width * sxRatio);
      const midX = Math.round((startX + rect.left + rect.width * exRatio) / 2);
      const endX = Math.round(rect.left + rect.width * exRatio);

      const makeTouchPoint = (x) => ({
        identifier: 1,
        target: el,
        clientX: x,
        clientY: y,
        pageX: x,
        pageY: y,
      });

      const createTouchEvt = (type, touches, changedTouches) => {
        const evt = new UIEvent(type, { bubbles: true, cancelable: true });
        Object.defineProperty(evt, "touches", { value: touches });
        Object.defineProperty(evt, "targetTouches", { value: touches });
        Object.defineProperty(evt, "changedTouches", { value: changedTouches });
        return evt;
      };

      el.dispatchEvent(createTouchEvt("touchstart", [makeTouchPoint(startX)], [makeTouchPoint(startX)]));
      el.dispatchEvent(createTouchEvt("touchmove", [makeTouchPoint(midX)], [makeTouchPoint(midX)]));
      el.dispatchEvent(createTouchEvt("touchend", [], [makeTouchPoint(endX)]));
    },
    { sel: selector, sxRatio: startXRatio, exRatio: endXRatio, yr: yRatio },
  );
}

/** Hit-test an element's center to confirm no invisible overlay intercepts the tap. */
async function assertHitTarget(page, locator, description) {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  assert.ok(box && box.width > 0 && box.height > 0, `${description} must be visible with non-zero bounding box`);
  const hit = await locator.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const topEl = document.elementFromPoint(cx, cy);
    return {
      reachesTarget: Boolean(topEl && (el === topEl || el.contains(topEl) || topEl.contains(el))),
      hitTag: topEl?.tagName ?? null,
      hitClass: topEl?.className ?? null,
    };
  });
  assert.equal(hit.reachesTarget, true, `${description} hit-test failed: hit <${hit.hitTag} class="${hit.hitClass}">`);
}

describe("VNest V3 Real Browser Interaction QA & Regression Suite", () => {
  let chromiumBrowser;
  let webkitBrowser;

  before(async () => {
    chromiumBrowser = await chromium.launch();
    webkitBrowser = await webkit.launch();
  });

  after(async () => {
    await chromiumBrowser?.close();
    await webkitBrowser?.close();
  });

  test("Full 14-point mobile interaction journey at 390px in both Chromium and WebKit", async (t) => {
    for (const [engineName, browser] of [
      ["Chromium Mobile (390x844)", chromiumBrowser],
      ["WebKit / iOS Safari Engine (390x844)", webkitBrowser],
    ]) {
      await t.test(engineName, async () => {
        const context = await browser.newContext({
          viewport: { width: 390, height: 844 },
          isMobile: true,
          hasTouch: true,
          deviceScaleFactor: 2,
        });
        const page = await context.newPage();
        const errors = [];
        page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));
        page.on("console", (msg) => {
          if (msg.type() !== "error") return;
          const locUrl = msg.location()?.url ?? "";
          // Ignore third-party Google Maps HEAD reachability probe (LocationAndPoliciesPanel.tsx)
          if (locUrl.includes("google.com/maps")) return;
          errors.push(`console.error: ${msg.text()} (${locUrl})`);
        });

        await page.goto(`${BASE}/dev/demo?intro=0`, { waitUntil: "networkidle" });

        // Verify zero horizontal overflow on homepage
        const homeOverflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        assert.ok(homeOverflow <= 0, `Homepage horizontal overflow must be <= 0, got ${homeOverflow}px`);

        // 1. Mobile Navigation Menu: open, close button, reopen, link navigation
        const menuBtn = page.locator('header nav[aria-label="Điều hướng chính"] button[aria-haspopup="dialog"]');
        await assertHitTarget(page, menuBtn, "Mobile Menu button");
        await menuBtn.tap();

        const menuDialog = page.locator('header dialog[aria-label="Menu VNest"]');
        assert.equal(await menuDialog.evaluate((d) => d.open), true, "Mobile menu dialog must open on tap");
        assert.equal(
          await page.evaluate(() => document.documentElement.style.overflow),
          "hidden",
          "Opening mobile menu must lock document scroll",
        );

        // Close via close button ("Đóng")
        const closeMenuBtn = menuDialog.locator("button", { hasText: "Đóng" });
        await closeMenuBtn.tap();
        assert.equal(await menuDialog.evaluate((d) => d.open), false, "Mobile menu must close via close button");
        assert.equal(
          await page.evaluate(() => document.documentElement.style.overflow),
          "",
          "Closing mobile menu must restore document scroll",
        );

        // Reopen and navigate via menu link (#hop-tac)
        await menuBtn.tap();
        assert.equal(await menuDialog.evaluate((d) => d.open), true);
        await menuDialog.locator('a[href="/dev/demo#hop-tac"]').tap();
        await page.waitForTimeout(350);
        assert.equal(await menuDialog.evaluate((d) => d.open), false, "Mobile menu must close after tapping a navigation link");
        assert.equal(await page.evaluate(() => document.documentElement.style.overflow), "");

        // Scroll back to top for Hero Carousel test
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
        await page.waitForTimeout(200);

        // 2. Homepage Hero Carousel: autoplay (~3s) and natural left/right touch swiping
        // Client review 6/11/2026: the hero has no dots any more, so the current slide is read from the slide groups.
        const activeSlideIndex = () =>
          page.evaluate(() => {
            const slides = [...document.querySelectorAll('section[aria-roledescription="carousel"] [aria-roledescription="slide"]')];
            return slides.findIndex((s) => s.getAttribute("aria-hidden") === "false");
          });

        const initialSlide = await activeSlideIndex();
        assert.ok(initialSlide >= 0, "Hero carousel must have a current slide");

        // Wait ~3.3s for autoplay to advance
        await page.waitForTimeout(3300);
        const afterAutoplaySlide = await activeSlideIndex();
        assert.notEqual(afterAutoplaySlide, initialSlide, "Hero carousel must auto-advance after ~3 seconds");

        // Swipe left -> next slide
        await touchSwipe(page, 'section[aria-roledescription="carousel"]', 0.8, 0.2, 0.35);
        await page.waitForTimeout(200);
        const afterSwipeLeft = await activeSlideIndex();
        assert.equal(afterSwipeLeft, (afterAutoplaySlide + 1) % 6, "Swiping left on hero must advance to next slide");

        // Swipe right -> previous slide
        await touchSwipe(page, 'section[aria-roledescription="carousel"]', 0.2, 0.8, 0.35);
        await page.waitForTimeout(200);
        const afterSwipeRight = await activeSlideIndex();
        assert.equal(afterSwipeRight, afterAutoplaySlide, "Swiping right on hero must return to previous slide");

        // 3. "3 Sợi Chỉ Nối" / Brand Collection. Phase B (owner, 7/11/2026): brand rows are buttons (aria-expanded) in the order
        // Bare → Pepper House → The Nắng, nothing selected at first; the panel's "Khám phá nơi ở" and Facebook buttons are
        // replaced by one "Visit us ↗" to the brand website. No website is confirmed yet, so it must not be a link (no href,
        // never Facebook).
        const brandRows = [
          { id: "bare", label: "Bare", name: "Bare Boutique Stays" },
          { id: "pepper-house", label: "Pepper House", name: "Pepper House" },
          { id: "the-nang", label: "The Nắng", name: "The Nắng Suites" },
        ];
        assert.equal(await page.locator('#thuong-hieu button[aria-expanded="true"]').count(), 0, "No brand is selected at first");
        for (const b of brandRows) {
          const row = page.locator(`#thuong-hieu button[aria-controls][data-brand="${b.id}"]`);
          await assertHitTarget(page, row, `Brand row '${b.label}'`);
          await row.tap();
          await page.waitForTimeout(350);
          assert.equal(await row.getAttribute("aria-expanded"), "true", `Tapping '${b.label}' must select it`);
          const brandPanel = page.locator(`[id="${await row.getAttribute("aria-controls")}"]`);
          assert.ok(await brandPanel.isVisible(), `${b.label} panel must be visible`);
          assert.equal(await brandPanel.getByRole("heading", { name: b.name }).count(), 1, `${b.label} panel must be named after the brand`);
          const visit = brandPanel.locator("[data-brand-website]");
          assert.equal(await visit.count(), 1, `${b.label} panel has one 'Visit us' CTA`);
          assert.match((await visit.textContent()) ?? "", /Visit us/);
          if ((await visit.getAttribute("href")) === null) assert.equal(await visit.getAttribute("aria-disabled"), "true", `${b.label}: no confirmed website, the CTA is not a link`);
          else assert.doesNotMatch((await visit.getAttribute("href")) ?? "", /facebook\.com/);
          assert.equal(await brandPanel.locator('a[href*="facebook.com"]').count(), 0, `${b.label}: no Facebook button`);
        }

        // Phase C (owner, 7/11/2026): the brand section's "Xem tất cả nơi ở" link is gone; Discovery is checked by touch
        // instead. Brand chips "Tất cả" → brands in order; city toggles show availability without selecting; tapping the
        // active city clears it; a city the brand is not in explains instead of emptying the list.
        await page.locator("#kham-pha").evaluate((el) => el.scrollIntoView({ block: "start" }));
        const brandChips = page.locator("#kham-pha [data-filter=brand] label");
        assert.deepEqual(await brandChips.allInnerTexts(), ["Tất cả", "Bare Boutique Stays", "Pepper House", "The Nắng Suites"]);
        const cards = page.locator("#kham-pha [data-property-id]");
        assert.equal(await cards.count(), 6, "All six stays at first");
        const hcm = page.locator('#kham-pha button[data-city="ho-chi-minh"]');
        const dn = page.locator('#kham-pha button[data-city="da-nang"]');
        assert.deepEqual([await hcm.getAttribute("aria-pressed"), await dn.getAttribute("aria-pressed")], ["false", "false"], "No city selected at first");
        const pepperChip = brandChips.filter({ hasText: "Pepper House" });
        await assertHitTarget(page, pepperChip, "Brand filter 'Pepper House'");
        await pepperChip.tap();
        await page.waitForTimeout(300);
        assert.equal(await cards.count(), 1);
        assert.deepEqual([await hcm.getAttribute("data-state"), await dn.getAttribute("data-state")], ["only", "unavailable"], "Pepper House: TP. Hồ Chí Minh marked, not selected");
        // The chip is aria-disabled (it cannot filter) but still answers a tap with an explanation; Playwright skips
        // aria-disabled targets unless forced.
        await dn.tap({ force: true });
        assert.equal(await cards.count(), 1, "An unavailable city never empties the list");
        assert.match((await page.locator("#kham-pha-result").textContent()) ?? "", /Pepper House chưa có nơi ở tại Đà Nẵng/);
        await hcm.tap();
        assert.equal(await hcm.getAttribute("aria-pressed"), "true");
        await hcm.tap();
        assert.equal(await hcm.getAttribute("aria-pressed"), "false", "Tapping the active city clears it");
        await brandChips.filter({ hasText: "Tất cả" }).tap();
        await page.waitForTimeout(300);
        assert.equal(await cards.count(), 6);

        // 4. Partner With VNest (OwnerJourney): expand/collapse service cards, consultation CTA, contact form validation
        const modelCard = page.locator('button[data-service="tu-van-mo-hinh"]');
        await assertHitTarget(page, modelCard, "Partnership card 'Phát triển dự án'");
        await modelCard.tap();
        assert.equal(await modelCard.getAttribute("aria-expanded"), "true", "Tapping service card must expand it");

        // Tap again to collapse, then tap again to expand
        await modelCard.tap();
        assert.equal(await modelCard.getAttribute("aria-expanded"), "false", "Tapping expanded service card must collapse it");
        await modelCard.tap();
        assert.equal(await modelCard.getAttribute("aria-expanded"), "true");

        // The CTA is a link since the Visual Accordion replaced the cards (client decision, 9/11/2026).
        const consultCta = page.locator("#hop-tac a", { hasText: "Tư vấn về mô hình lưu trú" });
        await assertHitTarget(page, consultCta, "Consultation CTA");
        await consultCta.tap();
        await page.waitForTimeout(450);

        // Submit empty form -> invalid feedback. The form is its own section `#tu-van` since the owner's review of
        // 7/11/2026 (it was inside `#lien-he`); the assertions are unchanged.
        const submitContactBtn = page.locator('#tu-van button[type="submit"]');
        await assertHitTarget(page, submitContactBtn, "Contact form submit button");
        await submitContactBtn.tap();
        assert.match(
          (await page.locator('#tu-van [role="status"]').textContent()) ?? "",
          /Vui lòng kiểm tra các ô được đánh dấu/,
          "Empty contact form submission must show validation error status",
        );

        // Fill valid name and phone -> honest un-connected demo feedback
        await page.locator('#tu-van input[name="name"]').fill("Nguyễn Văn A");
        await page.locator('#tu-van input[name="reach"]').fill("0901 234 567");
        await submitContactBtn.tap();
        assert.match(
          (await page.locator('#tu-van [role="status"]').textContent()) ?? "",
          /Chưa gửi\. Thông tin hợp lệ, nhưng biểu mẫu chưa được kết nối/,
          "Valid contact form submission must show honest un-connected demo notice",
        );

        // 5. Book Now / Booking CTA, Date Picker, Guest Selector -> Booking Results navigation
        // Scroll back to top and tap the hero mobile booking pill
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
        await page.waitForTimeout(200);
        const heroBookingPill = page.locator('#dat-phong button[aria-haspopup="dialog"]:visible').first();
        await assertHitTarget(page, heroBookingPill, "Hero Mobile Booking Pill");
        await heroBookingPill.tap();
        await page.waitForTimeout(250);

        const mobileSearchDialog = page.locator("dialog.vn-sheet[open]");
        assert.equal(await mobileSearchDialog.count(), 1, "Mobile booking search dialog must open");

        // Expand property picker and choose Bare Chic
        await mobileSearchDialog.locator('button[data-section="property"]').tap();
        await mobileSearchDialog.locator("fieldset label", { hasText: "Bare Chic" }).tap();

        // Pick check-in and check-out dates from calendar grid
        const enabledDayBtns = mobileSearchDialog.locator("button[data-date]:not(:disabled)");
        const dayCount = await enabledDayBtns.count();
        assert.ok(dayCount >= 15, "Calendar must render selectable future dates");
        await enabledDayBtns.nth(5).tap();
        await enabledDayBtns.nth(8).tap();

        // Picking both dates automatically opens the Guests section -> increment the adults (+ button).
        // Phase D (9/11/2026): the homepage section has adults and children only; rooms are chosen at room selection.
        const plusGuestBtn = mobileSearchDialog.getByRole("button", { name: "Thêm một người lớn" });
        await plusGuestBtn.tap();
        assert.equal(
          (await mobileSearchDialog.locator('div[role="group"] output[aria-label$="người lớn"]').textContent())?.trim(),
          "3",
          "Guest selector must increment to 3 adults",
        );

        // Submit mobile booking search
        const submitSearchBtn = mobileSearchDialog.locator('button[type="submit"]');
        await submitSearchBtn.tap();
        await page.waitForURL(/\/dev\/demo\/tim-phong/, { timeout: 10000 });
        await page.waitForLoadState("networkidle");

        // CRITICAL REGRESSION CHECK: document scroll lock must be cleared after navigating to /dev/demo/tim-phong!
        assert.equal(
          await page.evaluate(() => document.documentElement.style.overflow),
          "",
          "Document scroll lock must be cleared after submitting MobileBookingSearch and navigating",
        );

        // Tapping header BOOKING on /dev/demo/tim-phong when search editor is collapsed must open the editor
        const editSearchBtn = page.locator('button[data-field="property checkIn checkOut guests"]');
        if ((await editSearchBtn.count()) > 0) {
          const headerBookLink = page.locator('header a[href*="#dat-phong"]');
          await headerBookLink.tap();
          await page.waitForTimeout(250);
          assert.equal(
            await page.locator('form[aria-label="Chỉnh sửa tìm kiếm"]').count(),
            1,
            "Tapping header BOOKING on /dev/demo/tim-phong must open the search editor",
          );
        }

        // 6. Navigate to Property Detail Page (/dev/stays/bare-chic?view=demo) and test all property interactions
        await page.goto(`${BASE}/dev/stays/bare-chic?view=demo&${STAY}`, {
          waitUntil: "networkidle",
        });

        const propOverflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        assert.ok(propOverflow <= 0, `Property page horizontal overflow must be <= 0, got ${propOverflow}px`);

        // 6a. "Xem tất cả ảnh" Lightbox: open grid, open photo 1, swipe left/right, close
        const viewAllPhotosBtn = page.locator("button", { hasText: /Xem tất cả \d+ ảnh/ });
        await assertHitTarget(page, viewAllPhotosBtn, "'Xem tất cả ảnh' button");
        await viewAllPhotosBtn.tap();

        const lightboxDialog = page.locator("dialog[open]").first();
        assert.equal(await lightboxDialog.count(), 1, "Lightbox dialog must open on tapping 'Xem tất cả ảnh'");
        assert.equal(await page.evaluate(() => document.documentElement.style.overflow), "hidden");

        // Open first photo from grid
        const firstThumb = lightboxDialog.locator("section ul li button").first();
        await firstThumb.tap();
        await page.waitForTimeout(150);

        const captionBefore = await lightboxDialog.locator('[aria-live="polite"]').textContent();
        assert.match(captionBefore ?? "", /1\/\d+$/);

        // Swipe left inside Lightbox figure -> image 2
        await touchSwipe(page, "dialog[open] figure", 0.8, 0.2, 0.5);
        await page.waitForTimeout(200);
        const captionAfterSwipeLeft = await lightboxDialog.locator('[aria-live="polite"]').textContent();
        assert.match(captionAfterSwipeLeft ?? "", /2\/\d+$/, "Lightbox swipe left must advance to photo 2");

        // Swipe right inside Lightbox figure -> image 1
        await touchSwipe(page, "dialog[open] figure", 0.2, 0.8, 0.5);
        await page.waitForTimeout(200);
        const captionAfterSwipeRight = await lightboxDialog.locator('[aria-live="polite"]').textContent();
        assert.match(captionAfterSwipeRight ?? "", /1\/\d+$/, "Lightbox swipe right must return to photo 1");

        // Close Lightbox
        await lightboxDialog.locator('button[aria-label="Đóng"]').tap();
        assert.equal(await page.locator("dialog[open]").count(), 0, "Lightbox must close cleanly");
        assert.equal(await page.evaluate(() => document.documentElement.style.overflow), "");

        // 6b. Room Card Carousel: inline swipe left/right without accidentally opening Lightbox
        const firstRoomCard = page.locator("#rooms li[data-room-id]").first();
        await firstRoomCard.scrollIntoViewIfNeeded();
        const roomCarousel = firstRoomCard.locator('[data-room-carousel="Bare Chic One"]');
        assert.equal(await roomCarousel.getAttribute("data-photo-index"), "0");

        await touchSwipe(page, '[data-room-carousel="Bare Chic One"]', 0.8, 0.2, 0.5);
        await page.waitForTimeout(200);
        assert.equal(await roomCarousel.getAttribute("data-photo-index"), "1", "Swiping room card carousel must advance to photo index 1");
        assert.equal(await page.locator("dialog[open]").count(), 0, "Swiping room card carousel must not accidentally open Lightbox");

        // 6c. "Xem chi tiết phòng" Room Drawer: open, close
        const roomDetailBtn = firstRoomCard.locator("button", { hasText: "Xem chi tiết phòng" });
        await assertHitTarget(page, roomDetailBtn, "'Xem chi tiết phòng' button");
        await roomDetailBtn.tap();

        const roomDrawer = page.locator("dialog[open]").first();
        assert.equal(await roomDrawer.count(), 1, "Room detail drawer must open");
        assert.match((await roomDrawer.textContent()) ?? "", /Bare Chic One/);
        assert.equal(await page.evaluate(() => document.documentElement.style.overflow), "hidden");

        await roomDrawer.locator("button", { hasText: "Đóng" }).tap();
        assert.equal(await page.locator("dialog[open]").count(), 0, "Room detail drawer must close");
        assert.equal(await page.evaluate(() => document.documentElement.style.overflow), "");

        // 6d-i. Hybrid booking (Bare Chic books on the provider's page): no first-party room selection, one hand-off action.
        assert.equal(await firstRoomCard.locator("button", { hasText: /Chọn phòng/ }).count(), 0, "ezCloud property must not offer first-party room selection");
        assert.equal(await page.locator('[data-testid="property-handoff-cta"]').count(), 1, "ezCloud property must offer the hand-off action");

        // 6d-ii. Slot-based selection is preserved on a GoHost property (Bare Đa Kao): the rest of this journey continues there.
        await page.goto(`${BASE}/dev/stays/bare-da-kao?view=demo&${STAY}`, { waitUntil: "networkidle" });
        const goHostRoomCard = page.locator("#rooms li[data-room-id]").first();
        await goHostRoomCard.scrollIntoViewIfNeeded();

        // 6d. "Chọn phòng" action: updates card & button state visibly and preserves multi-room slot selection
        const selectRoomBtn = goHostRoomCard.locator("button", { hasText: /Chọn phòng/ });
        await assertHitTarget(page, selectRoomBtn, "'Chọn phòng' button");
        await selectRoomBtn.tap();

        assert.equal(
          await goHostRoomCard.getAttribute("data-selected"),
          "true",
          "Selecting room must set data-selected='true' on the room card",
        );
        // Switch active slot back to Slot 1 to verify button shows "Đã chọn phòng" and aria-pressed="true"
        const slot1Pill = page.locator("#rooms button", { hasText: /Phòng 1/ }).first();
        if ((await slot1Pill.count()) > 0) {
          await slot1Pill.tap();
          const updatedBtn = goHostRoomCard.locator('button[aria-pressed="true"]');
          assert.equal(await updatedBtn.count(), 1, "Selected room in active slot must have aria-pressed='true'");
          assert.match((await updatedBtn.textContent()) ?? "", /Đã chọn phòng/);
        }

        // 6e. Booking Policies ("Xem chính sách đặt phòng"): open modal, verify approved content, close
        const policyBtn = page.locator("button", { hasText: "Xem chính sách đặt phòng" });
        await assertHitTarget(page, policyBtn, "'Xem chính sách đặt phòng' button");
        await policyBtn.tap();

        const policyDialog = page.locator("dialog[open]", { hasText: "Chính sách đặt phòng" });
        assert.equal(await policyDialog.count(), 1, "Policy dialog must open on tap");
        assert.equal(await page.evaluate(() => document.documentElement.style.overflow), "hidden");

        await policyDialog.locator('[data-testid="close-policy-dialog"]').tap();
        assert.equal(await policyDialog.count(), 0, "Policy dialog must close via 'Đóng' button");
        assert.equal(await page.evaluate(() => document.documentElement.style.overflow), "");

        // 6f. Food & Exploration (CityNotes): switch category tabs and expand/collapse full place list
        const cityNotes = page.locator("#so-tay-thanh-pho");
        await cityNotes.scrollIntoViewIfNeeded();
        const exploreTab = cityNotes.locator('[role="tab"]', { hasText: "Khám phá" });
        await assertHitTarget(page, exploreTab, "CityNotes 'Khám phá' tab");
        await exploreTab.tap();
        assert.equal(await exploreTab.getAttribute("aria-selected"), "true");

        const morePlacesBtn = cityNotes.locator("button", { hasText: /Xem tất cả/ });
        await assertHitTarget(page, morePlacesBtn, "CityNotes 'Xem tất cả' button");
        await morePlacesBtn.tap();
        assert.equal(await cityNotes.getAttribute("data-open"), "true", "CityNotes must expand on tap");

        const collapsePlacesBtn = cityNotes.locator("button", { hasText: "Thu gọn" });
        await collapsePlacesBtn.tap();
        assert.equal(await cityNotes.getAttribute("data-open"), "false", "CityNotes must collapse on tap");

        assert.deepEqual(errors, [], `Expected zero console/runtime errors in ${engineName}`);
        await context.close();
      });
    }
  });

  test("Multi-viewport responsive & interaction matrix across 375px, 390px, 430px, 768px, and 1440px", async (t) => {
    for (const vp of VIEWPORTS) {
      await t.test(`Viewport ${vp.name}`, async () => {
        const context = await chromiumBrowser.newContext({
          viewport: { width: vp.width, height: vp.height },
          isMobile: vp.isMobile,
          hasTouch: vp.hasTouch,
        });
        const page = await context.newPage();
        const errors = [];
        page.on("pageerror", (err) => errors.push(err.message));

        await page.goto(`${BASE}/dev/demo?intro=0`, { waitUntil: "networkidle" });
        const homeOverflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        assert.ok(homeOverflow <= 0, `Homepage overflow at ${vp.width}px: ${homeOverflow}px`);

        // Menu button opens and closes cleanly on every viewport (375px through 1440px)
        const menuBtn = page.locator('header nav[aria-label="Điều hướng chính"] button[aria-haspopup="dialog"]');
        await menuBtn.click();
        const menuDialog = page.locator('header dialog[aria-label="Menu VNest"]');
        assert.equal(await menuDialog.evaluate((d) => d.open), true);
        await menuDialog.locator("button", { hasText: "Đóng" }).click();
        assert.equal(await menuDialog.evaluate((d) => d.open), false);

        // Check property page at this viewport
        await page.goto(`${BASE}/dev/stays/bare-chic?view=demo`, { waitUntil: "networkidle" });
        const propOverflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        assert.ok(propOverflow <= 0, `Property page overflow at ${vp.width}px: ${propOverflow}px`);

        assert.deepEqual(errors, []);
        await context.close();
      });
    }
  });

  test("All 6 property pages render with zero errors and preserve approved room ordering & names", async () => {
    const expectedOrders = {
      "bare-chic": ["Bare Chic One", "Bare Chic Two", "Bare Chic Three", "Bare Indochine"],
      "bare-hyphen": ["Bare Hyphen One", "Bare Hyphen Two", "Bare Hyphen Three", "Bare Hyphen Four"],
      "bare-da-kao": ["Bare Đa Kao One", "Bare Đa Kao Two", "Bare Đa Kao Three", "Bare Đa Kao Four"],
      "bare-han": ["Bare Hàn Ground", "Bare Hàn One", "Bare Hàn Two", "Bare Hàn Three"],
      "the-nang-suites": ["Yellow Submarine", "Pale Blue Eyes", "Green River", "Blue Moon"],
      "pepper-house": ["Pepper House 3rd-floor", "Pepper House 4th-floor"],
    };

    const context = await chromiumBrowser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (err) => errors.push(err.message));

    for (const [slug, expectedRooms] of Object.entries(expectedOrders)) {
      await page.goto(`${BASE}/dev/stays/${slug}?view=demo`, { waitUntil: "networkidle" });
      const roomHeadings = await page.evaluate(() =>
        [...document.querySelectorAll("#rooms li[data-room-id]")].map((li) => li.querySelector("h3")?.textContent?.trim() ?? ""),
      );
      assert.deepEqual(
        roomHeadings,
        expectedRooms,
        `Property ${slug} must render rooms in exact approved order`,
      );
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      assert.ok(overflow <= 0, `Property ${slug} overflow at 390px: ${overflow}px`);
    }

    assert.deepEqual(errors, []);
    await context.close();
  });

  test("LAN IP Hydration, Hard Refresh & Contact Form Anti-Fallback on exact LAN origin", async (t) => {
    for (const [engineName, browser] of [
      [`Chromium Mobile LAN (${LAN_BASE})`, chromiumBrowser],
      [`WebKit / iOS Safari LAN (${LAN_BASE})`, webkitBrowser],
    ]) {
      await t.test(engineName, async () => {
        const context = await browser.newContext({
          viewport: { width: 390, height: 844 },
          isMobile: true,
          hasTouch: true,
        });
        const page = await context.newPage();
        const errors = [];
        page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));

        // 1. Fresh page load via exact Mac LAN IP
        await page.goto(`${LAN_BASE}/dev/demo?intro=0`, { waitUntil: "networkidle" });
        const menuBtn = page.locator('header nav[aria-label="Điều hướng chính"] button[aria-haspopup="dialog"]');
        const menuDialog = page.locator('header dialog[aria-label="Menu VNest"]');

        await menuBtn.tap();
        assert.equal(await menuDialog.evaluate((d) => d.open), true, "Menu must open on fresh LAN IP load");
        await menuDialog.locator("button", { hasText: "Đóng" }).tap();
        assert.equal(await menuDialog.evaluate((d) => d.open), false, "Menu must close on fresh LAN IP load");

        // 2. Hard refresh (page.reload) on LAN IP
        await page.reload({ waitUntil: "networkidle" });

        // Confirm React interactions work after hard refresh
        await menuBtn.tap();
        assert.equal(await menuDialog.evaluate((d) => d.open), true, "Menu must open after hard refresh on LAN IP");
        await menuDialog.locator("button", { hasText: "Đóng" }).tap();
        assert.equal(await menuDialog.evaluate((d) => d.open), false);

        // 3. Contact Form anti-fallback & honest validation on LAN IP (form section `#tu-van`, see above)
        const submitContactBtn = page.locator('#tu-van button[type="submit"]');
        await submitContactBtn.scrollIntoViewIfNeeded();
        await submitContactBtn.tap();

        // URL must NOT fall back to native GET query params (?service=...&name=&reach=...)
        const urlAfterInvalid = page.url();
        assert.ok(
          !urlAfterInvalid.includes("name=") && !urlAfterInvalid.includes("reach="),
          `Contact form must not trigger native GET fallback on LAN IP, got URL: ${urlAfterInvalid}`,
        );
        assert.match(
          (await page.locator('#tu-van [role="status"]').textContent()) ?? "",
          /Vui lòng kiểm tra các ô được đánh dấu/,
          "Client-side validation must run after hard refresh on LAN IP",
        );

        await page.locator('#tu-van input[name="name"]').fill("Trần Thị B");
        await page.locator('#tu-van input[name="reach"]').fill("tran.b@example.com");
        await submitContactBtn.tap();

        const urlAfterValid = page.url();
        assert.ok(
          !urlAfterValid.includes("name=") && !urlAfterValid.includes("reach="),
          `Valid contact submission must not trigger native GET fallback, got URL: ${urlAfterValid}`,
        );
        const statusText = (await page.locator('#tu-van [role="status"]').textContent()) ?? "";
        assert.match(
          statusText,
          /Chưa gửi\. Thông tin hợp lệ, nhưng biểu mẫu chưa được kết nối/,
          "Contact form must show honest un-connected demo notice and never fake a successful submission",
        );

        assert.deepEqual(errors, []);
        await context.close();
      });
    }
  });

  test("Scroll-Lock Integrity: overlapping modal lifecycles, rapid open/close, route navigation & browser Back navigation", async (t) => {
    for (const [engineName, browser] of [
      ["Chromium Mobile Scroll-Lock Stress (390x844)", chromiumBrowser],
      ["WebKit / iOS Safari Scroll-Lock Stress (390x844)", webkitBrowser],
    ]) {
      await t.test(engineName, async () => {
        const context = await browser.newContext({
          viewport: { width: 390, height: 844 },
          isMobile: true,
          hasTouch: true,
        });
        const page = await context.newPage();
        const errors = [];
        page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));

        const getOverflow = () => page.evaluate(() => document.documentElement.style.overflow);
        const getOpenDialogCount = () => page.locator("dialog[open]").count();

        // 1. Rapid modal open/close on homepage (Menu + MobileBookingSearch)
        await page.goto(`${LAN_BASE}/dev/demo?intro=0`, { waitUntil: "networkidle" });
        const menuBtn = page.locator('header nav[aria-label="Điều hướng chính"] button[aria-haspopup="dialog"]');
        const menuDialog = page.locator('header dialog[aria-label="Menu VNest"]');

        for (let i = 0; i < 4; i++) {
          await menuBtn.tap();
          assert.equal(await getOverflow(), "hidden");
          await menuDialog.locator("button", { hasText: "Đóng" }).tap();
          assert.equal(await getOverflow(), "");
        }

        const heroBookingPill = page.locator('#dat-phong button[aria-haspopup="dialog"]:visible').first();
        for (let i = 0; i < 3; i++) {
          await heroBookingPill.tap();
          assert.equal(await getOverflow(), "hidden");
          await page.locator('dialog.vn-sheet[open] header button').first().tap();
          assert.equal(await getOverflow(), "");
        }

        // 2. Overlapping Modal Lifecycle A (No dates chosen): RoomDrawer -> BOOK NOW -> MobileBookingSearch
        await page.goto(`${LAN_BASE}/dev/stays/bare-chic?view=demo`, { waitUntil: "networkidle" });
        assert.equal(await getOverflow(), "");

        const firstRoomCard = page.locator("#rooms li[data-room-id]").first();
        await firstRoomCard.scrollIntoViewIfNeeded();
        await firstRoomCard.locator("button", { hasText: "Xem chi tiết phòng" }).tap();
        assert.equal(await getOverflow(), "hidden", "Opening RoomDrawer must lock scroll");

        // Tap BOOK NOW inside RoomDrawer when no dates are chosen -> closes RoomDrawer and opens MobileBookingSearch
        await page.locator("dialog[open] button", { hasText: /BOOK NOW|Kiểm tra giá & đặt phòng/ }).tap();
        await page.waitForTimeout(250);
        assert.equal(
          await page.locator("dialog.vn-sheet[open]").count(),
          1,
          "Tapping BOOK NOW in RoomDrawer without dates must open MobileBookingSearch",
        );
        assert.equal(
          await getOverflow(),
          "hidden",
          "Scroll lock must stay 'hidden' when RoomDrawer hands over to MobileBookingSearch",
        );

        // Close MobileBookingSearch -> scroll lock must now release
        await page.locator("dialog.vn-sheet[open] header button").first().tap();
        assert.equal(await getOpenDialogCount(), 0);
        assert.equal(await getOverflow(), "", "Scroll lock must clear after closing MobileBookingSearch");

        // 3. Overlapping Modal Lifecycle B (No dates chosen): Lightbox -> BOOK NOW -> MobileBookingSearch
        const viewAllPhotosBtn = page.locator("button", { hasText: /Xem tất cả \d+ ảnh/ });
        await viewAllPhotosBtn.scrollIntoViewIfNeeded();
        await viewAllPhotosBtn.tap();
        assert.equal(await getOverflow(), "hidden", "Opening Lightbox must lock scroll");

        await page.locator("dialog[open] button", { hasText: /BOOK NOW|Kiểm tra giá & đặt phòng/ }).tap();
        await page.waitForTimeout(250);
        assert.equal(await page.locator("dialog.vn-sheet[open]").count(), 1);
        assert.equal(
          await getOverflow(),
          "hidden",
          "Scroll lock must stay 'hidden' when Lightbox hands over to MobileBookingSearch",
        );
        await page.locator("dialog.vn-sheet[open] header button").first().tap();
        assert.equal(await getOverflow(), "");

        // 4a. (Dates chosen, ezCloud property): RoomDrawer -> hand-off action -> results hand-off state, scroll lock cleared
        await page.goto(`${LAN_BASE}/dev/stays/bare-chic?view=demo&${STAY}`, {
          waitUntil: "networkidle",
        });
        await firstRoomCard.scrollIntoViewIfNeeded();
        await firstRoomCard.locator("button", { hasText: "Xem chi tiết phòng" }).tap();
        assert.equal(await getOverflow(), "hidden");
        await page.locator("dialog[open] button", { hasText: "Kiểm tra giá & đặt phòng" }).tap();
        await page.waitForURL(/\/dev\/demo\/tim-phong\?property=bare-chic/, { timeout: 10000 });
        await page.waitForSelector('[data-testid="handoff-panel"]');
        assert.equal(await getOpenDialogCount(), 0, "No dialog may remain open after the hand-off");
        assert.equal(await getOverflow(), "", "Scroll lock must clear after the hand-off");

        // 4. Overlapping Modal Lifecycle C (Dates chosen, GoHost property): RoomDrawer -> BOOK NOW -> Booking Review Dialog
        await page.goto(`${LAN_BASE}/dev/stays/bare-da-kao?view=demo&${STAY}`, {
          waitUntil: "networkidle",
        });
        await firstRoomCard.scrollIntoViewIfNeeded();
        await firstRoomCard.locator("button", { hasText: "Xem chi tiết phòng" }).tap();
        assert.equal(await getOverflow(), "hidden");

        await page.locator("dialog[open] button", { hasText: "BOOK NOW" }).tap();
        await page.waitForTimeout(250);
        const reviewDialog = page.locator('dialog[data-testid="property-booking-dialog"][open]');
        assert.equal(await reviewDialog.count(), 1, "Booking Review dialog must open when dates are chosen");
        assert.equal(
          await getOverflow(),
          "hidden",
          "Scroll lock must stay 'hidden' when RoomDrawer hands over to Booking Review dialog",
        );
        await reviewDialog.locator('[data-testid="close-property-booking-dialog"]').tap();
        assert.equal(await getOverflow(), "", "Scroll lock must clear after closing Booking Review dialog");

        // 5. Booking Policies rapid open/close + Route navigation from open Booking Review dialog ("Tiếp tục") + browser Back navigation (page.goBack)
        const policyBtn = page.locator('[data-testid="open-policy-dialog"]');
        await policyBtn.scrollIntoViewIfNeeded();
        for (let i = 0; i < 3; i++) {
          await policyBtn.tap();
          assert.equal(await getOverflow(), "hidden");
          await page.locator('[data-testid="close-policy-dialog"]').tap();
          assert.equal(await getOverflow(), "");
        }

        await page.locator('[data-testid="summary-bar-book-now"]').tap();
        assert.equal(await getOverflow(), "hidden");
        const continueLink = page.locator('[data-testid="continue-property-booking-request"]');
        await continueLink.tap();
        await page.waitForURL(/\/dev\/demo\/dat-phong/, { timeout: 10000 });
        await page.waitForLoadState("networkidle");
        assert.equal(await getOverflow(), "", "Scroll lock must be cleared after navigating to /dev/demo/dat-phong");

        // Browser Back navigation back to property detail page
        await page.goBack({ waitUntil: "networkidle" });
        await page.waitForTimeout(200);
        assert.equal(await getOpenDialogCount(), 0, "No dialog may remain open after browser Back navigation");
        assert.equal(await getOverflow(), "", "Page must not remain scroll-locked after browser Back navigation");

        assert.deepEqual(errors, []);
        await context.close();
      });
    }
  });
});
