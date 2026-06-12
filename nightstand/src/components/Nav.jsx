import { NavLink } from 'react-router-dom'
import { useLibrary } from '../context/LibraryContext'
import './Nav.css'

const LINKS = [
  { to: '/', label: 'Shelf', end: true },
  { to: '/match', label: 'Match' },
  { to: '/roulette', label: 'Roulette' },
  { to: '/insights', label: 'Insights' },
  { to: '/releases', label: 'Releases' },
  { to: '/import', label: 'Import' },
]

export default function Nav() {
  const { books } = useLibrary()

  return (
    <nav className="nav">
      <NavLink to="/" end className="nav-brand">
        <span className="nav-brand-icon">&#128218;</span>
        <span className="nav-brand-name">Nightstand</span>
      </NavLink>
      <div className="nav-links">
        {LINKS.map(l => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            {l.label}
            {l.to === '/' && books.length > 0 && <span className="nav-badge">{books.length}</span>}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
