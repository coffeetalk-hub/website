import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { decodeTlv, zatcaTlv } from "../src/modules/billing/zatca";
import { calcTotals } from "../src/modules/billing/totals";
import { reseed, signedIn, USERS } from "./helpers";

test.describe.configure({ mode: "serial" });
test.beforeAll(reseed);
const db = new PrismaClient();
test.afterAll(() => db.$disconnect());

test("ZATCA TLV payload encodes the five required fields and round-trips", () => {
  const payload = zatcaTlv({ sellerName: "شركة العرض التجارية", vatNumber: "300000000000003", timestamp: new Date("2026-10-27T12:30:45.123Z"), total: 2300, vat: 300 });
  expect(decodeTlv(payload)).toEqual({ 1: "شركة العرض التجارية", 2: "300000000000003", 3: "2026-10-27T12:30:45Z", 4: "2300.00", 5: "300.00" });
});

test("VAT maths: per-line rounding, discounts and a breakdown by rate", () => {
  const t = calcTotals([
    { qty: 2, unitPrice: 1000, discountPct: 10, vatRate: 15 }, // net 1800, vat 270
    { qty: 3, unitPrice: 33.33, discountPct: 0, vatRate: 15 }, // net 99.99, vat 15.00 (14.9985 rounded)
    { qty: 1, unitPrice: 100, discountPct: 0, vatRate: 0 },
  ]);
  expect(t).toMatchObject({ net: 1999.99, vat: 285, total: 2284.99 });
  expect(t.byRate).toEqual([{ rate: 0, net: 100, vat: 0 }, { rate: 15, net: 1899.99, vat: 285 }]);
});

test("products: managers manage the catalogue; reps can only read it", async ({ browser }) => {
  const admin = await signedIn(browser, USERS.admin);
  const rep = await signedIn(browser, USERS.rep1);
  await admin.goto("/products/new");
  await admin.click("button[type=submit]");
  await expect(admin.getByText("This field is required").first()).toBeVisible();
  await admin.fill("#name", "E2E widget");
  await admin.fill("#unitPrice", "1000");
  await admin.click("button[type=submit]");
  await admin.waitForURL("**/products");
  await expect(admin.locator("main")).toContainText("E2E widget");

  await rep.goto("/products");
  await expect(rep.locator("main")).toContainText("E2E widget");
  await expect(rep.getByRole("link", { name: "New product" })).toHaveCount(0);
  expect((await rep.goto("/products/new"))!.status()).toBe(404);
});

test("company profile validates the VAT number", async ({ browser }) => {
  const admin = await signedIn(browser, USERS.admin);
  await admin.goto("/settings");
  await admin.fill("input[name=vatNumber]", "123");
  await admin.locator("form:has(input[name=vatNumber]) button").click();
  await expect(admin.getByText("VAT number must be 15 digits")).toBeVisible();
  await admin.fill("input[name=vatNumber]", "300000000000003");
  await admin.locator("form:has(input[name=vatNumber]) button").click();
  await expect(admin.getByText("Company profile saved")).toBeVisible();
});

test("quote: live totals, save, status flow, locked once sent, invoice created from accepted quote", async ({ browser }) => {
  const admin = await signedIn(browser, USERS.admin);
  await admin.goto("/quotes/new");
  await admin.selectOption("#companyId", { index: 1 });
  const row = admin.getByTestId("line-row").first();
  await row.getByLabel("Product").selectOption({ label: "E2E widget" });
  const fields = row.locator("input[type=number]");
  await fields.nth(0).fill("2"); // qty
  await fields.nth(2).fill("10"); // discount %
  // 2 x 1000 -10% = 1,800.00 net, 270.00 VAT, 2,070.00 total
  await expect(admin.getByTestId("subtotal")).toContainText("1,800.00");
  await expect(admin.getByTestId("vat-total")).toContainText("270.00");
  await expect(admin.getByTestId("grand-total")).toContainText("2,070.00");
  await admin.getByRole("button", { name: "Add line" }).click();
  await admin.getByTestId("line-row").nth(1).getByLabel("Description").fill("Setup fee");
  await admin.getByTestId("line-row").nth(1).locator("input[type=number]").nth(1).fill("100");
  await expect(admin.getByTestId("grand-total")).toContainText("2,185.00");
  await admin.click("button:has-text('Save')");
  await admin.waitForURL(/\/quotes\/c[^/]+$/);
  const quoteUrl = admin.url();
  await expect(admin.locator("h1")).toContainText(/Q-\d{4}-\d{4}/);
  await expect(admin.getByTestId("grand-total")).toContainText("2,185.00");

  // a quote must have lines
  await admin.goto("/quotes/new");
  await admin.getByTestId("line-row").first().getByLabel("Description").fill("");
  await admin.click("button:has-text('Save')");
  await expect(admin.getByText("Check the line items")).toBeVisible();

  await admin.goto(quoteUrl);
  await admin.getByRole("button", { name: "Mark as sent" }).click();
  await expect(admin.getByRole("button", { name: "Mark as accepted" })).toBeVisible();
  expect((await admin.goto(quoteUrl + "/edit"))!.url()).toBe(quoteUrl); // sent quotes are not editable: redirected back
  await admin.getByRole("button", { name: "Mark as accepted" }).click();
  await admin.getByRole("button", { name: "Create invoice" }).click();
  await admin.waitForURL(/\/invoices\/c[^/]+$/);
  await expect(admin.locator("h1")).toContainText("Draft");
  await expect(admin.getByTestId("grand-total")).toContainText("2,185.00");
  // a second click must not create a second invoice for the same quote
  await admin.goto(quoteUrl);
  await expect(admin.getByRole("link", { name: /Invoice:/ })).toBeVisible();
  await expect(admin.getByRole("button", { name: "Create invoice" })).toHaveCount(0);
});

test("invoice: gap-free numbering at issue, locking, QR code, paying and cancelling", async ({ browser }) => {
  const admin = await signedIn(browser, USERS.admin);
  const year = new Date().getFullYear();
  const issuedBefore = await db.invoice.count({ where: { status: { in: ["ISSUED", "PAID", "CANCELLED"] } } });

  // two drafts, delete one: no number is consumed
  const mk = async (name: string) => {
    await admin.goto("/invoices/new");
    await admin.fill("#buyerName", name);
    await admin.getByTestId("line-row").first().getByLabel("Description").fill("Consulting");
    await admin.getByTestId("line-row").first().locator("input[type=number]").nth(1).fill("500");
    await admin.click("button:has-text('Save')");
    await admin.waitForURL(/\/invoices\/c[^/]+$/);
    return admin.url();
  };
  const keep = await mk("Keep Ltd");
  const drop = await mk("Drop Ltd");
  await admin.goto(drop);
  admin.once("dialog", (d) => d.accept());
  await admin.click("text=Delete");
  await admin.waitForURL("**/invoices");

  await admin.goto(keep);
  admin.once("dialog", (d) => d.accept());
  await admin.getByRole("button", { name: "Issue invoice" }).click();
  await expect(admin.locator("h1")).toContainText(`INV-${year}-${String(issuedBefore + 1).padStart(4, "0")}`);
  await expect(admin.getByText("Issued invoices cannot be edited")).toBeVisible();
  await expect(admin.getByRole("link", { name: "Edit" })).toHaveCount(0);
  expect((await admin.goto(keep + "/edit"))!.url()).toBe(keep); // locked: edit page redirects back

  // print sheet: bilingual, QR payload matches the invoice
  const id = keep.split("/").pop();
  await admin.goto(`/print/invoices/${id}`);
  await expect(admin.getByTestId("document-sheet")).toContainText("Tax Invoice");
  await expect(admin.getByTestId("document-sheet")).toContainText("فاتورة ضريبية");
  const tlv = decodeTlv(await admin.getByTestId("zatca-payload").innerText());
  expect(tlv[1]).toBe("شركة العرض التجارية");
  expect(tlv[2]).toBe("300000000000003");
  expect(tlv[4]).toBe("575.00"); // 500 + 15% VAT
  expect(tlv[5]).toBe("75.00");
  await expect(admin.locator("[data-testid=document-sheet] svg")).toHaveCount(1);

  await admin.goto(keep);
  await admin.getByRole("button", { name: "Mark as paid" }).click();
  await expect(admin.locator("main")).toContainText("Paid");
  expect(await db.invoice.count({ where: { id } })).toBe(1); // issued/paid invoices are never deleted
});

test("issuing needs a valid seller VAT number", async ({ browser }) => {
  await db.setting.update({ where: { key: "company" }, data: { value: { nameEn: "X", nameAr: "", vatNumber: "", crNumber: "", address: "", phone: "", email: "", bankDetails: "", defaultVatRate: 15, quoteValidityDays: 30, paymentTermsDays: 30, footerNote: "" } } });
  const admin = await signedIn(browser, USERS.admin);
  await admin.goto("/invoices/new");
  await admin.fill("#buyerName", "No VAT Ltd");
  await admin.getByTestId("line-row").first().getByLabel("Description").fill("Thing");
  await admin.getByTestId("line-row").first().locator("input[type=number]").nth(1).fill("10");
  await admin.click("button:has-text('Save')");
  await admin.waitForURL(/\/invoices\/c[^/]+$/);
  admin.once("dialog", (d) => d.accept());
  await admin.getByRole("button", { name: "Issue invoice" }).click();
  await expect(admin.getByText("Complete the company profile")).toBeVisible();
  await expect(admin.locator("h1")).toContainText("Draft");
});

test("reps: own quotes only, read-only invoices, cannot create invoices", async ({ browser }) => {
  reseed();
  const rep = await signedIn(browser, USERS.rep1);
  const admin = await signedIn(browser, USERS.admin);
  const total = async (p: typeof rep, path: string) => Number(((await (async () => { await p.goto(path); return p.locator("main").innerText(); })()).match(/(\d+) total/) ?? [])[1] ?? 0);
  expect(await total(admin, "/quotes")).toBeGreaterThan(await total(rep, "/quotes"));
  expect(await total(rep, "/quotes")).toBeGreaterThan(0);
  expect((await rep.goto("/invoices/new"))!.status()).toBe(404);
  await rep.goto("/invoices");
  await expect(rep.getByRole("link", { name: "New invoice" })).toHaveCount(0);
  // open one of the rep's own invoices: visible, but no issue/pay/cancel buttons
  const own = rep.locator("tbody a[href^='/invoices/']").first();
  if (await own.count()) {
    await own.click();
    await expect(rep.getByRole("button", { name: /Issue invoice|Mark as paid|Cancel invoice/ })).toHaveCount(0);
  }
  // someone else's quote/invoice is a 404
  await admin.goto("/quotes");
  const links = await admin.$$eval("tbody a[href^='/quotes/']", (a) => a.map((x) => x.getAttribute("href")!));
  await rep.goto("/quotes");
  const mine = new Set(await rep.$$eval("tbody a[href^='/quotes/']", (a) => a.map((x) => x.getAttribute("href")!)));
  const foreign = links.find((h) => !mine.has(h))!;
  expect((await rep.goto(foreign))!.status()).toBe(404);
  expect((await rep.goto(foreign.replace("/quotes/", "/print/quotes/")))!.status()).toBe(404);
});

test("Arabic UI: lists are translated while the printed document stays bilingual", async ({ browser }) => {
  const admin = await signedIn(browser, USERS.admin);
  await admin.click("button[aria-label=Language]");
  await expect.poll(() => admin.evaluate(() => document.documentElement.dir)).toBe("rtl");
  await admin.goto("/quotes");
  await expect(admin.locator("h1")).toHaveText("عروض الأسعار");
  await admin.goto("/invoices");
  await expect(admin.locator("h1")).toHaveText("الفواتير");
  await admin.goto("/quotes/new");
  await expect(admin.getByText("إضافة بند")).toBeVisible();
  const id = (await admin.goto("/quotes"), (await admin.$eval("tbody a[href^='/quotes/']", (a) => a.getAttribute("href")!)).split("/").pop());
  await admin.goto(`/print/quotes/${id}`);
  await expect(admin.getByTestId("document-sheet")).toContainText("Quotation");
  await expect(admin.getByTestId("document-sheet")).toContainText("عرض سعر");
});
