// Room galleries in the rendered UI (26/10/2026). For every room card on Booking Results (all six
// properties) and on the Bare Chic and The Nắng Suites pages, at 1440, 768 and 390: walk the carousel
// through every photograph (mouse arrows at 1440/768, touch swipe at 390), check each image loads and
// is distinct, and compare the count with audit.json, the room drawer's counter and the full-screen
// viewer. On the property pages also open "Xem tất cả … ảnh" and count its room groups.
//   BASE=http://localhost:3401 node docs/qa/v3-gallery-audit-2026-10-26/scripts/ui.mjs
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
const ROOT = "/Users/noe/Documents/GitHub/VNest 2";
const { launch, quit, Page, sleep, HIDE_DEV } = await import(pathToFileURL(`${ROOT}/docs/qa/brand-collection/scripts/lib.mjs`).href);
const BASE = process.env.BASE ?? "http://localhost:3401";
const DIR = `${ROOT}/docs/qa/v3-gallery-audit-2026-10-26`;
const OUT = `${DIR}/shots`;
mkdirSync(OUT, { recursive: true });
const audit = JSON.parse(readFileSync(`${DIR}/audit.json`, "utf8")).rows;
const expected = new Map(audit.map((r) => [r.roomId, r]));
const STAY = "checkIn=2026-11-06&checkOut=2026-11-08";
const VIEWS = [
  { name: "1440", w: 1440, h: 900, dpr: 1, mobile: false },
  { name: "768", w: 768, h: 1024, dpr: 1, mobile: true },
  { name: "390", w: 390, h: 844, dpr: 2, mobile: true },
];
const PROPERTIES = ["bare-chic", "bare-hyphen", "bare-da-kao", "bare-han", "the-nang-suites", "pepper-house"];
const results = { base: BASE, ranAt: new Date().toISOString(), rooms: [], viewers: [], failures: [] };
const fail = (msg) => {
  results.failures.push(msg);
  console.log("FAIL", msg);
};

/** The photograph key behind the carousel's current <img> (next/image wraps the path in ?url=). */
const CURRENT = (sel) => `(() => { const img = document.querySelector(${JSON.stringify(sel)} + " img"); if (!img) return null; const raw = img.getAttribute("src") || ""; const u = raw.includes("url=") ? decodeURIComponent(new URL(raw, location.href).searchParams.get("url")) : raw; return { key: u.split("/").slice(-2, -1)[0], ok: img.complete && img.naturalWidth > 0, w: img.naturalWidth, h: img.naturalHeight, boxW: img.getBoundingClientRect().width, boxH: img.getBoundingClientRect().height, fit: getComputedStyle(img).objectFit }; })()`;

async function waitImage(p, sel) {
  for (let i = 0; i < 80; i++) {
    const c = await p.eval(CURRENT(sel));
    if (c?.ok) return c;
    await sleep(100);
  }
  return p.eval(CURRENT(sel));
}

async function walkCard(p, view, cardSel, roomId, surface) {
  const car = `${cardSel} [data-photo-total]`;
  const total = await p.eval(`(() => { const e = document.querySelector(${JSON.stringify(car)}); return e ? Number(e.dataset.photoTotal) : 0; })()`);
  const exp = expected.get(roomId);
  const row = { view: view.name, surface, roomId, total, expected: exp?.accessibleNow ?? null, keys: [], broken: [], distorted: [] };
  if (exp && total !== exp.accessibleNow) fail(`${view.name} ${surface} ${roomId}: carousel shows ${total}, audit says ${exp.accessibleNow}`);
  if (!total) return results.rooms.push(row);
  await p.eval(`document.querySelector(${JSON.stringify(car)}).scrollIntoView({ block: "center", behavior: "instant" })`);
  await sleep(250);
  for (let i = 0; i < total; i++) {
    const c = await waitImage(p, car);
    row.keys.push(c?.key);
    if (!c?.ok) row.broken.push(i + 1);
    if (c && c.fit !== "cover") row.distorted.push(`${i + 1}:${c.fit}`);
    if (i === total - 1) break;
    if (view.name === "390") {
      // Swipe left on the photograph.
      const b = await p.eval(`(() => { const r = document.querySelector(${JSON.stringify(car)}).getBoundingClientRect(); return { x: r.x + r.width * 0.8, y: r.y + r.height / 2, to: r.x + r.width * 0.15 }; })()`);
      await p.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: b.x, y: b.y }] });
      for (let x = b.x; x >= b.to; x -= 30) {
        await p.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y: b.y }] });
        await sleep(12);
      }
      await p.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    } else {
      const b = await p.eval(`(() => { const r = document.querySelector(${JSON.stringify(car + " [data-testid=carousel-next]")}).getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
      await p.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: b.x, y: b.y });
      await p.click(b.x, b.y);
    }
    await sleep(200);
    const idx = await p.eval(`Number(document.querySelector(${JSON.stringify(car)}).dataset.photoIndex)`);
    if (idx !== i + 1) {
      fail(`${view.name} ${surface} ${roomId}: ${view.name === "390" ? "swipe" : "arrow"} ${i + 1} left index at ${idx}`);
      break;
    }
  }
  if (new Set(row.keys).size !== row.keys.length) fail(`${view.name} ${surface} ${roomId}: duplicate photograph ${row.keys}`);
  // G2's Bare Chic One file (1.55.png) is stored under the folder "bare-chic"; its record id is bare-chic-one-1-55.
  row.keys = row.keys.map((k) => (k === "bare-chic" ? "bare-chic-one-1-55" : k));
  if (exp && JSON.stringify(row.keys) !== JSON.stringify(exp.accessibleNowIds)) fail(`${view.name} ${surface} ${roomId}: order/content ${row.keys} ≠ ${exp.accessibleNowIds}`);
  if (row.broken.length) fail(`${view.name} ${surface} ${roomId}: broken ${row.broken}`);
  if (row.distorted.length) fail(`${view.name} ${surface} ${roomId}: object-fit ${row.distorted}`);
  // Full-screen viewer from the photograph: its position label must say "n/total".
  await p.eval(`document.querySelector(${JSON.stringify(car)} + " button[aria-label^='Mở thư viện']").click()`);
  await sleep(400);
  row.viewer = await p.eval(`(() => { const d = [...document.querySelectorAll("dialog[open]")].pop(); return d ? (d.textContent.match(/\\d+\\s*\\/\\s*(\\d+)/) || [])[1] ?? "open" : null; })()`);
  if (row.viewer !== String(total)) fail(`${view.name} ${surface} ${roomId}: viewer shows "${row.viewer}" for ${total}`);
  await p.key("Escape");
  await sleep(200);
  results.rooms.push(row);
}

console.log(await launch());
for (const view of VIEWS) {
  const p = await Page.open();
  await p.viewport(view.w, view.h, view.dpr, view.mobile);
  const errors = [];
  p.on("Runtime.exceptionThrown", (e) => errors.push(e.exceptionDetails?.exception?.description ?? e.exceptionDetails?.text));
  p.on("Network.responseReceived", (e) => e.response.status >= 400 && /dev-client-media|_next\/image/.test(e.response.url) && errors.push(`${e.response.status} ${e.response.url}`));

  // Booking Results, every property.
  for (const property of PROPERTIES) {
    await p.goto(`${BASE}/dev/demo/tim-phong?property=${property}&${STAY}&rooms=1&adults=2`, { settle: 1800 });
    await p.eval(HIDE_DEV);
    const ids = await p.eval(`[...document.querySelectorAll("ul[aria-label='Danh sách phòng'] > li")].map(li => li.id.replace(/^phong-/, ""))`);
    for (const id of ids) {
      await walkCard(p, view, `ul[aria-label='Danh sách phòng'] > li#phong-${id}`, id, "booking-results");
      // Room detail drawer: its counter.
      const drawer = await p.eval(`(async () => { const li = document.getElementById("phong-${id}"); const b = li.querySelector("button[aria-haspopup=dialog]"); if (!b) return null; b.click(); await new Promise(r => setTimeout(r, 400)); const d = li.querySelector("dialog[open]"); const m = d?.textContent.match(/(\\d+)\\s*\\/\\s*(\\d+)/); const n = d ? (m ? Number(m[2]) : d.querySelector("img") ? 1 : 0) : null; d?.close(); return n; })()`);
      const row = results.rooms.at(-1);
      row.drawer = drawer;
      if (drawer !== null && drawer !== row.total) fail(`${view.name} drawer ${id}: ${drawer} vs ${row.total}`);
    }
    if (view.name !== "768" && (property === "bare-chic" || property === "pepper-house")) {
      await p.eval(`document.querySelector("ul[aria-label='Danh sách phòng']").scrollIntoView({ block: "start", behavior: "instant" }); scrollBy(0, -90)`);
      await sleep(900);
      await p.shot(`${OUT}/booking-${property}-${view.name}.jpg`, { quality: 84 });
    }
  }

  // Property pages: room cards and "Xem tất cả … ảnh".
  for (const [slug, path] of [["bare-chic", `/dev/stays/bare-chic?view=demo&${STAY}&adults=2`], ["the-nang-suites", `/dev/stays/the-nang-suites?${STAY}&adults=2`]]) {
    await p.goto(BASE + path, { settle: 2000 });
    await p.eval(HIDE_DEV);
    const ids = await p.eval(`[...document.querySelectorAll("#rooms li[data-room-id]")].map(li => li.dataset.roomId)`);
    for (const id of ids) await walkCard(p, view, `#rooms li[data-room-id='${id}']`, id, `page-${slug}`);
    const label = await p.eval(`[...document.querySelectorAll("button")].map(b => b.textContent.trim()).find(t => /^Xem tất cả \\d+ ảnh$/.test(t)) ?? null`);
    await p.eval(`[...document.querySelectorAll("button")].find(b => /^Xem tất cả \\d+ ảnh$/.test(b.textContent.trim()))?.click()`);
    await sleep(900);
    const groups = await p.eval(`(() => { const d = [...document.querySelectorAll("dialog[open]")].pop(); if (!d) return null; return [...d.querySelectorAll("section[aria-label]")].map(s => ({ label: s.getAttribute("aria-label"), imgs: s.querySelectorAll("img").length })); })()`);
    const sum = (groups ?? []).reduce((n, g) => n + g.imgs, 0);
    const expectedSum = audit.filter((r) => r.propertyId === slug).reduce((n, r) => n + r.accessibleNow, 0);
    results.viewers.push({ view: view.name, page: slug, label, groups, sum, expectedSum });
    if (Number(label?.match(/\d+/)?.[0]) !== expectedSum || sum !== expectedSum) fail(`${view.name} ${slug}: "${label}", viewer holds ${sum}, audit ${expectedSum}`);
    if (view.name !== "768") {
      await sleep(600);
      await p.shot(`${OUT}/all-photos-${slug}-${view.name}.jpg`, { quality: 84 });
    }
    await p.key("Escape");
  }
  if (errors.length) fail(`${view.name} errors: ${errors.slice(0, 5).join(" | ")}`);
  console.log(view.name, "done", results.rooms.filter((r) => r.view === view.name).length, "cards");
  await p.close();
}
writeFileSync(`${DIR}/ui-counts.json`, JSON.stringify(results, null, 2) + "\n");
console.log(results.failures.length ? `${results.failures.length} FAILURES` : "ALL PASS");
quit();
