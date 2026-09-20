import { useId, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useT } from '../../i18n'
import { SectionHeading } from '../ui/SectionHeading'
import { Reveal } from '../ui/Reveal'

export function Faq() {
  const { t } = useT()
  const [open, setOpen] = useState<number | null>(0)
  const base = useId()

  return (
    <section id="faq" aria-labelledby="faq-heading" className="scroll-mt-20 border-t border-espresso-900/10 bg-cream-50 py-20 text-espresso-900 sm:py-28">
      <div className="container-x grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <SectionHeading id="faq-heading" tone="cream" eyebrow={t.faq.eyebrow} title={t.faq.heading} />
        <Reveal delay={100}>
          <div className="divide-y divide-espresso-900/10 rounded-3xl border border-espresso-900/10 bg-white shadow-card">
            {t.faq.items.map((item, i) => {
              const isOpen = open === i
              const btnId = `${base}-q${i}`
              const panelId = `${base}-a${i}`
              return (
                <div key={item.q}>
                  <h3>
                    <button
                      type="button"
                      id={btnId}
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => setOpen(isOpen ? null : i)}
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-start text-[0.98rem] font-semibold hover:bg-cream-50/70 focus-visible:outline-copper-500"
                    >
                      {item.q}
                      <ChevronDown
                        className={`h-5 w-5 shrink-0 text-copper-600 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                        aria-hidden="true"
                      />
                    </button>
                  </h3>
                  <div id={panelId} role="region" aria-labelledby={btnId} hidden={!isOpen} className="px-5 pb-5">
                    <p className="text-sm leading-relaxed text-espresso-500">{item.a}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
