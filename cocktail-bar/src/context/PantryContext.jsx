import { createContext, useContext, useState, useCallback } from 'react'

const PantryContext = createContext(null)

export function PantryProvider({ children }) {
  const [pantry, setPantry] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cb-pantry') || '[]') }
    catch { return [] }
  })

  const persist = (next) => {
    setPantry(next)
    localStorage.setItem('cb-pantry', JSON.stringify(next))
  }

  const toggleIngredient = useCallback((ingredient) => {
    setPantry(prev => {
      const next = prev.includes(ingredient)
        ? prev.filter(i => i !== ingredient)
        : [...prev, ingredient]
      localStorage.setItem('cb-pantry', JSON.stringify(next))
      return next
    })
  }, [])

  const hasIngredient = useCallback((ingredient) => {
    return pantry.map(i => i.toLowerCase()).includes(ingredient.toLowerCase())
  }, [pantry])

  return (
    <PantryContext.Provider value={{ pantry, toggleIngredient, hasIngredient, setPantry: persist }}>
      {children}
    </PantryContext.Provider>
  )
}

export function usePantry() {
  return useContext(PantryContext)
}
