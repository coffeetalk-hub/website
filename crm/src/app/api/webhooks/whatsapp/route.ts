import { createHmac, timingSafeEqual } from "node:crypto";
import { db } from "@/core/db";
import { decryptSecret } from "@/core/crypto";
import { logAudit } from "@/core/audit";
import { getWhatsAppSettings, normalizePhone } from "@/core/whatsapp";

// Meta WhatsApp Cloud API webhook.
//  GET  → subscribe handshake (hub.mode / hub.verify_token / hub.challenge)
//  POST → incoming messages and delivery statuses, authenticated by X-Hub-Signature-256 (HMAC-SHA256 of the raw body with the app secret)
// Always answers 200 for authentic requests (Meta retries aggressively on anything else).
const text = (b: string, status: number) => new Response(b, { status, headers: { "Content-Type": "text/plain", "Cache-Control": "no-store" } });
const eq = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
const ORDER = ["sent", "delivered", "read"];

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const s = await getWhatsAppSettings();
  const ok = q.get("hub.mode") === "subscribe" && !!s.verifyToken && eq(q.get("hub.verify_token") ?? "", s.verifyToken);
  return ok ? text(q.get("hub.challenge") ?? "", 200) : text("forbidden", 403);
}

type Msg = { id: string; from: string; timestamp?: string; type: string; text?: { body: string }; image?: { caption?: string }; document?: { caption?: string; filename?: string }; button?: { text?: string }; interactive?: { button_reply?: { title?: string }; list_reply?: { title?: string } }; location?: { name?: string } };
type Status = { id: string; status: string; errors?: { title?: string; message?: string }[] };
type Payload = { entry?: { changes?: { value?: { messages?: Msg[]; statuses?: Status[]; contacts?: { wa_id: string; profile?: { name?: string } }[] } }[] }[] };

function bodyOf(m: Msg) {
  switch (m.type) {
    case "text": return m.text?.body ?? "";
    case "image": return `[Image]${m.image?.caption ? " " + m.image.caption : ""}`;
    case "document": return `[Document ${m.document?.filename ?? ""}]${m.document?.caption ? " " + m.document.caption : ""}`.trim();
    case "audio": return "[Voice message]";
    case "video": return "[Video]";
    case "sticker": return "[Sticker]";
    case "location": return `[Location${m.location?.name ? " " + m.location.name : ""}]`;
    case "button": return m.button?.text ?? "[Button]";
    case "interactive": return m.interactive?.button_reply?.title ?? m.interactive?.list_reply?.title ?? "[Interactive reply]";
    default: return `[${m.type}]`;
  }
}

export async function POST(req: Request) {
  const s = await getWhatsAppSettings();
  const secret = s.appSecret ? decryptSecret(s.appSecret) : null;
  const raw = await req.text();
  if (raw.length > 2_000_000) return text("too large", 413);
  const given = (req.headers.get("x-hub-signature-256") ?? "").replace(/^sha256=/, "");
  // no app secret configured = we cannot authenticate the sender, so we refuse rather than trust anyone
  if (!secret || !given || !eq(given, createHmac("sha256", secret).update(raw).digest("hex"))) return text("invalid signature", 401);
  if (!s.enabled) return text("ok", 200);

  let payload: Payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    return text("ok", 200);
  }

  const phones = await db.contact.findMany({ where: { phone: { not: null } }, select: { id: true, phone: true, ownerId: true, companyId: true } });
  const find = (waId: string) => phones.find((c) => normalizePhone(c.phone!, s.defaultCountry) === waId);

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const v = change.value ?? {};
      const names = new Map((v.contacts ?? []).map((c) => [c.wa_id, c.profile?.name]));

      for (const m of v.messages ?? []) {
        const externalId = `wa:${m.id}`;
        if (await db.activity.findUnique({ where: { externalId } })) continue; // Meta redelivers: stay idempotent
        let contact = find(m.from);
        if (!contact && s.autoCreate) {
          const owner = s.defaultOwnerId ? await db.user.findFirst({ where: { id: s.defaultOwnerId, active: true } }) : null;
          const ownerId = owner?.id ?? (await db.user.findFirst({ where: { role: "ADMIN", active: true }, orderBy: { createdAt: "asc" } }))?.id;
          if (ownerId) {
            const [first, ...rest] = (names.get(m.from) ?? "WhatsApp").split(" ");
            const created = await db.contact.create({ data: { firstName: first || "WhatsApp", lastName: rest.join(" ") || m.from, phone: `+${m.from}`, source: "WhatsApp", ownerId } });
            await logAudit(null, "Contact", created.id, "CREATE", { name: `${created.firstName} ${created.lastName}`, via: "whatsapp" });
            contact = { id: created.id, phone: created.phone, ownerId, companyId: null };
            phones.push(contact);
          }
        }
        if (!contact) continue; // unknown number and auto-create is off: ignore
        const body = bodyOf(m);
        const at = m.timestamp ? new Date(Number(m.timestamp) * 1000) : new Date();
        const a = await db.activity.create({
          data: {
            type: "WHATSAPP",
            subject: body.split("\n")[0].slice(0, 80) || "WhatsApp",
            body,
            completedAt: at,
            createdAt: at,
            assigneeId: contact.ownerId,
            creatorId: contact.ownerId,
            contactId: contact.id,
            companyId: contact.companyId,
            externalId,
            meta: { channel: "whatsapp", direction: "in", from: m.from, type: m.type },
          },
        });
        await logAudit(null, "Activity", a.id, "CREATE", { type: "WHATSAPP", direction: "in" });
      }

      for (const st of v.statuses ?? []) {
        const a = await db.activity.findUnique({ where: { externalId: `wa:${st.id}` } });
        if (!a) continue;
        const meta = (a.meta ?? {}) as Record<string, unknown>;
        const cur = String(meta.status ?? "sent");
        // delivery receipts can arrive out of order: only move forward (failed always wins)
        if (st.status !== "failed" && ORDER.indexOf(st.status) <= ORDER.indexOf(cur)) continue;
        await db.activity.update({ where: { id: a.id }, data: { meta: { ...meta, status: st.status, ...(st.status === "failed" ? { error: st.errors?.[0]?.title ?? "failed" } : {}) } as never } });
      }
    }
  }
  return text("ok", 200);
}
