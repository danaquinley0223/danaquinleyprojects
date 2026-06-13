import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useCamp } from '../context/CampDataContext'
import { uid } from '../utils/seed'
import './Packing.css'

const PERSONAL_BASICS = ['Sleeping bag', 'Sleeping pad', 'Pillow', 'Headlamp', 'Camp chair', 'Water bottle', 'Warm layers / jacket', 'Toiletries', 'Sunscreen', 'Bug spray', 'Plate, bowl, utensils, cup']
const COMMUNAL_BASICS = ['Tent(s)', 'Stove + fuel', 'Cooler(s)', 'Ice', 'Water jugs', 'Folding table', 'Canopy / shade', 'Lantern', 'Firewood', 'Lighter / matches', 'Pots & pans', 'Cutting board + knife', 'Dish soap + sponge', 'Trash bags', 'Paper towels', 'First-aid kit']

export default function Packing() {
  const { trip, updateThisTrip } = useOutletContext()
  const { households } = useCamp()
  const [inputs, setInputs] = useState({ personal: '', communal: '' })

  const packing = trip.packing || { personal: [], communal: [] }
  const crewOptions = (trip.crews || []).map(c => ({
    id: c.householdId, name: households.find(h => h.id === c.householdId)?.name || 'Unknown',
  }))

  const setList = (key, fn) => updateThisTrip(t => {
    const p = t.packing || { personal: [], communal: [] }
    return { ...t, packing: { ...p, [key]: fn(p[key] || []) } }
  })
  const addItem = (key, name) => { if (name.trim()) setList(key, l => [...l, { id: uid('pk'), name: name.trim(), checked: false, assignedCrewId: null }]) }
  const patchItem = (key, id, patch) => setList(key, l => l.map(i => i.id === id ? { ...i, ...patch } : i))
  const removeItem = (key, id) => setList(key, l => l.filter(i => i.id !== id))
  const loadBasics = (key, names) => setList(key, l => {
    const have = new Set(l.map(i => i.name.toLowerCase()))
    return [...l, ...names.filter(n => !have.has(n.toLowerCase())).map(n => ({ id: uid('pk'), name: n, checked: false, assignedCrewId: null }))]
  })

  const renderColumn = (keyName, title, basics, communal) => (
    <div className="panel pack-col">
      <div className="pack-col-head">
        <h2 className="pack-col-title">{title}</h2>
        <button className="btn-ghost btn-sm" onClick={() => loadBasics(keyName, basics)}>Load basics</button>
      </div>
      <form className="pack-add" onSubmit={e => { e.preventDefault(); addItem(keyName, inputs[keyName]); setInputs(s => ({ ...s, [keyName]: '' })) }}>
        <input className="input" placeholder="Add an item…" value={inputs[keyName]} onChange={e => setInputs(s => ({ ...s, [keyName]: e.target.value }))} />
        <button className="btn btn-sm" type="submit">Add</button>
      </form>
      <div className="pack-items">
        {(packing[keyName] || []).map(it => (
          <div className={`pack-item${it.checked ? ' done' : ''}`} key={it.id}>
            <label className="pack-check">
              <input type="checkbox" checked={it.checked} onChange={e => patchItem(keyName, it.id, { checked: e.target.checked })} />
              <span>{it.name}</span>
            </label>
            {communal && (
              <select className="pack-crew" value={it.assignedCrewId || ''} onChange={e => patchItem(keyName, it.id, { assignedCrewId: e.target.value || null })}>
                <option value="">— who? —</option>
                {crewOptions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}
            <button className="pack-x" onClick={() => removeItem(keyName, it.id)} aria-label="Remove">✕</button>
          </div>
        ))}
        {(packing[keyName] || []).length === 0 && <p className="pack-none">Nothing here yet.</p>}
      </div>
    </div>
  )

  return (
    <div className="packing">
      <div className="pack-grid">
        {renderColumn('personal', 'Personal (each person)', PERSONAL_BASICS, false)}
        {renderColumn('communal', 'Communal gear', COMMUNAL_BASICS, true)}
      </div>
    </div>
  )
}
