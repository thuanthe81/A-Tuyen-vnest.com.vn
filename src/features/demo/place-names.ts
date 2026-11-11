import type { Locale } from "@/domain/locale";

/**
 * Place labels in English (bilingual preview, 6/11/2026): the usual English forms of the cities, districts and wards that
 * appear in the property labels (e.g. "TP.HCM · Quận 1" → "HCMC · District 1"). Street addresses are not translated: they
 * are shown as written, marked `lang="vi"`. Build-team draft for owner review.
 */
const PLACES: readonly (readonly [RegExp, string])[] = [
  [/TP\.\s?Hồ Chí Minh/g, "Ho Chi Minh City"],
  [/Thành phố Hồ Chí Minh/g, "Ho Chi Minh City"],
  [/TP\.?\s?HCM/g, "HCMC"],
  [/\bHồ Chí Minh\b/g, "Ho Chi Minh City"],
  [/Quận (\d+)/g, "District $1"],
  [/[Pp]hường Sài Gòn/g, "Saigon Ward"],
  [/[Pp]hường Tân Định/g, "Tan Dinh Ward"],
  [/[Pp]hường Đa Kao/g, "Da Kao Ward"],
  [/Đà Nẵng/g, "Da Nang"],
  [/Hải Châu/g, "Hai Chau"],
  [/Sơn Trà/g, "Son Tra"],
];

export function placeLabel(label: string, locale: Locale): string {
  if (locale === "vi") return label;
  return PLACES.reduce((text, [pattern, english]) => text.replace(pattern, english), label);
}
