# The Sailors ART — website

Static marketing site for **The Sailors ART**, the events, entertainment and talent-development arm of The Sailors Group.
Plain HTML, CSS and vanilla JavaScript — no frameworks, no build step, no dependencies other than optional Google Fonts.

```
/index.html            Home — hero, intro, stats, why us, services teaser, client strip, CTA
/about.html            Story, group timeline, manifesto, values, why us, founder card
/services.html         Three service groups + "Licensed & Certified" block
/work.html             Portfolio grid with filter tabs and lightbox (rendered from data/projects.js)
/partners.html         Client / institutional / global-alliance logo grids (rendered from data/partners.js)
/contact.html          Netlify-ready contact form, address, social links
/css/style.css         All styling (design tokens at the top)
/js/main.js            Nav toggle, stat counters, scroll reveal, partner grids, portfolio + lightbox, form
/data/projects.js      Array of portfolio entries
/data/partners.js      Arrays of client / partner logos
/images/               Logo, hero scene, placeholders, favicons, Open Graph image
/sitemap.xml           Sitemap for search engines
/robots.txt            Crawler rules
/netlify.toml          Netlify publish directory + security/cache headers
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
  id: "my-event-2025",                       // unique, URL-safe (used for deep links: work.html#my-event-2025)
  title: "My Event",
  city: "Dammam, KSA",
  year: 2025,
  type: "mega",                              // "mega" | "corporate" | "expo"  → drives the filter tabs
  guests: 25000,                             // number; formatted automatically (25,000)
  image: "images/projects/my-event.jpg",     // 4:3 works best (e.g. 1200×900 JPG, < 300 KB)
  alt: "Crowd in front of the main stage",   // short description for screen readers
  description: "One or two sentences shown in the lightbox."
}
```

Projects are sorted newest-first automatically. Delete an object to remove a card.
The filter tab counts update on their own. `work.html?type=expo` opens the page pre-filtered.

## Add or edit partner logos (`partners.html` and the strip on the home page)

Open `data/partners.js`. There are three arrays: `clients`, `institutional` and `alliances`.

```js
{ name: "Acme Corp", logo: "images/partners/acme.svg", url: "https://acme.example", note: "Energy" }
```

- `logo` — SVG or PNG with a transparent background, roughly 240×120. Leave it as `""` to show an
  auto-generated monogram placeholder instead.
- `url` and `note` are optional.
- The home page shows the first six `clients`; change `data-limit="6"` in `index.html` to show more.

## Edit text, stats and contact details

- **Page copy** — edit the HTML files directly. Each page has the same header (`<header class="site-header">`)
  and footer (`<footer class="site-footer">`); if you change the navigation or footer, update all six pages.
- **Stat counters** — in `index.html` and `work.html`, each stat is
  `<span class="stat__num" data-count="480000" data-suffix="+">480,000+</span>`.
  Change `data-count` (the number that animates) and the visible text (shown before JS runs / for reduced motion).
  Use `data-plain` for years so no thousands separator is added.
- **Contact details** — email, phone, address and office hours appear in `contact.html` and in every page's footer.
  Search for `info@thesailorsart.com` and `+966 00 000 0000` and replace them. The street address placeholder is
  in `contact.html`.
- **Social links** — the `<ul class="social">` lists in the footer and on `contact.html` point at the network home
  pages; replace the `href` values with your profile URLs.
- **Founder** — `about.html`, section "At the helm". Replace `images/founder-placeholder.svg` with a square photo.
- **Colours & fonts** — the design tokens are at the top of `css/style.css` (`:root { --navy-800: …; --gold-500: … }`).
  Fonts are loaded from Google Fonts in each page's `<head>`; remove that `<link>` to go fully self-hosted
  (the site falls back to system fonts).

## Swap images

| File | Used for | Suggested size |
|------|----------|----------------|
| `images/hero.svg` | Hero background on every page and the CTA banner | 1600×900 (JPG works too — update the `src` in each page and the `url()` in `.cta::before` in `style.css`) |
| `images/logo.svg` / `favicon.svg` | Header, footer, browser tab | square SVG |
| `images/favicon-32.png`, `images/apple-touch-icon.png` | Raster favicons | 32×32, 180×180 |
| `images/og-image.png` | Link preview on social media / WhatsApp | 1200×630 |
| `images/projects/*.svg` | Portfolio placeholders | replace with 4:3 photos and update `data/projects.js` |
| `images/partners/*.svg` | Partner logo placeholder | replace with real logos and update `data/partners.js` |
| `images/founder-placeholder.svg` | Founder portrait | 400×400 or larger, square |

Two images on `index.html` and `about.html` (`split__media`) reuse project placeholders — swap their `src` for real photos.

Keep photos compressed (JPG quality 75–80, or WebP). All images below the fold already use `loading="lazy"`.

## SEO

- Every page has its own `<title>`, `<meta name="description">`, canonical URL and Open Graph / Twitter tags.
- The site URL is set to `https://www.thesailorsart.com` as a placeholder. Search-and-replace it in all `.html`
  files, `sitemap.xml` and `robots.txt` once the real domain is known.
- Add new pages to `sitemap.xml`.

## Deploy to Netlify

1. Push this repository to GitHub (or GitLab / Bitbucket).
2. In Netlify: **Add new site → Import an existing project**, pick the repo.
3. Build settings: leave the **build command empty** and set the **publish directory** to `.` (already set in
   `netlify.toml`, so Netlify picks it up automatically).
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
- Hosting somewhere other than Netlify? Point the form's `action` at your own endpoint (Formspree, Basin, etc.)
  and remove the `data-netlify` attributes.

## Accessibility & performance checklist (already in place)

- Skip link, semantic landmarks, keyboard-operable menu (Escape closes) and lightbox (native `<dialog>`,
  arrow keys to move between projects, focus returned on close).
- All images have `alt` text; decorative images use `alt=""`.
- Colour contrast meets WCAG AA (gold text on white uses the darker `--gold-700`).
- `prefers-reduced-motion` disables counters and reveal animations.
- No JavaScript libraries; SVG placeholders keep the site well under 1 MB.
