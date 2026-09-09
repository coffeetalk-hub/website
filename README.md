# The Sailors ART — website

Static marketing site for **The Sailors ART**, the events, entertainment and talent-development arm of The Sailors Group.
Plain HTML, CSS and vanilla JavaScript — no frameworks, no build step, no dependencies other than optional Google Fonts.
Content, imagery, logos and brand colours follow the *December 2025 company profile*.

```
/index.html            Home — photo-mosaic hero, intro, stats, "Why The Sailors .ART", services, client strip, CTA
/about.html            Story, group journey + milestones, manifesto, values, why us, leadership team & advisors
/services.html         One-stop process, three service groups, "Licensed & Certified" (CR, CoC, permits)
/work.html             Portfolio grid with filter tabs and lightbox (from data/projects.js) + cities map
/partners.html         Clients / institutional partners / global alliances (from data/partners.js)
/contact.html          Netlify-ready contact form, address, social links
/css/style.css         All styling (brand tokens at the top)
/js/main.js            Nav toggle, stat counters, scroll reveal, partner grids, portfolio + lightbox, form
/data/projects.js      Array of portfolio entries
/data/partners.js      Arrays of client / partner logos
/images/brand/         Wordmark (colour, white, on-white), swoosh mark, group + ISTA logos
/images/photos/        Nautical photography from the profile (hero, covers, ropes, sails…)
/images/values/        The five value illustrations
/images/team/          Leadership portraits
/images/permits/       General Entertainment Authority permit scans
/images/logos/         (empty) — drop client / partner logo files here
/images/og-image.jpg   Link-preview image; favicon-*.png and apple-touch-icon.png
/sitemap.xml /robots.txt /netlify.toml
```

## Run it locally

```bash
python3 -m http.server 8000
# then open http://localhost:8000/
```

Any static file server works. Opening the `.html` files directly from disk also works for everything except the
contact form (Netlify Forms only work on a deployed Netlify site).

## Add or edit portfolio projects (`work.html`)

Open `data/projects.js` and add an object to the `window.SAILORS_PROJECTS` array:

```js
{
  id: "my-event-2025",                       // unique, URL-safe (deep link: work.html#my-event-2025)
  title: "My Event",
  city: "Dammam, KSA",
  year: 2025,
  type: "mega",                              // "mega" | "corporate" | "expo"  → drives the filter tabs
  guests: 25000,                             // number (formatted as 25,000) or null to hide the count
  image: "images/photos/my-event.jpg",       // 4:3 works best (e.g. 1200×900 JPG, < 300 KB)
  alt: "Crowd in front of the main stage",   // short description for screen readers
  description: "One or two sentences shown in the lightbox."
}
```

Projects are sorted newest-first automatically; filter-tab counts update on their own.
`work.html?type=expo` opens the page pre-filtered.

The first entry (DAS Alumni+ Council, honoured by HRH the Deputy Governor) is a real event pictured in the
profile — please confirm its title, year and guest count. All entries marked **(sample)** are placeholders that
reuse the profile's nautical photos; replace them with real events and photos.

## Add or edit partner logos (`partners.html` and the strip on the home page)

Open `data/partners.js`. There are three arrays: `clients`, `institutional` and `alliances`.

```js
{ name: "Acme Corp", logo: "images/logos/clients/acme.png", url: "https://acme.example", note: "Energy" }
```

- `logo` — PNG/JPG/SVG, roughly 400×200 max. Leave it as `""` to show an auto-generated monogram.
- `url` and `note` are optional.
- All entries are numbered placeholders until the real client and partner list is available. Replace the
  `name`, add the logo file to `images/logos/` and set its path in `logo`.
- The home page shows the first 12 `clients`; change `data-limit="12"` in `index.html` to show more or fewer.

## Edit text, stats, team and contact details

- **Page copy** — edit the HTML files directly. Each page has the same header (`<header class="site-header">`)
  and footer (`<footer class="site-footer">`); if you change navigation or footer text, update all six pages.
- **Stat counters** — in `index.html` and `work.html`, each stat is
  `<span class="stat__num" data-count="480000" data-suffix="+">480,000+</span>`.
  Change `data-count` (the number that animates) and the visible text. Use `data-plain` for years.
- **Leadership** — `about.html`, section "At the helm": the founder card, four team cards and the
  board/advisors list. Portraits live in `images/team/` (480×560, cropped from the top).
- **Values** — `about.html`, "The compass we steer by"; illustrations in `images/values/`.
- **Licenses & permits** — `services.html`, section `#licensed`. Permit names are shown in English with the
  official Arabic name underneath; permit scans are in `images/permits/` (remove the `<div class="permits">`
  block if you don't want the scans public).
- **Contact details** — email, phone, address and office hours appear in `contact.html` and every footer.
  Search for `info@thesailorsart.com` and `+966 00 000 0000` and replace them.
- **Social links** — the `<ul class="social">` lists point at network home pages; replace the `href` values.
- **Colours & fonts** — tokens at the top of `css/style.css`: navy `#182D4B` (sampled from the wordmark),
  coral `#F07C54` (sail swoosh), teal `#126A89`. Fonts are Montserrat (headings) and Open Sans (body) via Google
  Fonts; remove that `<link>` to go fully self-hosted (falls back to system fonts).

## Swap images

| File | Used for | Suggested size |
|------|----------|----------------|
| `images/brand/logo.png` | Header logo (transparent) | keep aspect ~1.74:1 |
| `images/brand/logo-white.png` | Footer + hero logo on dark backgrounds | same |
| `images/brand/logo-mark.png` | Source for favicons | square |
| `images/photos/cover-01…12.jpg` | Home hero mosaic and OG image | portrait, ≥ 600 px tall |
| `images/photos/*.jpg` | Page heroes (`<img class="hero__bg">`), split sections, portfolio placeholders | 1600 px wide, JPG q75–80 |
| `images/photos/compass-rope.jpg` | CTA banner background (`.cta::before` in `style.css`) | 1600 px |
| `images/og-image.jpg` | Link preview on social media / WhatsApp | 1200×630 |
| `images/favicon-32.png`, `favicon-192.png`, `apple-touch-icon.png` | Browser / home-screen icons | 32, 192, 180 px |

Keep photos compressed (JPG quality 75–80, or WebP). Images below the fold already use `loading="lazy"`.

## SEO

- Every page has its own `<title>`, `<meta name="description">`, canonical URL and Open Graph / Twitter tags.
- The site URL is set to `https://www.thesailorsart.com` as a placeholder. Search-and-replace it in all `.html`
  files, `sitemap.xml` and `robots.txt` once the real domain is known.
- Add new pages to `sitemap.xml`.

## Deploy to Netlify

1. Push this repository to GitHub (or GitLab / Bitbucket).
2. In Netlify: **Add new site → Import an existing project**, pick the repo.
3. Build settings: leave the **build command empty**; the publish directory `.` is already set in `netlify.toml`.
4. Deploy. Netlify detects the contact form (`data-netlify="true"`) during deploy; submissions appear under
   **Site → Forms → contact**. Turn on email notifications there (**Forms → Form notifications**).
5. Add your custom domain under **Domain management** and enable HTTPS (automatic).

Drag-and-drop alternative: zip the folder and drop it on https://app.netlify.com/drop — forms still work.

### Contact form notes

- The form posts to Netlify Forms via a small `fetch` call in `js/main.js` so the visitor sees an inline
  confirmation. With JavaScript disabled it falls back to a normal POST and Netlify's default thank-you page.
- A hidden honeypot field (`bot-field`) filters simple spam. For stronger protection, enable reCAPTCHA in the
  Netlify Forms settings and add `data-netlify-recaptcha="true"` + `<div data-netlify-recaptcha="true"></div>`
  inside the form.
- Hosting elsewhere? Point the form's `action` at your own endpoint (Formspree, Basin, etc.) and remove the
  `data-netlify` attributes.

## Accessibility & performance checklist (already in place)

- Skip link, semantic landmarks, keyboard-operable menu (Escape closes) and lightbox (native `<dialog>`,
  arrow keys to move between projects, focus returned on close).
- All images have `alt` text; decorative images use `alt=""`.
- Colour contrast meets WCAG AA (coral text on white uses the darker `--coral-700`).
- `prefers-reduced-motion` disables counters and reveal animations.
- No JavaScript libraries; all images are compressed (whole site ≈ 6 MB including photos).
