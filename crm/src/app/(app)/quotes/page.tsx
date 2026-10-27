import Link from "next/link";
import { Plus } from "lucide-react";
import { requireAccess } from "@/core/auth/session";
import { can } from "@/core/permissions";
import { pageParam, strParam } from "@/core/forms";
import { getT } from "@/core/i18n/server";
import { listQuotes } from "@/modules/quotes/queries";
import { QUOTE_STATUSES } from "@/modules/quotes/schema";
import { calcTotals } from "@/modules/billing/totals";
import { PageHeader } from "@/components/page-header";
import { ListFilters } from "@/components/list-filters";
import { Pagination } from "@/components/pagination";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

export default async function QuotesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const t = await getT();
  const user = await requireAccess("quote");
  const sp = await searchParams;
  const q = strParam(sp.q);
  const status = strParam(sp.status);
  const page = pageParam(sp.page);
  const { rows, total } = await listQuotes(user, { q, status, page });
  return (
    <>
      <PageHeader title={t.quotes.title}>
        {can(user, "quote", "create") && (
          <Button asChild>
            <Link href="/quotes/new">
              <Plus className="h-4 w-4" />
              {t.quotes.new}
            </Link>
          </Button>
        )}
      </PageHeader>
      <ListFilters basePath="/quotes" q={q} selects={[{ name: "status", label: t.billing.all, value: status, options: QUOTE_STATUSES.map((s) => ({ value: s, label: t.quotes.statuses[s] })) }]} />
      <Card>
        <Table>
          <THead>
            <TR>
              <TH>{t.billing.number}</TH>
              <TH>{t.billing.customer}</TH>
              <TH>{t.billing.status}</TH>
              <TH className="hidden sm:table-cell">{t.billing.issueDate}</TH>
              <TH className="text-end">{t.billing.total}</TH>
              <TH className="hidden md:table-cell">{t.billing.owner}</TH>
            </TR>
          </THead>
          <TBody>
            {rows.map((r) => (
              <TR key={r.id}>
                <TD>
                  <Link href={`/quotes/${r.id}`} className="font-medium hover:underline" dir="ltr">
                    {r.number}
                  </Link>
                </TD>
                <TD>{r.company?.name ?? (r.contact ? `${r.contact.firstName} ${r.contact.lastName}` : "—")}</TD>
                <TD>
                  <StatusBadge status={r.status} label={t.quotes.statuses[r.status as keyof typeof t.quotes.statuses] ?? r.status} />
                </TD>
                <TD className="hidden sm:table-cell">{t.date(r.issueDate)}</TD>
                <TD className="text-end tabular-nums">{t.money2(calcTotals(r.lines).total)}</TD>
                <TD className="hidden md:table-cell">{r.owner.name}</TD>
              </TR>
            ))}
            {rows.length === 0 && (
              <TR>
                <TD colSpan={6} className="py-8 text-center text-muted-foreground">
                  {t.common.noResults}
                </TD>
              </TR>
            )}
          </TBody>
        </Table>
      </Card>
      <Pagination page={page} total={total} basePath="/quotes" params={{ q, status }} />
    </>
  );
}
