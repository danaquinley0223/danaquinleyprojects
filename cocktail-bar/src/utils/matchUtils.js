import { extractIngredients } from '../api/cocktaildb'

function normalize(name) {
  return name.toLowerCase().trim().replace(/\s+/g, ' ')
}

export function canMake(cocktail, pantry) {
  const ingredients = extractIngredients(cocktail)
  if (!ingredients.length) return false
  const pantrySet = new Set(pantry.map(normalize))
  return ingredients.every(({ ingredient }) => pantrySet.has(normalize(ingredient)))
}

export function missingIngredients(cocktail, pantry) {
  const ingredients = extractIngredients(cocktail)
  const pantrySet = new Set(pantry.map(normalize))
  return ingredients.filter(({ ingredient }) => !pantrySet.has(normalize(ingredient)))
}

export function almostThere(cocktail, pantry) {
  const missing = missingIngredients(cocktail, pantry)
  return missing.length === 1 ? missing[0] : null
}

export function matchStatus(cocktail, pantry) {
  if (!pantry.length) return null
  const ingredients = extractIngredients(cocktail)
  if (!ingredients.length) return null
  const missing = missingIngredients(cocktail, pantry)
  if (missing.length === 0) return 'can-make'
  if (missing.length === 1) return 'almost-there'
  return null
}
