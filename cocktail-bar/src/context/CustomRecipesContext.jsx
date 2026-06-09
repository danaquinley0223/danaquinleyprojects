import { createContext, useContext, useState, useCallback } from 'react'

const CustomRecipesContext = createContext(null)

export function CustomRecipesProvider({ children }) {
  const [customRecipes, setCustomRecipes] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cb-custom-recipes') || '[]') }
    catch { return [] }
  })

  const persist = (next) => {
    setCustomRecipes(next)
    localStorage.setItem('cb-custom-recipes', JSON.stringify(next))
  }

  const addRecipe = useCallback((recipe) => {
    const newRecipe = {
      ...recipe,
      idDrink: `custom-${Date.now()}`,
      isCustom: true,
    }
    setCustomRecipes(prev => {
      const next = [...prev, newRecipe]
      localStorage.setItem('cb-custom-recipes', JSON.stringify(next))
      return next
    })
    return newRecipe
  }, [])

  const updateRecipe = useCallback((id, updates) => {
    setCustomRecipes(prev => {
      const next = prev.map(r => r.idDrink === id ? { ...r, ...updates } : r)
      localStorage.setItem('cb-custom-recipes', JSON.stringify(next))
      return next
    })
  }, [])

  const deleteRecipe = useCallback((id) => {
    setCustomRecipes(prev => {
      const next = prev.filter(r => r.idDrink !== id)
      localStorage.setItem('cb-custom-recipes', JSON.stringify(next))
      return next
    })
  }, [])

  const getById = useCallback((id) => {
    return customRecipes.find(r => r.idDrink === id) || null
  }, [customRecipes])

  return (
    <CustomRecipesContext.Provider value={{ customRecipes, addRecipe, updateRecipe, deleteRecipe, getById }}>
      {children}
    </CustomRecipesContext.Provider>
  )
}

export function useCustomRecipes() {
  return useContext(CustomRecipesContext)
}
