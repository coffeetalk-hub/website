import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { db } from "@/core/db";
import { requireUser } from "@/core/auth/session";
import { scope } from "@/core/permissions";
import { getFieldDefs, getFieldValues } from "@/core/custom-fields";
import { getCompany } from "@/modules/companies/queries";
import { deleteCompany } from "@/modules/companies/actions";
import { Timeline } from "@/modules/activities/components/timeline";
import { AuditHistory } from "@/core/audit/history";
import { PageHeader } from "@/components/page-header";
import { CustomFieldsView, DetailItem } from "@/components/custom-fields";
import { DeleteButton } from "@/components/forms/delete-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/utils";
import { t } from "@/core/i18n";

export default async function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const company = await getCompany(user, id);
  if (!company) notFound();

  const [defs, values, contacts, deals, activities] = await Promise.all([
    getFieldDefs("COMPANY"),
    getFieldValues("COMPANY", id),
    db.contact.findMany({ where: { companyId: id, ...scope(user, "contact") }, orderBy: { lastName: "asc" } }),
    db.deal.findMany({ where: { companyId: id, ...scope(user, "deal") }, include: { stage: true }, orderBy: { createdAt: "desc" } }),
    db.activity.findMany({ where: { companyId: id, ...scope(user, "activity", "assigneeId") }, include: { assignee: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 30 }),
  ]);

  return (
    <>
      <PageHeader title={company.name}>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/companies/${id}/edit`}>
            <Pencil className="h-4 w-4" />
            {t.common.edit}
          </Link>
        </Button>
        <DeleteButton action={deleteCompany.bind(null, id)} />
      </PageHeader>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardContent className="pt-4">
              <dl className="grid gap-4 sm:grid-cols-2">
                <DetailItem label={t.companies.industry}>{company.industry ?? "—"}</DetailItem>
                <DetailItem label={t.companies.website}>{company.website ?? "—"}</DetailItem>
                <DetailItem label={t.common.phone}>{company.phone ?? "—"}</DetailItem>
                <DetailItem label={t.companies.address}>{company.address ?? "—"}</DetailItem>
                <DetailItem label={t.common.owner}>{company.owner.name}</DetailItem>
                <CustomFieldsView defs={defs} values={values} />
              </dl>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>
                {t.companies.contacts} ({contacts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {contacts.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t.common.noResults}</p>
              ) : (
                <ul className="divide-y text-sm">
                  {contacts.map((c) => (
                    <li key={c.id} className="py-2">
                      <Link href={`/contacts/${c.id}`} className="font-medium hover:underline">
                        {c.firstName} {c.lastName}
                      </Link>
                      <span className="text-muted-foreground"> · {c.jobTitle ?? c.email ?? ""}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>
                {t.companies.deals} ({deals.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {deals.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t.common.noResults}</p>
              ) : (
                <ul className="divide-y text-sm">
                  {deals.map((d) => (
                    <li key={d.id} className="flex items-center justify-between gap-2 py-2">
                      <Link href={`/deals/${d.id}`} className="font-medium hover:underline">
                        {d.title}
                      </Link>
                      <span className="flex items-center gap-2">
                        <Badge>{d.stage.name}</Badge>
                        {formatMoney(d.value, d.currency)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t.contacts.timeline}</CardTitle>
            </CardHeader>
            <CardContent>
              <Timeline items={activities} />
            </CardContent>
          </Card>
          <AuditHistory entity="Company" recordId={id} />
        </div>
      </div>
    </>
  );
}
