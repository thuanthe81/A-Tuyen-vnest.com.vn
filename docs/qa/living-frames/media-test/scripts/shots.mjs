import { writeFileSync } from "node:fs";
import { BASE, GEOMETRY, launch, OUT, Page, quit, ROUTES, sharp, sleep, STAY } from "./lib.mjs";
console.log(await launch());
const VIEWS = [
  { name: "390", w: 390, h: 844, dpr: 2, mobile: true },
  { name: "768", w: 768, h: 1024, dpr: 2, mobile: true },
  { name: "1440", w: 1440, h: 900, dpr: 1, mobile: false },
];
const EXTRA = [
  { name: "360x640", w: 360, h: 640, dpr: 2, mobile: true },
  { name: "1024", w: 1024, h: 768, dpr: 1, mobile: false },
  { name: "1280", w: 1280, h: 800, dpr: 1, mobile: false },
  { name: "1920", w: 1920, h: 1080, dpr: 1, mobile: false },
];
const geometry = {};
const buffers = {};
async function waitPictures(p) {
  await p.eval(`Promise.all([...document.querySelectorAll("main img")].filter((i) => i.getBoundingClientRect().top < innerHeight * 1.5).map((i) => i.decode().catch(() => null)))`);
  await p.eval(`document.fonts.ready.then(() => true)`);
}
for (const view of [...VIEWS, ...EXTRA]) {
  const main = VIEWS.includes(view);
  for (const route of Object.keys(ROUTES)) {
    if (!main && route === "drawn") continue;
    // 1. Still: nothing plays (reduced motion), which is also what a guest sees before, or without, the clip.
    let p = await Page.open();
    await p.viewport(view.w, view.h, view.dpr, view.mobile);
    await p.media({ "prefers-reduced-motion": "reduce" });
    await p.goto(BASE + ROUTES[route] + STAY, { settle: 1200 });
    await waitPictures(p);
    await sleep(400);
    geometry[`${route}-${view.name}-static`] = await p.eval(GEOMETRY);
    buffers[`${route}-${view.name}-static`] = await p.shot(`${OUT}/${route}-${view.name}-static.jpg`);
    if (main) {
      // The whole page, with the screen made as tall as the page so every section has arrived.
      const height = await p.eval(`document.documentElement.scrollHeight`);
      await p.viewport(view.w, height, view.dpr, view.mobile);
      await sleep(300);
      await p.eval(`(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 600) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); } scrollTo(0, 0); await new Promise((r) => setTimeout(r, 300)); await Promise.all([...document.querySelectorAll("main img")].map((i) => i.decode().catch(() => null))); return true; })()`);
      await p.shot(`${OUT}/${route}-${view.name}-full.jpg`, { quality: 84 });
    }
    await p.close();
    if (route === "drawn" || !main) continue;
    // 2. Played through: the clip's last frame, held.
    p = await Page.open();
    await p.viewport(view.w, view.h, view.dpr, view.mobile);
    await p.goto(BASE + ROUTES[route] + STAY, { settle: 800 });
    await p.eval(`document.fonts.ready.then(() => true)`);
    let mid = false;
    for (let i = 0; i < 80; i++) {
      const v = await p.eval(`(() => { const v = document.querySelector("video"); return { t: v.currentTime, ended: v.ended, paused: v.paused }; })()`);
      if (!mid && v.t > 2.2) {
        mid = true;
        await p.shot(`${OUT}/${route}-${view.name}-playing.jpg`);
      }
      if (v.ended) break;
      await sleep(200);
    }
    await sleep(500);
    geometry[`${route}-${view.name}-held`] = await p.eval(GEOMETRY);
    buffers[`${route}-${view.name}-held`] = await p.shot(`${OUT}/${route}-${view.name}-held.jpg`);
    await p.close();
  }
}

// Supporting frames at twice the size, as a 2x screen draws them: what can be made out in each.
for (const [w, h] of [[1440, 900], [768, 1024]]) {
  for (const route of ["a", "b"]) {
    const p = await Page.open();
    await p.viewport(w, h, 2, false);
    await p.media({ "prefers-reduced-motion": "reduce" });
    await p.goto(BASE + ROUTES[route] + STAY, { settle: 1200 });
    await waitPictures(p);
    const g = await p.eval(GEOMETRY);
    const [up, sq] = g.frames;
    const x = sq.x - 8, y = up.y - 8;
    buffers[`legibility-${w}-${route}`] = await p.shot(null, { clip: { x, y, width: up.x + up.w - sq.x + 16, height: up.h + 52 } });
    await p.close();
  }
}

// ---------- comparisons ----------
const label = (text, width) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="44"><rect width="100%" height="100%" fill="#161614"/><text x="16" y="29" font-family="Helvetica, Arial, sans-serif" font-size="19" font-weight="600" fill="#fff">${text}</text></svg>`);
async function row(file, items, { scale = 1, gap = 12 } = {}) {
  const tiles = [];
  for (const [text, buffer] of items) {
    const m = await sharp(buffer).metadata();
    const w = Math.round(m.width * scale);
    const img = await sharp(buffer).resize({ width: w }).png().toBuffer();
    const mm = await sharp(img).metadata();
    tiles.push({ w, h: mm.height + 44, buffer: await sharp({ create: { width: w, height: mm.height + 44, channels: 3, background: "#161614" } }).composite([{ input: label(text, w), left: 0, top: 0 }, { input: img, left: 0, top: 44 }]).png().toBuffer() });
  }
  const W = tiles.reduce((a, t) => a + t.w + gap, -gap), H = Math.max(...tiles.map((t) => t.h));
  let x = 0;
  await sharp({ create: { width: W, height: H, channels: 3, background: "#ffffff" } }).composite(tiles.map((t) => { const left = x; x += t.w + gap; return { input: t.buffer, left, top: 0 }; })).jpeg({ quality: 88, mozjpeg: true }).toFile(`${OUT}/${file}`);
}
await row("compare-1440-illustrated-a-b.jpg", [["Illustrated (as reviewed 12/10)", buffers["drawn-1440-static"]], ["A · approved media, current geometry", buffers["a-1440-static"]], ["B · approved media, larger supporting frames", buffers["b-1440-static"]]], { scale: 0.7 });
await row("compare-1440-a-b.jpg", [["A · current geometry (130 : 174 : 864)", buffers["a-1440-static"]], ["B · adjusted (160 : 212 : 796)", buffers["b-1440-static"]]], { scale: 1 });
await row("compare-768-illustrated-a-b.jpg", [["Illustrated", buffers["drawn-768-static"]], ["A", buffers["a-768-static"]], ["B", buffers["b-768-static"]]], { scale: 0.5 });
await row("compare-390-illustrated-media.jpg", [["Illustrated", buffers["drawn-390-static"]], ["Approved media (A and B are the same page here)", buffers["a-390-static"]]], { scale: 0.5 });
await row("compare-static-vs-held-1440-b.jpg", [["B · still: the poster, no playback", buffers["b-1440-static"]], ["B · after the clip: its last frame, held", buffers["b-1440-held"]]], { scale: 1 });
await row("compare-static-vs-held-390.jpg", [["Still: the poster, no playback", buffers["a-390-static"]], ["After the clip: its last frame, held", buffers["a-390-held"]]], { scale: 0.5 });
await row("legibility-1440-a-vs-b-at-2x.jpg", [["A at 1440: 174 by 217 and 130 by 130 (drawn at 2x)", buffers["legibility-1440-a"]], ["B at 1440: 212 by 265 and 160 by 160 (drawn at 2x)", buffers["legibility-1440-b"]]]);
await row("legibility-768-a-vs-b-at-2x.jpg", [["A at 768", buffers["legibility-768-a"]], ["B at 768", buffers["legibility-768-b"]]]);

// ---------- are A and B the same page on a phone, and is the drawn page what it was? ----------
async function diff(a, b) {
  const [x, y] = await Promise.all([a, b].map((i) => sharp(i).removeAlpha().raw().toBuffer({ resolveWithObject: true })));
  if (x.info.width !== y.info.width || x.info.height !== y.info.height) return { sameSize: false, a: [x.info.width, x.info.height], b: [y.info.width, y.info.height] };
  let n = 0;
  for (let i = 0; i < x.data.length; i += 3) if (Math.abs(x.data[i] - y.data[i]) > 8 || Math.abs(x.data[i + 1] - y.data[i + 1]) > 8 || Math.abs(x.data[i + 2] - y.data[i + 2]) > 8) n++;
  return { sameSize: true, pixels: x.info.width * x.info.height, differing: n, share: +(n / (x.info.width * x.info.height)).toFixed(5) };
}
const checks = {
  "a vs b at 390 (still)": await diff(buffers["a-390-static"], buffers["b-390-static"]),
  "a vs b at 360x640 (still)": await diff(buffers["a-360x640-static"], buffers["b-360x640-static"]),
  "drawn at 1440 today vs refine-01/after-1440x900.png (12/10)": await diff(buffers["drawn-1440-static"], "/Users/noe/Documents/GitHub/VNest 2/docs/qa/living-frames/refine-01/after-1440x900.png"),
  "drawn at 390 today vs refine-01/after-390x844.png (12/10)": await diff(buffers["drawn-390-static"], "/Users/noe/Documents/GitHub/VNest 2/docs/qa/living-frames/refine-01/after-390x844.png"),
  "drawn at 768 today vs refine-01/after-768x1024.png (12/10)": await diff(buffers["drawn-768-static"], "/Users/noe/Documents/GitHub/VNest 2/docs/qa/living-frames/refine-01/after-768x1024.png"),
};
writeFileSync(new URL("./geometry.json", import.meta.url), JSON.stringify({ geometry, checks }, null, 1));
console.log(JSON.stringify(checks, null, 1));
for (const [k, g] of Object.entries(geometry)) console.log(k, JSON.stringify({ show: [g.showcase.w, g.showcase.h, g.showcase.poster, g.showcase.posterCrop], frames: g.frames.map((f) => [f.w, f.h, f.shareOfShowcaseArea, f.file]), idGap: g.identityBottomToUprightTop, topOffset: g.showcaseTopMinusIdentityTop, h1: [g.h1.lines, g.h1.size], cta: [g.cta.y, g.cta.inFirstScreen, g.cta.bottomFromFold], inFirst: g.framesInFirstScreen, ov: g.overflowPx, video: g.video && [g.video.src, g.video.ended, g.video.t], toggle: g.toggle }));
quit();
