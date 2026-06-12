import { Link } from 'react-router-dom'
import CoverImage from './CoverImage'
import './BookCard.css'

const STATUS_LABEL = {
  'to-read': 'TBR',
  'currently-reading': 'Reading',
  'read': 'Read',
  'did-not-finish': 'DNF',
}

export default function BookCard({ book, badge }) {
  return (
    <Link to={`/book/${encodeURIComponent(book.id)}`} className="book-card">
      <div className="book-card-cover">
        <CoverImage book={book} />
        {badge ? (
          <span className={`book-card-badge ${badge.tone || ''}`}>{badge.text}</span>
        ) : book.readStatus && book.readStatus !== 'read' ? (
          <span className={`book-card-badge ${book.readStatus}`}>{STATUS_LABEL[book.readStatus]}</span>
        ) : null}
      </div>
      <div className="book-card-body">
        <h3 className="book-card-title">{book.title}</h3>
        <p className="book-card-author">{book.authors?.join(', ')}</p>
        {book.starRating != null && (
          <p className="book-card-rating">{'★'.repeat(Math.round(book.starRating))}<span>{book.starRating}</span></p>
        )}
      </div>
    </Link>
  )
}
