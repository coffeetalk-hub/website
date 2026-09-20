import { Languages } from 'lucide-react'
import { useT } from '../../i18n'
import { Wordmark } from '../ui/Wordmark'

export function Footer() {
  const { t, toggle } = useT()
  const links = [
    { href: '#why', label: t.nav.why },
    { href: '#how', label: t.nav.how },
    { href: '#shift', label: t.nav.shift },
    { href: '#pay', label: t.nav.pay },
    { href: '#faq', label: t.nav.faq },
  ]
  const linkCls = 'text-sm text-sand-400 hover:text-cream-50 rounded-sm'

  return (
    <footer className="border-t border-cream-50/10">
      <div className="container-x grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Wordmark name={t.brand.name} product={t.brand.product} className="text-cream-50" />
          <p className="mt-3 max-w-xs text-sm text-sand-400">{t.footer.tagline}</p>
          <button type="button" onClick={toggle} aria-label={t.nav.langToggleAria} className="btn-ghost mt-5 h-9 gap-1.5 py-0 text-sm">
            <Languages className="h-4 w-4" aria-hidden="true" />
            {t.nav.langToggle}
          </button>
        </div>
        <nav aria-label={t.footer.links}>
          <h2 className="text-sm font-bold text-cream-50">{t.footer.links}</h2>
          <ul className="mt-3 space-y-2">
            {links.map((l) => (
              <li key={l.href}>
                <a href={l.href} className={linkCls}>
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <h2 className="text-sm font-bold text-cream-50">{t.footer.contact}</h2>
          {/* TODO(launch): real contact email / phone */}
          <p className="mt-3 text-sm text-sand-400">{t.footer.contactTodo}</p>
        </div>
        <nav aria-label={t.footer.legal}>
          <h2 className="text-sm font-bold text-cream-50">{t.footer.legal}</h2>
          <ul className="mt-3 space-y-2">
            {/* TODO(launch): link to real privacy / terms pages */}
            <li>
              <a href="#" className={linkCls}>
                {t.footer.privacy}
              </a>
            </li>
            <li>
              <a href="#" className={linkCls}>
                {t.footer.terms}
              </a>
            </li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-cream-50/10">
        <p className="container-x py-6 text-xs text-sand-400">{t.footer.copyright}</p>
      </div>
    </footer>
  )
}
