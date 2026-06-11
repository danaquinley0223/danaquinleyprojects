import { Link } from 'react-router-dom'
import { usePantry } from '../context/PantryContext'
import { useFavorites } from '../context/FavoritesContext'
import { matchStatus } from '../utils/matchUtils'
import './RecipeCard.css'

export default function RecipeCard({ cocktail }) {
  const { pantry } = usePantry()
  const { isFavorite, toggleFavorite } = useFavorites()

  const status = matchStatus(cocktail, pantry)
  const favorited = isFavorite(cocktail.idDrink)

  const handleFavorite = (e) => {
    e.preventDefault()
    e.stopPropagation()
    toggleFavorite(cocktail)
  }

  return (
    <Link to={`/recipe/${cocktail.idDrink}`} className="recipe-card">
      <div className="recipe-card-image-wrap">
        {cocktail.strDrinkThumb ? (
          <img
            src={`${cocktail.strDrinkThumb}/preview`}
            alt={cocktail.strDrink}
            className="recipe-card-image"
            loading="lazy"
            onError={(e) => { e.target.src = cocktail.strDrinkThumb }}
          />
        ) : (
          <div className="recipe-card-image-placeholder">&#127864;</div>
        )}
        <button
          className={`recipe-card-fav${favorited ? ' active' : ''}`}
          onClick={handleFavorite}
          aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
        >
          &#9829;
        </button>
        {status && (
          <div className={`recipe-card-badge ${status}`}>
            {status === 'can-make' ? '&#10003; Can Make' : '~ Almost There'}
          </div>
        )}
        {cocktail.isCustom && (
          <div className="recipe-card-custom">Custom</div>
        )}
        {cocktail.isIBA && !cocktail.isCustom && (
          <div className="recipe-card-iba">IBA</div>
        )}
        {cocktail.isBook && !cocktail.isCustom && (
          <div className="recipe-card-book">{cocktail.source}</div>
        )}
      </div>
      <div className="recipe-card-body">
        <h3 className="recipe-card-name">{cocktail.strDrink}</h3>
        <p className="recipe-card-meta">
          {cocktail.strCategory && <span>{cocktail.strCategory}</span>}
          {cocktail.strAlcoholic && cocktail.strAlcoholic !== cocktail.strCategory && (
            <span>{cocktail.strAlcoholic}</span>
          )}
        </p>
      </div>
    </Link>
  )
}
