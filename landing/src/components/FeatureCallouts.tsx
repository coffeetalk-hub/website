import type React from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useLang } from '../i18n'
import { Icon } from './Icons'
import { Reveal } from './Reveal'

/**
 * Smartphone mockup with eight feature callouts, placed right after the eight feature cards.
 * The screen is an illustrative placeholder (no real app screenshots exist in the project yet);
 * each numbered region matches the feature of the same number. Connector lines are measured at
 * runtime so they always land on the right region, in LTR and RTL. Below lg, callouts become a
 * numbered list under the phone.
 */

const COUNT = 8

/* ---- illustrative screen regions, in feature order 1..8 ---- */
const tones = {
  light: 'border-espresso-900/8 bg-white',
  dark: 'border-transparent bg-espresso-900 text-cream-50',
  copper: 'border-transparent bg-copper-500 text-white',
} as const

function Region({ n, children, tone = 'light' }: { n: number; children: React.ReactNode; tone?: keyof typeof tones }) {
  return (
    <div data-region={n} className={`relative rounded-xl border p-2.5 ${tones[tone]}`}>
      <span
        aria-hidden="true"
        className="absolute -top-2 -end-2 grid h-5 w-5 place-items-center rounded-full bg-copper-500 text-[0.65rem] font-bold text-white ring-2 ring-cream-50"
      >
        {n}
      </span>
      {children}
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-[0.62rem] font-semibold uppercase tracking-wider text-copper-600 ar:normal-case ar:tracking-normal">{children}</p>
}

function Screen() {
  const { t } = useLang()
  const f = t.differentiators.items
  return (
    <div className="space-y-2.5 px-3 pt-10 pb-4 text-espresso-900">
      <Region n={1} tone="dark">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-copper-500">
            <Icon.Mic className="h-3.5 w-3.5" />
          </span>
          <span className="grid h-7 w-7 place-items-center rounded-full bg-cream-50/10">
            <Icon.Camera className="h-3.5 w-3.5" />
          </span>
          <p className="text-xs leading-tight font-semibold">{f[0].title}</p>
        </div>
      </Region>
      <Region n={2}>
        <Label>{f[1].title}</Label>
        <div className="mt-1.5 grid grid-cols-3 gap-1.5" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <span key={i} className="grid h-9 place-items-center rounded-lg bg-cream-100 text-copper-600">
              <Icon.Cup className="h-4 w-4" />
            </span>
          ))}
        </div>
      </Region>
      <Region n={3}>
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-xs font-semibold">
            <Icon.Table className="h-4 w-4 text-copper-600" />
            {f[2].title}
          </span>
          <span className="rounded-full bg-cream-100 px-2 py-0.5 text-[0.6rem] font-bold text-espresso-800">19:30</span>
        </div>
      </Region>
      <Region n={4}>
        <div className="flex items-center gap-1.5 text-xs font-semibold">
          <Icon.Stores className="h-4 w-4 text-copper-600" />
          {f[3].title}
        </div>
        <div className="mt-1.5 flex gap-1.5" aria-hidden="true">
          <span className="h-2 flex-1 rounded-full bg-cream-200" />
          <span className="h-2 flex-1 rounded-full bg-cream-200" />
        </div>
      </Region>
      <Region n={5}>
        <Label>{f[4].title}</Label>
        <div className="relative mt-1.5 h-12 overflow-hidden rounded-lg bg-cream-100" aria-hidden="true">
          <span className="absolute top-3 start-4 h-2.5 w-2.5 rounded-full bg-copper-500" />
          <span className="absolute top-6 start-1/2 h-2.5 w-2.5 rounded-full bg-copper-500" />
          <span className="absolute top-2 end-5 h-2.5 w-2.5 rounded-full bg-copper-500" />
        </div>
      </Region>
      <Region n={6}>
        <Label>{f[5].title}</Label>
        <div className="mt-1.5 flex items-center gap-1" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="-ms-1 first:ms-0 h-6 w-6 rounded-full border-2 border-white bg-cream-200" />
          ))}
          <Icon.Users className="ms-1 h-4 w-4 text-copper-600" />
        </div>
      </Region>
      <Region n={7}>
        <Label>{f[6].title}</Label>
        <div className="mt-1.5 flex gap-1.5" aria-hidden="true">
          <span className="rounded-full bg-cream-100 px-2 py-0.5 text-[0.6rem] font-semibold">☕</span>
          <span className="h-5 flex-1 rounded-full bg-cream-100" />
          <span className="h-5 w-10 rounded-full bg-cream-100" />
        </div>
      </Region>
      <Region n={8} tone="copper">
        <div className="flex items-center gap-2 text-xs font-bold">
          <Icon.Bike className="h-4 w-4" />
          {f[7].title}
        </div>
      </Region>
    </div>
  )
}

/* ---- the section ---- */
export function FeatureCallouts() {
  const { t, dir } = useLang()
  const wrapRef = useRef<HTMLDivElement>(null)
  const [lines, setLines] = useState<string[]>([])
  const [size, setSize] = useState({ w: 0, h: 0 })

  const measure = useCallback(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    const isDesktop = window.matchMedia('(min-width: 1024px)').matches
    if (!isDesktop) {
      setLines([])
      return
    }
    const box = wrap.getBoundingClientRect()
    const next: string[] = []
    for (let n = 1; n <= COUNT; n++) {
      // Desktop and mobile callout lists both exist in the DOM; use the one that is rendered.
      const callout = [...wrap.querySelectorAll<HTMLElement>(`[data-callout="${n}"]`)].find((el) => el.getClientRects().length > 0)
      const region = wrap.querySelector<HTMLElement>(`[data-region="${n}"]`)
      if (!callout || !region) continue
      const c = callout.getBoundingClientRect()
      const r = region.getBoundingClientRect()
      const calloutOnLeft = c.left + c.width / 2 < r.left + r.width / 2
      const x1 = (calloutOnLeft ? c.right : c.left) - box.left
      const y1 = c.top + c.height / 2 - box.top
      const x2 = (calloutOnLeft ? r.left : r.right) - box.left
      const y2 = r.top + r.height / 2 - box.top
      const dx = (x2 - x1) * 0.5
      next.push(`M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`)
    }
    setSize({ w: box.width, h: box.height })
    setLines(next)
  }, [])

  useEffect(() => {
    // Measure after layout (not synchronously in the effect), then on every resize.
    const raf = requestAnimationFrame(measure)
    const ro = new ResizeObserver(() => measure())
    if (wrapRef.current) ro.observe(wrapRef.current)
    window.addEventListener('resize', measure)
    // fonts can shift layout after first paint
    document.fonts?.ready.then(measure).catch(() => {})
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [measure, dir])

  const callout = (n: number, side: 'start' | 'end') => (
    <li
      key={n}
      data-callout={n}
      className={`card relative py-4 ${side === 'start' ? 'lg:text-end' : 'lg:text-start'}`}
    >
      <div className={`flex items-start gap-3 ${side === 'start' ? 'lg:flex-row-reverse' : ''}`}>
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-copper-500 text-xs font-bold text-white">{n}</span>
        <div>
          <h4 className="text-sm font-bold text-espresso-900">{t.differentiators.items[n - 1].title}</h4>
          <p className="mt-1 text-sm leading-relaxed text-espresso-500">{t.callouts.items[n - 1]}</p>
        </div>
      </div>
    </li>
  )

  return (
    <div className="mt-20 lg:mt-24" aria-labelledby="callouts-heading">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h3 id="callouts-heading" className="text-3xl font-extrabold tracking-tight text-balance text-espresso-900 sm:text-4xl">
          {t.callouts.heading}
        </h3>
        <p className="mt-4 text-lg text-pretty text-espresso-500">{t.callouts.subhead}</p>
      </Reveal>

      <div ref={wrapRef} className="relative mt-12 grid items-center gap-8 lg:grid-cols-[1fr_auto_1fr] lg:gap-10">
        {/* connectors (desktop only) */}
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 hidden h-full w-full text-copper-500 lg:block"
          width={size.w}
          height={size.h}
          viewBox={`0 0 ${size.w || 1} ${size.h || 1}`}
          preserveAspectRatio="none"
          fill="none"
        >
          {lines.map((d, i) => (
            <g key={i}>
              <path d={d} stroke="currentColor" strokeOpacity="0.8" strokeWidth="1.5" strokeDasharray="4 4" />
              <circle cx={Number(d.split(' ').at(-1)!.split(',')[0])} cy={Number(d.split(' ').at(-1)!.split(',')[1])} r="3.5" fill="currentColor" />
            </g>
          ))}
        </svg>

        {/* start-side callouts 1–4 (desktop) */}
        <ol className="hidden space-y-5 lg:block">{[1, 2, 3, 4].map((n) => callout(n, 'start'))}</ol>

        {/* phone */}
        <figure className="relative mx-auto w-[17rem]" aria-label={t.callouts.placeholderNote}>
          <div className="rounded-[2.6rem] border border-white/10 bg-espresso-950 p-2.5 shadow-phone">
            <div className="relative overflow-hidden rounded-[2.1rem] bg-cream-50">
              <div aria-hidden="true" className="absolute inset-x-0 top-0 z-10 flex justify-center pt-2">
                <div className="h-5 w-24 rounded-full bg-espresso-950" />
              </div>
              <Screen />
            </div>
          </div>
          <figcaption className="mt-3 text-center text-xs text-espresso-500">{t.callouts.placeholderNote}</figcaption>
        </figure>

        {/* end-side callouts 5–8 (desktop) */}
        <ol className="hidden space-y-5 lg:block">{[5, 6, 7, 8].map((n) => callout(n, 'end'))}</ol>

        {/* all eight as a numbered list (below lg) */}
        <ol className="grid gap-3 sm:grid-cols-2 lg:hidden">{[1, 2, 3, 4, 5, 6, 7, 8].map((n) => callout(n, 'end'))}</ol>
      </div>
    </div>
  )
}
