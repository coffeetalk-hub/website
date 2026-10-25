import Link from "next/link";
import { Plus } from "lucide-react";
import { requireUser } from "@/core/auth/session";
import { assertCan, isPrivileged } from "@/core/permissions";
import { pageParam, strParam } from "@/core/forms";
import { listCompanies } from "@/modules/companies/queries";
import { listAssignableUsers } from "@/modules/users/queries";
import { PageHeader } from "@/components/page-header";
import { ListFilters } from "@/components/list-filters";
import { Pagination } from "@/components/pagination";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { t } from "@/core/i18n";

type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function CompaniesPage({ searchParams }: { searchParams: SP }) {
  const user = await requireUser();
  assertCan(user, "company");
  const sp = await searchParams;
  const q = strParam(sp.q);
  const ownerId = strParam(sp.ownerId);
  const page = pageParam(sp.page);
  const [{ rows, total }, owners] = await Promise.all([listCompanies(user, { q, ownerId, page }), listAssignableUsers(user)]);

  return (
    <>
      <PageHeader title={t.companies.title}>
        <Button asChild>
          <Link href="/companies/new">
            <Plus className="h-4 w-4" />
            {t.companies.new}
          </Link>
        </Button>
      </PageHeader>
      <ListFilters
        basePath="/companies"
        q={q}
        selects={isPrivileged(user) ? [{ name: "ownerId", label: t.common.owner, value: ownerId, options: owners.map((o) => ({ value: o.id, label: o.name })) }] : []}
      />
      <Card>
        <Table>
          <THead>
            <TR>
              <TH>{t.common.name}</TH>
              <TH>{t.companies.industry}</TH>
              <TH className="text-end">{t.companies.contacts}</TH>
              <TH className="text-end">{t.companies.deals}</TH>
              <TH>{t.common.owner}</TH>
            </TR>
          </THead>
          <TBody>
            {rows.map((c) => (
              <TR key={c.id}>
                <TD>
                  <Link href={`/companies/${c.id}`} className="font-medium hover:underline">
                    {c.name}
                  </Link>
                </TD>
                <TD>{c.industry ?? "—"}</TD>
                <TD className="text-end">{c._count.contacts}</TD>
                <TD className="text-end">{c._count.deals}</TD>
                <TD>{c.owner.name}</TD>
              </TR>
            ))}
            {rows.length === 0 && (
              <TR>
                <TD colSpan={5} className="py-8 text-center text-muted-foreground">
                  {t.common.noResults}
                </TD>
              </TR>
            )}
          </TBody>
        </Table>
      </Card>
      <Pagination page={page} total={total} basePath="/companies" params={{ q, ownerId }} />
    </>
  );
}
