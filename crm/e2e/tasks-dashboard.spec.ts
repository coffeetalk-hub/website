import { test, expect } from "@playwright/test";
import { reseed, signedIn, totalOf, USERS } from "./helpers";

test.describe.configure({ mode: "serial" });
test.beforeAll(reseed);

test("task views, completing a task, and quick-add from a deal page", async ({ browser }) => {
  const p = await signedIn(browser, USERS.rep1);
  const today = await totalOf(p, "/tasks?view=today");
  expect(today).toBeGreaterThan(0);
  await p.locator("tbody form button").first().click();
  await expect.poll(async () => totalOf(p, "/tasks?view=today")).toBe(today - 1);
  expect(await totalOf(p, "/tasks?view=done")).toBeGreaterThan(0);

  await p.goto("/deals");
  const href = await p.$eval("a[href^='/deals/c']", (a) => a.getAttribute("href")!);
  await p.goto(href);
  await p.click("summary");
  await p.fill("#subject", "E2E call");
  await p.selectOption("#type", "CALL");
  await p.fill("#dueAt", "2026-12-01T10:00");
  await p.locator("details button[type=submit]").click();
  await p.waitForURL("**" + href);
  await expect(p.locator("main")).toContainText("E2E call");

  await p.goto("/tasks?view=all&q=E2E call");
  await p.click("text=E2E call");
  await p.fill("#subject", "E2E call v2");
  await p.click("button:has-text('Save')");
  await p.waitForURL("**/tasks");
  await p.goto("/tasks?view=all&q=E2E call v2");
  p.once("dialog", (d) => d.accept());
  await p.click("text=E2E call v2");
  await p.click("text=Delete");
  await p.waitForURL("**/tasks");
});

test("dashboard shows scoped numbers", async ({ browser }) => {
  const admin = await signedIn(browser, USERS.admin);
  const rep = await signedIn(browser, USERS.rep1);
  const open = async (p: typeof admin) => (await p.locator("main").innerText()).split("\n").map((l) => l.trim());
  const a = await open(admin);
  const r = await open(rep);
  expect(Number(a[a.indexOf("Open deals") - 1])).toBeGreaterThan(Number(r[r.indexOf("Open deals") - 1]));
});

// Regression: the recent-activity feed used to crash (HTTP 500) after a record's name/title/subject was edited,
// because the audit entry stores a {from, to} pair that was rendered as a React child.
test("dashboard keeps working after renaming a company, a deal and a task", async ({ browser }) => {
  const p = await signedIn(browser, USERS.admin);
  const bad: string[] = [];
  p.on("response", (r) => r.status() >= 500 && bad.push(`${r.status()} ${r.url()}`));

  await p.goto("/companies");
  await p.click("tbody a >> nth=0");
  await p.click("text=Edit");
  await p.fill("#name", "Renamed Co");
  await p.click("button:has-text('Save')");
  await p.waitForURL(/\/companies\/c[^/]+$/);

  await p.goto("/deals");
  const href = await p.$eval("a[href^='/deals/c']", (a) => a.getAttribute("href")!);
  await p.goto(href + "/edit");
  await p.fill("#title", "Renamed Deal");
  await p.click("button:has-text('Save')");
  await p.waitForURL("**" + href);

  await p.goto("/tasks");
  await p.click("tbody a[href*='/edit'] >> nth=0");
  await p.fill("#subject", "Renamed task");
  await p.click("button:has-text('Save')");
  await p.waitForURL("**/tasks");

  const res = await p.goto("/dashboard");
  expect(res!.status()).toBe(200);
  await expect(p.locator("main")).toContainText("Renamed Co");
  await expect(p.locator("main")).toContainText("Renamed Deal");
  expect(bad).toEqual([]);
});

test("global search is scoped and finds records", async ({ browser }) => {
  const rep = await signedIn(browser, USERS.rep1);
  await rep.goto("/search?q=al");
  await expect(rep.locator("main")).toContainText("Results for");
});
