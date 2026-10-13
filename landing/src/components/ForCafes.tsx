import { useState } from 'react'
import { useLang } from '../i18n'
import { Icon } from './Icons'
import { PartnerForm } from './PartnerForm'
import { Reveal } from './Reveal'
import { SectionHeading } from './SectionHeading'

const categoryIcons = [Icon.Cup, Icon.Leaf, Icon.Sparkles, Icon.Package]
const capabilityIcons = [Icon.Grid, Icon.Table, Icon.Receipt, Icon.Package, Icon.Users]

export function ForCafes() {
  const { t } = useLang()
  const [formOpen, setFormOpen] = useState(false)

  return (
    <section id="industry" aria-labelledby="industry-heading" className="scroll-mt-20 py-20 sm:py-28">
      <div className="container-x grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16">
        <div>
          <SectionHeading
            id="industry-heading"
            align="start"
            eyebrow={t.cafes.eyebrow}
            title={t.cafes.heading}
            subhead={t.cafes.subhead}
          />
          <Reveal delay={120}>
            <button type="button" onClick={() => setFormOpen(true)} className="btn-dark mt-8">
              {t.cafes.cta}
              <Icon.ArrowEnd className="h-4 w-4" />
            </button>
          </Reveal>
        </div>

        <ul className="grid gap-4 sm:grid-cols-2">
          {t.cafes.categories.map((cat, i) => {
            const Ico = categoryIcons[i]
            return (
              <Reveal as="li" key={cat.title} delay={i * 70} className="card flex flex-col">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-cream-200/70 text-copper-600">
                  <Ico className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-bold text-espresso-900">{cat.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-espresso-500">{cat.audience}</p>
                <p className="mt-3 text-sm leading-relaxed text-espresso-800">{cat.body}</p>
              </Reveal>
            )
          })}
        </ul>
      </div>

      {/* Existing partner capabilities, kept as secondary highlights */}
      <div className="container-x mt-14">
        <Reveal>
          <h3 className="text-sm font-bold text-espresso-900">{t.cafes.capabilitiesHeading}</h3>
          <p className="mt-1 text-xs text-espresso-500">{t.cafes.capabilitiesNote}</p>
        </Reveal>
        <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {t.cafes.items.map((item, i) => {
            const Ico = capabilityIcons[i]
            return (
              <Reveal as="li" key={item.title} delay={i * 60} className="flex gap-3">
                <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-cream-200/70 text-copper-600">
                  <Ico className="h-4 w-4" />
                </span>
                <div>
                  <h4 className="text-sm font-semibold text-espresso-900">{item.title}</h4>
                  <p className="mt-0.5 text-xs leading-relaxed text-espresso-500">{item.body}</p>
                </div>
              </Reveal>
            )
          })}
        </ul>
      </div>

      <PartnerForm open={formOpen} onClose={() => setFormOpen(false)} />
    </section>
  )
}
