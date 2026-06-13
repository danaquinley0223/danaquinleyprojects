// Talks to the Cloudflare Worker (/api/camp/state). All calls fail soft: if the
// worker is unreachable (e.g. plain `vite dev`, or offline), they return null and
// the app keeps running on localStorage only.
const BASE = '/api/camp'

async function req(path, opts) {
  try {
    const res = await fetch(BASE + path, opts)
    if (!res.ok) return { error: res.status, ...(await res.json().catch(() => ({}))) }
    return await res.json()
  } catch {
    return null // network/worker unavailable
  }
}

export function getState() {
  return req('/state')
}

export function saveState(doc) {
  return req('/state', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(doc),
  })
}
