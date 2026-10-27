import { execSync } from "node:child_process";
import { expect, type Browser, type Page } from "@playwright/test";

export const PASSWORD = "password123";
export const USERS = { admin: "admin@demo.com", manager: "manager@demo.com", rep1: "rep1@demo.com", rep2: "rep2@demo.com" } as const;

/** Wipes the database and loads the demo data (also clears sign-in throttling). */
export function reseed() {
  execSync("npm run db:seed", { cwd: process.cwd(), stdio: "pipe" });
}

export async function login(page: Page, email: string, password = PASSWORD) {
  await page.goto("/login");
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.click("button[type=submit]");
}

/** A fresh browser context (own cookies) already signed in. */
export async function signedIn(browser: Browser, email: string, viewport?: { width: number; height: number }) {
  const context = await browser.newContext({ baseURL: "http://localhost:3100", viewport: viewport ?? { width: 1300, height: 900 } });
  const page = await context.newPage();
  await login(page, email);
  await page.waitForURL("**/dashboard");
  return page;
}

export async function totalOf(page: Page, path: string) {
  await page.goto(path);
  const text = await page.locator("main").innerText();
  const m = text.match(/(\d+) total/);
  expect(m, `no "N total" on ${path}`).toBeTruthy();
  return Number(m![1]);
}

/** The number shown above a label in a stat card, e.g. statAbove(text, "Won deals"). */
export function statAbove(text: string, label: string) {
  const lines = text.split("\n").map((l) => l.trim());
  const i = lines.indexOf(label);
  return i > 0 ? lines[i - 1] : undefined;
}
