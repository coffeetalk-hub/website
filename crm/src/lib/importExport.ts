import type * as XLSXTypes from 'xlsx'

// Loaded on demand so the spreadsheet library doesn't slow down the first page load
const loadXlsx = () => import('xlsx')
import { COLUMNS, DEFAULT_STATUS, STATUS_OPTIONS, isImportable, type ColumnDef } from './columns'
import { normalizeText, parseDateValue, parseNumber, formatDateTime } from './format'
import { profileName, type Client, type Profile } from '../types'

export interface SheetData {
  headers: string[]
  rows: unknown[][]
  warning?: string
}

/** Reads the first sheet of an .xlsx / .xls / .csv file. */
export async function readSheet(file: File): Promise<SheetData> {
  const XLSX = await loadXlsx()
  let wb: XLSXTypes.WorkBook
  let warning: string | undefined
  if (/\.(csv|txt)$/i.test(file.name)) {
    // Read CSV as UTF-8 text so Arabic is not garbled
    const text = (await file.text()).replace(/^﻿/, '')
    if (text.includes('�')) {
      warning = 'Some characters could not be read. In Excel use "Save As → CSV UTF-8", or import the .xlsx file instead.'
    }
    wb = XLSX.read(text, { type: 'string', cellDates: true })
  } else {
    wb = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: true })
  }
  const sheet = wb.Sheets[wb.SheetNames[0]]
  if (!sheet) throw new Error('The file has no sheets.')
  const all = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: true, defval: '', blankrows: false })
  const isEmpty = (v: unknown) => v === '' || v == null
  const headerIdx = all.findIndex((r) => r.some((v) => !isEmpty(v)))
  if (headerIdx < 0) throw new Error('The file is empty.')
  const headers = all[headerIdx].map((v) => String(v ?? '').trim())
  const rows = all.slice(headerIdx + 1).filter((r) => r.some((v) => !isEmpty(v)))
  return { headers, rows, warning }
}

const norm = (s: string) => normalizeText(s).replace(/[\s_\-–]+/g, ' ')

/** Guess which spreadsheet column belongs to which CRM column. Returns key -> header index (or -1). */
export function autoMap(headers: string[]): Record<string, number> {
  const used = new Set<number>()
  const map: Record<string, number> = {}
  const normHeaders = headers.map(norm)
  for (const col of COLUMNS.filter(isImportable)) {
    const names = [col.label, col.key, ...(col.aliases ?? [])].map(norm)
    let idx = normHeaders.findIndex((h, i) => !used.has(i) && h !== '' && names.includes(h))
    if (idx < 0) idx = normHeaders.findIndex((h, i) => !used.has(i) && h !== '' && names.some((n) => n.length > 3 && (h.includes(n) || n.includes(h))))
    map[col.key] = idx
    if (idx >= 0) used.add(idx)
  }
  return map
}

export interface ImportResult {
  records: Record<string, string | number | null>[]
  warnings: string[]
}

export function buildRecords(rows: unknown[][], mapping: Record<string, number>, profiles: Profile[]): ImportResult {
  const warnings: string[] = []
  const records: ImportResult['records'] = []
  const cols = COLUMNS.filter(isImportable)
  const statusByName = new Map(STATUS_OPTIONS.map((s) => [normalizeText(s), s]))
  const ownerByName = new Map<string, string>()
  for (const p of profiles) {
    ownerByName.set(normalizeText(p.email), p.id)
    if (p.full_name) ownerByName.set(normalizeText(p.full_name), p.id)
  }
  const bad: Record<string, number> = {}
  const note = (label: string) => (bad[label] = (bad[label] ?? 0) + 1)

  rows.forEach((row) => {
    const rec: Record<string, string | number | null> = {}
    let any = false
    for (const col of cols) {
      const idx = mapping[col.key]
      const raw = idx != null && idx >= 0 ? row[idx] : undefined
      const text = raw == null ? '' : raw instanceof Date ? '' : String(raw).trim()
      if (raw != null && text !== '') any = true
      if (raw instanceof Date) any = true
      switch (col.type) {
        case 'date': {
          const d = parseDateValue(raw)
          if (!d && text !== '') note(col.label)
          rec[col.key] = d
          break
        }
        case 'number': {
          const n = parseNumber(typeof raw === 'number' ? raw : text)
          if (n != null && Number.isNaN(n)) { note(col.label); rec[col.key] = null } else rec[col.key] = n
          break
        }
        case 'select': {
          if (text === '') { rec[col.key] = DEFAULT_STATUS; break }
          const hit = statusByName.get(normalizeText(text))
          if (!hit) note(`${col.label} (set to ${DEFAULT_STATUS})`)
          rec[col.key] = hit ?? DEFAULT_STATUS
          break
        }
        case 'owner': {
          const id = text ? ownerByName.get(normalizeText(text)) : undefined
          if (text && !id) note(`${col.label} (left empty)`)
          rec[col.key] = id ?? null
          break
        }
        default:
          rec[col.key] = col.key === 'company_name' ? text : text === '' ? null : text
      }
    }
    if (any) records.push(rec)
  })

  for (const [label, n] of Object.entries(bad)) warnings.push(`${n} row(s): could not read "${label}"`)
  return { records, warnings }
}

/** Export the given rows (already filtered + sorted) to an .xlsx download. */
export async function exportToExcel(rows: Client[], profiles: Profile[]) {
  const XLSX = await loadXlsx()
  const byId = new Map(profiles.map((p) => [p.id, p]))
  const header = COLUMNS.map((c) => c.label)
  const body = rows.map((r) => COLUMNS.map((c) => cellForExport(c, r, byId)))
  const ws = XLSX.utils.aoa_to_sheet([header, ...body], { cellDates: true, dateNF: 'dd/mm/yyyy' })
  ws['!cols'] = COLUMNS.map((c) => ({ wch: Math.max(12, Math.round(c.width / 7)) }))
  const wb = XLSX.utils.book_new()
  wb.Workbook = { Views: [{ RTL: false }] }
  XLSX.utils.book_append_sheet(wb, ws, 'Clients')
  const d = new Date()
  const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  XLSX.writeFile(wb, `clients-${stamp}.xlsx`)
}

function cellForExport(c: ColumnDef, r: Client, byId: Map<string, Profile>): string | number | Date {
  const v = r[c.key]
  if (v == null || v === '') return ''
  switch (c.type) {
    case 'owner':
    case 'user':
      return profileName(byId.get(String(v)))
    case 'date': {
      const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(v))
      return m ? new Date(+m[1], +m[2] - 1, +m[3]) : String(v)
    }
    case 'timestamp':
      return formatDateTime(String(v))
    case 'number':
      return Number(v)
    default:
      return v
  }
}

