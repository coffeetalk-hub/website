import Link from "next/link";
import { getT } from "@/core/i18n/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import type { getPipelineReport } from "../queries";
import { ReportStat, num } from "./report-parts";

export async function PipelineTab({ data }: { data: Awaited<ReturnType<typeof getPipelineReport>> }) {
  const t = await getT();
  const r = t.reports;
  const bucket = (label: string, b: { count: number; value: number; weighted: number }, key: string) =>
    b.count > 0 && (
      <TR key={key}>
        <TD className="text-muted-foreground">{label}</TD>
        <TD className={num}>{b.count}</TD>
        <TD className={num}>{t.money(b.value)}</TD>
        <TD className={num}>{t.money(b.weighted)}</TD>
      </TR>
    );
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <ReportStat label={r.openDeals} value={String(data.openCount)} />
        <ReportStat label={r.openValue} value={t.money(data.openValue)} />
        <ReportStat label={r.weightedValue} value={t.money(data.weightedValue)} />
        <ReportStat label={r.overdueDeals} value={String(data.overdueCount)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2 [&>*]:min-w-0">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{r.byStage}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <TR>
                  <TH>{r.stage}</TH>
                  <TH className={num}>{r.count}</TH>
                  <TH className={num}>{r.value}</TH>
                  <TH className={num}>{r.weighted}</TH>
                  <TH className={`${num} hidden sm:table-cell`}>{r.avgAge}</TH>
                </TR>
              </THead>
              <TBody>
                {data.byStage.map((s) => (
                  <TR key={s.id}>
                    <TD className="font-medium">
                      {s.name} <span className="text-xs text-muted-foreground">{s.probability}%</span>
                    </TD>
                    <TD className={num}>{s.count}</TD>
                    <TD className={num}>{t.money(s.value)}</TD>
                    <TD className={num}>{t.money(s.weighted)}</TD>
                    <TD className={`${num} hidden sm:table-cell`}>{s.avgAgeDays}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{r.forecast}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <TR>
                  <TH>{r.month}</TH>
                  <TH className={num}>{r.count}</TH>
                  <TH className={num}>{r.value}</TH>
                  <TH className={num}>{r.weighted}</TH>
                </TR>
              </THead>
              <TBody>
                {bucket(r.overdueBucket, data.overdue, "overdue")}
                {data.months.map((m) => bucket(t.monthYear(m.date), m, m.key))}
                {bucket(r.laterBucket, data.later, "later")}
                {bucket(r.noDate, data.undated, "undated")}
                {data.openCount === 0 && (
                  <TR>
                    <TD colSpan={4} className="py-6 text-center text-muted-foreground">
                      {r.noData}
                    </TD>
                  </TR>
                )}
              </TBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{r.largest}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <TR>
                <TH>{r.deal}</TH>
                <TH className="hidden sm:table-cell">{r.company}</TH>
                <TH className="hidden md:table-cell">{r.owner}</TH>
                <TH className={num}>{r.value}</TH>
                <TH className={num}>{r.closeDate}</TH>
              </TR>
            </THead>
            <TBody>
              {data.largest.map((d) => (
                <TR key={d.id}>
                  <TD>
                    <Link href={`/deals/${d.id}`} className="font-medium hover:underline">
                      {d.title}
                    </Link>
                  </TD>
                  <TD className="hidden sm:table-cell">{d.company ?? "—"}</TD>
                  <TD className="hidden md:table-cell">{d.owner}</TD>
                  <TD className={num}>{t.money(d.value)}</TD>
                  <TD className={`${num} ${d.overdue ? "text-destructive" : ""}`}>{t.date(d.closeDate)}</TD>
                </TR>
              ))}
              {data.largest.length === 0 && (
                <TR>
                  <TD colSpan={5} className="py-6 text-center text-muted-foreground">
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
