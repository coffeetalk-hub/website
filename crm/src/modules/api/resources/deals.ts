import type { Prisma } from "@prisma/client";
import { db } from "@/core/db";
import { assertCan, assertOwns, canAccess, scope } from "@/core/permissions";
import { requireWrite } from "@/core/api/auth";
import { deleteFieldValues, getFieldValues, getFieldValuesMany, saveFieldValues, type CustomValues } from "@/core/custom-fields";
import { diff, logAudit } from "@/core/audit";
import { dealSchema } from "@/modules/deals/schema";
import { resolveOwnerId } from "@/modules/users/queries";
import { day, mergePatch, normalize, parseCustom, rejectUnknown, validationError, zodFields } from "../helpers";
import type { ApiResource } from "../types";

const KEYS = ["title", "value", "stageId", "expectedCloseDate", "companyId", "contactId", "ownerId"];
type Row = NonNullable<Awaited<ReturnType<typeof db.deal.findUnique>>>;
const ser = (d: Row, custom: CustomValues = {}) => ({
  id: d.id, title: d.title, value: d.value, currency: d.currency, stageId: d.stageId, expectedCloseDate: day(d.expectedCloseDate),
  companyId: d.companyId, contactId: d.contactId, ownerId: d.ownerId, custom, createdAt: d.createdAt.toISOString(), updatedAt: d.updatedAt.toISOString(),
});

type Ctx = Parameters<NonNullable<ApiResource["create"]>>[0];
async function links(ctx: Ctx, companyId?: string, contactId?: string) {
  const out = { companyId: null as string | null, contactId: null as string | null };
  if (companyId) {
    const c = await db.company.findUnique({ where: { id: companyId } });
    if (!c) throw validationError({ companyId: "Company not found" });
    assertOwns(ctx.user, "company", c);
    out.companyId = c.id;
  }
  if (contactId) {
    const k = await db.contact.findUnique({ where: { id: contactId } });
    if (!k) throw validationError({ contactId: "Contact not found" });
    assertOwns(ctx.user, "contact", k);
    out.contactId = k.id;
  }
  return out;
}

async function stageOrThrow(id: string) {
  const s = await db.stage.findUnique({ where: { id } });
  if (!s) throw validationError({ stageId: "Unknown stage" });
  return s;
}

export const deals: ApiResource = {
  filterKeys: ["stageId", "ownerId", "companyId", "contactId"],
  async list(ctx, p) {
    const where: Prisma.DealWhereInput = {
      ...scope(ctx.user, "deal"),
      ...(p.updatedSince ? { updatedAt: { gte: p.updatedSince } } : {}),
      ...(p.filters.stageId ? { stageId: p.filters.stageId } : {}),
      ...(p.filters.ownerId ? { ownerId: p.filters.ownerId } : {}),
      ...(p.filters.companyId ? { companyId: p.filters.companyId } : {}),
      ...(p.filters.contactId ? { contactId: p.filters.contactId } : {}),
      ...(p.q ? { OR: [{ title: { contains: p.q } }, { company: { name: { contains: p.q } } }] } : {}),
    };
    const [rows, total] = await Promise.all([db.deal.findMany({ where, orderBy: [{ createdAt: "desc" }, { id: "asc" }], skip: (p.page - 1) * p.limit, take: p.limit }), db.deal.count({ where })]);
    const custom = await getFieldValuesMany("DEAL", rows.map((r) => r.id));
    return { data: rows.map((r) => ser(r, custom.get(r.id))), total };
  },
  async get(ctx, id) {
    const d = await db.deal.findUnique({ where: { id } });
    return d && canAccess(ctx.user, "deal", d) ? ser(d, await getFieldValues("DEAL", id)) : null;
  },
  async create(ctx, body) {
    requireWrite(ctx);
    assertCan(ctx.user, "deal", "create");
    rejectUnknown(body, KEYS);
    const parsed = dealSchema.safeParse(normalize(body, KEYS));
    const cf = await parseCustom("DEAL", body, false);
    if (!parsed.success || Object.keys(cf.fields).length) throw validationError({ ...(parsed.success ? {} : zodFields(parsed.error)), ...cf.fields });
    const { ownerId, companyId, contactId, expectedCloseDate, ...data } = parsed.data;
    await stageOrThrow(data.stageId);
    const last = await db.deal.aggregate({ where: { stageId: data.stageId }, _max: { position: true } });
    const rec = await db.deal.create({
      data: { ...data, expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : null, ...(await links(ctx, companyId, contactId)), ownerId: await resolveOwnerId(ctx.user, ownerId), position: (last._max.position ?? -1) + 1 },
    });
    await saveFieldValues("DEAL", rec.id, cf.used, cf.values);
    await logAudit(ctx.user, "Deal", rec.id, "CREATE", { title: rec.title, value: rec.value, via: "api" });
    return ser(rec, await getFieldValues("DEAL", rec.id));
  },
  async update(ctx, id, body) {
    requireWrite(ctx);
    const existing = await db.deal.findUnique({ where: { id }, include: { stage: true } });
    if (!existing || !canAccess(ctx.user, "deal", existing)) return null;
    assertCan(ctx.user, "deal", "update");
    rejectUnknown(body, KEYS);
    const base = { title: existing.title, value: String(existing.value), stageId: existing.stageId, expectedCloseDate: day(existing.expectedCloseDate) ?? undefined, companyId: existing.companyId ?? undefined, contactId: existing.contactId ?? undefined, ownerId: existing.ownerId };
    const parsed = dealSchema.safeParse(mergePatch(base, body, KEYS));
    const cf = await parseCustom("DEAL", body, true);
    if (!parsed.success || Object.keys(cf.fields).length) throw validationError({ ...(parsed.success ? {} : zodFields(parsed.error)), ...cf.fields });
    const { ownerId, companyId, contactId, expectedCloseDate, ...d } = parsed.data;
    const newStage = await stageOrThrow(d.stageId);
    const moved = d.stageId !== existing.stageId;
    const last = moved ? await db.deal.aggregate({ where: { stageId: d.stageId }, _max: { position: true } }) : null;
    const updated = await db.deal.update({
      where: { id },
      data: { ...d, expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : null, ...(await links(ctx, companyId, contactId)), ownerId: await resolveOwnerId(ctx.user, ownerId ?? existing.ownerId), ...(moved ? { position: (last!._max.position ?? -1) + 1 } : {}) },
    });
    const customDiff = await saveFieldValues("DEAL", id, cf.used, cf.values);
    const changes: Record<string, unknown> = { ...diff(existing as unknown as Record<string, unknown>, updated), ...customDiff };
    delete changes.position;
    delete changes.stage;
    if (Object.keys(changes).length) await logAudit(ctx.user, "Deal", id, "UPDATE", changes);
    if (moved) await logAudit(ctx.user, "Deal", id, "MOVE", { stage: { from: existing.stage.name, to: newStage.name } });
    return ser(updated, await getFieldValues("DEAL", id));
  },
  async remove(ctx, id) {
    requireWrite(ctx);
    const existing = await db.deal.findUnique({ where: { id } });
    if (!existing || !canAccess(ctx.user, "deal", existing)) return false;
    assertCan(ctx.user, "deal", "delete");
    await db.deal.delete({ where: { id } });
    await deleteFieldValues("DEAL", id);
    await logAudit(ctx.user, "Deal", id, "DELETE", { title: existing.title, via: "api" });
    return true;
  },
};
