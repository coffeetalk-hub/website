import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { title?: string }

const base = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

/** Simple line icons, all inline SVG, no external assets. */
export const Icon = {
  Mic: (p: IconProps) => (
    <svg {...base} {...p}>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6" />
    </svg>
  ),
  Camera: (p: IconProps) => (
    <svg {...base} {...p}>
      <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  ),
  Sparkles: (p: IconProps) => (
    <svg {...base} {...p}>
      <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
      <path d="M5 18l.7 1.8L7.5 20.5l-1.8.7L5 23l-.7-1.8-1.8-.7 1.8-.7z" />
    </svg>
  ),
  Table: (p: IconProps) => (
    <svg {...base} {...p}>
      <path d="M3 9h18M5 9v10M19 9v10M8 19v-5h8v5" />
      <path d="M9 9V5h6v4" />
    </svg>
  ),
  Stores: (p: IconProps) => (
    <svg {...base} {...p}>
      <path d="M3 10l1.5-5h15L21 10M3 10a2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 3 0" />
      <path d="M5 12v8h14v-8M10 20v-5h4v5" />
    </svg>
  ),
  Cup: (p: IconProps) => (
    <svg {...base} {...p}>
      <path d="M5 9h11v6a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5z" />
      <path d="M16 11h1.5a2.5 2.5 0 0 1 0 5H16" />
      <path d="M8 3c0 1.5 1.5 1.5 1.5 3S8 7.5 8 6M12 3c0 1.5 1.5 1.5 1.5 3S12 7.5 12 6" />
    </svg>
  ),
  Bike: (p: IconProps) => (
    <svg {...base} {...p}>
      <circle cx="6" cy="16" r="3.5" />
      <circle cx="18" cy="16" r="3.5" />
      <path d="M6 16l3-8h4l3 4h2M13 8l2-3h3M9 8h3" />
    </svg>
  ),
  Heart: (p: IconProps) => (
    <svg {...base} {...p}>
      <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" />
    </svg>
  ),
  Calendar: (p: IconProps) => (
    <svg {...base} {...p}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  ),
  Receipt: (p: IconProps) => (
    <svg {...base} {...p}>
      <path d="M6 3h12v18l-2-1.5L14 21l-2-1.5L10 21l-2-1.5L6 21z" />
      <path d="M9 8h6M9 12h6M9 16h4" />
    </svg>
  ),
  Bag: (p: IconProps) => (
    <svg {...base} {...p}>
      <path d="M5 8h14l-1 12H6z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  ),
  Target: (p: IconProps) => (
    <svg {...base} {...p}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    </svg>
  ),
  Leaf: (p: IconProps) => (
    <svg {...base} {...p}>
      <path d="M5 19c0-8 4-13 14-14 0 10-5 14-13 14z" />
      <path d="M5 19c3-5 6-8 10-10" />
    </svg>
  ),
  Music: (p: IconProps) => (
    <svg {...base} {...p}>
      <path d="M9 18V6l10-2v12" />
      <circle cx="6.5" cy="18" r="2.5" />
      <circle cx="16.5" cy="16" r="2.5" />
    </svg>
  ),
  Menu: (p: IconProps) => (
    <svg {...base} {...p}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  ),
  Close: (p: IconProps) => (
    <svg {...base} {...p}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  ),
  Globe: (p: IconProps) => (
    <svg {...base} {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" />
    </svg>
  ),
  ArrowEnd: (p: IconProps) => (
    // Points "forward" in reading direction; mirrored in RTL via the rtl:-scale-x-100 utility.
    <svg {...base} {...p} className={`rtl:-scale-x-100 ${p.className ?? ''}`}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
  Check: (p: IconProps) => (
    <svg {...base} {...p}>
      <path d="M5 12l4 4 10-10" />
    </svg>
  ),
  Grid: (p: IconProps) => (
    <svg {...base} {...p}>
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" />
    </svg>
  ),
  Users: (p: IconProps) => (
    <svg {...base} {...p}>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M3 20a6 6 0 0 1 12 0M16 4.5a3.5 3.5 0 0 1 0 7M21 20a6 6 0 0 0-4.5-5.8" />
    </svg>
  ),
  Route: (p: IconProps) => (
    <svg {...base} {...p}>
      <circle cx="6" cy="18" r="2.5" />
      <circle cx="18" cy="6" r="2.5" />
      <path d="M8.5 18H14a3 3 0 0 0 0-6h-4a3 3 0 0 1 0-6h5.5" />
    </svg>
  ),
  Shield: (p: IconProps) => (
    <svg {...base} {...p}>
      <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />
      <path d="M12 8v4M12 15h.01" />
    </svg>
  ),
  Wallet: (p: IconProps) => (
    <svg {...base} {...p}>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M3 10h18M16 15h2M7 7V5a1 1 0 0 1 1-1h9" />
    </svg>
  ),
  Package: (p: IconProps) => (
    <svg {...base} {...p}>
      <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" />
      <path d="M4 7.5l8 4.5 8-4.5M12 12v9" />
    </svg>
  ),
  Apple: (p: IconProps) => (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true" {...p}>
      <path d="M16.4 12.7c0-2.4 2-3.6 2.1-3.7-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.7.9-.8 0-1.9-.9-3.2-.8-1.6 0-3.1 1-4 2.4-1.7 2.9-.4 7.3 1.2 9.7.8 1.2 1.8 2.5 3 2.4 1.2 0 1.7-.8 3.2-.8s1.9.8 3.2.8c1.3 0 2.2-1.2 3-2.4.9-1.4 1.3-2.7 1.4-2.8-.1 0-2.7-1-2.7-3.8zM13.9 5.5c.7-.8 1.1-1.9 1-3-1 0-2.1.7-2.8 1.5-.6.7-1.2 1.8-1 2.9 1.1.1 2.2-.6 2.8-1.4z" />
    </svg>
  ),
  Play: (p: IconProps) => (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true" {...p}>
      <path d="M4 3.5v17a1 1 0 0 0 1.5.9l14.5-8.5a1 1 0 0 0 0-1.8L5.5 2.6A1 1 0 0 0 4 3.5z" />
    </svg>
  ),
}

/** Wordmark — used in the nav and footer. Replace with the brand logo when one exists. */
export function Wordmark({ className = '', label = 'CoffeeTalk' }: { className?: string; label?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg width="30" height="30" viewBox="0 0 64 64" aria-hidden="true" className="shrink-0">
        <rect width="64" height="64" rx="16" fill="currentColor" />
        <path
          d="M18 24h24a4 4 0 0 1 4 4v8a10 10 0 0 1-10 10H24a6 6 0 0 1-6-6V24z"
          className="fill-cream-50"
        />
        <path d="M46 30h3a5 5 0 0 1 0 10h-3" fill="none" className="stroke-cream-50" strokeWidth="3" />
        <path
          d="M26 12c0 3 3 3 3 6s-3 3-3 6M34 12c0 3 3 3 3 6s-3 3-3 6"
          fill="none"
          className="stroke-copper-400"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
      <span className="text-lg font-extrabold tracking-tight">{label}</span>
    </span>
  )
}
