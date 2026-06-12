import { pagesToMinutes } from './readingTime'

export const EMPTY_FILTERS = {
  moods: [],
  pace: '',
  genres: [],
  format: '',
  maxHours: null,
  ownedOnly: false,
}

export function filtersActive(f) {
  return f.moods.length || f.pace || f.genres.length || f.format || f.maxHours || f.ownedOnly
}

const overlaps = (a, b) => a.some(x => b.includes(x))
const lc = (arr) => (arr || []).map(s => String(s).toLowerCase())

// Score one book against the active filters. Each filter category is one
// criterion; `total` is how many are active, `score` how many the book meets.
function scoreBook(book, f, settings) {
  const criteria = []

  if (f.moods.length) {
    criteria.push({ label: 'mood', ok: overlaps(lc(book.moods), lc(f.moods)) })
  }
  if (f.pace) {
    criteria.push({ label: 'pace', ok: String(book.pace).toLowerCase() === f.pace })
  }
  if (f.genres.length) {
    const bookGenres = lc(book.genres).join(' | ')
    criteria.push({ label: 'genre', ok: lc(f.genres).some(g => bookGenres.includes(g)) })
  }
  if (f.format) {
    criteria.push({ label: 'format', ok: book.format === f.format })
  }
  if (f.maxHours) {
    const mins = pagesToMinutes(book.pageCount, settings)
    criteria.push({ label: 'time', ok: mins != null && mins <= f.maxHours * 60 })
  }
  if (f.ownedOnly) {
    criteria.push({ label: 'owned', ok: !!book.owned })
  }

  const score = criteria.filter(c => c.ok).length
  return { score, total: criteria.length, missing: criteria.filter(c => !c.ok).map(c => c.label) }
}

// Returns to-read books ranked by how well they match, each tagged perfect/close.
export function matchBooks(books, filters, settings) {
  const tbr = books.filter(b => b.readStatus === 'to-read')
  if (!filtersActive(filters)) {
    return tbr.map(book => ({ book, score: 0, total: 0, perfect: false, missing: [] }))
  }
  return tbr
    .map(book => {
      const { score, total, missing } = scoreBook(book, filters, settings)
      return { book, score, total, missing, perfect: score === total, close: total - score === 1 }
    })
    .filter(r => r.score > 0 || r.perfect)
    .sort((a, b) => (b.score - a.score) || (b.total - a.total))
}

// Distinct values across the to-read shelf, for populating filter controls.
export function tbrFacets(books) {
  const tbr = books.filter(b => b.readStatus === 'to-read')
  const moods = new Set(), genres = new Set(), formats = new Set()
  for (const b of tbr) {
    b.moods?.forEach(m => moods.add(m.toLowerCase()))
    b.genres?.forEach(g => genres.add(g))
    if (b.format) formats.add(b.format)
  }
  return {
    moods: [...moods].sort(),
    genres: [...genres].sort(),
    formats: [...formats].sort(),
  }
}
