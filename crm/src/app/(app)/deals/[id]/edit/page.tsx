import { notFound } from "next/navigation";
import { requireUser } from "@/core/auth/session";
import { getFieldDefs, getFieldValues } from "@/core/custom-fields";
import { getDeal, listStages } from "@/modules/deals/queries";
import { updateDeal } from "@/modules/deals/actions";
import { DealForm } from "@/modules/deals/components/deal-form";
import { listCompanyOptions } from "@/modules/companies/queries";
import { listContactOptions } from "@/modules/contacts/queries";
import { listAssignableUsers } from "@/modules/users/queries";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { t } from "@/core/i18n";

export default async function EditDealPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const deal = await getDeal(user, id);
  if (!deal) notFound();
  const [stages, owners, companies, contacts, defs, values] = await Promise.all([
    listStages(),
    listAssignableUsers(user),
    listCompanyOptions(user),
    listContactOptions(user),
    getFieldDefs("DEAL"),
    getFieldValues("DEAL", id),
  ]);
  return (
    <>
      <PageHeader title={`${t.common.edit}: ${deal.title}`} />
      <Card className="max-w-3xl">
        <CardContent className="pt-4">
          <DealForm
            action={updateDeal.bind(null, id)}
            initial={deal}
            stages={stages}
            owners={owners}
            companies={companies}
            contacts={contacts}
            defs={defs}
            customValues={values}
            cancelHref={`/deals/${id}`}
          />
        </CardContent>
      </Card>
    </>
  );
}
