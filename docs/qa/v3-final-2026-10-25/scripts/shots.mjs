// VNest V3 final refinement (25/10/2026): room cards (rest / hover / keyboard focus), location module
// and footer at 1440 and 390 (plus 768 for the location and footer).
//   BASE=http://localhost:3402 node docs/qa/v3-final-2026-10-25/scripts/shots.mjs
// Against `next start`. Headless Chrome emulation, not a physical device.
import { mkdirSync } from "node:fs";
import { pathToFileURL } from "node:url";
const ROOT = "/Users/noe/Documents/GitHub/VNest 2";
const { launch, quit, Page, sleep } = await import(pathToFileURL(`${ROOT}/docs/qa/brand-collection/scripts/lib.mjs`).href);
const BASE = process.env.BASE ?? "http://localhost:3402";
const OUT = `${ROOT}/docs/qa/v3-final-2026-10-25/shots`;
mkdirSync(OUT, { recursive: true });
const VIEWS = [
  { name: "1440", w: 1440, h: 900, dpr: 1, mobile: false },
  { name: "768", w: 768, h: 1024, dpr: 1, mobile: true },
  { name: "390", w: 390, h: 844, dpr: 2, mobile: true },
];
const PAGES = [
  ["bare-chic", "/dev/stays/bare-chic?view=demo&checkIn=2026-11-06&checkOut=2026-11-08&adults=2"],
  ["the-nang-suites", "/dev/stays/the-nang-suites?checkIn=2026-11-06&checkOut=2026-11-08&adults=2"],
];
/** Element screenshot: scroll it to the top area, then clip in viewport coordinates. */
async function element(p, js, file, pad = 0) {
  const r = await p.eval(`(async () => { const e = ${js}; if (!e) return null; e.scrollIntoView({ block: "start", behavior: "instant" }); scrollBy(0, -96); await new Promise(r => setTimeout(r, 700)); const b = e.getBoundingClientRect(); return { x: Math.max(0, b.x - ${pad}) + scrollX, y: Math.max(0, b.y - ${pad}) + scrollY, width: Math.min(innerWidth, b.width + ${pad} * 2), height: Math.min(innerHeight - Math.max(0, b.y - ${pad}), b.height + ${pad} * 2) }; })()`);
  if (!r) return console.log("missing", file);
  await p.shot(`${OUT}/${file}`, { clip: r });
}
console.log(await launch());
for (const view of VIEWS) {
  const p = await Page.open();
  await p.viewport(view.w, view.h, view.dpr, view.mobile);
  for (const [slug, path] of PAGES) {
    await p.goto(BASE + path, { settle: 2200 });
    const card = `document.querySelector("#rooms li[data-room-id]")`;
    if (view.name !== "768") {
      await element(p, card, `${view.name}-${slug}-room-card.jpg`);
      if (!view.mobile) {
        // Scroll first, then hover, then clip in place, so the pointer stays over the strip.
        const footer = `document.querySelector("#rooms li[data-room-id] [class*=roomActionsFooter]")`;
        await p.eval(`(async () => { ${footer}.scrollIntoView({ block: "center", behavior: "instant" }); await new Promise(r => setTimeout(r, 500)); })()`);
        const clipNow = async () => p.eval(`(() => { const b = ${footer}.getBoundingClientRect(); return { x: b.x - 16 + scrollX, y: b.y - 16 + scrollY, width: b.width + 32, height: b.height + 32 }; })()`);
        await p.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 5, y: 5 });
        await sleep(300);
        await p.shot(`${OUT}/${view.name}-${slug}-cta-rest.jpg`, { clip: await clipNow() });
        const strip = await p.eval(`(() => { const b = document.querySelector("#rooms li[data-room-id] [class*=bookingStrip]").getBoundingClientRect(); return { x: b.x + 40, y: b.y + b.height / 2 }; })()`);
        await p.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: strip.x, y: strip.y });
        await sleep(400);
        await p.shot(`${OUT}/${view.name}-${slug}-cta-hover.jpg`, { clip: await clipNow() });
        await p.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 5, y: 5 });
        await sleep(300);
        await p.eval(`document.querySelector("#rooms li[data-room-id] [data-testid^=select-room]").focus({ focusVisible: true })`);
        await sleep(300);
        await p.shot(`${OUT}/${view.name}-${slug}-cta-focus.jpg`, { clip: await clipNow() });
      }
    }
    await p.eval(`(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { scrollTo(0, y); await new Promise(r => setTimeout(r, 40)); } })()`);
    await element(p, `document.getElementById("vi-tri")`, `${view.name}-${slug}-location.jpg`);
  }
  await element(p, `document.querySelector("footer")`, `${view.name}-footer.jpg`);
  console.log(view.name, "done");
  await p.close();
}
quit();
