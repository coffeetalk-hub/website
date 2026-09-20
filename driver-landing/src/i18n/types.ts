export type Lang = 'ar' | 'en'

export interface FeatureItem {
  name: string
  desc: string
  /** A CoffeeTalk-only feature (P1-Signature on the product map). */
  signature?: boolean
}

export interface Theme {
  id: string
  title: string
  benefit: string
  features: FeatureItem[]
  /** AI / policy note from the product map, shown as a callout. */
  note?: { label: string; text: string }
  /** Ships later (P3 on the product map). */
  comingLater?: boolean
  /** Screenshot key to show next to this theme (optional). */
  screen?: 'checkIn' | 'order' | 'route'
}

export interface Step {
  title: string
  desc: string
}

export interface Faq {
  q: string
  a: string
}

export interface Dictionary {
  meta: { title: string; description: string; ogLocale: string }
  brand: { name: string; product: string }
  nav: {
    features: string
    how: string
    earnings: string
    safety: string
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
  }
  themes: { eyebrow: string; heading: string; subhead: string; signature: string; comingLater: string; items: Theme[] }
  how: { eyebrow: string; heading: string; subhead: string; steps: Step[] }
  earnings: {
    eyebrow: string
    heading: string
    body: string
    points: FeatureItem[]
    todo: string
  }
  safety: { eyebrow: string; heading: string; subhead: string; points: FeatureItem[]; sosNote: string }
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
  screensAlt: { checkIn: string; order: string; route: string }
}
