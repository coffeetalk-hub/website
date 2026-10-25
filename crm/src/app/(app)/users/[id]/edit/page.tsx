import { getT } from "@/core/i18n/server";
import { notFound } from "next/navigation";
import { db } from "@/core/db";
import { requireAccess } from "@/core/auth/session";
import { updateUser } from "@/modules/users/actions";
import { UserForm } from "@/modules/users/components/user-form";
import { AuditHistory } from "@/core/audit/history";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const t = await getT();
  await requireAccess("user", "manage");
  const { id } = await params;
  const user = await db.user.findUnique({ where: { id } });
  if (!user) notFound();
  return (
    <>
      <PageHeader title={`${t.common.edit}: ${user.name}`} />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="pt-5">
            <UserForm action={updateUser.bind(null, id)} initial={user} editing />
          </CardContent>
        </Card>
        <AuditHistory entity="User" recordId={id} />
      </div>
    </>
  );
}
