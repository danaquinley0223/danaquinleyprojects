import { searchByIsbn, searchByTitleAuthor } from '../api/googleBooks'
import { coverUrlByIsbn } from '../api/openLibrary'

// Persistent cache so we never re-fetch the same book across sessions.
const CACHE_KEY = 'ns-enrich-cache'
function loadCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}') }
  catch { return {} }
}
function saveCache(c) { localStorage.setItem(CACHE_KEY, JSON.stringify(c)) }

const cacheKey = (book) => book.isbn || `${book.title}|${book.authors[0] || ''}`.toLowerCase()

// Fetch enrichment for a single book (Google Books, then Open Library cover
// fallback). Returns a patch to merge into the book, or null on failure.
export async function fetchEnrichment(book) {
  const cache = loadCache()
  const key = cacheKey(book)
  if (cache[key]) return cache[key]

  let data = null
  try {
    if (book.isbn) data = await searchByIsbn(book.isbn)
    if (!data) data = await searchByTitleAuthor(book.title, book.authors[0])
  } catch {
    data = null
  }

  const patch = {
    pageCount: data?.pageCount ?? null,
    genres: data?.genres ?? [],
    coverUrl: data?.coverUrl || (book.isbn ? coverUrlByIsbn(book.isbn, 'M') : null),
    seriesName: data?.seriesName ?? null,
    seriesPosition: data?.seriesPosition ?? null,
    publishedDate: data?.publishedDate ?? null,
    googleId: data?.googleId ?? null,
    enriched: true,
  }

  cache[key] = patch
  saveCache(cache)
  return patch
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

// Enrich a list of books one at a time (polite to the API), calling onProgress
// after each so the UI can update incrementally. Returns when all are done.
export async function enrichLibrary(books, applyPatch, onProgress) {
  const pending = books.filter(b => !b.enriched)
  let done = 0
  for (const book of pending) {
    const patch = await fetchEnrichment(book)
    if (patch) applyPatch(book.id, patch)
    done++
    onProgress?.(done, pending.length)
    await sleep(120)
  }
  return pending.length
}
