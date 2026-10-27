import { test, expect } from "@playwright/test";
import { reseed, signedIn, totalOf, USERS } from "./helpers";

test.describe.configure({ mode: "serial" });
test.beforeAll(reseed);

test("users: create with validation, sign in, cannot lock yourself out, deactivate", async ({ browser }) => {
  const admin = await signedIn(browser, USERS.admin);
  await admin.goto("/users/new");
  await admin.fill("#name", "E2E User");
  await admin.fill("#email", "e2e.user@demo.com");
  await admin.fill("#password", "short");
  await admin.click("button[type=submit]");
  await expect(admin.getByText("At least 8 characters")).toBeVisible();
  await admin.fill("#password", "longenough1");
  await admin.uncheck("input[name=mustChange]");
  await admin.click("button[type=submit]");
  await admin.waitForURL("**/users?saved=*");

  const ctx = await browser.newContext({ baseURL: "http://localhost:3100" });
  const user = await ctx.newPage();
  await user.goto("/login");
  await user.fill("#email", "e2e.user@demo.com");
  await user.fill("#password", "longenough1");
  await user.click("button[type=submit]");
  await user.waitForURL("**/dashboard");

  await admin.goto("/users");
  await admin.click("main a:has-text('Amal Al-Harbi')");
  await admin.uncheck("input[name=active]");
  await admin.click("button[type=submit]");
  await expect(admin.getByText("cannot remove your own admin access")).toBeVisible();

  await admin.goto("/users");
  await admin.click("main a:has-text('E2E User')");
  await admin.uncheck("input[name=active]");
  await admin.click("button[type=submit]");
  await admin.waitForURL("**/users?saved=*");
  await user.goto("/dashboard"); // existing session of a deactivated user
  await expect(user).toHaveURL(/\/login/);
});

test("settings: stages and custom fields are data-driven", async ({ browser }) => {
  const admin = await signedIn(browser, USERS.admin);
  await admin.goto("/settings");
  await admin.fill("input[placeholder='New stage name']", "Onboarding");
  await admin.click("text=Add stage");
  await expect(admin.getByText("Stage “Onboarding” added")).toBeVisible();
  await admin.goto("/deals");
  await expect(admin.locator("section h2", { hasText: "Onboarding" })).toBeVisible();

  await admin.goto("/settings");
  const row = (name: string) => admin.locator("div.rounded-xl", { has: admin.locator(`input[value=${name}]`) }).first();
  await row("Lead").locator("button[aria-label=Delete]").click();
  await expect(admin.getByText("still has")).toBeVisible(); // stage with deals cannot be deleted
  await row("Onboarding").locator("button[aria-label=Delete]").click();
  await expect(admin.getByText("Stage “Onboarding” deleted")).toBeVisible();

  const section = admin.locator("section", { hasText: "Contacts" }).first();
  await section.locator("summary").click();
  await section.locator("input[name=label]").last().fill("Region");
  await section.locator("select[name=type]").selectOption("DROPDOWN");
  await section.locator("textarea[name=options]").last().fill("Central\nWestern");
  await section.locator("input[name=required]").last().check();
  await section.locator("button:has-text('Add field')").click();
  await expect(admin.getByText("Field “Region” added")).toBeVisible();

  await admin.goto("/contacts/new");
  await admin.fill("#firstName", "Cf");
  await admin.fill("#lastName", "Test");
  await admin.click("button[type=submit]");
  await expect(admin.getByText("Region is required")).toBeVisible(); // required custom field enforced server-side
  await admin.selectOption("select[name=cf_region]", "Western");
  await admin.click("button[type=submit]");
  await admin.waitForURL(/\/contacts\/c[^/]+$/);
  await expect(admin.locator("main")).toContainText("Western");
  admin.once("dialog", (d) => d.accept());
  await admin.click("text=Delete");
  await admin.waitForURL("**/contacts");

  await admin.goto("/settings");
  await row("Region").locator("button[aria-label=Delete]").click();
  await expect(admin.getByText("were deleted")).toBeVisible();
});

test("CSV: export includes custom fields and escapes formulas; import maps, skips duplicates and reports errors", async ({ browser }) => {
  const admin = await signedIn(browser, USERS.admin);
  const csv = await (await admin.request.get("/api/export/contacts")).text();
  expect(csv.replace("﻿", "").split("\n")[0]).toContain("Preferred language");

  await admin.goto("/import-export");
  await admin.setInputFiles("input[type=file]", "e2e/fixtures/contacts.csv");
  await expect(admin.getByText("Match your columns")).toBeVisible();
  // headers like "First Name", "Surname", "E-mail" are auto-mapped
  expect(await admin.$$eval("label select", (s) => s.slice(0, 5).map((x) => (x as HTMLSelectElement).value))).toEqual(["First Name", "Surname", "E-mail", "Mobile", "Title"]);
  await admin.click("button:has-text('Import 6 rows')");
  await expect(admin.getByText("Imported 3 · skipped 1 · errors 2")).toBeVisible();
  await expect(admin.locator("main")).toContainText("lastName: is required");
  await expect(admin.locator("main")).toContainText("already exists");
  expect(await totalOf(admin, "/contacts?q=Al-Test")).toBe(2);
  expect(await totalOf(admin, "/companies?q=NewCo")).toBe(1); // unknown company on a contact row is created

  const after = await (await admin.request.get("/api/export/contacts")).text();
  expect(after).toContain("'=cmd"); // formula-injection guard
});
