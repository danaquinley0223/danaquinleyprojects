import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useCamp } from '../context/CampDataContext'
import { uid, SEED_EXTRAS, roleWeight } from '../utils/seed'
import './TripSetup.css'

function dayLabel(startDate, i) {
  if (!startDate) return `Day ${i + 1}`
  const d = new Date(startDate + 'T00:00:00')
  d.setDate(d.getDate() + i)
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

export default function TripSetup() {
  const { trip, updateThisTrip } = useOutletContext()
  const { households, campsites } = useCamp()
  const [extraInput, setExtraInput] = useState('')

  const attending = new Set(trip.crews.map(c => c.householdId))
  const totalAdults = trip.crews.reduce((s, c) => s + (c.adults || 0), 0)
  const totalKids = trip.crews.reduce((s, c) => s + (c.kids || 0), 0)

  const toggleCrew = (hh) => updateThisTrip(t => {
    const has = t.crews.some(c => c.householdId === hh.id)
    return {
      ...t,
      crews: has ? t.crews.filter(c => c.householdId !== hh.id)
                 : [...t.crews, { householdId: hh.id, adults: hh.defaultSize || 1, kids: 0 }],
    }
  })
  const setCount = (hhId, field, val) => updateThisTrip(t => ({
    ...t, crews: t.crews.map(c => c.householdId === hhId ? { ...c, [field]: Math.max(0, val) } : c),
  }))
  const setSite = (hhId, val) => updateThisTrip(t => ({
    ...t, crews: t.crews.map(c => c.householdId === hhId ? { ...c, siteNumber: val } : c),
  }))

  const addDay = () => updateThisTrip(t => ({ ...t, days: [...t.days, { id: uid('day') }] }))
  const removeDay = () => updateThisTrip(t => ({ ...t, days: t.days.slice(0, -1) }))
  const setStart = (v) => updateThisTrip(t => ({ ...t, startDate: v || null }))

  const extraOn = (name) => trip.extras.some(e => e.name === name)
  const toggleExtra = (ex) => updateThisTrip(t => {
    const has = t.extras.some(e => e.name === ex.name)
    return {
      ...t,
      extras: has ? t.extras.filter(e => e.name !== ex.name)
                  : [...t.extras, { id: uid('ex'), ...ex, weight: roleWeight(ex.role), assignedCrewId: null, locked: false, recurring: true }],
    }
  })
  const seedExtraNames = new Set(SEED_EXTRAS.map(e => e.name))
  const customExtras = trip.extras.filter(e => !seedExtraNames.has(e.name))
  const addCustomExtra = (name) => {
    if (!name.trim()) return
    updateThisTrip(t => ({
      ...t,
      extras: [...t.extras, { id: uid('ex'), name: name.trim(), role: 'Other', qty: '', baseServes: 7, weight: roleWeight('Other'), assignedCrewId: null, locked: false, recurring: true }],
    }))
    setExtraInput('')
  }
  const removeExtra = (id) => updateThisTrip(t => ({ ...t, extras: t.extras.filter(e => e.id !== id) }))

  return (
    <div className="setup">
      <section className="panel setup-block">
        <h2 className="setup-h">Dates</h2>
        <div className="setup-dates">
          <div>
            <label className="field-label">Start date (optional)</label>
            <input type="date" className="input" value={trip.startDate || ''} onChange={e => setStart(e.target.value)} />
          </div>
          <div>
            <label className="field-label">Days</label>
            <div className="stepper">
              <button className="btn-ghost btn-sm" onClick={removeDay} disabled={!trip.days.length}>−</button>
              <span className="stepper-val">{trip.days.length}</span>
              <button className="btn-ghost btn-sm" onClick={addDay}>+</button>
            </div>
          </div>
        </div>
        {trip.days.length > 0 && (
          <div className="setup-daychips">
            {trip.days.map((d, i) => <span key={d.id} className="tag">{dayLabel(trip.startDate, i)}</span>)}
          </div>
        )}
      </section>

      <section className="panel setup-block">
        <h2 className="setup-h">Crews coming
          <span className="setup-count">{totalAdults} adults{totalKids ? ` · ${totalKids} kids` : ''}</span>
        </h2>
        <div className="crew-rows">
          {households.map(hh => {
            const crew = trip.crews.find(c => c.householdId === hh.id)
            const on = attending.has(hh.id)
            return (
              <div key={hh.id} className={`crew-row${on ? ' on' : ''}`}>
                <label className="crew-check">
                  <input type="checkbox" checked={on} onChange={() => toggleCrew(hh)} />
                  <span>{hh.name}</span>
                </label>
                {on && (
                  <div className="crew-counts">
                    <span>Adults <input type="number" min="0" value={crew.adults} onChange={e => setCount(hh.id, 'adults', Number(e.target.value))} /></span>
                    <span>Kids <input type="number" min="0" value={crew.kids} onChange={e => setCount(hh.id, 'kids', Number(e.target.value))} /></span>
                    <span>Site # <input className="crew-site" type="text" placeholder="—" value={crew.siteNumber || ''} onChange={e => setSite(hh.id, e.target.value)} /></span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
        <p className="setup-hint">Manage the master crew list under <strong>Crews</strong>.</p>
      </section>

      <section className="panel setup-block">
        <h2 className="setup-h">Campsite</h2>
        <select className="select" value={trip.campsiteId || ''} onChange={e => {
          const site = campsites.find(s => s.id === e.target.value)
          updateThisTrip(t => ({ ...t, campsiteId: e.target.value || null, place: site ? site.name : t.place }))
        }}>
          <option value="">— none chosen —</option>
          {campsites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <p className="setup-hint">Build your spots list under <strong>Campsites</strong>.</p>
      </section>

      <section className="panel setup-block">
        <h2 className="setup-h">Every-day extras</h2>
        <div className="extra-chips">
          {SEED_EXTRAS.map(ex => (
            <button key={ex.name} className={`filter-chip${extraOn(ex.name) ? ' on' : ''}`} onClick={() => toggleExtra(ex)}>
              {extraOn(ex.name) ? '✓ ' : ''}{ex.name}
            </button>
          ))}
          {customExtras.map(ex => (
            <button key={ex.id} className="filter-chip on" onClick={() => removeExtra(ex.id)} title="Remove">
              ✓ {ex.name} <span className="chip-x">✕</span>
            </button>
          ))}
        </div>
        <form className="extra-add" onSubmit={e => { e.preventDefault(); addCustomExtra(extraInput) }}>
          <input className="input" placeholder="Add an extra (e.g. Hot chocolate, foil, ice)" value={extraInput} onChange={e => setExtraInput(e.target.value)} />
          <button className="btn btn-sm" type="submit">Add</button>
        </form>
        <p className="setup-hint">These get divided across crews along with the meals.</p>
      </section>
    </div>
  )
}
