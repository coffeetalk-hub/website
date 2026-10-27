import { test, expect } from "@playwright/test";
import { login, reseed, signedIn, totalOf, USERS } from "./helpers";

test.describe.configure({ mode: "serial" });
test.beforeAll(reseed);

test("wrong password shows an error and does not sign in", async ({ page }) => {
  await login(page, USERS.admin, "nope");
  await expect(page.getByText("Invalid email or password")).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
});

test("anonymous visitors are redirected to the login page", async ({ request }) => {
  for (const path of ["/dashboard", "/reports", "/api/export/contacts", "/api/reports/sales"]) {
    const res = await request.get(path, { maxRedirects: 0 });
    expect(res.status(), path).toBe(307);
    expect(res.headers()["location"], path).toContain("/login");
  }
});

test("reps only see their own records; admins see everything", async ({ browser }) => {
  const admin = await signedIn(browser, USERS.admin);
  const rep = await signedIn(browser, USERS.rep1);
  const all = await totalOf(admin, "/contacts");
  const mine = await totalOf(rep, "/contacts");
  expect(all).toBeGreaterThan(mine);
  expect(mine).toBeGreaterThan(0);
  expect(await totalOf(admin, "/tasks?view=all")).toBeGreaterThan(await totalOf(rep, "/tasks?view=all"));
});

test("a record you do not own is a 404 (existence is not revealed)", async ({ browser }) => {
  const admin = await signedIn(browser, USERS.admin);
  const rep = await signedIn(browser, USERS.rep1);
  await admin.goto("/contacts");
  const adminLinks = await admin.$$eval("tbody a[href^='/contacts/']", (a) => a.map((x) => x.getAttribute("href")!));
  await rep.goto("/contacts");
  const mine = new Set(await rep.$$eval("tbody a[href^='/contacts/']", (a) => a.map((x) => x.getAttribute("href")!)));
  const foreign = adminLinks.find((h) => !mine.has(h))!;
  expect((await rep.goto(foreign))!.status()).toBe(404);

  await admin.goto("/tasks?view=all");
  const taskLinks = await admin.$$eval("tbody a[href*='/edit']", (a) => a.map((x) => x.getAttribute("href")!));
  await rep.goto("/tasks?view=all");
  const myTasks = new Set(await rep.$$eval("tbody a[href*='/edit']", (a) => a.map((x) => x.getAttribute("href")!)));
  const foreignTask = taskLinks.find((h) => !myTasks.has(h))!;
  expect((await rep.goto(foreignTask))!.status()).toBe(404);
});

test("admin-only pages are hidden from reps and managers get no user/settings access", async ({ browser }) => {
  const rep = await signedIn(browser, USERS.rep1);
  const manager = await signedIn(browser, USERS.manager);
  for (const path of ["/users", "/users/new", "/settings"]) {
    expect((await rep.goto(path))!.status(), `rep ${path}`).toBe(404);
    expect((await manager.goto(path))!.status(), `manager ${path}`).toBe(404);
  }
  await expect(rep.locator("aside").getByText("Users")).toHaveCount(0);
});

test("reps export only their own contacts", async ({ browser }) => {
  const admin = await signedIn(browser, USERS.admin);
  const rep = await signedIn(browser, USERS.rep1);
  const rows = async (p: typeof admin) => ((await (await p.request.get("/api/export/contacts")).text()).trim().split("\n").length - 1);
  expect(await rows(rep)).toBe(await totalOf(rep, "/contacts"));
  expect(await rows(admin)).toBe(await totalOf(admin, "/contacts"));
});

test("security headers are sent", async ({ request }) => {
  const h = (await request.get("/login")).headers();
  expect(h["x-frame-options"]).toBe("DENY");
  expect(h["x-content-type-options"]).toBe("nosniff");
  expect(h["x-powered-by"]).toBeUndefined();
});
