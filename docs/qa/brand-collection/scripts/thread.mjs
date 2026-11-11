// Concept A's copper thread: does it start at the chosen panel, end on the result line, stay out of
// every control, and follow each choice? Every width, every brand, plus resize and reduced motion.
// Usage: node docs/qa/brand-collection/scripts/thread.mjs
import { writeFileSync } from "node:fs";
import { BASE, HIDE_DEV, launch, OUT, Page, quit, ROUTES, sleep } from "./lib.mjs";

const VIEWS = [
  { name: "360", w: 360, h: 740, dpr: 2, mobile: true },
  { name: "390", w: 390, h: 844, dpr: 2, mobile: true },
  { name: "768", w: 768, h: 1024, dpr: 2, mobile: true },
  { name: "1024", w: 1024, h: 768, dpr: 1, mobile: false },
  { name: "1440", w: 1440, h: 900, dpr: 1, mobile: false },
  { name: "1920", w: 1920, h: 1080, dpr: 1, mobile: false },
];
const CHOICES = ["Tất cả thương hiệu", "Bare Boutique Stays", "The Nắng Suites", "Pepper House"];

// Samples the drawn path and tests it against the chosen panel, the result line and every control.
const CHECK = `(() => {
  const svg = document.querySelector("svg[class*=thread]"); if (!svg) return { drawn: false };
  const path = svg.querySelector("path"); const s = svg.getBoundingClientRect();
  const len = path.getTotalLength(); const pts = []; for (let i = 0; i <= 400; i++) { const p = path.getPointAtLength((len * i) / 400); pts.push([p.x + s.left, p.y + s.top]); }
  const chosen = document.querySelector('section [aria-pressed="true"][class*=exhibit], section [aria-pressed="true"][class*=all]').getBoundingClientRect();
  const result = document.getElementById("bc-a-result").parentElement.getBoundingClientRect();
  const start = pts[0], end = pts.at(-1);
  const controls = [...document.querySelectorAll("section button, section select, [class*=result] button")].map((e) => e.getBoundingClientRect());
  const hits = controls.filter((r) => pts.some(([x, y]) => x > r.left + 1 && x < r.right - 1 && y > r.top + 1 && y < r.bottom - 1)).length;
  return {
    drawn: true,
    startsAtChosenFoot: Math.abs(start[0] - chosen.right) < 4 && start[1] > chosen.bottom && start[1] - chosen.bottom < 6,
    endsOnResultLine: Math.abs(end[1] - result.top) < 1.5 && Math.abs(end[0] - result.right) < 2,
    minX: Math.round(Math.min(...pts.map((p) => p[0]))),
    controlsCrossed: hits,
    overflowPx: document.documentElement.scrollWidth - innerWidth,
    animation: getComputedStyle(path).animationDuration,
  };
})()`;

console.log(await launch());
const out = {};
for (const view of VIEWS) {
  const p = await Page.open();
  await p.viewport(view.w, view.h, view.dpr, view.mobile);
  await p.goto(BASE + ROUTES.a, { settle: 1200 });
  await p.eval(HIDE_DEV);
  for (const choice of CHOICES) {
    await p.eval(`document.querySelector('section [aria-label^="${choice}"]').click()`);
    await sleep(700);
    out[`${view.name} ${choice}`] = await p.eval(CHECK);
  }
  // With a city chosen as well (Bare + Đà Nẵng): nothing above the result line moves, so neither should the thread.
  await p.eval(`document.querySelector('section [aria-label^="Bare Boutique Stays"]').click()`);
  await p.eval(`document.querySelector('[role=group][aria-label="Thành phố"] [aria-label^="Đà Nẵng"]').click()`);
  await sleep(700);
  out[`${view.name} Bare + Đà Nẵng`] = await p.eval(CHECK);
  await p.close();
}
// Resize while a brand is chosen: the thread must follow the new layout.
{
  const p = await Page.open();
  await p.viewport(1440, 900, 1, false);
  await p.goto(BASE + ROUTES.a + "?brand=pepper-house", { settle: 1200 });
  await p.viewport(600, 900, 1, false);
  await sleep(600);
  out["resize 1440 → 600, Pepper House"] = await p.eval(CHECK);
  await p.close();
}
// Reduced motion: drawn at once.
{
  const p = await Page.open();
  await p.viewport(390, 844, 2, true);
  await p.media({ "prefers-reduced-motion": "reduce" });
  await p.goto(BASE + ROUTES.a, { settle: 1200 });
  out["reduced motion"] = await p.eval(CHECK);
  await p.close();
}
// Original route has no thread.
{
  const p = await Page.open();
  await p.goto(BASE + "/dev/brand-collection/a-original", { settle: 1200 });
  out["a-original"] = await p.eval(`({ thread: !!document.querySelector("svg[class*=thread]"), tick: !!document.querySelector("[class*=check]") || "renders when a brand is chosen" })`);
  await p.close();
}
writeFileSync(`${OUT}/thread.json`, JSON.stringify(out, null, 2));
for (const [k, v] of Object.entries(out)) console.log(k.padEnd(36), JSON.stringify(v));
quit();
