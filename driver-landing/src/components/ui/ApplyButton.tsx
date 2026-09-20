import { ArrowRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { config } from '../../config'
import { useWaitlist } from '../sections/WaitlistForm'

interface Props {
  children: ReactNode
  className?: string
  arrow?: boolean
}

/**
 * The primary CTA everywhere on the page.
 * With VITE_APPLY_URL set it is a link; otherwise it opens the waitlist form.
 */
export function ApplyButton({ children, className = 'btn-primary', arrow = false }: Props) {
  const { open } = useWaitlist()
  const icon = arrow ? <ArrowRight className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" /> : null
  if (config.applyUrl) {
    return (
      <a href={config.applyUrl} target="_blank" rel="noopener" className={className}>
        {children}
        {icon}
      </a>
    )
  }
  return (
    <button type="button" onClick={open} className={className}>
      {children}
      {icon}
    </button>
  )
}
