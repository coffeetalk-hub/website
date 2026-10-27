import { test, expect, type Browser } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { login, reseed, signedIn, USERS } from "./helpers";

test.describe.configure({ mode: "serial" });
test.beforeAll(reseed);
const db = new PrismaClient();
test.afterAll(() => db.$disconnect());

async function fresh(browser: Browser) {
  return (await browser.newContext({ baseURL: "http://localhost:3100" })).newPage();
}

test("5 failed sign-ins lock the account even for the right password; unknown emails behave identically", async ({ browser }) => {
  const p = await fresh(browser);
  for (let i = 1; i <= 5; i++) {
    await login(p, USERS.rep2, `wrong-${i}`);
    await expect(p.getByText("Invalid email or password")).toBeVisible();
  }
  await login(p, USERS.rep2, "password123");
  await expect(p.getByText("Too many failed attempts")).toBeVisible();

  const ghost = await fresh(browser);
  for (let i = 1; i <= 5; i++) {
    await login(ghost, "nobody@nowhere.com", `x${i}`);
    await expect(ghost.getByText("Invalid email or password")).toBeVisible();
  }
  await login(ghost, "nobody@nowhere.com", "x6");
  await expect(ghost.getByText("Too many failed attempts")).toBeVisible(); // no account enumeration

  // the lock is time-boxed: age the failures past the 15-minute window
  await db.loginAttempt.updateMany({ data: { createdAt: new Date(Date.now() - 20 * 60 * 1000) } });
  await login(p, USERS.rep2, "password123");
  await p.waitForURL("**/dashboard");
});

test("temporary password: forced change before anything else, policy enforced, old password dies", async ({ browser }) => {
  const admin = await signedIn(browser, USERS.admin);
  await admin.goto("/users/new");
  await admin.fill("#name", "Temp User");
  await admin.fill("#email", "temp.user@demo.com");
  await admin.click("button:has-text('Generate')");
  const temp = await admin.inputValue("#password");
  expect(temp).toHaveLength(14);
  expect(await admin.isChecked("input[name=mustChange]")).toBe(true);
  await admin.click("button[type=submit]");
  await admin.waitForURL("**/users?saved=*");

  await admin.goto("/users/new");
  await admin.fill("#name", "Weak");
  await admin.fill("#email", "weak@demo.com");
  await admin.fill("#password", "password123");
  await admin.click("button[type=submit]");
  await expect(admin.getByText("too common")).toBeVisible();

  const u = await fresh(browser);
  await login(u, "temp.user@demo.com", temp);
  await u.waitForURL("**/change-password");
  for (const path of ["/dashboard", "/contacts", "/reports"]) {
    await u.goto(path);
    await expect(u, path).toHaveURL(/\/change-password/);
  }
  await u.fill("#current", "wrong");
  await u.fill("#next", "Fresh-Pass-2026");
  await u.fill("#confirm", "Fresh-Pass-2026");
  await u.click("button[type=submit]");
  await expect(u.getByText("Current password is incorrect")).toBeVisible();
  await u.fill("#current", temp);
  await u.fill("#next", "password123");
  await u.fill("#confirm", "password123");
  await u.click("button[type=submit]");
  await expect(u.getByText("too common")).toBeVisible();
  await u.fill("#next", "Fresh-Pass-2026");
  await u.fill("#confirm", "Different-2026");
  await u.click("button[type=submit]");
  await expect(u.getByText("do not match")).toBeVisible();
  await u.fill("#confirm", "Fresh-Pass-2026");
  await u.click("button[type=submit]");
  await u.waitForURL("**/dashboard");

  const old = await fresh(browser);
  await login(old, "temp.user@demo.com", temp);
  await expect(old.getByText("Invalid email or password")).toBeVisible();
});

test("changing a password signs out the user's other devices", async ({ browser }) => {
  const d1 = await signedIn(browser, USERS.rep1);
  const d2 = await signedIn(browser, USERS.rep1);
  await d1.goto("/change-password");
  await d1.fill("#current", "password123");
  await d1.fill("#next", "Another-Pass-77");
  await d1.fill("#confirm", "Another-Pass-77");
  await d1.click("button[type=submit]");
  await d1.waitForURL("**/dashboard");
  await d2.goto("/dashboard");
  await expect(d2).toHaveURL(/\/login/);
  await d1.goto("/contacts");
  await expect(d1).toHaveURL(/\/contacts/); // the device that changed it stays signed in
});

test("admin can sign a user out everywhere and reset their password", async ({ browser }) => {
  const admin = await signedIn(browser, USERS.admin);
  const victim = await signedIn(browser, USERS.manager);
  await admin.goto("/users");
  await admin.click("main a:has-text('Mansour Al-Otaibi')");
  await admin.click("button:has-text('Sign out of all devices')");
  await expect(admin.getByText("All sessions were signed out")).toBeVisible();
  await victim.goto("/dashboard");
  await expect(victim).toHaveURL(/\/login/);
  await expect(admin.locator("main")).toContainText("Recent sign-ins");

  await admin.goto("/users");
  await admin.click("main a:has-text('Temp User')");
  await admin.fill("#password", "Reset-By-Admin-9");
  await admin.click("button[type=submit]");
  await admin.waitForURL("**/users?saved=*");
  const u = await fresh(browser);
  await login(u, "temp.user@demo.com", "Reset-By-Admin-9");
  await u.waitForURL("**/change-password"); // admin-set password must be changed again
});
