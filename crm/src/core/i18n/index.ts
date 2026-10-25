import { en, type Dictionary } from "./en";
import { ar } from "./ar";

export const LOCALES = ["en", "ar"] as const;
export type Locale = (typeof LOCALES)[number];
export const defaultLocale: Locale = "en";
export const LOCALE_COOKIE = "crm_locale";
export const RTL_LOCALES: Locale[] = ["ar"];

export const LOCALE_NAMES: Record<Locale, string> = { en: "English", ar: "العربية" };

const dictionaries: Record<Locale, Dictionary> = { en, ar };

/** Intl tags: Gregorian calendar and Latin digits for Arabic, so dates, phones and SAR amounts stay unambiguous. */
const INTL_TAG: Record<Locale, string> = { en: "en-GB", ar: "ar-SA-u-ca-gregory-nu-latn" };

export const isLocale = (v: unknown): v is Locale => LOCALES.includes(v as Locale);
export const getDirection = (locale: Locale): "ltr" | "rtl" => (RTL_LOCALES.includes(locale) ? "rtl" : "ltr");

/** Replace `{name}` placeholders: tpl("Hello {n}", { n: "Sara" }). */
export function tpl(str: string, vars: Record<string, string | number> = {}) {
  return str.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
}

type Helpers = {
  locale: Locale;
  dir: "ltr" | "rtl";
  tpl: typeof tpl;
  /** SAR amount, locale-aware. */
  money: (value: number, currency?: string) => string;
  date: (d: Date | string | null | undefined) => string;
  dateTime: (d: Date | string | null | undefined) => string;
  monthShort: (d: Date) => string;
  monthYear: (d: Date) => string;
  /** Short weekday names starting Sunday. */
  weekdays: () => string[];
};
export type T = Dictionary & Helpers;

const cache = new Map<Locale, T>();

/** Dictionary + locale-aware formatters for one language. Works on server and client. */
export function makeT(locale: Locale): T {
  const hit = cache.get(locale);
  if (hit) return hit;
  const tag = INTL_TAG[locale];
  const dash = "—";
  const t: T = {
    ...dictionaries[locale],
    locale,
    dir: getDirection(locale),
    tpl,
    money: (value, currency = "SAR") => new Intl.NumberFormat(tag, { style: "currency", currency, maximumFractionDigits: 0 }).format(value),
    date: (d) => (d ? new Intl.DateTimeFormat(tag, { dateStyle: "medium" }).format(new Date(d)) : dash),
    dateTime: (d) => (d ? new Intl.DateTimeFormat(tag, { dateStyle: "medium", timeStyle: "short" }).format(new Date(d)) : dash),
    monthShort: (d) => new Intl.DateTimeFormat(tag, { month: "short" }).format(d),
    monthYear: (d) => new Intl.DateTimeFormat(tag, { month: "long", year: "numeric" }).format(d),
    weekdays: () => {
      const f = new Intl.DateTimeFormat(tag, { weekday: "short" });
      return Array.from({ length: 7 }, (_, i) => f.format(new Date(2024, 0, 7 + i))); // 7 Jan 2024 is a Sunday
    },
  };
  cache.set(locale, t);
  return t;
}

/** Validation messages travel as `err:<key>` and are translated where they are shown. */
export function tr(t: T, message: string) {
  return message.startsWith("err:") ? ((t.errors as Record<string, string>)[message.slice(4)] ?? message) : message;
}
