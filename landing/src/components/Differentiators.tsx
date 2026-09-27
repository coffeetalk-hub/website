import type { ComponentType, SVGProps } from 'react'
import { useLang } from '../i18n'
import { Icon } from './Icons'
import { Reveal } from './Reveal'
import { SectionHeading } from './SectionHeading'

type IconCmp = ComponentType<SVGProps<SVGSVGElement>>

function VoiceImageIcon(p: SVGProps<SVGSVGElement>) {
  // Mic + camera lockup for the first differentiator
  return (
    <span className="relative inline-block" aria-hidden="true">
      <Icon.Mic {...p} />
      <Icon.Camera className="absolute -end-2 -bottom-2 h-4 w-4 rounded-full bg-cream-50 p-0.5" />
    </span>
  )
}

const mainIcons: IconCmp[] = [VoiceImageIcon, Icon.Sparkles, Icon.Table, Icon.Stores]

function SignatureTag() {
  const { t } = useLang()
  return (
    <span className="rounded-full bg-copper-500 px-1.5 py-0.5 text-[0.6rem] font-bold text-white">{t.appTour.signatureBadge}</span>
  )
}

function SoonTag() {
  const { t } = useLang()
  return (
    <span className="rounded-full border border-espresso-900/15 px-1.5 py-0.5 text-[0.6rem] font-semibold text-espresso-500">
      {t.appTour.soonBadge}
    </span>
  )
}

export function Differentiators() {
  const { t } = useLang()
  return (
    <section id="features" aria-labelledby="features-heading" className="scroll-mt-20 py-20 sm:py-28">
      <div className="container-x">
        <SectionHeading id="features-heading" title={t.differentiators.heading} subhead={t.differentiators.subhead} />

        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:mt-16 lg:grid-cols-4">
          {t.differentiators.items.map((item, i) => {
            const Ico = mainIcons[i]
            return (
              <Reveal as="li" key={item.title} delay={i * 80} className="card flex flex-col">
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-espresso-900 text-copper-300">
                  <Ico className="h-6 w-6" />
                </span>
                <h3 className="mt-5 text-lg font-bold text-espresso-900">{item.title}</h3>
                <p className="mt-2 text-[0.95rem] leading-relaxed text-espresso-500">{item.body}</p>
              </Reveal>
            )
          })}
        </ul>

        {/* All features, listed by app area (plus the extras from the brief) */}
        <div className="mt-20 lg:mt-24">
          <Reveal className="max-w-2xl">
            <p className="eyebrow">{t.appTour.eyebrow}</p>
            <h3 className="mt-2 text-2xl font-extrabold tracking-tight text-espresso-900 sm:text-3xl">{t.appTour.heading}</h3>
            <p className="mt-2 text-espresso-500">{t.appTour.subhead}</p>
          </Reveal>
          <div className="mt-8 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {t.appTour.tabs.map((tab, i) => (
              <Reveal key={tab.id} delay={i * 60}>
                <h4 className="flex items-center gap-2 border-b border-espresso-900/10 pb-2 text-base font-bold text-espresso-900">
                  {tab.name}
                  {tab.soon && <SoonTag />}
                </h4>
                <ul className="mt-3 space-y-2">
                  {tab.groups.map((g) => (
                    <li key={g.title} className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                      <span className="text-espresso-800">{g.title}</span>
                      {g.tag === 'signature' && <SignatureTag />}
                      {g.tag === 'soon' && !tab.soon && <SoonTag />}
                    </li>
                  ))}
                </ul>
              </Reveal>
            ))}
            <Reveal delay={300}>
              <h4 className="border-b border-espresso-900/10 pb-2 text-base font-bold text-espresso-900">{t.supporting.heading}</h4>
              <ul className="mt-3 space-y-2">
                {t.supporting.items.map((item) => (
                  <li key={item.title} className="text-sm text-espresso-800">
                    {item.title}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}
