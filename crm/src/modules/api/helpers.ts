import type { ZodError } from "zod";
import { ApiError } from "@/core/api/errors";
import { customFieldInputName, getFieldDefs, parseCustomFields, type Entity, type FieldDef } from "@/core/custom-fields";
import { makeT, tr } from "@/core/i18n";
import type { Body, ListParams } from "./types";

/** API messages are English. (Validation text comes from the same dictionary as the UI.) */
export const t = makeT("en");

export function parseListParams(url: URL, filterKeys: string[] = []): ListParams {
  const n = (v: string | null, d: number, max: number) => Math.min(max, Math.max(1, Number.isFinite(Number(v)) && v ? Math.trunc(Number(v)) : d));
  const since = url.searchParams.get("updated_since");
  const date = since ? new Date(since) : undefined;
  if (date && Number.isNaN(+date)) throw new ApiError(400, "invalid_parameter", "updated_since must be an ISO 8601 date.");
  const filters: Record<string, string | undefined> = {};
  for (const k of filterKeys) filters[k] = url.searchParams.get(k) || undefined;
  return { page: n(url.searchParams.get("page"), 1, 100000), limit: n(url.searchParams.get("limit"), 50, 100), q: url.searchParams.get("q")?.trim() || undefined, updatedSince: date, filters };
}

export async function readJson(req: Request): Promise<Body> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new ApiError(400, "invalid_json", "Request body must be valid JSON.");
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new ApiError(400, "invalid_json", "Request body must be a JSON object.");
  return body as Body;
}

/** JSON values → the string form the shared Zod schemas expect (null / "" mean "not set"). */
export function normalize(body: Body, keys: string[]) {
  const out: Record<string, string | undefined> = {};
  for (const k of keys) {
    if (!(k in body)) continue;
    const v = body[k];
    out[k] = v == null || v === "" ? undefined : String(v).trim() || undefined;
  }
  return out;
}

/** PATCH semantics: start from the stored values, override only the keys the client sent. */
export function mergePatch(existing: Record<string, string | undefined>, body: Body, keys: string[]) {
  return { ...existing, ...normalize(body, keys) };
}

export function rejectUnknown(body: Body, allowed: string[]) {
  const unknown = Object.keys(body).filter((k) => !allowed.includes(k) && k !== "custom");
  if (unknown.length) throw new ApiError(422, "unknown_field", `Unknown field(s): ${unknown.join(", ")}.`, Object.fromEntries(unknown.map((k) => [k, "Unknown field"])));
}

export function zodFields(e: ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of e.issues) {
    const k = String(i.path[0] ?? "");
    if (!out[k]) out[k] = i.code === "invalid_type" ? t.errors.required : tr(t, i.message);
  }
  return out;
}

export function validationError(fields: Record<string, string>) {
  return new ApiError(422, "validation_failed", "Validation failed.", fields);
}

/** Validates `custom: { key: value }` against the field definitions. `partial` (PATCH) only touches the keys sent. */
export async function parseCustom(entity: Entity, body: Body, partial: boolean) {
  const raw = body.custom ?? {};
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) throw new ApiError(400, "invalid_custom", "'custom' must be an object of field key → value.");
  const input = raw as Record<string, unknown>;
  const defs = await getFieldDefs(entity);
  const known = new Set(defs.map((d) => d.key));
  // unknown keys are reported together with every other validation problem
  const unknownFields = Object.fromEntries(Object.keys(input).filter((k) => !known.has(k)).map((k) => [`custom.${k}`, "Unknown custom field"]));
  const used: FieldDef[] = partial ? defs.filter((d) => d.key in input) : defs;
  const fd = new FormData();
  for (const d of used) fd.set(customFieldInputName(d.key), input[d.key] == null ? "" : String(input[d.key]));
  const { values, errors } = parseCustomFields(used, fd, t);
  const fields = Object.fromEntries(Object.entries(errors).map(([k, v]) => [`custom.${k.replace(/^cf_/, "")}`, v]));
  return { used, values, fields: { ...unknownFields, ...fields } };
}

export const iso = (d: Date | null) => (d ? d.toISOString() : null);
export const day = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : null);
