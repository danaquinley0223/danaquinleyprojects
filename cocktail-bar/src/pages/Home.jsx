import { useState, useEffect, useCallback, useRef } from 'react'
import { searchByName, searchByFirstLetter, filterByCategory, lookupById, getCategories } from '../api/cocktaildb'
import { useCustomRecipes } from '../context/CustomRecipesContext'
import { usePantry } from '../context/PantryContext'
import { canMake, almostThere } from '../utils/matchUtils'
import { transformIBACocktails } from '../utils/ibaTransform'
import ibaRaw from '../data/iba-cocktails.json'
import RecipeCard from '../components/RecipeCard'
import './Home.css'

const IBA_COCKTAILS = transformIBACocktails(ibaRaw)

const FILTER_OPTIONS = [
  { value: 'all', label: 'All Drinks' },
  { value: 'can-make', label: 'Can Make' },
  { value: 'almost-there', label: 'Almost There' },
]

const DEFAULT_LETTERS = ['m', 'c', 'b', 's', 'w']

export default function Home() {
  const [cocktails, setCocktails] = useState([])
  const [categories, setCategories] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [pantryFilter, setPantryFilter] = useState('all')
  const [loading, setLoading] = useState(false)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const searchTimeout = useRef(null)

  const { customRecipes } = useCustomRecipes()
  const { pantry } = usePantry()

  useEffect(() => {
    getCategories().then(setCategories)
  }, [])

  useEffect(() => {
    setLoading(true)
    Promise.all(DEFAULT_LETTERS.map(l => searchByFirstLetter(l)))
      .then(results => {
        const seen = new Set()
        const all = results.flat().filter(c => {
          if (seen.has(c.idDrink)) return false
          seen.add(c.idDrink)
          return true
        })
        setCocktails(all)
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSearch = useCallback((term) => {
    setSearchTerm(term)
    setSelectedCategory('')
    clearTimeout(searchTimeout.current)
    if (!term.trim()) {
      setLoading(true)
      Promise.all(DEFAULT_LETTERS.map(l => searchByFirstLetter(l)))
        .then(results => {
          const seen = new Set()
          const all = results.flat().filter(c => {
            if (seen.has(c.idDrink)) return false
            seen.add(c.idDrink)
            return true
          })
          setCocktails(all)
        })
        .finally(() => setLoading(false))
      return
    }
    searchTimeout.current = setTimeout(async () => {
      setLoading(true)
      const results = await searchByName(term)
      setCocktails(results)
      setLoading(false)
    }, 350)
  }, [])

  const ibaFiltered = useCallback((term) => {
    if (!term.trim()) return IBA_COCKTAILS
    const lower = term.toLowerCase()
    return IBA_COCKTAILS.filter(c => c.strDrink.toLowerCase().includes(lower))
  }, [])

  const handleCategory = useCallback(async (category) => {
    setSelectedCategory(category)
    setSearchTerm('')
    if (!category) {
      setLoading(true)
      const results = await Promise.all(DEFAULT_LETTERS.map(l => searchByFirstLetter(l)))
      const seen = new Set()
      setCocktails(results.flat().filter(c => {
        if (seen.has(c.idDrink)) return false
        seen.add(c.idDrink)
        return true
      }))
      setLoading(false)
      return
    }
    setLoading(true)
    const basicList = await filterByCategory(category)
    // Category filter only returns id/name/thumb — fetch full details for pantry matching
    setLoadingDetails(true)
    const detailed = await Promise.all(basicList.slice(0, 40).map(c => lookupById(c.idDrink)))
    setCocktails(detailed.filter(Boolean))
    setLoading(false)
    setLoadingDetails(false)
  }, [])

  const apiCocktails = cocktails.map(c => ({ ...c, isCustom: false }))
  const apiNames = new Set(apiCocktails.map(c => c.strDrink.toLowerCase()))
  const relevantIBA = ibaFiltered(searchTerm)
  const ibaOnly = relevantIBA.filter(c => !apiNames.has(c.strDrink.toLowerCase()))
  const allCocktails = [...customRecipes, ...apiCocktails, ...ibaOnly]

  const displayed = allCocktails.filter(cocktail => {
    if (pantryFilter === 'all') return true
    if (!pantry.length) return true
    if (pantryFilter === 'can-make') return canMake(cocktail, pantry)
    if (pantryFilter === 'almost-there') return !!almostThere(cocktail, pantry)
    return true
  })

  const canMakeCount = pantry.length ? allCocktails.filter(c => canMake(c, pantry)).length : 0
  const almostCount = pantry.length ? allCocktails.filter(c => !!almostThere(c, pantry)).length : 0

  return (
    <div className="home">
      <div className="home-hero">
        <h1 className="home-title">Your Bar Cabinet</h1>
        <p className="home-subtitle">
          {pantry.length > 0
            ? `${canMakeCount} cocktails you can make right now`
            : 'Add ingredients to your bar to find what you can make'}
        </p>
      </div>

      <div className="home-controls">
        <div className="home-search-wrap">
          <input
            type="text"
            className="home-search"
            placeholder="Search cocktails..."
            value={searchTerm}
            onChange={e => handleSearch(e.target.value)}
          />
          {searchTerm && (
            <button className="home-search-clear" onClick={() => handleSearch('')}>&#215;</button>
          )}
        </div>

        <select
          className="home-select"
          value={selectedCategory}
          onChange={e => handleCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <div className="home-filter-tabs">
          {FILTER_OPTIONS.map(opt => (
            <button
              key={opt.value}
              className={`home-filter-tab${pantryFilter === opt.value ? ' active' : ''}${opt.value === 'can-make' ? ' green' : opt.value === 'almost-there' ? ' orange' : ''}`}
              onClick={() => setPantryFilter(opt.value)}
            >
              {opt.label}
              {opt.value === 'can-make' && pantry.length > 0 && (
                <span className="tab-count">{canMakeCount}</span>
              )}
              {opt.value === 'almost-there' && pantry.length > 0 && (
                <span className="tab-count">{almostCount}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="home-loading">
          <div className="spinner" />
          <p>Loading cocktails...</p>
        </div>
      ) : displayed.length === 0 ? (
        <div className="home-empty">
          {pantryFilter !== 'all' && pantry.length === 0 ? (
            <>
              <p className="home-empty-title">Your bar is empty</p>
              <p className="home-empty-sub">Add ingredients to My Bar to filter by what you can make.</p>
            </>
          ) : (
            <>
              <p className="home-empty-title">No cocktails found</p>
              <p className="home-empty-sub">Try a different search or category.</p>
            </>
          )}
        </div>
      ) : (
        <>
          {loadingDetails && (
            <p className="home-details-note">Loading ingredient details for pantry matching...</p>
          )}
          <div className="cocktail-grid">
            {displayed.map(cocktail => (
              <RecipeCard key={cocktail.idDrink} cocktail={cocktail} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
