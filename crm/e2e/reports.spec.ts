import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { reseed, signedIn, statAbove, USERS } from "./helpers";

test.describe.configure({ mode: "serial" });
test.beforeAll(reseed);
const db = new PrismaClient();
test.afterAll(() => db.$disconnect());

const sar = (n: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "SAR", maximumFractionDigits: 0 }).format(n);
const sum = (a: { value: number }[]) => a.reduce((s, d) => s + d.value, 0);

/** Expected figures computed straight from the database, independent of the app's report code. */
async function expected(ownerEmail?: string) {
  const owner = ownerEmail ? (await db.user.findUnique({ where: { email: ownerEmail } }))!.id : undefined;
  const y = new Date().getFullYear();
  const deals = await db.deal.findMany({ where: owner ? { ownerId: owner } : {}, include: { stage: true } });
  const inYear = deals.filter((d) => d.expectedCloseDate && d.expectedCloseDate >= new Date(y, 0, 1) && d.expectedCloseDate <= new Date(y, 11, 31, 23, 59, 59));
  const won = inYear.filter((d) => d.stage.kind === "WON");
  const lost = inYear.filter((d) => d.stage.kind === "LOST");
  const open = deals.filter((d) => d.stage.kind === "OPEN");
  return {
    wonRevenue: sar(sum(won)),
    wonCount: String(won.length),
    lostCount: String(lost.length),
    winRate: `${Math.round((won.length / (won.length + lost.length)) * 100)}%`,
    avgWon: sar(won.length ? sum(won) / won.length : 0),
    openCount: String(open.length),
    openValue: sar(sum(open)),
    weighted: sar(open.reduce((s, d) => s + (d.value * d.stage.probability) / 100, 0)),
  };
}

test("sales report matches the database (admin)", async ({ browser }) => {
  const p = await signedIn(browser, USERS.admin);
  const e = await expected();
  await p.goto("/reports");
  const t = await p.locator("main").innerText();
  expect(statAbove(t, "Won revenue")).toBe(e.wonRevenue);
  expect(statAbove(t, "Won deals")).toBe(e.wonCount);
  expect(statAbove(t, "Lost deals")).toBe(e.lostCount);
  expect(statAbove(t, "Win rate")).toBe(e.winRate);
  expect(statAbove(t, "Average won deal")).toBe(e.avgWon);
});

test("pipeline report matches the database and has no date range", async ({ browser }) => {
  const p = await signedIn(browser, USERS.admin);
  const e = await expected();
  await p.goto("/reports?tab=pipeline");
  const t = await p.locator("main").innerText();
  expect(statAbove(t, "Open deals")).toBe(e.openCount);
  expect(statAbove(t, "Open value")).toBe(e.openValue);
  expect(statAbove(t, "Weighted forecast")).toBe(e.weighted);
  await expect(p.locator("select[name=range]")).toHaveCount(0);
});

test("reps see only their own figures and cannot widen the scope via the URL", async ({ browser }) => {
  const rep = await signedIn(browser, USERS.rep1);
  const admin = await signedIn(browser, USERS.admin);
  const e = await expected(USERS.rep1);
  await rep.goto("/reports");
  const t = await rep.locator("main").innerText();
  expect(statAbove(t, "Won revenue")).toBe(e.wonRevenue);
  await expect(rep.locator("select[name=ownerId]")).toHaveCount(0);
  expect(await rep.locator("table").first().locator("tbody tr").count()).toBe(1);

  await admin.goto("/reports");
  const owners = await admin.$$eval("select[name=ownerId] option", (o) => o.map((x) => (x as HTMLOptionElement).value).filter(Boolean));
  const adminId = (await db.user.findUnique({ where: { email: USERS.admin } }))!.id;
  expect(owners).toContain(adminId);
  await rep.goto(`/reports?ownerId=${adminId}`); // someone else's id in the URL must not widen the rep's scope
  expect(statAbove(await rep.locator("main").innerText(), "Won revenue")).toBe(e.wonRevenue);

  await rep.goto("/reports?tab=pipeline");
  const pt = await rep.locator("main").innerText();
  const ep = await expected(USERS.rep1);
  expect(statAbove(pt, "Open deals")).toBe(ep.openCount);
  expect(statAbove(pt, "Open value")).toBe(ep.openValue);
});

test("date range presets and bad custom ranges", async ({ browser }) => {
  const p = await signedIn(browser, USERS.admin);
  await p.goto("/reports?tab=sales&range=custom&from=2026-01-01&to=2026-01-31");
  expect(await p.inputValue("input[name=from]")).toBe("2026-01-01");
  expect(statAbove(await p.locator("main").innerText(), "Won deals")).toBe("0");
  await p.goto("/reports?tab=sales&range=custom&from=garbage&to=x");
  expect(await p.inputValue("select[name=range]")).toBe("thisYear"); // invalid range falls back safely
});

test("CSV export follows scope and filters; anonymous and unknown tabs are rejected", async ({ browser }) => {
  const admin = await signedIn(browser, USERS.admin);
  const rep = await signedIn(browser, USERS.rep1);
  const a = (await (await admin.request.get("/api/reports/sales?range=thisYear")).text()).replace("﻿", "").trim().split(/\r?\n/);
  expect(a[0]).toBe("Rep,Won,Revenue,Lost,Lost value,Win rate %,Average won deal,Open pipeline now");
  expect(a.length - 1).toBeGreaterThan(1);
  const r = (await (await rep.request.get("/api/reports/sales")).text()).trim().split(/\r?\n/);
  expect(r.length - 1).toBe(1);
  expect((await admin.request.get("/api/reports/bogus")).status()).toBe(404);
  const anon = await (await browser.newContext({ baseURL: "http://localhost:3100" })).request.get("/api/reports/sales", { maxRedirects: 0 });
  expect(anon.status()).toBe(307);
});
