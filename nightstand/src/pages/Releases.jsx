import { useState, useEffect, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useLibrary } from '../context/LibraryContext'
import { useFollows } from '../context/FollowsContext'
import { searchByAuthor } from '../api/googleBooks'
import './Releases.css'

const normTitle = (t) => String(t).toLowerCase().replace(/[^a-z0-9]+/g, '')
const parseYear = (d) => (d ? parseInt(String(d).slice(0, 4), 10) : null)
const parseDate = (d) => (d ? new Date(d).getTime() || 0 : 0)

// "new" window: published in the last ~2 years, or any future date.
function isNewish(publishedDate) {
  const t = parseDate(publishedDate)
  if (!t) return false
  const twoYears = Date.now() - 2 * 365 * 864e5
  return t >= twoYears
}

export default function Releases() {
  const { books } = useLibrary()
  const { authors: followed, toggleAuthor, upcoming, addUpcoming, removeUpcoming } = useFollows()
  const [groups, setGroups] = useState({ future: [], recent: [] })
  const [loading, setLoading] = useState(false)
  const [authorInput, setAuthorInput] = useState('')
  const [form, setForm] = useState({ title: '', author: '', series: '', date: '' })

  const ownedTitles = useMemo(() => new Set(books.map(b => normTitle(b.title))), [books])

  // Authors you read most, as follow suggestions.
  const suggestions = useMemo(() => {
    const counts = new Map()
    for (const b of books) {
      if (b.readStatus !== 'read') continue
      for (const a of b.authors || []) counts.set(a, (counts.get(a) || 0) + 1)
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1])
      .map(([a]) => a).filter(a => !followed.includes(a)).slice(0, 12)
  }, [books, followed])

  // Series you have at least one book from (for the "next in series" hint).
  const seriesMaxPos = useMemo(() => {
    const map = new Map()
    for (const b of books) {
      if (!b.seriesName) continue
      const pos = b.seriesPosition || 0
      map.set(b.seriesName, Math.max(map.get(b.seriesName) || 0, pos))
    }
    return map
  }, [books])

  const loadReleases = useCallback(async () => {
    if (!followed.length) { setGroups({ future: [], recent: [] }); return }
    setLoading(true)
    const found = []
    for (const author of followed) {
      try {
        const vols = await searchByAuthor(author, 40)
        for (const v of vols) {
          if (!v.title || ownedTitles.has(normTitle(v.title))) continue
          if (!isNewish(v.publishedDate)) continue
          found.push({ ...v, author })
        }
      } catch { /* ignore a failed author lookup */ }
    }
    // de-dupe by normalized title, keep the newest
    const byTitle = new Map()
    for (const r of found) {
      const k = normTitle(r.title)
      if (!byTitle.has(k) || parseDate(r.publishedDate) > parseDate(byTitle.get(k).publishedDate)) {
        byTitle.set(k, r)
      }
    }
    const sorted = [...byTitle.values()].sort((a, b) => parseDate(b.publishedDate) - parseDate(a.publishedDate))
    const now = Date.now()
    setGroups({
      future: sorted.filter(r => parseDate(r.publishedDate) > now),
      recent: sorted.filter(r => parseDate(r.publishedDate) <= now),
    })
    setLoading(false)
  }, [followed, ownedTitles])

  useEffect(() => { loadReleases() }, [loadReleases])

  const { future, recent } = groups
  const releaseCount = future.length + recent.length

  const submitManual = (e) => {
    e.preventDefault()
    if (!form.title.trim()) return
    addUpcoming({ ...form, title: form.title.trim() })
    setForm({ title: '', author: '', series: '', date: '' })
  }

  const seriesHint = (r) => {
    if (r.seriesName && seriesMaxPos.has(r.seriesName) && r.seriesPosition > (seriesMaxPos.get(r.seriesName) || 0)) {
      return `Next in ${r.seriesName}`
    }
    return null
  }

  return (
    <div className="releases">
      <div className="page-head">
        <h1 className="page-title">New &amp; upcoming</h1>
        <p className="page-sub">Follow authors and we'll watch for their latest books.</p>
      </div>

      {/* follow management */}
      <section className="panel rel-follow">
        <span className="filter-label">Following {followed.length} author{followed.length === 1 ? '' : 's'}</span>
        <div className="rel-chips">
          {followed.map(a => (
            <button key={a} className="rel-chip following" onClick={() => toggleAuthor(a)}>{a} ✕</button>
          ))}
          {!followed.length && <span className="rel-muted">No authors followed yet.</span>}
        </div>

        <form className="rel-add-author" onSubmit={e => { e.preventDefault(); if (authorInput.trim()) { toggleAuthor(authorInput.trim()); setAuthorInput('') } }}>
          <input placeholder="Add an author…" value={authorInput} onChange={e => setAuthorInput(e.target.value)} />
          <button className="btn-ghost" type="submit">Follow</button>
        </form>

        {suggestions.length > 0 && (
          <div className="rel-suggest">
            <span className="rel-muted">From your most-read:</span>
            {suggestions.map(a => (
              <button key={a} className="rel-chip" onClick={() => toggleAuthor(a)}>+ {a}</button>
            ))}
          </div>
        )}
      </section>

      {loading && <div className="rel-loading"><div className="spinner" /><p>Checking for new books…</p></div>}

      {!loading && future.length > 0 && (
        <section className="rel-section">
          <h2 className="rel-section-title amber">Coming soon</h2>
          <div className="rel-list">
            {future.map(r => <ReleaseRow key={r.googleId || r.title} r={r} hint={seriesHint(r)} upcoming />)}
          </div>
        </section>
      )}

      {!loading && recent.length > 0 && (
        <section className="rel-section">
          <h2 className="rel-section-title">Recently out — not on your shelf</h2>
          <div className="rel-list">
            {recent.map(r => <ReleaseRow key={r.googleId || r.title} r={r} hint={seriesHint(r)} />)}
          </div>
        </section>
      )}

      {!loading && followed.length > 0 && releaseCount === 0 && (
        <p className="rel-muted" style={{ marginTop: 16 }}>No recent releases found for the authors you follow.</p>
      )}

      {/* manual upcoming */}
      <section className="rel-section">
        <h2 className="rel-section-title">Tracking manually</h2>
        {upcoming.length > 0 && (
          <div className="rel-list">
            {upcoming.map(u => (
              <div className="rel-row" key={u.id}>
                <div>
                  <div className="rel-row-title">{u.title}</div>
                  <div className="rel-row-sub">
                    {[u.author, u.series, u.date].filter(Boolean).join(' · ')}
                  </div>
                </div>
                <button className="rel-x" onClick={() => removeUpcoming(u.id)}>✕</button>
              </div>
            ))}
          </div>
        )}
        <form className="rel-manual" onSubmit={submitManual}>
          <input placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          <input placeholder="Author" value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} />
          <input placeholder="Series (optional)" value={form.series} onChange={e => setForm({ ...form, series: e.target.value })} />
          <input placeholder="Expected date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
          <button className="btn" type="submit">Add</button>
        </form>
      </section>

      {!books.length && (
        <p className="rel-muted" style={{ marginTop: 20 }}>
          <Link to="/import" style={{ color: 'var(--amber)' }}>Import your shelf</Link> to get author suggestions.
        </p>
      )}
    </div>
  )
}

function ReleaseRow({ r, hint, upcoming }) {
  return (
    <div className="rel-row">
      <div>
        <div className="rel-row-title">{r.title}</div>
        <div className="rel-row-sub">{r.author}{r.publishedDate ? ` · ${r.publishedDate}` : ''}</div>
        {hint && <span className="tag amber" style={{ marginTop: 6 }}>{hint}</span>}
      </div>
      {upcoming && <span className="rel-soon">{parseYear(r.publishedDate)}</span>}
    </div>
  )
}
