import { transformIBACocktails } from '../utils/ibaTransform'
import ibaRaw from './iba-cocktails.json'
import bookRaw from './book-cocktails.json'

// Transform the curated book cocktails (NoMad, Seedlip, classic recipes) into the
// same shape the rest of the app uses for TheCocktailDB results.
function transformBookCocktails(rawArray) {
  return rawArray.map(c => {
    const instructions = c.garnish
      ? `${c.method}\n\nGarnish: ${c.garnish}`
      : c.method

    const result = {
      idDrink: c.id,
      strDrink: c.name,
      strCategory: c.category,
      strAlcoholic: c.alcoholic,
      strGlass: c.glass || null,
      strInstructions: instructions,
      strDrinkThumb: null,
      isBook: true,
      source: c.source,
      isCustom: false,
    }

    c.ingredients.forEach(({ ingredient, measure }, i) => {
      result[`strIngredient${i + 1}`] = ingredient
      result[`strMeasure${i + 1}`] = measure || ''
    })

    return result
  })
}

export const IBA_COCKTAILS = transformIBACocktails(ibaRaw)
export const BOOK_COCKTAILS = transformBookCocktails(bookRaw)

// Every cocktail bundled with the app (works fully offline, no API call needed).
export const LOCAL_COCKTAILS = [...IBA_COCKTAILS, ...BOOK_COCKTAILS]

// Spirit/type categories present in the bundled library, for the filter dropdown.
export const LOCAL_CATEGORIES = [...new Set(LOCAL_COCKTAILS.map(c => c.strCategory))]
  .filter(Boolean)
  .sort()

const byId = new Map(LOCAL_COCKTAILS.map(c => [c.idDrink, c]))

export function getLocalCocktail(id) {
  return byId.get(id) || null
}

export function filterLocal(term) {
  if (!term?.trim()) return LOCAL_COCKTAILS
  const lower = term.toLowerCase()
  return LOCAL_COCKTAILS.filter(c => c.strDrink.toLowerCase().includes(lower))
}
