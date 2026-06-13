import './ComponentRow.css'

// One ingredient component within a meal: editable qty, its role, the crew it's
// assigned to, a lock (so the auto-divider won't move it), and remove.
export default function ComponentRow({ comp, crewOptions, onPatch, onRemove }) {
  return (
    <div className={`comp-row${comp.locked ? ' locked' : ''}`}>
      <input
        className="comp-qty"
        placeholder="qty"
        value={comp.qty || ''}
        onChange={e => onPatch({ qty: e.target.value })}
      />
      <span className="comp-name">{comp.name}</span>
      <span className={`tag role-${(comp.role || '').replace(/\W/g, '').toLowerCase()}`}>{comp.role}</span>
      <select
        className="comp-crew"
        value={comp.assignedCrewId || ''}
        onChange={e => onPatch({ assignedCrewId: e.target.value || null })}
      >
        <option value="">— unassigned —</option>
        {crewOptions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <button
        className={`comp-lock${comp.locked ? ' on' : ''}`}
        title={comp.locked ? 'Locked — divider won’t move it' : 'Lock this assignment'}
        onClick={() => onPatch({ locked: !comp.locked })}
      >
        {comp.locked ? '🔒' : '🔓'}
      </button>
      <button className="comp-x" onClick={onRemove} aria-label="Remove item">✕</button>
    </div>
  )
}
