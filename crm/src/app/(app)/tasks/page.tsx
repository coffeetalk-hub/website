import Link from "next/link";
import { Plus } from "lucide-react";
import { requireUser } from "@/core/auth/session";
import { assertCan, isPrivileged } from "@/core/permissions";
import { pageParam, strParam } from "@/core/forms";
import { VIEWS, listActivities, type View } from "@/modules/activities/queries";
import { ACTIVITY_TYPES } from "@/modules/activities/schema";
import { TaskRow } from "@/modules/activities/components/task-row";
import { listAssignableUsers } from "@/modules/users/queries";
import { PageHeader } from "@/components/page-header";
import { ListFilters, type FilterSelect } from "@/components/list-filters";
import { Pagination } from "@/components/pagination";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { t } from "@/core/i18n";

type SP = Promise<Record<string, string | string[] | undefined>>;
const viewLabels: Record<View, string> = { open: "Open", today: "Due today", overdue: "Overdue", done: "Completed", all: "All" };

export default async function TasksPage({ searchParams }: { searchParams: SP }) {
  const user = await requireUser();
  assertCan(user, "activity");
  const sp = await searchParams;
  const view = (VIEWS as readonly string[]).includes(strParam(sp.view) ?? "") ? (strParam(sp.view) as View) : "open";
  const q = strParam(sp.q);
  const type = strParam(sp.type);
  const assigneeId = strParam(sp.assigneeId);
  const page = pageParam(sp.page);
  const [{ rows, total }, assignees] = await Promise.all([listActivities(user, { view, type, assigneeId, q, page }), listAssignableUsers(user)]);

  const selects: FilterSelect[] = [{ name: "type", label: t.tasks.type, value: type, options: ACTIVITY_TYPES.map((x) => ({ value: x, label: t.tasks.types[x] })) }];
  if (isPrivileged(user)) selects.push({ name: "assigneeId", label: t.tasks.assignee, value: assigneeId, options: assignees.map((a) => ({ value: a.id, label: a.name })) });

  return (
    <>
      <PageHeader title={t.tasks.title}>
        <Button asChild>
          <Link href="/tasks/new">
            <Plus className="h-4 w-4" />
            {t.tasks.new}
          </Link>
        </Button>
      </PageHeader>
      <div className="mb-3 flex flex-wrap gap-1">
        {VIEWS.map((v) => (
          <Link
            key={v}
            href={`/tasks?view=${v}`}
            className={cn("rounded-full px-3 py-1 text-sm", v === view ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent")}
          >
            {viewLabels[v]}
          </Link>
        ))}
      </div>
      <ListFilters basePath="/tasks" hidden={{ view }} q={q} selects={selects} />
      <Card>
        <Table>
          <THead>
            <TR>
              <TH />
              <TH>{t.tasks.subject}</TH>
              <TH>{t.tasks.type}</TH>
              <TH>{t.tasks.due}</TH>
              <TH className="hidden md:table-cell">Related to</TH>
              <TH className="hidden sm:table-cell">{t.tasks.assignee}</TH>
            </TR>
          </THead>
          <TBody>
            {rows.map((a) => (
              <TaskRow key={a.id} a={a} />
            ))}
            {rows.length === 0 && (
              <TR>
                <TD colSpan={6} className="py-8 text-center text-muted-foreground">
                  {t.common.noResults}
                </TD>
              </TR>
            )}
          </TBody>
        </Table>
      </Card>
      <Pagination page={page} total={total} basePath="/tasks" params={{ view, q, type, assigneeId }} />
    </>
  );
}
