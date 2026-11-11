// Short recordings of real input on each concept, 390 and 1440 px: animated WebP plus a GIF.
// Usage: node docs/qa/brand-collection/scripts/record.mjs
import { statSync } from "node:fs";
import { BASE, HIDE_DEV, launch, OUT, Page, quit, ROUTES, sharp, sleep } from "./lib.mjs";

const center = (sel) => `(() => { const e = ${sel}; const b = e.getBoundingClientRect(); return { x: Math.round(b.left + b.width / 2), y: Math.round(b.top + b.height / 2) }; })()`;
const brandA = (name) => `document.querySelector('section [aria-label^="${name}"]')`;
const brandB = (name) => `document.querySelector('[role=radio][aria-label^="${name}"]')`;
const city = (name) => `document.querySelector('[role=group][aria-label="Thành phố"] [aria-label^="${name}"]')`;
const RESET = `[...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "Bỏ lọc")`;
const KEYS = { ArrowRight: 39, ArrowDown: 40, Home: 36, Tab: 9 };

async function record(name, view, route, outWidth, script) {
  const p = await Page.open();
  await p.viewport(view.w, view.h, 1, view.mobile);
  await p.goto(BASE + ROUTES[route], { settle: 1200 });
  await p.eval(HIDE_DEV);
  await p.eval(`scrollTo(0, Math.round(document.querySelector("section").getBoundingClientRect().top + scrollY) - ${view.mobile ? 0 : 40})`);
  await sleep(400);
  const frames = [];
  p.on("Page.screencastFrame", (e) => { frames.push({ t: e.metadata.timestamp, data: Buffer.from(e.data, "base64") }); p.send("Page.screencastFrameAck", { sessionId: e.sessionId }).catch(() => undefined); });
  await p.send("Page.startScreencast", { format: "jpeg", quality: 85, everyNthFrame: 1 });
  await sleep(900);
  const act = async (sel) => { const c = await p.eval(center(sel)); if (view.mobile) await p.tap(c.x, c.y); else await p.click(c.x, c.y); };
  await script(p, act);
  await sleep(700);
  await p.send("Page.stopScreencast");
  await p.close();
  // An even 10 frames a second: the screencast only sends a frame when something changed.
  const fps = 10, t0 = frames[0].t, t1 = frames.at(-1).t + 0.6;
  const picked = [];
  for (let t = t0, i = 0; t <= t1; t += 1 / fps) { while (i + 1 < frames.length && frames[i + 1].t <= t) i++; picked.push(frames[i].data); }
  const delay = picked.map(() => Math.round(1000 / fps));
  const scaled = await Promise.all(picked.map((b) => sharp(b).resize({ width: outWidth }).png().toBuffer()));
  await sharp(scaled, { join: { animated: true } }).webp({ quality: 74, effort: 4, loop: 0, delay }).toFile(`${OUT}/${name}.webp`);
  const small = await Promise.all(picked.map((b) => sharp(b).resize({ width: Math.round(outWidth * 0.75) }).png().toBuffer()));
  await sharp(small, { join: { animated: true } }).gif({ loop: 0, delay, effort: 7, colours: 128, dither: 0.5 }).toFile(`${OUT}/${name}.gif`);
  console.log(name, { seconds: +(t1 - t0).toFixed(1), frames: picked.length, webpKb: Math.round(statSync(`${OUT}/${name}.webp`).size / 1024), gifKb: Math.round(statSync(`${OUT}/${name}.gif`).size / 1024) });
}

const PHONE = { w: 390, h: 844, mobile: true };
const DESK = { w: 1440, h: 900, mobile: false };

console.log(await launch());
// The same story on every recording: Bare, then Đà Nẵng, then a brand that is not in Đà Nẵng, then back to all.
for (const [route, view, width, brand] of [["a", PHONE, 390, brandA], ["a", DESK, 960, brandA], ["b", PHONE, 390, brandB], ["b", DESK, 960, brandB]]) {
  await record(`${route}-${view.w}-recording`, view, route, width, async (p, act) => {
    await act(brand("Bare Boutique Stays")); await sleep(1500);
    // Concept B on a phone has City as a native select; its picker is the operating system's, so the choice is set directly.
    if (await p.eval(`getComputedStyle(document.querySelector("[class*=geoCompact]") ?? document.body).display !== "none" && !!document.querySelector("[class*=geoCompact]")`)) {
      await p.eval(`(() => { const s = document.querySelector("[class*=geoCompact] select"); s.focus(); s.value = "da-nang"; s.dispatchEvent(new Event("change", { bubbles: true })); })()`);
    } else await act(city("Đà Nẵng"));
    await sleep(1500);
    await act(brand("The Nắng Suites")); await sleep(1300);
    await act(brand("Pepper House")); await sleep(1900);
    await act(RESET); await sleep(1200);
    if (!view.mobile) await p.eval(`scrollTo({ top: Math.round(document.querySelector("section").getBoundingClientRect().top + scrollY) - 40, behavior: "smooth" })`);
  });
}
// Keyboard only, concept B's radio group at 1440: arrows move and choose.
await record("b-1440-keyboard", DESK, "b", 960, async (p) => {
  await p.eval(`document.querySelector("[role=radio][aria-checked=true]").focus()`);
  await sleep(600);
  for (let i = 0; i < 4; i++) { await p.key("ArrowDown", { vk: KEYS.ArrowDown }); await sleep(1100); }
  await p.key("Tab", { vk: KEYS.Tab }); await sleep(500);
  await p.key("Tab", { vk: KEYS.Tab }); await sleep(500);
  await p.key("Tab", { vk: KEYS.Tab }); await sleep(500);
  await p.key("Enter"); await sleep(1300);
});
quit();
