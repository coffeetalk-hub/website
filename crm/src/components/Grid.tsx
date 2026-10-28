import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { CLOSED_STATUSES, COLUMNS, isTypable } from '../lib/columns'
import { parseDateValue, parseNumber } from '../lib/format'
import { Modal } from './Modal'
import { Cell, type Move } from './Cells'
import type { CellValue, Client, Profile } from '../types'

export interface SortState {
  key: string
  dir: 'asc' | 'desc'
}

export interface GridHandle {
  startEditing: (rowId: string, key: string) => void
}

interface Props {
  rows: Client[]
  profiles: Profile[]
  sort: SortState | null
  today: string
  onSort: (key: string) => void
  onUpdate: (id: string, patch: Record<string, CellValue>) => void
  onDelete: (id: string) => void
}

const ROW_H = 42
const HEAD_H = 42
const ACTION_W = 44
const STICKY_KEY = 'company_name'

export const Grid = forwardRef<GridHandle, Props>(function Grid(props, ref) {
  const { rows, profiles, sort, today, onSort, onUpdate, onDelete } = props
  const scrollRef = useRef<HTMLDivElement>(null)
  const [editing, setEditing] = useState<{ id: string; key: string } | null>(null)
  const [notesFor, setNotesFor] = useState<string | null>(null)
  const [notesDraft, setNotesDraft] = useState('')
  const [deleting, setDeleting] = useState<Client | null>(null)

  const profileById = useMemo(() => new Map(profiles.map((p) => [p.id, p])), [profiles])
  const totalWidth = ACTION_W + COLUMNS.reduce((s, c) => s + c.width, 0)

  const virt = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_H,
    overscan: 12,
    scrollMargin: HEAD_H,
  })

  useImperativeHandle(ref, () => ({
    startEditing: (id, key) => {
      virt.scrollToIndex(0)
      scrollRef.current?.scrollTo({ left: 0 })
      setEditing({ id, key })
    },
  }))

  const commit = (row: Client, key: string, raw: string, move: Move) => {
    const col = COLUMNS.find((c) => c.key === key)!
    let value: CellValue
    if (col.type === 'number') {
      const n = parseNumber(raw)
      if (n != null && Number.isNaN(n)) return setEditing(null) // not a number: keep the old value
      value = n
    } else if (col.type === 'date') {
      value = raw ? parseDateValue(raw) : null
    } else {
      const t = raw.trim()
      value = key === 'company_name' ? t : t === '' ? null : t
    }
    const old = row[key] ?? (key === 'company_name' ? '' : null)
    if (value !== old && String(value ?? '') !== String(old ?? '')) onUpdate(row.id, { [key]: value })

    if (move === 0) return setEditing(null)
    const typable = COLUMNS.filter(isTypable)
    const next = typable[typable.findIndex((c) => c.key === key) + move]
    setEditing(next ? { id: row.id, key: next.key } : null)
  }

  const openNotes = (row: Client) => {
    setNotesDraft(String(row.notes ?? ''))
    setNotesFor(row.id)
  }
  const notesRow = notesFor ? rows.find((r) => r.id === notesFor) : undefined
  const saveNotes = () => {
    if (notesRow) {
      const t = notesDraft.trim()
      const next = t === '' ? null : notesDraft
      if ((notesRow.notes ?? null) !== next) onUpdate(notesRow.id, { notes: next })
    }
    setNotesFor(null)
  }

  // Sticky-left offsets: delete column, then company name
  const stickyLeft = (key: string) => (key === STICKY_KEY ? ACTION_W : undefined)

  return (
    <>
      <div className="grid-scroll" ref={scrollRef}>
        <div className="grid" role="table" style={{ width: totalWidth }}>
          <div className="grid-head" role="row" style={{ height: HEAD_H }}>
            <div className="hcell sticky action" style={{ width: ACTION_W, left: 0 }} />
            {COLUMNS.map((c) => {
              const active = sort?.key === c.key
              return (
                <button
                  key={c.key}
                  className={`hcell${c.key === STICKY_KEY ? ' sticky' : ''}${active ? ' active' : ''}`}
                  style={{ width: c.width, left: stickyLeft(c.key) }}
                  onClick={() => onSort(c.key)}
                  aria-sort={active ? (sort!.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
                  title="Click to sort"
                >
                  <span>{c.label}</span>
                  <span className="sort-ind">{active ? (sort!.dir === 'asc' ? '▲' : '▼') : ''}</span>
                </button>
              )
            })}
          </div>

          <div className="grid-body" style={{ height: virt.getTotalSize() - HEAD_H }}>
            {virt.getVirtualItems().map((v) => {
              const row = rows[v.index]
              const due = row.next_followup_date && !CLOSED_STATUSES.includes(String(row.status))
                ? String(row.next_followup_date) < today ? 'overdue' : String(row.next_followup_date) === today ? 'today' : ''
                : ''
              return (
                <div
                  key={row.id}
                  role="row"
                  className={`grow ${due}${v.index % 2 ? ' alt' : ''}`}
                  style={{ height: ROW_H, transform: `translateY(${v.start - HEAD_H}px)` }}
                >
                  <div className="gcell sticky action" style={{ width: ACTION_W, left: 0 }}>
                    <button className="icon-btn del" onClick={() => setDeleting(row)} aria-label="Delete row" title="Delete row">🗑</button>
                  </div>
                  {COLUMNS.map((c) => (
                    <div
                      key={c.key}
                      role="cell"
                      className={`gcell${c.key === STICKY_KEY ? ' sticky' : ''}`}
                      style={{ width: c.width, left: stickyLeft(c.key) }}
                    >
                      <Cell
                        col={c}
                        row={row}
                        profiles={profiles}
                        profileById={profileById}
                        editing={editing?.id === row.id && editing.key === c.key}
                        onEdit={() => setEditing({ id: row.id, key: c.key })}
                        onCommit={(val, move) => commit(row, c.key, val, move)}
                        onCancel={() => setEditing(null)}
                        onSelectChange={(val) => onUpdate(row.id, { [c.key]: val })}
                        onOpenNotes={() => openNotes(row)}
                      />
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
        {rows.length === 0 && <div className="empty">No clients match. Add a row or change the filters.</div>}
      </div>

      <Modal
        open={notesFor !== null}
        title={`Notes — ${notesRow?.company_name || 'Untitled'}`}
        onClose={() => setNotesFor(null)}
        footer={
          <>
            <button className="btn" onClick={() => setNotesFor(null)}>Cancel</button>
            <button className="btn primary" onClick={saveNotes}>Save</button>
          </>
        }
      >
        <textarea
          className="notes-area"
          dir="auto"
          autoFocus
          value={notesDraft}
          onChange={(e) => setNotesDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) saveNotes()
          }}
          placeholder="Write notes here…"
        />
        <p className="hint">Ctrl+Enter to save</p>
      </Modal>

      <Modal
        open={deleting !== null}
        title="Delete this row?"
        onClose={() => setDeleting(null)}
        footer={
          <>
            <button className="btn" onClick={() => setDeleting(null)}>Cancel</button>
            <button
              className="btn danger"
              onClick={() => {
                if (deleting) onDelete(deleting.id)
                setDeleting(null)
              }}
            >
              Yes, delete
            </button>
          </>
        }
      >
        <p>
          Are you sure you want to delete <strong dir="auto">{deleting?.company_name || 'this empty row'}</strong>? This can’t be undone.
        </p>
      </Modal>
    </>
  )
})
