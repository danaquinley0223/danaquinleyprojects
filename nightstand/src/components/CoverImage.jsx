import { useState } from 'react'
import './CoverImage.css'

// Deterministic warm gradient from the title, used when no cover is available.
const PALETTES = [
  ['#3b2f4a', '#5b3a5b'], ['#2f3b4a', '#3a4f5b'], ['#4a3b2f', '#5b4a3a'],
  ['#2f4a3f', '#3a5b50'], ['#3f2f4a', '#4f3a5b'], ['#4a2f33', '#5b3a44'],
]
function hash(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0
  return Math.abs(h)
}

export default function CoverImage({ book, className = '' }) {
  const [failed, setFailed] = useState(false)
  const showImg = book.coverUrl && !failed

  if (showImg) {
    return (
      <div className={`cover ${className}`}>
        <img src={book.coverUrl} alt={book.title} loading="lazy" onError={() => setFailed(true)} />
      </div>
    )
  }

  const [a, b] = PALETTES[hash(book.title || '') % PALETTES.length]
  return (
    <div
      className={`cover cover-fallback ${className}`}
      style={{ background: `linear-gradient(150deg, ${a}, ${b})` }}
    >
      <span className="cover-fallback-title">{book.title}</span>
      {book.authors?.[0] && <span className="cover-fallback-author">{book.authors[0]}</span>}
    </div>
  )
}
