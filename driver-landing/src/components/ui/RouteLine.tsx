/**
 * Signature motif: a dashed delivery route. Stretched to its container, so no pins (they would distort).
 * Decorative only. Dash animation is disabled under prefers-reduced-motion (global rule).
 */
export function RouteLine({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 600 120"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={`h-full w-full ${className}`}
      fill="none"
    >
      <path
        d="M14 96 C 90 96, 110 22, 190 26 S 300 100, 380 92 S 500 20, 586 24"
        stroke="currentColor"
        strokeOpacity="0.28"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="8 8"
        vectorEffect="non-scaling-stroke"
        className="motion-safe:animate-route"
      />
    </svg>
  )
}
