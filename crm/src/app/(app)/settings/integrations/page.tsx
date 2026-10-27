import { requireAccess } from "@/core/auth/session";
import { decryptSecret } from "@/core/crypto";
import { getEmailSettings } from "@/core/email";
import { strParam } from "@/core/forms";
import { getT } from "@/core/i18n/server";
import { checkWhatsApp, regenerateInboundToken, saveEmailConfig, saveWhatsAppConfig, sendTestEmail } from "@/modules/integrations/actions";
import { getWhatsAppSettings } from "@/core/whatsapp";
import { db } from "@/core/db";
import { Select } from "@/components/ui/input";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActionButton } from "@/components/forms/confirm-button";

export default async function IntegrationsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const t = await getT();
  await requireAccess("settings", "manage");
  const sp = await searchParams;
  const ok = strParam(sp.ok);
  const error = strParam(sp.error);
  const email = await getEmailSettings();
  const wa = await getWhatsAppSettings();
  const users = await db.user.findMany({ where: { active: true }, select: { id: true, name: true }, orderBy: { name: "asc" } });
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://your-crm.example.com";
  const inboundToken = email.inboundToken ? decryptSecret(email.inboundToken) : null;

  return (
    <>
      <PageHeader title={t.integrations.title} />
      {ok && <p className="mb-4 rounded-xl bg-secondary p-3 text-sm" role="status">{ok}</p>}
      {error && <p className="mb-4 rounded-xl bg-destructive/10 p-3 text-sm text-destructive" role="alert">{error}</p>}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">{t.integrations.emailTitle}</CardTitle>
          <p className="text-sm text-muted-foreground">{t.integrations.emailHelp}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action={saveEmailConfig} className="grid gap-3 sm:grid-cols-2" data-testid="email-form">
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input type="checkbox" name="enabled" defaultChecked={email.enabled} className="h-4 w-4 accent-[hsl(var(--coral))]" />
              {t.integrations.enabled}
            </label>
            <label className="space-y-1 text-sm">{t.integrations.host}<Input name="host" dir="ltr" defaultValue={email.host} placeholder="smtp.example.com" /></label>
            <label className="space-y-1 text-sm">{t.integrations.port}<Input name="port" type="number" defaultValue={email.port} /></label>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input type="checkbox" name="secure" defaultChecked={email.secure} className="h-4 w-4 accent-[hsl(var(--coral))]" />
              {t.integrations.secure}
            </label>
            <label className="space-y-1 text-sm">{t.integrations.user}<Input name="user" dir="ltr" autoComplete="off" defaultValue={email.user} /></label>
            <label className="space-y-1 text-sm">{t.integrations.password}<Input name="pass" type="password" autoComplete="new-password" placeholder={email.pass ? t.integrations.passwordKeep : ""} /></label>
            <label className="space-y-1 text-sm">{t.integrations.fromName}<Input name="fromName" defaultValue={email.fromName} /></label>
            <label className="space-y-1 text-sm">{t.integrations.fromEmail}<Input name="fromEmail" type="email" defaultValue={email.fromEmail} /></label>
            <label className="space-y-1 text-sm">{t.integrations.replyTo}<Input name="replyTo" type="email" defaultValue={email.replyTo} /></label>
            <div className="flex gap-2 sm:col-span-2">
              <Button size="sm">{t.integrations.save}</Button>
            </div>
          </form>
          <ActionButton action={sendTestEmail}>{t.integrations.sendTest}</ActionButton>

          <div className="border-t pt-4">
            <h3 className="mb-1 text-sm font-semibold">{t.integrations.inboundTitle}</h3>
            <p className="mb-2 text-sm text-muted-foreground">{t.integrations.inboundHelp}</p>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-xs uppercase text-muted-foreground">{t.integrations.inboundUrl}</dt>
                <dd><code dir="ltr" className="break-all rounded bg-secondary px-2 py-1 text-xs" data-testid="inbound-url">POST {base}/api/inbound/email</code></dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted-foreground">{t.integrations.inboundToken}</dt>
                <dd>{inboundToken ? <code dir="ltr" className="break-all rounded bg-secondary px-2 py-1 text-xs" data-testid="inbound-token">{inboundToken}</code> : "—"}</dd>
              </div>
            </dl>
            <div className="mt-2">
              <ActionButton action={regenerateInboundToken}>{t.integrations.regenerate}</ActionButton>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t.integrations.whatsappTitle}</CardTitle>
          <p className="text-sm text-muted-foreground">{t.integrations.whatsappHelp}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action={saveWhatsAppConfig} className="grid gap-3 sm:grid-cols-2" data-testid="wa-form">
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input type="checkbox" name="enabled" defaultChecked={wa.enabled} className="h-4 w-4 accent-[hsl(var(--coral))]" />
              {t.integrations.enabled}
            </label>
            <label className="space-y-1 text-sm">{t.integrations.phoneNumberId}<Input name="phoneNumberId" dir="ltr" defaultValue={wa.phoneNumberId} /></label>
            <label className="space-y-1 text-sm">{t.integrations.defaultCountry}<Input name="defaultCountry" dir="ltr" defaultValue={wa.defaultCountry} /></label>
            <label className="space-y-1 text-sm">{t.integrations.accessToken}<Input name="accessToken" type="password" autoComplete="new-password" placeholder={wa.accessToken ? t.integrations.passwordKeep : ""} /></label>
            <label className="space-y-1 text-sm">{t.integrations.appSecret}<Input name="appSecret" type="password" autoComplete="new-password" placeholder={wa.appSecret ? t.integrations.passwordKeep : ""} /></label>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input type="checkbox" name="autoCreate" defaultChecked={wa.autoCreate} className="h-4 w-4 accent-[hsl(var(--coral))]" />
              {t.integrations.autoCreate}
            </label>
            <label className="space-y-1 text-sm">
              {t.integrations.defaultOwner}
              <Select name="defaultOwnerId" defaultValue={wa.defaultOwnerId}>
                <option value="">—</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </Select>
            </label>
            <div className="flex gap-2 sm:col-span-2">
              <Button size="sm">{t.integrations.save}</Button>
            </div>
          </form>
          <ActionButton action={checkWhatsApp}>{t.integrations.sendTestWa}</ActionButton>
          <dl className="space-y-2 border-t pt-4 text-sm">
            <div>
              <dt className="text-xs uppercase text-muted-foreground">{t.integrations.webhookUrl}</dt>
              <dd><code dir="ltr" className="break-all rounded bg-secondary px-2 py-1 text-xs" data-testid="wa-callback">{base}/api/webhooks/whatsapp</code></dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-muted-foreground">{t.integrations.verifyToken}</dt>
              <dd>{wa.verifyToken ? <code dir="ltr" className="break-all rounded bg-secondary px-2 py-1 text-xs" data-testid="wa-verify">{wa.verifyToken}</code> : "—"}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </>
  );
}
