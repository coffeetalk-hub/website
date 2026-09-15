import { useLang } from '../i18n'
import { Icon } from './Icons'

/**
 * CSS/SVG phone frame with a simple "voice order matched" screen.
 * Decorative; the description for assistive tech comes from `t.hero.mockupAlt`.
 */
export function PhoneMockup() {
  const { t } = useLang()
  const s = t.hero.screen

  return (
    <figure className="relative mx-auto w-[17rem] sm:w-[18.5rem]" aria-label={t.hero.mockupAlt}>
      {/* soft glow */}
      <div
        aria-hidden="true"
        className="absolute -inset-10 -z-10 rounded-full bg-[radial-gradient(closest-side,rgba(208,122,60,0.35),transparent_70%)] blur-2xl"
      />
      {/* frame */}
      <div className="rounded-[2.6rem] border border-white/10 bg-espresso-950 p-2.5 shadow-phone">
        <div className="relative overflow-hidden rounded-[2.1rem] bg-cream-50 text-espresso-900">
          {/* notch */}
          <div aria-hidden="true" className="absolute inset-x-0 top-0 z-10 flex justify-center pt-2">
            <div className="h-5 w-24 rounded-full bg-espresso-950" />
          </div>

          <div className="space-y-4 px-4 pt-12 pb-5">
            {/* status */}
            <div className="flex items-center justify-between text-[0.7rem] text-espresso-500">
              <span className="font-semibold">9:41</span>
              <span className="flex gap-1" aria-hidden="true">
                <i className="block h-2 w-1 rounded-sm bg-espresso-800/60" />
                <i className="block h-2 w-1 rounded-sm bg-espresso-800/60" />
                <i className="block h-2 w-1 rounded-sm bg-espresso-800/60" />
                <i className="block h-2 w-3 rounded-sm bg-espresso-800/60" />
              </span>
            </div>

            <div>
              <p className="text-base font-bold">{s.greeting}</p>
            </div>

            {/* listening card */}
            <div className="rounded-2xl bg-espresso-900 p-4 text-cream-50">
              <div className="flex items-center gap-3">
                <span className="relative grid h-9 w-9 place-items-center rounded-full bg-copper-500">
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 rounded-full bg-copper-400/60 motion-safe:animate-pulse-soft"
                  />
                  <Icon.Mic className="relative h-4 w-4" />
                </span>
                <div className="flex-1">
                  <p className="text-[0.7rem] text-cream-200/70">{s.listening}</p>
                  <div className="mt-1 flex h-4 items-end gap-[3px]" aria-hidden="true">
                    {[0.5, 0.9, 0.6, 1, 0.7, 0.4, 0.8, 0.55, 0.95, 0.6, 0.75, 0.45].map((h, i) => (
                      <span
                        key={i}
                        className="block w-[3px] origin-bottom rounded-full bg-copper-300 motion-safe:animate-wave"
                        style={{ height: `${h * 100}%`, animationDelay: `${i * 90}ms` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <p className="mt-3 text-sm leading-snug">{s.transcript}</p>
            </div>

            {/* matched product */}
            <div className="rounded-2xl border border-espresso-900/8 bg-white p-3">
              <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-copper-600 ar:normal-case ar:tracking-normal">
                {s.matched}
              </p>
              <div className="mt-2 flex items-center gap-3">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-cream-100 text-copper-600">
                  <Icon.Cup className="h-6 w-6" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-tight font-bold">{s.product}</p>
                  <p className="mt-0.5 text-xs text-espresso-500">{s.cafe}</p>
                </div>
                <span className="shrink-0 text-sm font-bold">{s.price}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2" aria-hidden="true">
              <div className="h-14 rounded-xl bg-cream-100" />
              <div className="h-14 rounded-xl bg-cream-100" />
              <div className="h-14 rounded-xl bg-cream-100" />
            </div>

            <div className="rounded-full bg-copper-500 py-3 text-center text-sm font-semibold text-white">
              {s.confirm}
            </div>
          </div>
        </div>
      </div>
    </figure>
  )
}
