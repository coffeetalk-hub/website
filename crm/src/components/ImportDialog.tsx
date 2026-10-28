import { useRef, useState } from 'react'
import { Modal } from './Modal'
import { COLUMNS, isImportable } from '../lib/columns'
import { autoMap, buildRecords, readSheet, type SheetData } from '../lib/importExport'
import type { CellValue, Profile } from '../types'

interface Props {
  open: boolean
  profiles: Profile[]
  onClose: () => void
  onImport: (records: Record<string, CellValue>[], onProgress: (n: number) => void) => Promise<void>
}

export function ImportDialog({ open, profiles, onClose, onImport }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [sheet, setSheet] = useState<SheetData | null>(null)
  const [fileName, setFileName] = useState('')
  const [mapping, setMapping] = useState<Record<string, number>>({})
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [doneMsg, setDoneMsg] = useState<string | null>(null)

  const reset = () => {
    setSheet(null)
    setFileName('')
    setMapping({})
    setError(null)
    setBusy(false)
    setProgress(0)
    setDoneMsg(null)
  }
  const close = () => {
    if (busy) return
    reset()
    onClose()
  }

  const pick = async (file: File | undefined) => {
    if (!file) return
    setError(null)
    try {
      const data = await readSheet(file)
      setSheet(data)
      setFileName(file.name)
      setMapping(autoMap(data.headers))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read that file.')
    }
  }

  const result = sheet ? buildRecords(sheet.rows, mapping, profiles) : null

  const run = async () => {
    if (!result) return
    setBusy(true)
    setError(null)
    try {
      await onImport(result.records, setProgress)
      setDoneMsg(`Imported ${result.records.length} row(s).`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      title="Import from Excel / CSV"
      wide
      onClose={close}
      footer={
        doneMsg ? (
          <button className="btn primary" onClick={close}>Close</button>
        ) : (
          <>
            <button className="btn" onClick={close} disabled={busy}>Cancel</button>
            <button className="btn primary" onClick={run} disabled={busy || !result || result.records.length === 0}>
              {busy ? `Importing… ${progress}/${result?.records.length}` : `Import ${result?.records.length ?? 0} rows`}
            </button>
          </>
        )
      }
    >
      {doneMsg ? (
        <p className="ok-msg">{doneMsg}</p>
      ) : (
        <>
          <p className="hint">
            Pick an .xlsx, .xls or .csv file. The first row must contain column names. New rows are <strong>added</strong>; nothing existing is changed.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv,.txt"
            onChange={(e) => pick(e.target.files?.[0])}
          />
          {error && <p className="error-msg">{error}</p>}
          {sheet?.warning && <p className="warn-msg">{sheet.warning}</p>}

          {sheet && result && (
            <>
              <h3 className="sub">Match the columns <span className="muted">({fileName} — {sheet.rows.length} rows)</span></h3>
              <div className="map-grid">
                {COLUMNS.filter(isImportable).map((c) => (
                  <label key={c.key} className="map-row">
                    <span>{c.label}</span>
                    <select
                      value={mapping[c.key] ?? -1}
                      onChange={(e) => setMapping({ ...mapping, [c.key]: Number(e.target.value) })}
                    >
                      <option value={-1}>— don’t import —</option>
                      {sheet.headers.map((h, i) => (
                        <option key={i} value={i}>{h || `(column ${i + 1})`}</option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
              {result.warnings.length > 0 && (
                <ul className="warn-msg">
                  {result.warnings.map((w) => <li key={w}>{w}</li>)}
                </ul>
              )}
              <h3 className="sub">Preview</h3>
              <div className="preview-wrap">
                <table className="preview">
                  <thead>
                    <tr>{COLUMNS.filter(isImportable).map((c) => <th key={c.key}>{c.label}</th>)}</tr>
                  </thead>
                  <tbody>
                    {result.records.slice(0, 5).map((r, i) => (
                      <tr key={i}>
                        {COLUMNS.filter(isImportable).map((c) => (
                          <td key={c.key} dir="auto">{c.type === 'owner' ? (profiles.find((p) => p.id === r[c.key])?.full_name ?? '') : String(r[c.key] ?? '')}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </Modal>
  )
}
