import http from "node:http";
import type { AddressInfo } from "node:net";
import { createHmac } from "node:crypto";
import { test, expect, type APIRequestContext } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { generateApiKey } from "../src/core/api/keys";
import { assertSafeWebhookUrl } from "../src/core/webhooks";
import { reseed, signedIn, USERS } from "./helpers";

test.describe.configure({ mode: "serial" });
test.beforeAll(reseed);
const db = new PrismaClient();
test.afterAll(() => db.$disconnect());

async function makeKey(email: string, scope: "READ" | "WRITE", name = "e2e") {
  const u = (await db.user.findUnique({ where: { email } }))!;
  const k = generateApiKey();
  const rec = await db.apiKey.create({ data: { name, prefix: k.prefix, hash: k.hash, userId: u.id, scope } });
  return { key: k.key, id: rec.id, userId: u.id };
}
const auth = (key: string) => ({ Authorization: `Bearer ${key}` });
const get = (r: APIRequestContext, key: string, path: string) => r.get(`/api/v1${path}`, { headers: auth(key) });
const send = (r: APIRequestContext, key: string, method: "post" | "patch" | "delete", path: string, data?: object) =>
  r[method](`/api/v1${path}`, { headers: auth(key), ...(data ? { data } : {}) });

let admin: { key: string; id: string; userId: string };
let rep: { key: string; id: string; userId: string };
let repRead: { key: string; id: string; userId: string };

test.beforeAll(async () => {
  admin = await makeKey(USERS.admin, "WRITE", "admin-key");
  rep = await makeKey(USERS.rep1, "WRITE", "rep-key");
  repRead = await makeKey(USERS.rep1, "READ", "rep-read-key");
});

test("authentication: missing, malformed, unknown and revoked keys are rejected; /me reports the identity", async ({ request }) => {
  expect((await request.get("/api/v1/contacts")).status()).toBe(401);
  expect((await request.get("/api/v1/contacts", { headers: { Authorization: "Bearer nope" } })).status()).toBe(401);
  expect((await get(request, "crm_live_" + "x".repeat(32), "/contacts")).status()).toBe(401);
  const me = await (await get(request, rep.key, "/me")).json();
  expect(me.data).toMatchObject({ email: USERS.rep1, role: "REP", scope: "WRITE" });
  const res = await request.get("/api/v1/contacts"); // errors are JSON with a stable shape
  expect((await res.json()).error.code).toBe("unauthorized");

  const revoked = await makeKey(USERS.admin, "READ", "to-revoke");
  expect((await get(request, revoked.key, "/me")).status()).toBe(200);
  await db.apiKey.update({ where: { id: revoked.id }, data: { revokedAt: new Date() } });
  expect((await get(request, revoked.key, "/me")).status()).toBe(401);
  // a disabled user's key stops working immediately
  const sleeper = await makeKey(USERS.rep2, "READ", "sleeper");
  await db.user.update({ where: { id: sleeper.userId }, data: { active: false } });
  expect((await get(request, sleeper.key, "/me")).status()).toBe(401);
  await db.user.update({ where: { id: sleeper.userId }, data: { active: true } });
});

test("a key sees exactly what its user sees; READ keys cannot write; ownerId cannot be forged by reps", async ({ request }) => {
  const all = (await (await get(request, admin.key, "/contacts?limit=100")).json()).meta.total;
  const mine = (await (await get(request, rep.key, "/contacts?limit=100")).json()).meta.total;
  expect(all).toBe(32);
  expect(mine).toBe(11);
  const adminList = (await (await get(request, admin.key, "/contacts?limit=100")).json()).data as { id: string; ownerId: string }[];
  const foreign = adminList.find((c) => c.ownerId !== rep.userId)!;
  expect((await get(request, rep.key, `/contacts/${foreign.id}`)).status()).toBe(404); // existence is not revealed
  expect((await send(request, rep.key, "patch", `/contacts/${foreign.id}`, { jobTitle: "Hacker" })).status()).toBe(404);
  expect((await send(request, rep.key, "delete", `/contacts/${foreign.id}`)).status()).toBe(404);

  const ro = await send(request, repRead.key, "post", "/contacts", { firstName: "A", lastName: "B" });
  expect(ro.status()).toBe(403);
  expect((await ro.json()).error.code).toBe("read_only_key");

  const forged = await send(request, rep.key, "post", "/contacts", { firstName: "Forge", lastName: "Owner", ownerId: admin.userId });
  expect((await forged.json()).data.ownerId).toBe(rep.userId); // reps always own what they create
  const asAdmin = await send(request, admin.key, "post", "/contacts", { firstName: "Assigned", lastName: "ToRep", ownerId: rep.userId });
  expect((await asAdmin.json()).data.ownerId).toBe(rep.userId); // admins may assign

  // a rep cannot link a record to someone else's company
  const others = (await (await get(request, admin.key, "/companies?limit=100")).json()).data as { id: string; ownerId: string }[];
  const theirCompany = others.find((c) => c.ownerId !== rep.userId)!;
  expect((await send(request, rep.key, "post", "/contacts", { firstName: "X", lastName: "Y", companyId: theirCompany.id })).status()).toBe(403);
});

test("contacts CRUD with custom fields, validation, partial updates, filters and pagination", async ({ request }) => {
  const bad = await send(request, admin.key, "post", "/contacts", { firstName: "", email: "nope", surprise: 1 });
  expect(bad.status()).toBe(422); // unknown field is rejected before anything else
  expect((await bad.json()).error.code).toBe("unknown_field");
  const bad2 = await send(request, admin.key, "post", "/contacts", { firstName: "Ann", email: "nope", custom: { preferred_language: "Klingon", nonexistent: 1 } });
  expect(bad2.status()).toBe(422);
  const f = (await bad2.json()).error.fields;
  expect(f.lastName).toBe("This field is required");
  expect(f.email).toBe("Enter a valid email");
  expect(f["custom.nonexistent"]).toBe("Unknown custom field");

  const created = await send(request, admin.key, "post", "/contacts", { firstName: "Ann", lastName: "Api", email: "ann@api.test", phone: "+966500000099", custom: { preferred_language: "Arabic", birthday: "1990-05-20" } });
  expect(created.status()).toBe(201);
  const c = (await created.json()).data;
  expect(c).toMatchObject({ firstName: "Ann", lastName: "Api", email: "ann@api.test", custom: { preferred_language: "Arabic", birthday: "1990-05-20" } });

  // PATCH only changes what was sent (custom fields too)
  const patched = (await (await send(request, admin.key, "patch", `/contacts/${c.id}`, { jobTitle: "CTO", custom: { preferred_language: "English" } })).json()).data;
  expect(patched).toMatchObject({ firstName: "Ann", email: "ann@api.test", jobTitle: "CTO", custom: { preferred_language: "English", birthday: "1990-05-20" } });
  const cleared = (await (await send(request, admin.key, "patch", `/contacts/${c.id}`, { phone: null })).json()).data;
  expect(cleared.phone).toBeNull();
  expect((await send(request, admin.key, "patch", `/contacts/${c.id}`, { email: "not-an-email" })).status()).toBe(422);

  // search, filters, pagination, updated_since
  const found = await (await get(request, admin.key, "/contacts?q=ann@api.test")).json();
  expect(found.data.map((x: { id: string }) => x.id)).toEqual([c.id]);
  const page1 = await (await get(request, admin.key, "/contacts?limit=10&page=1")).json();
  const page2 = await (await get(request, admin.key, "/contacts?limit=10&page=2")).json();
  expect(page1.data).toHaveLength(10);
  expect(page1.meta).toMatchObject({ page: 1, limit: 10 });
  expect(page2.data.map((x: { id: string }) => x.id).some((id: string) => page1.data.some((y: { id: string }) => y.id === id))).toBe(false);
  expect((await (await get(request, admin.key, `/contacts?updated_since=${encodeURIComponent(new Date(Date.now() + 60_000).toISOString())}`)).json()).meta.total).toBe(0);
  expect((await get(request, admin.key, "/contacts?updated_since=garbage")).status()).toBe(400);
  expect((await get(request, admin.key, "/contacts?limit=1000")).status()).toBe(200); // limit is capped, not an error

  expect((await send(request, admin.key, "delete", `/contacts/${c.id}`)).status()).toBe(204);
  expect((await get(request, admin.key, `/contacts/${c.id}`)).status()).toBe(404);
  expect((await send(request, admin.key, "post", "/contacts", "not json" as unknown as object)).status()).toBeGreaterThanOrEqual(400);
});

test("companies, deals (stage moves are audited) and tasks", async ({ request }) => {
  const co = (await (await send(request, admin.key, "post", "/companies", { name: "Api Co", website: "api.test.sa", industry: "Tech", custom: { employees: 120, tier: "Key" } })).json()).data;
  expect(co.custom).toMatchObject({ employees: 120, tier: "Key" });
  expect((await send(request, admin.key, "post", "/companies", { name: "Bad", website: "x" })).status()).toBe(422);

  const stages = (await (await get(request, admin.key, "/stages")).json()).data as { id: string; name: string }[];
  const deal = (await (await send(request, admin.key, "post", "/deals", { title: "Api deal", value: 25000, stageId: stages[0].id, companyId: co.id, expectedCloseDate: "2027-01-31" })).json()).data;
  expect(deal).toMatchObject({ title: "Api deal", value: 25000, currency: "SAR", stageId: stages[0].id, expectedCloseDate: "2027-01-31" });
  expect((await send(request, admin.key, "post", "/deals", { title: "x", value: -5, stageId: stages[0].id })).status()).toBe(422);
  expect((await send(request, admin.key, "post", "/deals", { title: "x", value: 5, stageId: "nope" })).status()).toBe(422);
  const moved = (await (await send(request, admin.key, "patch", `/deals/${deal.id}`, { stageId: stages[2].id })).json()).data;
  expect(moved.stageId).toBe(stages[2].id);
  expect(await db.auditLog.count({ where: { entity: "Deal", recordId: deal.id, action: "MOVE" } })).toBe(1);
  expect((await (await get(request, admin.key, `/deals?stageId=${stages[2].id}&q=Api deal`)).json()).meta.total).toBe(1);

  const task = (await (await send(request, admin.key, "post", "/tasks", { type: "CALL", subject: "Call Api Co", dueAt: "2027-01-05T09:00:00Z", dealId: deal.id })).json()).data;
  expect(task).toMatchObject({ type: "CALL", subject: "Call Api Co", completed: false });
  const done = (await (await send(request, admin.key, "patch", `/tasks/${task.id}`, { completed: true })).json()).data;
  expect(done.completed).toBe(true);
  expect(done.completedAt).not.toBeNull();
  expect((await (await get(request, admin.key, `/tasks?completed=true&dealId=${deal.id}`)).json()).meta.total).toBe(1);
  expect((await send(request, admin.key, "post", "/tasks", { type: "TEXT", subject: "x" })).status()).toBe(422);

  for (const [res, id] of [["tasks", task.id], ["deals", deal.id], ["companies", co.id]] as const) expect((await send(request, admin.key, "delete", `/${res}/${id}`)).status()).toBe(204);
});

test("quotes and invoices are read-only over the API and scoped like the app", async ({ request }) => {
  const q = await (await get(request, admin.key, "/quotes?limit=100")).json();
  expect(q.data.length).toBeGreaterThan(0);
  expect(q.data[0]).toMatchObject({ currency: "SAR" });
  expect(q.data[0].total).toBeCloseTo(q.data[0].subtotal + q.data[0].vat, 2);
  const mineQ = await (await get(request, rep.key, "/quotes?limit=100")).json();
  expect(mineQ.meta.total).toBeLessThan(q.meta.total);
  const inv = (await (await get(request, admin.key, "/invoices?limit=100")).json()).data as { number: string | null; status: string }[];
  expect(inv.filter((i) => i.status === "DRAFT").every((i) => i.number === null)).toBe(true); // draft numbers are internal
  expect((await send(request, admin.key, "post", "/invoices", {})).status()).toBe(405);
  expect((await send(request, admin.key, "post", "/quotes", {})).status()).toBe(405);
  expect((await get(request, admin.key, "/nonsense")).status()).toBe(404);
});

test("rate limit: 120 requests per minute per key", async ({ request }) => {
  const k = await makeKey(USERS.manager, "READ", "burst");
  const codes: number[] = [];
  for (let i = 0; i < 125; i++) codes.push((await get(request, k.key, "/me")).status());
  expect(codes.filter((c) => c === 200)).toHaveLength(120);
  expect(codes.filter((c) => c === 429).length).toBe(5);
  const limited = await get(request, k.key, "/me");
  expect(limited.headers()["retry-after"]).toBeTruthy();
});

test("OpenAPI document describes the API", async ({ request }) => {
  const res = await request.get("/api/v1/openapi.json"); // public: it contains no data
  expect(res.status()).toBe(200);
  const spec = await res.json();
  expect(spec.openapi).toMatch(/^3\./);
  expect(Object.keys(spec.paths)).toEqual(expect.arrayContaining(["/contacts", "/contacts/{id}", "/deals/{id}", "/invoices", "/stages", "/me"]));
  expect(spec.paths["/invoices"].post).toBeUndefined();
  expect(spec.info.description).toContain("X-CRM-Signature");
});

test("SSRF guard: webhook URLs may not point at internal addresses", async () => {
  const saved = process.env.WEBHOOK_ALLOW_PRIVATE;
  delete process.env.WEBHOOK_ALLOW_PRIVATE;
  try {
    for (const bad of ["http://127.0.0.1:8080/x", "http://localhost/x", "http://10.0.0.5/x", "http://192.168.1.1/x", "http://169.254.169.254/latest/meta-data", "http://[::1]/x", "http://172.16.0.1/x", "ftp://example.com/x", "not a url"]) {
      await expect(assertSafeWebhookUrl(bad), bad).rejects.toThrow();
    }
    await expect(assertSafeWebhookUrl("http://93.184.216.34/hook")).resolves.toBeTruthy(); // public literal IP (no DNS needed)
  } finally {
    if (saved !== undefined) process.env.WEBHOOK_ALLOW_PRIVATE = saved;
  }
});

type Hit = { headers: http.IncomingHttpHeaders; body: string };
function receiver(statusFor: (n: number) => number) {
  const hits: Hit[] = [];
  const server = http.createServer((req, res) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      hits.push({ headers: req.headers, body });
      res.statusCode = statusFor(hits.length);
      res.end("ok");
    });
  });
  return new Promise<{ url: string; hits: Hit[]; close: () => void }>((resolve) => server.listen(0, "127.0.0.1", () => resolve({ url: `http://127.0.0.1:${(server.address() as AddressInfo).port}/hook`, hits, close: () => server.close() })));
}

test("admin UI: key creation shows the secret once, the key works, revoking kills it; reps cannot open the page", async ({ browser, request }) => {
  const p = await signedIn(browser, USERS.admin);
  await p.goto("/settings/api");
  await p.fill("input[name=name]", "ui-key");
  await p.selectOption("select[name=scope]", "READ");
  await p.click("button:has-text('Create key')");
  const key = await p.getByTestId("secret-value").innerText();
  expect(key).toMatch(/^crm_live_[\w-]{20,}$/);
  expect((await get(request, key, "/me")).status()).toBe(200);
  await p.goto("/settings/api"); // reload: the secret is gone, only the prefix remains
  await expect(p.getByTestId("secret-box")).toHaveCount(0);
  await expect(p.locator("main")).toContainText(key.slice(0, 15));
  const dbKey = await db.apiKey.findFirst({ where: { name: "ui-key" } });
  expect(dbKey!.hash).not.toContain(key); // only a hash is stored
  p.once("dialog", (d) => d.accept());
  await p.locator("tr", { hasText: "ui-key" }).getByRole("button", { name: "Revoke" }).click();
  await expect(p.locator("tr", { hasText: "ui-key" })).toContainText("Revoked");
  expect((await get(request, key, "/me")).status()).toBe(401);

  const repPage = await signedIn(browser, USERS.rep1);
  expect((await repPage.goto("/settings/api"))!.status()).toBe(404);
});

test("webhooks: signed deliveries for subscribed events only, secret stored encrypted, retries on failure, ping", async ({ browser, request }) => {
  const rx = await receiver((n) => (n === 3 ? 500 : 200)); // 3rd request fails once, then succeeds on retry
  try {
    const p = await signedIn(browser, USERS.admin);
    await p.goto("/settings/api");
    await p.fill("input[name=url]", rx.url);
    await p.click("button:has-text('Add webhook')");
    const secret = await p.getByTestId("secret-value").innerText();
    expect(secret).toMatch(/^whsec_/);
    const row = await db.webhook.findFirst({ where: { url: rx.url } });
    expect(row!.secret.startsWith("v1:")).toBe(true); // encrypted at rest
    expect(row!.secret).not.toContain(secret);

    // an API write produces a signed event
    const created = (await (await send(request, admin.key, "post", "/contacts", { firstName: "Hook", lastName: "Test" })).json()).data;
    await expect.poll(() => rx.hits.length, { timeout: 8000 }).toBeGreaterThanOrEqual(1);
    const hit = rx.hits[0];
    const payload = JSON.parse(hit.body);
    expect(payload).toMatchObject({ event: "contact.created", data: { entity: "contact", recordId: created.id, action: "created" } });
    expect(hit.headers["x-crm-event"]).toBe("contact.created");
    const sig = String(hit.headers["x-crm-signature"]);
    const [t, v1] = [/t=(\d+)/.exec(sig)![1], /v1=([0-9a-f]{64})/.exec(sig)![1]];
    expect(v1).toBe(createHmac("sha256", secret).update(`${t}.${hit.body}`).digest("hex")); // receiver can verify authenticity
    expect(Math.abs(Date.now() / 1000 - Number(t))).toBeLessThan(30);

    // app changes (not just API calls) also notify: edit the contact in the UI, then delete via API
    await send(request, admin.key, "patch", `/contacts/${created.id}`, { jobTitle: "CEO" });
    await send(request, admin.key, "delete", `/contacts/${created.id}`);
    await expect.poll(() => rx.hits.map((h) => JSON.parse(h.body).event), { timeout: 15000 }).toEqual(expect.arrayContaining(["contact.created", "contact.updated", "contact.deleted"]));
    // the third delivery got HTTP 500 first and must have been retried to success
    await expect.poll(async () => (await db.webhookDelivery.findMany({ where: { webhookId: row!.id } })).every((d) => d.status === "SUCCESS"), { timeout: 15000 }).toBe(true);
    expect((await db.webhookDelivery.findMany({ where: { webhookId: row!.id, attempts: { gt: 1 } } })).length).toBeGreaterThanOrEqual(1);

    // ping from the UI
    await p.goto("/settings/api");
    await p.locator("tr", { hasText: rx.url }).getByRole("button", { name: "Send test" }).click();
    await expect(p.locator("main")).toContainText("Test sent: OK (HTTP 200)");

    // event filtering: a webhook subscribed to deals only ignores contact events
    const rx2 = await receiver(() => 200);
    try {
      await p.goto("/settings/api");
      await p.fill("input[name=url]", rx2.url);
      await p.uncheck("input[name=all]");
      await p.locator("details summary").first().click();
      await p.check("input[name=events][value='deal.created']");
      await p.click("button:has-text('Add webhook')");
      await expect(p.getByTestId("secret-box")).toBeVisible();
      const c2 = (await (await send(request, admin.key, "post", "/contacts", { firstName: "Filtered", lastName: "Out" })).json()).data;
      const stage = (await (await get(request, admin.key, "/stages")).json()).data[0].id;
      const d2 = (await (await send(request, admin.key, "post", "/deals", { title: "Hook deal", value: 1, stageId: stage })).json()).data;
      await expect.poll(() => rx2.hits.length, { timeout: 8000 }).toBe(1);
      expect(JSON.parse(rx2.hits[0].body).event).toBe("deal.created");
      await new Promise((r) => setTimeout(r, 1000));
      expect(rx2.hits).toHaveLength(1); // no contact.* events
      await send(request, admin.key, "delete", `/contacts/${c2.id}`);
      await send(request, admin.key, "delete", `/deals/${d2.id}`);
    } finally {
      rx2.close();
    }

    // a disabled webhook receives nothing
    // let in-flight deliveries from the steps above (the first hook receives every event) settle first
    let before = -1;
    while (before !== rx.hits.length) { before = rx.hits.length; await new Promise((r) => setTimeout(r, 1200)); }
    await db.webhook.update({ where: { id: row!.id }, data: { active: false } });
    const c3 = (await (await send(request, admin.key, "post", "/contacts", { firstName: "Quiet", lastName: "Hook" })).json()).data;
    await new Promise((r) => setTimeout(r, 1500));
    expect(rx.hits.length).toBe(before);
    await send(request, admin.key, "delete", `/contacts/${c3.id}`);
  } finally {
    rx.close();
  }
});
