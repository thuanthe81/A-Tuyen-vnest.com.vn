import { statSync } from "node:fs";
import { BASE, launch, OUT, Page, quit, ROUTES, sharp, sleep, STAY } from "./lib.mjs";
console.log(await launch());
const center = (sel) => `(() => { const e = ${sel}; const b = e.getBoundingClientRect(); return { x: Math.round(b.left + b.width / 2), y: Math.round(b.top + b.height / 2) }; })()`;
const ended = async (p) => { for (let i = 0; i < 80; i++) { if (await p.eval(`document.querySelector("video").ended`)) return; await sleep(150); } };

async function record(name, view, route, outWidth, script) {
  const p = await Page.open();
  await p.viewport(view.w, view.h, 1, view.mobile);
  const frames = [];
  p.on("Page.screencastFrame", (e) => { frames.push({ t: e.metadata.timestamp, data: Buffer.from(e.data, "base64") }); p.send("Page.screencastFrameAck", { sessionId: e.sessionId }).catch(() => undefined); });
  await p.send("Page.startScreencast", { format: "jpeg", quality: 82, everyNthFrame: 1 });
  await p.goto(BASE + ROUTES[route] + STAY, { settle: 200 });
  await script(p);
  await p.send("Page.stopScreencast");
  await p.close();
  // Onto an even 8 frames a second: the screencast only sends a frame when something changed.
  const fps = 8, t0 = frames[0].t, t1 = frames.at(-1).t + 0.6;
  const picked = [];
  for (let t = t0, i = 0; t <= t1; t += 1 / fps) { while (i + 1 < frames.length && frames[i + 1].t <= t) i++; picked.push(frames[i].data); }
  const scaled = await Promise.all(picked.map((b) => sharp(b).resize({ width: outWidth }).png().toBuffer()));
  const delay = scaled.map(() => Math.round(1000 / fps));
  await sharp(scaled, { join: { animated: true } }).webp({ quality: 72, effort: 4, loop: 0, delay }).toFile(`${OUT}/${name}.webp`);
  const small = await Promise.all(picked.map((b) => sharp(b).resize({ width: Math.round(outWidth * 0.75) }).png().toBuffer()));
  await sharp(small, { join: { animated: true } }).gif({ loop: 0, delay, effort: 7, colours: 128, dither: 0.6 }).toFile(`${OUT}/${name}.gif`);
  console.log(name, { screencastFrames: frames.length, seconds: +(t1 - t0).toFixed(1), frames: picked.length, webpKb: Math.round(statSync(`${OUT}/${name}.webp`).size / 1024), gifKb: Math.round(statSync(`${OUT}/${name}.gif`).size / 1024) });
}

await record("recording-390-media", { w: 390, h: 844, mobile: true }, "a", 390, async (p) => {
  await ended(p);
  await sleep(1200);
  let c = await p.eval(center(`document.querySelector("main figure button[class*=toggle]")`));
  await p.tap(c.x, c.y); // play again
  await sleep(1600);
  await p.tap(c.x, c.y); // pause
  await sleep(900);
  await p.eval(`scrollTo({ top: 620, behavior: "smooth" })`);
  await sleep(1700);
  await p.eval(`scrollTo({ top: 0, behavior: "smooth" })`);
  await sleep(1300);
  c = await p.eval(center(`document.querySelector("main figure button[class*=all]")`));
  await p.tap(c.x, c.y); // every picture
  await sleep(1300);
  await p.eval(`document.querySelector('dialog[aria-label="Thư viện ảnh"]').scrollBy({ top: 560, behavior: "smooth" })`);
  await sleep(1400);
  await p.eval(`document.querySelector('dialog[aria-label="Thư viện ảnh"]').scrollBy({ top: 560, behavior: "smooth" })`);
  await sleep(1400);
  c = await p.eval(center(`[...document.querySelectorAll('dialog[aria-label="Thư viện ảnh"] button')].find((b) => b.textContent.trim() === "Đóng")`));
  await p.tap(c.x, c.y);
  await sleep(900);
  c = await p.eval(center(`document.getElementById("cta-inline")`));
  await p.tap(c.x, c.y); // the booking action
  await sleep(1800);
});

await record("recording-1440-media-b", { w: 1440, h: 900, mobile: false }, "b", 960, async (p) => {
  await ended(p);
  await sleep(1400);
  let c = await p.eval(center(`document.querySelector("main figure button[class*=toggle]")`));
  await p.click(c.x, c.y); // play again
  await sleep(2200);
  await p.click(c.x, c.y); // pause
  await sleep(900);
  c = await p.eval(center(`document.querySelector('button[aria-label^="Mở ảnh 2"]')`));
  await p.click(c.x, c.y); // the architecture frame
  await sleep(1500);
  await p.eval(`document.querySelector('dialog[aria-label="Thư viện ảnh"]').scrollBy({ top: 620, behavior: "smooth" })`);
  await sleep(1500);
  await p.key("Escape");
  await sleep(900);
  c = await p.eval(center(`document.getElementById("cta-inline")`));
  await p.click(c.x, c.y);
  await sleep(1800);
});
quit();
