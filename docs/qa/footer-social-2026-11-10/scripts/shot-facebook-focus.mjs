// The Facebook link's keyboard focus (11/11/2026). Usage: node shot-facebook-focus.mjs http://localhost:3401 <out-dir>
import { chromium } from "/Users/noe/Documents/GitHub/Cigarettes-After-Sex/node_modules/.pnpm/playwright@1.62.1/node_modules/playwright/index.mjs";
const [base, out] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, reducedMotion: "reduce" });
await page.goto(`${base}/dev/demo?intro=0`, { waitUntil: "networkidle" });
await page.addStyleTag({ content: "nextjs-portal{display:none!important} #top{visibility:hidden!important}" });
await page.locator("footer nav a").last().focus();
await page.keyboard.press("Tab");
const b = await page.locator("footer [class*=footerBottom]").last().boundingBox();
await page.screenshot({ path: `${out}/footer-right-facebook-focus.png`, clip: { x: b.x + b.width - 520, y: b.y - 48, width: 520, height: b.height + 56 } });
await browser.close();
