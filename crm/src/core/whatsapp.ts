import { randomBytes } from "node:crypto";
import { decryptSecret, encryptSecret } from "@/core/crypto";
import { getSetting, setSetting } from "@/core/settings";

export type WhatsAppSettings = {
  enabled: boolean;
  phoneNumberId: string;
  accessToken: string; // encrypted at rest
  appSecret: string; // encrypted at rest; verifies X-Hub-Signature-256 on incoming webhooks
  verifyToken: string; // shared with Meta during the webhook subscribe handshake
  defaultCountry: string; // calling code used for numbers saved without one, e.g. "966"
  autoCreate: boolean; // create a contact when an unknown number writes first
  defaultOwnerId: string;
};

export const DEFAULT_WA: WhatsAppSettings = { enabled: false, phoneNumberId: "", accessToken: "", appSecret: "", verifyToken: "", defaultCountry: "966", autoCreate: false, defaultOwnerId: "" };

export const getWhatsAppSettings = () => getSetting<WhatsAppSettings>("whatsapp", DEFAULT_WA);
export const isWhatsAppReady = (s: WhatsAppSettings) => s.enabled && !!s.phoneNumberId && !!s.accessToken;

export async function saveWhatsAppSettings(patch: Partial<Omit<WhatsAppSettings, "accessToken" | "appSecret">> & { accessToken?: string; appSecret?: string }) {
  const cur = await getWhatsAppSettings();
  await setSetting("whatsapp", {
    ...cur,
    ...patch,
    // blank secret fields keep the stored values
    accessToken: patch.accessToken ? encryptSecret(patch.accessToken) : cur.accessToken,
    appSecret: patch.appSecret ? encryptSecret(patch.appSecret) : cur.appSecret,
    verifyToken: cur.verifyToken || randomBytes(16).toString("hex"),
  });
}

/** Meta Graph API base. Deployment-level (env), not editable in the UI, so admins can't point it at internal hosts. */
const apiBase = () => process.env.WHATSAPP_API_BASE ?? "https://graph.facebook.com/v21.0";

/** Phone number as WhatsApp ids it: digits only, with country code, no "+". */
export function normalizePhone(raw: string, defaultCountry = "966") {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  else if (d.startsWith("0")) d = defaultCountry + d.slice(1);
  else if (d.length <= 9) d = defaultCountry + d; // local number without country code (e.g. 5xxxxxxxx)
  return d;
}
export const isPlausiblePhone = (digits: string) => digits.length >= 8 && digits.length <= 15;

async function call(s: WhatsAppSettings, path: string, init: RequestInit & { json?: unknown } = {}) {
  const token = decryptSecret(s.accessToken);
  if (!token) throw new Error("WhatsApp access token is missing. Re-enter it in Settings → Integrations.");
  const res = await fetch(`${apiBase()}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, ...(init.json ? { "Content-Type": "application/json" } : {}) },
    body: init.json ? JSON.stringify(init.json) : undefined,
    signal: AbortSignal.timeout(15_000),
  });
  const data = (await res.json().catch(() => ({}))) as { error?: { message?: string; code?: number }; messages?: { id: string }[]; verified_name?: string; display_phone_number?: string };
  if (!res.ok) throw new Error(data.error?.message ?? `HTTP ${res.status}`);
  return data;
}

export async function sendWhatsAppText(s: WhatsAppSettings, to: string, body: string) {
  const d = await call(s, `/${s.phoneNumberId}/messages`, { method: "POST", json: { messaging_product: "whatsapp", to, type: "text", text: { body, preview_url: false } } });
  return d.messages?.[0]?.id ?? null;
}

export async function sendWhatsAppTemplate(s: WhatsAppSettings, to: string, name: string, language: string, params: string[]) {
  const d = await call(s, `/${s.phoneNumberId}/messages`, {
    method: "POST",
    json: {
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: { name, language: { code: language }, ...(params.length ? { components: [{ type: "body", parameters: params.map((text) => ({ type: "text", text })) }] } : {}) },
    },
  });
  return d.messages?.[0]?.id ?? null;
}

export async function checkWhatsAppConnection(s: WhatsAppSettings) {
  const d = await call(s, `/${s.phoneNumberId}?fields=verified_name,display_phone_number`);
  return d.verified_name || d.display_phone_number || s.phoneNumberId;
}
