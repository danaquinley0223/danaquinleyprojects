import { NavLink } from 'react-router-dom'
import { useCamp } from '../context/CampDataContext'
import './Nav.css'

const LINKS = [
  { to: '/', label: 'Trips', end: true },
  { to: '/crews', label: 'Crews' },
  { to: '/campsites', label: 'Campsites' },
  { to: '/library', label: 'Meals' },
]

const STATUS = {
  local: { label: 'Local', tone: 'muted' },
  offline: { label: 'Offline', tone: 'muted' },
  saving: { label: 'Saving…', tone: 'ember' },
  synced: { label: 'Synced', tone: 'pine' },
}

export default function Nav() {
  const { status } = useCamp()
  const s = STATUS[status] || STATUS.local

  return (
    <nav className="nav">
      <div className="nav-left">
        <a className="nav-home" href="/" aria-label="Back to all projects">
          <span className="nav-home-arrow">&#8592;</span>
          <span className="nav-home-text">Projects</span>
        </a>
        <NavLink to="/" end className="nav-brand">
          <span className="nav-brand-icon">&#9978;</span>
          <span className="nav-brand-name">Base Camp</span>
        </NavLink>
      </div>
      <div className="nav-links">
        {LINKS.map(l => (
          <NavLink key={l.to} to={l.to} end={l.end}
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            {l.label}
          </NavLink>
        ))}
        <span className={`nav-status ${s.tone}`} title={`Sync: ${s.label}`}>
          <span className="nav-status-dot" />{s.label}
        </span>
      </div>
    </nav>
  )
}
