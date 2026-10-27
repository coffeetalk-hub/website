import { getT } from "@/core/i18n/server";
import Link from "next/link";
import { Plus } from "lucide-react";
import { requireUser } from "@/core/auth/session";
import { assertCan, isPrivileged } from "@/core/permissions";
import { pageParam, strParam } from "@/core/forms";
import { listContacts } from "@/modules/contacts/queries";
import { SOURCES } from "@/modules/contacts/schema";
import { listCompanyOptions } from "@/modules/companies/queries";
import { listAssignableUsers } from "@/modules/users/queries";
import { PageHeader } from "@/components/page-header";
import { ListFilters, type FilterSelect } from "@/components/list-filters";
import { Pagination } from "@/components/pagination";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function ContactsPage({ searchParams }: { searchParams: SP }) {
  const t = await getT();
  const user = await requireUser();
  assertCan(user, "contact");
  const sp = await searchParams;
  const q = strParam(sp.q);
  const companyId = strParam(sp.companyId);
  const ownerId = strParam(sp.ownerId);
  const source = strParam(sp.source);
  const page = pageParam(sp.page);
  const [{ rows, total }, companies, owners] = await Promise.all([
    listContacts(user, { q, companyId, ownerId, source, page }),
    listCompanyOptions(user),
    listAssignableUsers(user),
  ]);

  const selects: FilterSelect[] = [
    { name: "companyId", label: t.contacts.company, value: companyId, options: companies.map((c) => ({ value: c.id, label: c.name })) },
    { name: "source", label: t.contacts.source, value: source, options: SOURCES.map((s) => ({ value: s, label: t.common.sources[s as keyof typeof t.common.sources] ?? s })) },
  ];
  if (isPrivileged(user)) selects.push({ name: "ownerId", label: t.common.owner, value: ownerId, options: owners.map((o) => ({ value: o.id, label: o.name })) });

  return (
    <>
      <PageHeader title={t.contacts.title}>
        <Button asChild>
          <Link href="/contacts/new">
            <Plus className="h-4 w-4" />
            {t.contacts.new}
          </Link>
        </Button>
      </PageHeader>
      <ListFilters basePath="/contacts" q={q} selects={selects} />
      <Card>
        <Table>
          <THead>
            <TR>
              <TH>{t.common.name}</TH>
              <TH>{t.contacts.company}</TH>
              <TH className="hidden md:table-cell">{t.common.email}</TH>
              <TH className="hidden lg:table-cell">{t.common.phone}</TH>
              <TH className="hidden sm:table-cell">{t.common.owner}</TH>
            </TR>
          </THead>
          <TBody>
            {rows.map((c) => (
              <TR key={c.id}>
                <TD>
                  <Link href={`/contacts/${c.id}`} className="font-medium hover:underline">
                    {c.firstName} {c.lastName}
                  </Link>
                  {c.jobTitle && <div className="text-xs text-muted-foreground">{c.jobTitle}</div>}
                </TD>
                <TD>{c.company ? <Link href={`/companies/${c.company.id}`} className="hover:underline">{c.company.name}</Link> : "—"}</TD>
                <TD className="hidden md:table-cell">{c.email ?? "—"}</TD>
                <TD className="hidden lg:table-cell">{c.phone ?? "—"}</TD>
                <TD className="hidden sm:table-cell">{c.owner.name}</TD>
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
      <Pagination page={page} total={total} basePath="/contacts" params={{ q, companyId, ownerId, source }} />
    </>
  );
}
