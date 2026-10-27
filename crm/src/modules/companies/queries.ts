import type { Prisma } from "@prisma/client";
import { db } from "@/core/db";
import { canAccess, scope, type SessionUser } from "@/core/permissions";
import { PAGE_SIZE } from "@/core/forms";

export async function listCompanies(user: SessionUser, p: { q?: string; ownerId?: string; page: number }) {
  const where: Prisma.CompanyWhereInput = {
    ...scope(user, "company"),
    ...(p.ownerId ? { ownerId: p.ownerId } : {}),
    ...(p.q ? { OR: [{ name: { contains: p.q } }, { industry: { contains: p.q } }, { website: { contains: p.q } }] } : {}),
  };
  const [rows, total] = await Promise.all([
    db.company.findMany({
      where,
      include: { owner: { select: { name: true } }, _count: { select: { contacts: true, deals: true } } },
      orderBy: { name: "asc" },
      skip: (p.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.company.count({ where }),
  ]);
  return { rows, total };
}

/** Companies the user may link to (for selects). */
export function listCompanyOptions(user: SessionUser) {
  return db.company.findMany({ where: scope(user, "company"), select: { id: true, name: true }, orderBy: { name: "asc" } });
}

/** Returns null when missing or not accessible. */
export async function getCompany(user: SessionUser, id: string) {
  const c = await db.company.findUnique({ where: { id }, include: { owner: { select: { id: true, name: true } } } });
  if (!c) return null;
  // Not yours → behave exactly like "not found" so existence is not revealed.
  if (!canAccess(user, "company", c)) return null;
  return c;
}
