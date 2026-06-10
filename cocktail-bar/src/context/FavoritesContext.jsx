import { createContext, useContext, useState, useCallback } from 'react'

const FavoritesContext = createContext(null)

export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cb-favorites') || '[]') }
    catch { return [] }
  })

  const toggleFavorite = useCallback((cocktail) => {
    setFavorites(prev => {
      const exists = prev.some(f => f.idDrink === cocktail.idDrink)
      const next = exists
        ? prev.filter(f => f.idDrink !== cocktail.idDrink)
        : [...prev, { idDrink: cocktail.idDrink, strDrink: cocktail.strDrink, strDrinkThumb: cocktail.strDrinkThumb, strCategory: cocktail.strCategory, isCustom: cocktail.isCustom }]
      localStorage.setItem('cb-favorites', JSON.stringify(next))
      return next
    })
  }, [])

  const isFavorite = useCallback((id) => {
    return favorites.some(f => f.idDrink === id)
  }, [favorites])

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites() {
  return useContext(FavoritesContext)
}
