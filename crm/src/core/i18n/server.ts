import { cache } from "react";
import { cookies } from "next/headers";
import { LOCALE_COOKIE, defaultLocale, isLocale, makeT, type Locale, type T } from "./index";

export const getLocale = cache(async (): Promise<Locale> => {
  const v = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(v) ? v : defaultLocale;
});

/** Per-request translator for server components, actions and route handlers. */
export async function getT(): Promise<T> {
  return makeT(await getLocale());
}
