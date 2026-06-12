import { createContext, useContext, useState, useCallback, useMemo } from 'react'

const FollowsContext = createContext(null)
const KEY = 'ns-follows'

function load() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '{}')
    return {
      authors: v.authors || [],
      series: v.series || [],
      upcoming: v.upcoming || [],
    }
  } catch {
    return { authors: [], series: [], upcoming: [] }
  }
}

export function FollowsProvider({ children }) {
  const [state, setState] = useState(load)

  const persist = useCallback((next) => {
    localStorage.setItem(KEY, JSON.stringify(next))
    setState(next)
  }, [])

  const toggleAuthor = useCallback((author) => {
    setState(prev => {
      const has = prev.authors.includes(author)
      const next = { ...prev, authors: has ? prev.authors.filter(a => a !== author) : [...prev.authors, author] }
      localStorage.setItem(KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const toggleSeries = useCallback((series) => {
    setState(prev => {
      const has = prev.series.includes(series)
      const next = { ...prev, series: has ? prev.series.filter(s => s !== series) : [...prev.series, series] }
      localStorage.setItem(KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const addUpcoming = useCallback((entry) => {
    setState(prev => {
      const next = { ...prev, upcoming: [...prev.upcoming, { id: `m-${Date.now()}`, ...entry }] }
      localStorage.setItem(KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const removeUpcoming = useCallback((id) => {
    setState(prev => {
      const next = { ...prev, upcoming: prev.upcoming.filter(u => u.id !== id) }
      localStorage.setItem(KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const value = useMemo(() => ({
    ...state, toggleAuthor, toggleSeries, addUpcoming, removeUpcoming, setAll: persist,
  }), [state, toggleAuthor, toggleSeries, addUpcoming, removeUpcoming, persist])

  return <FollowsContext.Provider value={value}>{children}</FollowsContext.Provider>
}

export function useFollows() {
  return useContext(FollowsContext)
}
