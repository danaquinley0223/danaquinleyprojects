// Aggregations over the library for the Insights dashboard. All read-only.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// Pull a usable Date from StoryGraph date fields (e.g. "2024/03/15",
// "2024-03-15", or a "start-end" range in Dates Read).
export function readDate(book) {
  const candidates = [book.lastDateRead, book.datesRead?.[book.datesRead.length - 1], book.dateAdded]
  for (const c of candidates) {
    if (!c) continue
    const m = String(c).match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/g)
    if (m) {
      const last = m[m.length - 1].split(/[-/]/).map(Number)
      const d = new Date(last[0], last[1] - 1, last[2])
      if (!isNaN(d)) return d
    }
  }
  return null
}

function topCounts(books, accessor, limit = 8) {
  const counts = new Map()
  for (const b of books) {
    for (const v of accessor(b) || []) {
      const k = String(v).trim()
      if (k) counts.set(k, (counts.get(k) || 0) + 1)
    }
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit)
    .map(([label, value]) => ({ label, value }))
}

export function computeStats(books) {
  const read = books.filter(b => b.readStatus === 'read')
  const reading = books.filter(b => b.readStatus === 'currently-reading')

  const totalPages = read.reduce((s, b) => s + (b.pageCount || 0), 0)
  const rated = read.filter(b => b.starRating != null)
  const avgRating = rated.length
    ? rated.reduce((s, b) => s + b.starRating, 0) / rated.length
    : null

  // per-year counts
  const yearCount = new Map(), yearPages = new Map()
  const monthCount = new Array(12).fill(0)
  const dowCount = new Array(7).fill(0)
  for (const b of read) {
    const d = readDate(b)
    if (!d) continue
    const y = d.getFullYear()
    yearCount.set(y, (yearCount.get(y) || 0) + 1)
    yearPages.set(y, (yearPages.get(y) || 0) + (b.pageCount || 0))
    monthCount[d.getMonth()]++
    dowCount[d.getDay()]++
  }
  const years = [...yearCount.keys()].sort()
  const booksPerYear = years.map(y => ({ label: String(y), value: yearCount.get(y) }))
  const pagesPerYear = years.map(y => ({ label: String(y), value: yearPages.get(y) }))

  // rating distribution (0.5 .. 5)
  const ratingBuckets = []
  for (let r = 0.5; r <= 5; r += 0.5) {
    ratingBuckets.push({ label: String(r), value: rated.filter(b => Math.abs(b.starRating - r) < 0.25).length })
  }

  const byMonth = MONTHS.map((label, i) => ({ label, value: monthCount[i] }))
  const byDow = DOW.map((label, i) => ({ label, value: dowCount[i] }))

  const longest = read.reduce((max, b) => (b.pageCount || 0) > (max?.pageCount || 0) ? b : max, null)

  return {
    counts: {
      read: read.length,
      reading: reading.length,
      toRead: books.filter(b => b.readStatus === 'to-read').length,
      totalPages,
      avgRating,
    },
    booksPerYear,
    pagesPerYear,
    ratingBuckets,
    byMonth,
    byDow,
    topGenres: topCounts(read, b => b.genres),
    topMoods: topCounts(read, b => b.moods),
    topAuthors: topCounts(read, b => b.authors),
    longest,
    reading,
  }
}

// Average pages read per day over the last year — used to predict finish dates.
export function pagesPerDay(books) {
  const now = Date.now()
  const yearAgo = now - 365 * 864e5
  let pages = 0
  for (const b of books) {
    if (b.readStatus !== 'read' || !b.pageCount) continue
    const d = readDate(b)
    if (d && d.getTime() >= yearAgo) pages += b.pageCount
  }
  return pages > 0 ? pages / 365 : 25 // fall back to a gentle 25 pages/day
}

export function predictFinish(book, perDay) {
  if (!book.pageCount || !perDay) return null
  const days = Math.ceil(book.pageCount / perDay)
  const date = new Date(Date.now() + days * 864e5)
  return { days, date }
}
