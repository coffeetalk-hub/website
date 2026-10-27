import type { Prisma } from "@prisma/client";
import { db } from "@/core/db";
import { assertCan, assertOwns, canAccess, scope } from "@/core/permissions";
import { requireWrite } from "@/core/api/auth";
import { diff, logAudit } from "@/core/audit";
import { activitySchema } from "@/modules/activities/schema";
import { resolveOwnerId } from "@/modules/users/queries";
import { iso, normalize, rejectUnknown, validationError, zodFields } from "../helpers";
import type { ApiResource } from "../types";

const KEYS = ["type", "subject", "body", "dueAt", "assigneeId", "contactId", "companyId", "dealId", "completed"];
type Row = NonNullable<Awaited<ReturnType<typeof db.activity.findUnique>>>;
const ser = (a: Row) => ({
  id: a.id, type: a.type, subject: a.subject, body: a.body, dueAt: iso(a.dueAt), completed: !!a.completedAt, completedAt: iso(a.completedAt),
  assigneeId: a.assigneeId, contactId: a.contactId, companyId: a.companyId, dealId: a.dealId, createdAt: a.createdAt.toISOString(), updatedAt: a.updatedAt.toISOString(),
});

type Ctx = Parameters<NonNullable<ApiResource["create"]>>[0];
async function links(ctx: Ctx, ids: { contactId?: string; companyId?: string; dealId?: string }) {
  const out = { contactId: null as string | null, companyId: null as string | null, dealId: null as string | null };
  if (ids.contactId) {
    const r = await db.contact.findUnique({ where: { id: ids.contactId } });
    if (!r) throw validationError({ contactId: "Contact not found" });
    assertOwns(ctx.user, "contact", r);
    out.contactId = r.id;
  }
  if (ids.companyId) {
    const r = await db.company.findUnique({ where: { id: ids.companyId } });
    if (!r) throw validationError({ companyId: "Company not found" });
    assertOwns(ctx.user, "company", r);
    out.companyId = r.id;
  }
  if (ids.dealId) {
    const r = await db.deal.findUnique({ where: { id: ids.dealId } });
    if (!r) throw validationError({ dealId: "Deal not found" });
    assertOwns(ctx.user, "deal", r);
    out.dealId = r.id;
  }
  return out;
}

const completedFlag = (v: unknown) => (typeof v === "boolean" ? v : v == null ? undefined : String(v) === "true");

export const tasks: ApiResource = {
  filterKeys: ["assigneeId", "type", "contactId", "companyId", "dealId", "completed"],
  async list(ctx, p) {
    const where: Prisma.ActivityWhereInput = {
      ...scope(ctx.user, "activity", "assigneeId"),
      ...(p.updatedSince ? { updatedAt: { gte: p.updatedSince } } : {}),
      ...(p.filters.assigneeId ? { assigneeId: p.filters.assigneeId } : {}),
      ...(p.filters.type ? { type: p.filters.type } : {}),
      ...(p.filters.contactId ? { contactId: p.filters.contactId } : {}),
      ...(p.filters.companyId ? { companyId: p.filters.companyId } : {}),
      ...(p.filters.dealId ? { dealId: p.filters.dealId } : {}),
      ...(p.filters.completed === "true" ? { completedAt: { not: null } } : p.filters.completed === "false" ? { completedAt: null } : {}),
      ...(p.q ? { subject: { contains: p.q } } : {}),
    };
    const [rows, total] = await Promise.all([db.activity.findMany({ where, orderBy: [{ createdAt: "desc" }, { id: "asc" }], skip: (p.page - 1) * p.limit, take: p.limit }), db.activity.count({ where })]);
    return { data: rows.map(ser), total };
  },
  async get(ctx, id) {
    const a = await db.activity.findUnique({ where: { id } });
    return a && canAccess(ctx.user, "activity", a) ? ser(a) : null;
  },
  async create(ctx, body) {
    requireWrite(ctx);
    assertCan(ctx.user, "activity", "create");
    rejectUnknown(body, KEYS);
    const parsed = activitySchema.omit({ returnTo: true }).safeParse(normalize(body, KEYS.filter((k) => k !== "completed")));
    if (!parsed.success) throw validationError(zodFields(parsed.error));
    const { assigneeId, dueAt, contactId, companyId, dealId, ...data } = parsed.data;
    const done = completedFlag(body.completed);
    const rec = await db.activity.create({
      data: { ...data, dueAt: dueAt ? new Date(dueAt) : null, completedAt: done ? new Date() : null, ...(await links(ctx, { contactId, companyId, dealId })), assigneeId: await resolveOwnerId(ctx.user, assigneeId), creatorId: ctx.user.id },
    });
    await logAudit(ctx.user, "Activity", rec.id, "CREATE", { subject: rec.subject, type: rec.type, via: "api" });
    return ser(rec);
  },
  async update(ctx, id, body) {
    requireWrite(ctx);
    const existing = await db.activity.findUnique({ where: { id } });
    if (!existing || !canAccess(ctx.user, "activity", existing)) return null;
    assertCan(ctx.user, "activity", "update");
    rejectUnknown(body, KEYS);
    const base = { type: existing.type, subject: existing.subject, body: existing.body ?? undefined, dueAt: existing.dueAt?.toISOString(), assigneeId: existing.assigneeId };
    const parsed = activitySchema.omit({ returnTo: true, contactId: true, companyId: true, dealId: true }).safeParse({ ...base, ...normalize(body, ["type", "subject", "body", "dueAt", "assigneeId"]) });
    if (!parsed.success) throw validationError(zodFields(parsed.error));
    const done = completedFlag(body.completed);
    const updated = await db.activity.update({
      where: { id },
      data: {
        type: parsed.data.type, subject: parsed.data.subject, body: parsed.data.body ?? null, dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : null,
        assigneeId: await resolveOwnerId(ctx.user, parsed.data.assigneeId ?? existing.assigneeId),
        ...(done === undefined ? {} : { completedAt: done ? (existing.completedAt ?? new Date()) : null }),
      },
    });
    const changes = diff(existing, updated);
    if (Object.keys(changes).length) await logAudit(ctx.user, "Activity", id, "UPDATE", changes);
    return ser(updated);
  },
  async remove(ctx, id) {
    requireWrite(ctx);
    const existing = await db.activity.findUnique({ where: { id } });
    if (!existing || !canAccess(ctx.user, "activity", existing)) return false;
    assertCan(ctx.user, "activity", "delete");
    await db.activity.delete({ where: { id } });
    await logAudit(ctx.user, "Activity", id, "DELETE", { subject: existing.subject, via: "api" });
    return true;
  },
};
