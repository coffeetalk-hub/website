import type { Prisma } from "@prisma/client";
import { db } from "@/core/db";
import { canAccess, scope, type SessionUser } from "@/core/permissions";
import { PAGE_SIZE } from "@/core/forms";

export const VIEWS = ["open", "today", "overdue", "done", "all"] as const;
export type View = (typeof VIEWS)[number];

function dayBounds() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

export async function listActivities(user: SessionUser, p: { view: View; type?: string; assigneeId?: string; q?: string; page: number }) {
  const { start, end } = dayBounds();
  const view: Prisma.ActivityWhereInput =
    p.view === "open"
      ? { completedAt: null }
      : p.view === "today"
        ? { completedAt: null, dueAt: { gte: start, lt: end } }
        : p.view === "overdue"
          ? { completedAt: null, dueAt: { lt: start } }
          : p.view === "done"
            ? { completedAt: { not: null } }
            : {};
  const where: Prisma.ActivityWhereInput = {
    ...scope(user, "activity", "assigneeId"),
    ...view,
    ...(p.type ? { type: p.type } : {}),
    ...(p.assigneeId ? { assigneeId: p.assigneeId } : {}),
    ...(p.q ? { subject: { contains: p.q } } : {}),
  };
  const [rows, total] = await Promise.all([
    db.activity.findMany({
      where,
      include: {
        assignee: { select: { name: true } },
        contact: { select: { id: true, firstName: true, lastName: true } },
        company: { select: { id: true, name: true } },
        deal: { select: { id: true, title: true } },
      },
      orderBy: p.view === "done" ? { completedAt: "desc" } : [{ dueAt: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }],
      skip: (p.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.activity.count({ where }),
  ]);
  return { rows, total };
}

export async function getActivity(user: SessionUser, id: string) {
  const a = await db.activity.findUnique({ where: { id } });
  if (!a || !canAccess(user, "activity", a)) return null;
  return a;
}
