import { requireUser } from "@/core/auth/session";
import { assertCan } from "@/core/permissions";
import { getFieldDefs } from "@/core/custom-fields";
import { strParam } from "@/core/forms";
import { createDeal } from "@/modules/deals/actions";
import { DealForm } from "@/modules/deals/components/deal-form";
import { listStages } from "@/modules/deals/queries";
import { listCompanyOptions } from "@/modules/companies/queries";
import { listContactOptions } from "@/modules/contacts/queries";
import { listAssignableUsers } from "@/modules/users/queries";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { t } from "@/core/i18n";

export default async function NewDealPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  assertCan(user, "deal", "create");
  const sp = await searchParams;
  const [stages, owners, companies, contacts, defs] = await Promise.all([
    listStages(),
    listAssignableUsers(user),
    listCompanyOptions(user),
    listContactOptions(user),
    getFieldDefs("DEAL"),
  ]);
  return (
    <>
      <PageHeader title={t.deals.new} />
      <Card className="max-w-3xl">
        <CardContent className="pt-4">
          <DealForm
            action={createDeal}
            stages={stages}
            owners={owners}
            companies={companies}
            contacts={contacts}
            defs={defs}
            cancelHref="/deals"
            initial={{ ownerId: user.id, stageId: strParam(sp.stageId), companyId: strParam(sp.companyId), contactId: strParam(sp.contactId) }}
          />
        </CardContent>
      </Card>
    </>
  );
}
