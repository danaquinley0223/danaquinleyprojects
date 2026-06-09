import { NavLink } from 'react-router-dom'
import { usePantry } from '../context/PantryContext'
import { useFavorites } from '../context/FavoritesContext'
import './Nav.css'

export default function Nav() {
  const { pantry } = usePantry()
  const { favorites } = useFavorites()

  return (
    <nav className="nav">
      <NavLink to="/" className="nav-brand">
        <span className="nav-brand-icon">&#127864;</span>
        <span className="nav-brand-name">Bar Cabinet</span>
      </NavLink>
      <div className="nav-links">
        <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          Browse
        </NavLink>
        <NavLink to="/favorites" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          Favorites
          {favorites.length > 0 && <span className="nav-badge">{favorites.length}</span>}
        </NavLink>
        <NavLink to="/add-recipe" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          Add Recipe
        </NavLink>
        <NavLink to="/pantry" className={({ isActive }) => `nav-link nav-link-pantry${isActive ? ' active' : ''}`}>
          My Bar
          {pantry.length > 0 && <span className="nav-badge">{pantry.length}</span>}
        </NavLink>
      </div>
    </nav>
  )
}
