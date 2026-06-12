// Open Library — primary enrichment source. The Search API returns a work's
// median page count, subjects (→ genres), cover and first-publish year, and is
// reliable for both ISBN and title/author lookups (unlike the rate-limited
// Google Books API).
const SEARCH = 'https://openlibrary.org/search.json'

// Drop subject strings that aren't really genres.
const JUNK = /(bestseller|large type|reading level|accessible book|protected daisy|in library|overdrive|new york times|award|nyt|fiction, )/i
function cleanSubjects(subjects) {
  return (subjects || [])
    .filter(Boolean)
    .filter(s => !JUNK.test(s) && s.length < 30)
    .slice(0, 8)
}

// Deterministic cover URL by ISBN — renders if a cover exists, otherwise the
// <img> fails and the UI falls back to a generated cover.
export function coverUrlByIsbn(isbn, size = 'M') {
  if (!isbn) return null
  return `https://covers.openlibrary.org/b/isbn/${isbn}-${size}.jpg?default=false`
}

const enc = (s) => encodeURIComponent(s || '')

// Look up a single book → { pageCount, genres, coverUrl, publishedDate } or null.
export async function searchBook(book) {
  const q = book.isbn
    ? `isbn=${book.isbn}`
    : `title=${enc(book.title)}&author=${enc(book.authors?.[0])}`
  try {
    const res = await fetch(`${SEARCH}?${q}&fields=title,number_of_pages_median,subject,cover_i,first_publish_year&limit=1`)
    if (!res.ok) return null
    const d = (await res.json()).docs?.[0]
    if (!d) return null
    return {
      pageCount: d.number_of_pages_median || null,
      genres: cleanSubjects(d.subject),
      coverUrl: d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg` : null,
      publishedDate: d.first_publish_year ? String(d.first_publish_year) : null,
    }
  } catch {
    return null
  }
}
