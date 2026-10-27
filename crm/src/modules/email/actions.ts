"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/core/db";
import { requireUser } from "@/core/auth/session";
import { getEmailSettings, isEmailReady, sendEmail } from "@/core/email";
import { formToObject, toActionError, zodErrors, type ActionState } from "@/core/forms";
import { getT } from "@/core/i18n/server";
import { assertCan, assertOwns } from "@/core/permissions";
import { logAudit } from "@/core/audit";

const schema = z.object({
  to: z.string().email("err:invalidEmail"),
  subject: z.string().min(1, "err:subjectRequired").max(300),
  body: z.string().min(1, "err:required").max(20000),
  mode: z.enum(["send", "log"]),
});

const MAX_PER_HOUR = 30;

/** Send (or just log) an email to a contact and record it on their timeline. */
export async function sendContactEmail(contactId: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const t = await getT();
  try {
    const contact = await db.contact.findUnique({ where: { id: contactId } });
    if (!contact) return { error: t.errors.notFound };
    assertOwns(user, "contact", contact);
    assertCan(user, "activity", "create");
    const p = schema.safeParse(formToObject(fd));
    if (!p.success) return zodErrors(p.error, t);

    let messageId: string | null = null;
    if (p.data.mode === "send") {
      if (!isEmailReady(await getEmailSettings())) return { error: t.email.notConfigured };
      const recent = await db.activity.count({ where: { type: "EMAIL", creatorId: user.id, createdAt: { gt: new Date(Date.now() - 3600_000) } } });
      if (recent >= MAX_PER_HOUR) return { error: t.email.rateLimited };
      try {
        messageId = (await sendEmail({ to: p.data.to, subject: p.data.subject, text: p.data.body })).messageId || null;
      } catch (e) {
        return { error: `${t.email.sendFailed}: ${e instanceof Error ? e.message : ""}` };
      }
    }
    const a = await db.activity.create({
      data: {
        type: "EMAIL",
        subject: p.data.subject,
        body: p.data.body,
        completedAt: new Date(),
        assigneeId: user.id,
        creatorId: user.id,
        contactId: contact.id,
        companyId: contact.companyId,
        externalId: messageId ? `email:${messageId}` : null,
        meta: { channel: "email", direction: "out", to: p.data.to, sent: p.data.mode === "send" },
      },
    });
    await logAudit(user, "Activity", a.id, "CREATE", { subject: a.subject, type: "EMAIL", sent: p.data.mode === "send" });
  } catch (e) {
    return toActionError(e, t);
  }
  revalidatePath(`/contacts/${contactId}`);
  redirect(`/contacts/${contactId}`);
}
