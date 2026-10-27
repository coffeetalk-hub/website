"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/core/db";
import { requireUser } from "@/core/auth/session";
import { encryptSecret } from "@/core/crypto";
import { generateApiKey } from "@/core/api/keys";
import { assertCan } from "@/core/permissions";
import { logAudit } from "@/core/audit";
import { WEBHOOK_EVENTS, assertSafeWebhookUrl, newWebhookSecret, pingWebhook } from "@/core/webhooks";

async function admin() {
  const user = await requireUser();
  assertCan(user, "settings", "manage");
  return user;
}

export type SecretState = { error?: string; secret?: string };

export async function createApiKey(_prev: SecretState, fd: FormData): Promise<SecretState> {
  const user = await admin();
  const p = z.object({ name: z.string().trim().min(1).max(80), userId: z.string().min(1), scope: z.enum(["READ", "WRITE"]) }).safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: "Name, user and access are required." };
  const target = await db.user.findFirst({ where: { id: p.data.userId, active: true } });
  if (!target) return { error: "Unknown or disabled user." };
  const k = generateApiKey();
  const rec = await db.apiKey.create({ data: { name: p.data.name, prefix: k.prefix, hash: k.hash, userId: target.id, scope: p.data.scope } });
  await logAudit(user, "System", rec.id, "CREATE", { apiKey: p.data.name, actsAs: target.email, scope: p.data.scope });
  revalidatePath("/settings/api");
  return { secret: k.key };
}

export async function revokeApiKey(id: string) {
  const user = await admin();
  const k = await db.apiKey.update({ where: { id }, data: { revokedAt: new Date() } }).catch(() => null);
  if (k) await logAudit(user, "System", id, "UPDATE", { apiKey: k.name, revoked: true });
  revalidatePath("/settings/api");
  redirect("/settings/api");
}

export async function createWebhook(_prev: SecretState, fd: FormData): Promise<SecretState> {
  const user = await admin();
  const url = String(fd.get("url") ?? "").trim();
  try {
    await assertSafeWebhookUrl(url);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Invalid URL" };
  }
  const chosen = fd.getAll("events").map(String).filter((e) => (WEBHOOK_EVENTS as readonly string[]).includes(e));
  const events = fd.get("all") === "on" || chosen.length === 0 ? "*" : chosen.join(",");
  const secret = newWebhookSecret();
  const rec = await db.webhook.create({ data: { url, events, secret: encryptSecret(secret) } });
  await logAudit(user, "System", rec.id, "CREATE", { webhook: url, events });
  revalidatePath("/settings/api");
  return { secret };
}

export async function deleteWebhook(id: string) {
  const user = await admin();
  await db.webhook.delete({ where: { id } }).catch(() => null);
  await logAudit(user, "System", id, "DELETE", { webhook: true });
  revalidatePath("/settings/api");
  redirect("/settings/api");
}

export async function toggleWebhook(id: string) {
  await admin();
  const h = await db.webhook.findUnique({ where: { id } });
  if (h) await db.webhook.update({ where: { id }, data: { active: !h.active } });
  revalidatePath("/settings/api");
  redirect("/settings/api");
}

export async function testWebhook(id: string) {
  await admin();
  const d = await pingWebhook(id);
  revalidatePath("/settings/api");
  redirect(`/settings/api?test=${encodeURIComponent(d?.status === "SUCCESS" ? `OK (HTTP ${d.responseCode})` : (d?.error ?? "failed"))}`);
}
