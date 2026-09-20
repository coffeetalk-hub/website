import { Receipt, Landmark, FileText, TriangleAlert, Award, Check } from 'lucide-react'
import { useT } from '../../i18n'
import { SectionHeading } from '../ui/SectionHeading'
import { Reveal } from '../ui/Reveal'
import { Badge } from '../ui/Badge'

const icons = [Receipt, Landmark, FileText]

/** Pay + the Butler tier callout. Payout terms are a visible TODO until product supplies them. */
export function Pay() {
  const { t } = useT()
  return (
    <section id="pay" aria-labelledby="pay-heading" className="scroll-mt-20 py-20 sm:py-28">
      <div className="container-x grid gap-12 lg:grid-cols-[1fr_1fr] lg:gap-16">
        <div>
          <SectionHeading id="pay-heading" eyebrow={t.pay.eyebrow} title={t.pay.heading} subhead={t.pay.body} />
          <ul className="mt-8 grid gap-3">
            {t.pay.points.map((p, i) => {
              const Icon = icons[i]
              return (
                <Reveal as="li" key={p.name} delay={i * 80} className="flex gap-4 rounded-2xl border border-cream-50/10 bg-espresso-900 p-5">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-copper-400/15 text-copper-300">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="font-bold text-cream-50">{p.name}</h3>
                    <p className="mt-1 text-sm text-sand-400">{p.desc}</p>
                  </div>
                </Reveal>
              )
            })}
          </ul>
          <Reveal delay={260} className="mt-4">
            {/* TODO(launch): replace with the real earnings structure + payout schedule. */}
            <p className="todo flex gap-3 text-cream-100">
              <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-copper-300" aria-hidden="true" />
              {t.pay.todo}
            </p>
          </Reveal>
        </div>

        <Reveal delay={150} className="self-start rounded-3xl border border-copper-400/30 bg-[linear-gradient(160deg,rgba(208,122,60,0.16),rgba(208,122,60,0.03))] p-7 sm:p-9 lg:mt-10">
          <div className="flex items-center justify-between gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-copper-400 text-espresso-950">
              <Award className="h-6 w-6" aria-hidden="true" />
            </span>
            <Badge kind="later" label={t.tier.badge} />
          </div>
          <h3 className="mt-6 text-2xl font-bold tracking-tight text-cream-50 sm:text-3xl">{t.tier.title}</h3>
          <p className="mt-3 leading-relaxed text-sand-400">{t.tier.body}</p>
          <ul className="mt-6 space-y-2">
            {t.tier.points.map((p) => (
              <li key={p} className="flex items-start gap-2 text-sm font-medium text-cream-50">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-copper-300" aria-hidden="true" />
                {p}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  )
}
