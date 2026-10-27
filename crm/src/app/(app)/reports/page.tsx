import Link from "next/link";
import { Download } from "lucide-react";
import { requireAccess } from "@/core/auth/session";
import { can, isPrivileged } from "@/core/permissions";
import { strParam } from "@/core/forms";
import { getT } from "@/core/i18n/server";
import { resolveRange } from "@/modules/reports/range";
import { getActivityReport, getPipelineReport, getSalesReport } from "@/modules/reports/queries";
import { ReportFilters } from "@/modules/reports/components/report-filters";
import { SalesTab } from "@/modules/reports/components/sales-tab";
import { PipelineTab } from "@/modules/reports/components/pipeline-tab";
import { ActivityTab } from "@/modules/reports/components/activity-tab";
import { listAssignableUsers } from "@/modules/users/queries";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TABS = ["sales", "pipeline", "activity"] as const;
type Tab = (typeof TABS)[number];

export default async function ReportsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const t = await getT();
  const user = await requireAccess("report");
  const sp = await searchParams;
  const tab: Tab = (TABS as readonly string[]).includes(strParam(sp.tab) ?? "") ? (strParam(sp.tab) as Tab) : "sales";
  const range = resolveRange(strParam(sp.range), strParam(sp.from), strParam(sp.to));
  // Reps are always limited to themselves by scope(); the owner filter only exists for managers/admins.
  const ownerId = isPrivileged(user) ? strParam(sp.ownerId) : undefined;
  const owners = isPrivileged(user) ? await listAssignableUsers(user) : undefined;
  const filters = { range, ownerId };

  const qs = new URLSearchParams({ range: range.key, from: range.fromStr, to: range.toStr, ...(ownerId ? { ownerId } : {}) });
  const exportHref = `/api/reports/${tab}?${qs}`;
  const note = tab === "sales" ? t.reports.closeDateNote : tab === "pipeline" ? t.reports.pipelineNote : t.reports.activityNote;

  return (
    <>
      <PageHeader title={t.reports.title}>
        {can(user, "export") && (
          <Button variant="outline" size="sm" asChild>
            <a href={exportHref} download>
              <Download className="h-4 w-4" />
              {t.reports.exportCsv}
            </a>
          </Button>
        )}
      </PageHeader>

      <div className="mb-3 flex flex-wrap gap-1">
        {TABS.map((k) => (
          <Link
            key={k}
            href={`/reports?tab=${k}&${qs}`}
            className={cn("rounded-full px-4 py-1.5 text-sm", k === tab ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent")}
          >
            {t.reports.tabs[k]}
          </Link>
        ))}
      </div>

      <ReportFilters tab={tab} range={range} ownerId={ownerId} owners={owners} showDates={tab !== "pipeline"} />
      <p className="mb-4 text-xs text-muted-foreground">{note}</p>

      {tab === "sales" && <SalesTab data={await getSalesReport(user, filters)} />}
      {tab === "pipeline" && <PipelineTab data={await getPipelineReport(user, filters)} />}
      {tab === "activity" && <ActivityTab data={await getActivityReport(user, filters)} />}
    </>
  );
}
