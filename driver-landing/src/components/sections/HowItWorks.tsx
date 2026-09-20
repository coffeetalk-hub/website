import { Upload, BadgeCheck, ScanFace, Navigation } from 'lucide-react'
import { useT } from '../../i18n'
import { SectionHeading } from '../ui/SectionHeading'
import { Reveal } from '../ui/Reveal'
import { ApplyButton } from '../ui/ApplyButton'

const icons = [Upload, BadgeCheck, ScanFace, Navigation]

export function HowItWorks() {
  const { t } = useT()
  return (
    <section id="how" aria-labelledby="how-heading" className="scroll-mt-20 py-20 sm:py-28">
      <div className="container-x">
        <SectionHeading id="how-heading" eyebrow={t.how.eyebrow} title={t.how.heading} subhead={t.how.subhead} />

        <ol className="relative mt-12 grid gap-6 sm:grid-cols-2 lg:mt-16 lg:grid-cols-4">
          <svg aria-hidden="true" className="absolute top-9 hidden h-4 w-full text-copper-300 lg:block" viewBox="0 0 1000 16" preserveAspectRatio="none" fill="none">
            <path d="M0 8 H1000" stroke="currentColor" strokeOpacity="0.35" strokeWidth="2" strokeDasharray="8 8" vectorEffect="non-scaling-stroke" className="motion-safe:animate-route" />
          </svg>
          {t.how.steps.map((s, i) => {
            const Icon = icons[i]
            return (
              <Reveal as="li" key={s.title} delay={i * 100} className="relative">
                <div className="relative z-10 flex items-center gap-4">
                  <span className="grid h-[4.5rem] w-[4.5rem] shrink-0 place-items-center rounded-2xl bg-copper-400 text-espresso-950 ring-8 ring-espresso-950">
                    <Icon className="h-7 w-7" aria-hidden="true" />
                  </span>
                  <span className="text-5xl font-bold text-cream-50/15 tabular-nums lg:hidden">{i + 1}</span>
                </div>
                <div className="mt-5">
                  <p className="hidden text-5xl font-bold text-cream-50/15 tabular-nums lg:block">{i + 1}</p>
                  <h3 className="mt-1 text-xl font-bold text-cream-50">{s.title}</h3>
                  <p className="mt-2 max-w-xs text-sm leading-relaxed text-sand-400">{s.desc}</p>
                </div>
              </Reveal>
            )
          })}
        </ol>

        <Reveal delay={200} className="mt-12">
          <ApplyButton className="btn-primary" arrow>
            {t.nav.apply}
          </ApplyButton>
        </Reveal>
      </div>
    </section>
  )
}
