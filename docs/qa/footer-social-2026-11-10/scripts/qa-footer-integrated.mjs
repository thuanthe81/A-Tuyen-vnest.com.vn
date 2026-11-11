// Footer social icons, integrated QA (11/11/2026): Facebook is a real link (from VNEST_CONTACT), the other three are
// placeholders, and the approved design is unchanged. Usage: node qa-footer-integrated.mjs http://localhost:3401
import { chromium } from "/Users/noe/Documents/GitHub/Cigarettes-After-Sex/node_modules/.pnpm/playwright@1.62.1/node_modules/playwright/index.mjs";
const base = process.argv[2];
const browser = await chromium.launch();
let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) pass++; else { fail++; console.log("FAIL", msg); } };
const PAGES = [["home", "/dev/demo?intro=0"], ["partner", "/dev/demo/hop-tac"], ["results", "/dev/demo/tim-phong"]];
const NAMES = ["Instagram", "LinkedIn", "TikTok", "Facebook"];
const LABELS = { vi: (n) => `${n} – sắp cập nhật`, en: (n) => `${n} – coming soon` };
const FB_LABEL = { vi: "Facebook VNest (mở trong tab mới)", en: "VNest on Facebook (opens in a new tab)" };
const FB_URL = "https://www.facebook.com/vnest.com.vn";
for (const [name, path] of PAGES) for (const width of [375, 390, 768, 1024, 1440]) for (const lang of ["vi", "en"]) {
  const tag = `${name}@${width}/${lang}`;
  const mobile = width < 1024;
  const page = await browser.newPage({ viewport: { width, height: 844 }, isMobile: mobile, hasTouch: mobile });
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));
  const sep = path.includes("?") ? "&" : "?";
  const res = await page.goto(`${base}${path}${sep}lang=${lang}`, { waitUntil: "networkidle" });
  ok(res.status() === 200, `${tag} status ${res.status()}`);
  const footer = page.locator("footer").last();
  await footer.scrollIntoViewIfNeeded();
  const r = await footer.evaluate((f) => {
    const bottom = f.querySelector("[class*=footerBottom]");
    const list = bottom.querySelector("ul[class*=footerSocial]");
    const items = [...list.querySelectorAll("[data-social]")];
    const top = bottom.querySelector('a[href="#top"]');
    const nav = bottom.querySelector("nav");
    const legal = bottom.querySelector("[class*=footerLegal]");
    const box = (el) => el.getBoundingClientRect();
    const c = (el) => { const b = box(el); return b.top + b.height / 2; };
    const svg = (el) => box(el.querySelector("svg"));
    return {
      listLabel: list.getAttribute("aria-label"),
      labels: items.map((i) => i.getAttribute("aria-label")),
      roles: items.map((i) => i.getAttribute("role")),
      tags: items.map((i) => i.tagName),
      fb: (() => { const a = items[3]; return { href: a.getAttribute("href"), target: a.target, rel: a.rel, tip: a.dataset.tip ?? null, after: getComputedStyle(a, "::after").content, cursor: getComputedStyle(a).cursor, deco: getComputedStyle(a).textDecorationLine }; })(),
      ids: items.map((i) => i.dataset.social),
      links: list.querySelectorAll("a").length,
      buttons: list.querySelectorAll("button, [tabindex]").length,
      tabindex: items.map((i) => i.tabIndex),
      svgHidden: items.every((i) => i.querySelector("svg").getAttribute("aria-hidden") === "true"),
      colors: items.map((i) => getComputedStyle(i).color),
      bg: items.map((i) => getComputedStyle(i).backgroundColor),
      size: items.map((i) => [svg(i).width, svg(i).height]),
      centres: items.map(c), topCentre: c(top), legalCentre: c(legal),
      gaps: items.slice(1).map((i, k) => svg(i).left - svg(items[k]).right),
      socialBeforeTop: !!(list.compareDocumentPosition(top) & Node.DOCUMENT_POSITION_FOLLOWING),
      listRight: box(list).right, topLeft: box(top).left, topRight: box(top).right,
      firstIconLeft: svg(items[0]).left, lastIconRight: svg(items.at(-1)).right,
      navLeft: box(nav).left, bottomLeft: box(bottom).left, bottomRight: box(bottom).right,
      listTop: box(list).top, navBottom: box(nav).bottom, legalTop: box(legal).top, listBottom: box(list).bottom,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      kept: { nav: nav.querySelectorAll("a").length, legal: legal.textContent, top: top.textContent, brand: !!f.querySelector("img") },
      tip: getComputedStyle(items[0], "::after").content,
      tipOpacity: getComputedStyle(items[0], "::after").opacity,
      cursor: getComputedStyle(items[0]).cursor,
    };
  });
  ok(r.listLabel === (lang === "vi" ? "Mạng xã hội VNest" : "VNest social media"), `${tag} list label ${r.listLabel}`);
  ok(JSON.stringify(r.labels) === JSON.stringify([...NAMES.slice(0, 3).map(LABELS[lang]), FB_LABEL[lang]]), `${tag} labels ${r.labels}`);
  ok(r.roles.slice(0, 3).every((x) => x === "img") && r.tags.slice(0, 3).every((t) => t === "SPAN"), `${tag} three placeholders are images`);
  ok(r.tags[3] === "A" && r.roles[3] === null, `${tag} Facebook is a link`);
  ok(r.fb.href === FB_URL && r.fb.target === "_blank" && r.fb.rel === "noopener noreferrer", `${tag} Facebook: official URL, new tab, safe rel ${JSON.stringify(r.fb)}`);
  ok(r.fb.tip === null && r.fb.after === "none", `${tag} Facebook: no tooltip`);
  ok(r.fb.cursor === "pointer" && r.fb.deco === "none", `${tag} Facebook: pointer, no underline`);
  ok(r.ids.join() === "instagram,linkedin,tiktok,facebook", `${tag} order ${r.ids}`);
  ok(r.links === 1 && r.buttons === 0, `${tag} one link (Facebook), no button or tabindex`);
  ok(r.tabindex.slice(0, 3).every((t) => t === -1) && r.tabindex[3] === 0, `${tag} only Facebook is a tab stop`);
  ok(r.svgHidden, `${tag} artwork hidden from screen readers`);
  ok(r.colors.every((x) => x === "rgb(55, 65, 47)"), `${tag} Dark Olive ${r.colors[0]}`);
  ok(r.bg.every((x) => x === "rgba(0, 0, 0, 0)"), `${tag} transparent`);
  ok(r.size.every(([w, h]) => w === 18 && h === 18), `${tag} 18px icons`);
  ok(Math.max(...r.centres) - Math.min(...r.centres) <= 0.5, `${tag} icons on one line`);
  ok(Math.abs(r.centres[0] - r.topCentre) <= 1, `${tag} icons centred with back to top (${r.centres[0]} vs ${r.topCentre})`);
  ok(Math.max(...r.gaps) - Math.min(...r.gaps) <= 0.5 && r.gaps[0] >= 10, `${tag} even spacing ${r.gaps}`);
  ok(r.socialBeforeTop && r.listRight < r.topLeft, `${tag} icons before back to top`);
  ok(Math.abs(r.topRight - r.bottomRight) <= 1, `${tag} back to top on the right edge`);
  ok(r.overflow === 0, `${tag} no horizontal overflow (${r.overflow})`);
  ok(r.kept.nav === 4 && r.kept.legal.includes("© 2026 VNest") && /↑/.test(r.kept.top) && r.kept.brand, `${tag} footer content kept`);
  ok(r.tip === (lang === "vi" ? '"Sắp cập nhật"' : '"Coming soon"') && r.tipOpacity === "0", `${tag} tooltip hidden at rest`);
  ok(r.cursor === "default", `${tag} placeholders: no pointer cursor`);
  if (width >= 1024) {
    ok(Math.abs(r.centres[0] - r.legalCentre) <= 1, `${tag} one row with ©`);
  } else if (width >= 768) {
    ok(r.listTop >= r.navBottom - 1 && Math.abs(r.centres[0] - r.legalCentre) <= 1, `${tag} tablet: © and the group under the links`);
  } else {
    ok(r.listTop >= r.navBottom - 1 && r.legalTop >= r.listBottom - 1, `${tag} phone: links / icons + back to top / ©`);
    ok(Math.abs(r.firstIconLeft - r.navLeft) <= 1.5, `${tag} phone: first icon aligned with links (${r.firstIconLeft} vs ${r.navLeft})`);
  }
  if (!mobile) {
    await page.locator("[data-social=instagram]").last().hover();
    await page.waitForTimeout(300);
    const h = await page.locator("[data-social=instagram]").last().evaluate((i) => {
      const t = getComputedStyle(i, "::after");
      return { color: getComputedStyle(i).color, op: t.opacity };
    });
    ok(h.color === "rgb(143, 96, 54)" && h.op === "1", `${tag} hover: Copper and tooltip ${JSON.stringify(h)}`);
    // Keyboard: Tab from the last nav link goes to Facebook (the placeholders are skipped), then back to top.
    await page.locator("footer nav a").last().focus();
    await page.keyboard.press("Tab");
    const first = await page.evaluate(() => document.activeElement?.dataset.social);
    const ring = await page.evaluate(() => { const s = getComputedStyle(document.activeElement.querySelector("svg")); return s.outlineStyle + " " + s.outlineWidth + " " + s.outlineColor; });
    await page.keyboard.press("Tab");
    const second = await page.evaluate(() => document.activeElement?.getAttribute("href"));
    ok(first === "facebook" && second === "#top", `${tag} Tab: Facebook, then back to top (${first}, ${second})`);
    ok(ring === "solid 2px rgb(55, 65, 47)", `${tag} Facebook focus ring on the icon (${ring})`);
    await page.locator("[data-social=facebook]").last().hover();
    await page.waitForTimeout(300);
    const fbHover = await page.locator("[data-social=facebook]").last().evaluate((a) => ({ color: getComputedStyle(a).color, after: getComputedStyle(a, "::after").content }));
    ok(fbHover.color === "rgb(143, 96, 54)" && fbHover.after === "none", `${tag} Facebook hover: Copper, no tooltip ${JSON.stringify(fbHover)}`);
  }
  ok(errors.length === 0, `${tag} console clean ${errors.join(" | ").slice(0, 200)}`);
  await page.close();
}
// The Facebook icon opens the official page in a new tab (the request is answered locally; nothing reaches Facebook).
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.route("**://*.facebook.com/**", (route) => route.fulfill({ status: 200, contentType: "text/html", body: "<title>stub</title>" }));
  const page = await context.newPage();
  await page.goto(`${base}/dev/demo?intro=0`, { waitUntil: "networkidle" });
  const [popup] = await Promise.all([context.waitForEvent("page"), page.locator("[data-social=facebook]").last().click()]);
  await popup.waitForLoadState();
  ok(popup.url() === FB_URL, `click opens ${popup.url()} in a new tab`);
  ok(page.url().includes("/dev/demo"), "the VNest page stays open");
  ok((await popup.evaluate(() => window.opener)) === null, "no window.opener in the new tab");
  await context.close();
}
// Accessibility tree: the placeholders are images with their labels; Facebook is a link.
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`${base}/dev/demo?intro=0`, { waitUntil: "networkidle" });
  const snap = await page.locator("footer ul[class*=footerSocial]").ariaSnapshot();
  ok(["Instagram", "LinkedIn", "TikTok"].every((n) => snap.includes(`img "${n} – sắp cập nhật"`)) && snap.includes('link "Facebook VNest (mở trong tab mới)"') && !snap.includes('img "Facebook') && snap.includes('list "Mạng xã hội VNest"'), `aria snapshot\n${snap}`);
  console.log(snap);
  await page.close();
}
await browser.close();
console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
