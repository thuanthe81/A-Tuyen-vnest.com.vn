/**
 * Renders the consultation email VNest would receive, from FAKE sample data, with the real composer
 * (src/integrations/consultation/compose-email.ts), and captures it. Nothing is sent.
 * Run from the repo root: node --import ./test/register.mjs docs/qa/consultation-form-2026-11-10/scripts/render-email-sample.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "/Users/noe/Documents/GitHub/Cigarettes-After-Sex/node_modules/.pnpm/playwright@1.62.1/node_modules/playwright/index.mjs";
import { composeConsultationEmail } from "../../../../src/integrations/consultation/compose-email.ts";
import { consultationServiceLabel } from "../../../../src/server/consultation-labels.ts";
import { consultation } from "../../../../src/config/consultation.ts";

const out = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "email-sample");
mkdirSync(out, { recursive: true });
const options = { serviceLabel: consultationServiceLabel, sourceLabel: (p) => consultation.sourcePages[p], timeZone: consultation.timeZone, timeZoneLabel: consultation.timeZoneLabel };
const envelope = { to: "hello@vnest.com.vn", from: "VNest Website <website@vnest.com.vn>" };
const samples = {
  "email-with-optional-fields": {
    service: "van-hanh", name: "Nguyễn Văn Mẫu", reach: { kind: "email", value: "chu.nha.mau@example.com" }, asset: "Căn hộ dịch vụ, 12 phòng",
    message: "Tôi có một toà căn hộ ở Quận 3, muốn tìm hiểu về dịch vụ vận hành.\nCó thể trao đổi vào buổi chiều.", source: "/dev/demo", locale: "vi",
    receivedAt: new Date("2026-11-10T07:32:00Z"), reference: "VN-SAMPLE01",
  },
  "phone-minimal-en": {
    service: "chua-ro", name: "Sample Owner", reach: { kind: "phone", value: "0901 234 567", digits: "0901234567" }, asset: "", message: "", source: "/dev/demo/hop-tac", locale: "en",
    receivedAt: new Date("2026-11-10T13:05:00Z"), reference: "VN-SAMPLE02",
  },
};
const browser = await chromium.launch();
for (const [name, record] of Object.entries(samples)) {
  const mail = composeConsultationEmail(record, envelope, options);
  writeFileSync(path.join(out, `${name}.txt`), `To: ${mail.to}\nFrom: ${mail.from}\nReply-To: ${mail.replyTo ?? "(none)"}\nSubject: ${mail.subject}\n\n${mail.text}\n`);
  writeFileSync(path.join(out, `${name}.html`), mail.html);
  const page = await browser.newPage({ viewport: { width: 760, height: 600 } });
  await page.setContent(mail.html);
  await page.screenshot({ path: path.join(out, `${name}.png`), fullPage: true });
  await page.close();
  console.log(`${name}: ${mail.subject}`);
}
await browser.close();
