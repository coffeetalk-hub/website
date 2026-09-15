import { useLang } from '../i18n'
import { Reveal } from './Reveal'

export function StatsStrip() {
  const { t } = useLang()
  return (
    <section aria-labelledby="stats-heading" className="border-y border-espresso-900/8 bg-cream-100 py-14 sm:py-16">
      <div className="container-x">
        <h2 id="stats-heading" className="sr-only">
          {t.stats.heading}
        </h2>
        <dl className="grid gap-8 sm:grid-cols-3 sm:gap-6">
          {t.stats.items.map((s, i) => (
            <Reveal key={s.label} delay={i * 90} className="text-center">
              <dd className="text-4xl font-extrabold tracking-tight text-espresso-900 sm:text-5xl">{s.value}</dd>
              <dt className="mt-2 text-sm font-medium text-espresso-500">{s.label}</dt>
            </Reveal>
          ))}
        </dl>
      </div>
    </section>
  )
}
