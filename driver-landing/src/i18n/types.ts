export type Lang = 'ar' | 'en'

export interface FeatureItem {
  name: string
  desc: string
  /** CoffeeTalk-only feature (P1-Signature on the product map). */
  signature?: boolean
}

export interface Step {
  title: string
  desc: string
}

export interface Faq {
  q: string
  a: string
}

export interface WhyTile {
  title: string
  body: string
  points: string[]
}

export interface ShiftScreen {
  key: 'checkIn' | 'order' | 'route'
  title: string
  caption: string
  alt: string
  features: FeatureItem[]
  note?: { label: string; text: string }
}

export interface Dictionary {
  meta: { title: string; description: string; ogLocale: string }
  brand: { name: string; product: string }
  nav: {
    why: string
    how: string
    shift: string
    pay: string
    faq: string
    apply: string
    menuOpen: string
    menuClose: string
    skip: string
    langToggle: string
    langToggleAria: string
  }
  hero: {
    eyebrow: string
    headline: string
    subline: string
    primary: string
    secondary: string
    chips: string[]
    screenAlt: string
    /** Text inside the big "Available now" card in the hero */
    toggleLabel: string
    toggleState: string
    toggleHint: string
  }
  why: { eyebrow: string; heading: string; subhead: string; tiles: [WhyTile, WhyTile, WhyTile, WhyTile] }
  signature: { eyebrow: string; heading: string; subhead: string; badge: string; items: FeatureItem[] }
  how: { eyebrow: string; heading: string; subhead: string; steps: Step[] }
  shift: { eyebrow: string; heading: string; subhead: string; screens: [ShiftScreen, ShiftScreen, ShiftScreen] }
  tier: { badge: string; title: string; body: string; points: string[] }
  pay: { eyebrow: string; heading: string; body: string; points: FeatureItem[]; todo: string }
  requirements: { eyebrow: string; heading: string; subhead: string; items: string[]; cta: string }
  faq: { eyebrow: string; heading: string; items: Faq[] }
  finalCta: { heading: string; subhead: string; primary: string }
  waitlist: {
    title: string
    intro: string
    name: string
    phone: string
    phoneHint: string
    city: string
    cityPlaceholder: string
    cities: { value: string; label: string }[]
    submit: string
    submitting: string
    successTitle: string
    successBody: string
    errorGeneric: string
    errors: { name: string; phone: string; city: string }
    close: string
  }
  footer: {
    tagline: string
    links: string
    contact: string
    contactTodo: string
    legal: string
    privacy: string
    terms: string
    copyright: string
  }
}
