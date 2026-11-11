// Room facts and demo navigation (21/10/2026), against `next start` on port 3400.
//   node docs/qa/demo/scripts/rooms-and-links.mjs
// 1. Every link and button on /dev/demo and the Bare Chic demo view, and where links lead.
// 2. The four room drawers at 1440, 768 and 390: facts shown, nothing filled in, gallery, CTA.
// 3. The booking bar's "VNest" and "Tất cả cơ sở" links stay inside the demo.
import { pathToFileURL } from "node:url";
import { writeFileSync } from "node:fs";
const ROOT = "/Users/noe/Documents/GitHub/VNest 2";
const { launch, quit, Page, sleep } = await import(pathToFileURL(`${ROOT}/docs/qa/brand-collection/scripts/lib.mjs`).href);
const BASE = "http://localhost:3400";
const OUT = `${ROOT}/docs/qa/demo/room-facts`;
const out = { links: {}, drawers: [], guard: {} };
await launch();

// 1. Inventory.
for (const path of ["/dev/demo", "/dev/stays/bare-chic?view=demo"]) {
  const p = await Page.open();
  await p.viewport(1440, 900, 1, false);
  await p.goto(BASE + path, { settle: 1500 });
  out.links[path] = await p.eval(`(() => {
    const vis = (e) => e.getClientRects().length > 0 || e.closest("dialog");
    const links = [...document.querySelectorAll("a[href]")].filter(vis).map((a) => { const u = new URL(a.href); return { text: (a.textContent.trim() || a.getAttribute("aria-label") || "").replace(/\\s+/g, " ").slice(0, 40), to: u.origin === location.origin ? u.pathname + u.search + u.hash : u.href, newTab: a.target === "_blank" }; });
    const seen = new Set();
    return links.filter((l) => { const k = l.text + l.to; if (seen.has(k)) return false; seen.add(k); return true; });
  })()`);
  await p.close();
}

// 2. Drawers.
for (const [w, h, mobile] of [[1440, 900, false], [768, 1024, true], [390, 844, true]]) {
  const p = await Page.open();
  const errors = [];
  p.on("Runtime.consoleAPICalled", (e) => { if (e.type === "error" || e.type === "warning") errors.push(e.args.map((a) => a.value ?? a.description).join(" ")); });
  p.on("Runtime.exceptionThrown", (e) => errors.push(e.exceptionDetails?.text));
  await p.viewport(w, h, w === 1440 ? 1 : 2, mobile);
  await p.goto(`${BASE}/dev/stays/bare-chic?view=demo`, { settle: 1500 });
  await p.eval("document.fonts.ready.then(() => true)");
  const rooms = await p.eval(`[...document.querySelectorAll("button")].filter((b) => b.textContent.startsWith("Xem chi tiết phòng")).length`);
  for (let i = 0; i < rooms; i++) {
    const c = await p.eval(`(() => { const b = [...document.querySelectorAll("button")].filter((b) => b.textContent.startsWith("Xem chi tiết phòng"))[${i}]; b.scrollIntoView({ block: "center" }); const r = b.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
    await sleep(200);
    if (mobile) await p.tap(c.x, c.y); else await p.click(c.x, c.y);
    await sleep(700);
    const d = await p.eval(`(() => {
      const d = document.querySelector("dialog[open][aria-label^='Chi tiết phòng']");
      const r = d.getBoundingClientRect();
      const specs = [...d.querySelectorAll("dl > div")].map((x) => x.querySelector("dt").textContent + ": " + x.querySelector("dd").textContent);
      const cta = [...d.querySelectorAll("button")].find((b) => b.textContent.includes("Chọn ngày lưu trú")).getBoundingClientRect();
      const imgs = [...d.querySelectorAll("img")];
      const t = d.innerText;
      return {
        room: d.querySelector("h2").textContent,
        specs,
        placeholderLines: (t.match(/đang (được )?(VNest )?cập nhật/gi) ?? []).length,
        invented: ["giường đôi", "giường đơn", "King", "Queen", "m2"].filter((s) => t.includes(s)),
        amenities: [...d.querySelectorAll("ul li")].map((li) => li.textContent.trim()).filter((s) => !s.match(/^\\d/)),
        price: [...d.querySelectorAll("p")].map((p) => p.textContent).filter((s) => s.startsWith("Giá")),
        photos: imgs.length, firstLoaded: imgs[0]?.complete && imgs[0]?.naturalWidth > 0,
        counter: d.querySelector("[aria-live]")?.textContent ?? null,
        ctaInView: cta.top >= 0 && cta.bottom <= innerHeight,
        overflowX: d.scrollWidth > d.clientWidth || [...d.querySelectorAll("dl, h2, p")].some((e) => e.getBoundingClientRect().right > r.right + 1),
        widthShare: +(r.width / innerWidth).toFixed(2),
      };
    })()`);
    if (i === 0 || w !== 768) await p.shot(`${OUT}/${w}-drawer-${i + 1}.png`);
    // Next photo, then close with Escape.
    const next = await p.eval(`!!document.querySelector("dialog[open] button[aria-label='Ảnh sau']")`);
    if (next) { await p.eval(`document.querySelector("dialog[open] button[aria-label='Ảnh sau']").click()`); await sleep(600); d.counterAfterNext = await p.eval(`document.querySelector("dialog[open] [aria-live]").textContent`); }
    await p.key("Escape", { vk: 27 });
    await sleep(400);
    d.closed = await p.eval(`!document.querySelector("dialog[open]")`);
    d.focusBack = await p.eval(`document.activeElement?.textContent.startsWith("Xem chi tiết phòng")`);
    out.drawers.push({ width: w, ...d });
  }
  // Room card for Bare Chic One, with its facts.
  if (w !== 768) {
    await p.eval(`document.getElementById("phong-bare-chic-one").scrollIntoView({ block: "center" })`);
    await sleep(300);
    await p.shot(`${OUT}/${w}-room-cards.png`);
  }
  // The CTA hands over to 02.1's dates.
  const c = await p.eval(`(() => { const b = [...document.querySelectorAll("button")].find((b) => b.textContent.startsWith("Xem chi tiết phòng")); b.scrollIntoView({ block: "center" }); const r = b.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
  if (mobile) await p.tap(c.x, c.y); else await p.click(c.x, c.y);
  await sleep(600);
  const cta = await p.eval(`(() => { const r = [...document.querySelector("dialog[open]").querySelectorAll("button")].find((b) => b.textContent.includes("Chọn ngày lưu trú")).getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
  if (mobile) await p.tap(cta.x, cta.y); else await p.click(cta.x, cta.y);
  await sleep(900);
  out.drawers.push({ width: w, cta: await p.eval(`({ drawerClosed: !document.querySelector("dialog[open][aria-label^='Chi tiết phòng']"), datesOpened: [...document.querySelectorAll("[role=dialog], dialog[open], [aria-expanded=true]")].some((e) => e.getClientRects().length > 0), path: location.pathname }) `), errors });
  await p.close();
}

// 3. The guard: the booking bar's own links stay inside the demo (same tab).
for (const [label, js] of [["02.1 bar: VNest", `[...document.querySelectorAll("a")].find((a) => a.textContent.trim() === "VNest" && a.getAttribute("href") === "/")`], ["02.1 wrapper: Tất cả cơ sở", `[...document.querySelectorAll("a")].find((a) => a.textContent.includes("Tất cả cơ sở"))`]]) {
  const p = await Page.open();
  await p.viewport(1440, 900, 1, false);
  await p.goto(`${BASE}/dev/stays/bare-chic?view=demo`, { settle: 1500 });
  const c = await p.eval(`(() => { const a = ${js}; if (!a) return null; const r = a.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, href: a.getAttribute("href") }; })()`);
  if (c) { await p.click(c.x, c.y); await sleep(1800); }
  out.guard[label] = { href: c?.href ?? "not found", landed: await p.eval("location.pathname + location.hash") };
  await p.close();
}
quit();
writeFileSync(`${OUT}/results.json`, JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
