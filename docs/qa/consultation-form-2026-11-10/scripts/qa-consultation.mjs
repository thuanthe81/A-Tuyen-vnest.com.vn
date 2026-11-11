/**
 * Consultation form QA (10/11/2026): the shared form on the homepage and the partner page, desktop 1440 and mobile 390,
 * Vietnamese and English, against two production servers built from the same code:
 *
 *   MOCK  CONSULTATION_DELIVERY=mock (launch config vnest-consult-mock, 3407): nothing leaves the machine.
 *   OFF   delivery not configured (vnest-consult-off, 3408): today's default.
 *
 * Usage: node docs/qa/consultation-form-2026-11-10/scripts/qa-consultation.mjs [MOCK] [OFF]
 * Failure and slow outcomes use the mock's `?mock=failed|slow`, added to the form's request by a Playwright route.
 * Each scenario gets its own X-Forwarded-For so the rate limit is tested only where intended.
 * Screenshots: ../shots/ (git-ignored).
 */
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "/Users/noe/Documents/GitHub/Cigarettes-After-Sex/node_modules/.pnpm/playwright@1.62.1/node_modules/playwright/index.mjs";

const MOCK = process.argv[2] ?? "http://localhost:3407";
const OFF = process.argv[3] ?? "http://localhost:3408";
const SHOTS = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "shots");
mkdirSync(SHOTS, { recursive: true });

const VIEWPORTS = {
  desktop: { viewport: { width: 1440, height: 900 } },
  mobile: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
};
const SERVICES = ["van-hanh", "tu-van-mo-hinh", "nhuong-quyen"];
const COPY = {
  vi: {
    sent: "Yêu cầu của bạn đã được gửi đến VNest.",
    failed: "Chưa thể gửi yêu cầu. Vui lòng thử lại hoặc liên hệ trực tiếp qua hello@vnest.com.vn.",
    submitting: "Đang gửi...",
    nameRequired: "Vui lòng nhập họ tên.",
    reachRequired: "Vui lòng nhập số điện thoại hoặc email.",
    reachInvalid: "Số điện thoại hoặc email chưa đúng định dạng.",
    limited: "Bạn vừa gửi nhiều yêu cầu",
    intro: "Chia sẻ đôi nét về tài sản",
    off: "Biểu mẫu trực tuyến chưa hoạt động",
    unsent: "Chưa gửi. Thông tin hợp lệ",
    simulated: "Môi trường thử nghiệm",
  },
  en: {
    sent: "Your request has been sent to VNest.",
    failed: "Your request could not be sent. Please try again or contact us directly at hello@vnest.com.vn.",
    submitting: "Sending...",
    nameRequired: "Please enter your name.",
    reachRequired: "Please enter a phone number or email address.",
    reachInvalid: "That phone number or email address does not look right.",
    limited: "Several requests were sent",
    intro: "Tell us a little about your property",
    off: "The online form is not active yet",
    unsent: "Not sent. Your details are valid",
    simulated: "Test environment",
  },
};

let passed = 0;
const failures = [];
const check = (ok, label) => {
  if (ok) passed++;
  else failures.push(label);
  console.log(`${ok ? "✔" : "✘"} ${label}`);
};

const browser = await chromium.launch();
// A fresh address range per run: the server remembers earlier runs' requests for ten minutes (that is the rate limit).
const RUN = Math.floor(Math.random() * 200) + 20;
let ipSeq = 1;

async function open(base, pagePath, vp, lang, { outcome, ip } = {}) {
  const context = await browser.newContext({
    ...VIEWPORTS[vp],
    reducedMotion: "reduce",
    extraHTTPHeaders: { "x-forwarded-for": ip ?? `10.${RUN}.${Math.floor(ipSeq / 250)}.${ipSeq++ % 250}` },
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && !/maps|google|Failed to load resource/i.test(m.text()) && errors.push(m.text()));
  const requests = [];
  page.on("request", (r) => r.url().includes("/api/consultation") && requests.push(r));
  if (outcome) {
    await page.route("**/api/consultation", (route) => route.continue({ url: `${route.request().url().split("?")[0]}?mock=${outcome}` }));
  }
  const sep = pagePath.includes("?") ? "&" : "?";
  await page.goto(`${base}${pagePath}${sep}lang=${lang}`, { waitUntil: "networkidle" });
  const width = await page.evaluate(() => window.innerWidth);
  if (width !== VIEWPORTS[vp].viewport.width) throw new Error(`viewport ${width} is not ${VIEWPORTS[vp].viewport.width}`);
  const form = page.locator("#tu-van form");
  await form.scrollIntoViewIfNeeded();
  return { context, page, form, requests, errors };
}

const status = (form) => form.locator('[role="status"]');
async function fill(form, { name = "", reach = "", asset = "", message = "" }) {
  await form.locator('input[name="name"]').fill(name);
  await form.locator('input[name="reach"]').fill(reach);
  await form.locator('input[name="asset"]').fill(asset);
  await form.locator('textarea[name="message"]').fill(message);
}
const submit = (form, vp) => (vp === "mobile" ? form.locator('button[type="submit"]').tap() : form.locator('button[type="submit"]').click());
// The site header is fixed; on a phone it would sit on top of the captured form, so it is hidden in captures only.
const shot = (form, name) => form.screenshot({ path: path.join(SHOTS, `${name}.png`), animations: "disabled", style: "header { visibility: hidden !important; }" });
const unique = () => `QA ${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

for (const vp of ["desktop", "mobile"]) {
  for (const lang of ["vi", "en"]) {
    const t = COPY[lang];
    const tag = `${vp}/${lang}`;

    // Idle + 1. empty form validation
    {
      const { context, page, form, requests, errors } = await open(MOCK, "/dev/demo?intro=0", vp, lang);
      check((await form.getAttribute("data-delivery")) === "mock", `${tag} mock server: form knows delivery is on`);
      const notice = await form.locator("p").first().innerText();
      check(notice.includes(t.intro) && !notice.includes(t.off), `${tag} idle: new introduction, no "not active" notice`);
      if (lang === "vi") await shot(form, `${vp}-vi-1-idle`);
      await fill(form, {});
      await submit(form, vp);
      await page.waitForTimeout(150);
      check((await form.locator('input[name="name"]').getAttribute("aria-invalid")) === "true", `${tag} empty: name marked invalid`);
      check((await form.locator('input[name="reach"]').getAttribute("aria-invalid")) === "true", `${tag} empty: contact marked invalid`);
      const text = await form.innerText();
      check(text.includes(t.nameRequired) && text.includes(t.reachRequired), `${tag} empty: both inline messages`);
      check((await page.evaluate(() => document.activeElement?.getAttribute("name"))) === "name", `${tag} empty: focus moves to name`);
      check(requests.length === 0, `${tag} empty: nothing sent`);
      check((await form.locator('input[type="radio"]:checked').count()) === 1, `${tag} a service is always chosen (default)`);
      if (lang === "vi" || vp === "desktop") await shot(form, `${vp}-${lang}-2-validation`);

      // 4. invalid contact
      await fill(form, { name: "Nguyễn Văn A", reach: "12345" });
      await submit(form, vp);
      await page.waitForTimeout(150);
      check((await form.innerText()).includes(t.reachInvalid), `${tag} invalid contact: message shown`);
      check(requests.length === 0, `${tag} invalid contact: nothing sent`);
      check(errors.length === 0, `${tag} no page errors (${errors.join(" | ")})`);
      await context.close();
    }

    // 2. name + email, with 5. optional fields → 9. success after server confirmation
    {
      const { context, page, form, requests } = await open(MOCK, "/dev/demo?intro=0", vp, lang);
      const name = unique();
      await fill(form, { name, reach: "owner@example.com", asset: "Căn hộ dịch vụ", message: "Dòng 1\nDòng 2 <b>đậm</b>" });
      const answer = page.waitForResponse((r) => r.url().includes("/api/consultation"));
      await submit(form, vp);
      const response = await answer;
      await status(form).filter({ hasText: t.sent }).waitFor({ timeout: 5000 });
      const body = JSON.parse(requests[0].postData() ?? "{}");
      check(response.status() === 200, `${tag} email: server answered 200`);
      check(body.reach === "owner@example.com" && body.asset === "Căn hộ dịch vụ" && body.message.includes("Dòng 2") && body.source === "/dev/demo" && body.locale === lang, `${tag} optional fields, source and language sent`);
      check(body.vnx_hp === "", `${tag} spam trap empty for a person`);
      const statusText = await status(form).innerText();
      check(statusText.includes(t.sent) && statusText.includes(t.simulated), `${tag} success message (labelled simulated on the mock)`);
      check((await form.locator('input[name="name"]').inputValue()) === "" && (await form.locator("textarea").inputValue()) === "", `${tag} form reset after success`);
      check((await form.locator('input[type="radio"]:checked').count()) === 1, `${tag} service kept after reset`);
      check(requests.length === 1, `${tag} one request`);
      if (vp === "desktop" || lang === "vi") await shot(form, `${vp}-${lang}-4-success`);
      // Typing again clears the success message.
      await form.locator('input[name="name"]').fill("A");
      check((await status(form).innerText()).trim() === "", `${tag} success message gives way to a new request`);
      await context.close();
    }

    // 3. name + phone
    {
      const { context, form, page } = await open(MOCK, "/dev/demo/hop-tac", vp, lang);
      await fill(form, { name: unique(), reach: "0901 234 567" });
      const answer = page.waitForResponse((r) => r.url().includes("/api/consultation"));
      await submit(form, vp);
      check((await answer).status() === 200, `${tag} phone (partner page): server answered 200`);
      await status(form).filter({ hasText: t.sent }).waitFor({ timeout: 5000 });
      check(true, `${tag} phone (partner page): success shown`);
      await context.close();
    }

    // 7. duplicate prevention + submitting state (slow mock)
    {
      const { context, page, form, requests } = await open(MOCK, "/dev/demo?intro=0", vp, lang, { outcome: "slow" });
      await fill(form, { name: unique(), reach: "owner@example.com" });
      const button = form.locator('button[type="submit"]');
      await submit(form, vp);
      await page.waitForTimeout(100);
      check((await button.innerText()).trim() === t.submitting, `${tag} submitting: button says "${t.submitting}"`);
      check((await button.getAttribute("aria-disabled")) === "true" && (await form.getAttribute("aria-busy")) === "true", `${tag} submitting: button aria-disabled, form aria-busy`);
      if (vp === "desktop" || lang === "vi") await shot(form, `${vp}-${lang}-3-submitting`);
      await button.click({ force: true });
      await button.click({ force: true });
      await form.locator('input[name="reach"]').press("Enter");
      await status(form).filter({ hasText: t.sent }).waitFor({ timeout: 8000 });
      check(requests.length === 1, `${tag} duplicate: double click + Enter sent ONE request (${requests.length})`);
      await context.close();
    }

    // 8. provider failure keeps values
    {
      const { context, page, form } = await open(MOCK, "/dev/demo?intro=0", vp, lang, { outcome: "failed" });
      const name = unique();
      await fill(form, { name, reach: "owner@example.com", asset: "Villa", message: "Giữ lại" });
      const answer = page.waitForResponse((r) => r.url().includes("/api/consultation"));
      await submit(form, vp);
      check((await answer).status() === 502, `${tag} failure: server answered 502`);
      await status(form).filter({ hasText: "hello@vnest.com.vn" }).waitFor({ timeout: 5000 });
      check((await status(form).innerText()).trim() === t.failed, `${tag} failure: exact message`);
      check((await status(form).locator('a[href="mailto:hello@vnest.com.vn"]').count()) === 1, `${tag} failure: email is a mailto link`);
      check(!(await form.innerText()).includes(t.sent), `${tag} failure: no success shown`);
      check((await form.locator('input[name="name"]').inputValue()) === name && (await form.locator("textarea").inputValue()) === "Giữ lại", `${tag} failure: values kept`);
      if (vp === "desktop" || lang === "vi") await shot(form, `${vp}-${lang}-5-failure`);
      await context.close();
    }

    // Network failure (server unreachable) is a failure too
    if (lang === "vi") {
      const { context, page, form } = await open(MOCK, "/dev/demo?intro=0", vp, lang);
      await page.route("**/api/consultation", (route) => route.abort("failed"));
      await fill(form, { name: unique(), reach: "owner@example.com" });
      await submit(form, vp);
      await status(form).filter({ hasText: "hello@vnest.com.vn" }).waitFor({ timeout: 5000 });
      check((await status(form).innerText()).trim() === t.failed, `${tag} network failure: failure message, not success`);
      await context.close();
    }
  }

  // 6. service preselection from every service CTA (homepage accordion, partner chapters, address)
  {
    const { context, page, form } = await open(MOCK, "/dev/demo?intro=0", vp, "vi");
    for (const id of SERVICES) {
      const trigger = page.locator(`button[data-service="${id}"]`);
      await trigger.scrollIntoViewIfNeeded();
      if ((await trigger.getAttribute("aria-expanded")) !== "true") await trigger.click();
      const cta = page.locator(`a[data-service="${id}"]`).first();
      await cta.waitFor({ state: "visible" });
      await cta.click();
      await page.waitForTimeout(300);
      check((await form.locator(`input[value="${id}"]`).isChecked()) && page.url().includes(`dich-vu=${id}`), `${vp} homepage CTA ${id}: service preselected, kept in the address`);
    }
    await context.close();
  }
  {
    const { context, page, form } = await open(MOCK, "/dev/demo/hop-tac", vp, "vi");
    for (const id of SERVICES) {
      const cta = page.locator(`a[data-service="${id}"]`).first();
      await cta.scrollIntoViewIfNeeded();
      await cta.click();
      await page.waitForTimeout(300);
      check(await form.locator(`input[value="${id}"]`).isChecked(), `${vp} partner page CTA ${id}: service preselected`);
    }
    await context.close();
  }
  // A service changed by hand before sending stays chosen after the success reset.
  {
    const { context, form, page, requests } = await open(MOCK, "/dev/demo?intro=0", vp, "vi");
    await form.locator('label:has(input[value="nhuong-quyen"])').click();
    await fill(form, { name: unique(), reach: "owner@example.com" });
    await submit(form, vp);
    await status(form).filter({ hasText: COPY.vi.sent }).waitFor({ timeout: 5000 });
    const checked = await form.locator('input[type="radio"]:checked').evaluateAll((inputs) => inputs.map((i) => i.value));
    check(JSON.parse(requests[0].postData() ?? "{}").service === "nhuong-quyen" && checked.join() === "nhuong-quyen", `${vp} service changed by hand: sent, and still the only one checked after reset (${checked})`);
    await context.close();
    void page;
  }
  for (const id of SERVICES) {
    const { context, form, page, requests } = await open(MOCK, `/dev/demo?intro=0&dich-vu=${id}`, vp, "vi");
    await fill(form, { name: unique(), reach: "owner@example.com" });
    await submit(form, vp);
    await status(form).filter({ hasText: COPY.vi.sent }).waitFor({ timeout: 5000 });
    check(JSON.parse(requests[0].postData() ?? "{}").service === id, `${vp} ?dich-vu=${id}: the preselected service is the one sent`);
    await context.close();
    void page;
  }

  // Rate limit: the sixth request from one address in ten minutes is refused, politely
  {
    const ip = `172.16.${RUN}.${vp === "desktop" ? 1 : 2}`;
    const { context, form, page } = await open(MOCK, "/dev/demo?intro=0", vp, "vi", { ip });
    const codes = [];
    for (let i = 0; i < 6; i++) {
      await fill(form, { name: unique(), reach: "owner@example.com" });
      const answer = page.waitForResponse((r) => r.url().includes("/api/consultation"));
      await submit(form, vp);
      codes.push((await answer).status());
      await page.waitForTimeout(100);
    }
    check(codes.join(",") === "200,200,200,200,200,429", `${vp} rate limit: ${codes.join(",")}`);
    check((await status(form).innerText()).includes(COPY.vi.limited), `${vp} rate limit: polite message with the email address`);
    if (vp === "desktop") await shot(form, `${vp}-vi-6-rate-limited`);
    await context.close();
  }

  // Delivery off (today's default): honest notice, nothing sent
  for (const lang of ["vi", "en"]) {
    const t = COPY[lang];
    const { context, form, page, requests } = await open(OFF, "/dev/demo?intro=0", vp, lang);
    check((await form.getAttribute("data-delivery")) === "off", `${vp}/${lang} off server: form knows delivery is off`);
    check((await form.innerText()).includes(t.off), `${vp}/${lang} off: "not active" notice kept`);
    await fill(form, { name: "Nguyễn Văn A", reach: "owner@example.com" });
    await submit(form, vp);
    await page.waitForTimeout(300);
    check((await status(form).innerText()).includes(t.unsent) && requests.length === 0, `${vp}/${lang} off: "not sent" message, no request`);
    if (lang === "vi") await shot(form, `${vp}-vi-0-off-unsent`);
    await context.close();
  }
}

await browser.close();
console.log(`\n${passed} passed, ${failures.length} failed`);
if (failures.length) {
  console.log(failures.map((f) => `  - ${f}`).join("\n"));
  process.exit(1);
}
