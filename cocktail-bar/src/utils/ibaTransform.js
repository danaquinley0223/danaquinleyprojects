export function transformIBACocktails(rawArray) {
  return rawArray.map(cocktail => {
    const id = 'iba-' + cocktail.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '')

    const instructions = cocktail.garnish
      ? `${cocktail.method}\n\nGarnish: ${cocktail.garnish}`
      : cocktail.method

    const result = {
      idDrink: id,
      strDrink: cocktail.name,
      strCategory: cocktail.category,
      strAlcoholic: 'Alcoholic',
      strGlass: null,
      strInstructions: instructions,
      strDrinkThumb: null,
      isIBA: true,
      isCustom: false,
    }

    cocktail.ingredients.forEach(({ ingredient, quantity, unit }, i) => {
      result[`strIngredient${i + 1}`] = ingredient
      result[`strMeasure${i + 1}`] = `${quantity} ${unit}`.trim()
    })

    return result
  })
}
