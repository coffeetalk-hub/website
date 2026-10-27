import type { Prisma } from "@prisma/client";
import { db } from "@/core/db";
import { canAccess, scope } from "@/core/permissions";
import { calcTotals } from "@/modules/billing/totals";
import { day, iso } from "../helpers";
import type { ApiResource } from "../types";

const lineSer = (l: { description: string; qty: number; unitPrice: number; discountPct: number; vatRate: number }) => ({ description: l.description, qty: l.qty, unitPrice: l.unitPrice, discountPct: l.discountPct, vatRate: l.vatRate });

/** Quotes and invoices are read-only over the API (issuing/numbering has legal effect, so it stays in the app). */
export const quotes: ApiResource = {
  filterKeys: ["status", "companyId", "dealId"],
  async list(ctx, p) {
    const where: Prisma.QuoteWhereInput = {
      ...scope(ctx.user, "quote"),
      ...(p.updatedSince ? { updatedAt: { gte: p.updatedSince } } : {}),
      ...(p.filters.status ? { status: p.filters.status } : {}),
      ...(p.filters.companyId ? { companyId: p.filters.companyId } : {}),
      ...(p.filters.dealId ? { dealId: p.filters.dealId } : {}),
      ...(p.q ? { number: { contains: p.q } } : {}),
    };
    const [rows, total] = await Promise.all([db.quote.findMany({ where, include: { lines: { orderBy: { position: "asc" } } }, orderBy: [{ createdAt: "desc" }, { id: "asc" }], skip: (p.page - 1) * p.limit, take: p.limit }), db.quote.count({ where })]);
    return { data: rows.map(ser), total };
  },
  async get(ctx, id) {
    const q = await db.quote.findUnique({ where: { id }, include: { lines: { orderBy: { position: "asc" } } } });
    return q && canAccess(ctx.user, "quote", q) ? ser(q) : null;
  },
};
function ser(q: Prisma.QuoteGetPayload<{ include: { lines: true } }>) {
  const totals = calcTotals(q.lines);
  return { id: q.id, number: q.number, status: q.status, issueDate: day(q.issueDate), validUntil: day(q.validUntil), companyId: q.companyId, contactId: q.contactId, dealId: q.dealId, ownerId: q.ownerId, currency: "SAR", lines: q.lines.map(lineSer), subtotal: totals.net, vat: totals.vat, total: totals.total, createdAt: iso(q.createdAt), updatedAt: iso(q.updatedAt) };
}

export const invoices: ApiResource = {
  filterKeys: ["status", "companyId", "dealId"],
  async list(ctx, p) {
    const where: Prisma.InvoiceWhereInput = {
      ...scope(ctx.user, "invoice"),
      ...(p.updatedSince ? { updatedAt: { gte: p.updatedSince } } : {}),
      ...(p.filters.status ? { status: p.filters.status } : {}),
      ...(p.filters.companyId ? { companyId: p.filters.companyId } : {}),
      ...(p.filters.dealId ? { dealId: p.filters.dealId } : {}),
      ...(p.q ? { OR: [{ number: { contains: p.q } }, { buyerName: { contains: p.q } }] } : {}),
    };
    const [rows, total] = await Promise.all([db.invoice.findMany({ where, include: { lines: { orderBy: { position: "asc" } } }, orderBy: [{ createdAt: "desc" }, { id: "asc" }], skip: (p.page - 1) * p.limit, take: p.limit }), db.invoice.count({ where })]);
    return { data: rows.map(invSer), total };
  },
  async get(ctx, id) {
    const i = await db.invoice.findUnique({ where: { id }, include: { lines: { orderBy: { position: "asc" } } } });
    return i && canAccess(ctx.user, "invoice", i) ? invSer(i) : null;
  },
};
function invSer(i: Prisma.InvoiceGetPayload<{ include: { lines: true } }>) {
  const totals = calcTotals(i.lines);
  return {
    id: i.id, number: i.status === "DRAFT" ? null : i.number, uuid: i.uuid, status: i.status, issueDate: day(i.issueDate), dueDate: day(i.dueDate), issuedAt: iso(i.issuedAt), paidAt: iso(i.paidAt),
    buyer: { name: i.buyerName, vatNumber: i.buyerVat, address: i.buyerAddress }, companyId: i.companyId, contactId: i.contactId, dealId: i.dealId, quoteId: i.quoteId, ownerId: i.ownerId,
    currency: "SAR", lines: i.lines.map(lineSer), subtotal: totals.net, vat: totals.vat, total: totals.total, createdAt: iso(i.createdAt), updatedAt: iso(i.updatedAt),
  };
}
