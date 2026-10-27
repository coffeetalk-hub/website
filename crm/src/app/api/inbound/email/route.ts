import { timingSafeEqual } from "node:crypto";
import { db } from "@/core/db";
import { decryptSecret } from "@/core/crypto";
import { getEmailSettings } from "@/core/email";
import { logAudit } from "@/core/audit";
import { stripHtml } from "@/core/text";

// Incoming-email webhook. A mail provider / automation tool POSTs JSON here:
//   { "from": "Ann <ann@x.com>", "subject": "...", "text": "...", "messageId": "<id>", "date": "ISO" }
// Authenticated with the bearer token from Settings → Integrations. Only mail from known contacts is stored.
const MAX_BODY = 20_000;
const json = (b: unknown, status: number) => new Response(JSON.stringify(b), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

const safeEqual = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

export async function POST(req: Request) {
  const settings = await getEmailSettings();
  const token = settings.inboundToken ? decryptSecret(settings.inboundToken) : null;
  const given = (req.headers.get("authorization") ?? "").match(/^Bearer\s+(\S+)$/i)?.[1] ?? "";
  if (!token || !given || !safeEqual(given, token)) return json({ error: "unauthorized" }, 401);
  if (Number(req.headers.get("content-length") ?? 0) > 2_000_000) return json({ error: "payload_too_large" }, 413);

  let body: Record<string, unknown>;
  try {
    const parsed: unknown = await req.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return json({ error: "invalid_json" }, 400); // must be a JSON object
    body = parsed as Record<string, unknown>;
  } catch {
    return json({ error: "invalid_json" }, 400);
  }
  const fromRaw = String(body.from ?? "");
  const address = (fromRaw.match(/<([^>]+)>/)?.[1] ?? fromRaw).trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(address)) return json({ error: "invalid_from" }, 422);

  const messageId = body.messageId ? String(body.messageId).slice(0, 300) : null;
  const externalId = messageId ? `email:${messageId}` : null;
  if (externalId && (await db.activity.findUnique({ where: { externalId } }))) return json({ matched: true, duplicate: true }, 200);

  const candidates = await db.contact.findMany({ where: { email: { contains: address } } });
  const contact = candidates.find((c) => c.email?.toLowerCase() === address);
  if (!contact) return json({ matched: false }, 202);

  const text = (typeof body.text === "string" && body.text.trim() ? body.text : typeof body.html === "string" ? stripHtml(body.html) : "").slice(0, MAX_BODY);
  const when = body.date ? new Date(String(body.date)) : new Date();
  const at = Number.isNaN(+when) ? new Date() : when;
  const a = await db.activity.create({
    data: {
      type: "EMAIL",
      subject: String(body.subject ?? "(no subject)").slice(0, 300),
      body: text,
      completedAt: at,
      createdAt: at,
      assigneeId: contact.ownerId,
      creatorId: contact.ownerId,
      contactId: contact.id,
      companyId: contact.companyId,
      externalId,
      meta: { channel: "email", direction: "in", from: address },
    },
  });
  await logAudit(null, "Activity", a.id, "CREATE", { type: "EMAIL", direction: "in", from: address });
  return json({ matched: true, activityId: a.id }, 201);
}
