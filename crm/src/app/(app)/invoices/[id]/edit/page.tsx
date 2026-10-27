import { notFound, redirect } from "next/navigation";
import { requireAccess } from "@/core/auth/session";
import { getT } from "@/core/i18n/server";
import { getInvoice } from "@/modules/invoices/queries";
import { updateInvoice } from "@/modules/invoices/actions";
import { InvoiceForm } from "@/modules/invoices/components/invoice-form";
import { getFormOptions } from "@/modules/billing/options";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const t = await getT();
  const user = await requireAccess("invoice", "update");
  const { id } = await params;
  const inv = await getInvoice(user, id);
  if (!inv) notFound();
  if (inv.status !== "DRAFT") redirect(`/invoices/${id}`);
  const o = await getFormOptions(user);
  return (
    <>
      <PageHeader title={`${t.common.edit}: ${t.invoices.statuses.DRAFT}`} />
      <Card>
        <CardContent className="pt-5">
          <InvoiceForm
            action={updateInvoice.bind(null, id)}
            initial={{ ...inv, lines: inv.lines.map((l) => ({ ...l, productId: null })) }}
            companies={o.companies}
            contacts={o.contacts}
            deals={o.deals}
            products={o.products}
            defaultVat={o.profile.defaultVatRate}
            defaultDueDays={o.profile.paymentTermsDays}
            cancelHref={`/invoices/${id}`}
          />
        </CardContent>
      </Card>
    </>
  );
}
