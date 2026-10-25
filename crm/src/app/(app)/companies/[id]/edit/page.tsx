import { notFound } from "next/navigation";
import { requireUser } from "@/core/auth/session";
import { getFieldDefs, getFieldValues } from "@/core/custom-fields";
import { getCompany } from "@/modules/companies/queries";
import { updateCompany } from "@/modules/companies/actions";
import { CompanyForm } from "@/modules/companies/components/company-form";
import { listAssignableUsers } from "@/modules/users/queries";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { t } from "@/core/i18n";

export default async function EditCompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const company = await getCompany(user, id);
  if (!company) notFound();
  const [owners, defs, values] = await Promise.all([listAssignableUsers(user), getFieldDefs("COMPANY"), getFieldValues("COMPANY", id)]);
  return (
    <>
      <PageHeader title={`${t.common.edit}: ${company.name}`} />
      <Card className="max-w-3xl">
        <CardContent className="pt-4">
          <CompanyForm
            action={updateCompany.bind(null, id)}
            initial={company}
            owners={owners}
            defs={defs}
            customValues={values}
            cancelHref={`/companies/${id}`}
          />
        </CardContent>
      </Card>
    </>
  );
}
