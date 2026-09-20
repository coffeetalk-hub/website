import { createContext, useContext, useEffect, useId, useMemo, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { useLang } from '../i18n'
import { Icon } from './Icons'
import { normalizeSaudiPhone } from '../phone'

/* Shared open/close state so any CTA on the page can open the driver form. */
interface Ctx {
  open: () => void
  close: () => void
}
const DriverApplyContext = createContext<Ctx | null>(null)

// eslint-disable-next-line react-refresh/only-export-components
export function useDriverApply(): Ctx {
  const c = useContext(DriverApplyContext)
  if (!c) throw new Error('useDriverApply must be used inside <DriverApplyProvider>')
  return c
}

export function DriverApplyProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false)
  const value = useMemo(() => ({ open: () => setOpen(true), close: () => setOpen(false) }), [])
  return (
    <DriverApplyContext.Provider value={value}>
      {children}
      <DriverApplyDialog open={isOpen} onClose={value.close} />
    </DriverApplyContext.Provider>
  )
}

const ENDPOINT = import.meta.env.VITE_DRIVER_APPLY_ENDPOINT?.trim() || ''
type Status = 'idle' | 'submitting' | 'success' | 'error'
type Errors = { name?: string; phone?: string; city?: string; vehicle?: string }

function DriverApplyDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, lang } = useLang()
  const f = t.drivers.form
  const id = useId()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const firstRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [errors, setErrors] = useState<Errors>({})

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

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)
    const name = String(fd.get('name') ?? '').trim()
    const phone = normalizeSaudiPhone(String(fd.get('phone') ?? ''))
    const city = String(fd.get('city') ?? '')
    const vehicle = String(fd.get('vehicle') ?? '')

    const next: Errors = {}
    if (name.length < 2) next.name = f.errors.name
    if (!phone) next.phone = f.errors.phone
    if (!city) next.city = f.errors.city
    if (!vehicle) next.vehicle = f.errors.vehicle
    setErrors(next)
    if (Object.keys(next).length) {
      form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
      return
    }

    const payload = { name, phone, city, vehicle, lang, source: 'customer-landing' }
    setStatus('submitting')
    try {
      if (ENDPOINT) {
        const res = await fetch(ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
      } else {
        // TODO(launch): set VITE_DRIVER_APPLY_ENDPOINT. Until then the form only logs.
        console.info('[CoffeeTalk] driver application (no endpoint configured):', payload)
      }
      setStatus('success')
    } catch (err) {
      console.error('[CoffeeTalk] driver application failed', err)
      setStatus('error')
    }
  }

  const field =
    'mt-1.5 w-full rounded-xl border bg-white px-3.5 py-2.5 text-espresso-900 placeholder:text-espresso-500/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-copper-500/40'
  const ok = 'border-espresso-900/15 focus:border-copper-500'
  const bad = 'border-red-500/70'
  const err = 'mt-1 text-xs text-red-700'

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => e.target === dialogRef.current && onClose()}
      aria-labelledby={`${id}-title`}
      className="m-auto w-[min(100%-2rem,28rem)] rounded-3xl bg-cream-50 p-0 text-espresso-900 shadow-card backdrop:bg-espresso-950/60 backdrop:backdrop-blur-sm"
    >
      <div className="p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 id={`${id}-title`} className="text-2xl font-extrabold tracking-tight">
              {f.title}
            </h3>
            <p className="mt-2 text-sm text-espresso-500">{f.intro}</p>
          </div>
          <button type="button" onClick={onClose} aria-label={f.close} className="btn-ghost h-10 w-10 shrink-0 p-0">
            <Icon.Close className="h-5 w-5" />
          </button>
        </div>

        {status === 'success' ? (
          <div role="status" className="mt-6 rounded-2xl bg-espresso-900 p-5 text-cream-50">
            <p className="flex items-center gap-2 font-semibold">
              <Icon.Check className="h-5 w-5 text-copper-300" />
              {f.successTitle}
            </p>
            <p className="mt-1 text-sm text-cream-200/80">{f.successBody}</p>
            <button type="button" onClick={onClose} className="btn-light mt-4">
              {f.close}
            </button>
          </div>
        ) : (
          <form
            onSubmit={submit}
            noValidate
            onInput={(e) => {
              const n = (e.target as HTMLInputElement).name as keyof Errors
              if (n && errors[n]) setErrors((prev) => ({ ...prev, [n]: undefined }))
            }}
            className="mt-6 space-y-4"
          >
            <div>
              <label htmlFor={`${id}-name`} className="text-sm font-semibold">
                {f.name}
              </label>
              <input
                ref={firstRef}
                id={`${id}-name`}
                name="name"
                autoComplete="name"
                aria-invalid={errors.name ? 'true' : undefined}
                aria-describedby={errors.name ? `${id}-name-err` : undefined}
                className={`${field} ${errors.name ? bad : ok}`}
              />
              {errors.name && (
                <p id={`${id}-name-err`} className={err}>
                  {errors.name}
                </p>
              )}
            </div>
            <div>
              <label htmlFor={`${id}-phone`} className="text-sm font-semibold">
                {f.phone}
              </label>
              <input
                id={`${id}-phone`}
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                dir="ltr"
                placeholder="+966 5x xxx xxxx"
                aria-invalid={errors.phone ? 'true' : undefined}
                aria-describedby={`${id}-phone-hint${errors.phone ? ` ${id}-phone-err` : ''}`}
                className={`${field} text-start ${errors.phone ? bad : ok}`}
              />
              <p id={`${id}-phone-hint`} className="mt-1 text-xs text-espresso-500">
                {f.phoneHint}
              </p>
              {errors.phone && (
                <p id={`${id}-phone-err`} className={err}>
                  {errors.phone}
                </p>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor={`${id}-city`} className="text-sm font-semibold">
                  {f.city}
                </label>
                <select
                  id={`${id}-city`}
                  name="city"
                  defaultValue=""
                  aria-invalid={errors.city ? 'true' : undefined}
                  aria-describedby={errors.city ? `${id}-city-err` : undefined}
                  className={`${field} ${errors.city ? bad : ok}`}
                >
                  <option value="" disabled>
                    {f.cityPlaceholder}
                  </option>
                  {f.cities.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
                {errors.city && (
                  <p id={`${id}-city-err`} className={err}>
                    {errors.city}
                  </p>
                )}
              </div>
              <fieldset aria-describedby={errors.vehicle ? `${id}-vehicle-err` : undefined}>
                <legend className="text-sm font-semibold">{f.vehicle}</legend>
                <div className="mt-1.5 flex gap-2">
                  {f.vehicles.map((v) => (
                    <label
                      key={v.value}
                      className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-espresso-900/15 bg-white px-3 py-2.5 text-sm font-medium has-checked:border-copper-500 has-checked:bg-copper-500 has-checked:text-white has-focus-visible:ring-2 has-focus-visible:ring-copper-500/40"
                    >
                      <input type="radio" name="vehicle" value={v.value} className="sr-only" />
                      {v.label}
                    </label>
                  ))}
                </div>
                {errors.vehicle && (
                  <p id={`${id}-vehicle-err`} className={err}>
                    {errors.vehicle}
                  </p>
                )}
              </fieldset>
            </div>

            {status === 'error' && (
              <p role="alert" className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-800">
                {f.errorGeneric}
              </p>
            )}

            <div className="flex flex-wrap justify-end gap-3 pt-2">
              <button type="button" onClick={onClose} className="btn-ghost">
                {f.close}
              </button>
              <button type="submit" disabled={status === 'submitting'} className="btn-primary disabled:opacity-60">
                {status === 'submitting' ? f.submitting : f.submit}
              </button>
            </div>
          </form>
        )}
      </div>
    </dialog>
  )
}
