import Link from "next/link";
import { notFound } from "next/navigation";
import { FilePlus2, Pencil, Printer } from "lucide-react";
import { requireAccess } from "@/core/auth/session";
import { can } from "@/core/permissions";
import { getT } from "@/core/i18n/server";
import { AuditHistory } from "@/core/audit/history";
import { getQuote } from "@/modules/quotes/queries";
import { deleteQuote, setQuoteStatus } from "@/modules/quotes/actions";
import { QUOTE_TRANSITIONS, type QuoteStatus } from "@/modules/quotes/schema";
import { createInvoiceFromQuote } from "@/modules/invoices/actions";
import { LinesTable } from "@/modules/billing/components/lines-table";
import { DetailItem } from "@/components/custom-fields";
import { DeleteButton } from "@/components/forms/delete-button";
import { ActionButton } from "@/components/forms/confirm-button";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const t = await getT();
  const user = await requireAccess("quote");
  const { id } = await params;
  const q = await getQuote(user, id);
  if (!q) notFound();
  const status = q.status as QuoteStatus;
  const liveInvoice = q.invoices.find((i) => i.status !== "CANCELLED");
  const next = QUOTE_TRANSITIONS[status].filter((s) => !(s === "DRAFT" && liveInvoice));
  const label: Record<QuoteStatus, string> = { DRAFT: t.quotes.reopen, SENT: t.quotes.markSent, ACCEPTED: t.quotes.markAccepted, REJECTED: t.quotes.markRejected };

  return (
    <>
      <PageHeader title={q.number}>
        <StatusBadge status={q.status} label={t.quotes.statuses[status]} />
        {status === "DRAFT" && (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/quotes/${id}/edit`}>
              <Pencil className="h-4 w-4" />
              {t.common.edit}
            </Link>
          </Button>
        )}
        <Button variant="outline" size="sm" asChild>
          <Link href={`/print/quotes/${id}`} target="_blank">
            <Printer className="h-4 w-4" />
            {t.billing.print}
          </Link>
        </Button>
        {status === "DRAFT" && can(user, "quote", "delete") && <DeleteButton action={deleteQuote.bind(null, id)} />}
      </PageHeader>

      <div className="mb-4 flex flex-wrap gap-2">
        {next.map((s) => (
          <ActionButton key={s} action={setQuoteStatus.bind(null, id, s)} variant={s === "ACCEPTED" ? "default" : "outline"}>
            {label[s]}
          </ActionButton>
        ))}
        {status === "ACCEPTED" && !liveInvoice && can(user, "invoice", "create") && (
          <ActionButton action={createInvoiceFromQuote.bind(null, id)} variant="default">
            <FilePlus2 className="h-4 w-4" />
            {t.quotes.createInvoice}
          </ActionButton>
        )}
        {liveInvoice && (
          <Button variant="secondary" size="sm" asChild>
            <Link href={`/invoices/${liveInvoice.id}`}>{t.tpl(t.quotes.hasInvoice, { number: liveInvoice.number.startsWith("DRAFT-") ? t.invoices.statuses.DRAFT : liveInvoice.number })}</Link>
          </Button>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardContent className="pt-5">
              <dl className="grid gap-4 sm:grid-cols-3">
                <DetailItem label={t.billing.company}>{q.company ? <Link href={`/companies/${q.company.id}`} className="hover:underline">{q.company.name}</Link> : "—"}</DetailItem>
                <DetailItem label={t.billing.contact}>{q.contact ? <Link href={`/contacts/${q.contact.id}`} className="hover:underline">{q.contact.firstName} {q.contact.lastName}</Link> : "—"}</DetailItem>
                <DetailItem label={t.billing.deal}>{q.deal ? <Link href={`/deals/${q.deal.id}`} className="hover:underline">{q.deal.title}</Link> : "—"}</DetailItem>
                <DetailItem label={t.billing.issueDate}>{t.date(q.issueDate)}</DetailItem>
                <DetailItem label={t.billing.validUntil}>{t.date(q.validUntil)}</DetailItem>
                <DetailItem label={t.billing.owner}>{q.owner.name}</DetailItem>
              </dl>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t.billing.lines}</CardTitle>
            </CardHeader>
            <CardContent>
              <LinesTable lines={q.lines} />
            </CardContent>
          </Card>
          {(q.notes || q.terms) && (
            <Card>
              <CardContent className="grid gap-4 pt-5 sm:grid-cols-2">
                {q.notes && <DetailItem label={t.billing.notes}><span className="whitespace-pre-wrap">{q.notes}</span></DetailItem>}
                {q.terms && <DetailItem label={t.billing.terms}><span className="whitespace-pre-wrap">{q.terms}</span></DetailItem>}
              </CardContent>
            </Card>
          )}
        </div>
        <AuditHistory entity="Quote" recordId={id} />
      </div>
    </>
  );
}
