"use client";
import { useTransition } from "react";
import { Languages } from "lucide-react";
import { setLocale } from "@/core/i18n/actions";
import { LOCALES, LOCALE_NAMES } from "@/core/i18n";
import { useT } from "@/core/i18n/client";

/** Toggles to the other language; the choice is stored in a cookie. */
export function LanguageSwitcher() {
  const t = useT();
  const [pending, start] = useTransition();
  const next = LOCALES.find((l) => l !== t.locale) ?? "en";
  return (
    <button
      onClick={() => start(() => setLocale(next))}
      disabled={pending}
      aria-label={t.common.language}
      title={t.common.language}
      className="flex h-10 items-center gap-1.5 rounded-full bg-card px-3 text-sm font-medium shadow-sm hover:bg-accent disabled:opacity-60"
    >
      <Languages className="h-4 w-4 text-coral" />
      <span>{LOCALE_NAMES[next]}</span>
    </button>
  );
}
