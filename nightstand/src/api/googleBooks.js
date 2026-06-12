// Google Books API — browser-callable, no key required for basic volume search.
const BASE = 'https://www.googleapis.com/books/v1/volumes'

async function get(query) {
  const res = await fetch(`${BASE}?${query}`)
  if (!res.ok) throw new Error(`Google Books ${res.status}`)
  return res.json()
}

function httpsCover(imageLinks) {
  if (!imageLinks) return null
  const url = imageLinks.thumbnail || imageLinks.smallThumbnail
  if (!url) return null
  return url.replace(/^http:/, 'https:').replace(/&edge=curl/, '')
}

// Pull a "Series Name, #2" style hint out of a title/subtitle when present.
function parseSeries(volumeInfo) {
  const text = [volumeInfo.title, volumeInfo.subtitle].filter(Boolean).join(' ')
  const m = text.match(/\(([^,()]+?),?\s*#?(\d+(?:\.\d+)?)\)/) || text.match(/\b(book|vol(?:ume)?)\s*(\d+)\b/i)
  let seriesName = null, seriesPosition = null
  if (m) {
    if (/^\d/.test(m[2] || '')) seriesPosition = parseFloat(m[2])
    if (m[1] && !/^(book|vol)/i.test(m[1])) seriesName = m[1].trim()
  }
  const si = volumeInfo.seriesInfo
  if (si?.bookDisplayNumber) seriesPosition = parseFloat(si.bookDisplayNumber) || seriesPosition
  return { seriesName, seriesPosition }
}

export function volumeToData(volume) {
  const v = volume.volumeInfo || {}
  const { seriesName, seriesPosition } = parseSeries(v)
  return {
    googleId: volume.id,
    title: v.title,
    authors: v.authors || [],
    pageCount: v.pageCount || null,
    genres: v.categories || [],
    coverUrl: httpsCover(v.imageLinks),
    publishedDate: v.publishedDate || null,
    seriesName,
    seriesPosition,
  }
}

export async function searchByIsbn(isbn) {
  const data = await get(`q=isbn:${encodeURIComponent(isbn)}`)
  return data.items?.[0] ? volumeToData(data.items[0]) : null
}

export async function searchByTitleAuthor(title, author) {
  let q = `intitle:${encodeURIComponent(title)}`
  if (author) q += `+inauthor:${encodeURIComponent(author)}`
  const data = await get(`q=${q}&maxResults=3`)
  return data.items?.[0] ? volumeToData(data.items[0]) : null
}

// Newest-first list of an author's volumes — used by the release tracker.
export async function searchByAuthor(author, max = 40) {
  const data = await get(`q=inauthor:${encodeURIComponent(`"${author}"`)}&orderBy=newest&maxResults=${max}`)
  return (data.items || []).map(volumeToData)
}
