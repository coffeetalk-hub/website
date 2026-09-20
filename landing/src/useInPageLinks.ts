import { useEffect } from 'react'

/**
 * Intercepts clicks on same-page anchors (href="#section") and scrolls in place
 * instead of navigating. Keeps the URL untouched, so the page works inside
 * embeds and previews that block hash navigation. Moves focus to the target
 * so keyboard and screen-reader users land in the right place.
 */
export function useInPageLinks() {
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const anchor = (e.target as Element | null)?.closest?.('a[href^="#"]') as HTMLAnchorElement | null
      if (!anchor) return
      e.preventDefault()
      const id = anchor.getAttribute('href')!.slice(1)
      if (!id) return
      const target = document.getElementById(id)
      if (!target) return
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1')
      target.focus({ preventScroll: true })
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])
}
