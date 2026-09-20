import { useLang } from '../i18n'
import { Wordmark } from './Icons'
import { DriveCta } from './DriveCta'

export function Footer() {
  const { t } = useLang()
  const linkCls = 'text-sm text-espresso-500 hover:text-espresso-900 focus-visible:outline-copper-500 rounded-sm'

  // TODO(launch): point Privacy / Terms / About / Contact at real pages.
  const cols = [
    {
      title: t.footer.product,
      links: [
        { href: '#features', label: t.nav.features },
        { href: '#cafes', label: t.nav.cafes },
        { href: '#drivers', label: t.nav.drivers },
        { href: '#download', label: t.nav.download },
      ],
    },
    {
      title: t.footer.company,
      links: [
        { href: '#', label: t.footer.about },
        { href: '#', label: t.footer.contact },
      ],
    },
    {
      title: t.footer.legal,
      links: [
        { href: '#', label: t.footer.privacy },
        { href: '#', label: t.footer.terms },
      ],
    },
  ]

  return (
    <footer className="border-t border-espresso-900/8 bg-cream-100">
      <div className="container-x grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Wordmark label={t.brand.name} className="text-espresso-900" />
          <p className="mt-3 max-w-xs text-sm text-espresso-500">{t.footer.tagline}</p>
        </div>
        {cols.map((c) => (
          <nav key={c.title} aria-label={c.title}>
            <h2 className="text-sm font-bold text-espresso-900">{c.title}</h2>
            <ul className="mt-3 space-y-2">
              {c.links.map((l) => (
                <li key={l.label}>
                  <a href={l.href} className={linkCls}>
                    {l.label}
                  </a>
                </li>
              ))}
              {c.title === t.footer.company && (
                <li>
                  <DriveCta className={`${linkCls} inline-flex items-center gap-1 font-semibold text-copper-600`} arrow={false}>
                    {t.footer.driveWithUs}
                  </DriveCta>
                </li>
              )}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-espresso-900/8">
        <div className="container-x flex flex-col gap-2 py-6 text-xs text-espresso-500 sm:flex-row sm:items-center sm:justify-between">
          <p>{t.footer.copyright}</p>
          <p>
            {t.footer.builtBy}{' '}
            <a
              href="https://thesailors.ai"
              target="_blank"
              rel="noopener"
              className="font-semibold text-espresso-800 hover:text-copper-600 focus-visible:outline-copper-500 rounded-sm"
              lang="en"
            >
              {t.footer.builtByName}
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
