import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCustomRecipes } from '../context/CustomRecipesContext'
import './AddRecipe.css'

const EMPTY_INGREDIENT = { ingredient: '', measure: '' }

export default function AddRecipe() {
  const navigate = useNavigate()
  const { addRecipe } = useCustomRecipes()

  const [name, setName] = useState('')
  const [category, setCategory] = useState('Cocktail')
  const [alcoholic, setAlcoholic] = useState('Alcoholic')
  const [glass, setGlass] = useState('')
  const [instructions, setInstructions] = useState('')
  const [thumbUrl, setThumbUrl] = useState('')
  const [ingredients, setIngredients] = useState([
    { ...EMPTY_INGREDIENT },
    { ...EMPTY_INGREDIENT },
    { ...EMPTY_INGREDIENT },
  ])
  const [errors, setErrors] = useState({})

  const updateIngredient = (index, field, value) => {
    setIngredients(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item))
  }

  const addIngredientRow = () => {
    setIngredients(prev => [...prev, { ...EMPTY_INGREDIENT }])
  }

  const removeIngredientRow = (index) => {
    setIngredients(prev => prev.filter((_, i) => i !== index))
  }

  const validate = () => {
    const errs = {}
    if (!name.trim()) errs.name = 'Name is required'
    const filledIngredients = ingredients.filter(i => i.ingredient.trim())
    if (!filledIngredients.length) errs.ingredients = 'At least one ingredient is required'
    if (!instructions.trim()) errs.instructions = 'Instructions are required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return

    const filledIngredients = ingredients.filter(i => i.ingredient.trim())
    const recipe = {
      strDrink: name.trim(),
      strCategory: category,
      strAlcoholic: alcoholic,
      strGlass: glass.trim(),
      strInstructions: instructions.trim(),
      strDrinkThumb: thumbUrl.trim() || null,
    }

    filledIngredients.forEach(({ ingredient, measure }, i) => {
      recipe[`strIngredient${i + 1}`] = ingredient.trim()
      recipe[`strMeasure${i + 1}`] = measure.trim()
    })

    const created = addRecipe(recipe)
    navigate(`/recipe/${created.idDrink}`)
  }

  return (
    <div className="add-recipe">
      <div className="add-recipe-header">
        <h1 className="add-recipe-title">Add a Recipe</h1>
        <p className="add-recipe-subtitle">Create your own cocktail recipe</p>
      </div>

      <form className="add-recipe-form" onSubmit={handleSubmit}>
        <div className="form-section">
          <h2>Basic Info</h2>
          <div className="form-row">
            <div className={`form-field${errors.name ? ' error' : ''}`}>
              <label>Cocktail Name *</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Midnight Sour"
              />
              {errors.name && <span className="form-error">{errors.name}</span>}
            </div>
          </div>

          <div className="form-row form-row-3">
            <div className="form-field">
              <label>Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)}>
                <option>Cocktail</option>
                <option>Shot</option>
                <option>Punch / Party Drink</option>
                <option>Beer</option>
                <option>Soft Drink</option>
                <option>Other / Unknown</option>
              </select>
            </div>
            <div className="form-field">
              <label>Alcoholic</label>
              <select value={alcoholic} onChange={e => setAlcoholic(e.target.value)}>
                <option>Alcoholic</option>
                <option>Non alcoholic</option>
                <option>Optional alcohol</option>
              </select>
            </div>
            <div className="form-field">
              <label>Glass</label>
              <input
                type="text"
                value={glass}
                onChange={e => setGlass(e.target.value)}
                placeholder="e.g. Coupe glass"
              />
            </div>
          </div>

          <div className="form-field">
            <label>Thumbnail URL</label>
            <input
              type="url"
              value={thumbUrl}
              onChange={e => setThumbUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
        </div>

        <div className="form-section">
          <h2>Ingredients *</h2>
          {errors.ingredients && <span className="form-error">{errors.ingredients}</span>}
          <div className="ingredients-rows">
            {ingredients.map((item, i) => (
              <div key={i} className="ingredient-row">
                <input
                  type="text"
                  className="ingredient-row-measure"
                  value={item.measure}
                  onChange={e => updateIngredient(i, 'measure', e.target.value)}
                  placeholder="Amount"
                />
                <input
                  type="text"
                  className="ingredient-row-name"
                  value={item.ingredient}
                  onChange={e => updateIngredient(i, 'ingredient', e.target.value)}
                  placeholder="Ingredient"
                />
                {ingredients.length > 1 && (
                  <button type="button" className="remove-row-btn" onClick={() => removeIngredientRow(i)}>
                    &#215;
                  </button>
                )}
              </div>
            ))}
          </div>
          <button type="button" className="add-row-btn" onClick={addIngredientRow}>
            + Add Ingredient
          </button>
        </div>

        <div className="form-section">
          <h2>Instructions *</h2>
          <div className={`form-field${errors.instructions ? ' error' : ''}`}>
            <textarea
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              placeholder="Describe how to make the cocktail step by step..."
              rows={6}
            />
            {errors.instructions && <span className="form-error">{errors.instructions}</span>}
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn-cancel" onClick={() => navigate(-1)}>Cancel</button>
          <button type="submit" className="btn-submit">Save Recipe</button>
        </div>
      </form>
    </div>
  )
}
