import { useLang } from '../i18n'
import { Reveal } from './Reveal'
import { StoreBadges } from './StoreBadges'

export function Download() {
  const { t } = useLang()
  return (
    <section id="download" aria-labelledby="download-heading" className="scroll-mt-20 py-20 sm:py-28">
      <div className="container-x">
        <Reveal className="relative overflow-hidden rounded-3xl bg-espresso-900 px-6 py-14 text-center text-cream-50 sm:px-12 sm:py-20">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_60%_at_50%_0%,rgba(208,122,60,0.35),transparent_70%)]"
          />
          <div className="relative mx-auto max-w-2xl">
            <h2
              id="download-heading"
              className="text-3xl font-extrabold tracking-tight text-balance sm:text-4xl lg:text-5xl"
            >
              {t.download.heading}
            </h2>
            <p className="mt-4 text-lg text-cream-200/80">{t.download.subhead}</p>
            <StoreBadges variant="light" className="mt-8 justify-center" />
            <p className="mt-5 text-xs text-cream-200/60">{t.download.note}</p>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
