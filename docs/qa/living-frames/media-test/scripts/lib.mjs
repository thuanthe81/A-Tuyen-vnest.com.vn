import { spawn } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
const require = createRequire("/Users/noe/Documents/GitHub/VNest 2/");
export const sharp = require("sharp");
export const BASE = "http://localhost:3300";
export const STAY = "?checkIn=2026-11-12&checkOut=2026-11-15&adults=2";
export const ROUTES = { drawn: "/dev/property-gallery/living-frames", a: "/dev/property-gallery/living-frames/media-a", b: "/dev/property-gallery/living-frames/media-b" };
export const OUT = "/Users/noe/Documents/GitHub/VNest 2/docs/qa/living-frames/media-test";
mkdirSync(OUT, { recursive: true });
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const PORT = 9333;
let chrome;

export async function launch() {
  // fileURLToPath, not URL.pathname: the repository folder name contains a space, which .pathname leaves as %20 (fixed 15/10/2026).
  const profile = fileURLToPath(new URL("./chrome-profile", import.meta.url));
  rmSync(profile, { recursive: true, force: true });
  chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", ["--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, "--hide-scrollbars", "--no-first-run", "--no-default-browser-check", "--disable-extensions", "--window-size=1440,900", "about:blank"], { stdio: "ignore" });
  for (let i = 0; i < 60; i++) {
    try {
      const v = await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json();
      return v.Browser;
    } catch {
      await sleep(250);
    }
  }
  throw new Error("Chrome did not start");
}
export function quit() {
  chrome?.kill();
}

export class Page {
  static async open() {
    const t = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: "PUT" })).json();
    const p = new Page();
    p.id = t.id;
    p.ws = new WebSocket(t.webSocketDebuggerUrl);
    p.seq = 0;
    p.pending = new Map();
    p.handlers = new Map();
    await new Promise((r, j) => {
      p.ws.onopen = r;
      p.ws.onerror = j;
    });
    p.ws.onmessage = (m) => {
      const d = JSON.parse(m.data);
      if (d.id) {
        const { resolve, reject } = p.pending.get(d.id);
        p.pending.delete(d.id);
        d.error ? reject(new Error(d.error.message)) : resolve(d.result);
      } else for (const fn of p.handlers.get(d.method) ?? []) fn(d.params);
    };
    for (const d of ["Page", "Runtime", "Network", "DOM"]) await p.send(`${d}.enable`);
    await p.send("Page.setLifecycleEventsEnabled", { enabled: true });
    return p;
  }
  send(method, params = {}) {
    const id = ++this.seq;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  on(event, fn) {
    if (!this.handlers.has(event)) this.handlers.set(event, []);
    this.handlers.get(event).push(fn);
  }
  once(event, timeout = 60000) {
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error(`timeout ${event}`)), timeout);
      const fn = (p) => {
        clearTimeout(t);
        this.handlers.set(event, this.handlers.get(event).filter((f) => f !== fn));
        resolve(p);
      };
      this.on(event, fn);
    });
  }
  async viewport(width, height, dpr = 1, mobile = false) {
    await this.send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: dpr, mobile });
    await this.send("Emulation.setTouchEmulationEnabled", mobile ? { enabled: true, maxTouchPoints: 5 } : { enabled: false });
  }
  async media(features = {}) {
    await this.send("Emulation.setEmulatedMedia", { features: Object.entries(features).map(([name, value]) => ({ name, value })) });
  }
  async throttle({ network = false, cpu = 1 } = {}) {
    await this.send("Network.setCacheDisabled", { cacheDisabled: true });
    // "slow 4G" as in the earlier rounds: 150 ms, 1.6 Mbit/s down, 750 kbit/s up.
    await this.send("Network.emulateNetworkConditions", network ? { offline: false, latency: 150, downloadThroughput: (1.6 * 1e6) / 8, uploadThroughput: (750 * 1e3) / 8 } : { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
    await this.send("Emulation.setCPUThrottlingRate", { rate: cpu });
  }
  async goto(url, { settle = 1500 } = {}) {
    const loaded = this.once("Page.loadEventFired", 90000);
    await this.send("Page.navigate", { url });
    await loaded;
    await sleep(settle);
  }
  async eval(expression) {
    const r = await this.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true, userGesture: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text);
    return r.result.value;
  }
  async shot(file, { full = false, clip, quality = 90 } = {}) {
    const params = { format: "png" };
    if (clip) params.clip = { ...clip, scale: 1 };
    if (full) {
      const m = await this.send("Page.getLayoutMetrics");
      params.clip = { x: 0, y: 0, width: m.cssContentSize.width, height: m.cssContentSize.height, scale: 1 };
      params.captureBeyondViewport = true;
    }
    const { data } = await this.send("Page.captureScreenshot", params);
    const buffer = Buffer.from(data, "base64");
    if (file) {
      if (file.endsWith(".png")) writeFileSync(file, buffer);
      else await sharp(buffer).jpeg({ quality, mozjpeg: true }).toFile(file);
    }
    return buffer;
  }
  async key(key, { code = key, shift = false, vk } = {}) {
    const map = { Tab: 9, Enter: 13, Escape: 27, " ": 32 };
    const base = { key, code: code === " " ? "Space" : code, windowsVirtualKeyCode: vk ?? map[key], modifiers: shift ? 8 : 0 };
    await this.send("Input.dispatchKeyEvent", { type: "keyDown", ...base, text: key === "Enter" ? "\r" : key === " " ? " " : undefined });
    await this.send("Input.dispatchKeyEvent", { type: "keyUp", ...base });
    await sleep(120);
  }
  async tap(x, y) {
    await this.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
    await this.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await sleep(250);
  }
  async click(x, y) {
    for (const type of ["mousePressed", "mouseReleased"]) await this.send("Input.dispatchMouseEvent", { type, x, y, button: "left", clickCount: 1 });
    await sleep(250);
  }
  async close() {
    this.ws.close();
    await fetch(`http://127.0.0.1:${PORT}/json/close/${this.id}`).catch(() => undefined);
  }
}

/** Runs in the page: where the first screen's pieces are. */
export const GEOMETRY = `(() => {
  const box = (e) => { if (!e) return null; const b = e.getBoundingClientRect(); return { x: Math.round(b.left), y: Math.round(b.top), w: Math.round(b.width), h: Math.round(b.height) }; };
  const figures = [...document.querySelectorAll("main figure")];
  const screen = figures[0].firstElementChild, img = screen.querySelector("img"), video = screen.querySelector("video");
  const frames = figures.slice(1, 3).map((f) => ({ label: f.querySelector("figcaption")?.textContent, ...box(f.querySelector("button")), file: f.querySelector("img")?.currentSrc.split("/").pop(), natural: [f.querySelector("img")?.naturalWidth, f.querySelector("img")?.naturalHeight] }));
  const s = box(screen), cta = box(document.getElementById("cta-inline")), h1 = box(document.querySelector("h1")), id = box(document.querySelector("main header"));
  const cover = (nw, nh) => { const k = Math.max(s.w / nw, s.h / nh); return { visibleWidth: +(s.w / (nw * k)).toFixed(3), visibleHeight: +(s.h / (nh * k)).toFixed(3) }; };
  const bar = document.querySelector("[class*=sticky]")?.getBoundingClientRect().bottom ?? 0;
  return {
    viewport: [innerWidth, innerHeight], overflowPx: document.documentElement.scrollWidth - innerWidth,
    showcase: { ...s, ratio: +(s.w / s.h).toFixed(3), poster: img.currentSrc.split("/").pop(), posterNatural: [img.naturalWidth, img.naturalHeight], posterCrop: img.naturalWidth ? cover(img.naturalWidth, img.naturalHeight) : null, objectPosition: getComputedStyle(img).objectPosition, shareOfViewport: +((s.w * s.h) / (innerWidth * innerHeight)).toFixed(3) },
    frames: frames.map((f) => ({ ...f, shareOfShowcaseArea: +((f.w * f.h) / (s.w * s.h)).toFixed(3) })),
    identity: id, identityBottomToUprightTop: frames[0].y - (id.y + id.h), showcaseTopMinusIdentityTop: s.y - id.y,
    h1: { ...h1, lines: Math.round(h1.h / parseFloat(getComputedStyle(document.querySelector("h1")).lineHeight)), size: parseFloat(getComputedStyle(document.querySelector("h1")).fontSize) },
    cta: { ...cta, inFirstScreen: cta.y >= 0 && cta.y + cta.h <= innerHeight, bottomFromFold: innerHeight - (cta.y + cta.h) },
    framesInFirstScreen: frames.filter((f) => f.y + f.h <= innerHeight).length,
    barBottom: Math.round(bar),
    video: video ? { src: (video.currentSrc || video.getAttribute("src") || "").split("/").pop(), paused: video.paused, ended: video.ended, t: +video.currentTime.toFixed(2), duration: +(video.duration || 0).toFixed(2), shown: video.hasAttribute("data-on"), loop: video.loop, muted: video.muted, inline: video.playsInline, preload: video.preload, size: [video.videoWidth, video.videoHeight] } : null,
    toggle: document.querySelector("main figure button[class*=toggle]")?.getAttribute("aria-label") ?? null,
  };
})()`;
