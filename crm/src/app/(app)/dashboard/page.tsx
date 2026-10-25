import Link from "next/link";
import { requireUser } from "@/core/auth/session";
import { getDashboard } from "@/modules/dashboard/queries";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime, formatMoney } from "@/lib/utils";
import { t } from "@/core/i18n";

const ENTITY_ROUTE: Record<string, string> = { Contact: "/contacts", Company: "/companies", Deal: "/deals", Activity: "/tasks" };
const VERBS: Record<string, string> = { CREATE: "created", UPDATE: "updated", DELETE: "deleted", IMPORT: "imported", MOVE: "moved" };

function Stat({ label, value, hint, href }: { label: string; value: string; hint?: string; href?: string }) {
  const body = (
    <Card className={`h-full ${href ? "transition-colors hover:bg-accent/40" : ""}`}>
      <CardHeader>
        <CardTitle>{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold tracking-tight">{value}</div>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
  return href ? <Link href={href} className="block">{body}</Link> : body;
}

export default async function DashboardPage() {
  const user = await requireUser();
  const d = await getDashboard(user);
  const max = Math.max(1, ...d.byStage.map((s) => s.value));

  return (
    <>
      <PageHeader title={t.dashboard.title} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label={t.dashboard.openDeals} value={String(d.openDeals)} href="/deals" />
        <Stat label={t.dashboard.pipelineValue} value={formatMoney(d.pipelineValue)} hint={`Won so far: ${formatMoney(d.wonValue)}`} href="/deals" />
        <Stat label={t.dashboard.tasksDueToday} value={String(d.dueToday.length)} href="/tasks?view=today" />
        <Stat label={t.dashboard.overdue} value={String(d.overdueCount)} href="/tasks?view=overdue" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pipeline by stage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {d.byStage.map((s) => (
              <div key={s.id}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>
                    {s.name} <span className="text-muted-foreground">({s.count})</span>
                  </span>
                  <span className="text-muted-foreground">{formatMoney(s.value)}</span>
                </div>
                <div className="h-2 rounded-full bg-secondary">
                  <div
                    className={`h-2 rounded-full ${s.kind === "WON" ? "bg-green-500" : s.kind === "LOST" ? "bg-red-400" : "bg-primary"}`}
                    style={{ width: `${(s.value / max) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.dashboard.tasksDueToday}</CardTitle>
          </CardHeader>
          <CardContent>
            {d.dueToday.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing due today.</p>
            ) : (
              <ul className="divide-y text-sm">
                {d.dueToday.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-2 py-2">
                    <div className="min-w-0">
                      <Link href={`/tasks/${a.id}/edit`} className="font-medium hover:underline">
                        {a.subject}
                      </Link>
                      <div className="truncate text-xs text-muted-foreground">
                        {a.deal?.title ?? (a.contact ? `${a.contact.firstName} ${a.contact.lastName}` : a.company?.name) ?? a.assignee.name}
                      </div>
                    </div>
                    <Badge>{t.tasks.types[a.type as keyof typeof t.tasks.types]}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t.dashboard.recentActivity}</CardTitle>
          </CardHeader>
          <CardContent>
            {d.recent.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t.common.noResults}</p>
            ) : (
              <ul className="divide-y text-sm">
                {d.recent.map((l) => {
                  const label = (l.changes as { name?: string; title?: string; subject?: string } | null) ?? {};
                  const name = label.name ?? label.title ?? label.subject;
                  const route = ENTITY_ROUTE[l.entity];
                  const text = `${l.entity.toLowerCase()}${name ? ` “${name}”` : ""}`;
                  return (
                    <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                      <span>
                        <span className="font-medium">{l.user?.name ?? "System"}</span> {VERBS[l.action] ?? l.action.toLowerCase()}{" "}
                        {route && l.action !== "DELETE" && l.entity !== "Activity" ? (
                          <Link href={`${route}/${l.recordId}`} className="hover:underline">
                            {text}
                          </Link>
                        ) : (
                          text
                        )}
                      </span>
                      <span className="text-xs text-muted-foreground">{formatDateTime(l.createdAt)}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
