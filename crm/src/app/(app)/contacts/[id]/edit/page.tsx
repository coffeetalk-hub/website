import { getT } from "@/core/i18n/server";
import { notFound } from "next/navigation";
import { requireUser } from "@/core/auth/session";
import { getFieldDefs, getFieldValues } from "@/core/custom-fields";
import { getContact } from "@/modules/contacts/queries";
import { updateContact } from "@/modules/contacts/actions";
import { ContactForm } from "@/modules/contacts/components/contact-form";
import { listCompanyOptions } from "@/modules/companies/queries";
import { listAssignableUsers } from "@/modules/users/queries";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";

export default async function EditContactPage({ params }: { params: Promise<{ id: string }> }) {
  const t = await getT();
  const { id } = await params;
  const user = await requireUser();
  const contact = await getContact(user, id);
  if (!contact) notFound();
  const [owners, companies, defs, values] = await Promise.all([
    listAssignableUsers(user),
    listCompanyOptions(user),
    getFieldDefs("CONTACT"),
    getFieldValues("CONTACT", id),
  ]);
  return (
    <>
      <PageHeader title={`${t.common.edit}: ${contact.firstName} ${contact.lastName}`} />
      <Card className="max-w-3xl">
        <CardContent className="pt-4">
          <ContactForm
            action={updateContact.bind(null, id)}
            initial={contact}
            owners={owners}
            companies={companies}
            defs={defs}
            customValues={values}
            cancelHref={`/contacts/${id}`}
          />
        </CardContent>
      </Card>
    </>
  );
}
