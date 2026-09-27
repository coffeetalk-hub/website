import { useLang } from '../i18n'
import { Icon } from './Icons'
import { PhoneMockup } from './PhoneMockup'
import { Reveal } from './Reveal'
import { StoreBadges } from './StoreBadges'

export function Hero() {
  const { t } = useLang()
  return (
    <section id="top" className="relative overflow-hidden">
      {/* warm backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_20%_0%,rgba(232,168,107,0.22),transparent_60%),radial-gradient(40%_40%_at_100%_100%,rgba(122,79,30,0.10),transparent_60%)]"
      />
      <div className="container-x grid items-center gap-12 pt-10 pb-16 sm:pt-16 lg:grid-cols-[1.15fr_0.85fr] lg:gap-8 lg:pt-20 lg:pb-24">
        <div className="max-w-2xl">
          <Reveal>
            <p className="eyebrow">{t.hero.eyebrow}</p>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="mt-4 max-w-[22ch] text-[1.8rem] leading-[1.08] font-extrabold tracking-tight text-balance text-espresso-900 min-[400px]:text-[2rem] sm:text-[3.1rem] lg:text-[3rem] xl:text-[3.4rem] ar:max-w-none ar:leading-[1.25]">
              {t.hero.headline}
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-5 max-w-lg text-lg text-pretty text-espresso-500 sm:text-xl">{t.hero.subhead}</p>
          </Reveal>
          <Reveal delay={240}>
            <StoreBadges className="mt-8" />
          </Reveal>
          <Reveal delay={320}>
            <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-espresso-600">
              {t.hero.trust.map((item) => (
                <li key={item} className="inline-flex items-center gap-1.5">
                  <Icon.Check className="h-4 w-4 text-copper-600" />
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <Reveal delay={200} className="lg:justify-self-end">
          <PhoneMockup />
        </Reveal>
      </div>
    </section>
  )
}
