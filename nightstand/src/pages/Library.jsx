import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useLibrary } from '../context/LibraryContext'
import BookCard from '../components/BookCard'
import './Library.css'

const TABS = [
  { value: 'all', label: 'All' },
  { value: 'to-read', label: 'To Read' },
  { value: 'currently-reading', label: 'Reading' },
  { value: 'read', label: 'Read' },
]

export default function Library() {
  const { books } = useLibrary()
  const [tab, setTab] = useState('all')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('added')

  const counts = useMemo(() => ({
    all: books.length,
    'to-read': books.filter(b => b.readStatus === 'to-read').length,
    'currently-reading': books.filter(b => b.readStatus === 'currently-reading').length,
    'read': books.filter(b => b.readStatus === 'read').length,
  }), [books])

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = books.filter(b => {
      if (tab !== 'all' && b.readStatus !== tab) return false
      if (q && !(`${b.title} ${b.authors?.join(' ')}`.toLowerCase().includes(q))) return false
      return true
    })
    list = [...list].sort((a, b) => {
      if (sort === 'title') return a.title.localeCompare(b.title)
      if (sort === 'rating') return (b.starRating || 0) - (a.starRating || 0)
      if (sort === 'author') return (a.authors?.[0] || '').localeCompare(b.authors?.[0] || '')
      return 0 // 'added' keeps import order
    })
    return list
  }, [books, tab, query, sort])

  if (!books.length) {
    return (
      <div className="empty">
        <p style={{ fontSize: 48, marginBottom: 12 }}>&#128218;</p>
        <p className="empty-title">Your shelf is empty</p>
        <p>Import your StoryGraph library to start matching, spinning, and tracking.</p>
        <Link to="/import" className="btn" style={{ marginTop: 18 }}>Import your shelf</Link>
      </div>
    )
  }

  return (
    <div className="library">
      <div className="page-head">
        <h1 className="page-title">Your shelf</h1>
        <p className="page-sub">{counts.all} books · {counts['to-read']} waiting to be read</p>
      </div>

      <div className="library-controls">
        <div className="library-tabs">
          {TABS.map(t => (
            <button
              key={t.value}
              className={`library-tab${tab === t.value ? ' active' : ''}`}
              onClick={() => setTab(t.value)}
            >
              {t.label} <span>{counts[t.value]}</span>
            </button>
          ))}
        </div>
        <div className="library-tools">
          <input
            className="library-search"
            placeholder="Search title or author…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <select className="library-sort" value={sort} onChange={e => setSort(e.target.value)}>
            <option value="added">Recently added</option>
            <option value="title">Title</option>
            <option value="author">Author</option>
            <option value="rating">Rating</option>
          </select>
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="library-none">No books match.</p>
      ) : (
        <div className="book-grid">
          {shown.map(b => <BookCard key={b.id} book={b} />)}
        </div>
      )}
    </div>
  )
}
