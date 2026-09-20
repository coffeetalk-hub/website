import { Check } from 'lucide-react'
import { useT } from '../../i18n'
import { SCREENS } from '../../config'
import { PhoneFrame } from '../ui/PhoneFrame'
import { Reveal } from '../ui/Reveal'
import { RouteLine } from '../ui/RouteLine'
import { ApplyButton } from '../ui/ApplyButton'

export function Hero() {
  const { t } = useT()
  return (
    <section id="top" className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(55%_45%_at_15%_0%,rgba(208,122,60,0.18),transparent_60%)]"
      />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-24 -z-10 h-64 text-copper-300 opacity-70 lg:top-40">
        <RouteLine />
      </div>

      <div className="container-x grid items-center gap-12 pt-10 pb-16 sm:pt-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-6 lg:pt-20 lg:pb-24">
        <div className="max-w-xl">
          <Reveal>
            <p className="eyebrow">{t.hero.eyebrow}</p>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="mt-4 text-[2.6rem] leading-[1.08] font-bold tracking-tight text-balance text-cream-50 sm:text-5xl lg:text-6xl ar:leading-[1.3]">
              {t.hero.headline}
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-5 max-w-lg text-lg text-pretty text-sand-400 sm:text-xl">{t.hero.subline}</p>
          </Reveal>
          <Reveal delay={240}>
            <div className="mt-8 flex flex-wrap gap-3">
              <ApplyButton className="btn-primary px-6 py-3.5 text-base" arrow>
                {t.hero.primary}
              </ApplyButton>
              <a href="#how" className="btn-secondary px-6 py-3.5 text-base">
                {t.hero.secondary}
              </a>
            </div>
          </Reveal>
          <Reveal delay={320}>
            <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-sand-400">
              {t.hero.chips.map((c) => (
                <li key={c} className="inline-flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-copper-300" aria-hidden="true" />
                  {c}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <Reveal delay={200} className="lg:justify-self-end">
          <PhoneFrame src={SCREENS.home} alt={t.hero.screenAlt} priority />
        </Reveal>
      </div>
    </section>
  )
}
