import { Landmark, Car, TriangleAlert } from 'lucide-react'
import { useT } from '../../i18n'
import { SectionHeading } from '../ui/SectionHeading'
import { Reveal } from '../ui/Reveal'

const icons = [Landmark, Car]

/**
 * Only what the product map supports: bank + vehicle details live in Settings.
 * Earnings structure and payout schedule are a visible TODO until product supplies them.
 */
export function Earnings() {
  const { t } = useT()
  return (
    <section id="earnings" aria-labelledby="earnings-heading" className="scroll-mt-20 border-t border-espresso-900/10 bg-cream-100 py-20 text-espresso-900 sm:py-28">
      <div className="container-x grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-16">
        <div>
          <SectionHeading id="earnings-heading" tone="cream" eyebrow={t.earnings.eyebrow} title={t.earnings.heading} subhead={t.earnings.body} />
          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {t.earnings.points.map((p, i) => {
              const Icon = icons[i]
              return (
                <Reveal as="li" key={p.name} delay={i * 80} className="card-cream flex gap-4 py-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-espresso-900 text-copper-300">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="font-bold">{p.name}</h3>
                    <p className="mt-1 text-sm text-espresso-500">{p.desc}</p>
                  </div>
                </Reveal>
              )
            })}
          </ul>
        </div>
        <Reveal delay={150} className="self-center">
          {/* TODO(launch): replace with real earnings structure + payout schedule from product. */}
          <div className="todo flex gap-3 text-espresso-900">
            <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-copper-600" aria-hidden="true" />
            <p className="leading-relaxed">{t.earnings.todo}</p>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
