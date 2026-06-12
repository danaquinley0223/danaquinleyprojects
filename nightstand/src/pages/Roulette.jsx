import { useState, useMemo, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLibrary } from '../context/LibraryContext'
import { useSettings } from '../context/SettingsContext'
import FilterControls from '../components/FilterControls'
import CoverImage from '../components/CoverImage'
import { EMPTY_FILTERS, filtersActive, matchBooks, tbrFacets } from '../utils/matchBooks'
import './Roulette.css'

export default function Roulette() {
  const { books, setStatus } = useLibrary()
  const { settings } = useSettings()
  const navigate = useNavigate()
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [showFilters, setShowFilters] = useState(false)
  const [current, setCurrent] = useState(null)
  const [spinning, setSpinning] = useState(false)
  const timer = useRef(null)

  const facets = useMemo(() => tbrFacets(books), [books])
  const pool = useMemo(() => {
    if (filtersActive(filters)) return matchBooks(books, filters, settings).map(r => r.book)
    return books.filter(b => b.readStatus === 'to-read')
  }, [books, filters, settings])

  useEffect(() => () => clearInterval(timer.current), [])

  const spin = () => {
    if (!pool.length || spinning) return
    setSpinning(true)
    let ticks = 0
    clearInterval(timer.current)
    timer.current = setInterval(() => {
      setCurrent(pool[Math.floor(Math.random() * pool.length)])
      if (++ticks >= 15) {
        clearInterval(timer.current)
        setCurrent(pool[Math.floor(Math.random() * pool.length)])
        setSpinning(false)
      }
    }, 85)
  }

  const tbrCount = books.filter(b => b.readStatus === 'to-read').length
  if (!tbrCount) {
    return (
      <div className="empty">
        <p className="empty-title">Nothing to spin yet</p>
        <p>Import your shelf and the roulette will pick from your to-read pile.</p>
        <Link to="/import" className="btn" style={{ marginTop: 18 }}>Import your shelf</Link>
      </div>
    )
  }

  return (
    <div className="roulette">
      <div className="page-head">
        <h1 className="page-title">Shelf roulette</h1>
        <p className="page-sub">Can't decide? Let fate pick from {pool.length} book{pool.length === 1 ? '' : 's'}.</p>
      </div>

      <div className="roulette-stage">
        {current ? (
          <div className={`roulette-pick${spinning ? ' spinning' : ''}`}>
            <div className="roulette-cover"><CoverImage book={current} /></div>
            {!spinning && (
              <div className="roulette-pick-info">
                <h2>{current.title}</h2>
                <p>{current.authors?.join(', ')}</p>
                <div className="roulette-actions">
                  <button className="btn" onClick={() => { setStatus(current.id, 'currently-reading'); navigate(`/book/${encodeURIComponent(current.id)}`) }}>
                    Start reading
                  </button>
                  <button className="btn-ghost" onClick={spin}>Reroll</button>
                  <Link className="btn-ghost" to={`/book/${encodeURIComponent(current.id)}`}>Details</Link>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="roulette-placeholder">
            <span>&#127922;</span>
            <p>Press spin to get a pick</p>
          </div>
        )}
      </div>

      <div className="roulette-controls">
        <button className="btn roulette-spin" onClick={spin} disabled={spinning || !pool.length}>
          {spinning ? 'Spinning…' : current ? 'Spin again' : 'Spin'}
        </button>
        <button className="btn-ghost" onClick={() => setShowFilters(s => !s)}>
          {showFilters ? 'Hide filters' : 'Narrow it down'}
        </button>
      </div>

      {showFilters && (
        <div className="roulette-filters">
          <FilterControls facets={facets} filters={filters} setFilters={setFilters} />
          {filtersActive(filters) && (
            <button className="btn-ghost" style={{ marginTop: 12 }} onClick={() => setFilters(EMPTY_FILTERS)}>
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  )
}
