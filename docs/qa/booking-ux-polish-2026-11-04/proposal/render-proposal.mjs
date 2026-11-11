/**
 * VISUAL PROPOSAL ONLY (not applied to the site): one combined "Phòng & khách" field in the approved 02.1 search bar.
 * Rendered on the live page in a test browser by relabelling the existing guests field and cloning its own stepper row,
 * so the proposal uses the bar's real type, spacing, colours and touch targets. Source code is not changed.
 *   VNEST_TEST_URL=http://localhost:3402 node docs/qa/booking-ux-polish-2026-11-04/proposal/render-proposal.mjs
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "/Users/noe/Documents/GitHub/Cigarettes-After-Sex/node_modules/.pnpm/playwright@1.62.1/node_modules/playwright/index.mjs";

const BASE = process.env.VNEST_TEST_URL ?? "http://localhost:3402";
const HERE = path.dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch();

/** Turns the guests UI on the page into the proposed combined field: 3 guests, 2 rooms. */
const propose = () => {
  const tag = document.createElement("div");
  tag.textContent = "ĐỀ XUẤT · bản phác thảo, chưa áp dụng";
  tag.style.cssText = "position:fixed;right:12px;bottom:12px;z-index:2147483647;background:#9A683C;color:#fff;font:600 12px/1 system-ui;padding:8px 10px;border-radius:999px";
  document.body.appendChild(tag);
  // Labels and summaries: only the text nodes change, so every element keeps its own styling.
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.nodeValue?.trim() ?? "";
    if (text === "Khách") node.nodeValue = node.nodeValue.replace("Khách", "Phòng & khách");
    else if (/\d+ khách$/.test(text)) node.nodeValue = node.nodeValue.replace(/\d+ khách(\s*)$/, "3 khách · 2 phòng$1");
  }
  // Panels: the adults row, then a rooms row cloned from it, then one line on how rooms and guests relate.
  for (const group of document.querySelectorAll('[role="group"]')) {
    const label = [...group.querySelectorAll("span")].find((s) => s.textContent?.trim() === "Người lớn");
    if (!label || group.dataset.proposal) continue;
    group.dataset.proposal = "1";
    group.querySelector("output").textContent = "3";
    const rooms = group.cloneNode(true);
    [...rooms.querySelectorAll("span")].find((s) => s.textContent?.trim() === "Người lớn").textContent = "Phòng";
    rooms.querySelector("output").textContent = "2";
    rooms.style.marginTop = "12px";
    group.after(rooms);
    const note = document.createElement("p");
    note.textContent = "Phòng 1: 2 khách · Phòng 2: 1 khách. Thêm phòng không đổi số khách; mỗi phòng có ít nhất 1 khách.";
    note.style.cssText = "margin:12px 0 0;font-size:13px;line-height:1.45;color:#5d5547";
    rooms.after(note);
  }
};

async function capture(name, viewport, open) {
  const context = await browser.newContext({ viewport, isMobile: viewport.width < 768, hasTouch: viewport.width < 768 });
  const page = await context.newPage();
  await page.goto(`${BASE}/dev/demo?intro=0`, { waitUntil: "networkidle" });
  await page.locator("#dat-phong").evaluate((el) => el.scrollIntoView({ block: "center" }));
  await page.waitForTimeout(400);
  for (const variant of ["current", "proposed"]) {
    if (open) await open(page);
    await page.waitForTimeout(450);
    if (variant === "proposed") await page.evaluate(propose);
    await page.waitForTimeout(150);
    await page.screenshot({ path: path.join(HERE, `${name}-${variant}.png`) });
    if (open) await page.keyboard.press("Escape").catch(() => {});
    await page.waitForTimeout(300);
  }
  await context.close();
}

await capture("desktop-field", { width: 1440, height: 900 });
await capture("desktop-panel", { width: 1440, height: 900 }, async (page) => {
  await page.locator('button[data-field="guests"]:visible').first().click();
});
await capture("mobile-pill", { width: 390, height: 844 });
await capture("mobile-sheet", { width: 390, height: 844 }, async (page) => {
  await page.locator('#dat-phong button[aria-haspopup="dialog"]:visible').first().tap();
  await page.waitForTimeout(400);
  const guests = page.locator("dialog.vn-sheet[open]").getByRole("button", { name: /^Khách|^Phòng & khách/ }).first();
  if (await guests.isVisible().catch(() => false)) await guests.tap();
});
await browser.close();
console.log("proposal rendered");
