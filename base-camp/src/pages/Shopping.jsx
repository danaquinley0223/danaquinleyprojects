import { useState } from 'react'
import { useOutletContext, Link } from 'react-router-dom'
import { useCamp } from '../context/CampDataContext'
import { perCrewLists, masterList, servingsOf } from '../utils/shopping'
import './Shopping.css'

export default function Shopping() {
  const { trip, updateThisTrip } = useOutletContext()
  const { households } = useCamp()
  const [view, setView] = useState('crew')

  const checked = trip.shoppingChecked || {}
  const toggle = (id) => updateThisTrip(t => ({
    ...t, shoppingChecked: { ...(t.shoppingChecked || {}), [id]: !(t.shoppingChecked || {})[id] },
  }))

  const hasItems = (trip.meals || []).some(m => m.components?.length) || (trip.extras || []).length
  if (!hasItems) {
    return (
      <div className="empty">
        <p className="empty-title">Nothing to shop for yet</p>
        <p>Plan some meals on the <Link to={`/trip/${trip.id}/meals`} style={{ color: 'var(--ember)' }}>Meals</Link> tab first.</p>
      </div>
    )
  }

  const renderItem = (it, showCrew) => (
    <label key={it.id} className={`shop-item${checked[it.id] ? ' done' : ''}`}>
      <input type="checkbox" checked={!!checked[it.id]} onChange={() => toggle(it.id)} />
      {it.qty && <span className="shop-qty">{it.qty}</span>}
      <span className="shop-name">{it.name}</span>
      {showCrew && it.crew && <span className="tag">{it.crew}</span>}
    </label>
  )

  const crews = perCrewLists(trip, households)
  const master = masterList(trip, households)

  return (
    <div className="shopping">
      <div className="shop-bar">
        <div className="shop-toggle">
          <button className={view === 'crew' ? 'active' : ''} onClick={() => setView('crew')}>By crew</button>
          <button className={view === 'master' ? 'active' : ''} onClick={() => setView('master')}>Master list</button>
        </div>
        <span className="shop-servings">Scaled for {servingsOf(trip)} people</span>
      </div>

      {view === 'crew' ? (
        <div className="shop-crews">
          {crews.map(crew => (
            <div className="panel shop-crew" key={crew.crewId}>
              <h3 className="shop-crew-name">{crew.crewName}</h3>
              {crew.groups.length === 0 ? (
                <p className="shop-none">Nothing assigned yet — run Auto-divide on the Meals tab.</p>
              ) : crew.groups.map(g => (
                <div className="shop-group" key={g.title}>
                  <div className="shop-group-title">{g.title}</div>
                  {g.items.map(it => renderItem(it, false))}
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="panel">
          {master.map(g => (
            <div className="shop-group" key={g.role}>
              <div className="shop-group-title">{g.role}</div>
              {g.items.map(it => renderItem(it, true))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
