/**
 * Languages and translatable text.
 *
 * Content is written once per property with every translatable field as a LocalizedText.
 * Pages never see that shape: a record is resolved to one language first (resolveLocalized),
 * so components work with plain strings.
 *
 * Vietnamese is the primary language and is always present. Any other language is optional
 * per field and is only served once a record lists it in `approvedLocales`.
 */

export const LOCALES = ["vi", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "vi";

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

export type LocalizedText = Readonly<{ vi: string } & Partial<Record<Exclude<Locale, "vi">, string>>>;

/** The same structure with every LocalizedText replaced by a plain string. */
export type Resolved<T> = T extends LocalizedText
  ? string
  : T extends string | number | boolean | null | undefined
    ? T
    : T extends readonly (infer Item)[]
      ? readonly Resolved<Item>[]
      : T extends object
        ? { readonly [Key in keyof T]: Resolved<T[Key]> }
        : T;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isLocalizedText(value: unknown): value is LocalizedText {
  if (!isPlainObject(value) || typeof value.vi !== "string") return false;
  return Object.entries(value).every(([key, text]) => isLocale(key) && typeof text === "string");
}

/**
 * Replaces every LocalizedText inside a value with its text in one language.
 * A missing translation falls back to Vietnamese so a page is never left with a blank;
 * validation (missingTranslations) is what stops an incomplete language being approved.
 */
export function resolveLocalized<T>(value: T, locale: Locale): Resolved<T> {
  if (isLocalizedText(value)) return (value[locale] ?? value.vi) as Resolved<T>;
  if (Array.isArray(value)) return value.map((item) => resolveLocalized(item, locale)) as Resolved<T>;
  if (isPlainObject(value)) {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, resolveLocalized(item, locale)])) as Resolved<T>;
  }
  return value as Resolved<T>;
}

/** Paths of every LocalizedText that has no (or only blank) text in the given language. */
export function missingTranslations(value: unknown, locale: Locale, path = ""): string[] {
  if (isLocalizedText(value)) return value[locale]?.trim() ? [] : [path || "(root)"];
  if (Array.isArray(value)) return value.flatMap((item, index) => missingTranslations(item, locale, `${path}[${index}]`));
  if (isPlainObject(value)) {
    return Object.entries(value).flatMap(([key, item]) => missingTranslations(item, locale, path ? `${path}.${key}` : key));
  }
  return [];
}

/**
 * Interface wording per language (bilingual preview, 6/11/2026): one entry per locale, so the type itself refuses a missing
 * language. Used for UI copy with plural or number-bearing phrases (functions), alongside LocalizedText for content.
 */
export type ByLocale<T> = Readonly<Record<Locale, T>>;

export function inLocale<T>(copy: ByLocale<T>, locale: Locale): T {
  return copy[locale];
}
