import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { useClients } from '../hooks/useClients'
import { Grid, type GridHandle, type SortState } from '../components/Grid'
import { ImportDialog } from '../components/ImportDialog'
import { CLOSED_STATUSES, COLUMNS, STATUS_OPTIONS } from '../lib/columns'
import { normalizeText, todayIso } from '../lib/format'
import { exportToExcel } from '../lib/importExport'
import { profileName, type Client, type Profile } from '../types'

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })
const SEARCH_KEYS = COLUMNS.filter((c) => ['text', 'email', 'phone', 'notes', 'select'].includes(c.type)).map((c) => c.key)

function sortRows(rows: Client[], sort: SortState | null, profileById: Map<string, Profile>) {
  if (!sort) return rows
  const col = COLUMNS.find((c) => c.key === sort.key)
  if (!col) return rows
  const val = (r: Client): string | number | null => {
    const v = r[col.key]
    if (v == null || v === '') return null
    if (col.type === 'owner' || col.type === 'user') return profileName(profileById.get(String(v))) || null
    if (col.type === 'number') return Number(v)
    return String(v)
  }
  const dir = sort.dir === 'asc' ? 1 : -1
  return [...rows].sort((a, b) => {
    const x = val(a)
    const y = val(b)
    if (x === null && y === null) return 0
    if (x === null) return 1 // empty cells always last
    if (y === null) return -1
    if (typeof x === 'number' && typeof y === 'number') return (x - y) * dir
    return collator.compare(String(x), String(y)) * dir
  })
}

export function Clients() {
  const { profile, profiles } = useAuth()
  const { rows, loading, saving, error, clearError, updateRow, addRow, deleteRow, importRecords } = useClients(profile?.id)
  const gridRef = useRef<GridHandle>(null)

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [owner, setOwner] = useState('')
  const [dueOnly, setDueOnly] = useState(false)
  const [sort, setSort] = useState<SortState | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [today, setToday] = useState(todayIso())
  const deferredSearch = useDeferredValue(search)

  // roll the "today" highlight over at midnight without a reload
  useEffect(() => {
    const t = setInterval(() => setToday(todayIso()), 60_000)
    return () => clearInterval(t)
  }, [])

  const profileById = useMemo(() => new Map(profiles.map((p) => [p.id, p])), [profiles])

  const haystack = useMemo(() => {
    const m = new Map<string, string>()
    for (const r of rows) {
      const parts = SEARCH_KEYS.map((k) => r[k] ?? '')
      parts.push(profileName(profileById.get(String(r.owner_id ?? ''))))
      m.set(r.id, normalizeText(parts.join(' \u0001 ')))
    }
    return m
  }, [rows, profileById])

  const isDue = (r: Client) =>
    !!r.next_followup_date && String(r.next_followup_date) <= today && !CLOSED_STATUSES.includes(String(r.status))
  const dueCount = useMemo(() => rows.filter(isDue).length, [rows, today]) // eslint-disable-line react-hooks/exhaustive-deps

  const visible = useMemo(() => {
    const q = normalizeText(deferredSearch)
    const filtered = rows.filter((r) => {
      if (status && r.status !== status) return false
      if (owner === '__none' ? r.owner_id : owner && r.owner_id !== owner) return false
      if (dueOnly && !isDue(r)) return false
      if (q && !haystack.get(r.id)?.includes(q)) return false
      return true
    })
    return sortRows(filtered, sort, profileById)
  }, [rows, deferredSearch, status, owner, dueOnly, sort, haystack, profileById, today]) // eslint-disable-line react-hooks/exhaustive-deps

  const onSort = (key: string) =>
    setSort((s) => (s?.key !== key ? { key, dir: 'asc' } : s.dir === 'asc' ? { key, dir: 'desc' } : null))

  const onAdd = async () => {
    setSearch('')
    setStatus('')
    setOwner('')
    setDueOnly(false)
    setSort(null)
    const id = await addRow()
    if (id) setTimeout(() => gridRef.current?.startEditing(id, 'company_name'), 30)
  }

  const filtersOn = Boolean(search || status || owner || dueOnly)

  return (
    <div className="clients-page">
      <div className="toolbar">
        <input
          className="search"
          type="search"
          dir="auto"
          placeholder="Search all columns…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search"
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select value={owner} onChange={(e) => setOwner(e.target.value)} aria-label="Filter by owner">
          <option value="">All owners</option>
          <option value="__none">Unassigned</option>
          {profiles.map((p) => <option key={p.id} value={p.id}>{profileName(p)}</option>)}
        </select>
        <button className={`btn chip${dueOnly ? ' on' : ''}`} onClick={() => setDueOnly((v) => !v)} aria-pressed={dueOnly}>
          Follow-up due{dueCount > 0 && <span className="count">{dueCount}</span>}
        </button>
        {filtersOn && (
          <button className="link-btn" onClick={() => { setSearch(''); setStatus(''); setOwner(''); setDueOnly(false) }}>Clear</button>
        )}
        <div className="spacer" />
        <button className="btn" onClick={() => setImportOpen(true)}>Import</button>
        <button className="btn" onClick={() => exportToExcel(visible, profiles)} disabled={visible.length === 0} title="Exports the rows currently shown">
          Export
        </button>
        <button className="btn primary" onClick={onAdd}>+ Add row</button>
      </div>

      {error && (
        <div className="banner error" role="alert">
          {error} <button className="link-btn" onClick={clearError}>Dismiss</button>
        </div>
      )}

      {loading ? (
        <div className="center-msg">Loading clients…</div>
      ) : (
        <Grid
          ref={gridRef}
          rows={visible}
          profiles={profiles}
          sort={sort}
          today={today}
          onSort={onSort}
          onUpdate={updateRow}
          onDelete={deleteRow}
        />
      )}

      <div className="statusbar">
        <span>{filtersOn ? `${visible.length} of ${rows.length} clients` : `${rows.length} clients`}</span>
        <span className="legend"><i className="sw overdue" /> overdue <i className="sw today" /> due today</span>
        <span className={saving ? 'saving' : 'saved'}>{saving ? 'Saving…' : '✓ All changes saved'}</span>
      </div>

      <ImportDialog open={importOpen} profiles={profiles} onClose={() => setImportOpen(false)} onImport={importRecords} />
    </div>
  )
}
