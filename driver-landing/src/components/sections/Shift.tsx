import { Bot, Info } from 'lucide-react'
import { useT } from '../../i18n'
import { SCREENS } from '../../config'
import { SectionHeading } from '../ui/SectionHeading'
import { Reveal } from '../ui/Reveal'
import { PhoneFrame } from '../ui/PhoneFrame'

export function Shift() {
  const { t } = useT()
  return (
    <section id="shift" aria-labelledby="shift-heading" className="scroll-mt-20 bg-cream-50 py-20 text-espresso-900 sm:py-28">
      <div className="container-x">
        <SectionHeading id="shift-heading" tone="cream" align="center" eyebrow={t.shift.eyebrow} title={t.shift.heading} subhead={t.shift.subhead} />

        <div className="mt-14 grid gap-12 lg:mt-20 lg:grid-cols-3 lg:gap-8">
          {t.shift.screens.map((sc, i) => {
            const NoteIcon = sc.note && /ai|ذكاء/i.test(sc.note.label) ? Bot : Info
            return (
              <Reveal key={sc.key} delay={i * 120} as="article" className="flex flex-col items-center text-center lg:items-stretch lg:text-start">
                <PhoneFrame src={SCREENS[sc.key]} alt={sc.alt} className="w-[13.5rem] sm:w-[14rem]" />
                <div className="mt-8 w-full">
                  <p className="eyebrow eyebrow-on-cream">{sc.caption}</p>
                  <h3 className="mt-2 text-2xl font-bold tracking-tight">{sc.title}</h3>
                  <ul className="mt-5 space-y-3 text-start">
                    {sc.features.map((f) => (
                      <li key={f.name} className="rounded-2xl border border-espresso-900/10 bg-white/80 px-4 py-3">
                        <p className="font-bold">{f.name}</p>
                        <p className="mt-0.5 text-sm text-espresso-500">{f.desc}</p>
                      </li>
                    ))}
                  </ul>
                  {sc.note && (
                    <p className="mt-4 flex gap-2.5 rounded-2xl bg-espresso-900 p-4 text-start text-sm leading-relaxed text-cream-100">
                      <NoteIcon className="mt-0.5 h-4 w-4 shrink-0 text-copper-300" aria-hidden="true" />
                      <span>
                        <strong className="font-bold text-copper-300">{sc.note.label}: </strong>
                        {sc.note.text}
                      </span>
                    </p>
                  )}
                </div>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
