"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/core/db";
import { requireUser } from "@/core/auth/session";
import { assertCan } from "@/core/permissions";
import { logAudit, diff } from "@/core/audit";
import { formToObject } from "@/core/forms";
import { ENTITIES, FIELD_TYPES } from "@/core/custom-fields";

/** Every settings action: server-side Admin check first. */
async function admin() {
  const user = await requireUser();
  assertCan(user, "settings", "manage");
  return user;
}

function done(kind: "ok" | "error", msg: string): never {
  revalidatePath("/settings");
  revalidatePath("/deals");
  redirect(`/settings?${kind}=${encodeURIComponent(msg)}`);
}

// ───────────── pipeline stages ─────────────
const stageSchema = z.object({
  name: z.string().min(1, "Stage name is required").max(60),
  probability: z.coerce.number().int().min(0, "Probability must be 0-100").max(100, "Probability must be 0-100"),
  kind: z.enum(["OPEN", "WON", "LOST"]),
});

export async function createStage(fd: FormData) {
  const user = await admin();
  const p = stageSchema.safeParse(formToObject(fd));
  if (!p.success) done("error", p.error.issues[0].message);
  const last = await db.stage.aggregate({ _max: { position: true } });
  const s = await db.stage.create({ data: { ...p.data, position: (last._max.position ?? -1) + 1 } });
  await logAudit(user, "Stage", s.id, "CREATE", { name: s.name });
  done("ok", `Stage “${s.name}” added`);
}

export async function updateStage(id: string, fd: FormData) {
  const user = await admin();
  const p = stageSchema.safeParse(formToObject(fd));
  if (!p.success) done("error", p.error.issues[0].message);
  const before = await db.stage.findUnique({ where: { id } });
  if (!before) done("error", "Stage not found");
  const after = await db.stage.update({ where: { id }, data: p.data });
  const changes = diff(before, after);
  if (Object.keys(changes).length) await logAudit(user, "Stage", id, "UPDATE", changes);
  done("ok", `Stage “${after.name}” saved`);
}

export async function moveStage(id: string, dir: "up" | "down") {
  const user = await admin();
  const all = await db.stage.findMany({ orderBy: { position: "asc" } });
  const i = all.findIndex((s) => s.id === id);
  const j = dir === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= all.length) done("ok", "Order unchanged");
  await db.$transaction([
    db.stage.update({ where: { id: all[i].id }, data: { position: all[j].position } }),
    db.stage.update({ where: { id: all[j].id }, data: { position: all[i].position } }),
  ]);
  await logAudit(user, "Stage", id, "MOVE", { direction: dir });
  done("ok", "Order updated");
}

export async function deleteStage(id: string) {
  const user = await admin();
  const s = await db.stage.findUnique({ where: { id }, include: { _count: { select: { deals: true } } } });
  if (!s) done("error", "Stage not found");
  if (s._count.deals > 0) done("error", `“${s.name}” still has ${s._count.deals} deal(s). Move them to another stage first.`);
  if ((await db.stage.count()) <= 1) done("error", "You need at least one stage.");
  await db.stage.delete({ where: { id } });
  await logAudit(user, "Stage", id, "DELETE", { name: s.name });
  done("ok", `Stage “${s.name}” deleted`);
}

// ───────────── custom fields ─────────────
const slug = (label: string) =>
  label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40) || "field";

const parseOptions = (raw: string | undefined) => [...new Set((raw ?? "").split(/[\n,]/).map((o) => o.trim()).filter(Boolean))].slice(0, 50);

const fieldBase = z.object({ label: z.string().min(1, "Label is required").max(60), options: z.string().optional() });
const createFieldSchema = fieldBase.extend({ entity: z.enum(ENTITIES), type: z.enum(FIELD_TYPES) });

export async function createField(fd: FormData) {
  const user = await admin();
  const p = createFieldSchema.safeParse(formToObject(fd));
  if (!p.success) done("error", p.error.issues[0].message);
  const options = p.data.type === "DROPDOWN" ? parseOptions(p.data.options) : [];
  if (p.data.type === "DROPDOWN" && options.length === 0) done("error", "A dropdown needs at least one option.");

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
  done("ok", `Field “${f.label}” added to ${f.entity.toLowerCase()}s`);
}

export async function updateField(id: string, fd: FormData) {
  const user = await admin();
  const p = fieldBase.safeParse(formToObject(fd));
  if (!p.success) done("error", p.error.issues[0].message);
  const before = await db.customFieldDef.findUnique({ where: { id } });
  if (!before) done("error", "Field not found");
  let options: string[] | undefined;
  if (before.type === "DROPDOWN") {
    options = parseOptions(p.data.options);
    if (options.length === 0) done("error", "A dropdown needs at least one option.");
  }
  const after = await db.customFieldDef.update({
    where: { id },
    data: { label: p.data.label, required: fd.get("required") === "on", ...(options ? { options } : {}) },
  });
  const changes = diff(before, after);
  if (Object.keys(changes).length) await logAudit(user, "CustomField", id, "UPDATE", changes);
  done("ok", `Field “${after.label}” saved`);
}

export async function moveField(id: string, dir: "up" | "down") {
  const user = await admin();
  const f = await db.customFieldDef.findUnique({ where: { id } });
  if (!f) done("error", "Field not found");
  const all = await db.customFieldDef.findMany({ where: { entity: f.entity }, orderBy: { position: "asc" } });
  const i = all.findIndex((x) => x.id === id);
  const j = dir === "up" ? i - 1 : i + 1;
  if (j < 0 || j >= all.length) done("ok", "Order unchanged");
  await db.$transaction([
    db.customFieldDef.update({ where: { id: all[i].id }, data: { position: all[j].position } }),
    db.customFieldDef.update({ where: { id: all[j].id }, data: { position: all[i].position } }),
  ]);
  await logAudit(user, "CustomField", id, "MOVE", { direction: dir });
  done("ok", "Order updated");
}

export async function deleteField(id: string) {
  const user = await admin();
  const f = await db.customFieldDef.findUnique({ where: { id } });
  if (!f) done("error", "Field not found");
  await db.customFieldDef.delete({ where: { id } }); // values cascade
  await logAudit(user, "CustomField", id, "DELETE", { entity: f.entity, label: f.label });
  done("ok", `Field “${f.label}” and its values were deleted`);
}
