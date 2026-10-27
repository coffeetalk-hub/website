import Link from "next/link";
import { db } from "@/core/db";
import { requireAccess } from "@/core/auth/session";
import { strParam } from "@/core/forms";
import { getT } from "@/core/i18n/server";
import { revokeApiKey, deleteWebhook, testWebhook, toggleWebhook } from "@/modules/api/admin-actions";
import { ApiKeyCreator, WebhookCreator } from "@/modules/api/components/secret-forms";
import { PageHeader } from "@/components/page-header";
import { ActionButton } from "@/components/forms/confirm-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

export default async function ApiSettingsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const t = await getT();
  await requireAccess("settings", "manage");
  const testResult = strParam((await searchParams).test);
  const [keys, users, hooks, deliveries] = await Promise.all([
    db.apiKey.findMany({ include: { user: { select: { name: true } } }, orderBy: { createdAt: "desc" } }),
    db.user.findMany({ where: { active: true }, select: { id: true, name: true, email: true }, orderBy: { name: "asc" } }),
    db.webhook.findMany({ orderBy: { createdAt: "desc" } }),
    db.webhookDelivery.findMany({ include: { webhook: { select: { url: true } } }, orderBy: { createdAt: "desc" }, take: 15 }),
  ]);
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://your-crm.example.com";

  return (
    <>
      <PageHeader title={t.api.title} />
      <p className="mb-4 text-sm text-muted-foreground">{t.api.help}</p>
      {testResult && <p className="mb-4 rounded-xl bg-secondary p-3 text-sm">{t.tpl(t.api.testResult, { result: testResult })}</p>}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">{t.api.keys}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ApiKeyCreator users={users} />
          <Table>
            <THead>
              <TR>
                <TH>{t.common.name}</TH>
                <TH>{t.api.prefix}</TH>
                <TH className="hidden sm:table-cell">{t.api.keyUser}</TH>
                <TH>{t.api.keyScope}</TH>
                <TH className="hidden md:table-cell">{t.api.lastUsed}</TH>
                <TH />
              </TR>
            </THead>
            <TBody>
              {keys.map((k) => (
                <TR key={k.id}>
                  <TD className="font-medium">{k.name}</TD>
                  <TD dir="ltr"><code className="text-xs">{k.prefix}…</code></TD>
                  <TD className="hidden sm:table-cell">{k.user.name}</TD>
                  <TD>{t.api.scopes[k.scope as "READ" | "WRITE"] ?? k.scope}</TD>
                  <TD className="hidden md:table-cell">{k.lastUsedAt ? t.dateTime(k.lastUsedAt) : t.api.never}</TD>
                  <TD>
                    {k.revokedAt ? <Badge>{t.api.revoked}</Badge> : <ActionButton action={revokeApiKey.bind(null, k.id)} confirmText={t.api.revoke + "?"} className="text-destructive">{t.api.revoke}</ActionButton>}
                  </TD>
                </TR>
              ))}
              {keys.length === 0 && (
                <TR>
                  <TD colSpan={6} className="py-6 text-center text-muted-foreground">{t.api.noKeys}</TD>
                </TR>
              )}
            </TBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">{t.api.webhooks}</CardTitle>
          <p className="text-sm text-muted-foreground">{t.api.webhooksHelp}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <WebhookCreator />
          <Table>
            <THead>
              <TR>
                <TH>{t.api.url}</TH>
                <TH className="hidden sm:table-cell">{t.api.events}</TH>
                <TH />
              </TR>
            </THead>
            <TBody>
              {hooks.map((h) => (
                <TR key={h.id}>
                  <TD dir="ltr" className="break-all text-xs">{h.url}</TD>
                  <TD dir="ltr" className="hidden max-w-xs truncate text-xs sm:table-cell">{h.events === "*" ? t.api.allEvents : h.events}</TD>
                  <TD>
                    <div className="flex flex-wrap gap-1">
                      <ActionButton action={testWebhook.bind(null, h.id)}>{t.api.test}</ActionButton>
                      <ActionButton action={toggleWebhook.bind(null, h.id)}>{h.active ? t.api.disable : t.api.enable}</ActionButton>
                      <ActionButton action={deleteWebhook.bind(null, h.id)} confirmText={t.common.confirmDelete} className="text-destructive">{t.common.delete}</ActionButton>
                    </div>
                  </TD>
                </TR>
              ))}
              {hooks.length === 0 && (
                <TR>
                  <TD colSpan={3} className="py-6 text-center text-muted-foreground">{t.api.noWebhooks}</TD>
                </TR>
              )}
            </TBody>
          </Table>
          <div>
            <h3 className="mb-2 text-sm font-semibold">{t.api.deliveries}</h3>
            {deliveries.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t.api.noDeliveries}</p>
            ) : (
              <ul className="space-y-1 text-xs" data-testid="deliveries">
                {deliveries.map((d) => (
                  <li key={d.id} className="flex flex-wrap items-center justify-between gap-2" dir="ltr">
                    <span><b>{d.event}</b> → {d.webhook.url}</span>
                    <span className={d.status === "SUCCESS" ? "text-green-600" : d.status === "FAILED" ? "text-destructive" : "text-muted-foreground"}>
                      {d.status}{d.responseCode ? ` · HTTP ${d.responseCode}` : ""} · {t.tpl(t.api.attempts, { n: d.attempts })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t.api.docs}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            <Link href="/api/v1/openapi.json" className="text-coral hover:underline" target="_blank">{t.api.openapi}</Link>
          </p>
          <h3 className="font-semibold">{t.api.quickStart}</h3>
          <pre dir="ltr" className="overflow-x-auto rounded-xl bg-secondary p-3 text-xs">{`curl ${base}/api/v1/contacts?limit=5 \\
  -H "Authorization: Bearer crm_live_…"

curl -X POST ${base}/api/v1/contacts \\
  -H "Authorization: Bearer crm_live_…" -H "Content-Type: application/json" \\
  -d '{"firstName":"Sara","lastName":"Al-Harbi","email":"sara@example.com","custom":{"preferred_language":"Arabic"}}'

curl -X PATCH ${base}/api/v1/deals/<id> \\
  -H "Authorization: Bearer crm_live_…" -H "Content-Type: application/json" \\
  -d '{"stageId":"<stage id from /api/v1/stages>"}'`}</pre>
        </CardContent>
      </Card>
    </>
  );
}
