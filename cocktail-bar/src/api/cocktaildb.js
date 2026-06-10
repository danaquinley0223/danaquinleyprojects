const BASE = 'https://www.thecocktaildb.com/api/json/v1/1'

async function get(path) {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export async function searchByName(name) {
  const data = await get(`/search.php?s=${encodeURIComponent(name)}`)
  return data.drinks || []
}

export async function searchByFirstLetter(letter) {
  const data = await get(`/search.php?f=${letter}`)
  return data.drinks || []
}

export async function lookupById(id) {
  const data = await get(`/lookup.php?i=${id}`)
  return data.drinks?.[0] || null
}

export async function filterByCategory(category) {
  const data = await get(`/filter.php?c=${encodeURIComponent(category)}`)
  return data.drinks || []
}

export async function getCategories() {
  const data = await get('/list.php?c=list')
  return data.drinks?.map(d => d.strCategory) || []
}

export async function getAllIngredients() {
  const data = await get('/list.php?i=list')
  return data.drinks?.map(d => d.strIngredient1).sort() || []
}

export async function getRandomCocktail() {
  const data = await get('/random.php')
  return data.drinks?.[0] || null
}

export function extractIngredients(cocktail) {
  const ingredients = []
  for (let i = 1; i <= 15; i++) {
    const ingredient = cocktail[`strIngredient${i}`]
    const measure = cocktail[`strMeasure${i}`]
    if (ingredient?.trim()) {
      ingredients.push({ ingredient: ingredient.trim(), measure: measure?.trim() || '' })
    }
  }
  return ingredients
}
