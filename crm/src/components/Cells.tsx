import { useEffect, useRef } from 'react'
import type { ColumnDef } from '../lib/columns'
import { formatDate, formatDateTime, formatNumber } from '../lib/format'
import { profileName, type Client, type Profile } from '../types'

export type Move = -1 | 0 | 1

export interface CellProps {
  col: ColumnDef
  row: Client
  profiles: Profile[]
  profileById: Map<string, Profile>
  editing: boolean
  onEdit: () => void
  onCommit: (value: string, move: Move) => void
  onCancel: () => void
  onSelectChange: (value: string | null) => void
  onOpenNotes: () => void
}

export function Cell(p: CellProps) {
  const { col, row } = p
  const raw = row[col.key]
  const text = raw == null ? '' : String(raw)

  switch (col.type) {
    case 'select':
      return (
        <select
          className="pill-select"
          data-status={text}
          value={text}
          onChange={(e) => p.onSelectChange(e.target.value)}
          aria-label={col.label}
        >
          {(col.options ?? []).map((o) => <option key={o}>{o}</option>)}
          {text && !(col.options ?? []).includes(text) && <option>{text}</option>}
        </select>
      )
    case 'owner':
      return (
        <select
          className="pill-select owner"
          value={text}
          onChange={(e) => p.onSelectChange(e.target.value || null)}
          aria-label={col.label}
        >
          <option value="">— Unassigned</option>
          {p.profiles.map((u) => <option key={u.id} value={u.id}>{profileName(u)}</option>)}
        </select>
      )
    case 'user':
      return <div className="cell-text readonly">{profileName(p.profileById.get(text)) || '—'}</div>
    case 'timestamp':
      return <div className="cell-text readonly">{formatDateTime(text)}</div>
    case 'notes':
      return (
        <button className="cell-text notes-btn" dir="auto" onClick={p.onOpenNotes} title={text || 'Add a note'}>
          {text ? text.replace(/\s+/g, ' ') : <span className="placeholder">Add note…</span>}
        </button>
      )
    case 'date':
      return p.editing ? (
        <DateEditor initial={text} onCommit={p.onCommit} onCancel={p.onCancel} />
      ) : (
        <div className="cell-text" onClick={p.onEdit}>{formatDate(text)}</div>
      )
    default: {
      const dir = col.type === 'email' || col.type === 'phone' || col.type === 'number' ? 'ltr' : 'auto'
      const shown = col.type === 'number' ? formatNumber(raw as number | null) : text
      return p.editing ? (
        <TextEditor
          initial={col.type === 'number' && raw != null ? String(raw) : text}
          dir={dir}
          inputMode={col.type === 'number' ? 'decimal' : col.type === 'phone' ? 'tel' : col.type === 'email' ? 'email' : 'text'}
          onCommit={p.onCommit}
          onCancel={p.onCancel}
        />
      ) : (
        <div
          className={`cell-text${col.type === 'number' ? ' num' : ''}${col.key === 'company_name' ? ' strong' : ''}`}
          dir={dir}
          onClick={p.onEdit}
        >
          {shown}
        </div>
      )
    }
  }
}

interface EditorProps {
  initial: string
  onCommit: (value: string, move: Move) => void
  onCancel: () => void
}

function TextEditor({ initial, dir, inputMode, onCommit, onCancel }: EditorProps & { dir: 'ltr' | 'auto'; inputMode: string }) {
  const ref = useRef<HTMLInputElement>(null)
  const done = useRef(false)
  useEffect(() => {
    ref.current?.focus()
    ref.current?.select()
  }, [])
  const finish = (save: boolean, move: Move = 0) => {
    if (done.current) return
    done.current = true
    if (save) onCommit(ref.current?.value ?? '', move)
    else onCancel()
  }
  return (
    <input
      ref={ref}
      className="cell-input"
      dir={dir}
      inputMode={inputMode as 'text'}
      defaultValue={initial}
      onBlur={() => finish(true)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') finish(true)
        else if (e.key === 'Escape') finish(false)
        else if (e.key === 'Tab') {
          e.preventDefault()
          finish(true, e.shiftKey ? -1 : 1)
        }
      }}
    />
  )
}

function DateEditor({ initial, onCommit, onCancel }: EditorProps) {
  const ref = useRef<HTMLInputElement>(null)
  const done = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    ref.current?.focus()
    try {
      ref.current?.showPicker?.()
    } catch {
      /* picker not available — typing still works */
    }
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])
  const finish = (save: boolean, move: Move = 0) => {
    if (done.current) return
    done.current = true
    if (timer.current) clearTimeout(timer.current)
    if (save) onCommit(ref.current?.value ?? '', move)
    else onCancel()
  }
  return (
    <input
      ref={ref}
      type="date"
      className="cell-input"
      defaultValue={initial}
      onChange={(e) => {
        // Picking from the calendar saves after a short pause; half-typed years (0002…) are ignored.
        const v = e.target.value
        if (timer.current) clearTimeout(timer.current)
        const year = Number(v.slice(0, 4))
        if (v && year >= 1900 && year <= 2200) timer.current = setTimeout(() => finish(true), 600)
      }}
      onBlur={() => finish(true)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') finish(true)
        else if (e.key === 'Escape') finish(false)
        else if (e.key === 'Tab') {
          e.preventDefault()
          finish(true, e.shiftKey ? -1 : 1)
        }
      }}
    />
  )
}
