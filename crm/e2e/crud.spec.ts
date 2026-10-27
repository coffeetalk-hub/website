import { test, expect } from "@playwright/test";
import { reseed, signedIn, USERS } from "./helpers";

test.describe.configure({ mode: "serial" });
test.beforeAll(reseed);

test("company and contact: validation, linking, custom field, history, delete", async ({ browser }) => {
  const p = await signedIn(browser, USERS.rep1);

  await p.goto("/companies/new");
  await p.click("button[type=submit]");
  await expect(p.getByText("This field is required").first()).toBeVisible();
  await p.fill("#name", "E2E Co");
  await p.fill("#website", "bad");
  await p.click("button[type=submit]");
  await expect(p.getByText("Enter a valid website")).toBeVisible();
  expect(await p.inputValue("#name")).toBe("E2E Co"); // input survives a validation error
  await p.fill("#website", "www.e2e.sa");
  await p.click("button[type=submit]");
  await p.waitForURL(/\/companies\/c[^/]+$/);
  const companyUrl = p.url();

  await p.goto("/contacts/new");
  await p.fill("#firstName", "Zed");
  await p.fill("#lastName", "Tester");
  await p.fill("#email", "zed@e2e.sa");
  await p.selectOption("#companyId", { label: "E2E Co" });
  await p.selectOption("select[name=cf_preferred_language]", "Arabic");
  await p.click("button[type=submit]");
  await p.waitForURL(/\/contacts\/c[^/]+$/);
  const body = await p.locator("main").innerText();
  expect(body).toContain("E2E Co");
  expect(body).toContain("Arabic");
  const contactUrl = p.url();

  await p.goto(contactUrl + "/edit");
  await p.fill("#jobTitle", "CTO");
  await p.click("button:has-text('Save')");
  await p.waitForURL(contactUrl);
  await expect(p.locator("main")).toContainText("updated (jobTitle)");

  p.once("dialog", (d) => d.accept());
  await p.click("text=Delete");
  await p.waitForURL("**/contacts");
  await p.goto(companyUrl);
  p.once("dialog", (d) => d.accept());
  await p.click("text=Delete");
  await p.waitForURL("**/companies");
});

test("a rep cannot link a deal or contact to someone else's company", async ({ browser }) => {
  const p = await signedIn(browser, USERS.rep1);
  await p.goto("/contacts/new");
  const options = await p.$$eval("#companyId option", (o) => o.map((x) => x.textContent));
  const admin = await signedIn(browser, USERS.admin);
  await admin.goto("/contacts/new");
  const adminOptions = await admin.$$eval("#companyId option", (o) => o.map((x) => x.textContent));
  expect(adminOptions.length).toBeGreaterThan(options.length);
});

test("deal form validates and saves; weighted value uses stage probability", async ({ browser }) => {
  const p = await signedIn(browser, USERS.admin);
  await p.goto("/deals/new");
  await p.click("button[type=submit]");
  await expect(p.getByText("This field is required").first()).toBeVisible();
  await p.fill("#title", "E2E deal");
  await p.fill("#value", "10000");
  await p.click("button[type=submit]");
  await p.waitForURL(/\/deals\/c[^/]+$/);
  // toContainText normalises whitespace (the currency formatter uses a non-breaking space)
  await expect(p.locator("main")).toContainText("SAR 10,000");
  await expect(p.locator("main")).toContainText("SAR 1,000"); // weighted: Lead is 10%
  p.once("dialog", (d) => d.accept());
  await p.click("text=Delete");
  await p.waitForURL("**/deals");
});

test("Kanban: dragging a card to another stage persists after reload", async ({ browser }) => {
  const p = await signedIn(browser, USERS.admin, { width: 1500, height: 900 });
  await p.goto("/deals");
  await p.waitForSelector("section");
  const counts = async () => p.$$eval("section", (s) => s.map((x) => Number((x as HTMLElement).querySelector("h2")!.innerText.match(/\d+/)![0])));
  const before = await counts();
  const card = p.locator("section").nth(0).locator("div.cursor-grab").first();
  const title = await card.locator("a").innerText();
  const from = (await card.boundingBox())!;
  const target = (await p.locator("section").nth(1).boundingBox())!;
  await p.mouse.move(from.x + from.width / 2, from.y + 20);
  await p.mouse.down();
  await p.mouse.move(from.x + from.width / 2 + 20, from.y + 30, { steps: 5 });
  await p.mouse.move(target.x + target.width / 2, target.y + 150, { steps: 15 });
  await p.waitForTimeout(200);
  await p.mouse.up();
  await expect.poll(counts).toEqual([before[0] - 1, before[1] + 1, ...before.slice(2)]);
  await p.reload();
  await p.waitForSelector("section");
  expect(await counts()).toEqual([before[0] - 1, before[1] + 1, ...before.slice(2)]);
  await expect(p.locator("section").nth(1)).toContainText(title);
});
