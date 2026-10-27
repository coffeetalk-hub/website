import { ActionForm } from "@/components/forms/action-form";
import { getT } from "@/core/i18n/server";
import { getWhatsAppSettings, isWhatsAppReady } from "@/core/whatsapp";
import { sendContactWhatsApp } from "../actions";
import { WhatsAppFields } from "./whatsapp-fields";

/** "Send WhatsApp message" panel on a contact page (only shown once WhatsApp is configured and the contact has a phone). */
export async function ComposeWhatsApp({ contactId, phone }: { contactId: string; phone: string | null }) {
  const t = await getT();
  if (!isWhatsAppReady(await getWhatsAppSettings())) return null;
  return (
    <details className="mb-4 rounded-md border p-3" data-testid="compose-whatsapp">
      <summary className="cursor-pointer text-sm font-medium">💬 {t.whatsapp.compose}</summary>
      <div className="mt-3">
        {!phone ? (
          <p className="text-sm text-muted-foreground">{t.whatsapp.noPhone}</p>
        ) : (
          <ActionForm action={sendContactWhatsApp.bind(null, contactId)} submitLabel={t.whatsapp.send}>
            <p className="text-xs text-muted-foreground" dir="ltr">
              {t.whatsapp.to}: {phone}
            </p>
            <WhatsAppFields />
          </ActionForm>
        )}
      </div>
    </details>
  );
}
