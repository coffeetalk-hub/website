import { CheckCircle2 } from 'lucide-react'
import { useT } from '../../i18n'
import { SectionHeading } from '../ui/SectionHeading'
import { Reveal } from '../ui/Reveal'
import { ApplyButton } from '../ui/ApplyButton'

export function Requirements() {
  const { t } = useT()
  return (
    <section id="requirements" aria-labelledby="requirements-heading" className="scroll-mt-20 bg-cream-50 py-20 text-espresso-900 sm:py-28">
      <div className="container-x grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <div>
          <SectionHeading id="requirements-heading" tone="cream" eyebrow={t.requirements.eyebrow} title={t.requirements.heading} subhead={t.requirements.subhead} />
          <Reveal delay={150} className="mt-8">
            <ApplyButton className="btn-on-cream" arrow>
              {t.requirements.cta}
            </ApplyButton>
          </Reveal>
        </div>
        <Reveal delay={100}>
          <ol className="divide-y divide-espresso-900/10 rounded-3xl border border-espresso-900/10 bg-white shadow-card">
            {t.requirements.items.map((item, i) => (
              <li key={item} className="flex items-start gap-4 px-5 py-5">
                <span className="mt-0.5 text-sm font-bold text-copper-600 tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                <span className="text-[1.02rem] leading-relaxed">{item}</span>
                <CheckCircle2 className="ms-auto mt-0.5 h-5 w-5 shrink-0 text-copper-600" aria-hidden="true" />
              </li>
            ))}
          </ol>
        </Reveal>
      </div>
    </section>
  )
}
