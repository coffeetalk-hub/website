interface Props {
  src: string
  alt: string
  /** Hero image loads eagerly; everything else lazily. */
  priority?: boolean
  className?: string
}

/**
 * Styled phone frame around an app screenshot from /public/screens.
 * The <img> has fixed intrinsic dimensions (9:19.5) so there is no layout shift.
 */
export function PhoneFrame({ src, alt, priority = false, className = '' }: Props) {
  return (
    <div className={`relative mx-auto w-[15.5rem] sm:w-[17rem] ${className}`}>
      <div className="rounded-[2.4rem] border border-cream-50/10 bg-espresso-900 p-2 shadow-phone">
        <div className="relative overflow-hidden rounded-[1.9rem] bg-espresso-800">
          <div aria-hidden="true" className="absolute inset-x-0 top-0 z-10 flex justify-center pt-2">
            <div className="h-5 w-24 rounded-full bg-espresso-950" />
          </div>
          <img
            src={src}
            alt={alt}
            width={390}
            height={845}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            fetchPriority={priority ? 'high' : 'auto'}
            className="block h-auto w-full"
          />
        </div>
      </div>
    </div>
  )
}
