import { getT } from "@/core/i18n/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { db } from "@/core/db";
import { requireUser } from "@/core/auth/session";
import { scope } from "@/core/permissions";
import { getFieldDefs, getFieldValues } from "@/core/custom-fields";
import { getDeal } from "@/modules/deals/queries";
import { deleteDeal } from "@/modules/deals/actions";
import { Timeline } from "@/modules/activities/components/timeline";
import { QuickAddActivity } from "@/modules/activities/components/quick-add";
import { AuditHistory } from "@/core/audit/history";
import { PageHeader } from "@/components/page-header";
import { CustomFieldsView, DetailItem } from "@/components/custom-fields";
import { DeleteButton } from "@/components/forms/delete-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const t = await getT();
  const { id } = await params;
  const user = await requireUser();
  const deal = await getDeal(user, id);
  if (!deal) notFound();
  const [defs, values, activities] = await Promise.all([
    getFieldDefs("DEAL"),
    getFieldValues("DEAL", id),
    db.activity.findMany({
      where: { dealId: id, ...scope(user, "activity", "assigneeId") },
      include: { assignee: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);
  return (
    <>
      <PageHeader title={deal.title}>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/deals/${id}/edit`}>
            <Pencil className="h-4 w-4" />
            {t.common.edit}
          </Link>
        </Button>
        <DeleteButton action={deleteDeal.bind(null, id)} />
      </PageHeader>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardContent className="pt-4">
              <dl className="grid gap-4 sm:grid-cols-2">
                <DetailItem label={t.deals.value}>{t.money(deal.value, deal.currency)}</DetailItem>
                <DetailItem label={t.deals.stage}>
                  <Badge>{deal.stage.name}</Badge> <span className="text-xs text-muted-foreground">{deal.stage.probability}%</span>
                </DetailItem>
                <DetailItem label={t.deals.weighted}>{t.money((deal.value * deal.stage.probability) / 100, deal.currency)}</DetailItem>
                <DetailItem label={t.deals.expectedClose}>{t.date(deal.expectedCloseDate)}</DetailItem>
                <DetailItem label={t.deals.company}>
                  {deal.company ? <Link href={`/companies/${deal.company.id}`} className="hover:underline">{deal.company.name}</Link> : "—"}
                </DetailItem>
                <DetailItem label={t.deals.contact}>
                  {deal.contact ? <Link href={`/contacts/${deal.contact.id}`} className="hover:underline">{deal.contact.firstName} {deal.contact.lastName}</Link> : "—"}
                </DetailItem>
                <DetailItem label={t.common.owner}>{deal.owner.name}</DetailItem>
                <CustomFieldsView defs={defs} values={values} />
              </dl>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t.contacts.timeline}</CardTitle>
            </CardHeader>
            <CardContent>
              <QuickAddActivity user={user} returnTo={`/deals/${id}`} links={{ dealId: id, companyId: deal.company?.id, contactId: deal.contact?.id }} />
              <Timeline items={activities} />
            </CardContent>
          </Card>
        </div>
        <AuditHistory entity="Deal" recordId={id} />
      </div>
    </>
  );
}
