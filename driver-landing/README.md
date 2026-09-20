# CoffeeTalk Driver — landing page

Single-page recruiting site for the **CoffeeTalk Driver app**. One job: get delivery drivers in Saudi Arabia
to apply. Arabic (default) and English, full RTL, static, no backend.

**Stack:** Vite + React 19 + TypeScript + Tailwind CSS v4 + lucide-react (icons only).

## Run locally (Windows / PowerShell, Node ≥ 22)

```powershell
cd driver-landing
npm install
Copy-Item .env.example .env      # then fill in the values (see below)
npm run dev                      # http://localhost:5173
npm run build                    # type-check + production build → dist/
npm run preview                  # serve dist/ at http://localhost:4173
npm run lint
```

Open a specific language: `http://localhost:5173/?lang=en` or `?lang=ar`.

## Deploy

Static output in `driver-landing/dist/`. Works as-is on Netlify or Vercel.

| Host    | Base directory   | Build command   | Publish directory |
| ------- | ---------------- | --------------- | ----------------- |
| Netlify | `driver-landing` | `npm run build` | `dist`            |
| Vercel  | `driver-landing` | `npm run build` | `dist` (Vite preset) |

Set the environment variables from `.env.example` in the host's dashboard. They are read at build time.

## Environment variables

| Variable                 | Effect                                                                                  |
| ------------------------ | --------------------------------------------------------------------------------------- |
| `VITE_APPLY_URL`         | If set, every "Apply to drive" button links here (new tab). If empty, the waitlist form opens. |
| `VITE_WAITLIST_ENDPOINT` | Waitlist form POSTs JSON `{ name, phone, city, lang, source }` here. Empty → logs to console and shows success. |
| `VITE_SITE_URL`          | Canonical origin used for `hreflang` links. Falls back to the current origin.           |

Phone numbers are validated as Saudi mobiles and normalised to `+9665XXXXXXXX` before sending.

## Where things live

```
index.html                       Shell, fonts, OG tags, no-flash language bootstrap
src/i18n/ar.ts, en.ts            ALL copy (Arabic default). Same shape, enforced by src/i18n/types.ts
src/i18n/index.tsx               LangProvider / useT(): ?lang= → localStorage → ar; updates <html>, title, meta, hreflang
src/config.ts                    Env vars + screenshot paths
src/index.css                    Design tokens (@theme), buttons, cards, reveal animation
src/components/sections/*        One per section, in page order: Header, Hero, Why, Signature, HowItWorks, Shift, Pay, Requirements, Faq, FinalCta, Footer (+ WaitlistForm)
src/components/ui/*              PhoneFrame, RouteLine (signature motif), Reveal, Badge, ApplyButton, Wordmark
src/lib/                         useInPageLinks (scroll without changing the URL), phone normaliser
public/screens/                  App screenshots shown in the phone frames — see README there
```

### Change copy
Edit `src/i18n/ar.ts` and `src/i18n/en.ts`. Adding a key to one and not the other fails the build.
Feature themes, steps, FAQ, requirements and city list are arrays there, so adding an entry is a data change.

### Change palette or fonts
Edit the `@theme` block in `src/index.css`. Fonts are linked in `index.html` (IBM Plex Sans Arabic + IBM Plex Sans);
change both places together.

## Placeholders / TODOs to fill before launch

| # | Item | Where |
| - | ---- | ----- |
| 1 | **Earnings structure and payout schedule.** The page says pay is transparent and per-delivery (from the brief) but not how much or when, so the Pay section and the last FAQ answer carry a visible `[TODO]`. | `pay.todo` and last FAQ item in `src/i18n/*.ts` |
| 2 | **Primary CTA target.** Set `VITE_APPLY_URL`, or set `VITE_WAITLIST_ENDPOINT` for the built-in form. | `.env` |
| 3 | **App screenshots.** Replace the placeholder SVGs, keep the filenames (or update `SCREENS` in `src/config.ts`). | `public/screens/` |
| 4 | **Logo.** Text wordmark + cup mark. | `src/components/ui/Wordmark.tsx`, `public/favicon.svg` |
| 5 | **Contact details** in the footer. | `footer.contactTodo` in `src/i18n/*.ts` |
| 6 | **Privacy / Terms** pages. Footer links are `href="#"`. | `src/components/sections/Footer.tsx` |
| 7 | **OG image** (1200×630) at `public/og-image.png`, and `VITE_SITE_URL`. | `index.html`, `.env` |
| 8 | **Butler tier** is shown as "Coming later" (P3 on the map). Drop the badge in `Pay.tsx` when it ships. | `tier` in `src/i18n/*.ts` |
| 9 | **Placeholder screens are English-only.** Real Arabic screenshots should replace them. | `public/screens/` |
