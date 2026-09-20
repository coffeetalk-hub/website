import { useId, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { useLang } from '../i18n'
import type { AppFeatureGroup } from '../content'
import { Icon } from './Icons'
import { Reveal } from './Reveal'
import { SectionHeading } from './SectionHeading'

const tabIcons = [Icon.Sparkles, Icon.Cup, Icon.Globe, Icon.Users, Icon.Heart]

function Badge({ kind }: { kind: NonNullable<AppFeatureGroup['tag']> }) {
  const { t } = useLang()
  return kind === 'signature' ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-copper-500 px-2 py-0.5 text-[0.65rem] font-bold text-white">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2l2.9 6.6 7.1.7-5.4 4.8 1.6 7L12 17.5 5.8 21l1.6-7L2 9.3l7.1-.7z" />
      </svg>
      {t.appTour.signatureBadge}
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full border border-espresso-900/15 px-2 py-0.5 text-[0.65rem] font-semibold text-espresso-500">
      {t.appTour.soonBadge}
    </span>
  )
}

function GroupCard({ group }: { group: AppFeatureGroup }) {
  const muted = group.tag === 'soon'
  return (
    <li className={`card flex flex-col gap-3 ${muted ? 'bg-cream-100/60 shadow-none' : ''}`}>
      <div className="flex flex-wrap items-center gap-2">
        <h4 className="font-bold text-espresso-900">{group.title}</h4>
        {group.tag && <Badge kind={group.tag} />}
      </div>
      {group.body && <p className="text-sm leading-relaxed text-espresso-500">{group.body}</p>}
      <ul className="flex flex-wrap gap-1.5">
        {group.chips.map((c) => (
          <li
            key={c}
            className="rounded-full border border-espresso-900/10 bg-white px-2.5 py-1 text-xs font-medium text-espresso-800"
          >
            {c}
          </li>
        ))}
      </ul>
      {group.quote && (
        <p className="relative mt-1 rounded-2xl rounded-ss-sm bg-espresso-900 px-4 py-3 text-sm leading-relaxed text-cream-50">
          {group.quote}
        </p>
      )}
    </li>
  )
}

/**
 * "Inside the app" — five customer-app tabs, one panel each.
 * Accessible tabs pattern: roving tabindex, Arrow/Home/End keys, aria-controls.
 */
export function AppTour() {
  const { t, dir } = useLang()
  const tabs = t.appTour.tabs
  const [active, setActive] = useState(0)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const baseId = useId()

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>, i: number) {
    // In RTL the visual "next" tab is to the left, so swap the arrow keys.
    const forward = dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight'
    const backward = dir === 'rtl' ? 'ArrowRight' : 'ArrowLeft'
    let next: number | null = null
    if (e.key === forward) next = (i + 1) % tabs.length
    else if (e.key === backward) next = (i - 1 + tabs.length) % tabs.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = tabs.length - 1
    if (next === null) return
    e.preventDefault()
    setActive(next)
    tabRefs.current[next]?.focus()
  }

  const tab = tabs[active]
  const TabIcon = tabIcons[active]

  return (
    <section id="app" aria-labelledby="app-heading" className="scroll-mt-20 bg-cream-100 py-20 sm:py-28">
      <div className="container-x">
        <SectionHeading
          id="app-heading"
          eyebrow={t.appTour.eyebrow}
          title={t.appTour.heading}
          subhead={t.appTour.subhead}
        />

        <Reveal delay={100} className="mt-10 lg:mt-14">
          {/* Tab list */}
          <div className="-mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0 sm:text-center [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div
              role="tablist"
              aria-label={t.appTour.tablistLabel}
              className="inline-flex min-w-full gap-1 rounded-full border border-espresso-900/10 bg-cream-50 p-1 sm:min-w-0"
            >
              {tabs.map((tb, i) => {
                const Ico = tabIcons[i]
                const selected = i === active
                return (
                  <button
                    key={tb.id}
                    ref={(el) => {
                      tabRefs.current[i] = el
                    }}
                    role="tab"
                    id={`${baseId}-tab-${tb.id}`}
                    aria-selected={selected}
                    aria-controls={`${baseId}-panel-${tb.id}`}
                    tabIndex={selected ? 0 : -1}
                    onClick={() => setActive(i)}
                    onKeyDown={(e) => onKeyDown(e, i)}
                    className={`inline-flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors focus-visible:outline-copper-500 ${
                      selected
                        ? 'bg-espresso-900 text-cream-50'
                        : 'text-espresso-800/80 hover:bg-cream-200/70 hover:text-espresso-900'
                    }`}
                  >
                    <Ico className="h-4 w-4" />
                    {tb.name}
                    {tb.soon && (
                      <span
                        className={`hidden rounded-full px-1.5 py-0.5 text-[0.6rem] font-bold sm:inline ${
                          selected ? 'bg-copper-400/30 text-copper-300' : 'bg-espresso-900/8 text-espresso-500'
                        }`}
                      >
                        {t.appTour.soonBadge}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Panel */}
          <div
            role="tabpanel"
            id={`${baseId}-panel-${tab.id}`}
            aria-labelledby={`${baseId}-tab-${tab.id}`}
            tabIndex={0}
            className="mt-6 rounded-3xl border border-espresso-900/8 bg-cream-50 p-5 sm:p-8 focus-visible:outline-copper-500"
          >
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-espresso-900 text-copper-300">
                <TabIcon className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-xl font-extrabold tracking-tight text-espresso-900">{tab.name}</h3>
                <p className="text-sm text-espresso-500">{tab.tagline}</p>
              </div>
              {tab.soon && (
                <span className="ms-auto shrink-0">
                  <Badge kind="soon" />
                </span>
              )}
            </div>

            <ul key={tab.id} className="mt-6 grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tab.groups.map((g) => (
                <GroupCard key={g.title} group={g} />
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
