import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { lookupById, extractIngredients } from '../api/cocktaildb'
import { getLocalCocktail } from '../data/localCocktails'
import { useCustomRecipes } from '../context/CustomRecipesContext'
import { usePantry } from '../context/PantryContext'
import { useFavorites } from '../context/FavoritesContext'
import { missingIngredients } from '../utils/matchUtils'
import './RecipeDetail.css'

function scaleAmount(measure, scale) {
  if (!measure) return ''
  return measure.replace(/[\d.\/]+/g, match => {
    if (match.includes('/')) {
      const [n, d] = match.split('/')
      return formatNumber((parseFloat(n) / parseFloat(d)) * scale)
    }
    return formatNumber(parseFloat(match) * scale)
  })
}

function formatNumber(n) {
  if (isNaN(n)) return ''
  const fractions = [[0.25, '¼'], [0.5, '½'], [0.75, '¾'], [0.33, '⅓'], [0.67, '⅔']]
  const whole = Math.floor(n)
  const decimal = n - whole
  const frac = fractions.find(([val]) => Math.abs(decimal - val) < 0.04)
  if (frac) return whole ? `${whole} ${frac[1]}` : frac[1]
  return n % 1 === 0 ? String(n) : n.toFixed(1)
}

export default function RecipeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [cocktail, setCocktail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [scale, setScale] = useState(1)

  const { getById, deleteRecipe } = useCustomRecipes()
  const { pantry } = usePantry()
  const { isFavorite, toggleFavorite } = useFavorites()

  useEffect(() => {
    setLoading(true)
    if (id.startsWith('custom-')) {
      const recipe = getById(id)
      setCocktail(recipe)
      setLoading(false)
    } else {
      const local = getLocalCocktail(id)
      if (local) {
        setCocktail(local)
        setLoading(false)
      } else {
        lookupById(id).then(data => {
          setCocktail(data)
          setLoading(false)
        })
      }
    }
  }, [id, getById])

  if (loading) return (
    <div className="detail-loading">
      <div className="spinner" />
    </div>
  )

  if (!cocktail) return (
    <div className="detail-not-found">
      <p>Cocktail not found.</p>
      <button onClick={() => navigate(-1)}>Go back</button>
    </div>
  )

  const ingredients = extractIngredients(cocktail)
  const missing = pantry.length ? missingIngredients(cocktail, pantry) : []
  const missingSet = new Set(missing.map(m => m.ingredient.toLowerCase()))
  const favorited = isFavorite(cocktail.idDrink)

  const handleDelete = () => {
    if (confirm(`Delete "${cocktail.strDrink}"?`)) {
      deleteRecipe(id)
      navigate('/')
    }
  }

  return (
    <div className="detail">
      <div className="detail-back">
        <button className="back-btn" onClick={() => navigate(-1)}>&#8592; Back</button>
        {cocktail.isCustom && (
          <div className="detail-custom-actions">
            <button className="btn-ghost-small" onClick={() => navigate(`/edit-recipe/${id}`)}>Edit</button>
            <button className="btn-danger-small" onClick={handleDelete}>Delete</button>
          </div>
        )}
      </div>

      <div className="detail-hero">
        <div className="detail-image-wrap">
          {cocktail.strDrinkThumb ? (
            <img src={cocktail.strDrinkThumb} alt={cocktail.strDrink} className="detail-image" />
          ) : (
            <div className="detail-image-placeholder">&#127864;</div>
          )}
        </div>

        <div className="detail-header">
          {cocktail.isCustom && <span className="detail-custom-tag">Custom Recipe</span>}
          <h1 className="detail-title">{cocktail.strDrink}</h1>
          <div className="detail-tags">
            {cocktail.strCategory && <span className="detail-tag">{cocktail.strCategory}</span>}
            {cocktail.strAlcoholic && <span className="detail-tag">{cocktail.strAlcoholic}</span>}
            {cocktail.strGlass && <span className="detail-tag">{cocktail.strGlass}</span>}
          </div>

          {pantry.length > 0 && (
            <div className={`detail-status ${missing.length === 0 ? 'can-make' : missing.length === 1 ? 'almost-there' : 'cannot-make'}`}>
              {missing.length === 0 && '&#10003; You can make this right now'}
              {missing.length === 1 && `~ Just missing: ${missing[0].ingredient}`}
              {missing.length > 1 && `Missing ${missing.length} ingredients`}
            </div>
          )}

          <button
            className={`detail-fav-btn${favorited ? ' active' : ''}`}
            onClick={() => toggleFavorite(cocktail)}
          >
            <span>&#9829;</span>
            {favorited ? 'Saved to Favorites' : 'Add to Favorites'}
          </button>
        </div>
      </div>

      <div className="detail-body">
        <div className="detail-ingredients">
          <div className="detail-section-header">
            <h2>Ingredients</h2>
            <div className="batch-scaler">
              <span>Servings:</span>
              <button
                className="scale-btn"
                onClick={() => setScale(s => Math.max(0.5, s - (s > 1 ? 1 : 0.5)))}
                disabled={scale <= 0.5}
              >&#8722;</button>
              <span className="scale-value">{scale}</span>
              <button className="scale-btn" onClick={() => setScale(s => s + (s >= 1 ? 1 : 0.5))}>&#43;</button>
            </div>
          </div>

          <ul className="ingredient-list">
            {ingredients.map(({ ingredient, measure }, i) => {
              const have = !missingSet.has(ingredient.toLowerCase())
              return (
                <li key={i} className={`ingredient-item${pantry.length ? (have ? ' have' : ' missing') : ''}`}>
                  <span className="ingredient-measure">{scaleAmount(measure, scale)}</span>
                  <span className="ingredient-name">{ingredient}</span>
                  {pantry.length > 0 && (
                    <span className="ingredient-status">{have ? '&#10003;' : '&#215;'}</span>
                  )}
                </li>
              )
            })}
          </ul>
        </div>

        <div className="detail-instructions">
          <h2>Instructions</h2>
          <p className="instructions-text">
            {cocktail.strInstructions || 'No instructions provided.'}
          </p>
        </div>
      </div>
    </div>
  )
}
