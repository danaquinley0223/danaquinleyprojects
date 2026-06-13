import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useCamp } from '../context/CampDataContext'
import { uid } from '../utils/seed'
import './Dashboard.css'

export default function Dashboard() {
  const { trips, campsites, mutate, setCurrentTrip } = useCamp()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [placeId, setPlaceId] = useState('')

  const createTrip = (e) => {
    e.preventDefault()
    const site = campsites.find(s => s.id === placeId)
    if (!name.trim() || !site) return
    const id = uid('trip')
    const trip = {
      id, name: name.trim(), place: site.name, campsiteId: site.id,
      days: [], crews: [], meals: [], extras: [],
      packing: { personal: [], communal: [] },
      shoppingChecked: {}, createdAt: Date.now(),
    }
    mutate(d => ({ ...d, trips: [...(d.trips || []), trip] }))
    setCurrentTrip(id)
    setName(''); setPlaceId('')
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
        <select className="input" value={placeId} onChange={e => setPlaceId(e.target.value)} required disabled={!campsites.length}>
          <option value="">{campsites.length ? 'Pick a campsite…' : 'No campsites yet'}</option>
          {campsites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <button className="btn" type="submit" disabled={!name.trim() || !placeId}>Start a trip</button>
      </form>
      {campsites.length === 0 && (
        <p className="dash-hint">Add a spot under <Link to="/campsites">Campsites</Link> first to choose a place.</p>
      )}

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
