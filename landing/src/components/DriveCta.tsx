import type { ReactNode } from 'react'
import { useDriverApply } from './DriverApplyForm'
import { Icon } from './Icons'

const DRIVER_PAGE_URL = import.meta.env.VITE_DRIVER_PAGE_URL?.trim() || ''

/**
 * Driver entry point. With VITE_DRIVER_PAGE_URL set it links to the driver page;
 * otherwise it opens the in-page application form.
 */
export function DriveCta({ children, className = 'btn-primary', arrow = true }: { children: ReactNode; className?: string; arrow?: boolean }) {
  const { open } = useDriverApply()
  const icon = arrow ? <Icon.ArrowEnd className="h-4 w-4" /> : null
  if (DRIVER_PAGE_URL) {
    return (
      <a href={DRIVER_PAGE_URL} className={className}>
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
