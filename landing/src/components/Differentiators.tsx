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
const supportIcons: IconCmp[] = [Icon.Calendar, Icon.Receipt, Icon.Bag, Icon.Target, Icon.Leaf, Icon.Music]

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

        {/* Supporting features */}
        <div className="mt-20 lg:mt-24">
          <Reveal>
            <h3 className="text-center text-xl font-bold text-espresso-900 sm:text-2xl">{t.supporting.heading}</h3>
          </Reveal>
          <ul className="mt-8 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
            {t.supporting.items.map((item, i) => {
              const Ico = supportIcons[i]
              return (
                <Reveal as="li" key={item.title} delay={i * 60} className="flex gap-4">
                  <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-cream-200/70 text-copper-600">
                    <Ico className="h-5 w-5" />
                  </span>
                  <div>
                    <h4 className="font-semibold text-espresso-900">{item.title}</h4>
                    <p className="mt-1 text-sm leading-relaxed text-espresso-500">{item.body}</p>
                  </div>
                </Reveal>
              )
            })}
          </ul>
        </div>
      </div>
    </section>
  )
}
