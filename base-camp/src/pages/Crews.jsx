import { useState } from 'react'
import { useCamp } from '../context/CampDataContext'
import { uid } from '../utils/seed'
import './Crews.css'

export default function Crews() {
  const { households, updateCollection } = useCamp()
  const [name, setName] = useState('')
  const [size, setSize] = useState(2)

  const add = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    updateCollection('households', list => [...list, { id: uid('hh'), name: name.trim(), defaultSize: Number(size) || 1 }])
    setName(''); setSize(2)
  }
  const update = (id, patch) => updateCollection('households', list => list.map(h => h.id === id ? { ...h, ...patch } : h))
  const remove = (id) => { if (confirm('Remove this crew?')) updateCollection('households', list => list.filter(h => h.id !== id)) }

  return (
    <div className="crews">
      <div className="page-head">
        <h1 className="page-title">Crews</h1>
        <p className="page-sub">Your camping households — reused across every trip.</p>
      </div>

      <form className="crews-add panel" onSubmit={add}>
        <input className="input" placeholder="Crew name (e.g. Gary & Delphine)" value={name} onChange={e => setName(e.target.value)} />
        <div className="crews-add-size">
          <label className="field-label">Default size</label>
          <input className="input" type="number" min="1" value={size} onChange={e => setSize(e.target.value)} />
        </div>
        <button className="btn" type="submit">Add crew</button>
      </form>

      <div className="crews-list">
        {households.map(h => (
          <div key={h.id} className="crews-row">
            <input className="crews-name" value={h.name} onChange={e => update(h.id, { name: e.target.value })} />
            <div className="crews-size">
              <span>Size</span>
              <input type="number" min="1" value={h.defaultSize} onChange={e => update(h.id, { defaultSize: Number(e.target.value) || 1 })} />
            </div>
            <button className="crews-x" onClick={() => remove(h.id)} aria-label="Remove crew">✕</button>
          </div>
        ))}
      </div>
    </div>
  )
}
