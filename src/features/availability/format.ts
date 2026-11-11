/**
 * How money and times read on the results page. Money is built by hand, with no Intl, so
 * the server and every browser print the same text.
 */

import type { Money } from "@/domain/property";

function grouped(amount: number, separator: string): string {
  const [whole = "0", fraction] = Math.abs(amount).toString().split(".");
  const text = whole.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
  return `${amount < 0 ? "-" : ""}${text}${fraction ? `,${fraction}` : ""}`;
}

/** "3.000.000 ₫" for đồng; any other currency as the amount and its code, as supplied. Never converted. */
export function formatMoney(money: Money): string {
  return money.currency === "VND" ? `${grouped(money.amount, ".")} ₫` : `${grouped(money.amount, ".")} ${money.currency}`;
}

/** "14:32", in the timezone the site searches in. Only ever rendered in the browser, after an answer arrives. */
export function formatTime(instant: number, timeZone: string): string {
  return new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone }).format(instant);
}
