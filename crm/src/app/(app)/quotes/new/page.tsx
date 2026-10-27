import { db } from "@/core/db";
import { requireAccess } from "@/core/auth/session";
import { strParam } from "@/core/forms";
import { getT } from "@/core/i18n/server";
import { createQuote } from "@/modules/quotes/actions";
import { QuoteForm } from "@/modules/quotes/components/quote-form";
import { getFormOptions } from "@/modules/billing/options";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";

export default async function NewQuotePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const t = await getT();
  const user = await requireAccess("quote", "create");
  const sp = await searchParams;
  const o = await getFormOptions(user);
  // "Create quote" from a deal page pre-fills the deal, company and contact (only if the user may see them).
  const deal = strParam(sp.dealId) && o.deals.some((d) => d.id === strParam(sp.dealId)) ? await db.deal.findUnique({ where: { id: strParam(sp.dealId)! } }) : null;
  const initial = {
    dealId: deal?.id ?? null,
    companyId: deal?.companyId && o.companies.some((c) => c.id === deal.companyId) ? deal.companyId : (strParam(sp.companyId) ?? null),
    contactId: deal?.contactId && o.contacts.some((c) => c.id === deal.contactId) ? deal.contactId : (strParam(sp.contactId) ?? null),
    lines: deal ? [{ productId: null, description: deal.title, qty: 1, unitPrice: deal.value, discountPct: 0, vatRate: o.profile.defaultVatRate }] : [],
  };
  return (
    <>
      <PageHeader title={t.quotes.new} />
      <Card>
        <CardContent className="pt-5">
          <QuoteForm
            action={createQuote}
            initial={initial}
            companies={o.companies}
            contacts={o.contacts}
            deals={o.deals}
            products={o.products}
            defaultVat={o.profile.defaultVatRate}
            defaultValidDays={o.profile.quoteValidityDays}
            cancelHref="/quotes"
          />
        </CardContent>
      </Card>
    </>
  );
}
