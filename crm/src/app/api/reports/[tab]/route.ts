import Papa from "papaparse";
import { getCurrentUser } from "@/core/auth/session";
import { can, isPrivileged } from "@/core/permissions";
import { logAudit } from "@/core/audit";
import { getT } from "@/core/i18n/server";
import { resolveRange } from "@/modules/reports/range";
import { getActivityReport, getPipelineReport, getSalesReport } from "@/modules/reports/queries";

// Same permission rules as the page: reports are scoped to the user's own records unless they are Manager/Admin.
export async function GET(req: Request, { params }: { params: Promise<{ tab: string }> }) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  if (user.mustChangePassword) return new Response("Forbidden", { status: 403 });
  if (!can(user, "report") || !can(user, "export")) return new Response("Forbidden", { status: 403 });

  const { tab } = await params;
  const url = new URL(req.url).searchParams;
  const t = await getT();
  const r = t.reports;
  const range = resolveRange(url.get("range") ?? undefined, url.get("from") ?? undefined, url.get("to") ?? undefined);
  const ownerId = isPrivileged(user) ? (url.get("ownerId") ?? undefined) || undefined : undefined;
  const filters = { range, ownerId };
  const round = (n: number) => Math.round(n * 100) / 100;
  const pct = (x: number | null) => (x == null ? "" : Math.round(x * 1000) / 10);

  let fields: string[];
  let rows: (string | number)[][];
  if (tab === "sales") {
    const d = await getSalesReport(user, filters);
    fields = [r.rep, r.won, r.revenue, r.lost, r.lostValue, `${r.winRate} %`, r.avgDeal, r.openPipeline];
    rows = d.reps.map((x) => [x.name, x.won, round(x.wonValue), x.lost, round(x.lostValue), pct(x.winRate), round(x.avgDeal), round(x.openValue)]);
  } else if (tab === "pipeline") {
    const d = await getPipelineReport(user, filters);
    fields = [r.stage, `${r.probability} %`, r.count, r.value, r.weighted, r.avgAge];
    rows = d.byStage.map((s) => [s.name, s.probability, s.count, round(s.value), round(s.weighted), s.avgAgeDays]);
  } else if (tab === "activity") {
    const d = await getActivityReport(user, filters);
    fields = [r.rep, r.calls, r.meetings, r.notes, r.followUps, r.emails, r.whatsapps, r.total, r.completed, r.overdueTasks];
    rows = d.reps.map((x) => [x.name, x.CALL, x.MEETING, x.NOTE, x.FOLLOW_UP, x.EMAIL, x.WHATSAPP, x.total, x.completed, x.overdue]);
  } else {
    return new Response("Not found", { status: 404 });
  }

  await logAudit(user, "Report", tab, "EXPORT", { rows: rows.length, range: `${range.fromStr}..${range.toStr}` });
  const csv = "﻿" + Papa.unparse({ fields, data: rows }, { escapeFormulae: true });
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="report-${tab}-${range.fromStr}_${range.toStr}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
