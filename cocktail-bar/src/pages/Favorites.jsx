import { useState, useEffect } from 'react'
import { lookupById } from '../api/cocktaildb'
import { getLocalCocktail } from '../data/localCocktails'
import { useFavorites } from '../context/FavoritesContext'
import { useCustomRecipes } from '../context/CustomRecipesContext'
import RecipeCard from '../components/RecipeCard'
import './Favorites.css'

export default function Favorites() {
  const { favorites } = useFavorites()
  const { getById } = useCustomRecipes()
  const [detailed, setDetailed] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!favorites.length) {
      setDetailed([])
      return
    }
    setLoading(true)
    Promise.all(favorites.map(async f => {
      if (f.isCustom) return getById(f.idDrink)
      return getLocalCocktail(f.idDrink) || lookupById(f.idDrink)
    })).then(results => {
      setDetailed(results.filter(Boolean))
      setLoading(false)
    })
  }, [favorites, getById])

  return (
    <div className="favorites">
      <div className="favorites-header">
        <h1 className="favorites-title">Favorites</h1>
        <p className="favorites-subtitle">
          {favorites.length > 0
            ? `${favorites.length} saved cocktail${favorites.length === 1 ? '' : 's'}`
            : 'Heart any cocktail to save it here'}
        </p>
      </div>

      {loading ? (
        <div className="favorites-loading">
          <div className="spinner" />
        </div>
      ) : detailed.length === 0 ? (
        <div className="favorites-empty">
          <p className="favorites-empty-icon">&#9825;</p>
          <p className="favorites-empty-title">No favorites yet</p>
          <p className="favorites-empty-sub">Browse cocktails and tap the heart to save them here.</p>
        </div>
      ) : (
        <div className="cocktail-grid">
          {detailed.map(cocktail => (
            <RecipeCard key={cocktail.idDrink} cocktail={cocktail} />
          ))}
        </div>
      )}
    </div>
  )
}
