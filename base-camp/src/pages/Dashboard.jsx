import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCamp } from '../context/CampDataContext'
import { uid } from '../utils/seed'
import './Dashboard.css'

export default function Dashboard() {
  const { trips, mutate, setCurrentTrip } = useCamp()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [place, setPlace] = useState('')

  const createTrip = (e) => {
    e.preventDefault()
    if (!name.trim() || !place.trim()) return
    const id = uid('trip')
    const trip = {
      id, name: name.trim(), place: place.trim(),
      days: [], crews: [], meals: [], extras: [],
      packing: { personal: [], communal: [] },
      shoppingChecked: {}, campsiteId: null, createdAt: Date.now(),
    }
    mutate(d => ({ ...d, trips: [...(d.trips || []), trip] }))
    setCurrentTrip(id)
    setName(''); setPlace('')
    navigate(`/trip/${id}`)
  }

  const open = (id) => { setCurrentTrip(id); navigate(`/trip/${id}`) }

  const removeTrip = (e, id) => {
    e.stopPropagation()
    if (confirm('Delete this trip?')) mutate(d => ({ ...d, trips: d.trips.filter(t => t.id !== id) }))
  }

  return (
    <div className="dash">
      <div className="page-head">
        <h1 className="page-title">Camping trips</h1>
        <p className="page-sub">Plan meals, divide the load across crews, pack, and pick a spot.</p>
      </div>

      <form className="dash-create panel" onSubmit={createTrip}>
        <input className="input" placeholder="Trip name (e.g. Manresa May 2026)" value={name} onChange={e => setName(e.target.value)} required />
        <input className="input" placeholder="Place (e.g. Manresa Campground)" value={place} onChange={e => setPlace(e.target.value)} required />
        <button className="btn" type="submit" disabled={!name.trim() || !place.trim()}>Start a trip</button>
      </form>

      {trips.length === 0 ? (
        <p className="dash-empty">No trips yet — start one above.</p>
      ) : (
        <div className="dash-grid">
          {trips.map(t => (
            <div key={t.id} className="trip-card" onClick={() => open(t.id)}>
              <button className="trip-card-x" onClick={(e) => removeTrip(e, t.id)} aria-label="Delete trip">✕</button>
              <h3 className="trip-card-name">{t.name}</h3>
              {t.place && <p className="trip-card-place">📍 {t.place}</p>}
              <div className="trip-card-meta">
                <span className="tag">{t.days?.length || 0} days</span>
                <span className="tag">{t.crews?.length || 0} crews</span>
                <span className="tag">{t.meals?.length || 0} meals</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
