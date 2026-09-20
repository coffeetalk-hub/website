import { Check, Power } from 'lucide-react'
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
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_10%_0%,rgba(208,122,60,0.22),transparent_60%),radial-gradient(40%_40%_at_100%_80%,rgba(208,122,60,0.10),transparent_60%)]"
      />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-36 -z-10 h-72 text-copper-300 opacity-60 lg:top-24">
        <RouteLine />
      </div>

      <div className="container-x grid items-center gap-14 pt-12 pb-20 sm:pt-20 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10 lg:pt-24 lg:pb-28">
        <div className="max-w-2xl">
          <Reveal>
            <p className="eyebrow">{t.hero.eyebrow}</p>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="mt-5 text-[2.75rem] leading-[1.05] font-bold tracking-tight text-balance text-cream-50 sm:text-6xl lg:text-7xl ar:leading-[1.25]">
              {t.hero.headline}
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-6 max-w-xl text-lg text-pretty text-sand-400 sm:text-xl lg:text-2xl">{t.hero.subline}</p>
          </Reveal>
          <Reveal delay={240}>
            <div className="mt-9 flex flex-wrap gap-3">
              <ApplyButton className="btn-primary px-7 py-4 text-base" arrow>
                {t.hero.primary}
              </ApplyButton>
              <a href="#how" className="btn-secondary px-7 py-4 text-base">
                {t.hero.secondary}
              </a>
            </div>
          </Reveal>
          <Reveal delay={320}>
            <ul className="mt-9 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-sand-400">
              {t.hero.chips.map((c) => (
                <li key={c} className="inline-flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-copper-300" aria-hidden="true" />
                  {c}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <Reveal delay={200} className="relative mx-auto w-full max-w-sm lg:justify-self-end">
          <PhoneFrame src={SCREENS.home} alt={t.hero.screenAlt} priority className="w-[17rem] sm:w-[19rem]" />
          {/* Signature moment: the "Available now" switch, floating over the phone */}
          <div
            aria-hidden="true"
            className="absolute -bottom-6 -start-2 w-[15rem] rounded-2xl border border-cream-50/10 bg-espresso-900/95 p-4 shadow-card backdrop-blur sm:-start-8 sm:w-[16.5rem]"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[0.7rem] font-semibold text-sand-400">{t.hero.toggleLabel}</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-base font-bold text-cream-50">
                  <span className="h-2 w-2 rounded-full bg-copper-300 motion-safe:animate-blink" />
                  {t.hero.toggleState}
                </p>
              </div>
              <span className="relative inline-flex h-8 w-14 shrink-0 items-center rounded-full bg-copper-400 p-1">
                <span className="ms-auto grid h-6 w-6 place-items-center rounded-full bg-espresso-950 text-copper-300">
                  <Power className="h-3.5 w-3.5" />
                </span>
              </span>
            </div>
            <p className="mt-2 text-xs text-sand-400">{t.hero.toggleHint}</p>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
