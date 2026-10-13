import { useState } from 'react'
import { useLang } from '../i18n'
import { Icon } from './Icons'
import { PartnerForm } from './PartnerForm'
import { Reveal } from './Reveal'
import { SectionHeading } from './SectionHeading'

const icons = [Icon.Grid, Icon.Table, Icon.Receipt, Icon.Package, Icon.Users]
const categoryIcons = [Icon.Cup, Icon.Leaf, Icon.Package, Icon.Bag]

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
          {t.cafes.items.map((item, i) => {
            const Ico = icons[i]
            const last = i === t.cafes.items.length - 1
            return (
              <Reveal
                as="li"
                key={item.title}
                delay={i * 70}
                className={`card flex gap-4 ${last ? 'sm:col-span-2 sm:flex-row' : ''}`}
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-cream-200/70 text-copper-600">
                  <Ico className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-bold text-espresso-900">{item.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-espresso-500">{item.body}</p>
                </div>
              </Reveal>
            )
          })}
        </ul>
      </div>

      {/* Partner types, as a branch from "Industry partners" */}
      <div className="container-x mt-16">
        <Reveal>
          <ol className="tree">
            <li className="tree-root">
              <span className="inline-flex items-center gap-2 rounded-full bg-espresso-900 px-4 py-2 text-sm font-bold text-cream-50">
                <Icon.Users className="h-4 w-4 text-copper-300" />
                {t.cafes.branchRoot}
              </span>
              <ul className="tree-children">
                {t.cafes.categories.map((cat, i) => {
                  const Ico = categoryIcons[i]
                  return (
                    <li key={cat.title} className="tree-child">
                      <div className="card h-full py-4">
                        <span className="grid h-9 w-9 place-items-center rounded-lg bg-cream-200/70 text-copper-600">
                          <Ico className="h-4 w-4" />
                        </span>
                        <h3 className="mt-3 text-sm font-bold text-espresso-900">{cat.title}</h3>
                        <p className="mt-1 text-xs leading-relaxed text-espresso-500">{cat.audience}</p>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </li>
          </ol>
        </Reveal>
      </div>

      <PartnerForm open={formOpen} onClose={() => setFormOpen(false)} />
    </section>
  )
}
