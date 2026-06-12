import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useLibrary } from '../context/LibraryContext'
import { useSettings } from '../context/SettingsContext'
import FilterControls from '../components/FilterControls'
import BookCard from '../components/BookCard'
import { EMPTY_FILTERS, filtersActive, matchBooks, tbrFacets } from '../utils/matchBooks'
import './Matcher.css'

export default function Matcher() {
  const { books } = useLibrary()
  const { settings } = useSettings()
  const [filters, setFilters] = useState(EMPTY_FILTERS)

  const facets = useMemo(() => tbrFacets(books), [books])
  const results = useMemo(() => matchBooks(books, filters, settings), [books, filters, settings])

  const tbrCount = books.filter(b => b.readStatus === 'to-read').length
  const active = filtersActive(filters)
  const perfect = results.filter(r => r.perfect)
  const close = results.filter(r => !r.perfect && r.close)
  const rest = results.filter(r => !r.perfect && !r.close)

  if (!tbrCount) {
    return (
      <div className="empty">
        <p className="empty-title">No "to read" books yet</p>
        <p>Import your StoryGraph shelf — the matcher works on your to-read pile.</p>
        <Link to="/import" className="btn" style={{ marginTop: 18 }}>Import your shelf</Link>
      </div>
    )
  }

  return (
    <div className="matcher">
      <div className="page-head">
        <h1 className="page-title">What should I read?</h1>
        <p className="page-sub">Tell me the vibe and how much time you've got — I'll pick from your {tbrCount}-book TBR.</p>
      </div>

      <FilterControls facets={facets} filters={filters} setFilters={setFilters} />

      {active && (
        <button className="btn-ghost matcher-clear" onClick={() => setFilters(EMPTY_FILTERS)}>
          Clear filters
        </button>
      )}

      {!active ? (
        <p className="matcher-hint">Pick a mood, pace, or time above to find your match.</p>
      ) : results.length === 0 ? (
        <p className="matcher-hint">Nothing on your TBR fits all that. Try loosening a filter.</p>
      ) : (
        <>
          {perfect.length > 0 && (
            <section className="matcher-section">
              <h2 className="matcher-section-title amber">Perfect matches <span>{perfect.length}</span></h2>
              <div className="book-grid">
                {perfect.map(r => <BookCard key={r.book.id} book={r.book} badge={{ text: 'Perfect', tone: 'perfect' }} />)}
              </div>
            </section>
          )}
          {close.length > 0 && (
            <section className="matcher-section">
              <h2 className="matcher-section-title violet">Close — missing one thing <span>{close.length}</span></h2>
              <div className="book-grid">
                {close.map(r => (
                  <BookCard key={r.book.id} book={r.book} badge={{ text: `No ${r.missing[0]}`, tone: 'close' }} />
                ))}
              </div>
            </section>
          )}
          {rest.length > 0 && (
            <section className="matcher-section">
              <h2 className="matcher-section-title">Other partial matches <span>{rest.length}</span></h2>
              <div className="book-grid">
                {rest.map(r => <BookCard key={r.book.id} book={r.book} />)}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
