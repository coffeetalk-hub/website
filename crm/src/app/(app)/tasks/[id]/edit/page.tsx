import { notFound } from "next/navigation";
import { requireUser } from "@/core/auth/session";
import { getActivity } from "@/modules/activities/queries";
import { deleteActivity, updateActivity } from "@/modules/activities/actions";
import { ActivityForm } from "@/modules/activities/components/activity-form";
import { listAssignableUsers } from "@/modules/users/queries";
import { PageHeader } from "@/components/page-header";
import { DeleteButton } from "@/components/forms/delete-button";
import { Card, CardContent } from "@/components/ui/card";
import { t } from "@/core/i18n";

export default async function EditActivityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const activity = await getActivity(user, id);
  if (!activity) notFound();
  const assignees = await listAssignableUsers(user);
  return (
    <>
      <PageHeader title={`${t.common.edit}: ${activity.subject}`}>
        <DeleteButton action={deleteActivity.bind(null, id)} />
      </PageHeader>
      <Card className="max-w-2xl">
        <CardContent className="pt-4">
          <ActivityForm action={updateActivity.bind(null, id)} initial={activity} assignees={assignees} cancelHref="/tasks" />
        </CardContent>
      </Card>
    </>
  );
}
