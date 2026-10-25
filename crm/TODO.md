# TODO / open questions

## Open questions
- **Digits**: Arabic UI currently uses Latin digits (0-9) and Gregorian dates. Confirm that, or switch `INTL_TAG.ar` in `core/i18n/index.ts` to `ar-SA` for Arabic-Indic digits / Hijri.
- **Hosting**: local SQLite for now. Where will it run (VPS, Docker, Vercel + Supabase)? Decides the DB switch and file storage.
- **Fiscal calendar / week start**: calendar widget starts weeks on Sunday; dates are formatted `en-GB`.
- **Time zone**: due dates are interpreted in the *server's* time zone. Store a per-user or company time zone before multi-region use.
- **Data retention**: deletes are hard deletes (audit entry stays). Do you want soft delete / recycle bin?
- **Duplicate handling** on import: currently skips existing email (contacts) / name (companies). Merge instead?
- **Lost-reason / won-reason** on deals: not captured yet.

## Planned features (not started)
- [x] Arabic translation + RTL layout (done; see README → Design for change)
- [ ] Native-speaker review of the Arabic wording (terminology such as pipeline/deal/stage) and of RTL polish on every screen
- [ ] Translate the demo seed data / default stage names, or ship an Arabic seed variant
- [ ] Email integration (send/log email from contact page, IMAP/Gmail sync)
- [ ] WhatsApp integration (Business API: message log on timeline, templates)
- [ ] Reports (saved reports, date ranges, export), forecasting by owner
- [ ] Quotes / invoices (products catalogue, PDF, ZATCA e-invoicing for KSA)
- [ ] Public REST API + API keys / webhooks
- [ ] Notifications (email / push for due tasks), task reminders
- [ ] Files / attachments on records
- [ ] Custom-field filters on list pages, custom fields on activities
- [ ] Bulk actions (reassign owner, bulk delete, bulk tag)
- [ ] Tags / segments, lead scoring
- [ ] Teams / territories (rep sees their team's records)
- [ ] Two-factor auth, password reset by email, login rate limiting
- [ ] Multi-tenant (add `organizationId` to every table + scope in `core/permissions`)
- [ ] PostgreSQL (change provider in `prisma/schema.prisma`, `DATABASE_URL`, run `prisma migrate`)
- [ ] Automated tests (Playwright smoke tests exist only as ad-hoc scripts)

## Known limitations
- Browser-native pieces (date picker format, file chooser, required-field tooltips on Settings forms) follow the *browser* language, not the CRM language.
- Custom-field labels and dropdown options are entered once (one language). Per-language labels would need a translations column.
- Money is SAR-only; the `Deal.currency` column exists but the UI does not expose it.
- Pipeline column totals / dashboard sum raw values (fine while everything is SAR).
- Kanban ordering for users who only see part of a column is per-visible-set.
- Session cookie is a signed JWT (7 days); there is no server-side session revocation list (deactivating a user does take effect immediately because the user row is checked on every request).
