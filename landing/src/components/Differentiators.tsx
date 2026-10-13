import type { ComponentType, SVGProps } from 'react'
import { useLang } from '../i18n'
import { Icon } from './Icons'
import { Reveal } from './Reveal'
import { SectionHeading } from './SectionHeading'
import { FeatureCallouts } from './FeatureCallouts'

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

const mainIcons: IconCmp[] = [VoiceImageIcon, Icon.Sparkles, Icon.Table, Icon.Stores, Icon.Route, Icon.Users, Icon.Heart, Icon.Bike]

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

        <FeatureCallouts />

      </div>
    </section>
  )
}
