import { useRef, useState, type DragEvent } from 'react'
import { Icon } from '@/components/atoms/Icon'
import { Modal } from '@/components/molecules/Modal'
import { apiErrorMessage } from '@/lib/api/errors'
import { parseImportRows, type ParsedImportRow } from '../bulkUpload'
import { useBulkCreateClients } from '../hooks/useClientMutations'

/** A parsed row paired with the backend's verdict on it. */
type ReviewedRow = ParsedImportRow & { reasons: string[] }

/** "Bulk upload" — parse an Excel file, ask the backend to validate it without
 * committing (`dryRun`), show every row with its verdict, then import. Matches
 * the "preview & confirm" behaviour picked for bad rows: missing columns, an
 * unrecognized plan name, or a duplicate email are all flagged before anything
 * is written, rather than silently skipped or failing the whole file. */
export function BulkUploadModal({ onClose }: { onClose: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [rows, setRows] = useState<ReviewedRow[] | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)

  const bulkCreate = useBulkCreateClients()

  const validRows = rows?.filter((r) => r.reasons.length === 0) ?? []
  const invalidRows = rows?.filter((r) => r.reasons.length > 0) ?? []

  const onFile = async (file: File) => {
    setParseError(null)
    setRows(null)
    setFileName(file.name)

    let parsed: ParsedImportRow[]
    try {
      // Loaded on demand: the spreadsheet parser is ~110 KB gzipped and only
      // matters once someone actually picks a file, so it stays out of the
      // Users page chunk that every session pays for.
      const XLSX = await import('xlsx')
      const buf = await file.arrayBuffer()
      const wb = XLSX.read(buf, { type: 'array', cellDates: true })
      const sheet = wb.Sheets[wb.SheetNames[0]]
      if (!sheet) {
        setParseError('No sheet found in this file.')
        return
      }
      const records = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
        defval: '',
      })
      if (!records.length) {
        setParseError('This file has no data rows.')
        return
      }
      parsed = parseImportRows(records)
    } catch {
      setParseError(
        'Could not read this file. Make sure it’s a valid .xlsx or .csv export.',
      )
      return
    }

    // The backend decides which rows are importable; a dry run gets exactly
    // that answer without creating anyone.
    bulkCreate.mutate(
      { users: parsed.map((r) => r.body), dryRun: true },
      {
        onSuccess: (result) => {
          const reasonsByRow = new Map(
            result.skipped.map((s) => [s.row, s.reasons]),
          )
          setRows(
            parsed.map((r, i) => ({
              ...r,
              reasons: reasonsByRow.get(i) ?? [],
            })),
          )
        },
        onError: (error) => setParseError(apiErrorMessage(error)),
      },
    )
  }

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) void onFile(file)
  }

  const confirmImport = () => {
    if (!rows) return
    bulkCreate.mutate(
      { users: rows.map((r) => r.body) },
      { onSuccess: () => onClose() },
    )
  }

  const reset = () => {
    setRows(null)
    setFileName(null)
    setParseError(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const checking = bulkCreate.isPending && !rows

  return (
    <Modal
      title="Bulk upload users"
      onClose={onClose}
      cardClassName="bulk-upload-card"
      footer={
        rows ? (
          <>
            <button className="link-btn" onClick={reset}>
              Choose a different file
            </button>
            <button
              className="btn-primary"
              disabled={validRows.length === 0 || bulkCreate.isPending}
              onClick={confirmImport}
            >
              {bulkCreate.isPending
                ? 'Importing…'
                : `Import ${validRows.length} user${validRows.length === 1 ? '' : 's'}`}
            </button>
          </>
        ) : (
          <button className="link-btn" onClick={onClose}>
            Cancel
          </button>
        )
      }
    >
      {!rows ? (
        <>
          <div
            className="bulk-upload-dropzone"
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                fileRef.current?.click()
              }
            }}
            role="button"
            tabIndex={0}
            aria-label="Choose an Excel file to import"
          >
            <Icon name="upload" />
            <p className="bulk-upload-dz-title">
              {checking
                ? `Checking ${fileName}…`
                : 'Drop an Excel file here, or click to browse'}
            </p>
            <p className="bulk-upload-dz-sub">.xlsx, .xls or .csv</p>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void onFile(file)
              }}
            />
          </div>
          {parseError ? (
            <p className="modal-field-error" role="alert">
              {parseError}
            </p>
          ) : null}
          <p className="bulk-upload-columns-note">
            Expected columns: <code>Name</code>, <code>Email</code>,{' '}
            <code>Phone</code>, <code>Plan Name</code>, <code>Weeks</code>.{' '}
            <a
              href="/sample-bulk-upload-users.xlsx"
              download
              className="link-btn bulk-upload-template-link"
            >
              Download a sample file
            </a>
          </p>
        </>
      ) : (
        <>
          <div className="bulk-upload-summary">
            <span className="bulk-upload-filename">
              <Icon name="file-text" />
              {fileName}
            </span>
            <span className="bulk-upload-counts">
              <span className="bulk-upload-count-ok">
                <Icon name="check-circle-2" />
                {validRows.length} valid
              </span>
              {invalidRows.length ? (
                <span className="bulk-upload-count-bad">
                  <Icon name="alert-triangle" />
                  {invalidRows.length} need attention
                </span>
              ) : null}
            </span>
          </div>
          <div className="bulk-upload-table-wrap">
            <table className="client-table bulk-upload-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Plan</th>
                  <th>Weeks</th>
                  <th>Issue</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.rowNum}
                    className={r.reasons.length ? 'bulk-row-invalid' : ''}
                  >
                    <td>
                      {r.reasons.length ? (
                        <Icon name="x-circle" className="bulk-row-icon bad" />
                      ) : (
                        <Icon
                          name="check-circle-2"
                          className="bulk-row-icon ok"
                        />
                      )}
                    </td>
                    <td>{r.body.name || '—'}</td>
                    <td>{r.body.email || '—'}</td>
                    <td>{r.body.phone || '—'}</td>
                    <td>{r.body.program || '—'}</td>
                    <td>{r.weeksRaw || '—'}</td>
                    <td className="bulk-row-reason">
                      {r.reasons.join('; ') || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {invalidRows.length ? (
            <p className="bulk-upload-columns-note">
              Rows that need attention will be skipped — only the{' '}
              {validRows.length} valid row{validRows.length === 1 ? '' : 's'}{' '}
              will be imported.
            </p>
          ) : null}
        </>
      )}
    </Modal>
  )
}
