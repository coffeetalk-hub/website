import { requireAccess } from "@/core/auth/session";
import { createUser } from "@/modules/users/actions";
import { UserForm } from "@/modules/users/components/user-form";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { t } from "@/core/i18n";

export default async function NewUserPage() {
  await requireAccess("user", "manage");
  return (
    <>
      <PageHeader title={t.users.new} />
      <Card className="max-w-2xl">
        <CardContent className="pt-5">
          <UserForm action={createUser} />
        </CardContent>
      </Card>
    </>
  );
}
