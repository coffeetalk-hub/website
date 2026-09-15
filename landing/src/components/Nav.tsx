import { useEffect, useState } from 'react'
import { useLang } from '../i18n'
import { Icon, Wordmark } from './Icons'

export function Nav() {
  const { t, toggle } = useLang()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close the mobile menu on Escape and lock scroll while it's open
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  const links = [
    { href: '#features', label: t.nav.features },
    { href: '#cafes', label: t.nav.cafes },
    { href: '#drivers', label: t.nav.drivers },
    { href: '#download', label: t.nav.download },
  ]

  const linkCls =
    'rounded-md px-3 py-2 text-sm font-medium text-espresso-800/80 transition-colors hover:text-espresso-900 focus-visible:outline-copper-500'

  return (
    <header
      className={`sticky top-0 z-40 transition-[background-color,box-shadow,border-color] duration-300 ${
        scrolled || open
          ? 'border-b border-espresso-900/8 bg-cream-50/90 shadow-[0_1px_0_rgba(28,18,13,0.04)] backdrop-blur-md'
          : 'border-b border-transparent bg-cream-50/0'
      }`}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-3 focus:z-50 focus:rounded-md focus:bg-espresso-900 focus:px-4 focus:py-2 focus:text-cream-50"
      >
        {t.nav.skipToContent}
      </a>

      <nav className="container-x flex h-16 items-center justify-between gap-4" aria-label="Primary">
        <a href="#top" className="text-espresso-900 focus-visible:outline-copper-500 rounded-md">
          <Wordmark label={t.brand.name} />
        </a>

        <ul className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <li key={l.href}>
              <a href={l.href} className={linkCls}>
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggle}
            aria-label={t.nav.langToggleAria}
            className="btn-ghost h-10 gap-1.5 px-3 py-0 text-sm"
          >
            <Icon.Globe className="h-4 w-4" />
            <span lang={t.nav.langToggle === 'English' ? 'en' : 'ar'}>{t.nav.langToggle}</span>
          </button>
          <a href="#download" className="btn-primary hidden h-10 py-0 sm:inline-flex">
            {t.nav.cta}
          </a>
          <button
            type="button"
            className="btn-ghost h-10 w-10 p-0 md:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? t.nav.menuClose : t.nav.menuOpen}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <Icon.Close className="h-5 w-5" /> : <Icon.Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <div
        id="mobile-menu"
        hidden={!open}
        className="border-t border-espresso-900/8 bg-cream-50 md:hidden"
      >
        <ul className="container-x flex flex-col py-3">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                onClick={() => setOpen(false)}
                className="block rounded-md px-3 py-3 text-base font-medium text-espresso-800 hover:bg-cream-100 focus-visible:outline-copper-500"
              >
                {l.label}
              </a>
            </li>
          ))}
          <li className="mt-2 px-3 pb-2 sm:hidden">
            <a href="#download" onClick={() => setOpen(false)} className="btn-primary w-full">
              {t.nav.cta}
            </a>
          </li>
        </ul>
      </div>
    </header>
  )
}
