import { requireAccess } from "@/core/auth/session";
import { decryptSecret } from "@/core/crypto";
import { getEmailSettings } from "@/core/email";
import { strParam } from "@/core/forms";
import { getT } from "@/core/i18n/server";
import { checkWhatsApp, regenerateInboundToken, saveEmailConfig, saveWhatsAppConfig, sendTestEmail } from "@/modules/integrations/actions";
import { getWhatsAppSettings } from "@/core/whatsapp";
import { db } from "@/core/db";
import { Select } from "@/components/ui/input";
import { addMailbox, deleteMailbox, syncMailboxNow, toggleMailbox } from "@/modules/mailsync/actions";
import { ENCRYPTIONS } from "@/core/mailsync";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
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
  const mailboxes = await db.mailbox.findMany({ include: { owner: { select: { name: true } } }, orderBy: { createdAt: "asc" } });
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

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">{t.integrations.mailbox.title}</CardTitle>
          <p className="text-sm text-muted-foreground">{t.integrations.mailbox.help}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Table>
            <THead>
              <TR>
                <TH>{t.integrations.mailbox.name}</TH>
                <TH className="hidden sm:table-cell">{t.integrations.mailbox.owner}</TH>
                <TH>{t.integrations.mailbox.lastSync}</TH>
                <TH />
              </TR>
            </THead>
            <TBody>
              {mailboxes.map((m) => {
                const r = m.lastResult ? (JSON.parse(m.lastResult) as { imported: number; scanned: number }) : null;
                return (
                  <TR key={m.id} data-testid="mailbox-row">
                    <TD>
                      <div className="font-medium">{m.name}</div>
                      <div dir="ltr" className="text-xs text-muted-foreground">{m.username}@{m.host}</div>
                      {!m.enabled && <div className="text-xs text-muted-foreground">{t.integrations.mailbox.paused}</div>}
                    </TD>
                    <TD className="hidden sm:table-cell">{m.owner?.name ?? t.integrations.mailbox.shared}</TD>
                    <TD className="text-xs">
                      {m.lastSyncAt ? t.dateTime(m.lastSyncAt) : t.integrations.mailbox.never}
                      {m.lastError ? <div className="text-destructive" data-testid="mailbox-error">{m.lastError}</div> : r ? <div className="text-muted-foreground" data-testid="mailbox-result">{t.tpl(t.integrations.mailbox.lastResult, { imported: r.imported, scanned: r.scanned })}</div> : null}
                    </TD>
                    <TD>
                      <div className="flex flex-wrap gap-1">
                        <ActionButton action={syncMailboxNow.bind(null, m.id)}>{t.integrations.mailbox.syncNow}</ActionButton>
                        <ActionButton action={toggleMailbox.bind(null, m.id)}>{m.enabled ? t.integrations.mailbox.disable : t.integrations.mailbox.enable}</ActionButton>
                        <ActionButton action={deleteMailbox.bind(null, m.id)} confirmText={t.common.confirmDelete} className="text-destructive">{t.common.delete}</ActionButton>
                      </div>
                    </TD>
                  </TR>
                );
              })}
              {mailboxes.length === 0 && (
                <TR>
                  <TD colSpan={4} className="py-6 text-center text-muted-foreground">{t.integrations.mailbox.none}</TD>
                </TR>
              )}
            </TBody>
          </Table>
          <form action={addMailbox} className="grid gap-3 border-t pt-4 sm:grid-cols-3" data-testid="mailbox-form">
            <label className="space-y-1 text-sm">{t.integrations.mailbox.name}<Input name="name" required /></label>
            <label className="space-y-1 text-sm">{t.integrations.mailbox.host}<Input name="host" dir="ltr" placeholder="imap.example.com" required /></label>
            <label className="space-y-1 text-sm">{t.integrations.mailbox.port}<Input name="port" type="number" defaultValue={993} required /></label>
            <label className="space-y-1 text-sm">
              {t.integrations.mailbox.encryption}
              <Select name="encryption" defaultValue="TLS">
                {ENCRYPTIONS.map((e) => (
                  <option key={e} value={e}>{t.integrations.mailbox.encryptions[e]}</option>
                ))}
              </Select>
            </label>
            <label className="space-y-1 text-sm">{t.integrations.mailbox.username}<Input name="username" dir="ltr" autoComplete="off" required /></label>
            <label className="space-y-1 text-sm">{t.integrations.mailbox.password}<Input name="password" type="password" autoComplete="new-password" required /></label>
            <label className="space-y-1 text-sm">{t.integrations.mailbox.folders}<Input name="folders" dir="ltr" defaultValue="INBOX,[sent]" /><span className="text-xs text-muted-foreground">{t.integrations.mailbox.foldersHelp}</span></label>
            <label className="space-y-1 text-sm">
              {t.integrations.mailbox.owner}
              <Select name="ownerId" defaultValue="">
                <option value="">{t.integrations.mailbox.shared}</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </Select>
            </label>
            <label className="space-y-1 text-sm">{t.integrations.mailbox.lookback}<Input name="lookbackDays" type="number" min={1} max={365} defaultValue={30} /></label>
            <label className="flex items-center gap-2 text-sm sm:col-span-3">
              <input type="checkbox" name="enabled" defaultChecked className="h-4 w-4 accent-[hsl(var(--coral))]" />
              {t.integrations.mailbox.autoSync}
            </label>
            <div className="sm:col-span-3">
              <Button size="sm">{t.integrations.mailbox.add}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
