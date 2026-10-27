import { getT } from "@/core/i18n/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import type { getActivityReport } from "../queries";
import { ReportStat, num } from "./report-parts";

export async function ActivityTab({ data }: { data: Awaited<ReturnType<typeof getActivityReport>> }) {
  const t = await getT();
  const r = t.reports;
  const tot = data.totals;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <ReportStat label={r.total} value={String(tot.total)} hint={`${r.calls} ${tot.CALL} · ${r.meetings} ${tot.MEETING}`} />
        <ReportStat label={r.followUps} value={String(tot.FOLLOW_UP)} hint={`${r.notes} ${tot.NOTE}`} />
        <ReportStat label={r.completed} value={String(tot.completed)} />
        <ReportStat label={r.overdueTasks} value={String(tot.overdue)} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{r.activityByRep}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <TR>
                <TH>{r.rep}</TH>
                <TH className={num}>{r.calls}</TH>
                <TH className={num}>{r.meetings}</TH>
                <TH className={`${num} hidden sm:table-cell`}>{r.notes}</TH>
                <TH className={`${num} hidden sm:table-cell`}>{r.followUps}</TH>
                <TH className={num}>{r.total}</TH>
                <TH className={num}>{r.completed}</TH>
                <TH className={num}>{r.overdueTasks}</TH>
              </TR>
            </THead>
            <TBody>
              {data.reps.map((x) => (
                <TR key={x.name}>
                  <TD className="font-medium">{x.name}</TD>
                  <TD className={num}>{x.CALL}</TD>
                  <TD className={num}>{x.MEETING}</TD>
                  <TD className={`${num} hidden sm:table-cell`}>{x.NOTE}</TD>
                  <TD className={`${num} hidden sm:table-cell`}>{x.FOLLOW_UP}</TD>
                  <TD className={`${num} font-semibold`}>{x.total}</TD>
                  <TD className={num}>{x.completed}</TD>
                  <TD className={`${num} ${x.overdue ? "text-destructive" : ""}`}>{x.overdue}</TD>
                </TR>
              ))}
              {data.reps.length === 0 && (
                <TR>
                  <TD colSpan={8} className="py-6 text-center text-muted-foreground">
                    {r.noData}
                  </TD>
                </TR>
              )}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
