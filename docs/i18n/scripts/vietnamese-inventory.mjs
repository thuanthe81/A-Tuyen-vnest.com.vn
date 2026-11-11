/**
 * Bilingual preview audit: every Vietnamese string a guest can see or hear on a page in English (text, alt, aria-label,
 * title, placeholder), including dialogs and panels opened by the script. Usage: node vietnamese-inventory.mjs <url> [width]
 */
import { chromium } from "/Users/noe/Documents/GitHub/Cigarettes-After-Sex/node_modules/.pnpm/playwright@1.62.1/node_modules/playwright/index.mjs";

const url = process.argv[2];
const width = Number(process.argv[3] ?? 1440);
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width, height: 900 }, isMobile: width < 768, hasTouch: width < 768 });
const page = await context.newPage();
await page.goto(url, { waitUntil: "networkidle" });
const found = await page.evaluate(() => {
  const VI = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;
  const out = new Map();
  const add = (kind, text, el) => {
    const t = (text ?? "").replace(/\s+/g, " ").trim();
    if (!t || !VI.test(t)) return;
    if (el.closest("[lang='vi']") && el.closest("[data-lang-ok]")) return;
    const key = `${kind}: ${t}`;
    const where = el.closest("section[id], header, footer, nav, dialog, [data-testid]");
    out.set(key, where ? (where.id || where.getAttribute("data-testid") || where.tagName.toLowerCase()) : "body");
  };
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const el = node.parentElement;
    if (!el || el.closest("script,style,noscript")) continue;
    add("text", node.textContent, el);
  }
  for (const el of document.querySelectorAll("[alt],[aria-label],[title],[placeholder]")) {
    for (const attr of ["alt", "aria-label", "title", "placeholder"]) if (el.hasAttribute(attr)) add(attr, el.getAttribute(attr), el);
  }
  return [...out.entries()].map(([k, w]) => `${w} | ${k}`);
});
console.log(found.sort().join("\n"));
console.error(`${found.length} Vietnamese strings`);
await browser.close();
