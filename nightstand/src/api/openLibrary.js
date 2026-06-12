// Open Library — used as a cover fallback (no key, CORS-friendly).
// covers.openlibrary.org returns a transparent 1px if no cover exists unless
// default=false is passed, in which case it 404s — which we treat as "no cover".

export function coverUrlByIsbn(isbn, size = 'L') {
  if (!isbn) return null
  return `https://covers.openlibrary.org/b/isbn/${isbn}-${size}.jpg?default=false`
}

// Resolve whether Open Library actually has a cover for this ISBN.
export async function findCover(isbn) {
  if (!isbn) return null
  const url = coverUrlByIsbn(isbn, 'L')
  try {
    const res = await fetch(url, { method: 'HEAD' })
    return res.ok ? url : null
  } catch {
    return null
  }
}
