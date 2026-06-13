import { useState } from 'react'
import { useCamp } from '../context/CampDataContext'
import { uid } from '../utils/seed'
import './Campsites.css'

const FLAGS = [
  ['tent', '⛺ Tent'],
  ['showers', '🚿 Showers'],
  ['parkAtSite', '🚗 Park at site'],
  ['dogFriendly', '🐾 Dog'],
  ['water', '💧 Water'],
  ['toilets', '🚻 Toilets'],
]

export default function Campsites() {
  const { campsites, updateCollection } = useCamp()
  const [name, setName] = useState('')
  const [filters, setFilters] = useState({ noRes: false, dogFriendly: false, water: false, showers: false })
  const [pick, setPick] = useState(null)

  const add = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    updateCollection('campsites', list => [...list, {
      id: uid('site'), name: name.trim(),
      reservation: false, tent: false, showers: false, parkAtSite: false,
      dogFriendly: false, water: false, toilets: false,
      beenThere: false, rating: 0, notes: '', url: '', mapUrl: '',
    }])
    setName('')
  }
  const patch = (id, p) => updateCollection('campsites', list => list.map(s => s.id === id ? { ...s, ...p } : s))
  const remove = (id) => { if (confirm('Remove this campsite?')) updateCollection('campsites', list => list.filter(s => s.id !== id)) }

  const filtered = campsites.filter(s => {
    if (filters.noRes && s.reservation) return false
    if (filters.dogFriendly && !s.dogFriendly) return false
    if (filters.water && !s.water) return false
    if (filters.showers && !s.showers) return false
    return true
  })

  const surprise = () => { if (filtered.length) setPick(filtered[Math.floor(Math.random() * filtered.length)].id) }
  const setF = (p) => setFilters(f => ({ ...f, ...p }))

  return (
    <div className="sites">
      <div className="page-head">
        <h1 className="page-title">Campsites</h1>
        <p className="page-sub">Spots you love (and want to try) — filter, rate, and let fate pick.</p>
      </div>

      <form className="sites-add panel" onSubmit={add}>
        <input className="input" placeholder="Campground name" value={name} onChange={e => setName(e.target.value)} />
        <button className="btn" type="submit">Add spot</button>
      </form>

      <div className="sites-filters">
        <button className={`filter-chip${filters.noRes ? ' on' : ''}`} onClick={() => setF({ noRes: !filters.noRes })}>No reservation</button>
        <button className={`filter-chip${filters.dogFriendly ? ' on' : ''}`} onClick={() => setF({ dogFriendly: !filters.dogFriendly })}>🐾 Dog-friendly</button>
        <button className={`filter-chip${filters.water ? ' on' : ''}`} onClick={() => setF({ water: !filters.water })}>💧 Water</button>
        <button className={`filter-chip${filters.showers ? ' on' : ''}`} onClick={() => setF({ showers: !filters.showers })}>🚿 Showers</button>
        <button className="btn-ghost btn-sm sites-surprise" onClick={surprise} disabled={!filtered.length}>🎲 Surprise me</button>
      </div>

      {campsites.length === 0 ? (
        <p className="sites-empty">No campsites yet — add your favorites above.</p>
      ) : (
        <div className="sites-grid">
          {filtered.map(s => (
            <div className={`site-card${pick === s.id ? ' picked' : ''}`} key={s.id}>
              <div className="site-head">
                <input className="site-name" value={s.name} onChange={e => patch(s.id, { name: e.target.value })} />
                <button className="lib-x" onClick={() => remove(s.id)} aria-label="Remove">✕</button>
              </div>

              <div className="site-flags">
                {FLAGS.map(([k, l]) => (
                  <button key={k} className={`mini-chip${s[k] ? ' on' : ''}`} onClick={() => patch(s.id, { [k]: !s[k] })}>{l}</button>
                ))}
                <button className={`mini-chip${s.reservation ? ' on' : ''}`} onClick={() => patch(s.id, { reservation: !s.reservation })}>📋 Reserve</button>
              </div>

              <div className="site-link-row">
                <input className="site-url" placeholder="Map link (Apple / Google Maps)" value={s.mapUrl || ''} onChange={e => patch(s.id, { mapUrl: e.target.value })} />
                {s.mapUrl && <a className="site-link-btn map" href={s.mapUrl} target="_blank" rel="noopener" title="Open in Maps">📍</a>}
              </div>
              <div className="site-link-row">
                <input className="site-url" placeholder="Reservation link (optional)" value={s.url || ''} onChange={e => patch(s.id, { url: e.target.value })} />
                {s.url && <a className="site-link-btn res" href={s.url} target="_blank" rel="noopener" title="Make a reservation">↗</a>}
              </div>

              <div className="site-bottom">
                <div className="site-stars">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} className={n <= s.rating ? 'on' : ''} onClick={() => patch(s.id, { rating: n === s.rating ? 0 : n })}>★</button>
                  ))}
                </div>
                <label className="site-been">
                  <input type="checkbox" checked={!!s.beenThere} onChange={e => patch(s.id, { beenThere: e.target.checked })} /> been there
                </label>
              </div>
              <textarea className="site-notes" placeholder="Notes…" value={s.notes} onChange={e => patch(s.id, { notes: e.target.value })} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
