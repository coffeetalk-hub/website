import { randomBytes } from "node:crypto";
import nodemailer from "nodemailer";
import { decryptSecret, encryptSecret } from "@/core/crypto";
import { getSetting, setSetting } from "@/core/settings";

export type EmailSettings = {
  enabled: boolean;
  host: string;
  port: number;
  secure: boolean; // true = implicit TLS (port 465); false = STARTTLS if offered
  user: string;
  pass: string; // encrypted at rest
  fromName: string;
  fromEmail: string;
  replyTo: string;
  inboundToken: string; // encrypted at rest; authenticates POST /api/inbound/email
};

export const DEFAULT_EMAIL: EmailSettings = { enabled: false, host: "", port: 587, secure: false, user: "", pass: "", fromName: "", fromEmail: "", replyTo: "", inboundToken: "" };

export const getEmailSettings = () => getSetting<EmailSettings>("email", DEFAULT_EMAIL);

export async function saveEmailSettings(patch: Partial<Omit<EmailSettings, "pass" | "inboundToken">> & { pass?: string }) {
  const cur = await getEmailSettings();
  // an empty password field means "keep the stored one"
  const pass = patch.pass ? encryptSecret(patch.pass) : cur.pass;
  // the inbound-email endpoint token is created the first time settings are saved
  const inboundToken = cur.inboundToken || encryptSecret(randomBytes(24).toString("base64url"));
  await setSetting("email", { ...cur, ...patch, pass, inboundToken });
}

export const isEmailReady = (s: EmailSettings) => s.enabled && !!s.host && !!s.fromEmail;

function transport(s: EmailSettings) {
  return nodemailer.createTransport({
    host: s.host,
    port: s.port,
    secure: s.secure,
    ...(s.user ? { auth: { user: s.user, pass: s.pass ? (decryptSecret(s.pass) ?? "") : "" } } : {}),
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
}

/** Sends one message through the configured SMTP server. Throws a readable Error on failure. */
export async function sendEmail(m: { to: string; subject: string; text: string; replyTo?: string }) {
  const s = await getEmailSettings();
  if (!isEmailReady(s)) throw new Error("Email is not configured.");
  const info = await transport(s).sendMail({
    from: s.fromName ? { name: s.fromName, address: s.fromEmail } : s.fromEmail,
    to: m.to,
    subject: m.subject,
    text: m.text,
    replyTo: m.replyTo || s.replyTo || undefined,
  });
  return { messageId: String(info.messageId ?? "") };
}

export async function verifyEmailConnection(s: EmailSettings) {
  await transport(s).verify();
}
