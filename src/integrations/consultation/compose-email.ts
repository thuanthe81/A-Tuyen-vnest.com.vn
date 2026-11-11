/**
 * The consultation email VNest receives: subject, plain text and HTML, built from a validated record.
 *
 * Safety: every value the visitor typed is HTML-escaped in the HTML part and never used in the subject. The only
 * header that can carry visitor input is Reply-To, and only for an address that passed the strict pattern in
 * src/domain/consultation.ts (no spaces, quotes, angle brackets or line breaks).
 */

import type { ConsultationRecord } from "@/domain/consultation";

export interface EmailMessage {
  to: string;
  from: string;
  /** Only a validated plain address the visitor gave; absent for a phone number. */
  replyTo?: string;
  subject: string;
  text: string;
  html: string;
}

export interface ComposeOptions {
  /** Vietnamese label of each service choice (server-side copy, never visitor input). */
  serviceLabel: (service: ConsultationRecord["service"]) => string;
  /** A friendly name for a source path, when it has one. */
  sourceLabel: (path: string) => string | undefined;
  timeZone: string;
  timeZoneLabel: string;
}

const HTML_ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
export const escapeHtml = (value: string): string => value.replace(/[&<>"']/g, (c) => HTML_ESCAPES[c] ?? c);

/** Header values the server writes itself still lose any line break: a header can never be split. */
const headerSafe = (value: string): string => value.replace(/[\r\n\u2028\u2029]+/g, " ").trim();

/** "10/11/2026, 14:32" in the given time zone (24-hour clock). */
export function formatSubmittedAt(date: Date, timeZone: string): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", { timeZone, day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
      .formatToParts(date)
      .map((part) => [part.type, part.value]),
  );
  return `${parts.day}/${parts.month}/${parts.year}, ${parts.hour}:${parts.minute}`;
}

const LANGUAGE = { vi: "Tiếng Việt (VI)", en: "English (EN)" } as const;

type Row = { label: string; text: string; html: string };

export function composeConsultationEmail(record: ConsultationRecord, envelope: { to: string; from: string }, options: ComposeOptions): EmailMessage {
  const service = options.serviceLabel(record.service);
  const submitted = `${formatSubmittedAt(record.receivedAt, options.timeZone)} (${options.timeZoneLabel})`;
  const sourceName = options.sourceLabel(record.source);
  const source = sourceName ? `${sourceName} — ${record.source}` : record.source;
  const reach = record.reach;

  const plain = (label: string, value: string): Row => ({ label, text: value, html: escapeHtml(value) });
  const rows: Row[] = [
    plain("Thời gian gửi", submitted),
    plain("Dịch vụ quan tâm", service),
    plain("Họ tên", record.name),
    reach.kind === "email"
      ? {
          label: "Email",
          text: reach.value,
          // Local part percent-encoded: nothing in it can add a header or a recipient to the mailto link.
          html: `<a href="mailto:${escapeHtml(encodeMailto(reach.value))}">${escapeHtml(reach.value)}</a>`,
        }
      : {
          label: "Số điện thoại",
          text: reach.value,
          html: `<a href="tel:${escapeHtml(telHref(reach.digits))}">${escapeHtml(reach.value)}</a>`,
        },
    ...(record.asset ? [plain("Loại tài sản", record.asset)] : []),
    ...(record.message ? [{ label: "Nội dung trao đổi", text: record.message, html: escapeHtml(record.message).replace(/\n/g, "<br>") }] : []),
    plain("Trang gửi", source),
    plain("Ngôn ngữ", LANGUAGE[record.locale]),
    plain("Mã yêu cầu", record.reference),
  ];

  const footer =
    reach.kind === "email"
      ? "Email này được gửi tự động từ biểu mẫu tư vấn trên website VNest. Nhấn Trả lời để phản hồi trực tiếp đến email khách đã để lại."
      : "Email này được gửi tự động từ biểu mẫu tư vấn trên website VNest. Khách để lại số điện thoại, vui lòng liên hệ qua số này.";

  const text = [
    "Yêu cầu tư vấn mới từ website VNest",
    "",
    ...rows.flatMap((row) => (row.text.includes("\n") ? [`${row.label}:`, ...row.text.split("\n").map((line) => `  ${line}`)] : [`${row.label}: ${row.text}`])),
    "",
    "—",
    footer,
  ].join("\n");

  const html = `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escapeHtml(`Yêu cầu tư vấn — ${service}`)}</title></head>
<body style="margin:0;padding:24px;background:#f3eee6;font-family:Arial,Helvetica,sans-serif;color:#37412f;">
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:640px;margin:0 auto;background:#f8f4ee;border:1px solid #ddd3c4;border-radius:12px;">
<tr><td style="padding:24px 28px 8px;"><p style="margin:0 0 4px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#9a683c;">VNest Website</p>
<h1 style="margin:0;font-size:20px;line-height:1.3;">Yêu cầu tư vấn mới</h1></td></tr>
<tr><td style="padding:12px 28px 20px;"><table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:15px;line-height:1.5;">
${rows
  .map(
    (row) =>
      `<tr><th scope="row" style="text-align:left;vertical-align:top;padding:8px 16px 8px 0;border-top:1px solid #e4dccf;width:36%;font-weight:600;color:#6f675b;">${escapeHtml(row.label)}</th><td style="vertical-align:top;padding:8px 0;border-top:1px solid #e4dccf;word-break:break-word;">${row.html}</td></tr>`,
  )
  .join("\n")}
</table></td></tr>
<tr><td style="padding:0 28px 24px;font-size:13px;line-height:1.5;color:#6f675b;">${escapeHtml(footer)}</td></tr>
</table>
</body></html>`;

  return {
    to: envelope.to,
    from: envelope.from,
    ...(reach.kind === "email" ? { replyTo: reach.value } : {}),
    subject: headerSafe(`[VNest Website] Yêu cầu tư vấn — ${service}`),
    text,
    html,
  };
}

function encodeMailto(address: string): string {
  const at = address.lastIndexOf("@");
  return `${encodeURIComponent(address.slice(0, at))}@${address.slice(at + 1)}`;
}

/** "+84901234567" from "0901234567" or "84901234567"; any other E.164 number as it is. Digits and + only. */
function telHref(digits: string): string {
  const clean = digits.replace(/[^\d+]/g, "");
  if (clean.startsWith("+")) return clean;
  if (clean.startsWith("84")) return `+${clean}`;
  if (clean.startsWith("0")) return `+84${clean.slice(1)}`;
  return clean;
}
