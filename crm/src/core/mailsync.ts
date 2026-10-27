import { ImapFlow } from "imapflow";
import { simpleParser, type AddressObject } from "mailparser";
import type { Mailbox } from "@prisma/client";
import { db } from "@/core/db";
import { decryptSecret } from "@/core/crypto";
import { logAudit } from "@/core/audit";
import { assertPublicHost } from "@/core/netguard";
import { stripHtml } from "@/core/text";

// IMAP mailbox sync. Polls a connected mailbox read-only (never marks mail as read), tracks progress per folder by UID,
// and adds messages to/from known contacts to their timelines. Safe to run repeatedly and concurrently (DB lock).

export type SyncResult = { imported: number; skipped: number; scanned: number; error?: string };
type FolderState = { uidValidity: string; lastUid: number };
type ConnInfo = Pick<Mailbox, "host" | "port" | "encryption" | "username">;

const MAX_PER_RUN = 200; // messages processed per mailbox per run; the next run continues where this one stopped
const LOCK_MS = 10 * 60 * 1000;
const MAX_BODY = 20_000;

export const ENCRYPTIONS = ["TLS", "STARTTLS", "NONE"] as const;

/** Network policy for admin-supplied mail hosts (same SSRF idea as webhooks). */
export async function assertMailboxAllowed(host: string, encryption: string) {
  if (encryption === "NONE" && process.env.MAIL_ALLOW_PRIVATE !== "1") throw new Error("Unencrypted IMAP is not allowed. Use TLS or STARTTLS.");
  await assertPublicHost(host, "MAIL_ALLOW_PRIVATE");
}

function connect(m: ConnInfo, password: string) {
  const client = new ImapFlow({
    host: m.host,
    port: m.port,
    secure: m.encryption === "TLS",
    doSTARTTLS: m.encryption === "STARTTLS" ? true : m.encryption === "NONE" ? false : undefined,
    auth: { user: m.username, pass: password },
    logger: false,
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 60_000,
  });
  client.on("error", () => {}); // surfaced through the rejected promise instead of an unhandled event
  return client;
}

/** Turn library errors into a short, readable message (never includes credentials). */
export function describeMailError(e: unknown) {
  const x = e as { authenticationFailed?: boolean; responseText?: string; code?: string; message?: string };
  if (x?.authenticationFailed) return "Authentication failed. Check the username and password.";
  if (x?.code === "ECONNREFUSED") return "Connection refused. Check the host and port.";
  if (x?.code === "ENOTFOUND") return "Host not found.";
  if (x?.code === "ETIMEDOUT" || x?.code === "ESOCKETTIMEDOUT") return "The mail server did not respond in time.";
  return String(x?.responseText || x?.message || "Sync failed").slice(0, 300);
}

/** Connects and lists folders; used to validate settings before a mailbox is saved. */
export async function testMailboxConnection(m: ConnInfo & { password: string }) {
  await assertMailboxAllowed(m.host, m.encryption);
  const client = connect(m, m.password);
  await client.connect();
  try {
    return (await client.list()).map((f) => f.path);
  } finally {
    await client.logout().catch(() => {});
  }
}

type Folder = { path: string; sent: boolean };

async function resolveFolders(client: ImapFlow, spec: string): Promise<Folder[]> {
  const list = await client.list();
  const special = new Map(list.map((f) => [f.path, f.specialUse]));
  const out: Folder[] = [];
  for (const raw of spec.split(",").map((s) => s.trim()).filter(Boolean)) {
    if (raw.toLowerCase() === "[sent]") {
      const hit = list.find((f) => f.specialUse === "\\Sent") ?? list.find((f) => /^(sent|sent items|sent mail|inbox\.sent|\[gmail\]\/sent mail)$/i.test(f.path));
      if (hit) out.push({ path: hit.path, sent: true });
    } else if (special.has(raw)) {
      out.push({ path: raw, sent: special.get(raw) === "\\Sent" });
    }
  }
  return out;
}

const addresses = (f: AddressObject | AddressObject[] | undefined) =>
  (Array.isArray(f) ? f : f ? [f] : []).flatMap((a) => a.value.map((v) => v.address?.toLowerCase()).filter((x): x is string => !!x));

type ContactRow = { id: string; email: string | null; ownerId: string; companyId: string | null };

async function run(box: Mailbox, result: SyncResult) {
  await assertMailboxAllowed(box.host, box.encryption);
  const password = decryptSecret(box.password);
  if (!password) throw new Error("The saved password can't be decrypted. Re-enter it.");

  const byEmail = new Map<string, ContactRow[]>();
  for (const c of await db.contact.findMany({ where: { email: { not: null }, ...(box.ownerId ? { ownerId: box.ownerId } : {}) }, select: { id: true, email: true, ownerId: true, companyId: true } })) {
    const k = c.email!.toLowerCase();
    byEmail.set(k, [...(byEmail.get(k) ?? []), c]);
  }

  const state = { ...((box.state ?? {}) as Record<string, FolderState>) };
  const client = connect(box, password);
  await client.connect();
  try {
    let budget = MAX_PER_RUN;
    for (const folder of await resolveFolders(client, box.folders)) {
      if (budget <= 0) break;
      const lock = await client.getMailboxLock(folder.path, { readOnly: true }); // EXAMINE: nothing is marked as read
      try {
        const mb = client.mailbox as unknown as { uidValidity: bigint; uidNext: number };
        const uv = String(mb.uidValidity);
        const uidNext = mb.uidNext;
        let st = state[folder.path];
        let uids: number[];
        if (!st || st.uidValidity !== uv) {
          // first sync (or the server renumbered the folder): only look back `lookbackDays`
          st = { uidValidity: uv, lastUid: 0 };
          uids = (await client.search({ since: new Date(Date.now() - box.lookbackDays * 86400000) }, { uid: true })) || [];
        } else {
          uids = ((await client.search({ uid: `${st.lastUid + 1}:*` }, { uid: true })) || []).filter((u) => u > st!.lastUid);
        }
        uids.sort((a, b) => a - b);
        const batch = uids.slice(0, budget);
        budget -= batch.length;

        let maxUid = st.lastUid;
        if (batch.length) {
          for await (const msg of client.fetch(batch.join(","), { uid: true, source: { maxLength: 2_000_000 }, internalDate: true }, { uid: true })) {
            maxUid = Math.max(maxUid, msg.uid);
            result.scanned++;
            if (!msg.source) continue;
            const parsed = await simpleParser(msg.source);
            const messageId = (parsed.messageId ?? "").trim() || `imap:${box.id}:${folder.path}:${uv}:${msg.uid}`;
            const parties = folder.sent ? [...addresses(parsed.to), ...addresses(parsed.cc)] : addresses(parsed.from);
            const seen = new Set<string>();
            const when = (() => {
              const d = parsed.date ?? (msg.internalDate instanceof Date ? msg.internalDate : new Date());
              return d.getTime() > Date.now() ? new Date() : d;
            })();
            const body = (parsed.text?.trim() ? parsed.text : stripHtml(typeof parsed.html === "string" ? parsed.html : "")).slice(0, MAX_BODY);
            const attachments = parsed.attachments.map((a) => a.filename).filter((n): n is string => !!n).slice(0, 10);
            const auto = String(parsed.headers.get("auto-submitted") ?? "").toLowerCase();

            for (const addr of parties) {
              for (const c of byEmail.get(addr) ?? []) {
                if (seen.has(c.id)) continue;
                seen.add(c.id);
                // One timeline entry per contact per message, no matter which route (SMTP send, inbound webhook, mailbox) saw it first.
                const base = `email:${messageId}`.slice(0, 280);
                const exists = await db.activity.findFirst({ where: { contactId: c.id, externalId: { in: [base, `${base}#${c.id}`] } }, select: { id: true } });
                if (exists) {
                  result.skipped++;
                  continue;
                }
                const baseTaken = await db.activity.findUnique({ where: { externalId: base }, select: { id: true } });
                const owner = box.ownerId ?? c.ownerId;
                const a = await db.activity.create({
                  data: {
                    type: "EMAIL",
                    subject: (parsed.subject?.trim() || "(no subject)").slice(0, 300),
                    body,
                    completedAt: when,
                    createdAt: when,
                    assigneeId: owner,
                    creatorId: owner,
                    contactId: c.id,
                    companyId: c.companyId,
                    externalId: baseTaken ? `${base}#${c.id}` : base,
                    meta: { channel: "email", direction: folder.sent ? "out" : "in", [folder.sent ? "to" : "from"]: addr, via: "imap", mailbox: box.name, ...(attachments.length ? { attachments } : {}), ...(auto && auto !== "no" ? { auto: true } : {}) },
                  },
                });
                await logAudit(null, "Activity", a.id, "CREATE", { type: "EMAIL", via: "imap", direction: folder.sent ? "out" : "in" });
                result.imported++;
              }
            }
          }
        }
        // everything up to the folder's current end is handled (or deliberately ignored): don't look at it again
        state[folder.path] = { uidValidity: uv, lastUid: batch.length < uids.length ? maxUid : Math.max(maxUid, uidNext - 1) };
        await db.mailbox.update({ where: { id: box.id }, data: { state: state as never } });
      } finally {
        lock.release();
      }
    }
  } finally {
    await client.logout().catch(() => {});
  }
}

/** Runs one sync of one mailbox. Never throws; the outcome is returned and stored on the mailbox. */
export async function syncMailbox(id: string): Promise<SyncResult> {
  const claimed = await db.mailbox.updateMany({ where: { id, OR: [{ syncingSince: null }, { syncingSince: { lt: new Date(Date.now() - LOCK_MS) } }] }, data: { syncingSince: new Date() } });
  if (claimed.count === 0) return { imported: 0, skipped: 0, scanned: 0, error: "A sync is already running." };
  const box = await db.mailbox.findUnique({ where: { id } });
  if (!box) return { imported: 0, skipped: 0, scanned: 0, error: "Mailbox not found." };
  const result: SyncResult = { imported: 0, skipped: 0, scanned: 0 };
  try {
    await run(box, result);
  } catch (e) {
    result.error = describeMailError(e);
  }
  await db.mailbox
    .update({ where: { id }, data: { syncingSince: null, lastSyncAt: new Date(), lastError: result.error ?? null, lastResult: JSON.stringify({ imported: result.imported, skipped: result.skipped, scanned: result.scanned }) } })
    .catch(() => {}); // the mailbox may have been deleted while syncing
  return result;
}

export async function syncAllMailboxes() {
  for (const m of await db.mailbox.findMany({ where: { enabled: true }, select: { id: true } })) await syncMailbox(m.id);
}
