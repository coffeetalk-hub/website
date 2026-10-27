"use client";
import { createContext, useContext, useMemo } from "react";
import { makeT, type Locale, type T } from "./index";

const I18nContext = createContext<Locale>("en");

export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <I18nContext.Provider value={locale}>{children}</I18nContext.Provider>;
}

/** Translator for client components (locale comes from the server via the provider). */
export function useT(): T {
  const locale = useContext(I18nContext);
  return useMemo(() => makeT(locale), [locale]);
}
