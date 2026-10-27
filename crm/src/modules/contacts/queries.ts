import type { Prisma } from "@prisma/client";
import { db } from "@/core/db";
import { canAccess, scope, type SessionUser } from "@/core/permissions";
import { PAGE_SIZE } from "@/core/forms";

export async function listContacts(user: SessionUser, p: { q?: string; companyId?: string; ownerId?: string; source?: string; page: number }) {
  const where: Prisma.ContactWhereInput = {
    ...scope(user, "contact"),
    ...(p.companyId ? { companyId: p.companyId } : {}),
    ...(p.ownerId ? { ownerId: p.ownerId } : {}),
    ...(p.source ? { source: p.source } : {}),
    ...(p.q
      ? {
          OR: [
            { firstName: { contains: p.q } },
            { lastName: { contains: p.q } },
            { email: { contains: p.q } },
            { phone: { contains: p.q } },
            { company: { name: { contains: p.q } } },
          ],
        }
      : {}),
  };
  const [rows, total] = await Promise.all([
    db.contact.findMany({
      where,
      include: { company: { select: { id: true, name: true } }, owner: { select: { name: true } } },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      skip: (p.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.contact.count({ where }),
  ]);
  return { rows, total };
}

export function listContactOptions(user: SessionUser) {
  return db.contact.findMany({
    where: scope(user, "contact"),
    select: { id: true, firstName: true, lastName: true },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });
}

export async function getContact(user: SessionUser, id: string) {
  const c = await db.contact.findUnique({
    where: { id },
    include: { owner: { select: { id: true, name: true } }, company: { select: { id: true, name: true } } },
  });
  if (!c) return null;
  // Not yours → behave exactly like "not found" so existence is not revealed.
  if (!canAccess(user, "contact", c)) return null;
  return c;
}
