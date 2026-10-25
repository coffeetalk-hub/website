import { getT } from "@/core/i18n/server";
import { requireUser } from "@/core/auth/session";
import { assertCan } from "@/core/permissions";
import { getFieldDefs } from "@/core/custom-fields";
import { createContact } from "@/modules/contacts/actions";
import { ContactForm } from "@/modules/contacts/components/contact-form";
import { listCompanyOptions } from "@/modules/companies/queries";
import { listAssignableUsers } from "@/modules/users/queries";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";

export default async function NewContactPage() {
  const t = await getT();
  const user = await requireUser();
  assertCan(user, "contact", "create");
  const [owners, companies, defs] = await Promise.all([listAssignableUsers(user), listCompanyOptions(user), getFieldDefs("CONTACT")]);
  return (
    <>
      <PageHeader title={t.contacts.new} />
      <Card className="max-w-3xl">
        <CardContent className="pt-4">
          <ContactForm action={createContact} owners={owners} companies={companies} defs={defs} cancelHref="/contacts" initial={{ ownerId: user.id }} />
        </CardContent>
      </Card>
    </>
  );
}
