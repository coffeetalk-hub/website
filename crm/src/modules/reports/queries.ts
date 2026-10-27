import { db } from "@/core/db";
import { scope, type SessionUser } from "@/core/permissions";
import { monthKey, monthsIn, type Range } from "./range";

export type Filters = { range: Range; ownerId?: string };

// ───────────── Sales: closed deals whose (expected) close date falls in the range ─────────────
export async function getSalesReport(user: SessionUser, { range, ownerId }: Filters) {
  const where = { ...scope(user, "deal"), ...(ownerId ? { ownerId } : {}) };
  const [closed, open] = await Promise.all([
    db.deal.findMany({
      where: { ...where, expectedCloseDate: { gte: range.from, lte: range.to }, stage: { kind: { in: ["WON", "LOST"] } } },
      select: { value: true, expectedCloseDate: true, owner: { select: { id: true, name: true } }, stage: { select: { kind: true } }, contact: { select: { source: true } } },
    }),
    db.deal.findMany({ where: { ...where, stage: { kind: "OPEN" } }, select: { value: true, ownerId: true } }),
  ]);

  const won = closed.filter((d) => d.stage.kind === "WON");
  const lost = closed.filter((d) => d.stage.kind === "LOST");
  const sum = (a: { value: number }[]) => a.reduce((s, d) => s + d.value, 0);
  const rate = (w: number, l: number) => (w + l ? w / (w + l) : null);

  const months = monthsIn(range).map((m) => ({ ...m, won: 0, lost: 0 }));
  const idx = new Map(months.map((m, i) => [m.key, i]));
  for (const d of closed) {
    const i = idx.get(monthKey(d.expectedCloseDate!));
    if (i === undefined) continue;
    if (d.stage.kind === "WON") months[i].won += d.value;
    else months[i].lost += d.value;
  }

  const reps = new Map<string, { name: string; won: number; wonValue: number; lost: number; lostValue: number; openValue: number }>();
  const rep = (id: string, name: string) => reps.get(id) ?? (reps.set(id, { name, won: 0, wonValue: 0, lost: 0, lostValue: 0, openValue: 0 }), reps.get(id)!);
  for (const d of won) { const r = rep(d.owner.id, d.owner.name); r.won++; r.wonValue += d.value; }
  for (const d of lost) { const r = rep(d.owner.id, d.owner.name); r.lost++; r.lostValue += d.value; }
  if (open.length) {
    const names = new Map((await db.user.findMany({ where: { id: { in: [...new Set(open.map((o) => o.ownerId))] } }, select: { id: true, name: true } })).map((u) => [u.id, u.name]));
    for (const d of open) rep(d.ownerId, names.get(d.ownerId) ?? "?").openValue += d.value;
  }

  const sources = new Map<string, { won: number; value: number }>();
  for (const d of won) {
    const k = d.contact?.source ?? "";
    const s = sources.get(k) ?? { won: 0, value: 0 };
    s.won++;
    s.value += d.value;
    sources.set(k, s);
  }

  return {
    wonValue: sum(won),
    wonCount: won.length,
    lostCount: lost.length,
    lostValue: sum(lost),
    winRate: rate(won.length, lost.length),
    avgDeal: won.length ? sum(won) / won.length : 0,
    months,
    reps: [...reps.values()]
      .map((r) => ({ ...r, winRate: rate(r.won, r.lost), avgDeal: r.won ? r.wonValue / r.won : 0 }))
      .sort((a, b) => b.wonValue - a.wonValue),
    sources: [...sources.entries()].map(([source, v]) => ({ source, ...v })).sort((a, b) => b.value - a.value),
  };
}

// ───────────── Pipeline: a snapshot of open deals right now (date range does not apply) ─────────────
export async function getPipelineReport(user: SessionUser, { ownerId }: Filters) {
  const [stages, deals] = await Promise.all([
    db.stage.findMany({ where: { kind: "OPEN" }, orderBy: { position: "asc" } }),
    db.deal.findMany({
      where: { ...scope(user, "deal"), ...(ownerId ? { ownerId } : {}), stage: { kind: "OPEN" } },
      select: { id: true, title: true, value: true, createdAt: true, expectedCloseDate: true, stageId: true, stage: { select: { probability: true } }, owner: { select: { name: true } }, company: { select: { name: true } } },
    }),
  ]);
  const now = new Date();
  const dayMs = 86400000;
  const weighted = (d: { value: number; stage: { probability: number } }) => (d.value * d.stage.probability) / 100;

  const byStage = stages.map((s) => {
    const rows = deals.filter((d) => d.stageId === s.id);
    return {
      id: s.id,
      name: s.name,
      probability: s.probability,
      count: rows.length,
      value: rows.reduce((a, d) => a + d.value, 0),
      weighted: rows.reduce((a, d) => a + weighted(d), 0),
      avgAgeDays: rows.length ? Math.round(rows.reduce((a, d) => a + (now.getTime() - d.createdAt.getTime()) / dayMs, 0) / rows.length) : 0,
    };
  });

  // Forecast: overdue bucket, next 12 months, then "no date".
  const startThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    return { key: monthKey(d), date: d, value: 0, weighted: 0, count: 0 };
  });
  const idx = new Map(months.map((m, i) => [m.key, i]));
  const overdue = { value: 0, weighted: 0, count: 0 };
  const undated = { value: 0, weighted: 0, count: 0 };
  const later = { value: 0, weighted: 0, count: 0 };
  for (const d of deals) {
    const bucket = !d.expectedCloseDate ? undated : d.expectedCloseDate < startThisMonth ? overdue : (months[idx.get(monthKey(d.expectedCloseDate)) ?? -1] ?? later);
    bucket.value += d.value;
    bucket.weighted += weighted(d);
    bucket.count++;
  }

  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const largest = [...deals]
    .sort((a, b) => b.value - a.value)
    .slice(0, 10)
    .map((d) => ({ id: d.id, title: d.title, company: d.company?.name ?? null, owner: d.owner.name, value: d.value, closeDate: d.expectedCloseDate, overdue: !!d.expectedCloseDate && d.expectedCloseDate < startToday }));

  return {
    openCount: deals.length,
    openValue: deals.reduce((a, d) => a + d.value, 0),
    weightedValue: deals.reduce((a, d) => a + weighted(d), 0),
    overdueCount: deals.filter((d) => d.expectedCloseDate && d.expectedCloseDate < startToday).length,
    byStage,
    months,
    overdue,
    later,
    undated,
    largest,
  };
}

// ───────────── Activity: per assignee, created / completed in the range ─────────────
export async function getActivityReport(user: SessionUser, { range, ownerId }: Filters) {
  const base = { ...scope(user, "activity", "assigneeId"), ...(ownerId ? { assigneeId: ownerId } : {}) };
  const startToday = new Date();
  startToday.setHours(0, 0, 0, 0);
  const [created, completed, overdue] = await Promise.all([
    db.activity.findMany({ where: { ...base, createdAt: { gte: range.from, lte: range.to } }, select: { type: true, assignee: { select: { id: true, name: true } } } }),
    db.activity.findMany({ where: { ...base, completedAt: { gte: range.from, lte: range.to } }, select: { assignee: { select: { id: true, name: true } } } }),
    db.activity.findMany({ where: { ...base, completedAt: null, dueAt: { lt: startToday } }, select: { assignee: { select: { id: true, name: true } } } }),
  ]);
  const rows = new Map<string, { name: string; CALL: number; MEETING: number; NOTE: number; FOLLOW_UP: number; completed: number; overdue: number }>();
  const row = (u: { id: string; name: string }) => rows.get(u.id) ?? (rows.set(u.id, { name: u.name, CALL: 0, MEETING: 0, NOTE: 0, FOLLOW_UP: 0, completed: 0, overdue: 0 }), rows.get(u.id)!);
  for (const a of created) {
    const r = row(a.assignee);
    if (a.type === "CALL") r.CALL++;
    else if (a.type === "MEETING") r.MEETING++;
    else if (a.type === "NOTE") r.NOTE++;
    else if (a.type === "FOLLOW_UP") r.FOLLOW_UP++;
  }
  for (const a of completed) row(a.assignee).completed++;
  for (const a of overdue) row(a.assignee).overdue++;
  const reps = [...rows.values()].map((r) => ({ ...r, total: r.CALL + r.MEETING + r.NOTE + r.FOLLOW_UP })).sort((a, b) => b.total - a.total);
  const tot = (k: "CALL" | "MEETING" | "NOTE" | "FOLLOW_UP" | "completed" | "overdue" | "total") => reps.reduce((s, r) => s + r[k], 0);
  return { reps, totals: { CALL: tot("CALL"), MEETING: tot("MEETING"), NOTE: tot("NOTE"), FOLLOW_UP: tot("FOLLOW_UP"), completed: tot("completed"), overdue: tot("overdue"), total: tot("total") } };
}
