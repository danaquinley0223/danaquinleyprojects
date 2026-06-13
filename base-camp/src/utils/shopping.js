import { ROLES } from './seed'

export function servingsOf(trip) {
  return (trip.crews || []).reduce((s, c) => s + (c.adults || 0) + (c.kids || 0), 0)
}

export function dayLabel(startDate, i) {
  if (!startDate) return `Day ${i + 1}`
  const d = new Date(startDate + 'T00:00:00')
  d.setDate(d.getDate() + i)
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

// Best-effort scale of a free-text quantity by head count. Scales a leading
// number (or "7-8" range); leaves anything it can't parse untouched.
export function scaleQty(qty, baseServes, servings) {
  if (!qty || !baseServes || !servings || baseServes === servings) return qty || ''
  const m = String(qty).match(/^(~?)\s*([\d.]+(?:\s*-\s*[\d.]+)?)\s*(.*)$/)
  if (!m) return qty
  const factor = servings / baseServes
  const scaleOne = (n) => {
    const v = parseFloat(n) * factor
    return Number.isInteger(v) ? String(v) : v.toFixed(1)
  }
  const num = m[2].includes('-')
    ? m[2].split('-').map(s => scaleOne(s.trim())).join('–')
    : scaleOne(m[2])
  return `${m[1]}${num} ${m[3]}`.trim()
}

const crewName = (households, id) => households.find(h => h.id === id)?.name || 'Unassigned'

// One block per crew: their assigned items grouped by meal (day · slot · dish).
export function perCrewLists(trip, households) {
  const servings = servingsOf(trip)
  const dayIndex = Object.fromEntries((trip.days || []).map((d, i) => [d.id, i]))

  return (trip.crews || []).map(crew => {
    const groups = []
    const pushItem = (title, comp) => {
      let g = groups.find(x => x.title === title)
      if (!g) { g = { title, items: [] }; groups.push(g) }
      g.items.push({ id: comp.id, name: comp.name, role: comp.role, qty: scaleQty(comp.qty, comp.baseServes, servings) })
    }
    for (const meal of trip.meals || []) {
      const i = dayIndex[meal.day] ?? 0
      const title = `${dayLabel(trip.startDate, i)} · ${meal.slot} — ${meal.name}`
      for (const comp of meal.components || []) {
        if (comp.assignedCrewId === crew.householdId) pushItem(title, comp)
      }
    }
    for (const ex of trip.extras || []) {
      if (ex.assignedCrewId === crew.householdId) pushItem('Every-day extras', ex)
    }
    return { crewId: crew.householdId, crewName: crewName(households, crew.householdId), groups }
  })
}

// Master list grouped by role; each item tagged with the crew bringing it.
export function masterList(trip, households) {
  const servings = servingsOf(trip)
  const byRole = Object.fromEntries(ROLES.map(r => [r, []]))
  const add = (comp) => {
    (byRole[comp.role] || (byRole[comp.role] = [])).push({
      id: comp.id, name: comp.name,
      qty: scaleQty(comp.qty, comp.baseServes, servings),
      crew: comp.assignedCrewId ? crewName(households, comp.assignedCrewId) : null,
    })
  }
  for (const meal of trip.meals || []) for (const c of meal.components || []) add(c)
  for (const ex of trip.extras || []) add(ex)
  return ROLES.map(r => ({ role: r, items: byRole[r] || [] })).filter(g => g.items.length)
}
