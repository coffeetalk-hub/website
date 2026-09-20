/** Saudi mobile: 05xxxxxxxx, 5xxxxxxxx, +9665xxxxxxxx, 009665xxxxxxxx (spaces/dashes ignored). Returns E.164 or null. */
export function normalizeSaudiPhone(raw: string): string | null {
  const digits = raw.replace(/[\s\-()]/g, '').replace(/^\+/, '')
  const m = digits.match(/^(?:00966|966|0)?(5\d{8})$/)
  return m ? `+966${m[1]}` : null
}
