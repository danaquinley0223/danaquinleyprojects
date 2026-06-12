import { useParams, useNavigate } from 'react-router-dom'
import { useLibrary } from '../context/LibraryContext'
import { useSettings } from '../context/SettingsContext'
import { useFollows } from '../context/FollowsContext'
import CoverImage from '../components/CoverImage'
import { pagesToMinutes, formatDuration } from '../utils/readingTime'
import './BookDetail.css'

const STATUSES = [
  { value: 'to-read', label: 'To read' },
  { value: 'currently-reading', label: 'Reading' },
  { value: 'read', label: 'Read' },
]

export default function BookDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getById, setStatus, removeBook } = useLibrary()
  const { settings } = useSettings()
  const { authors: followed, toggleAuthor } = useFollows()

  const book = getById(decodeURIComponent(id))
  if (!book) {
    return (
      <div className="empty">
        <p className="empty-title">Book not found</p>
        <button className="btn-ghost" onClick={() => navigate('/')}>Back to shelf</button>
      </div>
    )
  }

  const mins = pagesToMinutes(book.pageCount, settings)

  return (
    <div className="detail">
      <button className="detail-back" onClick={() => navigate(-1)}>&#8592; Back</button>

      <div className="detail-top">
        <div className="detail-cover"><CoverImage book={book} /></div>

        <div className="detail-info">
          <h1 className="detail-title">{book.title}</h1>
          <p className="detail-authors">{book.authors?.join(', ')}</p>

          {book.seriesName && (
            <p className="detail-series">
              {book.seriesName}{book.seriesPosition ? ` · #${book.seriesPosition}` : ''}
            </p>
          )}

          <div className="detail-meta">
            {book.starRating != null && <span className="tag amber">★ {book.starRating}</span>}
            {book.pace && <span className="tag teal">{book.pace} pace</span>}
            {book.pageCount && <span className="tag">{book.pageCount} pp</span>}
            {mins != null && <span className="tag">{formatDuration(mins)}</span>}
            {book.format && <span className="tag">{book.format}</span>}
            {book.publishedDate && <span className="tag">{String(book.publishedDate).slice(0, 4)}</span>}
          </div>

          <div className="detail-status">
            <span className="detail-status-label">Status</span>
            <div className="detail-status-btns">
              {STATUSES.map(s => (
                <button
                  key={s.value}
                  className={`detail-status-btn${book.readStatus === s.value ? ' active' : ''}`}
                  onClick={() => setStatus(book.id, s.value)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {book.authors?.[0] && (
            <button
              className={`btn-ghost detail-follow${followed.includes(book.authors[0]) ? ' following' : ''}`}
              onClick={() => toggleAuthor(book.authors[0])}
            >
              {followed.includes(book.authors[0]) ? '✓ Following author' : '+ Follow author for releases'}
            </button>
          )}
        </div>
      </div>

      {book.moods?.length > 0 && (
        <section className="detail-section">
          <h2>Moods</h2>
          <div className="detail-chips">{book.moods.map(m => <span key={m} className="tag violet">{m}</span>)}</div>
        </section>
      )}

      {book.genres?.length > 0 && (
        <section className="detail-section">
          <h2>Genres</h2>
          <div className="detail-chips">{book.genres.map(g => <span key={g} className="tag">{g}</span>)}</div>
        </section>
      )}

      {book.tags?.length > 0 && (
        <section className="detail-section">
          <h2>Tags</h2>
          <div className="detail-chips">{book.tags.map(t => <span key={t} className="tag">{t}</span>)}</div>
        </section>
      )}

      {book.review && (
        <section className="detail-section">
          <h2>Your review</h2>
          <p className="detail-review">{book.review}</p>
        </section>
      )}

      {book.contentWarnings?.length > 0 && (
        <section className="detail-section">
          <h2>Content warnings</h2>
          <div className="detail-chips">{book.contentWarnings.map(c => <span key={c} className="tag rose">{c}</span>)}</div>
        </section>
      )}

      <button
        className="btn-ghost danger detail-remove"
        onClick={() => { if (confirm(`Remove "${book.title}"?`)) { removeBook(book.id); navigate('/') } }}
      >
        Remove from library
      </button>
    </div>
  )
}
