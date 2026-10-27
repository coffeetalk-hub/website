import type { Prisma } from "@prisma/client";
import { db } from "@/core/db";
import { assertCan, canAccess, scope } from "@/core/permissions";
import { requireWrite } from "@/core/api/auth";
import { deleteFieldValues, getFieldValues, getFieldValuesMany, saveFieldValues, type CustomValues } from "@/core/custom-fields";
import { diff, logAudit } from "@/core/audit";
import { companySchema } from "@/modules/companies/schema";
import { resolveOwnerId } from "@/modules/users/queries";
import { mergePatch, normalize, parseCustom, rejectUnknown, validationError, zodFields } from "../helpers";
import type { ApiResource } from "../types";

const KEYS = ["name", "industry", "website", "phone", "address", "ownerId"];
type Row = NonNullable<Awaited<ReturnType<typeof db.company.findUnique>>>;
const ser = (c: Row, custom: CustomValues = {}) => ({
  id: c.id, name: c.name, industry: c.industry, website: c.website, phone: c.phone, address: c.address, ownerId: c.ownerId, custom,
  createdAt: c.createdAt.toISOString(), updatedAt: c.updatedAt.toISOString(),
});

export const companies: ApiResource = {
  filterKeys: ["ownerId", "industry"],
  async list(ctx, p) {
    const where: Prisma.CompanyWhereInput = {
      ...scope(ctx.user, "company"),
      ...(p.updatedSince ? { updatedAt: { gte: p.updatedSince } } : {}),
      ...(p.filters.ownerId ? { ownerId: p.filters.ownerId } : {}),
      ...(p.filters.industry ? { industry: p.filters.industry } : {}),
      ...(p.q ? { OR: [{ name: { contains: p.q } }, { industry: { contains: p.q } }, { website: { contains: p.q } }] } : {}),
    };
    const [rows, total] = await Promise.all([db.company.findMany({ where, orderBy: [{ createdAt: "desc" }, { id: "asc" }], skip: (p.page - 1) * p.limit, take: p.limit }), db.company.count({ where })]);
    const custom = await getFieldValuesMany("COMPANY", rows.map((r) => r.id));
    return { data: rows.map((r) => ser(r, custom.get(r.id))), total };
  },
  async get(ctx, id) {
    const c = await db.company.findUnique({ where: { id } });
    return c && canAccess(ctx.user, "company", c) ? ser(c, await getFieldValues("COMPANY", id)) : null;
  },
  async create(ctx, body) {
    requireWrite(ctx);
    assertCan(ctx.user, "company", "create");
    rejectUnknown(body, KEYS);
    const parsed = companySchema.safeParse(normalize(body, KEYS));
    const cf = await parseCustom("COMPANY", body, false);
    if (!parsed.success || Object.keys(cf.fields).length) throw validationError({ ...(parsed.success ? {} : zodFields(parsed.error)), ...cf.fields });
    const { ownerId, ...data } = parsed.data;
    const rec = await db.company.create({ data: { ...data, ownerId: await resolveOwnerId(ctx.user, ownerId) } });
    await saveFieldValues("COMPANY", rec.id, cf.used, cf.values);
    await logAudit(ctx.user, "Company", rec.id, "CREATE", { name: rec.name, via: "api" });
    return ser(rec, await getFieldValues("COMPANY", rec.id));
  },
  async update(ctx, id, body) {
    requireWrite(ctx);
    const existing = await db.company.findUnique({ where: { id } });
    if (!existing || !canAccess(ctx.user, "company", existing)) return null;
    assertCan(ctx.user, "company", "update");
    rejectUnknown(body, KEYS);
    const base = { name: existing.name, industry: existing.industry ?? undefined, website: existing.website ?? undefined, phone: existing.phone ?? undefined, address: existing.address ?? undefined, ownerId: existing.ownerId };
    const parsed = companySchema.safeParse(mergePatch(base, body, KEYS));
    const cf = await parseCustom("COMPANY", body, true);
    if (!parsed.success || Object.keys(cf.fields).length) throw validationError({ ...(parsed.success ? {} : zodFields(parsed.error)), ...cf.fields });
    const { ownerId, ...d } = parsed.data;
    const updated = await db.company.update({ where: { id }, data: { name: d.name, industry: d.industry ?? null, website: d.website ?? null, phone: d.phone ?? null, address: d.address ?? null, ownerId: await resolveOwnerId(ctx.user, ownerId ?? existing.ownerId) } });
    const customDiff = await saveFieldValues("COMPANY", id, cf.used, cf.values);
    const changes = { ...diff(existing, updated), ...customDiff };
    if (Object.keys(changes).length) await logAudit(ctx.user, "Company", id, "UPDATE", changes);
    return ser(updated, await getFieldValues("COMPANY", id));
  },
  async remove(ctx, id) {
    requireWrite(ctx);
    const existing = await db.company.findUnique({ where: { id } });
    if (!existing || !canAccess(ctx.user, "company", existing)) return false;
    assertCan(ctx.user, "company", "delete");
    await db.company.delete({ where: { id } });
    await deleteFieldValues("COMPANY", id);
    await logAudit(ctx.user, "Company", id, "DELETE", { name: existing.name, via: "api" });
    return true;
  },
};
