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
      const [tuesday, drink, customDrinks] = await Promise.all([
        env.VOTES.get('tuesday_votes'),
        env.VOTES.get('drink_votes'),
        env.VOTES.get('custom_drinks'),
      ])
      return json({
        tuesday: JSON.parse(tuesday || '{}'),
        drink: JSON.parse(drink || '{}'),
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

    // ── SPA fallback for cocktail-bar ───────────────────────────────────────
    if (url.pathname.startsWith('/cocktail-bar/') && !url.pathname.match(/\.[a-zA-Z0-9]+$/)) {
      const rewritten = new URL(request.url)
      rewritten.pathname = '/cocktail-bar/index.html'
      return env.ASSETS.fetch(new Request(rewritten.toString(), request))
    }

    return env.ASSETS.fetch(request)
  },
}
