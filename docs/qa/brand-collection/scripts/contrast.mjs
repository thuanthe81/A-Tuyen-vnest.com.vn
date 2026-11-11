// WCAG contrast of every text/background pair the two concepts use. Usage: node scripts/contrast.mjs
import { writeFileSync } from "node:fs";
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
const L = (h) => { const [r, g, b] = hex(h); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const ratio = (a, b) => { const [x, y] = [L(a), L(b)].sort((m, n) => n - m); return +((x + 0.05) / (y + 0.05)).toFixed(2); };
const C = { copper: "#ab7444", olive: "#37412f", taupe: "#8a8173", beige: "#f1ece4", paper: "#fbf9f5", white: "#ffffff", muted: "#5b6152" };
const pairs = [
  ["olive", "beige", "headings, labels (A wall)"], ["olive", "paper", "headings, labels (B, results)"], ["olive", "white", "mount and stage text, chips"],
  ["beige", "olive", "selected chip / A 'all' panel text"], ["muted", "beige", "secondary text on the wall"], ["muted", "white", "secondary text on mounts"], ["muted", "paper", "secondary text, B"],
  ["taupe", "beige", "A second headline sentence (display size only)"], ["copper", "beige", "lines and symbol only, never text"], ["copper", "paper", "B thread and nodes (graphic)"], ["copper", "white", "for reference"],
];
const rows = pairs.map(([f, b, use]) => ({ text: `${f} ${C[f]}`, on: `${b} ${C[b]}`, ratio: ratio(C[f], C[b]), use }));
for (const r of rows) console.log(r.ratio.toString().padEnd(6), r.text.padEnd(16), "on", r.on.padEnd(16), r.use);
writeFileSync(new URL("../contrast.json", import.meta.url), JSON.stringify(rows, null, 2));
