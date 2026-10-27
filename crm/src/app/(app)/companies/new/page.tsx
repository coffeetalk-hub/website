import { getT } from "@/core/i18n/server";
import { requireUser } from "@/core/auth/session";
import { assertCan } from "@/core/permissions";
import { getFieldDefs } from "@/core/custom-fields";
import { createCompany } from "@/modules/companies/actions";
import { CompanyForm } from "@/modules/companies/components/company-form";
import { listAssignableUsers } from "@/modules/users/queries";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";

export default async function NewCompanyPage() {
  const t = await getT();
  const user = await requireUser();
  assertCan(user, "company", "create");
  const [owners, defs] = await Promise.all([listAssignableUsers(user), getFieldDefs("COMPANY")]);
  return (
    <>
      <PageHeader title={t.companies.new} />
      <Card className="max-w-3xl">
        <CardContent className="pt-4">
          <CompanyForm action={createCompany} owners={owners} defs={defs} cancelHref="/companies" initial={{ ownerId: user.id }} />
        </CardContent>
      </Card>
    </>
  );
}
