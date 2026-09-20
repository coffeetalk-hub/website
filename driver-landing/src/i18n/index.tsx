import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { ar } from './ar'
import { en } from './en'
import type { Dictionary, Lang } from './types'
import { config } from '../config'

const STORAGE_KEY = 'ct-driver-lang'
const dictionaries: Record<Lang, Dictionary> = { ar, en }

function detectLang(): Lang {
  try {
    const q = new URLSearchParams(window.location.search).get('lang')
    if (q === 'ar' || q === 'en') return q
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'ar' || saved === 'en') return saved
  } catch {
    /* storage unavailable — fall through to default */
  }
  return 'ar' // Arabic is the default
}

function setMeta(selector: string, attr: string, value: string) {
  const el = document.head.querySelector<HTMLElement>(selector)
  if (el) el.setAttribute(attr, value)
}

function setAlternate(hreflang: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="alternate"][hreflang="${hreflang}"]`)
  if (!el) {
    el = document.createElement('link')
    el.rel = 'alternate'
    el.hreflang = hreflang
    document.head.appendChild(el)
  }
  el.href = href
}

interface Ctx {
  lang: Lang
  dir: 'rtl' | 'ltr'
  t: Dictionary
  setLang: (l: Lang) => void
  toggle: () => void
}

const LangContext = createContext<Ctx | null>(null)

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectLang)

  useEffect(() => {
    const t = dictionaries[lang]
    const root = document.documentElement
    root.lang = lang
    root.dir = lang === 'ar' ? 'rtl' : 'ltr'
    document.title = t.meta.title
    setMeta('meta[name="description"]', 'content', t.meta.description)
    setMeta('meta[property="og:title"]', 'content', t.meta.title)
    setMeta('meta[property="og:description"]', 'content', t.meta.description)
    setMeta('meta[property="og:locale"]', 'content', t.meta.ogLocale)
    setMeta('meta[property="og:locale:alternate"]', 'content', lang === 'ar' ? 'en_US' : 'ar_SA')

    const base = (config.siteUrl || window.location.origin) + window.location.pathname
    setAlternate('ar', `${base}?lang=ar`)
    setAlternate('en', `${base}?lang=en`)
    setAlternate('x-default', `${base}?lang=ar`)
  }, [lang])

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    try {
      localStorage.setItem(STORAGE_KEY, l)
    } catch {
      /* ignore */
    }
  }, [])

  const value = useMemo<Ctx>(
    () => ({
      lang,
      dir: lang === 'ar' ? 'rtl' : 'ltr',
      t: dictionaries[lang],
      setLang,
      toggle: () => setLang(lang === 'ar' ? 'en' : 'ar'),
    }),
    [lang, setLang],
  )

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useT(): Ctx {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('useT must be used inside <LangProvider>')
  return ctx
}
