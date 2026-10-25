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
| Import/Export | `/import-export` | CSV with column mapping + preview; export includes custom fields |
| Search | `/search` | global search box in the header |

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
- **All text lives in `src/core/i18n/en.ts`.** To add Arabic: add `ar.ts` with the same shape, register it in `core/i18n/index.ts`, add `"ar"` to `Locale`, read the locale from a cookie in `app/layout.tsx` (it already sets `lang` and `dir`). Layout uses logical classes (`ms-`, `ps-`, `text-start`) so RTL flips cleanly.
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
6. **Text**: add labels under a `products` key in `src/core/i18n/en.ts`.
7. **Custom fields (optional)**: add `"PRODUCT"` to `ENTITIES` in `core/custom-fields`, call `getFieldDefs/parseCustomFields/saveFieldValues` in the actions and render `<CustomFieldInputs>` in the form.
8. **Seed (optional)**: add rows to `prisma/seed.ts`.

## Security notes

- Passwords hashed with bcrypt; session = signed, httpOnly, sameSite=lax JWT cookie. Set a strong `SESSION_SECRET` in production and serve over HTTPS.
- CSV export escapes formula-leading characters (`= + - @`) to prevent spreadsheet injection.
- Server actions validate all input with Zod and re-check permissions; links to other records (company/contact/deal) are checked for access too.
- Not yet included: password reset, 2FA, login rate limiting (see `TODO.md`).

See `TODO.md` for open questions and planned features.
