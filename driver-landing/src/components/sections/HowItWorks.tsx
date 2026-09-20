import { Upload, BadgeCheck, ScanFace, Navigation } from 'lucide-react'
import { useT } from '../../i18n'
import { SectionHeading } from '../ui/SectionHeading'
import { Reveal } from '../ui/Reveal'
import { ApplyButton } from '../ui/ApplyButton'

const icons = [Upload, BadgeCheck, ScanFace, Navigation]

export function HowItWorks() {
  const { t } = useT()
  return (
    <section id="how" aria-labelledby="how-heading" className="scroll-mt-20 bg-cream-50 py-20 text-espresso-900 sm:py-28">
      <div className="container-x">
        <SectionHeading id="how-heading" tone="cream" eyebrow={t.how.eyebrow} title={t.how.heading} subhead={t.how.subhead} />

        <ol className="relative mt-12 grid gap-8 lg:mt-16 lg:grid-cols-4 lg:gap-6">
          {/* route connector (desktop) */}
          <svg
            aria-hidden="true"
            className="absolute top-7 hidden h-4 w-full text-copper-500 lg:block"
            viewBox="0 0 1000 16"
            preserveAspectRatio="none"
            fill="none"
          >
            <path d="M0 8 H1000" stroke="currentColor" strokeOpacity="0.4" strokeWidth="2" strokeDasharray="8 8" vectorEffect="non-scaling-stroke" className="motion-safe:animate-route" />
          </svg>
          {t.how.steps.map((s, i) => {
            const Icon = icons[i]
            return (
              <Reveal as="li" key={s.title} delay={i * 100} className="relative flex gap-5 lg:block">
                <div className="relative z-10 flex shrink-0 items-start">
                  <span className="grid h-14 w-14 place-items-center rounded-2xl bg-espresso-900 text-copper-300 ring-4 ring-cream-50">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                </div>
                <div className="lg:mt-5">
                  <p className="text-xs font-bold text-copper-600">{String(i + 1).padStart(2, '0')}</p>
                  <h3 className="mt-1 text-lg font-bold">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-espresso-500">{s.desc}</p>
                </div>
              </Reveal>
            )
          })}
        </ol>

        <Reveal delay={200} className="mt-12">
          <ApplyButton className="btn-on-cream" arrow>
            {t.nav.apply}
          </ApplyButton>
        </Reveal>
      </div>
    </section>
  )
}
