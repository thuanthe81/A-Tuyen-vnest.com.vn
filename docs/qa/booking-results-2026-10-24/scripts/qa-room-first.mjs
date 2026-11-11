// VNest V3 — Room-First Booking Results & Frictionless Multi-Room Selection QA (Scenarios 1–10)
// Tests 1440px desktop, 768px tablet, and 390px mobile against `next start`.
import { mkdirSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const ROOT = "/Users/noe/Documents/GitHub/VNest 2";
const { launch, quit, Page, sleep } = await import(
  pathToFileURL(`${ROOT}/docs/qa/brand-collection/scripts/lib.mjs`).href
);
const BASE = process.env.BASE ?? "http://localhost:3400";
const OUT = `${ROOT}/docs/qa/booking-results-2026-10-24/room-first`;
mkdirSync(OUT, { recursive: true });

const VIEWS = [
  { name: "1440", w: 1440, h: 920, dpr: 1, mobile: false },
  { name: "768", w: 768, h: 1024, dpr: 1, mobile: true },
  { name: "390", w: 390, h: 844, dpr: 2, mobile: true },
];

const CLS = `window.__shifts=[];new PerformanceObserver(l=>{for(const e of l.getEntries())window.__shifts.push({v:e.value,i:e.hadRecentInput})}).observe({type:"layout-shift",buffered:true});`;

console.log(await launch());
const results = { base: BASE, date: "2026-10-24", views: [], consoleErrors: [] };

try {
  for (const view of VIEWS) {
    const r = { view: view.name, checks: {} };
    const ok = (name, value, detail) =>
      (r.checks[name] = detail === undefined ? value : { pass: value, ...detail });

    const p = await Page.open();
    p.on("Runtime.exceptionThrown", (e) =>
      results.consoleErrors.push({
        view: view.name,
        text: e.exceptionDetails?.exception?.description?.slice(0, 200),
      }),
    );
    p.on("Runtime.consoleAPICalled", (e) =>
      e.type === "error" &&
      results.consoleErrors.push({
        view: view.name,
        text: e.args?.map((a) => a.value ?? a.description).join(" ").slice(0, 200),
      }),
    );
    await p.viewport(view.w, view.h, view.dpr, view.mobile);
    await p.send("Page.addScriptToEvaluateOnNewDocument", { source: CLS });

    // -------------------------------------------------------------------------
    // SCENARIO 1: All Properties + valid dates + 2 guests -> room catalog appears DIRECTLY
    // (No mandatory property-card step, no "Xem phòng" gate)
    // -------------------------------------------------------------------------
    await p.goto(
      `${BASE}/dev/demo/tim-phong?property=all&checkIn=2026-11-06&checkOut=2026-11-08&rooms=1&adults=2`,
      { settle: 1800 },
    );
    await p.eval(`window.scrollTo(0, 0)`);
    await sleep(250);

    const s1 = await p.eval(`(() => {
      const h1 = document.querySelector("h1")?.textContent?.trim() ?? "";
      const summary = document.querySelector("[data-testid='search-summary']")?.textContent?.trim() ?? "";
      const roomCards = [...document.querySelectorAll("li[id^='phong-']")];
      const xemPhongButtons = [...document.querySelectorAll("button")].filter(
        (b) => b.textContent.trim() === "Xem phòng"
      );
      const chooseRoomButtons = roomCards.filter((card) =>
        [...card.querySelectorAll("button")].some(
          (b) => !b.closest("dialog") && b.textContent.includes("Chọn phòng này")
        )
      );
      const firstCardRect = roomCards[0]?.getBoundingClientRect();
      const firstCardVisibleInViewport = firstCardRect ? firstCardRect.top < window.innerHeight - 60 : false;
      const firstCardKicker = roomCards[0]?.querySelector("p")?.textContent?.trim() ?? "";
      const overflow = document.documentElement.scrollWidth > window.innerWidth + 1;
      const imgs = [...document.images];
      const brokenImgs = imgs.filter((i) => i.complete && i.naturalWidth === 0 && i.getClientRects().length).length;
      const bodyText = document.body.innerText;
      const hasFakeVndPrice = /\\d+[.,]\\d{3}\\s*(?:₫|VND|VNĐ)/i.test(bodyText);
      return {
        h1,
        summary,
        roomCardCount: roomCards.length,
        xemPhongButtonsCount: xemPhongButtons.length,
        chooseRoomButtonsCount: chooseRoomButtons.length,
        firstCardVisibleInViewport,
        firstCardKicker,
        overflow,
        brokenImgs,
        hasFakeVndPrice,
      };
    })()`);

    ok(
      "Scenario 1 (All Properties room-first): all 22 rooms shown directly without mandatory property-card step, first card visible in viewport",
      s1.roomCardCount === 22 && s1.xemPhongButtonsCount === 0 && s1.chooseRoomButtonsCount === 22 && s1.firstCardVisibleInViewport,
      s1,
    );
    ok(
      "Scenario 1: room cards display property name and city as compact metadata",
      s1.firstCardKicker.includes("Bare Chic") && (s1.firstCardKicker.includes("TP.HCM") || s1.firstCardKicker.includes("TP. Hồ Chí Minh")),
      { firstCardKicker: s1.firstCardKicker },
    );
    ok("Scenario 10: no fake availability or pricing displayed", s1.hasFakeVndPrice === false, {
      hasFakeVndPrice: s1.hasFakeVndPrice,
    });
    ok("Scenario 1: zero horizontal overflow and zero broken images", !s1.overflow && s1.brokenImgs === 0, {
      overflow: s1.overflow,
      brokenImgs: s1.brokenImgs,
    });

    await p.shot(`${OUT}/${view.name}-all-properties-room-first.png`);

    // Verify inline city filter works without navigating away:
    await p.eval(`(() => {
      const dnBtn = [...document.querySelectorAll("button")].find(
        (b) => b.textContent.trim() === "Đà Nẵng"
      );
      dnBtn?.click();
    })()`);
    await sleep(250);
    const dnRoomCount = await p.eval(`document.querySelectorAll("li[id^='phong-']").length`);
    ok("Scenario 1: inline city filter ('Đà Nẵng') filters to 8 rooms without navigating away", dnRoomCount === 8, {
      dnRoomCount,
    });

    // -------------------------------------------------------------------------
    // SCENARIO 2, 3, 4, 6:
    // - Scenario 2: Bare Chic + dates -> Bare Chic room options appear immediately (4 rooms)
    // - Scenario 3: Select one room -> obvious "+ Thêm phòng" action appears
    // - Scenario 4: Add a second room directly WITHOUT reopening search filters
    // - Scenario 6: Prevent duplicate booking of one unique physical room (Bare Chic One)
    // -------------------------------------------------------------------------
    await p.goto(
      `${BASE}/dev/demo/tim-phong?property=bare-chic&checkIn=2026-11-06&checkOut=2026-11-08&rooms=1&adults=2`,
      { settle: 1600 },
    );
    await p.eval(`window.scrollTo(0, 0)`);
    await sleep(250);

    const s2Count = await p.eval(`document.querySelectorAll("li[id^='phong-']").length`);
    ok("Scenario 2: Bare Chic room options appear immediately (4 rooms)", s2Count === 4, { s2Count });

    // Select Bare Chic One for Room 1:
    await p.eval(`(() => {
      const card = document.querySelector("#phong-bare-chic-one");
      const btn = [...card.querySelectorAll("button")].find(
        (b) => !b.closest("dialog") && b.textContent.includes("Chọn phòng này")
      );
      btn?.click();
    })()`);
    await sleep(250);

    const s3 = await p.eval(`(() => {
      const editorOpen = document.querySelector("form[role='search']") !== null;
      const topAddBtn = document.querySelector("[data-testid='direct-add-room-top']");
      const summaryAddBtn = document.querySelector("[data-testid='summary-add-room']");
      const mobileAddBtn = document.querySelector("[data-testid='mobile-add-room']");
      return {
        editorOpen,
        hasDirectAddRoom: Boolean(topAddBtn || summaryAddBtn || mobileAddBtn),
      };
    })()`);
    ok(
      "Scenario 3: selecting first room shows obvious '+ Thêm phòng' action while search filter stays closed",
      s3.editorOpen === false && s3.hasDirectAddRoom === true,
      s3,
    );

    await p.shot(`${OUT}/${view.name}-bare-chic-1room-selected-add-room.png`);

    // Scenario 4: Click "+ Thêm phòng" directly from results (without reopening search filter):
    await p.eval(`(() => {
      const btn =
        document.querySelector("[data-testid='summary-add-room']") ||
        document.querySelector("[data-testid='direct-add-room-top']") ||
        document.querySelector("[data-testid='mobile-add-room']");
      btn?.click();
    })()`);
    await sleep(250);

    const s4s6 = await p.eval(`(() => {
      const editorOpen = document.querySelector("form[role='search']") !== null;
      const activeText = document.querySelector("[data-testid='active-room-indicator']")?.textContent?.trim() ?? "";
      const cardOne = document.querySelector("#phong-bare-chic-one");
      const disabledBtn = [...cardOne.querySelectorAll("button")].find(
        (b) => !b.closest("dialog") && b.disabled && b.textContent.includes("Đã chọn cho Phòng 1")
      );
      return {
        editorOpen,
        activeText,
        bareChicOneDisabledForRoom2: Boolean(disabledBtn),
        url: window.location.search,
      };
    })()`);

    ok(
      "Scenario 4: added second room directly from results without reopening search filter",
      s4s6.editorOpen === false && s4s6.activeText === "Đang chọn phòng 2/2",
      s4s6,
    );
    ok(
      "Scenario 6: unique physical room (Bare Chic One) is blocked from duplicate selection for Room 2",
      s4s6.bareChicOneDisabledForRoom2 === true,
      s4s6,
    );

    await p.shot(`${OUT}/${view.name}-added-second-room-inline.png`);

    // Select Bare Chic Two for Room 2:
    await p.eval(`(() => {
      const cardTwo = document.querySelector("#phong-bare-chic-two");
      const btn = [...cardTwo.querySelectorAll("button")].find(
        (b) => !b.closest("dialog") && b.textContent.includes("Chọn phòng này")
      );
      btn?.click();
    })()`);
    await sleep(250);

    // -------------------------------------------------------------------------
    // SCENARIO 7 & 8:
    // - Scenario 7: Change/remove a selected room without losing search intent
    // - Scenario 8: Preserve guest allocation and dates on refresh/back navigation
    // -------------------------------------------------------------------------
    await p.eval(`(() => {
      const pill1 = [...document.querySelectorAll("button")].find((b) =>
        b.textContent.includes("Phòng 1 (2 khách)")
      );
      pill1?.click();
    })()`);
    await sleep(200);

    await p.eval(`(() => {
      const cardThree = document.querySelector("#phong-bare-chic-three");
      const btn = [...cardThree.querySelectorAll("button")].find(
        (b) => !b.closest("dialog") && b.textContent.includes("Chọn phòng này")
      );
      btn?.click();
    })()`);
    await sleep(250);

    const s7Url = await p.eval(`window.location.search`);
    ok(
      "Scenario 7: changed Room 1 selection without losing dates or Room 2 selection",
      s7Url.includes("prefs=bare-chic-three%2Cbare-chic-two") && s7Url.includes("checkIn=2026-11-06"),
      { s7Url },
    );

    // Reload page to verify Scenario 8:
    await p.goto(`${BASE}/dev/demo/tim-phong${s7Url}`, { settle: 1500 });
    await sleep(250);

    const s8AfterReload = await p.eval(`(() => {
      const summary = document.querySelector("[data-testid='search-summary']")?.textContent?.trim() ?? "";
      return {
        summary,
        search: window.location.search,
      };
    })()`);
    ok(
      "Scenario 8: refresh preserves dates, guest allocation, and multi-room selections",
      s8AfterReload.summary.includes("2 phòng · 4 khách") &&
        s8AfterReload.search.includes("prefs=bare-chic-three%2Cbare-chic-two"),
      s8AfterReload,
    );

    // -------------------------------------------------------------------------
    // SCENARIO 5: Select two units from one multi-unit room type when the data contract supports it
    // (Bare Hyphen has 3 verified physical units of "Studio · 18 m²": Bare Hyphen One, Two, Three)
    // -------------------------------------------------------------------------
    await p.goto(
      `${BASE}/dev/demo/tim-phong?property=bare-hyphen&checkIn=2026-11-06&checkOut=2026-11-08&rooms=1&adults=2`,
      { settle: 1600 },
    );
    await p.eval(`window.scrollTo(0, 0)`);
    await sleep(250);

    // Select Bare Hyphen One (1st unit of Hạng Studio):
    await p.eval(`(() => {
      const card = document.querySelector("#phong-bare-hyphen-one");
      const btn = [...card.querySelectorAll("button")].find(
        (b) => !b.closest("dialog") && b.textContent.includes("Chọn phòng này")
      );
      btn?.click();
    })()`);
    await sleep(250);

    // Click "+ Chọn thêm 1 căn hạng Studio (còn 2 căn)" directly on the Bare Hyphen One card:
    const s5Clicked = await p.eval(`(() => {
      const sameTypeBtn = document.querySelector("[data-testid='add-same-type-bare-hyphen-one']");
      if (!sameTypeBtn) return false;
      sameTypeBtn.click();
      return true;
    })()`);
    await sleep(300);

    const s5Result = await p.eval(`(() => {
      const search = window.location.search;
      const badgeText = document.querySelector("[data-testid='same-type-badge-bare-hyphen-one']")?.textContent?.trim() ?? "";
      const bodyText = document.body.innerText;
      return {
        s5Clicked: ${s5Clicked},
        search,
        badgeText,
        hasTwoStudioSummary:
          bodyText.includes("2 × Hạng Studio") ||
          search.includes("prefs=bare-hyphen-one%2Cbare-hyphen-two"),
      };
    })()`);

    ok(
      "Scenario 5: selected 2 units of Hạng Studio directly via same-room-type action without duplicating physical unit",
      s5Result.s5Clicked === true &&
        s5Result.search.includes("prefs=bare-hyphen-one%2Cbare-hyphen-two") &&
        s5Result.badgeText.includes("đã chọn 2/3 căn") &&
        s5Result.hasTwoStudioSummary === true,
      s5Result,
    );

    await p.shot(`${OUT}/${view.name}-same-room-type-multi-unit.png`);

    // Open Review Sheet ("Kiểm tra lựa chọn") and capture screenshot:
    await p.eval(`(() => {
      const btns = [...document.querySelectorAll("button")].filter(
        (b) => b.textContent.trim() === "Xem lại lựa chọn" && b.offsetParent !== null
      );
      btns[0]?.click();
    })()`);
    await sleep(300);

    const reviewState = await p.eval(`(() => {
      const dialog = document.querySelector("dialog[open]");
      const title = dialog?.querySelector("#review-dialog-title")?.textContent?.trim() ?? "";
      const text = dialog?.innerText ?? "";
      return {
        open: Boolean(dialog),
        title,
        hasTwoStudioLine: text.includes("2 × Hạng Studio"),
      };
    })()`);

    ok(
      "Review Sheet opens cleanly and shows 2 × Hạng Studio summary",
      reviewState.open && reviewState.title === "Kiểm tra lựa chọn" && reviewState.hasTwoStudioLine,
      reviewState,
    );

    await p.shot(`${OUT}/${view.name}-review-sheet.png`);

    await p.eval(`document.querySelector("dialog[open]")?.close()`);
    await sleep(200);

    // -------------------------------------------------------------------------
    // SCENARIO 9: Changing property resets or safely reconciles incompatible selections
    // -------------------------------------------------------------------------
    await p.eval(`(() => {
      const chip = [...document.querySelectorAll("button")].find(
        (b) => b.textContent.trim() === "Bare Chic"
      );
      chip?.click();
    })()`);
    await sleep(250);

    const s9Url = await p.eval(`window.location.search`);
    ok(
      "Scenario 9: changing property resets incompatible room selections from previous property",
      s9Url.includes("property=bare-chic") && !s9Url.includes("bare-hyphen"),
      { s9Url },
    );

    const failed = Object.entries(r.checks)
      .filter(([, v]) => (typeof v === "boolean" ? !v : !v.pass))
      .map(([k]) => k);
    console.log(`${view.name} failed checks:`, failed);
    results.views.push(r);
    await p.close();
  }
} finally {
  await quit();
}

writeFileSync(`${OUT}/qa-room-first-report.json`, JSON.stringify(results, null, 2));
console.log("consoleErrors:", results.consoleErrors.length);

const anyFailed =
  results.views.some((v) =>
    Object.values(v.checks).some((c) => (typeof c === "boolean" ? !c : !c.pass)),
  ) || results.consoleErrors.length > 0;
if (anyFailed) {
  process.exit(1);
}
