import { en, type Dictionary } from "./en";

export type Locale = "en";
export const RTL_LOCALES: string[] = ["ar"]; // add "ar" to Locale + dictionaries to enable

const dictionaries: Record<Locale, Dictionary> = { en };

export const defaultLocale: Locale = "en";

/** Server + client safe: returns the dictionary for a locale. */
export function getDictionary(locale: Locale = defaultLocale): Dictionary {
  return dictionaries[locale] ?? en;
}

export function getDirection(locale: string): "ltr" | "rtl" {
  return RTL_LOCALES.includes(locale) ? "rtl" : "ltr";
}

/** Shortcut used in server components and actions. */
export const t = getDictionary();
