import type { Prisma } from "@prisma/client";
import { db } from "@/core/db";
import { canAccess, scope, type SessionUser } from "@/core/permissions";
import { PAGE_SIZE } from "@/core/forms";

export async function listInvoices(user: SessionUser, p: { q?: string; status?: string; page: number }) {
  const where: Prisma.InvoiceWhereInput = {
    ...scope(user, "invoice"),
    ...(p.status ? { status: p.status } : {}),
    ...(p.q ? { OR: [{ number: { contains: p.q } }, { buyerName: { contains: p.q } }] } : {}),
  };
  const [rows, total] = await Promise.all([
    db.invoice.findMany({ where, include: { lines: true, owner: { select: { name: true } } }, orderBy: { createdAt: "desc" }, skip: (p.page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    db.invoice.count({ where }),
  ]);
  return { rows, total };
}

export async function getInvoice(user: SessionUser, id: string) {
  const inv = await db.invoice.findUnique({
    where: { id },
    include: {
      lines: { orderBy: { position: "asc" } },
      company: { select: { id: true, name: true } },
      contact: { select: { id: true, firstName: true, lastName: true } },
      deal: { select: { id: true, title: true } },
      quote: { select: { id: true, number: true } },
      owner: { select: { id: true, name: true } },
    },
  });
  if (!inv || !canAccess(user, "invoice", inv)) return null;
  return inv;
}

export const isDraftNumber = (n: string) => n.startsWith("DRAFT-");
