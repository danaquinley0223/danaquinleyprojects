const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    // Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS })
    }

    // ── GET /api/votes ─────────────────────────────────────────────────────
    if (url.pathname === '/api/votes' && request.method === 'GET') {
      const [tuesday, drink, kevin, customDrinks] = await Promise.all([
        env.VOTES.get('tuesday_votes'),
        env.VOTES.get('drink_votes'),
        env.VOTES.get('kevin_votes'),
        env.VOTES.get('custom_drinks'),
      ])
      return json({
        tuesday: JSON.parse(tuesday || '{}'),
        drink: JSON.parse(drink || '{}'),
        kevin: JSON.parse(kevin || '{}'),
        customDrinks: JSON.parse(customDrinks || '[]'),
      })
    }

    // ── POST /api/vote ──────────────────────────────────────────────────────
    if (url.pathname === '/api/vote' && request.method === 'POST') {
      const { type, person, choice } = await request.json()
      if (!type || !person) return json({ error: 'missing fields' }, 400)
      const key = type + '_votes'
      const existing = JSON.parse(await env.VOTES.get(key) || '{}')
      if (choice === null) {
        delete existing[person]   // null choice = remove vote
      } else {
        existing[person] = choice
      }
      await env.VOTES.put(key, JSON.stringify(existing))
      return json({ ok: true })
    }

    // ── POST /api/custom-drink ──────────────────────────────────────────────
    if (url.pathname === '/api/custom-drink' && request.method === 'POST') {
      const { name, person } = await request.json()
      if (!name) return json({ error: 'missing name' }, 400)
      const existing = JSON.parse(await env.VOTES.get('custom_drinks') || '[]')
      const id = 'custom-' + Date.now()
      existing.push({ id, icon: '🍸', name, desc: `Nominated by ${person || 'someone'}` })
      await env.VOTES.put('custom_drinks', JSON.stringify(existing))
      return json({ ok: true, id })
    }

    // ── Base Camp shared state (GET) ────────────────────────────────────────
    if (url.pathname === '/api/camp/state' && request.method === 'GET') {
      const stored = await env.VOTES.get('camp:state')
      return json(stored ? JSON.parse(stored) : {})
    }

    // ── Base Camp shared state (POST, last-write-wins with a rev guard) ──────
    if (url.pathname === '/api/camp/state' && request.method === 'POST') {
      const incoming = await request.json()
      const stored = JSON.parse(await env.VOTES.get('camp:state') || 'null')
      if (stored && incoming.rev != null && incoming.rev < (stored.rev || 0)) {
        return json({ conflict: true, state: stored })   // someone saved newer
      }
      const rev = (stored?.rev || 0) + 1
      const doc = { ...incoming, rev, updatedAt: Date.now() }
      await env.VOTES.put('camp:state', JSON.stringify(doc))
      return json({ ok: true, rev })
    }

    // ── SPA fallback for the React apps ─────────────────────────────────────
    const spa = url.pathname.match(/^\/(cocktail-bar|nightstand|base-camp)\//)
    if (spa && !url.pathname.match(/\.[a-zA-Z0-9]+$/)) {
      const rewritten = new URL(request.url)
      rewritten.pathname = `/${spa[1]}/index.html`
      return env.ASSETS.fetch(new Request(rewritten.toString(), request))
    }

    return env.ASSETS.fetch(request)
  },
}
