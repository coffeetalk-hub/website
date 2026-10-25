import { createActivity } from "../actions";
import { ActivityForm } from "./activity-form";
import { listAssignableUsers } from "@/modules/users/queries";
import type { SessionUser } from "@/core/permissions";
import { can } from "@/core/permissions";

/** Inline "log activity" form for contact / company / deal detail pages. */
export async function QuickAddActivity({
  user,
  returnTo,
  links,
}: {
  user: SessionUser;
  returnTo: string;
  links: { contactId?: string; companyId?: string; dealId?: string };
}) {
  if (!can(user, "activity", "create")) return null;
  const assignees = await listAssignableUsers(user);
  return (
    <details className="mb-4 rounded-md border p-3">
      <summary className="cursor-pointer text-sm font-medium">+ Log activity or task</summary>
      <div className="mt-3">
        <ActivityForm compact action={createActivity} assignees={assignees} links={links} returnTo={returnTo} initial={{ assigneeId: user.id }} />
      </div>
    </details>
  );
}
