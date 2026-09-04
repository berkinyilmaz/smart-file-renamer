import { useState, useMemo, useCallback, useRef } from 'react'
import './styles.css'

/* ─── Filename helpers ───────────────────────────── */
function splitName(filename) {
  const dot = filename.lastIndexOf('.')
  if (dot <= 0) return { base: filename, ext: '' }
  return { base: filename.slice(0, dot), ext: filename.slice(dot + 1) }
}

function applyCase(str, mode) {
  switch (mode) {
    case 'lower':
      return str.toLowerCase()
    case 'upper':
      return str.toUpperCase()
    case 'title':
      return str.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    case 'kebab':
      return str.trim().replace(/[\s_]+/g, '-').replace(/-+/g, '-').toLowerCase()
    case 'snake':
      return str.trim().replace(/[\s-]+/g, '_').replace(/_+/g, '_').toLowerCase()
    default:
      return str
  }
}

function todayStr() {
  const d = new Date()
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const DATE = todayStr()

/* Escape user text for use in a RegExp */
function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function buildNewName(orig, index, opts) {
  const { find, replace, useRegex, caseMode, template, start, padding, extMode, extValue } = opts
  const { base, ext } = splitName(orig)

  // 1) Find & Replace on the base
  let workBase = base
  if (find) {
    try {
      const pattern = useRegex ? new RegExp(find, 'g') : new RegExp(escapeRegExp(find), 'g')
      workBase = workBase.replace(pattern, replace)
    } catch {
      // invalid regex → leave untouched
    }
  }

  // 2) Case transform
  workBase = applyCase(workBase, caseMode)

  // 3) Template tokens
  const seq = String(start + index).padStart(Math.max(0, padding), '0')
  const tpl = template && template.trim() ? template : '{name}'
  let newBase = tpl
    .replace(/\{name\}/g, workBase)
    .replace(/\{n\}/g, seq)
    .replace(/\{date\}/g, DATE)

  // 4) Extension handling
  let newExt = ext
  if (extMode === 'set') newExt = extValue.replace(/^\.+/, '').trim()
  else if (extMode === 'lower') newExt = ext.toLowerCase()
  else if (extMode === 'remove') newExt = ''

  return newExt ? `${newBase}.${newExt}` : newBase
}

const CASE_OPTIONS = [
  { id: 'original', label: 'Original' },
  { id: 'lower', label: 'lower' },
  { id: 'upper', label: 'UPPER' },
  { id: 'title', label: 'Title' },
  { id: 'kebab', label: 'kebab' },
  { id: 'snake', label: 'snake' },
]

const EXT_OPTIONS = [
  { id: 'keep', label: 'Keep' },
  { id: 'lower', label: 'lowercase' },
  { id: 'set', label: 'Set to…' },
  { id: 'remove', label: 'Remove' },
]

export default function App() {
  const [files, setFiles] = useState([]) // { id, file, name }
  const [dragging, setDragging] = useState(false)

  // options
  const [template, setTemplate] = useState('{name}')
  const [find, setFind] = useState('')
  const [replace, setReplace] = useState('')
  const [useRegex, setUseRegex] = useState(false)
  const [caseMode, setCaseMode] = useState('original')
  const [start, setStart] = useState(1)
  const [padding, setPadding] = useState(2)
  const [extMode, setExtMode] = useState('keep')
  const [extValue, setExtValue] = useState('')

  const [downloaded, setDownloaded] = useState(false)
  const inputRef = useRef(null)
  const idRef = useRef(0)

  const opts = { find, replace, useRegex, caseMode, template, start, padding, extMode, extValue }

  const addFiles = useCallback((fileList) => {
    const incoming = Array.from(fileList).map(f => ({ id: ++idRef.current, file: f, name: f.name }))
    setFiles(prev => [...prev, ...incoming])
  }, [])

  const onDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files)
  }, [addFiles])

  const removeFile = useCallback((id) => {
    setFiles(prev => prev.filter(f => f.id !== id))
  }, [])

  const clearAll = useCallback(() => setFiles([]), [])

  // compute renamed list + duplicate detection
  const rows = useMemo(() => {
    const seen = new Map()
    const list = files.map((f, i) => {
      const newName = buildNewName(f.name, i, opts)
      return { ...f, newName, changed: newName !== f.name }
    })
    list.forEach(r => seen.set(r.newName, (seen.get(r.newName) || 0) + 1))
    return list.map(r => ({ ...r, duplicate: seen.get(r.newName) > 1 || r.newName.trim() === '' }))
  }, [files, template, find, replace, useRegex, caseMode, start, padding, extMode, extValue])

  const changedCount = rows.filter(r => r.changed).length
  const dupCount = rows.filter(r => r.duplicate).length

  const downloadAll = useCallback(() => {
    rows.forEach((r, i) => {
      setTimeout(() => {
        const url = URL.createObjectURL(r.file)
        const a = document.createElement('a')
        a.href = url
        a.download = r.newName || r.name
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        setTimeout(() => URL.revokeObjectURL(url), 1000)
      }, i * 150)
    })
    setDownloaded(true)
    setTimeout(() => setDownloaded(false), 2000)
  }, [rows])

  const resetOptions = useCallback(() => {
    setTemplate('{name}')
    setFind('')
    setReplace('')
    setUseRegex(false)
    setCaseMode('original')
    setStart(1)
    setPadding(2)
    setExtMode('keep')
    setExtValue('')
  }, [])

  const hasFiles = files.length > 0

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-inner">
          <div className="header-left">
            <div className="logo-mark" aria-hidden="true"><IconTag /></div>
            <div>
              <h1 className="header-title">Smart File Renamer</h1>
              <p className="header-sub">Batch-rename files with custom patterns</p>
            </div>
          </div>
          <div className="header-right">
            {hasFiles && (
              <button className="btn-ghost" onClick={clearAll} aria-label="Clear all files">
                Clear
              </button>
            )}
            <button className="btn-primary" onClick={() => inputRef.current?.click()} aria-label="Add files">
              Add files
            </button>
          </div>
        </div>
      </header>

      <input
        ref={inputRef}
        type="file"
        multiple
        onChange={e => { if (e.target.files?.length) addFiles(e.target.files); e.target.value = '' }}
        style={{ display: 'none' }}
        aria-hidden="true"
      />

      {/* Main */}
      <main className="main">
        {!hasFiles ? (
          <div
            className={`dropzone${dragging ? ' dragging' : ''}`}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click() }}
            aria-label="Drop files here or click to browse"
          >
            <div className="dropzone-icon"><IconUpload /></div>
            <p className="dropzone-title">Drop files here</p>
            <p className="dropzone-sub">or click to browse — nothing leaves your device</p>
          </div>
        ) : (
          <div className="layout">
            {/* Options */}
            <div className="options-card">
              <div className="card-section">
                <div className="section-label">
                  <span>Pattern</span>
                  <button className="btn-copy" onClick={resetOptions} aria-label="Reset options">Reset</button>
                </div>
                <input
                  type="text"
                  className="ts-input"
                  value={template}
                  onChange={e => setTemplate(e.target.value)}
                  placeholder="{name}"
                  spellCheck={false}
                  autoComplete="off"
                  aria-label="Naming pattern"
                />
                <div className="token-row">
                  {['{name}', '{n}', '{date}'].map(t => (
                    <button
                      key={t}
                      className="token-chip"
                      onClick={() => setTemplate(prev => prev + t)}
                      aria-label={`Insert ${t}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="card-section">
                <div className="section-label">
                  <span>Find &amp; Replace</span>
                  <label className="mini-toggle">
                    <input
                      type="checkbox"
                      checked={useRegex}
                      onChange={e => setUseRegex(e.target.checked)}
                      aria-label="Use regular expression"
                    />
                    <span>Regex</span>
                  </label>
                </div>
                <div className="fr-grid">
                  <input
                    type="text"
                    className="ts-input sm"
                    value={find}
                    onChange={e => setFind(e.target.value)}
                    placeholder="Find"
                    spellCheck={false}
                    autoComplete="off"
                    aria-label="Find text"
                  />
                  <input
                    type="text"
                    className="ts-input sm"
                    value={replace}
                    onChange={e => setReplace(e.target.value)}
                    placeholder="Replace with"
                    spellCheck={false}
                    autoComplete="off"
                    aria-label="Replace with"
                  />
                </div>
              </div>

              <div className="card-section">
                <div className="section-label"><span>Case</span></div>
                <div className="segmented">
                  {CASE_OPTIONS.map(c => (
                    <button
                      key={c.id}
                      className={`seg-btn${caseMode === c.id ? ' active' : ''}`}
                      onClick={() => setCaseMode(c.id)}
                      aria-pressed={caseMode === c.id}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="card-section">
                <div className="section-label"><span>Numbering <span className="hint">(when {'{n}'} is used)</span></span></div>
                <div className="num-grid">
                  <label className="num-field">
                    <span>Start at</span>
                    <input
                      type="number"
                      className="ts-input sm"
                      value={start}
                      min={0}
                      onChange={e => setStart(parseInt(e.target.value, 10) || 0)}
                      aria-label="Numbering start"
                    />
                  </label>
                  <label className="num-field">
                    <span>Digits</span>
                    <input
                      type="number"
                      className="ts-input sm"
                      value={padding}
                      min={0}
                      max={8}
                      onChange={e => setPadding(parseInt(e.target.value, 10) || 0)}
                      aria-label="Number padding"
                    />
                  </label>
                </div>
              </div>

              <div className="card-section">
                <div className="section-label"><span>Extension</span></div>
                <div className="segmented">
                  {EXT_OPTIONS.map(x => (
                    <button
                      key={x.id}
                      className={`seg-btn${extMode === x.id ? ' active' : ''}`}
                      onClick={() => setExtMode(x.id)}
                      aria-pressed={extMode === x.id}
                    >
                      {x.label}
                    </button>
                  ))}
                </div>
                {extMode === 'set' && (
                  <input
                    type="text"
                    className="ts-input sm ext-input"
                    value={extValue}
                    onChange={e => setExtValue(e.target.value)}
                    placeholder="e.g. webp"
                    spellCheck={false}
                    autoComplete="off"
                    aria-label="New extension"
                  />
                )}
              </div>
            </div>

            {/* Preview */}
            <div className="preview-card">
              <div className="preview-head">
                <div className="section-label" style={{ marginBottom: 0 }}>
                  <span>Preview</span>
                </div>
                <div className="preview-stats">
                  <span className="stat">{files.length} file{files.length !== 1 ? 's' : ''}</span>
                  {changedCount > 0 && <span className="stat accent">{changedCount} changed</span>}
                  {dupCount > 0 && <span className="stat error">{dupCount} conflict{dupCount !== 1 ? 's' : ''}</span>}
                </div>
              </div>

              <div className="preview-list">
                {rows.map(r => (
                  <div key={r.id} className={`file-row${r.duplicate ? ' conflict' : ''}`}>
                    <button
                      className="row-remove"
                      onClick={() => removeFile(r.id)}
                      aria-label={`Remove ${r.name}`}
                      title="Remove"
                    >
                      <IconClose />
                    </button>
                    <div className="row-names">
                      <span className="old-name" title={r.name}>{r.name}</span>
                      <span className="arrow"><IconArrow /></span>
                      <span
                        className={`new-name${r.changed ? ' changed' : ''}${r.duplicate ? ' bad' : ''}`}
                        title={r.newName}
                      >
                        <bdi>{r.newName || '(empty)'}</bdi>
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="preview-footer">
                <button className="add-more" onClick={() => inputRef.current?.click()}>
                  <IconPlus /> Add more
                </button>
                <button
                  className={`btn-download${downloaded ? ' done' : ''}`}
                  onClick={downloadAll}
                  disabled={dupCount > 0}
                  aria-label="Download renamed files"
                >
                  {downloaded ? <><IconCheck /> Downloaded</> : <><IconDownload /> Download renamed</>}
                </button>
              </div>
              {dupCount > 0 && (
                <p className="error-text footer-err">
                  <IconError /> Resolve name conflicts before downloading.
                </p>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="credit">
        Coded by{' '}
        <a href="https://instagram.com/berkindev" target="_blank" rel="noopener noreferrer" className="credit-link">
          berkindev
        </a>
      </footer>
    </div>
  )
}

/* ─── Icons ──────────────────────────────────────── */
function IconTag() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 2.5h5l6 6-5 5-6-6v-5z" />
      <circle cx="5" cy="5" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}
function IconUpload() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 15V4M12 4l-4 4M12 4l4 4" />
      <path d="M4 15v3a2 2 0 002 2h12a2 2 0 002-2v-3" />
    </svg>
  )
}
function IconArrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8h9M9 5l3 3-3 3" />
    </svg>
  )
}
function IconClose() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  )
}
function IconPlus() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M8 3v10M3 8h10" />
    </svg>
  )
}
function IconDownload() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2v8M8 10l-3-3M8 10l3-3" />
      <path d="M3 12v1a1 1 0 001 1h8a1 1 0 001-1v-1" />
    </svg>
  )
}
function IconCheck() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8l3.5 3.5L13 5" />
    </svg>
  )
}
function IconError() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="8" cy="8" r="6" />
      <line x1="8" y1="5" x2="8" y2="8.5" strokeLinecap="round" />
      <circle cx="8" cy="11" r="0.6" fill="currentColor" />
    </svg>
  )
}
