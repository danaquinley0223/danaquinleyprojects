import { useCamp } from '../context/CampDataContext'
import { uid, ROLES } from '../utils/seed'
import './Library.css'

export default function Library() {
  const { library, updateCollection } = useCamp()

  const addMeal = () => updateCollection('library', list => [
    ...list, { id: uid('lib'), name: 'New meal', slot: 'dinner', recipeUrl: '', components: [] },
  ])
  const patchMeal = (id, patch) => updateCollection('library', list => list.map(m => m.id === id ? { ...m, ...patch } : m))
  const removeMeal = (id) => { if (confirm('Delete this library meal?')) updateCollection('library', list => list.filter(m => m.id !== id)) }

  const addComp = (id) => patchMealComps(id, comps => [...comps, { id: uid('lc'), name: '', role: 'Other', qty: '', baseServes: 7 }])
  const patchComp = (id, ci, patch) => patchMealComps(id, comps => comps.map((c, i) => i === ci ? { ...c, ...patch } : c))
  const removeComp = (id, ci) => patchMealComps(id, comps => comps.filter((_, i) => i !== ci))
  function patchMealComps(id, fn) {
    updateCollection('library', list => list.map(m => m.id === id ? { ...m, components: fn(m.components || []) } : m))
  }

  const order = { breakfast: 0, dinner: 1 }
  const sorted = [...library].sort((a, b) => (order[a.slot] ?? 2) - (order[b.slot] ?? 2) || a.name.localeCompare(b.name))

  return (
    <div className="library">
      <div className="page-head lib-head">
        <div>
          <h1 className="page-title">Meal library</h1>
          <p className="page-sub">Your go-to camp meals — pick from these when planning a trip.</p>
        </div>
        <button className="btn" onClick={addMeal}>+ New meal</button>
      </div>

      <div className="lib-list">
        {sorted.map(meal => (
          <div className="lib-card" key={meal.id}>
            <div className="lib-card-head">
              <input className="lib-name" value={meal.name} onChange={e => patchMeal(meal.id, { name: e.target.value })} />
              <select className="lib-slot" value={meal.slot || 'dinner'} onChange={e => patchMeal(meal.id, { slot: e.target.value })}>
                <option value="breakfast">Breakfast</option>
                <option value="dinner">Dinner</option>
              </select>
              <button className="lib-x" onClick={() => removeMeal(meal.id)} aria-label="Delete meal">✕</button>
            </div>
            <input className="lib-recipe" placeholder="Recipe URL (optional)" value={meal.recipeUrl || ''} onChange={e => patchMeal(meal.id, { recipeUrl: e.target.value })} />
            <div className="lib-comps">
              {(meal.components || []).map((c, ci) => (
                <div className="lib-comp" key={c.id || ci}>
                  <input className="lib-comp-name" placeholder="Ingredient / component" value={c.name} onChange={e => patchComp(meal.id, ci, { name: e.target.value })} />
                  <select value={c.role} onChange={e => patchComp(meal.id, ci, { role: e.target.value })}>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <input className="lib-comp-qty" placeholder="qty" value={c.qty || ''} onChange={e => patchComp(meal.id, ci, { qty: e.target.value })} />
                  <button className="lib-x" onClick={() => removeComp(meal.id, ci)} aria-label="Remove">✕</button>
                </div>
              ))}
              <button className="lib-add-comp" onClick={() => addComp(meal.id)}>+ item</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
