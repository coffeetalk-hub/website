import { useLang } from '../i18n'
import { Icon } from './Icons'
import { Reveal } from './Reveal'
import { SectionHeading } from './SectionHeading'

const icons = [Icon.Mic, Icon.Bike, Icon.Heart]

export function HowItWorks() {
  const { t } = useLang()
  return (
    <section
      id="how"
      aria-labelledby="how-heading"
      className="scroll-mt-20 bg-espresso-900 py-20 text-cream-50 sm:py-28"
    >
      <div className="container-x">
        <SectionHeading id="how-heading" tone="dark" title={t.howItWorks.heading} subhead={t.howItWorks.subhead} />

        <ol className="relative mt-12 grid gap-8 lg:mt-16 lg:grid-cols-3 lg:gap-6">
          {/* connector line (desktop) */}
          <div
            aria-hidden="true"
            className="absolute top-8 hidden h-px w-full bg-gradient-to-r from-transparent via-copper-400/40 to-transparent lg:block"
          />
          {t.howItWorks.steps.map((step, i) => {
            const Ico = icons[i]
            return (
              <Reveal as="li" key={step.title} delay={i * 120} className="relative flex gap-5 lg:block">
                <div className="relative z-10 flex shrink-0 items-center gap-3">
                  <span className="grid h-16 w-16 place-items-center rounded-2xl border border-copper-400/30 bg-espresso-800 text-copper-300">
                    <Ico className="h-7 w-7" />
                  </span>
                  <span className="text-sm font-bold text-copper-300 lg:hidden">0{i + 1}</span>
                </div>
                <div className="lg:mt-6">
                  <p className="hidden text-sm font-bold text-copper-300 lg:block">0{i + 1}</p>
                  <h3 className="mt-1 text-xl font-bold">{step.title}</h3>
                  <p className="mt-2 max-w-sm leading-relaxed text-cream-200/75">{step.body}</p>
                </div>
              </Reveal>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
