import { useParams, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useCamp } from '../context/CampDataContext'
import './TripLayout.css'

const TABS = [
  { to: '', label: 'Setup', end: true },
  { to: 'meals', label: 'Meals' },
  { to: 'shopping', label: 'Shopping' },
  { to: 'packing', label: 'Packing' },
]

export default function TripLayout() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { trips, updateTrip } = useCamp()
  const trip = trips.find(t => t.id === id)

  if (!trip) {
    return (
      <div className="empty">
        <p className="empty-title">Trip not found</p>
        <button className="btn-ghost" onClick={() => navigate('/')}>Back to trips</button>
      </div>
    )
  }

  const updateThisTrip = (fn) => updateTrip(id, fn)

  return (
    <div className="trip">
      <div className="trip-header">
        <div>
          <h1 className="trip-title">{trip.name}</h1>
          {trip.place && <p className="trip-place">📍 {trip.place}</p>}
        </div>
      </div>

      <div className="trip-tabs">
        {TABS.map(t => (
          <NavLink key={t.to} to={t.to} end={t.end}
            className={({ isActive }) => `trip-tab${isActive ? ' active' : ''}`}>
            {t.label}
          </NavLink>
        ))}
      </div>

      <Outlet context={{ trip, updateThisTrip }} />
    </div>
  )
}
