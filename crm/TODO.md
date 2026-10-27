# TODO / open questions

## Open questions
- **Digits**: Arabic UI currently uses Latin digits (0-9) and Gregorian dates. Confirm that, or switch `INTL_TAG.ar` in `core/i18n/index.ts` to `ar-SA` for Arabic-Indic digits / Hijri.
- **Hosting**: local SQLite for now. Where will it run (VPS, Docker, Vercel + Supabase)? Decides the DB switch and file storage.
- **Fiscal calendar / week start**: calendar widget starts weeks on Sunday; dates are formatted `en-GB`.
- **Time zone**: due dates are interpreted in the *server's* time zone. Store a per-user or company time zone before multi-region use.
- **Data retention**: deletes are hard deletes (audit entry stays). Do you want soft delete / recycle bin?
- **Duplicate handling** on import: currently skips existing email (contacts) / name (companies). Merge instead?
- **Lost-reason / won-reason** on deals: not captured yet.
- **Closed date**: reports use the *expected* close date for won/lost deals. Add a `closedAt` (set when a deal enters a Won/Lost stage) for exact revenue timing?

## Planned features (not started)
- [x] Arabic translation + RTL layout (done; see README → Design for change)
- [ ] Native-speaker review of the Arabic wording (terminology such as pipeline/deal/stage) and of RTL polish on every screen
- [ ] Translate the demo seed data / default stage names, or ship an Arabic seed variant
- [x] Email: send/log from contact pages via SMTP, inbound webhook endpoint (done)
- [ ] Email v2: IMAP/Gmail/Microsoft Graph sync, attachments, HTML + signatures, templates/merge fields, open tracking
- [x] WhatsApp Cloud API: send text/template, inbound + delivery receipts, auto-create contacts (done, tested against a mock)
- [ ] WhatsApp v2: media in/out, a shared inbox view, template manager (list/sync approved templates), multiple numbers, conversation assignment
- [ ] Live verification of Email/WhatsApp with real accounts (only verified against local SMTP / mock Graph API so far)
- [x] Reports: sales / pipeline / activity with date ranges and CSV export (done)
- [ ] Reports v2: saved & scheduled reports, rep targets/quotas, charts for pipeline & activity, drill-down from a number to its deals, comparison with the previous period
- [x] Quotes / invoices with products catalogue, VAT, print sheet and ZATCA Phase 1 QR (done)
- [ ] ZATCA Phase 2 (XML, signing, clearance/reporting): needs onboarding credentials; credit/debit notes; server-side PDF; recurring invoices; payment links; per-line product units
- [x] Public REST API v1, API keys and signed webhooks (done)
- [ ] API v2 ideas: write access for quotes/invoices, bulk endpoints, idempotency keys, per-key rate limits in Redis, per-key resource scopes, webhook delivery redelivery button
- [ ] Notifications (email / push for due tasks), task reminders
- [ ] Files / attachments on records
- [ ] Custom-field filters on list pages, custom fields on activities
- [ ] Bulk actions (reassign owner, bulk delete, bulk tag)
- [ ] Tags / segments, lead scoring
- [ ] Teams / territories (rep sees their team's records)
- [x] Login rate limiting, admin temporary passwords with forced change, session revocation (done)
- [ ] Two-factor auth (authenticator app), password reset by email (needs an email provider), Content-Security-Policy
- [ ] Multi-tenant (add `organizationId` to every table + scope in `core/permissions`)
- [ ] PostgreSQL (change provider in `prisma/schema.prisma`, `DATABASE_URL`, run `prisma migrate`)
- [x] End-to-end test suite (`e2e/`, `npm run test:e2e`)
- [ ] Run the e2e suite in CI (build, seed a throwaway DB, `npm run test:e2e`) and add unit tests for `core/permissions` and `core/forms`

## Known limitations
- Browser-native pieces (date picker format, file chooser, required-field tooltips on Settings forms) follow the *browser* language, not the CRM language.
- Custom-field labels and dropdown options are entered once (one language). Per-language labels would need a translations column.
- Money is SAR-only; the `Deal.currency` column exists but the UI does not expose it.
- Pipeline column totals / dashboard sum raw values (fine while everything is SAR).
- Kanban ordering for users who only see part of a column is per-visible-set.
- Session cookie is a signed JWT (7 days). Revocation works through `User.sessionVersion` (password change, admin reset, sign out everywhere) and by deactivating the user; there is no per-device session list.
