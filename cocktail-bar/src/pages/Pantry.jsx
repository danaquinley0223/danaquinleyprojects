import { useState, useEffect, useMemo } from 'react'
import { getAllIngredients } from '../api/cocktaildb'
import { usePantry } from '../context/PantryContext'
import './Pantry.css'

export default function Pantry() {
  const [allIngredients, setAllIngredients] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const { pantry, toggleIngredient } = usePantry()

  useEffect(() => {
    getAllIngredients().then(list => {
      setAllIngredients(list)
      setLoading(false)
    })
  }, [])

  const filtered = useMemo(() => {
    const term = search.toLowerCase()
    return allIngredients.filter(i => i.toLowerCase().includes(term))
  }, [allIngredients, search])

  const pantrySet = new Set(pantry.map(i => i.toLowerCase()))

  return (
    <div className="pantry">
      <div className="pantry-header">
        <h1 className="pantry-title">My Bar</h1>
        <p className="pantry-subtitle">
          Check off what you have. Bar Cabinet will show you what you can make.
        </p>
      </div>

      {pantry.length > 0 && (
        <div className="pantry-current">
          <h2>In Your Bar <span className="pantry-count">{pantry.length}</span></h2>
          <div className="pantry-tags">
            {pantry.map(ingredient => (
              <button
                key={ingredient}
                className="pantry-tag"
                onClick={() => toggleIngredient(ingredient)}
              >
                {ingredient}
                <span className="pantry-tag-remove">&#215;</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="pantry-browser">
        <h2>Add Ingredients</h2>
        <input
          type="text"
          className="pantry-search"
          placeholder="Search ingredients..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        {loading ? (
          <div className="pantry-loading">
            <div className="spinner" />
            <p>Loading ingredients...</p>
          </div>
        ) : (
          <div className="ingredient-grid">
            {filtered.map(ingredient => {
              const owned = pantrySet.has(ingredient.toLowerCase())
              return (
                <button
                  key={ingredient}
                  className={`ingredient-btn${owned ? ' owned' : ''}`}
                  onClick={() => toggleIngredient(ingredient)}
                >
                  <span className="ingredient-btn-check">{owned ? '&#10003;' : '+'}</span>
                  <span>{ingredient}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
