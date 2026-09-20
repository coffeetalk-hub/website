import { Sparkles, Clock } from 'lucide-react'

interface Props {
  kind: 'signature' | 'later'
  label: string
  tone?: 'dark' | 'cream'
}

export function Badge({ kind, label, tone = 'dark' }: Props) {
  if (kind === 'signature') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-copper-400 px-2 py-0.5 text-[0.68rem] font-bold text-espresso-950">
        <Sparkles className="h-3 w-3" aria-hidden="true" />
        {label}
      </span>
    )
  }
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[0.68rem] font-semibold ${
        tone === 'cream' ? 'border-espresso-900/20 text-espresso-500' : 'border-cream-50/25 text-sand-400'
      }`}
    >
      <Clock className="h-3 w-3" aria-hidden="true" />
      {label}
    </span>
  )
}
