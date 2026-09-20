import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { X, CheckCircle2 } from 'lucide-react'
import { useT } from '../../i18n'
import { config } from '../../config'
import { normalizeSaudiPhone } from '../../lib/phone'

/* ---------- open/close state shared with every CTA ---------- */
interface WaitlistCtx {
  open: () => void
  close: () => void
}
const Ctx = createContext<WaitlistCtx | null>(null)

// eslint-disable-next-line react-refresh/only-export-components
export function useWaitlist(): WaitlistCtx {
  const c = useContext(Ctx)
  if (!c) throw new Error('useWaitlist must be used inside <WaitlistProvider>')
  return c
}

export function WaitlistProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false)
  const value = useMemo(() => ({ open: () => setOpen(true), close: () => setOpen(false) }), [])
  return (
    <Ctx.Provider value={value}>
      {children}
      <WaitlistDialog open={isOpen} onClose={value.close} />
    </Ctx.Provider>
  )
}

type Status = 'idle' | 'submitting' | 'success' | 'error'

function WaitlistDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, lang } = useT()
  const w = t.waitlist
  const id = useId()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const firstRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [errors, setErrors] = useState<{ name?: string; phone?: string; city?: string }>({})

  useEffect(() => {
    const dlg = dialogRef.current
    if (!dlg) return
    if (open && !dlg.open) {
      dlg.showModal()
      setStatus('idle')
      setErrors({})
      requestAnimationFrame(() => firstRef.current?.focus())
    } else if (!open && dlg.open) {
      dlg.close()
    }
  }, [open])

  const submit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      const form = e.currentTarget
      const fd = new FormData(form)
      const name = String(fd.get('name') ?? '').trim()
      const phone = normalizeSaudiPhone(String(fd.get('phone') ?? ''))
      const city = String(fd.get('city') ?? '')

      const next: typeof errors = {}
      if (name.length < 2) next.name = w.errors.name
      if (!phone) next.phone = w.errors.phone
      if (!city) next.city = w.errors.city
      setErrors(next)
      if (Object.keys(next).length) {
        const firstBad = form.querySelector<HTMLElement>('[aria-invalid="true"]')
        firstBad?.focus()
        return
      }

      const payload = { name, phone, city, lang, source: 'driver-landing' }
      setStatus('submitting')
      try {
        if (config.waitlistEndpoint) {
          const res = await fetch(config.waitlistEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
        } else {
          // TODO(launch): set VITE_WAITLIST_ENDPOINT. Until then the form only logs.
          console.info('[CoffeeTalk Driver] waitlist submission (no endpoint configured):', payload)
        }
        setStatus('success')
      } catch (err) {
        console.error('[CoffeeTalk Driver] waitlist submit failed', err)
        setStatus('error')
      }
    },
    [lang, w.errors],
  )

  const field =
    'mt-1.5 w-full rounded-xl border bg-espresso-950 px-3.5 py-2.5 text-cream-50 placeholder:text-sand-400/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-copper-300/50'
  const fieldOk = 'border-cream-50/15 focus:border-copper-300'
  const fieldBad = 'border-red-400/70'

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => e.target === dialogRef.current && onClose()}
      aria-labelledby={`${id}-title`}
      className="m-auto w-[min(100%-2rem,28rem)] rounded-3xl border border-cream-50/10 bg-espresso-900 p-0 text-cream-50 shadow-card backdrop:bg-black/70 backdrop:backdrop-blur-sm"
    >
      <div className="p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id={`${id}-title`} className="text-2xl font-bold tracking-tight">
              {w.title}
            </h2>
            <p className="mt-2 text-sm text-sand-400">{w.intro}</p>
          </div>
          <button type="button" onClick={onClose} aria-label={w.close} className="btn-ghost h-10 w-10 shrink-0 p-0">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {status === 'success' ? (
          <div role="status" className="mt-6 rounded-2xl bg-copper-400 p-5 text-espresso-950">
            <p className="flex items-center gap-2 text-lg font-bold">
              <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
              {w.successTitle}
            </p>
            <p className="mt-1 text-sm">{w.successBody}</p>
            <button type="button" onClick={onClose} className="mt-4 rounded-xl bg-espresso-950 px-4 py-2 text-sm font-semibold text-cream-50">
              {w.close}
            </button>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="mt-6 space-y-4">
            <div>
              <label htmlFor={`${id}-name`} className="text-sm font-semibold">
                {w.name}
              </label>
              <input
                ref={firstRef}
                id={`${id}-name`}
                name="name"
                autoComplete="name"
                aria-invalid={errors.name ? 'true' : undefined}
                aria-describedby={errors.name ? `${id}-name-err` : undefined}
                className={`${field} ${errors.name ? fieldBad : fieldOk}`}
              />
              {errors.name && (
                <p id={`${id}-name-err`} className="mt-1 text-xs text-red-300">
                  {errors.name}
                </p>
              )}
            </div>
            <div>
              <label htmlFor={`${id}-phone`} className="text-sm font-semibold">
                {w.phone}
              </label>
              <input
                id={`${id}-phone`}
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                dir="ltr"
                placeholder="+966 5x xxx xxxx"
                aria-describedby={`${id}-phone-hint${errors.phone ? ` ${id}-phone-err` : ''}`}
                aria-invalid={errors.phone ? 'true' : undefined}
                className={`${field} text-start ${errors.phone ? fieldBad : fieldOk}`}
              />
              <p id={`${id}-phone-hint`} className="mt-1 text-xs text-sand-400">
                {w.phoneHint}
              </p>
              {errors.phone && (
                <p id={`${id}-phone-err`} className="mt-1 text-xs text-red-300">
                  {errors.phone}
                </p>
              )}
            </div>
            <div>
              <label htmlFor={`${id}-city`} className="text-sm font-semibold">
                {w.city}
              </label>
              <select
                id={`${id}-city`}
                name="city"
                defaultValue=""
                aria-invalid={errors.city ? 'true' : undefined}
                aria-describedby={errors.city ? `${id}-city-err` : undefined}
                className={`${field} ${errors.city ? fieldBad : fieldOk}`}
              >
                <option value="" disabled>
                  {w.cityPlaceholder}
                </option>
                {w.cities.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
              {errors.city && (
                <p id={`${id}-city-err`} className="mt-1 text-xs text-red-300">
                  {errors.city}
                </p>
              )}
            </div>

            {status === 'error' && (
              <p role="alert" className="rounded-xl border border-red-400/40 bg-red-400/10 px-3 py-2 text-sm text-red-200">
                {w.errorGeneric}
              </p>
            )}

            <button type="submit" disabled={status === 'submitting'} className="btn-primary w-full disabled:opacity-60">
              {status === 'submitting' ? w.submitting : w.submit}
            </button>
          </form>
        )}
      </div>
    </dialog>
  )
}
