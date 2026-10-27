import { createHmac, randomBytes } from "node:crypto";
import dns from "node:dns/promises";
import net from "node:net";
import { db } from "@/core/db";
import { decryptSecret } from "@/core/crypto";

import { WEBHOOK_EVENTS } from "@/core/webhooks-events";
export { WEBHOOK_EVENTS };

const PREFIX: Record<string, string> = { Contact: "contact", Company: "company", Deal: "deal", Activity: "task", Quote: "quote", Invoice: "invoice" };
const VERB: Record<string, string> = { CREATE: "created", UPDATE: "updated", DELETE: "deleted", MOVE: "moved" };

export const newWebhookSecret = () => "whsec_" + randomBytes(24).toString("base64url");

// ── SSRF guard: webhooks may only call public http(s) hosts unless explicitly allowed (dev/tests) ──
function isPrivateIp(ip: string) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127);
  }
  const v = ip.toLowerCase();
  return v === "::1" || v === "::" || v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80") || v.startsWith("::ffff:127.") || v.startsWith("::ffff:10.") || v.startsWith("::ffff:192.168.");
}

export async function assertSafeWebhookUrl(raw: string) {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    throw new Error("Invalid URL");
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") throw new Error("Only http(s) URLs are allowed");
  if (process.env.WEBHOOK_ALLOW_PRIVATE === "1") return u;
  if (process.env.NODE_ENV === "production" && u.protocol !== "https:") throw new Error("Webhook URLs must use https");
  const host = u.hostname.replace(/^\[|\]$/g, "");
  const addrs = net.isIP(host) ? [{ address: host }] : await dns.lookup(host, { all: true });
  if (addrs.some((a) => isPrivateIp(a.address))) throw new Error("Webhook URL points to a private or internal address");
  return u;
}

export const sign = (secret: string, timestamp: number, body: string) => createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");

const DELAYS = [0, 2_000, 10_000];

async function attempt(deliveryId: string, n: number, body: string, event: string, retry = true) {
  const d = await db.webhookDelivery.findUnique({ where: { id: deliveryId }, include: { webhook: true } });
  if (!d || !d.webhook.active) return;
  const secret = decryptSecret(d.webhook.secret) ?? "";
  const ts = Math.floor(Date.now() / 1000);
  let code: number | null = null;
  let error: string | null = null;
  try {
    await assertSafeWebhookUrl(d.webhook.url);
    const res = await fetch(d.webhook.url, {
      method: "POST",
      redirect: "manual", // never follow redirects (could lead to internal hosts)
      signal: AbortSignal.timeout(5000),
      headers: { "Content-Type": "application/json", "User-Agent": "CRM-Webhooks/1.0", "X-CRM-Event": event, "X-CRM-Delivery": deliveryId, "X-CRM-Signature": `t=${ts},v1=${sign(secret, ts, body)}` },
      body,
    });
    code = res.status;
    if (res.status < 200 || res.status >= 300) error = `HTTP ${res.status}`;
  } catch (e) {
    error = e instanceof Error ? e.message : "request failed";
  }
  const ok = !error;
  const last = !retry || n + 1 >= DELAYS.length;
  await db.webhookDelivery.update({ where: { id: deliveryId }, data: { attempts: n + 1, responseCode: code, error, status: ok ? "SUCCESS" : last ? "FAILED" : "PENDING", lastAttemptAt: new Date() } });
  if (!ok && !last) setTimeout(() => void attempt(deliveryId, n + 1, body, event).catch(() => {}), DELAYS[n + 1]);
}

/** Sends a `ping` event right now (no retries) so an admin can check the endpoint; resolves with the outcome. */
export async function pingWebhook(webhookId: string) {
  const delivery = await db.webhookDelivery.create({ data: { webhookId, event: "ping" } });
  const body = JSON.stringify({ id: delivery.id, event: "ping", createdAt: new Date().toISOString(), data: { message: "Hello from the CRM" } });
  await attempt(delivery.id, 0, body, "ping", false);
  return db.webhookDelivery.findUnique({ where: { id: delivery.id } });
}

/** Queue a delivery to every active webhook subscribed to `event`. Never throws. */
export async function emitWebhook(event: string, data: Record<string, unknown>) {
  try {
    const hooks = await db.webhook.findMany({ where: { active: true } });
    for (const h of hooks) {
      const subscribed = h.events === "*" || h.events.split(",").includes(event);
      if (!subscribed) continue;
      const delivery = await db.webhookDelivery.create({ data: { webhookId: h.id, event } });
      const body = JSON.stringify({ id: delivery.id, event, createdAt: new Date().toISOString(), data });
      void attempt(delivery.id, 0, body, event).catch(() => {});
    }
  } catch (e) {
    console.error("webhook dispatch failed", e);
  }
}

/** Derive webhook events from an audit entry, e.g. Quote UPDATE {status:{to:"ACCEPTED"}} → quote.updated + quote.accepted. */
export async function dispatchFromAudit(entity: string, recordId: string, action: string, changes: unknown, actorId: string | null) {
  const prefix = PREFIX[entity];
  const verb = VERB[action];
  if (!prefix || !verb) return;
  const data = { entity: prefix, recordId, action: verb, changes: changes ?? null, actorId };
  await emitWebhook(`${prefix}.${verb}`, data);
  const to = (changes as { status?: { to?: unknown } } | null)?.status?.to;
  if (typeof to === "string") await emitWebhook(`${prefix}.${to.toLowerCase()}`, data);
}
