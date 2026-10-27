"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/core/db";
import { requireUser } from "@/core/auth/session";
import { encryptSecret } from "@/core/crypto";
import { formToObject } from "@/core/forms";
import { getT } from "@/core/i18n/server";
import { assertCan } from "@/core/permissions";
import { logAudit } from "@/core/audit";
import { ENCRYPTIONS, describeMailError, syncMailbox, testMailboxConnection } from "@/core/mailsync";

async function admin() {
  const user = await requireUser();
  assertCan(user, "settings", "manage");
  return { user, t: await getT() };
}

function done(kind: "ok" | "error", msg: string): never {
  revalidatePath("/settings/integrations");
  redirect(`/settings/integrations?${kind}=${encodeURIComponent(msg)}`);
}

const schema = z.object({
  name: z.string().min(1).max(80),
  host: z.string().min(1).max(200),
  port: z.coerce.number().int().min(1).max(65535),
  encryption: z.enum(ENCRYPTIONS),
  username: z.string().min(1).max(200),
  password: z.string().min(1).max(500),
  folders: z.string().max(300).optional(),
  ownerId: z.string().max(60).optional(),
  lookbackDays: z.coerce.number().int().min(1).max(365),
});

/** Validates the connection first; a mailbox that can't log in is never saved. */
export async function addMailbox(fd: FormData) {
  const { user, t } = await admin();
  const p = schema.safeParse(formToObject(fd));
  if (!p.success) done("error", t.errors.pleaseFix);
  try {
    await testMailboxConnection({ host: p.data.host, port: p.data.port, encryption: p.data.encryption, username: p.data.username, password: p.data.password });
  } catch (e) {
    done("error", t.tpl(t.integrations.mailbox.testFailed, { error: describeMailError(e) }));
  }
  const owner = p.data.ownerId ? await db.user.findFirst({ where: { id: p.data.ownerId, active: true } }) : null;
  const rec = await db.mailbox.create({
    data: {
      name: p.data.name,
      host: p.data.host,
      port: p.data.port,
      encryption: p.data.encryption,
      username: p.data.username,
      password: encryptSecret(p.data.password),
      folders: p.data.folders?.trim() || "INBOX,[sent]",
      ownerId: owner?.id ?? null,
      lookbackDays: p.data.lookbackDays,
      enabled: fd.get("enabled") === "on",
    },
  });
  await logAudit(user, "System", rec.id, "CREATE", { mailbox: rec.name, host: rec.host, owner: owner?.email ?? "shared" });
  done("ok", t.tpl(t.integrations.mailbox.added, { name: rec.name }));
}

export async function syncMailboxNow(id: string) {
  const { t } = await admin();
  const r = await syncMailbox(id);
  if (r.error) done("error", t.tpl(t.integrations.mailbox.syncFailed, { error: r.error }));
  done("ok", t.tpl(t.integrations.mailbox.result, { imported: r.imported, skipped: r.skipped, scanned: r.scanned }));
}

export async function toggleMailbox(id: string) {
  await admin();
  const m = await db.mailbox.findUnique({ where: { id } });
  if (m) await db.mailbox.update({ where: { id }, data: { enabled: !m.enabled } });
  revalidatePath("/settings/integrations");
  redirect("/settings/integrations");
}

/** Removes the connection only; mail already imported stays on the timelines. */
export async function deleteMailbox(id: string) {
  const { user } = await admin();
  const m = await db.mailbox.delete({ where: { id } }).catch(() => null);
  if (m) await logAudit(user, "System", id, "DELETE", { mailbox: m.name });
  revalidatePath("/settings/integrations");
  redirect("/settings/integrations");
}
