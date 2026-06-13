import { roleWeight } from './seed'

export const compWeight = (comp) => (comp.weight != null ? comp.weight : roleWeight(comp.role))

// All assignable components in a trip: every meal's components + the trip extras.
export function tripComponents(trip) {
  const items = []
  for (const meal of trip.meals || []) {
    for (const comp of meal.components || []) items.push({ comp, mealId: meal.id })
  }
  for (const ex of trip.extras || []) items.push({ comp: ex, mealId: null })
  return items
}

// Greedy "longest processing time" balance: assign each unlocked component to the
// attending crew with the lowest running weight, tie-breaking toward a crew not
// already on that meal. Returns a { componentId: crewId } map.
export function divide(trip) {
  const crews = (trip.crews || []).map(c => c.householdId)
  if (!crews.length) return {}

  const load = Object.fromEntries(crews.map(id => [id, 0]))
  const mealCrews = {} // mealId -> Set of crews already on that meal

  const all = tripComponents(trip)

  // pre-load locked assignments so the balancer works around them
  for (const { comp, mealId } of all) {
    if (comp.locked && comp.assignedCrewId && load[comp.assignedCrewId] != null) {
      load[comp.assignedCrewId] += compWeight(comp)
      if (mealId) (mealCrews[mealId] ||= new Set()).add(comp.assignedCrewId)
    }
  }

  const assignment = {}
  const unlocked = all
    .filter(x => !(x.comp.locked && x.comp.assignedCrewId))
    .sort((a, b) => compWeight(b.comp) - compWeight(a.comp))

  for (const { comp, mealId } of unlocked) {
    const used = mealId ? (mealCrews[mealId] || new Set()) : new Set()
    let pool = crews.filter(id => !used.has(id))
    if (!pool.length) pool = crews.slice()
    pool.sort((a, b) => load[a] - load[b])
    const chosen = pool[0]
    assignment[comp.id] = chosen
    load[chosen] += compWeight(comp)
    if (mealId) (mealCrews[mealId] ||= new Set()).add(chosen)
  }
  return assignment
}

// Apply an assignment map to a trip (new trip), leaving locked components alone.
export function applyAssignment(trip, assignment) {
  const set = (comp) =>
    (comp.locked && comp.assignedCrewId) ? comp
      : (comp.id in assignment ? { ...comp, assignedCrewId: assignment[comp.id] } : comp)
  return {
    ...trip,
    meals: (trip.meals || []).map(m => ({ ...m, components: (m.components || []).map(set) })),
    extras: (trip.extras || []).map(set),
  }
}

// Per-crew totals (weight + item count) from the current assignments.
export function crewTotals(trip) {
  const totals = {}
  for (const c of trip.crews || []) totals[c.householdId] = { weight: 0, count: 0 }
  for (const { comp } of tripComponents(trip)) {
    const t = totals[comp.assignedCrewId]
    if (t) { t.weight += compWeight(comp); t.count += 1 }
  }
  return totals
}
