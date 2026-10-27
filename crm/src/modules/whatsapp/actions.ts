"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/core/db";
import { requireUser } from "@/core/auth/session";
import { formToObject, toActionError, zodErrors, type ActionState } from "@/core/forms";
import { getT } from "@/core/i18n/server";
import { assertCan, assertOwns } from "@/core/permissions";
import { logAudit } from "@/core/audit";
import { getWhatsAppSettings, isPlausiblePhone, isWhatsAppReady, normalizePhone, sendWhatsAppTemplate, sendWhatsAppText } from "@/core/whatsapp";

const schema = z.object({
  mode: z.enum(["text", "template"]),
  message: z.string().max(4096).optional(),
  templateName: z.string().max(100).optional(),
  templateLang: z.string().max(10).optional(),
  templateParams: z.string().max(2000).optional(),
});

const MAX_PER_HOUR = 60;
const WINDOW_MS = 24 * 3600 * 1000;

export async function sendContactWhatsApp(contactId: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const t = await getT();
  try {
    const contact = await db.contact.findUnique({ where: { id: contactId } });
    if (!contact) return { error: t.errors.notFound };
    assertOwns(user, "contact", contact);
    assertCan(user, "activity", "create");
    const p = schema.safeParse(formToObject(fd));
    if (!p.success) return zodErrors(p.error, t);
    const s = await getWhatsAppSettings();
    if (!isWhatsAppReady(s)) return { error: t.whatsapp.notConfigured };
    if (!contact.phone) return { error: t.whatsapp.noPhone };
    const to = normalizePhone(contact.phone, s.defaultCountry);
    if (!isPlausiblePhone(to)) return { error: t.whatsapp.noPhone };

    if (p.data.mode === "text" && !p.data.message?.trim()) return { error: t.errors.pleaseFix, fieldErrors: { message: t.errors.required } };
    if (p.data.mode === "template" && !p.data.templateName?.trim()) return { error: t.errors.pleaseFix, fieldErrors: { templateName: t.errors.required } };

    const recent = await db.activity.count({ where: { type: "WHATSAPP", creatorId: user.id, createdAt: { gt: new Date(Date.now() - 3600_000) }, meta: { path: "$.direction", equals: "out" } } });
    if (recent >= MAX_PER_HOUR) return { error: t.email.rateLimited };

    // Meta rule: free text is only allowed within 24h of the customer's last message
    if (p.data.mode === "text") {
      const lastIn = await db.activity.findFirst({ where: { contactId, type: "WHATSAPP", meta: { path: "$.direction", equals: "in" } }, orderBy: { createdAt: "desc" } });
      if (!lastIn || Date.now() - lastIn.createdAt.getTime() > WINDOW_MS) return { error: t.whatsapp.outsideWindow };
    }

    let wamid: string | null;
    const params = (p.data.templateParams ?? "").split("\n").map((x) => x.trim()).filter(Boolean);
    try {
      wamid = p.data.mode === "text" ? await sendWhatsAppText(s, to, p.data.message!.trim()) : await sendWhatsAppTemplate(s, to, p.data.templateName!.trim(), p.data.templateLang?.trim() || "en", params);
    } catch (e) {
      return { error: `${t.whatsapp.sendFailed}: ${e instanceof Error ? e.message : ""}` };
    }
    const body = p.data.mode === "text" ? p.data.message!.trim() : [`Template: ${p.data.templateName}`, ...params].join("\n");
    const a = await db.activity.create({
      data: {
        type: "WHATSAPP",
        subject: body.split("\n")[0].slice(0, 80),
        body,
        completedAt: new Date(),
        assigneeId: user.id,
        creatorId: user.id,
        contactId: contact.id,
        companyId: contact.companyId,
        externalId: wamid ? `wa:${wamid}` : null,
        meta: { channel: "whatsapp", direction: "out", to, status: "sent", ...(p.data.mode === "template" ? { template: p.data.templateName } : {}) },
      },
    });
    await logAudit(user, "Activity", a.id, "CREATE", { type: "WHATSAPP", subject: a.subject });
  } catch (e) {
    return toActionError(e, t);
  }
  revalidatePath(`/contacts/${contactId}`);
  redirect(`/contacts/${contactId}`);
}
