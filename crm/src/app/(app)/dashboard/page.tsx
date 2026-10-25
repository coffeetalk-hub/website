import Link from "next/link";
import { AlarmClock, CalendarCheck, Handshake, Wallet, type LucideIcon } from "lucide-react";
import { requireUser } from "@/core/auth/session";
import { getDashboard } from "@/modules/dashboard/queries";
import { RevenueChart } from "@/modules/dashboard/components/bar-chart";
import { OutcomeDonut } from "@/modules/dashboard/components/donut";
import { MiniCalendar } from "@/modules/dashboard/components/mini-calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime, formatMoney } from "@/lib/utils";
import { t } from "@/core/i18n";

const ENTITY_ROUTE: Record<string, string> = { Contact: "/contacts", Company: "/companies", Deal: "/deals" };
const VERBS: Record<string, string> = { CREATE: "created", UPDATE: "updated", DELETE: "deleted", IMPORT: "imported", MOVE: "moved" };

function Kpi({ icon: Icon, label, value, hint, href, tone }: { icon: LucideIcon; label: string; value: string; hint: string; href: string; tone: "navy" | "coral" }) {
  return (
    <Link href={href} className="block">
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardContent className="pt-5">
          <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${tone === "coral" ? "bg-coral-soft text-coral" : "bg-secondary text-chart-1"}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="text-xl font-bold tracking-tight sm:text-2xl">{value}</div>
          <div className="text-sm text-muted-foreground">{label}</div>
          <div className="mt-1 hidden text-xs text-muted-foreground/80 sm:block">{hint}</div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default async function DashboardPage() {
  const user = await requireUser();
  const d = await getDashboard(user);
  const topMax = Math.max(1, ...d.topReps.map((r) => r.value));
  const indMax = Math.max(1, ...d.industries.map((i) => i.count));

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-primary dark:text-foreground">Welcome {user.name.split(" ")[0]}!</h1>
        <p className="text-sm text-muted-foreground">Here is the overview of your business</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Kpi icon={Handshake} tone="navy" label={t.dashboard.openDeals} value={String(d.openDeals)} hint={`of ${d.totalDeals} deals in total`} href="/deals" />
        <Kpi icon={Wallet} tone="coral" label={t.dashboard.pipelineValue} value={formatMoney(d.pipelineValue)} hint={`Won so far: ${formatMoney(d.wonValue)}`} href="/deals" />
        <Kpi icon={CalendarCheck} tone="navy" label={t.dashboard.tasksDueToday} value={String(d.dueToday.length)} hint="Open tasks scheduled today" href="/tasks?view=today" />
        <Kpi icon={AlarmClock} tone="coral" label={t.dashboard.overdue} value={String(d.overdueCount)} hint="Past their due date" href="/tasks?view=overdue" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Revenue & forecast</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart months={d.months} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top sales reps</CardTitle>
          </CardHeader>
          <CardContent>
            {d.topReps.length === 0 ? (
              <p className="text-sm text-muted-foreground">No won deals yet.</p>
            ) : (
              <ul className="space-y-4">
                {d.topReps.map((r) => (
                  <li key={r.name}>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{r.name}</span>
                      <span className="text-muted-foreground">{r.count} won</span>
                    </div>
                    <div className="mt-1.5 h-2 rounded-full bg-secondary">
                      <div className="h-2 rounded-full bg-coral" style={{ width: `${(r.value / topMax) * 100}%` }} />
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">{formatMoney(r.value)}</div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Companies by industry</CardTitle>
          </CardHeader>
          <CardContent>
            {d.industries.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t.common.noResults}</p>
            ) : (
              <ul className="space-y-3">
                {d.industries.map((i) => (
                  <li key={i.name}>
                    <div className="flex justify-between text-sm">
                      <span>{i.name}</span>
                      <span className="font-semibold">{i.count}</span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-secondary">
                      <div className="h-2 rounded-full bg-chart-1" style={{ width: `${(i.count / indMax) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Deal outcomes</CardTitle>
          </CardHeader>
          <CardContent>
            <OutcomeDonut {...d.outcome} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <MiniCalendar taskDays={d.taskDays} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">{t.dashboard.tasksDueToday}</CardTitle>
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
            <CardTitle className="text-base">{t.dashboard.recentActivity}</CardTitle>
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
                        {route && l.action !== "DELETE" ? (
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
