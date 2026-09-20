import { ShieldCheck, ToggleRight, Route, MapPinned, Award, Bot, Info } from 'lucide-react'
import type { ComponentType } from 'react'
import { useT } from '../../i18n'
import type { Theme } from '../../i18n/types'
import { SCREENS } from '../../config'
import { SectionHeading } from '../ui/SectionHeading'
import { Reveal } from '../ui/Reveal'
import { Badge } from '../ui/Badge'
import { PhoneFrame } from '../ui/PhoneFrame'

const icons: Record<string, ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' }>> = {
  start: ShieldCheck,
  flex: ToggleRight,
  smart: Route,
  protected: MapPinned,
  tier: Award,
}

function ThemeBlock({ theme, index }: { theme: Theme; index: number }) {
  const { t } = useT()
  const Icon = icons[theme.id] ?? ShieldCheck
  const flip = index % 2 === 1
  const screenSrc = theme.screen ? SCREENS[theme.screen] : null
  const screenAlt = theme.screen ? t.screensAlt[theme.screen] : ''
  const NoteIcon = theme.note?.label.toLowerCase().includes('ai') || theme.note?.label.includes('ذكاء') ? Bot : Info

  return (
    <article
      id={`theme-${theme.id}`}
      aria-labelledby={`theme-${theme.id}-title`}
      className={`grid items-start gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14 ${theme.comingLater ? 'opacity-95' : ''}`}
    >
      <Reveal className={`${flip ? 'lg:order-2' : ''}`}>
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-copper-400/15 text-copper-300">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          {theme.comingLater && <Badge kind="later" label={t.themes.comingLater} />}
        </div>
        <h3 id={`theme-${theme.id}-title`} className="mt-4 text-2xl font-bold tracking-tight text-cream-50 sm:text-3xl">
          {theme.title}
        </h3>
        <p className="mt-3 max-w-md text-lg text-sand-400">{theme.benefit}</p>
        {theme.note && (
          <p className="mt-5 flex max-w-md gap-3 rounded-2xl border border-copper-400/25 bg-copper-400/8 p-4 text-sm leading-relaxed text-cream-100">
            <NoteIcon className="mt-0.5 h-4 w-4 shrink-0 text-copper-300" aria-hidden="true" />
            <span>
              <strong className="font-bold text-copper-300">{theme.note.label}: </strong>
              {theme.note.text}
            </span>
          </p>
        )}
      </Reveal>

      <div className={`${flip ? 'lg:order-1' : ''} ${screenSrc ? 'grid gap-6 sm:grid-cols-[1fr_11rem] sm:items-start' : ''}`}>
        <ul className={`grid gap-3 ${screenSrc ? '' : 'sm:grid-cols-2'}`}>
          {theme.features.map((f, i) => (
            <Reveal as="li" key={f.name} delay={i * 60} className="card-dark py-4">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="font-bold text-cream-50">{f.name}</h4>
                {f.signature && <Badge kind="signature" label={t.themes.signature} />}
              </div>
              <p className="mt-1 text-sm leading-relaxed text-sand-400">{f.desc}</p>
            </Reveal>
          ))}
        </ul>
        {screenSrc && (
          <Reveal delay={120} className="hidden sm:block">
            <PhoneFrame src={screenSrc} alt={screenAlt} className="w-[11rem] sm:w-[11rem]" />
          </Reveal>
        )}
      </div>
    </article>
  )
}

export function Themes() {
  const { t } = useT()
  return (
    <section id="features" aria-labelledby="features-heading" className="scroll-mt-20 py-20 sm:py-28">
      <div className="container-x">
        <SectionHeading id="features-heading" eyebrow={t.themes.eyebrow} title={t.themes.heading} subhead={t.themes.subhead} />
        <div className="mt-14 space-y-20 lg:mt-20 lg:space-y-28">
          {t.themes.items.map((theme, i) => (
            <ThemeBlock key={theme.id} theme={theme} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
