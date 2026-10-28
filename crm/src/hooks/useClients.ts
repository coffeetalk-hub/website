import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { DEFAULT_STATUS } from '../lib/columns'
import type { CellValue, Client } from '../types'

const PAGE = 1000 // Supabase returns at most 1000 rows per request
const INSERT_BATCH = 500

type Patch = Record<string, CellValue>

export function useClients(myId: string | undefined) {
  const [rows, setRows] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const rowsRef = useRef<Client[]>([])
  rowsRef.current = rows

  const load = useCallback(async () => {
    const all: Client[] = []
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false })
        .order('id')
        .range(from, from + PAGE - 1)
      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }
      all.push(...(data as Client[]))
      if (data.length < PAGE) break
    }
    setRows(all)
    setLoading(false)
  }, [])

  // Live updates from other people. Events are collected and applied in one go (imports send thousands).
  useEffect(() => {
    load()
    const queue: { type: string; row: Client; id: string }[] = []
    let timer: ReturnType<typeof setTimeout> | null = null
    let wasDown = false

    const flush = () => {
      timer = null
      const events = queue.splice(0)
      const deleted = new Set<string>()
      const upserts = new Map<string, Client>()
      for (const e of events) {
        if (e.type === 'DELETE') {
          deleted.add(e.id)
          upserts.delete(e.id)
        } else {
          upserts.set(e.row.id, e.row)
          deleted.delete(e.row.id)
        }
      }
      setRows((prev) => {
        const seen = new Set<string>()
        const next: Client[] = []
        for (const r of prev) {
          if (deleted.has(r.id)) continue
          const u = upserts.get(r.id)
          if (u) seen.add(r.id)
          next.push(u ?? r)
        }
        const fresh = [...upserts.values()].filter((r) => !seen.has(r.id))
        fresh.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
        return fresh.length ? [...fresh, ...next] : next
      })
    }

    const channel = supabase
      .channel('clients-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, (payload) => {
        const row = payload.new as Client
        const old = payload.old as { id?: string }
        queue.push({ type: payload.eventType, row, id: old?.id ?? row?.id })
        if (!timer) timer = setTimeout(flush, 150)
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          if (wasDown) load() // catch up on anything missed while offline
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          wasDown = true
        }
      })

    return () => {
      if (timer) clearTimeout(timer)
      supabase.removeChannel(channel)
    }
  }, [load])

  const track = async <T,>(job: Promise<T>) => {
    setPending((n) => n + 1)
    try {
      return await job
    } finally {
      setPending((n) => n - 1)
    }
  }

  /** Optimistic edit: the screen updates at once, then saves; on failure the old value is restored. */
  const updateRow = useCallback(async (id: string, patch: Patch) => {
    const before = rowsRef.current.find((r) => r.id === id)
    if (!before) return
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
    const { data, error } = await track(
      Promise.resolve(supabase.from('clients').update(patch).eq('id', id).select().single()),
    )
    if (error) {
      setError(`Could not save: ${error.message}`)
      setRows((prev) => prev.map((r) => (r.id === id ? before : r)))
    } else if (data) {
      setRows((prev) => prev.map((r) => (r.id === id ? (data as Client) : r)))
    }
  }, [])

  const addRow = useCallback(async (): Promise<string | null> => {
    const { data, error } = await track(
      Promise.resolve(
        supabase.from('clients').insert({ status: DEFAULT_STATUS, owner_id: myId ?? null }).select().single(),
      ),
    )
    if (error || !data) {
      setError(`Could not add row: ${error?.message ?? 'unknown error'}`)
      return null
    }
    const row = data as Client
    setRows((prev) => (prev.some((r) => r.id === row.id) ? prev : [row, ...prev]))
    return row.id
  }, [myId])

  const deleteRow = useCallback(async (id: string) => {
    const before = rowsRef.current
    setRows((prev) => prev.filter((r) => r.id !== id))
    const { error } = await track(Promise.resolve(supabase.from('clients').delete().eq('id', id)))
    if (error) {
      setError(`Could not delete: ${error.message}`)
      setRows(before)
    }
  }, [])

  const importRecords = useCallback(
    async (records: Patch[], onProgress: (done: number) => void) => {
      let done = 0
      for (let i = 0; i < records.length; i += INSERT_BATCH) {
        const batch = records.slice(i, i + INSERT_BATCH)
        const { error } = await supabase.from('clients').insert(batch)
        if (error) {
          await load()
          throw new Error(`${error.message} (${done} of ${records.length} rows were imported before the error)`)
        }
        done += batch.length
        onProgress(done)
      }
      await load()
    },
    [load],
  )

  return {
    rows,
    loading,
    saving: pending > 0,
    error,
    clearError: () => setError(null),
    updateRow,
    addRow,
    deleteRow,
    importRecords,
  }
}
