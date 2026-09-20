import { useT } from '../../i18n'
import { Reveal } from '../ui/Reveal'
import { RouteLine } from '../ui/RouteLine'
import { ApplyButton } from '../ui/ApplyButton'

export function FinalCta() {
  const { t } = useT()
  return (
    <section aria-labelledby="final-heading" className="py-20 sm:py-28">
      <div className="container-x">
        <Reveal className="relative overflow-hidden rounded-3xl bg-copper-400 px-6 py-14 text-center text-espresso-950 sm:px-12 sm:py-20">
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-1/2 h-40 -translate-y-1/2 text-espresso-950 opacity-30">
            <RouteLine />
          </div>
          <div className="relative mx-auto max-w-xl">
            <h2 id="final-heading" className="text-3xl font-bold tracking-tight text-balance sm:text-4xl lg:text-5xl">
              {t.finalCta.heading}
            </h2>
            <p className="mt-4 text-lg text-espresso-900/80">{t.finalCta.subhead}</p>
            <div className="mt-8">
              <ApplyButton className="inline-flex items-center gap-2 rounded-xl bg-espresso-950 px-7 py-3.5 text-base font-semibold text-cream-50 transition-colors hover:bg-espresso-900 focus-visible:outline-espresso-950" arrow>
                {t.finalCta.primary}
              </ApplyButton>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
