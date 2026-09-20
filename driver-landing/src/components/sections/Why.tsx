import { ToggleRight, Route, ShieldCheck, Wallet, Check } from 'lucide-react'
import { useT } from '../../i18n'
import { SectionHeading } from '../ui/SectionHeading'
import { Reveal } from '../ui/Reveal'

const icons = [ToggleRight, Route, ShieldCheck, Wallet]

export function Why() {
  const { t } = useT()
  return (
    <section id="why" aria-labelledby="why-heading" className="scroll-mt-20 py-20 sm:py-28">
      <div className="container-x">
        <SectionHeading id="why-heading" eyebrow={t.why.eyebrow} title={t.why.heading} subhead={t.why.subhead} />

        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:mt-16 lg:gap-5">
          {t.why.tiles.map((tile, i) => {
            const Icon = icons[i]
            const lead = i === 0
            return (
              <Reveal
                as="li"
                key={tile.title}
                delay={i * 90}
                className={`rounded-3xl p-7 sm:p-8 ${
                  lead ? 'bg-copper-400 text-espresso-950' : 'border border-cream-50/10 bg-espresso-900 text-cream-50'
                }`}
              >
                <span
                  className={`grid h-12 w-12 place-items-center rounded-2xl ${
                    lead ? 'bg-espresso-950 text-copper-300' : 'bg-copper-400/15 text-copper-300'
                  }`}
                >
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <h3 className="mt-6 text-2xl font-bold tracking-tight sm:text-[1.7rem]">{tile.title}</h3>
                <p className={`mt-3 text-base leading-relaxed ${lead ? 'text-espresso-900/85' : 'text-sand-400'}`}>{tile.body}</p>
                <ul className="mt-6 space-y-2">
                  {tile.points.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-sm font-medium">
                      <Check className={`mt-0.5 h-4 w-4 shrink-0 ${lead ? 'text-espresso-950' : 'text-copper-300'}`} aria-hidden="true" />
                      {p}
                    </li>
                  ))}
                </ul>
              </Reveal>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
