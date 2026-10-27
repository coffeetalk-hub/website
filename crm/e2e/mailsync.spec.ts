import type { AddressInfo } from "node:net";
import { ImapFlow } from "imapflow";
import hoodiecrow from "hoodiecrow-imap";
import { test, expect, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { assertMailboxAllowed } from "../src/core/mailsync";
import { reseed, signedIn, USERS } from "./helpers";

test.describe.configure({ mode: "serial" });
test.beforeAll(reseed);
const db = new PrismaClient();
test.afterAll(() => db.$disconnect());

// ── a real IMAP server (hoodiecrow) that the app connects to over the network ──
type Imap = { port: number; close: () => void };
async function startImap(): Promise<Imap> {
  const server = hoodiecrow({
    storage: { INBOX: { messages: [] }, "": { separator: "/", folders: { Sent: { "special-use": "\\Sent", messages: [] } } } },
    plugins: ["id", "starttls", "sasl-ir", "auth-plain", "namespace", "idle", "special-use", "uidplus", "enable", "condstore"],
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  const port = ((server.server ?? server) as { address(): AddressInfo }).address().port;
  return { port, close: () => server.close() };
}

async function append(port: number, folder: string, raw: string, date: Date) {
  const c = new ImapFlow({ host: "127.0.0.1", port, secure: false, doSTARTTLS: false, auth: { user: "testuser", pass: "testpass" }, logger: false });
  c.on("error", () => {});
  await c.connect();
  await c.append(folder, raw, [], date);
  await c.logout();
}

const daysAgo = (d: number) => new Date(Date.now() - d * 86400000);
function mail(o: { id: string; from: string; to: string; cc?: string; subject: string; body: string; date: Date; html?: boolean; attachment?: string }) {
  const head = `Message-ID: <${o.id}>\r\nFrom: ${o.from}\r\nTo: ${o.to}\r\n${o.cc ? `Cc: ${o.cc}\r\n` : ""}Subject: ${o.subject}\r\nDate: ${o.date.toUTCString()}\r\nMIME-Version: 1.0\r\n`;
  if (o.attachment) {
    return `${head}Content-Type: multipart/mixed; boundary="B1"\r\n\r\n--B1\r\nContent-Type: text/plain; charset=utf-8\r\nContent-Transfer-Encoding: base64\r\n\r\n${Buffer.from(o.body).toString("base64")}\r\n--B1\r\nContent-Type: application/pdf; name="${o.attachment}"\r\nContent-Disposition: attachment; filename="${o.attachment}"\r\nContent-Transfer-Encoding: base64\r\n\r\nJVBERi0xLjQK\r\n--B1--\r\n`;
  }
  return `${head}Content-Type: ${o.html ? "text/html" : "text/plain"}; charset=utf-8\r\nContent-Transfer-Encoding: base64\r\n\r\n${Buffer.from(o.body).toString("base64")}\r\n`;
}
const b64subject = (s: string) => `=?UTF-8?B?${Buffer.from(s).toString("base64")}?=`;

async function addMailbox(p: Page, o: { name: string; port: number; password?: string; owner?: string; auto?: boolean }) {
  await p.goto("/settings/integrations");
  const f = p.locator("form[data-testid=mailbox-form]");
  await f.locator("input[name=name]").fill(o.name);
  await f.locator("input[name=host]").fill("127.0.0.1");
  await f.locator("input[name=port]").fill(String(o.port));
  await f.locator("select[name=encryption]").selectOption("NONE");
  await f.locator("input[name=username]").fill("testuser");
  await f.locator("input[name=password]").fill(o.password ?? "testpass");
  if (o.owner) await f.locator("select[name=ownerId]").selectOption({ label: o.owner });
  if (o.auto) await f.locator("input[name=enabled]").check();
  else await f.locator("input[name=enabled]").uncheck(); // paused: only "Sync now" runs it, so the tests are deterministic
  await f.getByRole("button", { name: "Test connection and add" }).click();
  await p.locator("p[role=status], p[role=alert]").first().waitFor(); // the request includes a real connection test: let it finish
}
const row = (p: Page, name: string) => p.locator("[data-testid=mailbox-row]", { hasText: name });
const syncNow = async (p: Page, name: string) => {
  await p.goto("/settings/integrations");
  await row(p, name).getByRole("button", { name: "Sync now" }).click();
};

let imap: Imap;
let c1: { id: string; email: string | null; ownerId: string }; // rep1's contact
let c2: { id: string; email: string | null; ownerId: string }; // rep2's contact
test.beforeAll(async () => {
  imap = await startImap();
  c1 = (await db.contact.findFirst({ where: { owner: { email: USERS.rep1 }, email: { not: null } }, orderBy: { id: "asc" } }))!;
  c2 = (await db.contact.findFirst({ where: { owner: { email: USERS.rep2 }, email: { not: null } }, orderBy: { id: "asc" } }))!;
});
test.afterAll(() => imap.close());

const act = (externalId: string, contactId?: string) => db.activity.findFirst({ where: { externalId, ...(contactId ? { contactId } : {}) } });

test("policy: unencrypted or internal IMAP hosts are refused unless explicitly allowed", async () => {
  const saved = process.env.MAIL_ALLOW_PRIVATE;
  delete process.env.MAIL_ALLOW_PRIVATE;
  try {
    await expect(assertMailboxAllowed("imap.example.com", "NONE")).rejects.toThrow(/Unencrypted/);
    await expect(assertMailboxAllowed("127.0.0.1", "TLS")).rejects.toThrow(/private/);
    await expect(assertMailboxAllowed("192.168.1.10", "STARTTLS")).rejects.toThrow(/private/);
    await expect(assertMailboxAllowed("93.184.216.34", "TLS")).resolves.toBeUndefined();
  } finally {
    if (saved !== undefined) process.env.MAIL_ALLOW_PRIVATE = saved;
  }
});

test("adding a mailbox tests the login first; the password is stored encrypted", async ({ browser }) => {
  const admin = await signedIn(browser, USERS.admin);
  await addMailbox(admin, { name: "Bad login", port: imap.port, password: "nope" });
  await expect(admin.locator("p[role=alert]")).toContainText("Could not connect: Authentication failed");
  expect(await db.mailbox.count()).toBe(0); // nothing saved

  await addMailbox(admin, { name: "Shared sales", port: imap.port });
  await expect(admin.locator("p[role=status]")).toContainText("Mailbox “Shared sales” connected");
  const m = (await db.mailbox.findFirst({ where: { name: "Shared sales" } }))!;
  expect(m.password.startsWith("v1:")).toBe(true);
  expect(m.password).not.toContain("testpass");
  expect(m).toMatchObject({ enabled: false, ownerId: null, folders: "INBOX,[sent]" });
});

test("first sync imports mail to/from known contacts within the lookback window", async ({ browser }) => {
  const arSubject = "عرض السعر الجديد";
  await append(imap.port, "INBOX", mail({ id: "m1@t", from: `"Known One" <${c1.email!.toUpperCase()}>`, to: "sales@corp.test", subject: "Please send the quote", body: "Hello,\nPlease send the quote.", date: daysAgo(2) }), daysAgo(2));
  await append(imap.port, "INBOX", mail({ id: "m2@t", from: c2.email!, to: "sales@corp.test", subject: "HTML mail", body: "<p>Hi <b>there</b></p><script>x()</script>", date: daysAgo(3), html: true }), daysAgo(3));
  await append(imap.port, "INBOX", mail({ id: "m3@t", from: "stranger@nowhere.test", to: "sales@corp.test", subject: "Buy now", body: "spam", date: daysAgo(1) }), daysAgo(1));
  await append(imap.port, "INBOX", mail({ id: "m4@t", from: c1.email!, to: "sales@corp.test", subject: "Ancient history", body: "old", date: daysAgo(60) }), daysAgo(60));
  await append(imap.port, "INBOX", mail({ id: "m5@t", from: c1.email!, to: "sales@corp.test", subject: b64subject(arSubject), body: "مرحبًا، مرفق العقد.", date: daysAgo(1), attachment: "contract.pdf" }), daysAgo(1));
  await append(imap.port, "Sent", mail({ id: "s1@t", from: "sales@corp.test", to: c1.email!, cc: c2.email!, subject: "Our proposal", body: "Proposal attached soon.", date: daysAgo(1) }), daysAgo(1));

  const admin = await signedIn(browser, USERS.admin);
  await syncNow(admin, "Shared sales");
  await expect(admin.locator("p[role=status]")).toContainText("Imported 5, already there 0, checked 5");

  const m1 = (await act("email:<m1@t>", c1.id))!;
  expect(m1).toMatchObject({ type: "EMAIL", subject: "Please send the quote", assigneeId: c1.ownerId });
  expect(m1.body).toContain("Please send the quote.");
  expect(m1.meta).toMatchObject({ channel: "email", direction: "in", from: c1.email!.toLowerCase(), via: "imap", mailbox: "Shared sales" }); // matched case-insensitively
  expect(m1.createdAt.getTime()).toBeLessThan(Date.now() - 86400000); // keeps the message's own date
  expect((await act("email:<m2@t>", c2.id))!.body).toBe("Hi there"); // HTML reduced to text, script dropped
  expect(await db.activity.count({ where: { externalId: { in: ["email:<m3@t>", "email:<m4@t>"] } } })).toBe(0); // stranger and out-of-window mail are not imported
  const m5 = (await act("email:<m5@t>", c1.id))!;
  expect(m5.subject).toBe(arSubject); // RFC 2047 subject decoded
  expect(m5.body).toBe("مرحبًا، مرفق العقد.");
  expect(m5.meta).toMatchObject({ attachments: ["contract.pdf"] });
  const sent = await db.activity.findMany({ where: { externalId: { startsWith: "email:<s1@t>" } }, orderBy: { externalId: "asc" } });
  expect(sent.map((a) => a.contactId).sort()).toEqual([c1.id, c2.id].sort()); // one entry per matched recipient (To and Cc)
  expect(sent.every((a) => (a.meta as { direction: string }).direction === "out")).toBe(true);
  expect(new Set(sent.map((a) => a.externalId)).size).toBe(2);

  // visible to the right people, with attachment names
  const owner = await signedIn(browser, USERS.rep1);
  await owner.goto(`/contacts/${c1.id}`);
  await expect(owner.locator("main")).toContainText(`Email (Received · ${c1.email!.toLowerCase()})`);
  await expect(owner.locator("main")).toContainText("📎 contract.pdf");
  await expect(owner.locator("main")).toContainText(`Email (Sent · ${c1.email!.toLowerCase()})`);
  const other = await signedIn(browser, USERS.rep2);
  expect((await other.goto(`/contacts/${c1.id}`))!.status()).toBe(404);
});

test("syncing is incremental, idempotent and read-only", async ({ browser }) => {
  const admin = await signedIn(browser, USERS.admin);
  await syncNow(admin, "Shared sales");
  await expect(admin.locator("p[role=status]")).toContainText("Imported 0, already there 0, checked 0"); // nothing is looked at twice
  const before = await db.activity.count({ where: { type: "EMAIL" } });

  await append(imap.port, "INBOX", mail({ id: "m6@t", from: c1.email!, to: "sales@corp.test", subject: "Follow-up", body: "Any news?", date: new Date() }), new Date());
  await append(imap.port, "INBOX", mail({ id: "m7@t", from: "other@nowhere.test", to: "sales@corp.test", subject: "Noise", body: "x", date: new Date() }), new Date());
  await syncNow(admin, "Shared sales");
  await expect(admin.locator("p[role=status]")).toContainText("Imported 1, already there 0, checked 2");
  expect(await db.activity.count({ where: { type: "EMAIL" } })).toBe(before + 1);
  expect(await db.mailbox.findFirst({ where: { name: "Shared sales" } })).toMatchObject({ lastError: null, syncingSince: null });

  // the mailbox was only read: nothing got marked as seen
  const c = new ImapFlow({ host: "127.0.0.1", port: imap.port, secure: false, doSTARTTLS: false, auth: { user: "testuser", pass: "testpass" }, logger: false });
  c.on("error", () => {});
  await c.connect();
  const lock = await c.getMailboxLock("INBOX", { readOnly: true });
  const seen: string[][] = [];
  for await (const m of c.fetch("1:*", { flags: true })) seen.push([...(m.flags ?? [])]);
  lock.release();
  await c.logout();
  expect(seen.flat()).not.toContain("\\Seen");
});

test("the same message is never duplicated, whichever route saw it first", async ({ browser }) => {
  // as if the CRM itself had sent it (SMTP) and the inbound webhook had delivered another one earlier
  const rep1 = (await db.user.findUnique({ where: { email: USERS.rep1 } }))!;
  for (const id of ["crm-sent@t", "webhook-first@t"]) {
    await db.activity.create({ data: { type: "EMAIL", subject: id, body: "x", completedAt: new Date(), assigneeId: rep1.id, creatorId: rep1.id, contactId: c1.id, externalId: `email:<${id}>` } });
  }
  await append(imap.port, "Sent", mail({ id: "crm-sent@t", from: "sales@corp.test", to: c1.email!, subject: "crm-sent@t", body: "x", date: new Date() }), new Date());
  await append(imap.port, "INBOX", mail({ id: "webhook-first@t", from: c1.email!, to: "sales@corp.test", subject: "webhook-first@t", body: "x", date: new Date() }), new Date());
  const admin = await signedIn(browser, USERS.admin);
  await syncNow(admin, "Shared sales");
  await expect(admin.locator("p[role=status]")).toContainText("Imported 0, already there 2, checked 2");
  expect(await db.activity.count({ where: { externalId: { startsWith: "email:<crm-sent@t>" } } })).toBe(1);
  expect(await db.activity.count({ where: { externalId: { startsWith: "email:<webhook-first@t>" } } })).toBe(1);
});

test("a mailbox owned by one rep only matches that rep's contacts", async ({ browser }) => {
  const imap2 = await startImap();
  try {
    await append(imap2.port, "INBOX", mail({ id: "own-c1@t", from: c1.email!, to: "rep1@corp.test", subject: "For rep1", body: "hi", date: new Date() }), new Date());
    await append(imap2.port, "INBOX", mail({ id: "own-c2@t", from: c2.email!, to: "rep1@corp.test", subject: "Not rep1's contact", body: "hi", date: new Date() }), new Date());
    const admin = await signedIn(browser, USERS.admin);
    await addMailbox(admin, { name: "Reem's mailbox", port: imap2.port, owner: "Reem Al-Qahtani" });
    await syncNow(admin, "Reem's mailbox");
    await expect(admin.locator("p[role=status]")).toContainText("Imported 1, already there 0, checked 2");
    const mine = (await act("email:<own-c1@t>", c1.id))!;
    expect(mine.assigneeId).toBe(c1.ownerId); // rep1 owns both the mailbox and the contact
    expect(await act("email:<own-c2@t>")).toBeNull(); // rep2's contact is out of scope for rep1's mailbox
    await expect(row(admin, "Reem's mailbox")).toContainText("Reem Al-Qahtani");
  } finally {
    imap2.close();
  }
});

test("scheduler: enabled mailboxes sync on their own; paused ones don't", async ({ browser }) => {
  const admin = await signedIn(browser, USERS.admin);
  const arrived = async (id: string, ms: number) => {
    try {
      await expect.poll(async () => (await db.activity.count({ where: { externalId: { startsWith: `email:<${id}>` } } })) > 0, { timeout: ms, intervals: [500] }).toBe(true);
      return true;
    } catch {
      return false;
    }
  };
  // the server runs its timer every 4 seconds in tests (MAIL_SYNC_INTERVAL_SECONDS)
  await append(imap.port, "INBOX", mail({ id: "auto1@t", from: c1.email!, to: "sales@corp.test", subject: "auto one", body: "x", date: new Date() }), new Date());
  expect(await arrived("auto1@t", 9000)).toBe(false); // the mailbox is paused: two timer ticks pass, nothing happens

  await admin.goto("/settings/integrations");
  await row(admin, "Shared sales").getByRole("button", { name: "Enable" }).click();
  expect(await arrived("auto1@t", 15000)).toBe(true); // enabled: picked up without anyone clicking
  await append(imap.port, "INBOX", mail({ id: "auto2@t", from: c1.email!, to: "sales@corp.test", subject: "auto two", body: "x", date: new Date() }), new Date());
  expect(await arrived("auto2@t", 15000)).toBe(true);

  await admin.goto("/settings/integrations");
  await row(admin, "Shared sales").getByRole("button", { name: "Pause" }).click();
  await append(imap.port, "INBOX", mail({ id: "auto3@t", from: c1.email!, to: "sales@corp.test", subject: "auto three", body: "x", date: new Date() }), new Date());
  expect(await arrived("auto3@t", 9000)).toBe(false);
  await syncNow(admin, "Shared sales"); // "Sync now" works even while paused
  await expect(admin.locator("p[role=status]")).toContainText("Imported 1");
  expect(await arrived("auto3@t", 2000)).toBe(true);
});

test("a server that is down is reported without leaving a stuck lock; delete keeps imported mail", async ({ browser }) => {
  const imap3 = await startImap();
  const admin = await signedIn(browser, USERS.admin);
  await addMailbox(admin, { name: "Flaky", port: imap3.port });
  imap3.close();
  await new Promise((r) => setTimeout(r, 300));
  await syncNow(admin, "Flaky");
  await expect(admin.locator("p[role=alert]")).toContainText("Sync failed: Connection refused");
  await admin.goto("/settings/integrations");
  await expect(row(admin, "Flaky").getByTestId("mailbox-error")).toContainText("Connection refused");
  expect(await db.mailbox.findFirst({ where: { name: "Flaky" } })).toMatchObject({ syncingSince: null }); // lock released

  const emails = await db.activity.count({ where: { type: "EMAIL", meta: { path: "$.via", equals: "imap" } } });
  expect(emails).toBeGreaterThan(5);
  admin.once("dialog", (d) => d.accept());
  await row(admin, "Shared sales").getByRole("button", { name: "Delete" }).click();
  await expect(row(admin, "Shared sales")).toHaveCount(0);
  expect(await db.activity.count({ where: { type: "EMAIL", meta: { path: "$.via", equals: "imap" } } })).toBe(emails); // history stays
});

test("reps cannot manage mailboxes; Arabic UI is translated", async ({ browser }) => {
  const rep = await signedIn(browser, USERS.rep1);
  expect((await rep.goto("/settings/integrations"))!.status()).toBe(404);
  const admin = await signedIn(browser, USERS.admin);
  await admin.click("button[aria-label=Language]");
  await expect.poll(() => admin.evaluate(() => document.documentElement.dir)).toBe("rtl");
  await admin.goto("/settings/integrations");
  await expect(admin.locator("main")).toContainText("مزامنة صندوق البريد (IMAP)");
  await expect(admin.getByRole("button", { name: "اختبار الاتصال وإضافة" })).toBeVisible();
});
