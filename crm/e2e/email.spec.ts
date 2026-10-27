import type { AddressInfo } from "node:net";
import { SMTPServer } from "smtp-server";
import { test, expect, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { reseed, signedIn, USERS } from "./helpers";

test.describe.configure({ mode: "serial" });
test.beforeAll(reseed);
const db = new PrismaClient();
test.afterAll(() => db.$disconnect());

type Mail = { from: string; to: string[]; raw: string };
let smtp: SMTPServer;
let port = 0;
const inbox: Mail[] = [];

test.beforeAll(async () => {
  smtp = new SMTPServer({
    authOptional: false,
    allowInsecureAuth: true,
    disabledCommands: ["STARTTLS"],
    logger: false,
    onAuth(auth, _s, cb) {
      auth.username === "mailer" && auth.password === "s3cret" ? cb(null, { user: "mailer" }) : cb(new Error("Invalid credentials"));
    },
    onMailFrom(address, _s, cb) {
      (smtp as unknown as { _cur?: Partial<Mail> })._cur = { from: address.address, to: [] };
      cb();
    },
    onRcptTo(address, _s, cb) {
      (smtp as unknown as { _cur: Partial<Mail> })._cur.to!.push(address.address);
      cb();
    },
    onData(stream, _s, cb) {
      let raw = "";
      stream.on("data", (c) => (raw += c));
      stream.on("end", () => {
        const cur = (smtp as unknown as { _cur: Mail })._cur;
        inbox.push({ ...cur, raw });
        cb();
      });
    },
  });
  await new Promise<void>((res) => smtp.listen(0, "127.0.0.1", res));
  port = (smtp.server.address() as AddressInfo).port;
});
test.afterAll(() => smtp.close());

async function configure(p: Page, pass: string) {
  await p.goto("/settings/integrations");
  await p.locator("form[data-testid=email-form] input[name=enabled]").check();
  await p.fill("input[name=host]", "127.0.0.1");
  await p.fill("input[name=port]", String(port));
  await p.fill("input[name=user]", "mailer");
  if (pass) await p.fill("input[name=pass]", pass);
  await p.fill("input[name=fromName]", "Demo Sales");
  await p.fill("input[name=fromEmail]", "sales@demo-trading.sa");
  await p.locator("form[data-testid=email-form] button").click();
  await expect(p.locator("p[role=status]")).toContainText("Saved");
}

async function contactOf(email: string) {
  return (await db.contact.findFirst({ where: { owner: { email }, email: { not: null } } }))!;
}

test("SMTP settings: password is encrypted at rest; connection test sends a real message", async ({ browser }) => {
  const admin = await signedIn(browser, USERS.admin);
  await configure(admin, "wrong-password");
  const stored = (await db.setting.findUnique({ where: { key: "email" } }))!.value as { pass: string };
  expect(stored.pass.startsWith("v1:")).toBe(true);
  expect(stored.pass).not.toContain("wrong-password");

  await admin.getByRole("button", { name: "Send test email to me" }).click();
  await expect(admin.locator("p[role=alert]")).toContainText("Test failed"); // bad credentials are reported, not swallowed
  expect(inbox).toHaveLength(0);

  await configure(admin, "s3cret"); // blank password would keep the saved one; here we set the right one
  await admin.getByRole("button", { name: "Send test email to me" }).click();
  await expect(admin.locator("p[role=status]")).toContainText("Test email sent to admin@demo.com");
  expect(inbox).toHaveLength(1);
  expect(inbox[0].to).toEqual(["admin@demo.com"]);
  expect(inbox[0].raw).toMatch(/From: "?Demo Sales"? <sales@demo-trading.sa>/);

  // saving again with an empty password field keeps the stored password
  await admin.goto("/settings/integrations");
  await admin.locator("form[data-testid=email-form] button").click();
  await expect(admin.locator("p[role=status]")).toContainText("Saved");
  await admin.getByRole("button", { name: "Send test email to me" }).click();
  await expect(admin.locator("p[role=status]")).toContainText("Test email sent");
  inbox.length = 0;
});

test("compose: sends through SMTP and logs to the contact's timeline; log-only sends nothing", async ({ browser }) => {
  const c = await contactOf(USERS.rep1);
  const rep = await signedIn(browser, USERS.rep1); // reps can email their own contacts
  await rep.goto(`/contacts/${c.id}`);
  await rep.getByTestId("compose-email").locator("summary").click();
  expect(await rep.inputValue("#email-to")).toBe(c.email);
  await rep.fill("#email-subject", "Proposal follow-up");
  await rep.fill("#email-body", "Hello,\nPlease find the proposal attached.\nرسالة بالعربية");
  await rep.getByRole("button", { name: "Send email" }).click();
  await expect(rep.locator("main")).toContainText("Proposal follow-up");
  await expect(rep.locator("main")).toContainText(`Email (Sent · ${c.email})`);
  expect(inbox).toHaveLength(1);
  expect(inbox[0].to).toEqual([c.email]);
  expect(inbox[0].raw).toContain("Subject: Proposal follow-up");
  expect(inbox[0].raw).toContain("Please find the proposal attached.");
  const act = await db.activity.findFirst({ where: { contactId: c.id, type: "EMAIL" }, orderBy: { createdAt: "desc" } });
  expect(act).toMatchObject({ completedAt: expect.any(Date), assigneeId: (await db.user.findUnique({ where: { email: USERS.rep1 } }))!.id });
  expect(act!.externalId).toMatch(/^email:/);

  await rep.getByTestId("compose-email").locator("summary").click();
  await rep.selectOption("#email-mode", "log");
  await rep.fill("#email-subject", "Phone call recap (logged)");
  await rep.fill("#email-body", "Spoke on the phone.");
  await rep.getByRole("button", { name: "Send email" }).click();
  await expect(rep.locator("main")).toContainText("Email (Logged");
  expect(inbox).toHaveLength(1); // nothing new was sent

  // validation
  await rep.getByTestId("compose-email").locator("summary").click();
  await rep.fill("#email-to", "not-an-email");
  await rep.fill("#email-subject", "x");
  await rep.fill("#email-body", "x");
  await rep.selectOption("#email-mode", "send");
  await rep.getByRole("button", { name: "Send email" }).click();
  await expect(rep.getByText("Enter a valid email")).toBeVisible();
  expect(inbox).toHaveLength(1);
});

test("a failing SMTP server is reported and nothing is logged as sent", async ({ browser }) => {
  const admin = await signedIn(browser, USERS.admin);
  await configure(admin, "now-wrong");
  const c = await contactOf(USERS.rep2);
  const before = await db.activity.count({ where: { contactId: c.id, type: "EMAIL" } });
  await admin.goto(`/contacts/${c.id}`);
  await admin.getByTestId("compose-email").locator("summary").click();
  await admin.fill("#email-subject", "Will fail");
  await admin.fill("#email-body", "body");
  await admin.getByRole("button", { name: "Send email" }).click();
  await expect(admin.getByText("Could not send the email")).toBeVisible();
  expect(await db.activity.count({ where: { contactId: c.id, type: "EMAIL" } })).toBe(before);
  await configure(admin, "s3cret");
});

test("hourly send limit and access control", async ({ browser }) => {
  const rep = await signedIn(browser, USERS.rep1);
  expect((await rep.goto("/settings/integrations"))!.status()).toBe(404);
  const u = (await db.user.findUnique({ where: { email: USERS.rep1 } }))!;
  const c = await contactOf(USERS.rep1);
  await db.activity.createMany({ data: Array.from({ length: 30 }, (_, i) => ({ type: "EMAIL", subject: `bulk ${i}`, assigneeId: u.id, creatorId: u.id, contactId: c.id })) });
  await rep.goto(`/contacts/${c.id}`);
  await rep.getByTestId("compose-email").locator("summary").click();
  await rep.fill("#email-subject", "One too many");
  await rep.fill("#email-body", "x");
  await rep.getByRole("button", { name: "Send email" }).click();
  await expect(rep.getByText("Too many emails in the last hour")).toBeVisible();
  // another rep's contact is not reachable at all
  const other = await contactOf(USERS.rep2);
  expect((await rep.goto(`/contacts/${other.id}`))!.status()).toBe(404);
  await db.activity.deleteMany({ where: { subject: { startsWith: "bulk " } } });
});

test("inbound email webhook: authenticated, matched to contacts, idempotent, ignores strangers", async ({ browser, request }) => {
  const admin = await signedIn(browser, USERS.admin);
  await admin.goto("/settings/integrations");
  const token = await admin.getByTestId("inbound-token").innerText();
  expect(token.length).toBeGreaterThan(20);
  const c = await contactOf(USERS.rep1);
  const post = (data: unknown, tok: string | null = token) => request.post("/api/inbound/email", { data: data as object, headers: tok ? { Authorization: `Bearer ${tok}` } : {} });

  expect((await post({ from: c.email, subject: "x" }, null)).status()).toBe(401);
  expect((await post({ from: c.email, subject: "x" }, "wrong-token")).status()).toBe(401);
  expect((await post({ from: "nonsense", subject: "x" })).status()).toBe(422);
  for (const bad of [Buffer.from("not json"), Buffer.from("null"), Buffer.from("[1,2]"), Buffer.from('"a string"')]) {
    const r = await request.post("/api/inbound/email", { data: bad, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } });
    expect(r.status(), bad.toString()).toBe(400); // anything that is not a JSON object is rejected, never a 500
  }

  const stranger = await post({ from: "Nobody <nobody@unknown.test>", subject: "Hi", text: "hello" });
  expect(stranger.status()).toBe(202);
  expect((await stranger.json()).matched).toBe(false);

  const ok = await post({ from: `"${c.firstName}" <${c.email!.toUpperCase()}>`, subject: "Re: Proposal", text: "Thanks, we accept.", messageId: "<abc-123@mail.test>", date: "2026-10-20T08:00:00Z" });
  expect(ok.status()).toBe(201); // sender address matching is case-insensitive
  const dup = await post({ from: c.email, subject: "Re: Proposal", text: "again", messageId: "<abc-123@mail.test>" });
  expect(dup.status()).toBe(200);
  expect((await dup.json()).duplicate).toBe(true);
  expect(await db.activity.count({ where: { externalId: "email:<abc-123@mail.test>" } })).toBe(1);

  const html = await post({ from: c.email, subject: "HTML only", html: "<p>Hello <b>team</b></p><script>alert(1)</script><br>Bye &amp; thanks" });
  expect(html.status()).toBe(201);
  const stored = await db.activity.findFirst({ where: { subject: "HTML only" } });
  expect(stored!.body).toBe("Hello team\n\nBye & thanks"); // paragraph + line break, tags/script removed, entities decoded

  const owner = await signedIn(browser, USERS.rep1);
  await owner.goto(`/contacts/${c.id}`);
  await expect(owner.locator("main")).toContainText("Re: Proposal");
  await expect(owner.locator("main")).toContainText(`Email (Received · ${c.email})`);
  await expect(owner.locator("main")).toContainText("Thanks, we accept.");

  // regenerating the token invalidates the old one
  await admin.getByRole("button", { name: "Generate new token" }).click();
  await expect(admin.locator("p[role=status]")).toContainText("Saved");
  expect((await post({ from: c.email, subject: "x" }, token)).status()).toBe(401);
  const fresh = await admin.getByTestId("inbound-token").innerText();
  expect(fresh).not.toBe(token);
  expect((await post({ from: c.email, subject: "after rotate", text: "ok" }, fresh)).status()).toBe(201);
});

test("Arabic: the composer and integration settings are translated", async ({ browser }) => {
  const admin = await signedIn(browser, USERS.admin);
  await admin.click("button[aria-label=Language]");
  await expect.poll(() => admin.evaluate(() => document.documentElement.dir)).toBe("rtl");
  await admin.goto("/settings/integrations");
  await expect(admin.locator("h1")).toHaveText("التكاملات");
  await expect(admin.locator("main")).toContainText("البريد الإلكتروني (SMTP)");
  const c = await contactOf(USERS.rep1);
  await admin.goto(`/contacts/${c.id}`);
  await expect(admin.getByTestId("compose-email")).toContainText("إرسال بريد إلكتروني");
});
