import type { ZodError } from "zod";
import { ForbiddenError } from "@/core/permissions";
import { tr, type T } from "@/core/i18n";

export type ActionState = { error?: string; fieldErrors?: Record<string, string> };

/** FormData → plain object; blank strings become undefined so Zod `.optional()` works. */
export function formToObject(fd: FormData) {
  const o: Record<string, string | undefined> = {};
  for (const [k, v] of fd.entries()) {
    if (typeof v === "string") o[k] = v.trim() === "" ? undefined : v.trim();
  }
  return o;
}

export function zodErrors(err: ZodError, t: T): ActionState {
  const fieldErrors: Record<string, string> = {};
  for (const issue of err.issues) {
    const k = String(issue.path[0] ?? "");
    // A blank required field arrives as `undefined` (see formToObject) → invalid_type.
    if (!fieldErrors[k]) fieldErrors[k] = issue.code === "invalid_type" ? t.errors.required : tr(t, issue.message);
  }
  return { error: t.errors.pleaseFix, fieldErrors };
}

/** Converts permission failures into a form error; rethrows everything else (incl. redirects). */
export function toActionError(e: unknown, t: T): ActionState {
  if (e instanceof ForbiddenError) return { error: t.common.forbidden };
  throw e;
}

export const PAGE_SIZE = 20;
export function pageParam(v: string | string[] | undefined) {
  const n = parseInt(Array.isArray(v) ? v[0] : v ?? "1", 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}
export function strParam(v: string | string[] | undefined) {
  const s = Array.isArray(v) ? v[0] : v;
  return s && s.trim() ? s.trim() : undefined;
}
