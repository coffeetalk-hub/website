import { notFound } from "next/navigation";
import { db } from "@/core/db";
import { requireAccess } from "@/core/auth/session";
import { strParam } from "@/core/forms";
import { getT } from "@/core/i18n/server";
import { updateUser, revokeSessions } from "@/modules/users/actions";
import { UserForm } from "@/modules/users/components/user-form";
import { AuditHistory } from "@/core/audit/history";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function EditUserPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const t = await getT();
  await requireAccess("user", "manage");
  const { id } = await params;
  const revoked = strParam((await searchParams).revoked);
  const user = await db.user.findUnique({ where: { id } });
  if (!user) notFound();
  const attempts = await db.loginAttempt.findMany({ where: { email: user.email }, orderBy: { createdAt: "desc" }, take: 8 });
  return (
    <>
      <PageHeader title={`${t.common.edit}: ${user.name}`}>
        <form action={revokeSessions.bind(null, id)}>
          <Button variant="outline" size="sm">
            {t.auth.signOutEverywhere}
          </Button>
        </form>
      </PageHeader>
      {revoked && <p className="mb-4 rounded-xl bg-secondary p-3 text-sm">{t.auth.signedOutEverywhere}</p>}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="pt-5">
            <UserForm action={updateUser.bind(null, id)} initial={user} editing />
          </CardContent>
        </Card>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t.auth.recentSignIns}</CardTitle>
            </CardHeader>
            <CardContent>
              {attempts.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t.auth.noSignIns}</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {attempts.map((a) => (
                    <li key={a.id} className="flex items-center justify-between gap-2">
                      <span className={a.success ? "" : "text-destructive"}>{a.success ? t.auth.signInOk : t.auth.signInFailed}</span>
                      <span className="text-xs text-muted-foreground">
                        {a.ip ? `${a.ip} · ` : ""}
                        {t.dateTime(a.createdAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
          <AuditHistory entity="User" recordId={id} />
        </div>
      </div>
    </>
  );
}
