import Papa from 'papaparse'

// Normalize a header so we can match StoryGraph columns regardless of exact
// casing / trailing punctuation ("Star Rating", "Owned?", "ISBN/UID", ...).
function normKey(k) {
  return String(k).toLowerCase().replace(/[?]/g, '').trim()
}

function pick(row, ...candidates) {
  for (const c of candidates) {
    const key = normKey(c)
    if (key in row && row[key] != null && row[key] !== '') return row[key]
  }
  return ''
}

function splitList(v) {
  if (!v) return []
  return String(v).split(',').map(s => s.trim()).filter(Boolean)
}

function normFormat(v) {
  const f = String(v).toLowerCase()
  if (f.includes('audio')) return 'audio'
  if (f.includes('e-book') || f.includes('ebook') || f.includes('e book') || f.includes('digital')) return 'ebook'
  if (f.includes('physical') || f.includes('paperback') || f.includes('hardcover') || f.includes('print')) return 'physical'
  return f || ''
}

function normStatus(v) {
  const s = String(v).toLowerCase().trim().replace(/\s+/g, '-')
  if (s.startsWith('to-read') || s === 'to read') return 'to-read'
  if (s.startsWith('currently')) return 'currently-reading'
  if (s.startsWith('did-not') || s === 'dnf') return 'did-not-finish'
  if (s.startsWith('read')) return 'read'
  return s || 'to-read'
}

function cleanIsbn(v) {
  const s = String(v).replace(/[^0-9Xx]/g, '')
  return (s.length === 10 || s.length === 13) ? s : ''
}

function slug(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

function normalizeRow(rawRow) {
  // re-key the row by normalized header
  const row = {}
  for (const k of Object.keys(rawRow)) row[normKey(k)] = rawRow[k]

  const title = String(pick(row, 'title')).trim()
  if (!title) return null

  const authors = splitList(pick(row, 'authors', 'author'))
  const isbn = cleanIsbn(pick(row, 'isbn/uid', 'isbn', 'isbn13', 'isbn/uid '))
  const id = isbn || slug(`${title}-${authors[0] || ''}`)
  const ratingRaw = pick(row, 'star rating', 'rating')
  const starRating = ratingRaw ? parseFloat(ratingRaw) : null

  return {
    id,
    title,
    authors,
    isbn,
    format: normFormat(pick(row, 'format')),
    readStatus: normStatus(pick(row, 'read status', 'status')),
    dateAdded: pick(row, 'date added'),
    lastDateRead: pick(row, 'last date read'),
    datesRead: splitList(pick(row, 'dates read')),
    readCount: parseInt(pick(row, 'read count'), 10) || 0,
    moods: splitList(pick(row, 'moods', 'mood')).map(m => m.toLowerCase()),
    pace: String(pick(row, 'pace')).toLowerCase().trim() || '',
    starRating: Number.isFinite(starRating) ? starRating : null,
    contentWarnings: splitList(pick(row, 'content warnings')),
    tags: splitList(pick(row, 'tags')),
    owned: /^y/i.test(String(pick(row, 'owned'))),
    review: String(pick(row, 'review') || '').trim(),
    // enrichment placeholders (filled later from Google Books / Open Library)
    pageCount: null,
    genres: [],
    coverUrl: null,
    seriesName: null,
    seriesPosition: null,
    publishedDate: null,
    googleId: null,
    enriched: false,
  }
}

// Parse a StoryGraph CSV File → array of normalized book objects.
export function parseStoryGraphCsv(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const books = results.data.map(normalizeRow).filter(Boolean)
        // de-dupe within the file itself (keep the last occurrence)
        const byId = new Map(books.map(b => [b.id, b]))
        resolve([...byId.values()])
      },
      error: reject,
    })
  })
}
