import { useOutletContext, Link } from 'react-router-dom'
import { useCamp } from '../context/CampDataContext'
import { uid, roleWeight } from '../utils/seed'
import { divide, applyAssignment } from '../utils/divider'
import CrewTally from '../components/CrewTally'
import ComponentRow from '../components/ComponentRow'
import './Meals.css'

const SLOTS = [['breakfast', 'Breakfast'], ['lunch', 'Lunch'], ['dinner', 'Dinner']]

function dayLabel(startDate, i) {
  if (!startDate) return `Day ${i + 1}`
  const d = new Date(startDate + 'T00:00:00')
  d.setDate(d.getDate() + i)
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })
}

function cloneLibraryMeal(lib, dayId, slot) {
  return {
    id: uid('meal'), day: dayId, slot, name: lib.name, recipeUrl: lib.recipeUrl || null,
    components: (lib.components || []).map(c => ({
      id: uid('c'), name: c.name, role: c.role, qty: c.qty || '', baseServes: c.baseServes || 7,
      weight: roleWeight(c.role), assignedCrewId: null, locked: false,
    })),
  }
}

export default function Meals() {
  const { trip, updateThisTrip } = useOutletContext()
  const { library, households } = useCamp()

  const crewOptions = (trip.crews || []).map(c => ({
    id: c.householdId, name: households.find(h => h.id === c.householdId)?.name || 'Unknown',
  }))

  if (!trip.crews.length || !trip.days.length) {
    return (
      <div className="empty">
        <p className="empty-title">Finish setup first</p>
        <p>Add some days and crews on the <Link to={`/trip/${trip.id}`} style={{ color: 'var(--ember)' }}>Setup</Link> tab, then plan meals here.</p>
      </div>
    )
  }

  const autoDivide = () => updateThisTrip(t => applyAssignment(t, divide(t)))

  const addMeal = (dayId, slot, libId) => {
    const lib = library.find(l => l.id === libId)
    if (!lib) return
    updateThisTrip(t => ({ ...t, meals: [...t.meals, cloneLibraryMeal(lib, dayId, slot)] }))
  }
  const removeMeal = (mealId) => updateThisTrip(t => ({ ...t, meals: t.meals.filter(m => m.id !== mealId) }))
  const patchComp = (mealId, compId, patch) => updateThisTrip(t => ({
    ...t, meals: t.meals.map(m => m.id === mealId
      ? { ...m, components: m.components.map(c => c.id === compId ? { ...c, ...patch } : c) } : m),
  }))
  const removeComp = (mealId, compId) => updateThisTrip(t => ({
    ...t, meals: t.meals.map(m => m.id === mealId
      ? { ...m, components: m.components.filter(c => c.id !== compId) } : m),
  }))
  const patchExtra = (exId, patch) => updateThisTrip(t => ({
    ...t, extras: t.extras.map(e => e.id === exId ? { ...e, ...patch } : e),
  }))

  return (
    <div className="meals">
      <div className="meals-bar panel">
        <div className="meals-bar-tally"><CrewTally trip={trip} households={households} /></div>
        <button className="btn" onClick={autoDivide}>⚖️ Auto-divide across crews</button>
      </div>

      {trip.days.map((day, i) => (
        <section className="day-block" key={day.id}>
          <h2 className="day-title">{dayLabel(trip.startDate, i)}</h2>
          {SLOTS.map(([slot, label]) => {
            const meals = trip.meals.filter(m => m.day === day.id && m.slot === slot)
            const libForSlot = library.filter(l => (l.slot || 'dinner') === slot)
            return (
              <div className="slot-block" key={slot}>
                <div className="slot-head">
                  <span className="slot-label">{label}</span>
                  <select className="slot-add" value="" onChange={e => { addMeal(day.id, slot, e.target.value); e.target.value = '' }}>
                    <option value="">+ Add {label.toLowerCase()}…</option>
                    {libForSlot.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
                {slot === 'lunch' && meals.length === 0 && (
                  <div className="byol">🥪 BYOL — Bring Your Own Lunch <span>add a lunch above to override</span></div>
                )}
                {meals.map(meal => (
                  <div className="meal-card" key={meal.id}>
                    <div className="meal-card-head">
                      <h3 className="meal-name">{meal.name}</h3>
                      <div className="meal-card-actions">
                        {meal.recipeUrl && <a className="meal-recipe" href={meal.recipeUrl} target="_blank" rel="noopener">recipe ↗</a>}
                        <button className="meal-x" onClick={() => removeMeal(meal.id)} aria-label="Remove meal">✕</button>
                      </div>
                    </div>
                    <div className="comp-list">
                      {meal.components.map(c => (
                        <ComponentRow key={c.id} comp={c} crewOptions={crewOptions}
                          onPatch={p => patchComp(meal.id, c.id, p)} onRemove={() => removeComp(meal.id, c.id)} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )
          })}
        </section>
      ))}

      {trip.extras.length > 0 && (
        <section className="day-block">
          <h2 className="day-title">Every-day extras</h2>
          <div className="meal-card">
            <div className="comp-list">
              {trip.extras.map(e => (
                <ComponentRow key={e.id} comp={e} crewOptions={crewOptions}
                  onPatch={p => patchExtra(e.id, p)}
                  onRemove={() => updateThisTrip(t => ({ ...t, extras: t.extras.filter(x => x.id !== e.id) }))} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
