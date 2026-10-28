const ARABIC_DIGITS = /[٠-٩۰-۹]/g

/** Arabic-Indic digits -> 0-9 */
export function westernDigits(s: string) {
  return s.replace(ARABIC_DIGITS, (d) => {
    const c = d.charCodeAt(0)
    return String(c >= 0x06f0 ? c - 0x06f0 : c - 0x0660)
  })
}

/** For searching: case, Arabic digits, diacritics, tatweel and alef/yaa/taa-marbuta variants are ignored. */
export function normalizeText(s: string) {
  return westernDigits(s)
    .toLowerCase()
    .replace(/[ً-ٰٟـ]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .trim()
}

const pad = (n: number) => String(n).padStart(2, '0')

export const toIsoDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const todayIso = () => toIsoDate(new Date())

/** 2026-03-09 -> 09/03/2026 */
export function formatDate(iso: string | null | undefined) {
  if (!iso) return ''
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
  return m ? `${m[3]}/${m[2]}/${m[1]}` : String(iso)
}

export function formatDateTime(ts: string | null | undefined) {
  if (!ts) return ''
  const d = new Date(ts)
  if (isNaN(d.getTime())) return ''
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const numberFmt = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })
export const formatNumber = (n: number | string | null | undefined) => (n == null || n === '' ? '' : numberFmt.format(Number(n)))

/** "SAR 12,500.50", "١٢٬٥٠٠", "12 500" -> number. Empty -> null. Garbage -> NaN. */
export function parseNumber(raw: string | number | null | undefined): number | null {
  if (raw == null) return null
  if (typeof raw === 'number') return raw
  let s = westernDigits(raw).replace(/٫/g, '.').replace(/[٬\s,]/g, '')
  s = s.replace(/[^\d.\-]/g, '')
  if (s === '') return raw.trim() === '' ? null : NaN
  const n = Number(s)
  return Number.isFinite(n) ? n : NaN
}

const validYmd = (y: number, m: number, d: number) => {
  const dt = new Date(Date.UTC(y, m - 1, d))
  return y >= 1900 && y <= 2200 && dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d
}
const ymd = (y: number, m: number, d: number) => (validYmd(y, m, d) ? `${y}-${pad(m)}-${pad(d)}` : null)

/**
 * Anything a spreadsheet may contain -> "YYYY-MM-DD" (or null).
 * Text dates are read as DD/MM/YYYY (day first).
 */
export function parseDateValue(v: unknown): string | null {
  if (v == null || v === '') return null
  if (v instanceof Date) {
    if (isNaN(v.getTime())) return null
    // +12h protects against tiny timezone offsets in the Excel reader
    return toIsoDate(new Date(v.getTime() + 12 * 3600 * 1000))
  }
  if (typeof v === 'number') {
    if (v < 20000 || v > 80000) return null
    const d = new Date(Math.round((v - 25569) * 86400 * 1000))
    return ymd(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate())
  }
  const s = westernDigits(String(v)).trim()
  let m = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/.exec(s)
  if (m) return ymd(+m[1], +m[2], +m[3])
  m = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2}|\d{4})$/.exec(s)
  if (m) {
    const y = m[3].length === 2 ? 2000 + +m[3] : +m[3]
    return ymd(y, +m[2], +m[1])
  }
  if (/^\d{5}$/.test(s)) return parseDateValue(Number(s))
  return null
}
