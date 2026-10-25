import { db } from "@/core/db";
import { isPrivileged, scope, type SessionUser } from "@/core/permissions";

export async function getDashboard(user: SessionUser) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  const dealScope = scope(user, "deal");
  const actScope = scope(user, "activity", "assigneeId");

  const [stages, deals, dueToday, overdueCount, recent] = await Promise.all([
    db.stage.findMany({ orderBy: { position: "asc" } }),
    db.deal.findMany({ where: dealScope, select: { stageId: true, value: true } }),
    db.activity.findMany({
      where: { ...actScope, completedAt: null, dueAt: { gte: start, lt: end } },
      include: { assignee: { select: { name: true } }, deal: { select: { title: true } }, contact: { select: { firstName: true, lastName: true } }, company: { select: { name: true } } },
      orderBy: { dueAt: "asc" },
      take: 8,
    }),
    db.activity.count({ where: { ...actScope, completedAt: null, dueAt: { lt: start } } }),
    db.auditLog.findMany({
      where: { entity: { not: "System" }, ...(isPrivileged(user) ? {} : { userId: user.id }) },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const byStage = stages.map((s) => {
    const rows = deals.filter((d) => d.stageId === s.id);
    return { id: s.id, name: s.name, kind: s.kind, count: rows.length, value: rows.reduce((a, d) => a + d.value, 0) };
  });
  const open = byStage.filter((s) => s.kind === "OPEN");
  const won = byStage.filter((s) => s.kind === "WON");
  return {
    openDeals: open.reduce((a, s) => a + s.count, 0),
    pipelineValue: open.reduce((a, s) => a + s.value, 0),
    wonValue: won.reduce((a, s) => a + s.value, 0),
    byStage,
    dueToday,
    overdueCount,
    recent,
  };
}
