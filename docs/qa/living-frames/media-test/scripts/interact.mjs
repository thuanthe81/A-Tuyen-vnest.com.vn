import { writeFileSync } from "node:fs";
import { BASE, GEOMETRY, launch, OUT, Page, quit, ROUTES, sleep, STAY } from "./lib.mjs";
console.log(await launch());
const out = {};
const V = `(() => { const v = document.querySelector("video"); const b = document.querySelector("main figure button[class*=toggle]"); const img = document.querySelector("main figure img"); return { t: +v.currentTime.toFixed(2), paused: v.paused, ended: v.ended, shown: v.hasAttribute("data-on"), src: (v.currentSrc || v.getAttribute("src") || "").split("/").pop(), label: b ? b.getAttribute("aria-label") : null, posterLoaded: img.complete && img.naturalWidth > 0, remembered: sessionStorage.getItem("vnest.showcase") }; })()`;
const center = (sel) => `(() => { const e = ${sel}; if (!e) return null; e.scrollIntoView({ block: "nearest" }); const b = e.getBoundingClientRect(); return { x: Math.round(b.left + b.width / 2), y: Math.round(b.top + b.height / 2), w: Math.round(b.width), h: Math.round(b.height) }; })()`;
const TOGGLE = `document.querySelector("main figure button[class*=toggle]")`;
const PILL = `document.querySelector("main figure button[class*=all]")`;
const DIALOG = `(() => { const d = document.querySelector('dialog[aria-label="Thư viện ảnh"]'); return { open: !!d && d.open, pictures: d ? d.querySelectorAll("li img").length : 0, focusInside: !!d && d.contains(document.activeElement), focused: (document.activeElement?.getAttribute("aria-label") || document.activeElement?.textContent || "").trim().slice(0, 40) }; })()`;

async function open({ w, h, dpr = 2, mobile = true, route = "a", media, before, block, settle = 600 }) {
  const p = await Page.open();
  await p.send("Log.enable");
  p.errors = [];
  p.mp4 = [];
  p.on("Runtime.exceptionThrown", (e) => p.errors.push(e.exceptionDetails.exception?.description?.slice(0, 160) ?? e.exceptionDetails.text));
  p.on("Log.entryAdded", (e) => { if (e.entry.level === "error") p.errors.push(`${e.entry.source}: ${e.entry.text.slice(0, 140)} ${(e.entry.url || "").split("/").pop()}`); });
  p.on("Network.requestWillBeSent", (e) => { if (/\.mp4/.test(e.request.url)) p.mp4.push(e.request.url.split("/").pop()); });
  await p.viewport(w, h, dpr, mobile);
  if (media) await p.media(media);
  if (before) await before(p);
  if (block) await p.send("Network.setBlockedURLs", { urls: block });
  await p.goto(BASE + ROUTES[route] + STAY, { settle });
  return p;
}
const until = async (p, test, ms = 15000) => { const t = Date.now(); for (;;) { const v = await p.eval(V); if (test(v) || Date.now() - t > ms) return v; await sleep(150); } };
const PHONE = { w: 390, h: 844, dpr: 2, mobile: true };
const DESK = { w: 1440, h: 900, dpr: 1, mobile: false };

// ---- 1. Reduced motion ----
{
  const p = await open({ ...PHONE, media: { "prefers-reduced-motion": "reduce" } });
  await sleep(3000);
  const still = await p.eval(V);
  const requestsWhileStill = [...p.mp4];
  const c = await p.eval(center(TOGGLE));
  await p.tap(c.x, c.y);
  const afterTap = await until(p, (v) => !v.paused && v.t > 0.4, 6000);
  out.reducedMotion = { still, clipRequestedWhileStill: requestsWhileStill.length, afterGuestPressesPlay: afterTap, clipRequestedAfterPress: p.mp4.length > 0, errors: p.errors };
  await p.close();
}
// ---- 2. Data saver and a 2G connection, as the browser reports them ----
for (const [name, connection] of [["saveData", `{ saveData: true, effectiveType: "4g" }`], ["effectiveType2g", `{ saveData: false, effectiveType: "2g" }`]]) {
  const p = await open({ ...PHONE, before: (p) => p.send("Page.addScriptToEvaluateOnNewDocument", { source: `Object.defineProperty(Navigator.prototype, "connection", { get: () => (${connection}), configurable: true });` }) });
  await sleep(3500);
  out[name] = { how: "navigator.connection replaced by an injected script before the page's own code ran", reported: await p.eval(`({ saveData: navigator.connection.saveData, effectiveType: navigator.connection.effectiveType })`), state: await p.eval(V), clipRequested: p.mp4.length, errors: p.errors };
  if (name === "saveData") await p.shot(`${OUT}/a-390-data-saver.jpg`);
  await p.close();
}
{
  let supported = true;
  const p = await open({ ...PHONE, before: async (p) => { try { await p.media({ "prefers-reduced-data": "reduce" }); } catch (e) { supported = String(e.message); } } });
  await sleep(3000);
  out.prefersReducedData = { emulation: supported, matches: await p.eval(`matchMedia("(prefers-reduced-data: reduce)").matches`), state: await p.eval(V), clipRequested: p.mp4.length };
  await p.close();
}
// ---- 3. Pause, and the pause being remembered ----
{
  const p = await open(PHONE);
  const playing = await until(p, (v) => !v.paused && v.t > 1.0);
  const c = await p.eval(center(TOGGLE));
  await p.tap(c.x, c.y);
  const paused = await p.eval(V);
  await sleep(1000);
  const later = await p.eval(V);
  await p.shot(`${OUT}/a-390-paused.jpg`);
  p.mp4.length = 0;
  await p.goto(BASE + ROUTES.a + STAY, { settle: 3000 });
  const afterReload = await p.eval(V);
  const requestedAfterReload = p.mp4.length;
  const c2 = await p.eval(center(TOGGLE));
  await p.tap(c2.x, c2.y);
  const resumed = await until(p, (v) => !v.paused && v.t > 0.4, 6000);
  out.pause = { playing, toggleSize: [c.w, c.h], paused, oneSecondLater: later, timeHeld: paused.t === later.t, afterReload, clipRequestedAfterReload: requestedAfterReload, afterPressingPlay: resumed, errors: p.errors };
  await p.close();
}
// ---- 4. Completion: once through, then the last frame, held ----
{
  const p = await open(PHONE);
  const first = await until(p, (v) => !v.paused && v.t > 0.2);
  const ended = await until(p, (v) => v.ended);
  const attributes = await p.eval(`(() => { const v = document.querySelector("video"); return { loop: v.loop, muted: v.muted, playsInline: v.playsInline, preload: v.preload, duration: +v.duration.toFixed(2), controls: v.controls, size: [v.videoWidth, v.videoHeight] }; })()`);
  await p.eval(`scrollTo(0, 2600)`);
  await sleep(1200);
  await p.eval(`scrollTo(0, 0)`);
  await sleep(1800);
  const afterScroll = await p.eval(V);
  const c = await p.eval(center(TOGGLE));
  await p.tap(c.x, c.y);
  const replay = await until(p, (v) => !v.paused && v.t > 0.3 && v.t < 3, 6000);
  const again = await until(p, (v) => v.ended);
  out.completion = { started: first, ended, attributes, afterScrollingAwayAndBack: afterScroll, restartedByItself: !(afterScroll.ended && afterScroll.t === ended.t), afterPressingReplay: replay, endedAgain: again, clipRequests: p.mp4.length, errors: p.errors };
  await p.close();
}
// ---- 5. Leaving the screen mid-play ----
{
  const p = await open(PHONE);
  await until(p, (v) => !v.paused && v.t > 0.8);
  await p.eval(`scrollTo(0, 2600)`);
  await sleep(900);
  const away = await p.eval(V);
  const pill = await p.eval(`(() => { const e = document.querySelector("a[class*=pill]"); return { shown: e.hasAttribute("data-show"), visibility: getComputedStyle(e).visibility }; })()`);
  await p.eval(`scrollTo(0, 0)`);
  const back = await until(p, (v) => !v.paused && v.t > away.t, 5000);
  out.offScreen = { whileAway: away, pillWhileAway: pill, onReturn: back, resumed: !back.paused, errors: p.errors };
  await p.close();
}
// ---- 6. Fallbacks ----
for (const [name, view] of [["phone", PHONE], ["desktop", DESK]]) {
  const p = await open({ ...view, block: ["*v1-room-*.mp4"] });
  await sleep(4000);
  const state = await p.eval(V);
  const g = await p.eval(GEOMETRY);
  await p.shot(`${OUT}/a-${view.w}-clip-unavailable.jpg`);
  const c = await p.eval(center(`document.getElementById("cta-inline")`));
  view.mobile ? await p.tap(c.x, c.y) : await p.click(c.x, c.y);
  await sleep(700);
  const after = await p.eval(`({ hash: location.hash, search: location.search, roomsTop: Math.round(document.getElementById("rooms").getBoundingClientRect().top) })`);
  out[`clipBlocked_${name}`] = { state, controlOffered: state.label, ctaInFirstScreen: g.cta.inFirstScreen, galleryControl: !!(await p.eval(`!!${PILL}`)), afterBookingAction: after, errors: p.errors };
  await p.close();
}
{
  const p = await open({ ...PHONE, block: ["*v1-room-poster-*"] });
  await sleep(1200);
  const g = await p.eval(GEOMETRY);
  await p.shot(`${OUT}/a-390-poster-unavailable-preview.jpg`);
  const ended = await until(p, (v) => v.ended);
  out.posterBlocked = { frame: [g.showcase.w, g.showcase.h], previewBehind: await p.eval(`getComputedStyle(document.querySelector("main figure").firstElementChild).backgroundImage.slice(0, 30)`), posterLoaded: g.showcase.posterNatural[0] > 0, clipStillPlayedThrough: ended.ended, cta: g.cta.inFirstScreen };
  await p.close();
}
{
  const p = await open({ ...PHONE, before: (p) => p.send("Emulation.setScriptExecutionDisabled", { value: true }), settle: 1500 });
  const r = await p.send("Runtime.evaluate", { expression: "1", returnByValue: true }).catch(() => null);
  // With scripting off the page cannot be asked questions by script either: read the DOM instead.
  const { root } = await p.send("DOM.getDocument", { depth: -1, pierce: false });
  const text = JSON.stringify(root);
  await p.shot(`${OUT}/a-390-no-script.jpg`);
  out.noScript = { evaluated: r?.result?.value ?? null, hasName: text.includes("Cơ sở mẫu A"), hasBookingLink: text.includes('"href","#rooms"') || text.includes("#rooms"), hasPoster: text.includes("v1-room-poster"), hasDisclosure: text.includes("không phải VNest") || text.includes("không phải cơ sở VNest") };
  await p.close();
}
// ---- 7. Keyboard, desktop, variant B ----
{
  const p = await open({ ...DESK, route: "b" });
  await until(p, (v) => !v.paused && v.t > 0.3);
  const FOCUS = `(() => { const e = document.activeElement; if (!e || e === document.body) return null; const s = getComputedStyle(e); const b = e.getBoundingClientRect(); return { what: (e.getAttribute("aria-label") || e.textContent || e.tagName).trim().replace(/\\s+/g, " ").slice(0, 44), tag: e.tagName, ring: s.outlineStyle !== "none" && parseFloat(s.outlineWidth) > 0 ? s.outlineWidth + " " + s.outlineStyle + " " + s.outlineColor : s.boxShadow !== "none" ? "shadow" : "NONE", inView: b.top >= 0 && b.bottom <= innerHeight, size: [Math.round(b.width), Math.round(b.height)] }; })()`;
  const order = [];
  let toggleAt = -1, frameAt = -1, ctaAt = -1;
  for (let i = 0; i < 16; i++) {
    await p.key("Tab");
    const f = await p.eval(FOCUS);
    order.push(f);
    if (f && /thước phim/.test(f.what) && toggleAt < 0) {
      toggleAt = i;
      const before = await p.eval(V);
      await p.shot(`${OUT}/b-1440-focus-on-video-control.jpg`, { clip: { x: 500, y: 140, width: 840, height: 500 } });
      await p.key("Enter");
      await sleep(300);
      const afterEnter = await p.eval(V);
      await p.key(" ");
      await sleep(600);
      const afterSpace = await p.eval(V);
      out.keyboardVideo = { before, afterEnter, afterSpace, enterPauses: !before.paused && afterEnter.paused, spacePlays: !afterSpace.paused || afterSpace.label === "Tạm dừng thước phim" };
    }
    if (f && /^Mở ảnh 2/.test(f.what) && frameAt < 0) {
      frameAt = i;
      await p.shot(`${OUT}/b-1440-focus-on-frame.jpg`, { clip: { x: 100, y: 320, width: 440, height: 330 } });
      await p.key("Enter");
      await sleep(900);
      const opened = await p.eval(DIALOG);
      const inside = await p.eval(`(() => { const d = document.querySelector('dialog[aria-label="Thư viện ảnh"]'); const at = d.querySelector('[data-shot="1"]').getBoundingClientRect().top; return { openedAtPicture2Top: Math.round(at), items: [...d.querySelectorAll("li")].slice(0, 4).map((li) => ({ file: (li.querySelector("img").currentSrc || "").split("/").pop(), fit: getComputedStyle(li.querySelector("img")).objectFit, caption: li.querySelector("figcaption").textContent.trim().replace(/\\s+/g, " ") })) }; })()`);
      await p.shot(`${OUT}/b-1440-gallery-open.jpg`);
      await p.key("Tab");
      const tabInside = await p.eval(DIALOG);
      await p.key("Escape");
      await sleep(500);
      const closed = await p.eval(DIALOG);
      out.keyboardGallery = { opened, inside, tabStaysInside: tabInside.focusInside, afterEscape: closed, focusReturnedToOpener: /^Mở ảnh 2/.test(closed.focused) };
    }
    if (f && f.what.startsWith("Xem phòng trống") && ctaAt < 0) ctaAt = i;
    if (frameAt >= 0 && f && /^Mở ảnh 3/.test(f.what)) break;
  }
  // Back to the booking action, by keyboard, and press it.
  for (let i = 0; i < 6; i++) { await p.key("Tab", { shift: true }); const f = await p.eval(FOCUS); if (f && f.what.startsWith("Xem phòng trống")) break; }
  const onCta = await p.eval(FOCUS);
  await p.key("Enter");
  await sleep(900);
  out.keyboardBooking = { focused: onCta?.what, ...(await p.eval(`({ hash: location.hash, search: location.search, roomsTop: Math.round(document.getElementById("rooms").getBoundingClientRect().top) })`)) };
  out.keyboardOrder = { order: order.map((f) => f && `${f.what} [${f.ring === "NONE" ? "NO RING" : "ring"}${f.inView ? "" : ", off screen"}]`), withoutRing: order.filter((f) => f && f.ring === "NONE").map((f) => f.what), errors: p.errors };
  await p.close();
}
// ---- 8. Touch, phone ----
{
  const p = await open(PHONE);
  await sleep(800);
  const targets = await p.eval(`[...document.querySelectorAll("a, button, input, select")].filter((e) => { const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0 && b.top < innerHeight && b.bottom > 0 && getComputedStyle(e).visibility !== "hidden"; }).map((e) => { const b = e.getBoundingClientRect(); return { what: (e.getAttribute("aria-label") || e.textContent || "").trim().replace(/\\s+/g, " ").slice(0, 36), w: Math.round(b.width), h: Math.round(b.height) }; })`);
  let c = await p.eval(center(PILL));
  await p.tap(c.x, c.y);
  await sleep(700);
  const viaControl = await p.eval(DIALOG);
  await p.shot(`${OUT}/a-390-gallery-open.jpg`);
  c = await p.eval(center(`[...document.querySelectorAll('dialog[aria-label="Thư viện ảnh"] button')].find((b) => b.textContent.trim() === "Đóng")`));
  await p.tap(c.x, c.y);
  await sleep(500);
  const closed = await p.eval(DIALOG);
  c = await p.eval(center(`document.querySelector('button[aria-label^="Mở ảnh 3"]')`));
  await p.tap(c.x, c.y);
  await sleep(900);
  const viaFrame = await p.eval(`(() => { const d = document.querySelector('dialog[aria-label="Thư viện ảnh"]'); const li = d.querySelector('[data-shot="2"]'); if (!li) return { open: d.open, items: d.querySelectorAll("li").length, dialogs: document.querySelectorAll("dialog").length }; return { open: d.open, picture3Top: Math.round(li.getBoundingClientRect().top), file: (li.querySelector("img").currentSrc || "").split("/").pop(), fit: getComputedStyle(li.querySelector("img")).objectFit, caption: li.querySelector("figcaption").textContent.trim().replace(/\\s+/g, " ") }; })()`);
  await p.shot(`${OUT}/a-390-gallery-at-detail.jpg`);
  await p.eval(`document.querySelector('dialog[aria-label="Thư viện ảnh"]').close()`);
  await sleep(300);
  await p.eval(`scrollTo(0, 800)`);
  await sleep(900);
  const pill = await p.eval(`(() => { const e = document.querySelector("a[class*=pill]"); const b = e.getBoundingClientRect(); return { shown: e.hasAttribute("data-show"), size: [Math.round(b.width), Math.round(b.height)], x: Math.round(b.left + b.width / 2), y: Math.round(b.top + b.height / 2) }; })()`);
  await p.tap(pill.x, pill.y);
  await sleep(1200);
  const afterPill = await p.eval(`({ hash: location.hash, search: location.search, roomsTop: Math.round(document.getElementById("rooms").getBoundingClientRect().top), pillShown: document.querySelector("a[class*=pill]").hasAttribute("data-show") })`);
  await p.shot(`${OUT}/a-390-rooms-bridge.jpg`);
  out.touch = { firstScreenTargets: targets, under44: targets.filter((t) => t.w < 44 || t.h < 44), galleryViaControl: viaControl, afterClose: closed, galleryViaFrame: viaFrame, bookingPill: pill, afterBookingPill: afterPill, errors: p.errors };
  await p.close();
}
writeFileSync(new URL("./interact.json", import.meta.url), JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
quit();
