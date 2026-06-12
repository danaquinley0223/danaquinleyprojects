import { useState, useRef, useCallback } from 'react'
import { useLibrary } from '../context/LibraryContext'
import { parseStoryGraphCsv } from '../utils/storygraphImport'
import { enrichLibrary } from '../utils/enrich'
import './Import.css'

export default function Import() {
  const { books, importBooks, updateBook, clearAll } = useLibrary()
  const [dragging, setDragging] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState(null) // { done, total }
  const fileInput = useRef(null)

  const runEnrichment = useCallback(async (list) => {
    setProgress({ done: 0, total: list.filter(b => !b.enriched).length })
    await enrichLibrary(list, updateBook, (done, total) => setProgress({ done, total }))
    setProgress(null)
  }, [updateBook])

  const handleFile = useCallback(async (file) => {
    setError('')
    setResult(null)
    if (!file || !/\.csv$/i.test(file.name)) {
      setError('Please choose a .csv file exported from The StoryGraph.')
      return
    }
    try {
      const parsed = await parseStoryGraphCsv(file)
      if (!parsed.length) {
        setError('No books found in that file — is it the StoryGraph library export?')
        return
      }
      const { added, updated } = importBooks(parsed)
      setResult({ added, updated, total: parsed.length })
      // enrich anything not yet enriched (covers, page counts, genres, series)
      const merged = JSON.parse(localStorage.getItem('ns-books') || '[]')
      runEnrichment(merged)
    } catch (e) {
      setError(`Could not read that file: ${e.message}`)
    }
  }, [importBooks, runEnrichment])

  const onDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files?.[0])
  }, [handleFile])

  const unenriched = books.filter(b => !b.enriched).length

  return (
    <div className="import">
      <div className="page-head">
        <h1 className="page-title">Import your shelf</h1>
        <p className="page-sub">Bring in your books from The StoryGraph to power everything else.</p>
      </div>

      <div
        className={`dropzone${dragging ? ' dragging' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => fileInput.current?.click()}
      >
        <span className="dropzone-icon">&#128214;</span>
        <p className="dropzone-title">Drop your StoryGraph CSV here</p>
        <p className="dropzone-sub">or click to choose a file</p>
        <input
          ref={fileInput}
          type="file"
          accept=".csv"
          hidden
          onChange={e => handleFile(e.target.files?.[0])}
        />
      </div>

      {error && <p className="import-error">{error}</p>}

      {result && (
        <div className="import-result">
          <strong>{result.added}</strong> added · <strong>{result.updated}</strong> updated
          {' '}· {result.total} rows read
        </div>
      )}

      {progress && (
        <div className="import-progress">
          <div className="import-progress-bar">
            <div style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 100}%` }} />
          </div>
          <span>Fetching covers &amp; details… {progress.done}/{progress.total}</span>
        </div>
      )}

      <details className="import-help">
        <summary>How to export from The StoryGraph</summary>
        <ol>
          <li>Open The StoryGraph on the web and go to <em>Manage Account</em>.</li>
          <li>Scroll to <em>Manage Your Data → Export StoryGraph Library</em> and request the export.</li>
          <li>Download the emailed <code>.csv</code> and drop it above. Re-importing later just updates your shelf.</li>
        </ol>
      </details>

      {books.length > 0 && (
        <div className="import-status panel">
          <div>
            <strong>{books.length}</strong> books in your library
            {unenriched > 0 && <span className="import-status-sub"> · {unenriched} not yet enriched</span>}
          </div>
          <div className="import-status-actions">
            {unenriched > 0 && !progress && (
              <button className="btn-ghost" onClick={() => runEnrichment(books)}>Enrich {unenriched}</button>
            )}
            <button
              className="btn-ghost danger"
              onClick={() => { if (confirm('Remove all imported books?')) clearAll() }}
            >
              Clear library
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
