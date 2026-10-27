# CRM

A clean, extensible CRM MVP: contacts, companies, deals pipeline (Kanban), activities & tasks, dashboard, users & roles, custom fields, CSV import/export and an audit log.

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS + shadcn-style components · Prisma + SQLite · Zod · `@dnd-kit` for the board.
Theme: navy / coral / white, light & dark mode. Currency: SAR.

## Quick start

```bash
cd crm
npm install
cp .env.example .env          # then set SESSION_SECRET (openssl rand -base64 32)
npm run db:reset              # creates the SQLite DB and loads demo data
npm run dev                   # http://localhost:3000
```

Demo logins (password `password123`):

| Email | Role | Sees |
|---|---|---|
| admin@demo.com | Admin | everything, manages users & settings |
| manager@demo.com | Manager | all records, no users/settings |
| rep1@demo.com / rep2@demo.com | Sales Rep | only their own records |

Other scripts: `npm run build`, `npm start`, `npm run typecheck`, `npm run lint`, `npm run db:seed` (re-seed; wipes data), `npx prisma studio`.

## Starting with your own data

The demo data is only for trying things out. To wipe it and start empty (one admin + the default pipeline stages):

```
ADMIN_EMAIL=you@company.com ADMIN_PASSWORD='a long password' ADMIN_NAME='Your Name' npm run db:init
```

Then sign in, set your company profile (Settings), add your team (Users), and import contacts/companies from CSV (Import / Export). **This deletes everything in the database.**

## Tests

End-to-end tests (Playwright) live in `e2e/` and cover sign-in and permissions, CRUD, the Kanban drag-and-drop, tasks and the dashboard (including a regression test for the edit-then-dashboard crash), users, settings and custom fields, CSV import/export, security (lockout, forced password change, session revocation), reports (figures are checked against the database), and Arabic/RTL.

```bash
npm run build          # tests run against the production build
npm run test:e2e       # starts `next start` on :3100 if it isn't already running
npm run test:e2e:ui    # interactive runner
```

**Warning:** each spec re-seeds the database (`npm run db:seed`), so run them against your dev database only, never real data. The first time on a new machine you may need `npx playwright install chromium`.

## What's in it

| Module | Route | Notes |
|---|---|---|
| Dashboard | `/dashboard` | open deals, pipeline value, tasks due today/overdue, revenue & forecast, top reps, calendar, recent activity |
| Contacts | `/contacts` | search, filters, detail page with activity timeline + change history |
| Companies | `/companies` | linked contacts, deals, timeline |
| Deals | `/deals` | drag-and-drop Kanban; value, owner, expected close |
| Tasks | `/tasks` | calls, meetings, notes, follow-ups; due dates; assignee; quick-add on record pages |
| Users | `/users` | Admin only |
| Settings | `/settings` | Admin only: pipeline stages, custom fields |
| Products | `/products` | Price catalogue (managers/admins edit; reps read) |
| Quotes | `/quotes` | Line items with live VAT totals, status flow (draft → sent → accepted/rejected), print/PDF, "Create quote" from a deal, create an invoice from an accepted quote |
| Invoices | `/invoices` | Draft → issued → paid/cancelled; gap-free numbers assigned at issue; issued invoices are locked; bilingual print sheet with ZATCA QR |
| Integrations | `/settings/integrations` | Admin: SMTP email and WhatsApp Business setup |
| API & webhooks | `/settings/api` | Admin: API keys, webhooks, delivery log, quick-start |
| Reports | `/reports` | Sales (won revenue, win rate, by rep, by lead source), Pipeline (by stage, weighted forecast by close month, largest open deals), Activity (calls/meetings/tasks per rep); date range + owner filters; CSV export per tab |
| Import/Export | `/import-export` | CSV with column mapping + preview; export includes custom fields |
| Search | `/search` | global search box in the header |

## Quotes, invoices and Saudi e-invoicing

- Set the seller details in **Settings → Company profile**: English/Arabic name, **15-digit VAT number**, CR number, address, bank details, default VAT (15%), quote validity and payment terms. Invoices cannot be issued until a valid VAT number and a name are set.
- **VAT maths** is done per line and rounded to halalas (`src/modules/billing/totals.ts`); discounts are per line; totals show a VAT breakdown by rate.
- **Numbering:** quotes get `Q-<year>-0001` when created. Invoices get `INV-<year>-0001` **only when issued**, so the tax-invoice sequence has no gaps even if drafts are deleted. Issued invoices can't be edited or deleted; they can be marked paid or cancelled.
- **Printing:** the *Print / Save as PDF* button opens a clean, bilingual (English / Arabic) sheet; use the browser's print dialog to save a PDF. There is no server-side PDF generator.
- **ZATCA Phase 1:** issued invoices carry the QR code (base64 TLV: seller name, VAT number, timestamp, total, VAT amount). **Phase 2 is not implemented** (UBL XML, cryptographic stamp, hash chain, clearance/reporting through ZATCA's API). That needs your ZATCA onboarding (CSID) and certificate, so it can't be done without your credentials. Until then, check with your accountant whether Phase 1 is enough for your invoice type.
- Permissions: reps create and edit their own quotes; invoices are read-only for reps (managers/admins issue them).

## Public API and webhooks

- **REST API** under `/api/v1` (OpenAPI spec at `/api/v1/openapi.json`): contacts, companies, deals, tasks (create, read, update, delete), quotes and invoices (read-only), plus `/stages` and `/me`. JSON in/out, `page`/`limit` (max 100) pagination, `q` search, `updated_since`, field filters, custom fields under `custom`, errors as `{ "error": { "code", "message", "fields" } }`.
- **Keys** are created by an admin in *Settings → API & webhooks*. A key **acts as a user**: it has that user's role and sees only that user's records (a rep's key can't read other reps' data), and a *Read only* key can't modify anything. Keys are shown once and stored only as a SHA-256 hash; revoke or disable the user to cut access immediately. Limit: 120 requests/minute per key (in-memory, single server).
- **Webhooks:** the CRM POSTs a JSON event (`contact.created`, `deal.moved`, `invoice.issued`, … see the OpenAPI description) to your https URL. Each request is signed: header `X-CRM-Signature: t=<unix>,v1=<hex>` where `v1 = HMAC_SHA256(secret, "<t>.<raw body>")`; reject old timestamps. Failed deliveries are retried twice (2 s, 10 s) and logged. Secrets are stored encrypted. Events come from the audit log, so they fire for changes made in the app **and** through the API.
- **Safety:** webhook URLs must be https and may not point at private/internal addresses (SSRF guard, redirects are not followed). For local development/tests set `WEBHOOK_ALLOW_PRIVATE=1`.

```bash
curl https://your-crm/api/v1/contacts?limit=5 -H "Authorization: Bearer crm_live_…"
curl -X PATCH https://your-crm/api/v1/deals/<id> -H "Authorization: Bearer crm_live_…" \
     -H "Content-Type: application/json" -d '{"stageId":"<id from /api/v1/stages>"}'
```

## Email and WhatsApp (Settings → Integrations)

Both channels log to the **contact's timeline** (Contacts → open a contact → *Send email* / *Send WhatsApp message*). Secrets (SMTP password, WhatsApp token and app secret) are stored **encrypted** with a key derived from `SESSION_SECRET`: if you rotate that secret, re-enter them.

**Email (SMTP)**
- *Sending:* enter your SMTP host/port/user/password and a From address (Gmail/Microsoft 365 app passwords, SES, Mailgun, … all work). Reps can email their own contacts; limit 30 emails per user per hour. A message is logged only if the SMTP server accepted it. "Only log in the timeline" records an email you sent elsewhere.
- *Receiving:* the CRM can also poll mailboxes over IMAP (see *Mailbox sync* below), or you can point your mail provider's inbound webhook, or a Zapier/Make/n8n step, at `POST /api/inbound/email` with `Authorization: Bearer <token>` (shown on the page; regenerate to rotate) and JSON `{ "from", "subject", "text" | "html", "messageId", "date" }`. Mail from addresses that match a contact (case-insensitive) is added to that contact's timeline; anything else is ignored. Repeated `messageId`s are ignored, so retries are safe.
- Not included: attachments, HTML composing, open/click tracking, threading.

**WhatsApp (Meta Cloud API)**
- Create a Meta developer app with the WhatsApp product, then enter the *Phone number ID*, a (permanent) *access token* and the *app secret*. In Meta → WhatsApp → Configuration set the callback URL and verify token shown on the page and subscribe to `messages`.
- *Sending:* free text is only allowed within **24 hours of the customer's last message** (a WhatsApp rule); otherwise use an **approved template** (create and approve templates in Meta's dashboard, then enter its name, language and variables). Delivery receipts (sent → delivered → read, or failed) update the timeline entry.
- *Receiving:* messages are matched to contacts by phone number (stored numbers are normalized with the *default country code*, so `0533548549`, `+966 53 354 8549` and `966533548549` match). Unknown numbers are ignored, or, if you enable it, create a new contact (source *WhatsApp*) owned by the chosen user. Webhook requests are rejected unless their `X-Hub-Signature-256` signature is valid.
- Not included: sending/receiving media (incoming media shows as a placeholder like `[Image]`), interactive/list messages, multiple numbers.
- `WHATSAPP_API_BASE` (env, default `https://graph.facebook.com/v21.0`) lets you pin another Graph API version or point at a mock.

> **Verification status:** both integrations are covered by automated tests against a real local SMTP server and a local stand-in for Meta's Graph API. They have **not** been run against a live mail provider or a live WhatsApp Business account (that needs your credentials), so do a real send/receive check after configuring.

## Mailbox sync (IMAP)

Settings → Integrations → *Mailbox sync* (admin only) pulls mail from an IMAP mailbox into contact timelines.

- Add host, port, encryption (TLS / STARTTLS), username and password (use an **app password**; Gmail/Microsoft OAuth is not supported). The connection is tested before saving; the password is stored encrypted.
- *Folders*: comma list, default `INBOX,[sent]` (`[sent]` resolves via the `\Sent` special-use flag or common names). INBOX mail matches the **From** address; Sent mail matches **To/Cc**. One timeline entry per matched contact; unmatched mail is ignored.
- *Lookback* applies to the first sync only; later runs are incremental per folder (UID + UIDVALIDITY), at most 200 messages per run.
- A mailbox can be shared (matches every contact) or owned by one user (matches only that user's contacts).
- Read-only: the CRM never sets flags, moves or deletes mail. Attachments are not stored, only their names. Duplicates are skipped across IMAP, SMTP send and the inbound webhook.
- Runs every `MAIL_SYNC_INTERVAL_SECONDS` (default 300, `0` disables) plus a "Sync now" button. Single-node timer only.
- `MAIL_ALLOW_PRIVATE=1` allows private/loopback hosts and unencrypted connections (dev/tests only).
- Verified only against a local IMAP test server, not a live provider.

## Report definitions

- **Sales**: deals are counted by their *expected close date* falling in the chosen period; **won/lost** is the deal's *current stage kind*. (There is no separate "closed on" date yet; see `TODO.md`.) Win rate = won ÷ (won + lost). Average deal = won revenue ÷ won deals.
- **Pipeline**: a snapshot of *open* deals right now (the date range does not apply). Weighted = value × stage probability. Forecast groups open deals by expected close month (overdue / next 12 months / later / no date).
- **Activity**: activities counted by *created* date, completed tasks by *completed* date, overdue = open tasks whose due date has passed (now).
- Reps see only their own numbers; managers/admins can filter by owner. The CSV export applies the same filters and permissions.

## Roles & permissions

Defined in one matrix: `src/core/permissions/index.ts`.

- **Admin**: everything. **Manager**: all records, import/export; no users/settings. **Sales Rep**: only records they own (or tasks assigned to them).
- Enforced **on the server**: every page and server action calls `requireUser()` / `requireAccess()` and then `scope()` (adds `ownerId = me` to queries for reps) or `assertOwns()` (single record). Records you may not see return 404, so existence isn't leaked. Hidden buttons are cosmetic only.
- Deactivating a user takes effect immediately (the user row is checked on every request). The last active admin can't be removed.

## Project layout

```
prisma/schema.prisma      data model (sections per module), seed.ts demo data
src/app/                  routes only (thin): (auth)/login, (app)/<module>, api/export
src/modules/<name>/       self-contained module: schema.ts (Zod) · queries.ts · actions.ts (server actions) · components/
src/modules/registry.ts   module manifest → sidebar + role gating
src/core/                 shared plumbing: db, auth, permissions, audit, custom-fields, i18n, forms helpers
src/components/           UI primitives (ui/), layout, shared forms
```

## Design for change

- **Custom fields are data, not columns.** `CustomFieldDef` (what fields exist) + `CustomFieldValue` (JSON value per record). `core/custom-fields` parses, validates and saves them; forms/detail pages render them automatically. Add one in **Settings → Custom fields**, no code.
- **Arabic + RTL are built in.** Switch language with the button in the header (or on the login page); the choice is stored in a cookie (`crm_locale`). The page `lang`/`dir` follow it, the sidebar and all layouts mirror, and Arabic uses Noto Sans Arabic (bundled at build time by `next/font`, so the first `npm run build` needs internet access).
  - All text lives in `src/core/i18n/en.ts` and `ar.ts`. `ar.ts` is typed against `en.ts`, so a missing key is a compile error.
  - Server code: `const t = await getT()` (from `@/core/i18n/server`). Client components: `const t = useT()` (from `@/core/i18n/client`). Placeholders: `t.tpl(t.dashboard.welcome, { name })`.
  - `t.money()`, `t.date()`, `t.dateTime()` format for the current language (Gregorian dates and Latin digits in Arabic, so phone numbers and SAR amounts stay unambiguous).
  - Validation messages in Zod schemas are written as `"err:<key>"` and translated where they are shown (`zodErrors(error, t)`).
  - Layout uses logical Tailwind classes (`ms-`, `ps-`, `text-start`, `rounded-e-`); emails/phones/URLs/numbers inputs are forced LTR, free text uses `dir="auto"`; the revenue chart's time axis stays left-to-right.
  - **To add another language** (e.g. Urdu): copy `ar.ts` to `ur.ts`, translate, add it to `LOCALES`/`dictionaries`/`INTL_TAG` (and `RTL_LOCALES` if right-to-left) in `core/i18n/index.ts`, and add its name to `LOCALE_NAMES`.
  - Data typed by users (stage names, custom-field labels, company names, notes) is stored as entered and is never translated. The demo seed data is in English.
- **Audit log.** Every create/update/delete/move/import/export calls `logAudit()` (`core/audit`). Updates store a per-field `{from,to}` diff. Shown as "Change history" on records.
- **Colours** are CSS variables in `src/app/globals.css`; **money format** is in `src/lib/utils.ts`.
- **Database**: SQLite for dev. For PostgreSQL change `provider` in `prisma/schema.prisma`, set `DATABASE_URL`, then `npx prisma migrate dev`. Roles/types are plain strings validated by Zod (no DB enums) so they can grow without migrations.

## How to add a new module

Example: a "Products" module.

1. **Schema**: add a `Product` model to `prisma/schema.prisma` (new section), then `npx prisma db push`.
2. **Permission**: add `"product"` to `Resource` in `src/core/permissions/index.ts` and a grant per role in the matrix.
3. **Module folder** `src/modules/products/`:
   - `schema.ts`: Zod schema for the form.
   - `queries.ts`: list/get functions; always apply `scope(user, "product")` and use `canAccess()` for single records.
   - `actions.ts`: `"use server"` create/update/delete. Pattern: `requireUser()` → `assertCan/assertOwns` → Zod parse → write → `logAudit()` → `revalidatePath` → `redirect`. Copy `modules/companies/actions.ts`.
   - `components/product-form.tsx`: use `ActionForm` + `Field` (`components/forms/action-form.tsx`).
4. **Routes**: `src/app/(app)/products/{page,new/page,[id]/page,[id]/edit/page}.tsx`. Copy the companies routes.
5. **Navigation**: add an entry to `src/modules/registry.ts` (label from `i18n/en.ts`, icon, `resource: "product"`).
6. **Text**: add a `products` section to **both** `src/core/i18n/en.ts` and `ar.ts`, and use it via `getT()` / `useT()`. Never hard-code UI text in components.
7. **Custom fields (optional)**: add `"PRODUCT"` to `ENTITIES` in `core/custom-fields`, call `getFieldDefs/parseCustomFields/saveFieldValues` in the actions and render `<CustomFieldInputs>` in the form.
8. **Seed (optional)**: add rows to `prisma/seed.ts`.

## Security notes

- Passwords are hashed with bcrypt. The session is a signed, httpOnly, sameSite=lax JWT cookie. Set a strong `SESSION_SECRET` in production and serve over HTTPS.
- **Sign-in throttling:** 5 failed attempts per email (or 25 per IP) in 15 minutes locks sign-in for the rest of the window, even with the right password. Unknown emails are throttled identically, so lockouts don't reveal which accounts exist. Attempts live in the `LoginAttempt` table (fine for one server; use Redis if you scale out). The IP comes from `x-forwarded-for`, so only trust it behind a proxy that sets that header.
- **Temporary passwords:** admins can set or generate (**Generate** button, 14 random characters) a password for a user and tick *Require a new password at next sign-in*. That user can't open anything else until they choose their own at `/change-password`. Users can change their password any time by clicking their avatar.
- **Session revocation:** every user has a `sessionVersion`. Changing a password, an admin reset, or **Sign out of all devices** (user edit page) bumps it, which invalidates all of that user's existing cookies. Deactivating a user also takes effect immediately.
- **Password rules:** at least 8 characters, not a very common password, must not contain the email name. See `src/core/auth/password-policy.ts`.
- Admins see each user's recent sign-ins (successes and failures, with IP) on the user's edit page; sign-ins and password changes are in the audit log.
- Security headers (`X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`) are set in `next.config.mjs`. A Content-Security-Policy is not set yet.
- CSV export escapes formula-leading characters (`= + - @`) to prevent spreadsheet injection.
- Server actions validate all input with Zod and re-check permissions; links to other records (company/contact/deal) are checked for access too.
- Not yet included: password reset by email (needs an email provider), two-factor authentication, CSP.

See `TODO.md` for open questions and planned features.
