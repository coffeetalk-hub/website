import { requireAccess } from "@/core/auth/session";
import { getT } from "@/core/i18n/server";
import { createInvoice } from "@/modules/invoices/actions";
import { InvoiceForm } from "@/modules/invoices/components/invoice-form";
import { getFormOptions } from "@/modules/billing/options";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";

export default async function NewInvoicePage() {
  const t = await getT();
  const user = await requireAccess("invoice", "create");
  const o = await getFormOptions(user);
  return (
    <>
      <PageHeader title={t.invoices.new} />
      <Card>
        <CardContent className="pt-5">
          <InvoiceForm action={createInvoice} companies={o.companies} contacts={o.contacts} deals={o.deals} products={o.products} defaultVat={o.profile.defaultVatRate} defaultDueDays={o.profile.paymentTermsDays} cancelHref="/invoices" />
        </CardContent>
      </Card>
    </>
  );
}
