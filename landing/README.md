# CoffeeTalk — landing page

Single-page marketing site for **CoffeeTalk**, Saudi Arabia's AI-native coffee platform.
Bilingual (English / Arabic, full RTL), no backend, no CMS, no external images — every visual is CSS or inline SVG.

**Stack:** Vite + React 19 + TypeScript + Tailwind CSS v4.
React was chosen over vanilla TS because the page has real state that touches every section at once
(language toggle re-rendering all copy, a modal form, a mobile menu, scroll-reveal). A typed `content.ts`
dictionary consumed through one `useLang()` hook keeps that trivial; the same thing in vanilla TS means
hand-written DOM re-rendering for every string. Bundle cost is ~80 kB gzipped, well inside the Lighthouse budget.

## Run it (Windows / PowerShell, Node ≥ 22)

```powershell
cd landing
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build → dist/
npm run preview    # serve dist/ locally at http://localhost:4173
npm run lint       # eslint
```

Deploy `landing/dist/` to any static host. (If you deploy to Netlify from this monorepo, set the base
directory to `landing` and the publish directory to `landing/dist`.)

## Where things live

```
index.html                 HTML shell, Google Fonts links, no-flash language/dir bootstrap script
src/content.ts             ALL copy, EN + AR — edit text here, nowhere else
src/i18n.tsx               LanguageProvider / useLang(): detection, persistence, <html lang dir>
src/index.css              Design tokens (@theme), fonts, buttons, cards, reveal animation
src/App.tsx                Section order
src/components/            One file per section + shared pieces (Icons, StoreBadges, Reveal, PhoneMockup)
public/favicon.svg         Favicon (cup + steam mark)
```

### Change copy

Open `src/content.ts`. It exports one `Content` object per language (`en`, `ar`). The two objects share a
TypeScript interface, so adding a string to one without the other is a build error. Components never contain
literal text.

### Change the palette or fonts

Open `src/index.css` and edit the `@theme` block:

| Token group        | Used for                                            |
| ------------------ | --------------------------------------------------- |
| `--color-espresso-*` | Dark surfaces, headings, body text                 |
| `--color-cream-*`    | Page background, light cards                       |
| `--color-copper-*`   | The single accent: buttons, icons, eyebrows        |
| `--font-sans`        | Latin (Inter)                                      |
| `--font-arabic`      | Arabic (Cairo, falls back to IBM Plex Sans Arabic / system) |

Tailwind v4 turns these into utilities automatically (`bg-espresso-900`, `text-copper-600`, …).
Contrast was checked for the combinations used: copper-600 on cream-50 ≈ 5.5:1, white on copper-500 ≈ 5.3:1,
espresso-500 muted text on cream-50 ≈ 6.5:1.

The Google Fonts `<link>` is in `index.html`; swap the family names there and in `@theme` together.

### Language behaviour

- First visit: `navigator.language` starting with `ar` → Arabic, otherwise English.
- The choice is saved in `localStorage` under `ct-lang`.
- The toggle sets `lang` and `dir` on `<html>`; the same logic runs inline in `index.html` before React
  loads so there is no LTR→RTL flash.
- Layout mirrors with CSS logical properties only (`ms-*`, `pe-*`, `text-start`, `start-*`); directional
  icons use the `rtl:-scale-x-100` utility.

## Placeholders to replace before launch

| Item | Where |
| ---- | ----- |
| App Store / Google Play URLs | `src/components/StoreBadges.tsx` — both badges currently link to `#download` |
| Logo | `Wordmark` in `src/components/Icons.tsx` (SVG cup mark + text) and `public/favicon.svg` |
| Partner form handler | `handleSubmit` in `src/components/PartnerForm.tsx` — `TODO(launch)`, currently `console.info` |
| Driver sign-up link | `src/components/ForDrivers.tsx` — CTA links to `#download` |
| Privacy / Terms / About / Contact pages | `src/components/Footer.tsx` — `href="#"` |
| "Built by" link | `src/components/Footer.tsx` — points at `https://thesailors.ai` |
| Market stats source line | `stats.source` in `src/content.ts` (not rendered yet; add a citation if you want it shown) |
| OG image / social meta | Not included — add `og:*` tags and an image to `index.html` |
