import http from "node:http";
import type { AddressInfo } from "node:net";
import { createHmac } from "node:crypto";
import { test, expect, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { reseed, signedIn, USERS } from "./helpers";

test.describe.configure({ mode: "serial" });
test.beforeAll(reseed);
const db = new PrismaClient();
test.afterAll(() => db.$disconnect());

const TOKEN = "wa-token-123";
const SECRET = "app-secret-xyz";
const PHONE_ID = "1100000001";

// ── a tiny stand-in for Meta's Graph API (the server is started with WHATSAPP_API_BASE pointing here) ──
type Sent = { auth: string; body: Record<string, unknown> };
const graph: { sent: Sent[]; server?: http.Server } = { sent: [] };

test.beforeAll(async () => {
  graph.server = http.createServer((req, res) => {
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => {
      const auth = String(req.headers.authorization ?? "");
      const send = (status: number, body: unknown) => {
        res.statusCode = status;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(body));
      };
      if (auth !== `Bearer ${TOKEN}`) return send(401, { error: { message: "Invalid OAuth access token." } });
      if (req.method === "GET" && req.url?.startsWith(`/v21.0/${PHONE_ID}`)) return send(200, { verified_name: "Demo Business", display_phone_number: "+966 11 400 0000" });
      if (req.method === "POST" && req.url === `/v21.0/${PHONE_ID}/messages`) {
        const body = JSON.parse(raw);
        if (body.template?.name === "reject_me") return send(400, { error: { message: "Template name does not exist in the translation" } });
        graph.sent.push({ auth, body });
        return send(200, { messaging_product: "whatsapp", messages: [{ id: `wamid.OUT${graph.sent.length}` }] });
      }
      send(404, { error: { message: "not found" } });
    });
  });
  await new Promise<void>((r) => graph.server!.listen(4010, "127.0.0.1", r));
});
test.afterAll(() => graph.server?.close());

const hook = (request: Page["request"], secret: string | null, payload: unknown) => {
  const raw = JSON.stringify(payload);
  return request.post("/api/webhooks/whatsapp", {
    data: Buffer.from(raw),
    headers: { "Content-Type": "application/json", ...(secret ? { "X-Hub-Signature-256": "sha256=" + createHmac("sha256", secret).update(raw).digest("hex") } : {}) },
  });
};
const incoming = (waId: string, msgs: object[], name = "Test Sender") => ({
  object: "whatsapp_business_account",
  entry: [{ id: "1", changes: [{ field: "messages", value: { messaging_product: "whatsapp", contacts: [{ wa_id: waId, profile: { name } }], messages: msgs } }] }],
});
const statuses = (sts: object[]) => ({ object: "whatsapp_business_account", entry: [{ id: "1", changes: [{ field: "messages", value: { messaging_product: "whatsapp", statuses: sts } }] }] });

const waId = (phone: string) => phone.replace(/\D/g, "");
async function contactFor(email: string) {
  const list = await db.contact.findMany({ where: { owner: { email }, phone: { not: null } }, orderBy: { id: "asc" } });
  return list[0];
}

async function configure(p: Page, token = TOKEN) {
  await p.goto("/settings/integrations");
  const form = p.locator("form[data-testid=wa-form]");
  await form.locator("input[name=enabled]").check();
  await form.locator("input[name=phoneNumberId]").fill(PHONE_ID);
  await form.locator("input[name=accessToken]").fill(token);
  await form.locator("input[name=appSecret]").fill(SECRET);
  await form.locator("button").click();
  await expect(p.locator("p[role=status]")).toContainText("Saved");
}

test("settings: secrets are encrypted, connection check talks to the Graph API, bad token is reported", async ({ browser }) => {
  const admin = await signedIn(browser, USERS.admin);
  await configure(admin, "wrong-token");
  const stored = (await db.setting.findUnique({ where: { key: "whatsapp" } }))!.value as { accessToken: string; appSecret: string; verifyToken: string };
  expect(stored.accessToken.startsWith("v1:") && stored.appSecret.startsWith("v1:")).toBe(true);
  expect(JSON.stringify(stored)).not.toContain(SECRET);
  await admin.getByRole("button", { name: "Check connection" }).click();
  await expect(admin.locator("p[role=alert]")).toContainText("Connection failed: Invalid OAuth access token.");
  await configure(admin);
  await admin.getByRole("button", { name: "Check connection" }).click();
  await expect(admin.locator("p[role=status]")).toContainText("Connected as Demo Business");
});

test("webhook handshake and signature checks", async ({ browser, request }) => {
  const admin = await signedIn(browser, USERS.admin);
  await admin.goto("/settings/integrations");
  const verify = await admin.getByTestId("wa-verify").innerText();
  const ok = await request.get(`/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=${verify}&hub.challenge=424242`);
  expect(ok.status()).toBe(200);
  expect(await ok.text()).toBe("424242");
  expect((await request.get("/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=nope&hub.challenge=1")).status()).toBe(403);
  expect((await request.get("/api/webhooks/whatsapp")).status()).toBe(403);

  const c = await contactFor(USERS.rep1);
  const msg = incoming(waId(c.phone!), [{ id: "wamid.SIG", from: waId(c.phone!), type: "text", text: { body: "unsigned" } }]);
  expect((await hook(request, null, msg)).status()).toBe(401);
  expect((await hook(request, "wrong-secret", msg)).status()).toBe(401);
  expect(await db.activity.count({ where: { externalId: "wa:wamid.SIG" } })).toBe(0);
});

test("inbound messages are matched by phone, de-duplicated, and shown on the timeline", async ({ browser, request }) => {
  const c = await contactFor(USERS.rep1);
  const id = waId(c.phone!);
  const r1 = await hook(request, SECRET, incoming(id, [{ id: "wamid.IN1", from: id, timestamp: String(Math.floor(Date.now() / 1000)), type: "text", text: { body: "Hello, is the quote ready?" } }]));
  expect(r1.status()).toBe(200);
  await hook(request, SECRET, incoming(id, [{ id: "wamid.IN1", from: id, type: "text", text: { body: "Hello, is the quote ready?" } }])); // Meta redelivers
  expect(await db.activity.count({ where: { externalId: "wa:wamid.IN1" } })).toBe(1);
  await hook(request, SECRET, incoming(id, [{ id: "wamid.IN2", from: id, type: "image", image: { caption: "the contract" } }, { id: "wamid.IN3", from: id, type: "audio" }]));
  const types = (await db.activity.findMany({ where: { externalId: { in: ["wa:wamid.IN2", "wa:wamid.IN3"] } }, orderBy: { externalId: "asc" } })).map((a) => a.body);
  expect(types).toEqual(["[Image] the contract", "[Voice message]"]);

  const owner = await signedIn(browser, USERS.rep1);
  await owner.goto(`/contacts/${c.id}`);
  await expect(owner.locator("main")).toContainText("Hello, is the quote ready?");
  await expect(owner.locator("main")).toContainText(`WhatsApp (Received · ${id})`);
  // another rep never sees it
  const other = await signedIn(browser, USERS.rep2);
  expect((await other.goto(`/contacts/${c.id}`))!.status()).toBe(404);
});

test("unknown numbers are ignored, or create a contact when auto-create is on", async ({ browser, request }) => {
  const before = await db.contact.count();
  await hook(request, SECRET, incoming("966500009999", [{ id: "wamid.UNK1", from: "966500009999", type: "text", text: { body: "who is this" } }], "Layla Newcomer"));
  expect(await db.contact.count()).toBe(before);
  expect(await db.activity.count({ where: { externalId: "wa:wamid.UNK1" } })).toBe(0);

  const admin = await signedIn(browser, USERS.admin);
  await admin.goto("/settings/integrations");
  const form = admin.locator("form[data-testid=wa-form]");
  await form.locator("input[name=autoCreate]").check();
  await form.locator("select[name=defaultOwnerId]").selectOption({ label: "Reem Al-Qahtani" });
  await form.locator("button").click();
  await expect(admin.locator("p[role=status]")).toContainText("Saved");
  // secrets left blank in the form are kept
  await admin.getByRole("button", { name: "Check connection" }).click();
  await expect(admin.locator("p[role=status]")).toContainText("Connected as Demo Business");

  await hook(request, SECRET, incoming("966500009999", [{ id: "wamid.UNK2", from: "966500009999", type: "text", text: { body: "hello again" } }], "Layla Newcomer"));
  await hook(request, SECRET, incoming("966500009999", [{ id: "wamid.UNK3", from: "966500009999", type: "text", text: { body: "second message" } }], "Layla Newcomer"));
  expect(await db.contact.count()).toBe(before + 1); // one contact, not two
  const created = (await db.contact.findFirst({ where: { source: "WhatsApp" } }))!;
  expect(created).toMatchObject({ firstName: "Layla", lastName: "Newcomer", phone: "+966500009999" });
  expect((await db.user.findUnique({ where: { id: created.ownerId } }))!.email).toBe(USERS.rep1);
  expect(await db.activity.count({ where: { contactId: created.id, type: "WHATSAPP" } })).toBe(2);
});

test("sending: free text inside the 24h window, templates outside it; errors are reported", async ({ browser }) => {
  const c = await contactFor(USERS.rep1);
  const id = waId(c.phone!);
  const rep = await signedIn(browser, USERS.rep1);
  graph.sent.length = 0;

  await rep.goto(`/contacts/${c.id}`);
  await rep.getByTestId("compose-whatsapp").locator("summary").click();
  await rep.fill("#wa-message", "Yes! Sending it over now.");
  await rep.getByRole("button", { name: "Send", exact: true }).click();
  await expect(rep.locator("main")).toContainText("Yes! Sending it over now.");
  await expect(rep.locator("main")).toContainText(`WhatsApp (Sent · ${id})`);
  expect(graph.sent).toHaveLength(1);
  expect(graph.sent[0].body).toMatchObject({ messaging_product: "whatsapp", to: id, type: "text", text: { body: "Yes! Sending it over now." } });

  // delivery receipts move the status forward only
  const sent = (await db.activity.findFirst({ where: { externalId: "wa:wamid.OUT1" } }))!;
  expect(sent.meta).toMatchObject({ direction: "out", status: "sent" });
  const { request } = rep.context();
  await hook(request, SECRET, statuses([{ id: "wamid.OUT1", status: "delivered" }]));
  await hook(request, SECRET, statuses([{ id: "wamid.OUT1", status: "read" }]));
  await hook(request, SECRET, statuses([{ id: "wamid.OUT1", status: "delivered" }])); // late/out-of-order
  expect((await db.activity.findUnique({ where: { id: sent.id } }))!.meta).toMatchObject({ status: "read" });
  await rep.goto(`/contacts/${c.id}`);
  await expect(rep.locator("main")).toContainText(`WhatsApp (Read · ${id})`);
  await hook(request, SECRET, statuses([{ id: "wamid.OUT1", status: "failed", errors: [{ title: "Re-engagement message" }] }]));
  expect((await db.activity.findUnique({ where: { id: sent.id } }))!.meta).toMatchObject({ status: "failed", error: "Re-engagement message" });

  // outside the 24h window free text is refused locally (no API call) ...
  await db.activity.updateMany({ where: { contactId: c.id, type: "WHATSAPP", externalId: { startsWith: "wa:wamid.IN" } }, data: { createdAt: new Date(Date.now() - 30 * 3600_000) } });
  await rep.goto(`/contacts/${c.id}`);
  await rep.getByTestId("compose-whatsapp").locator("summary").click();
  await rep.fill("#wa-message", "Are you still there?");
  await rep.getByRole("button", { name: "Send", exact: true }).click();
  await expect(rep.getByText("only allows free text within 24 hours")).toBeVisible();
  expect(graph.sent).toHaveLength(1);

  // ... but an approved template works
  await rep.selectOption("#wa-mode", "template");
  await rep.fill("#wa-template", "quote_reminder");
  await rep.fill("#wa-lang", "ar");
  await rep.fill("#wa-params", "Layla\nQ-2026-0003");
  await rep.getByRole("button", { name: "Send", exact: true }).click();
  await expect(rep.locator("main")).toContainText("Template: quote_reminder");
  expect(graph.sent).toHaveLength(2);
  expect(graph.sent[1].body).toMatchObject({ type: "template", to: id, template: { name: "quote_reminder", language: { code: "ar" }, components: [{ type: "body", parameters: [{ type: "text", text: "Layla" }, { type: "text", text: "Q-2026-0003" }] }] } });

  // Meta rejects the template: the error is shown and nothing is logged
  const before = await db.activity.count({ where: { contactId: c.id, type: "WHATSAPP" } });
  await rep.getByTestId("compose-whatsapp").locator("summary").click();
  await rep.selectOption("#wa-mode", "template");
  await rep.fill("#wa-template", "reject_me");
  await rep.getByRole("button", { name: "Send", exact: true }).click();
  await expect(rep.getByText("Could not send the WhatsApp message: Template name does not exist")).toBeVisible();
  expect(await db.activity.count({ where: { contactId: c.id, type: "WHATSAPP" } })).toBe(before);
});

test("contacts without a phone, other reps' contacts, and a disabled integration", async ({ browser, request }) => {
  const admin = await signedIn(browser, USERS.admin);
  const nophone = await db.contact.create({ data: { firstName: "No", lastName: "Phone", ownerId: (await db.user.findUnique({ where: { email: USERS.rep1 } }))!.id } });
  await admin.goto(`/contacts/${nophone.id}`);
  await admin.getByTestId("compose-whatsapp").locator("summary").click();
  await expect(admin.getByTestId("compose-whatsapp")).toContainText("no phone number");

  // disabling hides the composer and makes the webhook a no-op
  await admin.goto("/settings/integrations");
  const form = admin.locator("form[data-testid=wa-form]");
  await form.locator("input[name=enabled]").uncheck();
  await form.locator("button").click();
  await expect(admin.locator("p[role=status]")).toContainText("Saved");
  await admin.goto(`/contacts/${nophone.id}`);
  await expect(admin.getByTestId("compose-whatsapp")).toHaveCount(0);
  const c = await contactFor(USERS.rep1);
  const r = await hook(request, SECRET, incoming(waId(c.phone!), [{ id: "wamid.OFF", from: waId(c.phone!), type: "text", text: { body: "ignored" } }]));
  expect(r.status()).toBe(200);
  expect(await db.activity.count({ where: { externalId: "wa:wamid.OFF" } })).toBe(0);
});

test("Arabic: composer and timeline labels are translated", async ({ browser }) => {
  const admin = await signedIn(browser, USERS.admin);
  await admin.goto("/settings/integrations");
  const form = admin.locator("form[data-testid=wa-form]");
  await form.locator("input[name=enabled]").check();
  await form.locator("button").click();
  await expect(admin.locator("p[role=status]")).toContainText("Saved");
  await admin.click("button[aria-label=Language]");
  await expect.poll(() => admin.evaluate(() => document.documentElement.dir)).toBe("rtl");
  const c = await contactFor(USERS.rep1);
  await admin.goto(`/contacts/${c.id}`);
  await expect(admin.getByTestId("compose-whatsapp")).toContainText("إرسال رسالة واتساب");
  await expect(admin.locator("main")).toContainText("مستلمة");
  await admin.goto("/settings/integrations");
  await expect(admin.locator("main")).toContainText("واتساب للأعمال");
});
