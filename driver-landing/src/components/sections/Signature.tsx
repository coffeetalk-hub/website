import { BadgeCheck, ToggleRight, Timer, Layers, FileWarning } from 'lucide-react'
import { useT } from '../../i18n'
import { SectionHeading } from '../ui/SectionHeading'
import { Reveal } from '../ui/Reveal'
import { Badge } from '../ui/Badge'

const icons = [BadgeCheck, ToggleRight, Timer, Layers, FileWarning]

export function Signature() {
  const { t } = useT()
  return (
    <section aria-labelledby="signature-heading" className="bg-cream-50 py-20 text-espresso-900 sm:py-28">
      <div className="container-x">
        <SectionHeading id="signature-heading" tone="cream" eyebrow={t.signature.eyebrow} title={t.signature.heading} subhead={t.signature.subhead} />
      </div>
      {/* horizontal scroll on phones, 5-up on desktop */}
      <div className="mt-12 overflow-x-auto px-5 pb-2 sm:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:mt-16">
        <ul className="mx-auto flex w-max gap-4 lg:grid lg:w-full lg:max-w-6xl lg:grid-cols-5">
          {t.signature.items.map((item, i) => {
            const Icon = icons[i]
            return (
              <Reveal as="li" key={item.name} delay={i * 70} className="w-64 shrink-0 rounded-3xl border border-espresso-900/10 bg-white p-6 shadow-card lg:w-auto">
                <div className="flex items-center justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-espresso-900 text-copper-300">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <Badge kind="signature" label={t.signature.badge} />
                </div>
                <h3 className="mt-5 text-lg font-bold leading-snug">{item.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-espresso-500">{item.desc}</p>
              </Reveal>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
