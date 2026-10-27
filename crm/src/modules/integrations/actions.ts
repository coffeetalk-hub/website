"use server";
import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/core/auth/session";
import { encryptSecret } from "@/core/crypto";
import { getEmailSettings, saveEmailSettings, sendEmail, verifyEmailConnection } from "@/core/email";
import { getT } from "@/core/i18n/server";
import { assertCan } from "@/core/permissions";
import { logAudit } from "@/core/audit";
import { formToObject } from "@/core/forms";
import { setSetting } from "@/core/settings";
import { checkWhatsAppConnection, getWhatsAppSettings, saveWhatsAppSettings } from "@/core/whatsapp";

async function admin() {
  const user = await requireUser();
  assertCan(user, "settings", "manage");
  return { user, t: await getT() };
}

function done(kind: "ok" | "error", msg: string): never {
  revalidatePath("/settings/integrations");
  redirect(`/settings/integrations?${kind}=${encodeURIComponent(msg)}`);
}

// ───────────── email ─────────────
const emailSchema = z.object({
  host: z.string().max(200).optional(),
  port: z.coerce.number().int().min(1).max(65535),
  user: z.string().max(200).optional(),
  pass: z.string().max(500).optional(),
  fromName: z.string().max(100).optional(),
  fromEmail: z.string().email().max(200).or(z.literal("")).optional(),
  replyTo: z.string().email().max(200).or(z.literal("")).optional(),
});

export async function saveEmailConfig(fd: FormData) {
  const { user, t } = await admin();
  const p = emailSchema.safeParse(formToObject(fd));
  if (!p.success) done("error", t.errors.invalidEmail);
  const enabled = fd.get("enabled") === "on";
  if (enabled && (!p.data.host || !p.data.fromEmail)) done("error", t.errors.required);
  await saveEmailSettings({
    enabled,
    host: p.data.host ?? "",
    port: p.data.port,
    secure: fd.get("secure") === "on",
    user: p.data.user ?? "",
    fromName: p.data.fromName ?? "",
    fromEmail: p.data.fromEmail ?? "",
    replyTo: p.data.replyTo ?? "",
    ...(p.data.pass ? { pass: p.data.pass } : {}),
  });
  await logAudit(user, "System", "email-settings", "UPDATE", { email: "settings saved" });
  done("ok", t.integrations.ok);
}

export async function sendTestEmail() {
  const { user, t } = await admin();
  try {
    const s = await getEmailSettings();
    await verifyEmailConnection(s);
    await sendEmail({ to: user.email, subject: "CRM test email", text: "Your SMTP settings work. This message was sent from the CRM." });
    done("ok", t.tpl(t.integrations.testSent, { email: user.email }));
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e; // let redirect() through
    done("error", t.tpl(t.integrations.testFailed, { error: e instanceof Error ? e.message : "unknown" }));
  }
}

export async function regenerateInboundToken() {
  const { user, t } = await admin();
  const cur = await getEmailSettings();
  await setSetting("email", { ...cur, inboundToken: encryptSecret(randomBytes(24).toString("base64url")) });
  await logAudit(user, "System", "email-inbound-token", "UPDATE", { inboundToken: "regenerated" });
  done("ok", t.integrations.ok);
}

// ───────────── WhatsApp ─────────────
const waSchema = z.object({
  phoneNumberId: z.string().max(60).optional(),
  accessToken: z.string().max(1000).optional(),
  appSecret: z.string().max(200).optional(),
  defaultCountry: z.string().regex(/^\d{1,4}$/),
  defaultOwnerId: z.string().max(60).optional(),
});

export async function saveWhatsAppConfig(fd: FormData) {
  const { user, t } = await admin();
  const p = waSchema.safeParse(formToObject(fd));
  if (!p.success) done("error", t.errors.pleaseFix);
  const enabled = fd.get("enabled") === "on";
  const cur = await getWhatsAppSettings();
  if (enabled && (!p.data.phoneNumberId || !(p.data.accessToken || cur.accessToken))) done("error", t.errors.required);
  await saveWhatsAppSettings({
    enabled,
    phoneNumberId: p.data.phoneNumberId ?? "",
    defaultCountry: p.data.defaultCountry,
    autoCreate: fd.get("autoCreate") === "on",
    defaultOwnerId: p.data.defaultOwnerId ?? "",
    ...(p.data.accessToken ? { accessToken: p.data.accessToken } : {}),
    ...(p.data.appSecret ? { appSecret: p.data.appSecret } : {}),
  });
  await logAudit(user, "System", "whatsapp-settings", "UPDATE", { whatsapp: "settings saved" });
  done("ok", t.integrations.ok);
}

export async function checkWhatsApp() {
  const { t } = await admin();
  try {
    const name = await checkWhatsAppConnection(await getWhatsAppSettings());
    done("ok", t.tpl(t.integrations.waOk, { name }));
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e;
    done("error", t.tpl(t.integrations.waFailed, { error: e instanceof Error ? e.message : "unknown" }));
  }
}
