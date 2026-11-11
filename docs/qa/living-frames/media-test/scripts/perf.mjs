import { writeFileSync } from "node:fs";
import { BASE, launch, Page, quit, ROUTES, sleep, STAY } from "./lib.mjs";
console.log(await launch());
const OBSERVE = `(() => {
  const m = (window.__m = { lcp: [], fcp: null, cls: 0, shifts: [] });
  m.video = [];
  for (const type of ["loadstart", "playing", "waiting", "pause", "ended", "error"]) document.addEventListener(type, (e) => { if (e.target.tagName === "VIDEO") m.video.push([type, Math.round(performance.now()), +e.target.currentTime.toFixed(2)]); }, true);
  new PerformanceObserver((l) => { for (const e of l.getEntries()) m.lcp.push({ t: Math.round(e.startTime), size: e.size, el: e.element ? e.element.tagName + " " + ((e.element.currentSrc || e.url || "").split("/").pop() || (e.element.textContent || "").trim().slice(0, 30)) : "(gone) " + (e.url || "").split("/").pop(), load: Math.round(e.loadTime), render: Math.round(e.renderTime) }); }).observe({ type: "largest-contentful-paint", buffered: true });
  new PerformanceObserver((l) => { for (const e of l.getEntries()) if (e.name === "first-contentful-paint") m.fcp = Math.round(e.startTime); }).observe({ type: "paint", buffered: true });
  new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) { m.cls += e.value; m.shifts.push({ v: +e.value.toFixed(4), t: Math.round(e.startTime), nodes: (e.sources || []).map((s) => s.node && (s.node.className || s.node.tagName)).slice(0, 3) }); } }).observe({ type: "layout-shift", buffered: true });
})()`;
const PROFILES = [
  { name: "phone 390x844 @3x, slow 4G, 4x CPU", w: 390, h: 844, dpr: 3, mobile: true, network: true, cpu: 4, runs: 3 },
  { name: "phone 390x844 @3x, no throttling", w: 390, h: 844, dpr: 3, mobile: true, network: false, cpu: 1, runs: 3 },
  { name: "tablet 768x1024 @2x, slow 4G, 4x CPU", w: 768, h: 1024, dpr: 2, mobile: true, network: true, cpu: 4, runs: 3 },
  { name: "desktop 1440x900 @2x, slow 4G, no CPU slowdown", w: 1440, h: 900, dpr: 2, mobile: false, network: true, cpu: 1, runs: 3 },
  { name: "desktop 1440x900 @2x, no throttling", w: 1440, h: 900, dpr: 2, mobile: false, network: false, cpu: 1, runs: 3 },
];
const median = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
const results = [];
for (const profile of PROFILES) {
  for (const route of ["drawn", "a", "b"]) {
    const runs = [];
    for (let i = 0; i < profile.runs; i++) {
      const p = await Page.open();
      await p.viewport(profile.w, profile.h, profile.dpr, profile.mobile);
      await p.throttle(profile);
      await p.send("Page.addScriptToEvaluateOnNewDocument", { source: OBSERVE });
      const req = new Map();
      let t0 = null;
      p.on("Network.requestWillBeSent", (e) => { if (t0 === null) t0 = e.timestamp; req.set(e.requestId, { url: e.request.url, start: Math.round((e.timestamp - t0) * 1000), bytes: 0, range: e.request.headers.Range ?? e.request.headers.range }); });
      p.on("Network.loadingFinished", (e) => { const r = req.get(e.requestId); if (r) { r.bytes = e.encodedDataLength; r.end = Math.round((e.timestamp - t0) * 1000); } });
      p.on("Network.dataReceived", (e) => { const r = req.get(e.requestId); if (r && !r.end) r.partial = (r.partial ?? 0) + e.encodedDataLength; });
      let loadAt = null;
      p.on("Page.loadEventFired", (e) => { loadAt = Math.round((e.timestamp - t0) * 1000); });
      await p.goto(BASE + ROUTES[route] + STAY, { settle: 300 });
      // Until the clip has played through (or, for the looping drawn clip, has been playing for a while).
      let v;
      const began = Date.now();
      for (;;) {
        v = await p.eval(`(() => { const v = document.querySelector("video"); return { src: (v.currentSrc || "").split("/").pop(), t: +v.currentTime.toFixed(2), ended: v.ended, paused: v.paused, ready: v.readyState, shown: v.hasAttribute("data-on"), stalls: window.__stalls ?? 0 }; })()`);
        if (v.ended || (route === "drawn" && v.t > 4) || Date.now() - began > 45000) break;
        await sleep(250);
      }
      const playedAfter = Date.now() - began;
      const m = await p.eval(`window.__m`);
      const atLoad = { cls: +m.cls.toFixed(4) };
      // A real scroll to the foot of the page and back.
      await p.eval(`(async () => { const h = document.documentElement.scrollHeight; for (let y = 0; y < h; y += 400) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 150)); } await new Promise((r) => setTimeout(r, 800)); scrollTo(0, 0); await new Promise((r) => setTimeout(r, 500)); return true; })()`);
      const m2 = await p.eval(`window.__m`);
      const nav = await p.eval(`(() => { const n = performance.getEntriesByType("navigation")[0]; return { ttfb: Math.round(n.responseStart), dcl: Math.round(n.domContentLoadedEventEnd), load: Math.round(n.loadEventEnd) }; })()`);
      const all = [...req.values()];
      const pick = (re) => all.filter((r) => re.test(r.url)).map((r) => ({ file: r.url.split("/").pop().split("?")[0], kb: +(((r.bytes || r.partial || 0)) / 1024).toFixed(1), start: r.start, end: r.end ?? null, range: r.range }));
      const lcp = m.lcp.at(-1);
      runs.push({
        lcp: lcp?.t, lcpElement: lcp?.el, lcpSize: lcp?.size, lcpCandidates: m.lcp.map((e) => `${e.t} ms ${e.el}`), fcp: m.fcp, nav,
        videoEvents: m2.video, firstPlayingMs: m2.video.find((e) => e[0] === "playing")?.[1] ?? null, waitsAfterStart: (() => { const i = m2.video.findIndex((e) => e[0] === "playing"); return i < 0 ? null : m2.video.slice(i + 1).filter((e) => e[0] === "waiting").length; })(), endedMs: m2.video.find((e) => e[0] === "ended")?.[1] ?? null,
        clsAtLoad: atLoad.cls, clsAfterScroll: +m2.cls.toFixed(4), shifts: m2.shifts,
        pictures: pick(/dev-fixtures\/.*\.(avif|webp|jpg|svg)/), video: pick(/\.mp4/), videoState: v, clipFinishedMsAfterLoad: v.ended ? playedAfter : null,
        bytesBeforeLoadKb: +(all.filter((r) => r.end !== undefined && r.end <= (loadAt ?? 1e9)).reduce((a, r) => a + r.bytes, 0) / 1024).toFixed(1),
        totalKb: +(all.reduce((a, r) => a + (r.bytes || r.partial || 0), 0) / 1024).toFixed(1), requests: all.length,
      });
      await p.close();
    }
    const r = { profile: profile.name, route, clipFirstPlayingMs: runs.map((x) => x.firstPlayingMs), clipWaitsAfterStart: runs.map((x) => x.waitsAfterStart), clipEndedMs: runs.map((x) => x.endedMs), lcpMs: median(runs.map((x) => x.lcp)), lcpRuns: runs.map((x) => x.lcp), lcpElement: runs[0].lcpElement, fcpMs: median(runs.map((x) => x.fcp)), clsAtLoad: Math.max(...runs.map((x) => x.clsAtLoad)), clsAfterScroll: Math.max(...runs.map((x) => x.clsAfterScroll)), firstRun: runs[0] };
    results.push(r);
    console.log(profile.name, "|", route, "| LCP", r.lcpMs, r.lcpRuns, r.lcpElement, "| FCP", r.fcpMs, "| CLS", r.clsAtLoad, r.clsAfterScroll, "| pics", runs[0].pictures.map((x) => `${x.file} ${x.kb}KB @${x.start}`).join(", "), "| video", runs[0].video.map((x) => `${x.file} ${x.kb}KB @${x.start}-${x.end}`).join(", "), "| state", JSON.stringify(runs[0].videoState), "| firstPlaying", runs.map((x) => x.firstPlayingMs), "waits", runs.map((x) => x.waitsAfterStart), "ended", runs.map((x) => x.endedMs), "| beforeLoad", runs[0].bytesBeforeLoadKb, "total", runs[0].totalKb);
  }
}
writeFileSync(new URL("./perf.json", import.meta.url), JSON.stringify(results, null, 1));
quit();
