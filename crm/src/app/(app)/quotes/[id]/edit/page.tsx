import { notFound, redirect } from "next/navigation";
import { requireAccess } from "@/core/auth/session";
import { getT } from "@/core/i18n/server";
import { getQuote } from "@/modules/quotes/queries";
import { updateQuote } from "@/modules/quotes/actions";
import { QuoteForm } from "@/modules/quotes/components/quote-form";
import { getFormOptions } from "@/modules/billing/options";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";

export default async function EditQuotePage({ params }: { params: Promise<{ id: string }> }) {
  const t = await getT();
  const user = await requireAccess("quote", "update");
  const { id } = await params;
  const quote = await getQuote(user, id);
  if (!quote) notFound();
  if (quote.status !== "DRAFT") redirect(`/quotes/${id}`);
  const o = await getFormOptions(user);
  return (
    <>
      <PageHeader title={`${t.common.edit}: ${quote.number}`} />
      <Card>
        <CardContent className="pt-5">
          <QuoteForm
            action={updateQuote.bind(null, id)}
            initial={quote}
            companies={o.companies}
            contacts={o.contacts}
            deals={o.deals}
            products={o.products}
            defaultVat={o.profile.defaultVatRate}
            defaultValidDays={o.profile.quoteValidityDays}
            cancelHref={`/quotes/${id}`}
          />
        </CardContent>
      </Card>
    </>
  );
}
