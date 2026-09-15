import { useLang } from '../i18n'
import { Icon } from './Icons'

interface Props {
  variant?: 'dark' | 'light'
  className?: string
}

/**
 * App Store / Google Play badges.
 * TODO(launch): replace `href="#download"` with the real store URLs.
 */
export function StoreBadges({ variant = 'dark', className = '' }: Props) {
  const { t } = useLang()
  const skin =
    variant === 'dark'
      ? 'bg-espresso-900 text-cream-50 hover:bg-espresso-800 focus-visible:outline-espresso-900'
      : 'bg-cream-50 text-espresso-900 hover:bg-cream-100 focus-visible:outline-cream-50'

  const badge = `inline-flex min-w-[10.5rem] items-center gap-3 rounded-xl px-4 py-2.5 text-start transition-colors duration-200 ${skin}`

  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      <a href="#download" className={badge}>
        <Icon.Apple className="h-7 w-7 shrink-0" />
        <span className="leading-none">
          <span className="block text-[0.65rem] font-medium opacity-80">{t.store.appStoreSub}</span>{' '}
          <span className="block text-base font-semibold">{t.store.appStore}</span>
        </span>
      </a>
      <a href="#download" className={badge}>
        <Icon.Play className="h-6 w-6 shrink-0" />
        <span className="leading-none">
          <span className="block text-[0.65rem] font-medium opacity-80">{t.store.googlePlaySub}</span>{' '}
          <span className="block text-base font-semibold">{t.store.googlePlay}</span>
        </span>
      </a>
    </div>
  )
}
