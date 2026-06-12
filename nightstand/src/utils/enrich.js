import { searchByIsbn, searchByTitleAuthor } from '../api/googleBooks'
import { searchBook, coverUrlByIsbn } from '../api/openLibrary'

// Persistent cache so we never re-fetch the same book across sessions.
const CACHE_KEY = 'ns-enrich-cache'
function loadCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}') }
  catch { return {} }
}
function saveCache(c) { localStorage.setItem(CACHE_KEY, JSON.stringify(c)) }

const cacheKey = (book) => book.isbn || `${book.title}|${book.authors[0] || ''}`.toLowerCase()
const sleep = (ms) => new Promise(r => setTimeout(r, ms))

// Enrich one book: Open Library first (reliable page count / genres / cover /
// year), then Google Books only to fill gaps and add series info. Google is
// wrapped in try/catch so its rate limiting can never break the import.
async function fetchEnrichment(book) {
  const ol = await searchBook(book)

  let g = null
  if (!ol || !ol.pageCount || !ol.genres.length || !ol.publishedDate) {
    try {
      if (book.isbn) g = await searchByIsbn(book.isbn)
      if (!g) g = await searchByTitleAuthor(book.title, book.authors[0])
    } catch { g = null }
  }

  return {
    pageCount: ol?.pageCount || g?.pageCount || null,
    genres: ol?.genres?.length ? ol.genres : (g?.genres || []),
    coverUrl: ol?.coverUrl || g?.coverUrl || (book.isbn ? coverUrlByIsbn(book.isbn, 'M') : null),
    seriesName: g?.seriesName ?? null,
    seriesPosition: g?.seriesPosition ?? null,
    publishedDate: ol?.publishedDate || g?.publishedDate || null,
    googleId: g?.googleId ?? null,
    enriched: true,
  }
}

// Enrich every not-yet-enriched book, one at a time (polite to the APIs),
// caching each result and reporting progress via onProgress(done, total).
export async function enrichLibrary(books, applyPatch, onProgress) {
  const cache = loadCache()
  const pending = books.filter(b => !b.enriched)
  const total = pending.length
  let done = 0

  for (const book of pending) {
    const key = cacheKey(book)
    let patch = cache[key]
    if (!patch) {
      patch = await fetchEnrichment(book)
      cache[key] = patch
      saveCache(cache)
    }
    applyPatch(book.id, patch)
    onProgress?.(++done, total)
    await sleep(140)
  }
  return total
}
