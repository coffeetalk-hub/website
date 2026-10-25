# TODO / open questions

## Open questions
- **Languages**: English only for now. Confirm the Arabic wording owner and whether numbers should use Arabic-Indic digits.
- **Hosting**: local SQLite for now. Where will it run (VPS, Docker, Vercel + Supabase)? Decides the DB switch and file storage.
- **Fiscal calendar / week start**: calendar widget starts weeks on Sunday; dates are formatted `en-GB`.
- **Time zone**: due dates are interpreted in the *server's* time zone. Store a per-user or company time zone before multi-region use.
- **Data retention**: deletes are hard deletes (audit entry stays). Do you want soft delete / recycle bin?
- **Duplicate handling** on import: currently skips existing email (contacts) / name (companies). Merge instead?
- **Lost-reason / won-reason** on deals: not captured yet.

## Planned features (not started)
- [ ] Arabic translation + RTL layout (`src/core/i18n/ar.ts`, locale cookie → `lang`/`dir` already wired in `app/layout.tsx`; swap physical `ml/pl` classes for logical ones where any remain)
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
- Money is SAR-only; the `Deal.currency` column exists but the UI does not expose it.
- Pipeline column totals / dashboard sum raw values (fine while everything is SAR).
- Kanban ordering for users who only see part of a column is per-visible-set.
- Session cookie is a signed JWT (7 days); there is no server-side session revocation list (deactivating a user does take effect immediately because the user row is checked on every request).
