import { db } from "@/core/db";
import { diff } from "@/core/audit";
import type { T } from "@/core/i18n";

export const ENTITIES = ["CONTACT", "COMPANY", "DEAL"] as const;
export type Entity = (typeof ENTITIES)[number];
export const FIELD_TYPES = ["TEXT", "NUMBER", "DATE", "DROPDOWN"] as const;
export type FieldType = (typeof FIELD_TYPES)[number];

export type FieldDef = {
  id: string;
  entity: Entity;
  key: string;
  label: string;
  type: FieldType;
  options: string[];
  required: boolean;
  position: number;
};

export type CustomValues = Record<string, string | number | null>;

export async function getFieldDefs(entity: Entity): Promise<FieldDef[]> {
  const rows = await db.customFieldDef.findMany({ where: { entity }, orderBy: { position: "asc" } });
  return rows.map((r) => ({
    id: r.id,
    entity: r.entity as Entity,
    key: r.key,
    label: r.label,
    type: r.type as FieldType,
    options: Array.isArray(r.options) ? (r.options as string[]) : [],
    required: r.required,
    position: r.position,
  }));
}

/** Values for many records at once, keyed by recordId then field key. */
export async function getFieldValuesMany(entity: Entity, recordIds: string[]) {
  const out = new Map<string, CustomValues>();
  if (!recordIds.length) return out;
  const rows = await db.customFieldValue.findMany({
    where: { entity, recordId: { in: recordIds } },
    include: { field: true },
  });
  for (const r of rows) {
    const m = out.get(r.recordId) ?? {};
    m[r.field.key] = r.value as string | number | null;
    out.set(r.recordId, m);
  }
  return out;
}

export async function getFieldValues(entity: Entity, recordId: string): Promise<CustomValues> {
  return (await getFieldValuesMany(entity, [recordId])).get(recordId) ?? {};
}

export const customFieldInputName = (key: string) => `cf_${key}`;

/** Reads `cf_<key>` entries from a form and validates them against the definitions. */
export function parseCustomFields(defs: FieldDef[], fd: FormData, t: T) {
  const values: CustomValues = {};
  const errors: Record<string, string> = {};
  for (const d of defs) {
    const name = customFieldInputName(d.key);
    const raw = String(fd.get(name) ?? "").trim();
    if (!raw) {
      values[d.key] = null;
      if (d.required) errors[name] = t.tpl(t.errors.fieldRequired, { label: d.label });
      continue;
    }
    if (d.type === "NUMBER") {
      const n = Number(raw);
      if (!Number.isFinite(n)) errors[name] = t.tpl(t.errors.fieldNumber, { label: d.label });
      else values[d.key] = n;
    } else if (d.type === "DATE") {
      if (Number.isNaN(Date.parse(raw))) errors[name] = t.tpl(t.errors.fieldDate, { label: d.label });
      else values[d.key] = raw.slice(0, 10);
    } else if (d.type === "DROPDOWN") {
      if (!d.options.includes(raw)) errors[name] = t.tpl(t.errors.fieldOption, { label: d.label });
      else values[d.key] = raw;
    } else {
      values[d.key] = raw.slice(0, 2000);
    }
  }
  return { values, errors };
}

/** Upserts non-null values, deletes null ones. Returns audit diff of changed fields. */
export async function saveFieldValues(entity: Entity, recordId: string, defs: FieldDef[], values: CustomValues) {
  const before = await getFieldValues(entity, recordId);
  for (const d of defs) {
    if (!(d.key in values)) continue;
    const v = values[d.key];
    if (v === null) {
      await db.customFieldValue.deleteMany({ where: { fieldId: d.id, recordId } });
    } else {
      await db.customFieldValue.upsert({
        where: { fieldId_recordId: { fieldId: d.id, recordId } },
        update: { value: v },
        create: { fieldId: d.id, entity, recordId, value: v },
      });
    }
  }
  const prefix = (o: CustomValues) => Object.fromEntries(Object.entries(o).map(([k, v]) => [`custom.${k}`, v]));
  return diff(prefix(before), prefix(values));
}

export async function deleteFieldValues(entity: Entity, recordId: string) {
  await db.customFieldValue.deleteMany({ where: { entity, recordId } });
}
