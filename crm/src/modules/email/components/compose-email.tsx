import { ActionForm, Field } from "@/components/forms/action-form";
import { Input, Select, Textarea } from "@/components/ui/input";
import { getEmailSettings, isEmailReady } from "@/core/email";
import { getT } from "@/core/i18n/server";
import { sendContactEmail } from "../actions";

/** "Send email" panel on a contact page. Falls back to log-only when SMTP isn't configured. */
export async function ComposeEmail({ contactId, email }: { contactId: string; email: string | null }) {
  const t = await getT();
  const ready = isEmailReady(await getEmailSettings());
  return (
    <details className="mb-4 rounded-md border p-3" data-testid="compose-email">
      <summary className="cursor-pointer text-sm font-medium">✉ {t.email.compose}</summary>
      <div className="mt-3">
        {!ready && <p className="mb-3 text-xs text-muted-foreground">{t.email.notConfigured}</p>}
        <ActionForm action={sendContactEmail.bind(null, contactId)} submitLabel={t.email.send}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field name="to" label={t.email.to} required>
              <Input id="email-to" name="to" type="email" defaultValue={email ?? ""} />
            </Field>
            <Field name="mode" label={t.email.mode}>
              <Select id="email-mode" name="mode" defaultValue={ready ? "send" : "log"}>
                <option value="send">{t.email.modeSend}</option>
                <option value="log">{t.email.modeLog}</option>
              </Select>
            </Field>
            <div className="sm:col-span-2">
              <Field name="subject" label={t.email.subject} required>
                <Input id="email-subject" name="subject" />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field name="body" label={t.email.body} required>
                <Textarea id="email-body" name="body" rows={5} />
              </Field>
            </div>
          </div>
        </ActionForm>
      </div>
    </details>
  );
}
