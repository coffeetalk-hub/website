/** Text wordmark + cup mark. Replace with the brand logo when available (TODO). */
export function Wordmark({ name, product, className = '' }: { name: string; product: string; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg width="28" height="28" viewBox="0 0 64 64" aria-hidden="true" className="shrink-0">
        <rect width="64" height="64" rx="16" className="fill-copper-400" />
        <path d="M18 22h24a4 4 0 0 1 4 4v8a10 10 0 0 1-10 10H24a6 6 0 0 1-6-6V22z" className="fill-espresso-950" />
        <path d="M46 28h3a5 5 0 0 1 0 10h-3" fill="none" className="stroke-espresso-950" strokeWidth="3" />
        <path d="M12 52c8-6 14 2 22-4s10-8 18-6" fill="none" className="stroke-espresso-950" strokeWidth="3" strokeLinecap="round" strokeDasharray="5 4" />
      </svg>
      <span className="text-base font-bold tracking-tight">
        {name}
        <span className="ms-1.5 rounded-md bg-cream-50/10 px-1.5 py-0.5 text-[0.65rem] font-semibold text-sand-400">
          {product}
        </span>
      </span>
    </span>
  )
}
