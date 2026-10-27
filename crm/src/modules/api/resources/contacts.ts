import type { Prisma } from "@prisma/client";
import { db } from "@/core/db";
import { assertCan, assertOwns, canAccess, scope } from "@/core/permissions";
import { requireWrite } from "@/core/api/auth";
import { deleteFieldValues, getFieldValues, getFieldValuesMany, saveFieldValues, type CustomValues } from "@/core/custom-fields";
import { diff, logAudit } from "@/core/audit";
import { contactSchema } from "@/modules/contacts/schema";
import { resolveOwnerId } from "@/modules/users/queries";
import { mergePatch, normalize, parseCustom, rejectUnknown, validationError, zodFields } from "../helpers";
import type { ApiResource } from "../types";

const KEYS = ["firstName", "lastName", "email", "phone", "jobTitle", "source", "companyId", "ownerId"];

type Row = NonNullable<Awaited<ReturnType<typeof db.contact.findUnique>>>;
const ser = (c: Row, custom: CustomValues = {}) => ({
  id: c.id, firstName: c.firstName, lastName: c.lastName, email: c.email, phone: c.phone, jobTitle: c.jobTitle, source: c.source,
  companyId: c.companyId, ownerId: c.ownerId, custom, createdAt: c.createdAt.toISOString(), updatedAt: c.updatedAt.toISOString(),
});

async function linkedCompany(ctx: Parameters<NonNullable<ApiResource["create"]>>[0], id?: string) {
  if (!id) return null;
  const c = await db.company.findUnique({ where: { id } });
  if (!c) throw validationError({ companyId: "Company not found" });
  assertOwns(ctx.user, "company", c); // a rep can only link companies they own
  return c.id;
}

export const contacts: ApiResource = {
  filterKeys: ["companyId", "ownerId", "source"],
  async list(ctx, p) {
    const where: Prisma.ContactWhereInput = {
      ...scope(ctx.user, "contact"),
      ...(p.updatedSince ? { updatedAt: { gte: p.updatedSince } } : {}),
      ...(p.filters.companyId ? { companyId: p.filters.companyId } : {}),
      ...(p.filters.ownerId ? { ownerId: p.filters.ownerId } : {}),
      ...(p.filters.source ? { source: p.filters.source } : {}),
      ...(p.q ? { OR: [{ firstName: { contains: p.q } }, { lastName: { contains: p.q } }, { email: { contains: p.q } }, { phone: { contains: p.q } }] } : {}),
    };
    const [rows, total] = await Promise.all([db.contact.findMany({ where, orderBy: [{ createdAt: "desc" }, { id: "asc" }], skip: (p.page - 1) * p.limit, take: p.limit }), db.contact.count({ where })]);
    const custom = await getFieldValuesMany("CONTACT", rows.map((r) => r.id));
    return { data: rows.map((r) => ser(r, custom.get(r.id))), total };
  },
  async get(ctx, id) {
    const c = await db.contact.findUnique({ where: { id } });
    return c && canAccess(ctx.user, "contact", c) ? ser(c, await getFieldValues("CONTACT", id)) : null;
  },
  async create(ctx, body) {
    requireWrite(ctx);
    assertCan(ctx.user, "contact", "create");
    rejectUnknown(body, KEYS);
    const parsed = contactSchema.safeParse(normalize(body, KEYS));
    const cf = await parseCustom("CONTACT", body, false);
    if (!parsed.success || Object.keys(cf.fields).length) throw validationError({ ...(parsed.success ? {} : zodFields(parsed.error)), ...cf.fields });
    const { ownerId, companyId, ...data } = parsed.data;
    const rec = await db.contact.create({ data: { ...data, companyId: await linkedCompany(ctx, companyId), ownerId: await resolveOwnerId(ctx.user, ownerId) } });
    await saveFieldValues("CONTACT", rec.id, cf.used, cf.values);
    await logAudit(ctx.user, "Contact", rec.id, "CREATE", { name: `${rec.firstName} ${rec.lastName}`, via: "api" });
    return ser(rec, await getFieldValues("CONTACT", rec.id));
  },
  async update(ctx, id, body) {
    requireWrite(ctx);
    const existing = await db.contact.findUnique({ where: { id } });
    if (!existing || !canAccess(ctx.user, "contact", existing)) return null;
    assertCan(ctx.user, "contact", "update");
    rejectUnknown(body, KEYS);
    const base = { firstName: existing.firstName, lastName: existing.lastName, email: existing.email ?? undefined, phone: existing.phone ?? undefined, jobTitle: existing.jobTitle ?? undefined, source: existing.source ?? undefined, companyId: existing.companyId ?? undefined, ownerId: existing.ownerId };
    const parsed = contactSchema.safeParse(mergePatch(base, body, KEYS));
    const cf = await parseCustom("CONTACT", body, true);
    if (!parsed.success || Object.keys(cf.fields).length) throw validationError({ ...(parsed.success ? {} : zodFields(parsed.error)), ...cf.fields });
    const { ownerId, companyId, ...d } = parsed.data;
    const updated = await db.contact.update({
      where: { id },
      data: { firstName: d.firstName, lastName: d.lastName, email: d.email ?? null, phone: d.phone ?? null, jobTitle: d.jobTitle ?? null, source: d.source ?? null, companyId: await linkedCompany(ctx, companyId), ownerId: await resolveOwnerId(ctx.user, ownerId ?? existing.ownerId) },
    });
    const customDiff = await saveFieldValues("CONTACT", id, cf.used, cf.values);
    const changes = { ...diff(existing, updated), ...customDiff };
    if (Object.keys(changes).length) await logAudit(ctx.user, "Contact", id, "UPDATE", changes);
    return ser(updated, await getFieldValues("CONTACT", id));
  },
  async remove(ctx, id) {
    requireWrite(ctx);
    const existing = await db.contact.findUnique({ where: { id } });
    if (!existing || !canAccess(ctx.user, "contact", existing)) return false;
    assertCan(ctx.user, "contact", "delete");
    await db.contact.delete({ where: { id } });
    await deleteFieldValues("CONTACT", id);
    await logAudit(ctx.user, "Contact", id, "DELETE", { name: `${existing.firstName} ${existing.lastName}`, via: "api" });
    return true;
  },
};
