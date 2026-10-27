import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Pencil, Printer, Stamp } from "lucide-react";
import { requireAccess } from "@/core/auth/session";
import { can } from "@/core/permissions";
import { strParam } from "@/core/forms";
import { getT } from "@/core/i18n/server";
import { AuditHistory } from "@/core/audit/history";
import { getInvoice, isDraftNumber } from "@/modules/invoices/queries";
import { cancelInvoice, deleteInvoice, issueInvoice, markInvoicePaid } from "@/modules/invoices/actions";
import type { InvoiceStatus } from "@/modules/invoices/schema";
import { LinesTable } from "@/modules/billing/components/lines-table";
import { DetailItem } from "@/components/custom-fields";
import { DeleteButton } from "@/components/forms/delete-button";
import { ActionButton } from "@/components/forms/confirm-button";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function InvoiceDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const t = await getT();
  const user = await requireAccess("invoice");
  const { id } = await params;
  const inv = await getInvoice(user, id);
  if (!inv) notFound();
  const status = inv.status as InvoiceStatus;
  const manage = can(user, "invoice", "update");
  const profileError = strParam((await searchParams).error) === "profile";

  return (
    <>
      <PageHeader title={isDraftNumber(inv.number) ? t.invoices.statuses.DRAFT : inv.number}>
        <StatusBadge status={inv.status} label={t.invoices.statuses[status]} />
        {status === "DRAFT" && manage && (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/invoices/${id}/edit`}>
              <Pencil className="h-4 w-4" />
              {t.common.edit}
            </Link>
          </Button>
        )}
        <Button variant="outline" size="sm" asChild>
          <Link href={`/print/invoices/${id}`} target="_blank">
            <Printer className="h-4 w-4" />
            {t.billing.print}
          </Link>
        </Button>
        {status === "DRAFT" && can(user, "invoice", "delete") && <DeleteButton action={deleteInvoice.bind(null, id)} />}
      </PageHeader>

      {profileError && <p className="mb-4 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{t.invoices.needsProfile}</p>}
      {status !== "DRAFT" && <p className="mb-4 text-sm text-muted-foreground">{t.invoices.locked}</p>}

      <div className="mb-4 flex flex-wrap gap-2">
        {status === "DRAFT" && manage && (
          <ActionButton action={issueInvoice.bind(null, id)} confirmText={t.invoices.confirmIssue} variant="default">
            <Stamp className="h-4 w-4" />
            {t.invoices.issue}
          </ActionButton>
        )}
        {status === "ISSUED" && manage && (
          <>
            <ActionButton action={markInvoicePaid.bind(null, id)} variant="default">
              <CheckCircle2 className="h-4 w-4" />
              {t.invoices.markPaid}
            </ActionButton>
            <ActionButton action={cancelInvoice.bind(null, id)} confirmText={t.invoices.confirmCancel} className="text-destructive">
              {t.invoices.cancel}
            </ActionButton>
          </>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardContent className="pt-5">
              <dl className="grid gap-4 sm:grid-cols-3">
                <DetailItem label={t.invoices.buyerName}>{inv.buyerName}</DetailItem>
                <DetailItem label={t.invoices.buyerVat}><span dir="ltr">{inv.buyerVat ?? "—"}</span></DetailItem>
                <DetailItem label={t.invoices.buyerAddress}>{inv.buyerAddress ?? "—"}</DetailItem>
                <DetailItem label={t.billing.issueDate}>{t.date(inv.issueDate)}</DetailItem>
                <DetailItem label={t.billing.dueDate}>{t.date(inv.dueDate)}</DetailItem>
                <DetailItem label={t.billing.owner}>{inv.owner.name}</DetailItem>
                {inv.quote && (
                  <DetailItem label={t.billing.quote}>
                    <Link href={`/quotes/${inv.quote.id}`} className="hover:underline" dir="ltr">
                      {inv.quote.number}
                    </Link>
                  </DetailItem>
                )}
                {inv.deal && <DetailItem label={t.billing.deal}><Link href={`/deals/${inv.deal.id}`} className="hover:underline">{inv.deal.title}</Link></DetailItem>}
                {inv.paidAt && <DetailItem label={t.invoices.statuses.PAID}>{t.tpl(t.invoices.paidOn, { date: t.date(inv.paidAt) })}</DetailItem>}
              </dl>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t.billing.lines}</CardTitle>
            </CardHeader>
            <CardContent>
              <LinesTable lines={inv.lines} />
            </CardContent>
          </Card>
          {inv.notes && (
            <Card>
              <CardContent className="pt-5">
                <DetailItem label={t.billing.notes}><span className="whitespace-pre-wrap">{inv.notes}</span></DetailItem>
              </CardContent>
            </Card>
          )}
        </div>
        <AuditHistory entity="Invoice" recordId={id} />
      </div>
    </>
  );
}
