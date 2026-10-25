import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { db } from "@/core/db";
import { requireUser } from "@/core/auth/session";
import { scope } from "@/core/permissions";
import { getFieldDefs, getFieldValues } from "@/core/custom-fields";
import { getContact } from "@/modules/contacts/queries";
import { deleteContact } from "@/modules/contacts/actions";
import { Timeline } from "@/modules/activities/components/timeline";
import { QuickAddActivity } from "@/modules/activities/components/quick-add";
import { AuditHistory } from "@/core/audit/history";
import { PageHeader } from "@/components/page-header";
import { CustomFieldsView, DetailItem } from "@/components/custom-fields";
import { DeleteButton } from "@/components/forms/delete-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/utils";
import { t } from "@/core/i18n";

export default async function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const contact = await getContact(user, id);
  if (!contact) notFound();

  const [defs, values, deals, activities] = await Promise.all([
    getFieldDefs("CONTACT"),
    getFieldValues("CONTACT", id),
    db.deal.findMany({ where: { contactId: id, ...scope(user, "deal") }, include: { stage: true }, orderBy: { createdAt: "desc" } }),
    db.activity.findMany({
      where: { contactId: id, ...scope(user, "activity", "assigneeId") },
      include: { assignee: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  return (
    <>
      <PageHeader title={`${contact.firstName} ${contact.lastName}`}>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/contacts/${id}/edit`}>
            <Pencil className="h-4 w-4" />
            {t.common.edit}
          </Link>
        </Button>
        <DeleteButton action={deleteContact.bind(null, id)} />
      </PageHeader>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardContent className="pt-4">
              <dl className="grid gap-4 sm:grid-cols-2">
                <DetailItem label={t.common.email}>{contact.email ?? "—"}</DetailItem>
                <DetailItem label={t.common.phone}>{contact.phone ?? "—"}</DetailItem>
                <DetailItem label={t.contacts.jobTitle}>{contact.jobTitle ?? "—"}</DetailItem>
                <DetailItem label={t.contacts.company}>
                  {contact.company ? <Link href={`/companies/${contact.company.id}`} className="hover:underline">{contact.company.name}</Link> : "—"}
                </DetailItem>
                <DetailItem label={t.contacts.source}>{contact.source ?? "—"}</DetailItem>
                <DetailItem label={t.common.owner}>{contact.owner.name}</DetailItem>
                <CustomFieldsView defs={defs} values={values} />
              </dl>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t.contacts.timeline}</CardTitle>
            </CardHeader>
            <CardContent>
              <QuickAddActivity user={user} returnTo={`/contacts/${id}`} links={{ contactId: id, companyId: contact.company?.id }} />
              <Timeline items={activities} />
            </CardContent>
          </Card>
        </div>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                {t.nav.deals} ({deals.length})
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
          <AuditHistory entity="Contact" recordId={id} />
        </div>
      </div>
    </>
  );
}
