import { useEffect, useId, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useLang } from '../i18n'
import { Icon } from './Icons'

interface Props {
  open: boolean
  onClose: () => void
}

/**
 * "Partner with us" modal. No backend yet — see the TODO in handleSubmit.
 */
export function PartnerForm({ open, onClose }: Props) {
  const { t } = useLang()
  const f = t.cafes.form
  const dialogRef = useRef<HTMLDialogElement>(null)
  const firstFieldRef = useRef<HTMLInputElement>(null)
  const [sent, setSent] = useState(false)
  const id = useId()

  useEffect(() => {
    const dlg = dialogRef.current
    if (!dlg) return
    if (open && !dlg.open) {
      dlg.showModal()
      setSent(false)
      requestAnimationFrame(() => firstFieldRef.current?.focus())
    } else if (!open && dlg.open) {
      dlg.close()
    }
  }, [open])

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = Object.fromEntries(new FormData(e.currentTarget).entries())
    // TODO(launch): send `data` to the partner-intake endpoint (CRM, email, or a serverless function).
    console.info('[CoffeeTalk] partner request (stub):', data)
    setSent(true)
  }

  const field =
    'mt-1.5 w-full rounded-xl border border-espresso-900/15 bg-white px-3.5 py-2.5 text-espresso-900 placeholder:text-espresso-500/60 focus:border-copper-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-copper-500/40'

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => e.target === dialogRef.current && onClose()}
      aria-labelledby={`${id}-title`}
      className="m-auto w-[min(100%-2rem,30rem)] rounded-3xl bg-cream-50 p-0 text-espresso-900 shadow-card backdrop:bg-espresso-950/60 backdrop:backdrop-blur-sm"
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

        {sent ? (
          <div role="status" className="mt-6 rounded-2xl bg-espresso-900 p-5 text-cream-50">
            <p className="flex items-center gap-2 font-semibold">
              <Icon.Check className="h-5 w-5 text-copper-300" />
              {f.success}
            </p>
            <button type="button" onClick={onClose} className="btn-light mt-4">
              {f.close}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor={`${id}-cafe`} className="text-sm font-semibold">
                {f.cafeName}
              </label>
              <input ref={firstFieldRef} id={`${id}-cafe`} name="cafeName" required autoComplete="organization" className={field} />
            </div>
            <div>
              <label htmlFor={`${id}-city`} className="text-sm font-semibold">
                {f.city}
              </label>
              <input id={`${id}-city`} name="city" required autoComplete="address-level2" className={field} />
            </div>
            <div>
              <label htmlFor={`${id}-contact`} className="text-sm font-semibold">
                {f.contact}
              </label>
              <input
                id={`${id}-contact`}
                name="contact"
                required
                placeholder={f.contactHint}
                aria-describedby={`${id}-contact-hint`}
                className={field}
              />
              <p id={`${id}-contact-hint`} className="sr-only">
                {f.contactHint}
              </p>
            </div>
            <div>
              <label htmlFor={`${id}-message`} className="text-sm font-semibold">
                {f.message}
              </label>
              <textarea id={`${id}-message`} name="message" rows={4} className={field} />
            </div>
            <div className="flex flex-wrap justify-end gap-3 pt-2">
              <button type="button" onClick={onClose} className="btn-ghost">
                {f.cancel}
              </button>
              <button type="submit" className="btn-primary">
                {f.submit}
              </button>
            </div>
          </form>
        )}
      </div>
    </dialog>
  )
}
