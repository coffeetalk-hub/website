import type { Prisma } from "@prisma/client";
import { db } from "@/core/db";
import { canAccess, scope, type SessionUser } from "@/core/permissions";

export const listStages = () => db.stage.findMany({ orderBy: { position: "asc" } });

export async function listBoardDeals(user: SessionUser, p: { q?: string; ownerId?: string }) {
  const where: Prisma.DealWhereInput = {
    ...scope(user, "deal"),
    ...(p.ownerId ? { ownerId: p.ownerId } : {}),
    ...(p.q ? { OR: [{ title: { contains: p.q } }, { company: { name: { contains: p.q } } }] } : {}),
  };
  return db.deal.findMany({
    where,
    include: { company: { select: { name: true } }, owner: { select: { name: true } } },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
  });
}

export async function getDeal(user: SessionUser, id: string) {
  const d = await db.deal.findUnique({
    where: { id },
    include: {
      stage: true,
      owner: { select: { id: true, name: true } },
      company: { select: { id: true, name: true } },
      contact: { select: { id: true, firstName: true, lastName: true } },
    },
  });
  if (!d || !canAccess(user, "deal", d)) return null;
  return d;
}
