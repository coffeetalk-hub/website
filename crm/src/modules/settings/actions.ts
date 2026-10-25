"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/core/db";
import { requireUser } from "@/core/auth/session";
import { getT } from "@/core/i18n/server";
import { tr, type T } from "@/core/i18n";
import { assertCan } from "@/core/permissions";
import { logAudit, diff } from "@/core/audit";
import { formToObject } from "@/core/forms";
import { ENTITIES, FIELD_TYPES } from "@/core/custom-fields";

/** Every settings action: server-side Admin check first. */
async function admin() {
  const user = await requireUser();
  assertCan(user, "settings", "manage");
  return { user, t: await getT() };
}

function done(kind: "ok" | "error", msg: string): never {
  revalidatePath("/settings");
  revalidatePath("/deals");
  redirect(`/settings?${kind}=${encodeURIComponent(msg)}`);
}

// ───────────── pipeline stages ─────────────
const stageSchema = z.object({
  name: z.string().min(1, "err:stageNameRequired").max(60),
  probability: z.coerce.number().int().min(0, "err:probabilityRange").max(100, "err:probabilityRange"),
  kind: z.enum(["OPEN", "WON", "LOST"]),
});

export async function createStage(fd: FormData) {
  const { user, t } = await admin();
  const p = stageSchema.safeParse(formToObject(fd));
  if (!p.success) done("error", tr(t, p.error.issues[0].message));
  const last = await db.stage.aggregate({ _max: { position: true } });
  const s = await db.stage.create({ data: { ...p.data, position: (last._max.position ?? -1) + 1 } });
  await logAudit(user, "Stage", s.id, "CREATE", { name: s.name });
  done("ok", t.tpl(t.settings.msg.stageAdded, { name: s.name }));
}

export async function updateStage(id: string, fd: FormData) {
  const { user, t } = await admin();
  const p = stageSchema.safeParse(formToObject(fd));
  if (!p.success) done("error", tr(t, p.error.issues[0].message));
  const before = await db.stage.findUnique({ where: { id } });
  if (!before) done("error", t.settings.msg.stageNotFound);
  const after = await db.stage.update({ where: { id }, data: p.data });
  const changes = diff(before, after);
  if (Object.keys(changes).length) await logAudit(user, "Stage", id, "UPDATE", changes);
  done("ok", t.tpl(t.settings.msg.stageSaved, { name: after.name }));
}

export async function moveStage(id: string, dir: "up" | "down") {
  const { user, t } = await admin();
  const all = await db.stage.findMany({ orderBy: { position: "asc" } });
  const i = all.findIndex((s) => s.id === id);
  const j = dir === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= all.length) done("ok", t.settings.msg.orderUnchanged);
  await db.$transaction([
    db.stage.update({ where: { id: all[i].id }, data: { position: all[j].position } }),
    db.stage.update({ where: { id: all[j].id }, data: { position: all[i].position } }),
  ]);
  await logAudit(user, "Stage", id, "MOVE", { direction: dir });
  done("ok", t.settings.msg.orderUpdated);
}

export async function deleteStage(id: string) {
  const { user, t } = await admin();
  const s = await db.stage.findUnique({ where: { id }, include: { _count: { select: { deals: true } } } });
  if (!s) done("error", t.settings.msg.stageNotFound);
  if (s._count.deals > 0) done("error", t.tpl(t.settings.msg.stageHasDeals, { name: s.name, n: s._count.deals }));
  if ((await db.stage.count()) <= 1) done("error", t.settings.msg.needOneStage);
  await db.stage.delete({ where: { id } });
  await logAudit(user, "Stage", id, "DELETE", { name: s.name });
  done("ok", t.tpl(t.settings.msg.stageDeleted, { name: s.name }));
}

// ───────────── custom fields ─────────────
const slug = (label: string) =>
  label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40) || "field";

const parseOptions = (raw: string | undefined) => [...new Set((raw ?? "").split(/[\n,]/).map((o) => o.trim()).filter(Boolean))].slice(0, 50);

const fieldBase = z.object({ label: z.string().min(1, "err:labelRequired").max(60), options: z.string().optional() });
const createFieldSchema = fieldBase.extend({ entity: z.enum(ENTITIES), type: z.enum(FIELD_TYPES) });

export async function createField(fd: FormData) {
  const { user, t } = await admin();
  const p = createFieldSchema.safeParse(formToObject(fd));
  if (!p.success) done("error", tr(t, p.error.issues[0].message));
  const options = p.data.type === "DROPDOWN" ? parseOptions(p.data.options) : [];
  if (p.data.type === "DROPDOWN" && options.length === 0) done("error", t.settings.msg.dropdownNeedsOption);

  let key = slug(p.data.label);
  for (let n = 2; await db.customFieldDef.findUnique({ where: { entity_key: { entity: p.data.entity, key } } }); n++) key = `${slug(p.data.label)}_${n}`;
  const last = await db.customFieldDef.aggregate({ where: { entity: p.data.entity }, _max: { position: true } });
  const f = await db.customFieldDef.create({
    data: {
      entity: p.data.entity,
      key,
      label: p.data.label,
      type: p.data.type,
      options: p.data.type === "DROPDOWN" ? options : undefined,
      required: fd.get("required") === "on",
      position: (last._max.position ?? -1) + 1,
    },
  });
  await logAudit(user, "CustomField", f.id, "CREATE", { entity: f.entity, label: f.label, type: f.type });
  done("ok", t.tpl(t.settings.msg.fieldAdded, { label: f.label }));
}

export async function updateField(id: string, fd: FormData) {
  const { user, t } = await admin();
  const p = fieldBase.safeParse(formToObject(fd));
  if (!p.success) done("error", tr(t, p.error.issues[0].message));
  const before = await db.customFieldDef.findUnique({ where: { id } });
  if (!before) done("error", t.settings.msg.fieldNotFound);
  let options: string[] | undefined;
  if (before.type === "DROPDOWN") {
    options = parseOptions(p.data.options);
    if (options.length === 0) done("error", t.settings.msg.dropdownNeedsOption);
  }
  const after = await db.customFieldDef.update({
    where: { id },
    data: { label: p.data.label, required: fd.get("required") === "on", ...(options ? { options } : {}) },
  });
  const changes = diff(before, after);
  if (Object.keys(changes).length) await logAudit(user, "CustomField", id, "UPDATE", changes);
  done("ok", t.tpl(t.settings.msg.fieldSaved, { label: after.label }));
}

export async function moveField(id: string, dir: "up" | "down") {
  const { user, t } = await admin();
  const f = await db.customFieldDef.findUnique({ where: { id } });
  if (!f) done("error", t.settings.msg.fieldNotFound);
  const all = await db.customFieldDef.findMany({ where: { entity: f.entity }, orderBy: { position: "asc" } });
  const i = all.findIndex((x) => x.id === id);
  const j = dir === "up" ? i - 1 : i + 1;
  if (j < 0 || j >= all.length) done("ok", t.settings.msg.orderUnchanged);
  await db.$transaction([
    db.customFieldDef.update({ where: { id: all[i].id }, data: { position: all[j].position } }),
    db.customFieldDef.update({ where: { id: all[j].id }, data: { position: all[i].position } }),
  ]);
  await logAudit(user, "CustomField", id, "MOVE", { direction: dir });
  done("ok", t.settings.msg.orderUpdated);
}

export async function deleteField(id: string) {
  const { user, t } = await admin();
  const f = await db.customFieldDef.findUnique({ where: { id } });
  if (!f) done("error", t.settings.msg.fieldNotFound);
  await db.customFieldDef.delete({ where: { id } }); // values cascade
  await logAudit(user, "CustomField", id, "DELETE", { entity: f.entity, label: f.label });
  done("ok", t.tpl(t.settings.msg.fieldDeleted, { label: f.label }));
}
