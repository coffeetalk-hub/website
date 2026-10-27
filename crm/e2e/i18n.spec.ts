import { test, expect } from "@playwright/test";
import { reseed, signedIn, USERS } from "./helpers";

test.describe.configure({ mode: "serial" });
test.beforeAll(reseed);

const html = (p: import("@playwright/test").Page) => p.evaluate(() => `${document.documentElement.lang}/${document.documentElement.dir}`);

test("language switch flips lang/dir, persists across pages and sign-in, and switches back", async ({ browser }) => {
  const ctx = await browser.newContext({ baseURL: "http://localhost:3100" });
  const p = await ctx.newPage();
  await p.goto("/login");
  expect(await html(p)).toBe("en/ltr");
  await p.click("button[aria-label=Language]");
  await expect.poll(() => html(p)).toBe("ar/rtl");
  await p.fill("#email", USERS.admin);
  await p.fill("#password", "password123");
  await p.click("button[type=submit]");
  await p.waitForURL("**/dashboard");
  expect(await html(p)).toBe("ar/rtl");
  await expect(p.locator("h1")).toContainText("مرحبًا");
  await p.goto("/deals");
  expect(await html(p)).toBe("ar/rtl");
  await p.click("button[aria-label='اللغة']");
  await expect.poll(() => html(p)).toBe("en/ltr");
  await expect(p.locator("h1")).toHaveText("Deals");
});

test("Arabic: validation and confirm messages are translated, Arabic input round-trips", async ({ browser }) => {
  const p = await signedIn(browser, USERS.admin);
  await p.click("button[aria-label=Language]");
  await expect.poll(() => html(p)).toBe("ar/rtl");
  await p.goto("/contacts/new");
  await p.click("button[type=submit]");
  await expect(p.getByText("هذا الحقل مطلوب").first()).toBeVisible();
  await p.fill("#firstName", "علي");
  await p.fill("#lastName", "الغامدي");
  await p.fill("#email", "bad");
  await p.click("button[type=submit]"); // native browser validation is off, so the translated server message shows
  await expect(p.getByText("أدخل بريدًا إلكترونيًا صحيحًا")).toBeVisible();
  expect(await p.inputValue("#firstName")).toBe("علي");
  await p.fill("#email", "ali@test.sa");
  await p.click("button[type=submit]");
  await p.waitForURL(/\/contacts\/c[^/]+$/);
  await expect(p.locator("h1")).toHaveText("علي الغامدي");
  let confirmText = "";
  p.once("dialog", (d) => {
    confirmText = d.message();
    d.accept();
  });
  await p.click("text=حذف");
  await p.waitForURL("**/contacts");
  expect(confirmText).toContain("هل تريد حذف هذا السجل");
});

test("Arabic: every app screen has no untranslated UI text and no horizontal overflow on a phone", async ({ browser }) => {
  const p = await signedIn(browser, USERS.admin, { width: 390, height: 844 });
  await p.click("button[aria-label=Language]");
  await expect.poll(() => html(p)).toBe("ar/rtl");
  // words that are record data, not UI text
  const data = /^(Amal|Al-\w+|Mansour|Rakan|Reem|Lead|Qualified|Proposal|Negotiation|Won|Lost|Preferred|language|Birthday|Employees|Account|tier|Contract|term|months|Main|competitor|English|Arabic)$/i;
  for (const path of ["/dashboard", "/reports", "/reports?tab=pipeline", "/reports?tab=activity", "/users", "/settings", "/import-export", "/contacts/new", "/tasks/new", "/change-password"]) {
    await p.goto(path);
    const text = await p.locator("main").innerText();
    const latin = [...new Set(text.match(/[A-Za-z][A-Za-z'’-]{3,}/g) ?? [])].filter((w) => !data.test(w));
    const names = /Rajhi|Logistics|Eastern|Petrochem|Falcon|Construction|Gulf|Marine|Works|Hejaz|Telecom|Nakheel|Trading|Tuwaiq|Software|Red|Sea|Hospitality|Madar|Healthcare|Najd|Foods|Oasis|Education|Group|Sahara|Real|Estate|Services|Energy|Food|Beverage|Pipeline|monitoring|Cloud|migration|Send|proposal|Follow|contract|ERP|implementation|Property|CRM|Training|programme|Security|audit|Customer|app|Supply|chain|portal|Confirm|meeting|time|Kiosk|deployment|Warehouse|automation|Vessel|tracking|Network|upgrade|Hotel|booking|platform|Site|safety|system|Fleet|rollout|Annual|maintenance|Data|analytics|pilot|IoT|sensors|Clinic|management|suite|learning|Pricing|discussion|Abdullah|Fahad|Sara|Noura|Khalid|Layla|Omar|Huda|Turki|Maha|Saud|Dalal|Yousef|Lama|Faisal|Shehri|Ghamdi|Mutairi|Zahrani|Subaie|Anazi|Harthi|Shammari|Bakr|Hakeem|Admin|admin|demo|manager|User|Test/i;
    expect(latin.filter((w) => !names.test(w)), `untranslated text on ${path}`).toEqual([]);
    expect(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth), `overflow on ${path}`).toBe(false);
  }
});
