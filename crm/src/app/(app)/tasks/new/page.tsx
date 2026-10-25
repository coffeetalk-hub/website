import { requireUser } from "@/core/auth/session";
import { assertCan } from "@/core/permissions";
import { strParam } from "@/core/forms";
import { createActivity } from "@/modules/activities/actions";
import { ActivityForm } from "@/modules/activities/components/activity-form";
import { listAssignableUsers } from "@/modules/users/queries";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { t } from "@/core/i18n";

export default async function NewActivityPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  assertCan(user, "activity", "create");
  const sp = await searchParams;
  const assignees = await listAssignableUsers(user);
  return (
    <>
      <PageHeader title={t.tasks.new} />
      <Card className="max-w-2xl">
        <CardContent className="pt-4">
          <ActivityForm
            action={createActivity}
            assignees={assignees}
            initial={{ assigneeId: user.id, type: "FOLLOW_UP" }}
            links={{ contactId: strParam(sp.contactId), companyId: strParam(sp.companyId), dealId: strParam(sp.dealId) }}
            returnTo={strParam(sp.returnTo)}
            cancelHref="/tasks"
          />
        </CardContent>
      </Card>
    </>
  );
}
