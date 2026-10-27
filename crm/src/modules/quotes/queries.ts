import type { Prisma } from "@prisma/client";
import { db } from "@/core/db";
import { canAccess, scope, type SessionUser } from "@/core/permissions";
import { PAGE_SIZE } from "@/core/forms";

export async function listQuotes(user: SessionUser, p: { q?: string; status?: string; page: number }) {
  const where: Prisma.QuoteWhereInput = {
    ...scope(user, "quote"),
    ...(p.status ? { status: p.status } : {}),
    ...(p.q ? { OR: [{ number: { contains: p.q } }, { company: { name: { contains: p.q } } }, { contact: { lastName: { contains: p.q } } }] } : {}),
  };
  const [rows, total] = await Promise.all([
    db.quote.findMany({
      where,
      include: { company: { select: { name: true } }, contact: { select: { firstName: true, lastName: true } }, lines: true, owner: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      skip: (p.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.quote.count({ where }),
  ]);
  return { rows, total };
}

export async function getQuote(user: SessionUser, id: string) {
  const q = await db.quote.findUnique({
    where: { id },
    include: {
      lines: { orderBy: { position: "asc" } },
      company: true,
      contact: true,
      deal: { select: { id: true, title: true } },
      owner: { select: { id: true, name: true } },
      invoices: { select: { id: true, number: true, status: true } },
    },
  });
  if (!q || !canAccess(user, "quote", q)) return null;
  return q;
}
