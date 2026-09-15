import { useLang } from '../i18n'
import { Icon } from './Icons'
import { Reveal } from './Reveal'
import { SectionHeading } from './SectionHeading'

const icons = [Icon.Route, Icon.Shield, Icon.Wallet, Icon.Camera]

export function ForDrivers() {
  const { t } = useLang()
  return (
    <section
      id="drivers"
      aria-labelledby="drivers-heading"
      className="scroll-mt-20 bg-espresso-900 py-20 text-cream-50 sm:py-28"
    >
      <div className="container-x grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-16">
        <ul className="order-2 grid gap-4 sm:grid-cols-2 lg:order-1">
          {t.drivers.items.map((item, i) => {
            const Ico = icons[i]
            return (
              <Reveal
                as="li"
                key={item.title}
                delay={i * 70}
                className="rounded-2xl border border-cream-50/10 bg-espresso-800/60 p-6"
              >
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-copper-500/20 text-copper-300">
                  <Ico className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-bold">{item.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-cream-200/75">{item.body}</p>
              </Reveal>
            )
          })}
        </ul>

        <div className="order-1 lg:order-2">
          <SectionHeading
            id="drivers-heading"
            align="start"
            tone="dark"
            eyebrow={t.drivers.eyebrow}
            title={t.drivers.heading}
            subhead={t.drivers.subhead}
          />
          <Reveal delay={120}>
            {/* TODO(launch): link to the driver sign-up flow */}
            <a href="#download" className="btn-primary mt-8">
              {t.drivers.cta}
              <Icon.ArrowEnd className="h-4 w-4" />
            </a>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
