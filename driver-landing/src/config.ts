/** Build-time configuration (see .env.example). */
export const config = {
  /** External apply URL. Empty → primary CTA opens the waitlist form. TODO(launch) */
  applyUrl: import.meta.env.VITE_APPLY_URL?.trim() || '',
  /** Waitlist POST endpoint. Empty → form logs to console and shows success. TODO(launch) */
  waitlistEndpoint: import.meta.env.VITE_WAITLIST_ENDPOINT?.trim() || '',
  /** Canonical origin for hreflang / og:url. Falls back to window.location.origin. TODO(launch) */
  siteUrl: import.meta.env.VITE_SITE_URL?.trim() || '',
}

/** Screenshot files under /public/screens (swap extension when real PNGs land). */
export const SCREENS = {
  home: '/screens/home.svg',
  checkIn: '/screens/check-in.svg',
  order: '/screens/order.svg',
  route: '/screens/route.svg',
} as const
