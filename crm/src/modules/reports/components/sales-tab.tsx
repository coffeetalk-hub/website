import { getT } from "@/core/i18n/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import type { getSalesReport } from "../queries";
import { MonthlyBars } from "./monthly-bars";
import { ReportStat, num, pct } from "./report-parts";

export async function SalesTab({ data }: { data: Awaited<ReturnType<typeof getSalesReport>> }) {
  const t = await getT();
  const r = t.reports;
  const empty = data.wonCount + data.lostCount === 0;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        <ReportStat label={r.wonRevenue} value={t.money(data.wonValue)} />
        <ReportStat label={r.wonDeals} value={String(data.wonCount)} />
        <ReportStat label={r.lostDeals} value={String(data.lostCount)} hint={t.money(data.lostValue)} />
        <ReportStat label={r.winRate} value={pct(data.winRate)} />
        <ReportStat label={r.avgDeal} value={t.money(data.avgDeal)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{r.revenueByMonth}</CardTitle>
        </CardHeader>
        <CardContent>
          {empty ? (
            <p className="text-sm text-muted-foreground">{r.noData}</p>
          ) : (
            <MonthlyBars
              months={data.months.map((m) => ({ key: m.key, date: m.date, values: [m.won, m.lost] }))}
              series={[
                { label: r.won, className: "bg-chart-1" },
                { label: r.lost, className: "bg-chart-2" },
              ]}
            />
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3 [&>*]:min-w-0">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">{r.byRep}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <TR>
                  <TH>{r.rep}</TH>
                  <TH className={num}>{r.won}</TH>
                  <TH className={num}>{r.revenue}</TH>
                  <TH className={num}>{r.lost}</TH>
                  <TH className={num}>{r.winRate}</TH>
                  <TH className={`${num} hidden sm:table-cell`}>{r.openPipeline}</TH>
                </TR>
              </THead>
              <TBody>
                {data.reps.map((x) => (
                  <TR key={x.name}>
                    <TD className="font-medium">{x.name}</TD>
                    <TD className={num}>{x.won}</TD>
                    <TD className={num}>{t.money(x.wonValue)}</TD>
                    <TD className={num}>{x.lost}</TD>
                    <TD className={num}>{pct(x.winRate)}</TD>
                    <TD className={`${num} hidden sm:table-cell`}>{t.money(x.openValue)}</TD>
                  </TR>
                ))}
                {data.reps.length === 0 && (
                  <TR>
                    <TD colSpan={6} className="py-6 text-center text-muted-foreground">
                      {r.noData}
                    </TD>
                  </TR>
                )}
              </TBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{r.bySource}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <TR>
                  <TH>{r.source}</TH>
                  <TH className={num}>{r.deals}</TH>
                  <TH className={num}>{r.revenue}</TH>
                </TR>
              </THead>
              <TBody>
                {data.sources.map((s) => (
                  <TR key={s.source || "unknown"}>
                    <TD>{s.source ? ((t.common.sources as Record<string, string>)[s.source] ?? s.source) : r.unknownSource}</TD>
                    <TD className={num}>{s.won}</TD>
                    <TD className={num}>{t.money(s.value)}</TD>
                  </TR>
                ))}
                {data.sources.length === 0 && (
                  <TR>
                    <TD colSpan={3} className="py-6 text-center text-muted-foreground">
                      {r.noData}
                    </TD>
                  </TR>
                )}
              </TBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
