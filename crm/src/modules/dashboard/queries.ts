import { db } from "@/core/db";
import { isPrivileged, scope, type SessionUser } from "@/core/permissions";

const MONTHS_BACK = 5;
const MONTHS_AHEAD = 6;

export async function getDashboard(user: SessionUser) {
  const now = new Date();
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const actScope = scope(user, "activity", "assigneeId");

  const [stages, deals, dueToday, overdueCount, monthTasks, recent, industries] = await Promise.all([
    db.stage.findMany({ orderBy: { position: "asc" } }),
    db.deal.findMany({
      where: scope(user, "deal"),
      select: { stageId: true, value: true, expectedCloseDate: true, owner: { select: { id: true, name: true } } },
    }),
    db.activity.findMany({
      where: { ...actScope, completedAt: null, dueAt: { gte: dayStart, lt: dayEnd } },
      include: { assignee: { select: { name: true } }, deal: { select: { title: true } }, contact: { select: { firstName: true, lastName: true } }, company: { select: { name: true } } },
      orderBy: { dueAt: "asc" },
      take: 6,
    }),
    db.activity.count({ where: { ...actScope, completedAt: null, dueAt: { lt: dayStart } } }),
    db.activity.findMany({ where: { ...actScope, completedAt: null, dueAt: { gte: monthStart, lt: monthEnd } }, select: { dueAt: true } }),
    db.auditLog.findMany({
      where: { entity: { not: "System" }, ...(isPrivileged(user) ? {} : { userId: user.id }) },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    db.company.groupBy({ by: ["industry"], where: scope(user, "company"), _count: { _all: true } }),
  ]);

  const kind = new Map(stages.map((s) => [s.id, s.kind]));
  const won = deals.filter((d) => kind.get(d.stageId) === "WON");
  const open = deals.filter((d) => kind.get(d.stageId) === "OPEN");
  const lost = deals.filter((d) => kind.get(d.stageId) === "LOST");
  const sum = (a: { value: number }[]) => a.reduce((s, d) => s + d.value, 0);

  // Rolling 12-month window: won revenue (past/now) vs open pipeline by expected close month.
  const first = new Date(now.getFullYear(), now.getMonth() - MONTHS_BACK, 1);
  const months = Array.from({ length: MONTHS_BACK + MONTHS_AHEAD + 1 }, (_, i) => {
    const d = new Date(first.getFullYear(), first.getMonth() + i, 1);
    return { key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleString("en-GB", { month: "short" }), won: 0, open: 0, current: i === MONTHS_BACK };
  });
  const idx = new Map(months.map((m, i) => [m.key, i]));
  for (const d of deals) {
    if (!d.expectedCloseDate) continue;
    const k = `${d.expectedCloseDate.getFullYear()}-${d.expectedCloseDate.getMonth()}`;
    const i = idx.get(k);
    if (i === undefined) continue;
    if (kind.get(d.stageId) === "WON") months[i].won += d.value;
    else if (kind.get(d.stageId) === "OPEN") months[i].open += d.value;
  }

  const reps = new Map<string, { name: string; count: number; value: number }>();
  for (const d of won) {
    const r = reps.get(d.owner.id) ?? { name: d.owner.name, count: 0, value: 0 };
    r.count++;
    r.value += d.value;
    reps.set(d.owner.id, r);
  }

  return {
    openDeals: open.length,
    totalDeals: deals.length,
    pipelineValue: sum(open),
    wonValue: sum(won),
    outcome: { won: won.length, open: open.length, lost: lost.length },
    months,
    topReps: [...reps.values()].sort((a, b) => b.value - a.value).slice(0, 5),
    industries: industries
      .map((i) => ({ name: i.industry ?? "Other", count: i._count._all }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5),
    dueToday,
    overdueCount,
    taskDays: [...new Set(monthTasks.map((t) => t.dueAt!.getDate()))],
    recent,
  };
}
