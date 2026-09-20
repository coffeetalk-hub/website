import { ScanFace, MapPinned, FileWarning, Siren } from 'lucide-react'
import { useT } from '../../i18n'
import { SectionHeading } from '../ui/SectionHeading'
import { Reveal } from '../ui/Reveal'

const icons = [ScanFace, MapPinned, FileWarning]

export function Safety() {
  const { t } = useT()
  return (
    <section id="safety" aria-labelledby="safety-heading" className="scroll-mt-20 py-20 sm:py-28">
      <div className="container-x">
        <SectionHeading id="safety-heading" eyebrow={t.safety.eyebrow} title={t.safety.heading} subhead={t.safety.subhead} />
        <ul className="mt-12 grid gap-4 sm:grid-cols-3">
          {t.safety.points.map((p, i) => {
            const Icon = icons[i]
            return (
              <Reveal as="li" key={p.name} delay={i * 90} className="card-dark">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-copper-400/15 text-copper-300">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-lg font-bold text-cream-50">{p.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-sand-400">{p.desc}</p>
              </Reveal>
            )
          })}
        </ul>
        <Reveal delay={300}>
          <p className="mt-6 flex gap-3 rounded-2xl border border-cream-50/10 p-4 text-sm text-sand-400">
            <Siren className="mt-0.5 h-4 w-4 shrink-0 text-copper-300" aria-hidden="true" />
            {t.safety.sosNote}
          </p>
        </Reveal>
      </div>
    </section>
  )
}
