import { useEffect, useState } from 'react'
import { Menu, X, Languages } from 'lucide-react'
import { useT } from '../../i18n'
import { Wordmark } from '../ui/Wordmark'
import { ApplyButton } from '../ui/ApplyButton'

export function Header() {
  const { t, toggle } = useT()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

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
    { href: '#why', label: t.nav.why },
    { href: '#how', label: t.nav.how },
    { href: '#shift', label: t.nav.shift },
    { href: '#pay', label: t.nav.pay },
    { href: '#faq', label: t.nav.faq },
  ]

  return (
    <header
      className={`sticky top-0 z-40 border-b transition-[background-color,border-color] duration-300 ${
        scrolled || open ? 'border-cream-50/10 bg-espresso-950/90 backdrop-blur-md' : 'border-transparent'
      }`}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-3 focus:z-50 focus:rounded-md focus:bg-copper-400 focus:px-4 focus:py-2 focus:text-espresso-950"
      >
        {t.nav.skip}
      </a>
      <nav className="container-x flex h-16 items-center justify-between gap-3" aria-label="Primary">
        <a href="#top" className="rounded-md text-cream-50">
          <Wordmark name={t.brand.name} product={t.brand.product} />
        </a>

        <ul className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="rounded-md px-3 py-2 text-sm font-medium text-sand-400 transition-colors hover:text-cream-50">
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <button type="button" onClick={toggle} aria-label={t.nav.langToggleAria} className="btn-ghost h-10 gap-1.5 py-0 text-sm">
            <Languages className="h-4 w-4" aria-hidden="true" />
            <span>{t.nav.langToggle}</span>
          </button>
          <span className="hidden sm:inline-flex">
            <ApplyButton className="btn-primary h-10 py-0">{t.nav.apply}</ApplyButton>
          </span>
          <button
            type="button"
            className="btn-ghost h-10 w-10 p-0 lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? t.nav.menuClose : t.nav.menuOpen}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
      </nav>

      <div id="mobile-menu" hidden={!open} className="border-t border-cream-50/10 bg-espresso-950 lg:hidden">
        <ul className="container-x flex flex-col py-3">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                onClick={() => setOpen(false)}
                className="block rounded-md px-3 py-3 text-base font-medium text-cream-50 hover:bg-cream-50/5"
              >
                {l.label}
              </a>
            </li>
          ))}
          <li className="mt-2 px-3 pb-2 sm:hidden" onClick={() => setOpen(false)}>
            <ApplyButton className="btn-primary w-full">{t.nav.apply}</ApplyButton>
          </li>
        </ul>
      </div>
    </header>
  )
}
