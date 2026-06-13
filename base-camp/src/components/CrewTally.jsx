import { crewTotals } from '../utils/divider'
import './CrewTally.css'

export default function CrewTally({ trip, households }) {
  const totals = crewTotals(trip)
  const crews = (trip.crews || []).map(c => ({
    id: c.householdId,
    name: households.find(h => h.id === c.householdId)?.name || 'Unknown',
    ...(totals[c.householdId] || { weight: 0, count: 0 }),
  }))
  if (!crews.length) return null
  const max = Math.max(...crews.map(c => c.weight), 1)

  return (
    <div className="tally">
      {crews.map(c => (
        <div className="tally-row" key={c.id}>
          <span className="tally-name" title={c.name}>{c.name}</span>
          <div className="tally-track">
            <div className="tally-fill" style={{ width: `${(c.weight / max) * 100}%` }} />
          </div>
          <span className="tally-val">{c.count} item{c.count === 1 ? '' : 's'}</span>
        </div>
      ))}
    </div>
  )
}
