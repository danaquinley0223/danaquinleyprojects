import { createContext, useContext, useState, useCallback, useMemo } from 'react'

const SettingsContext = createContext(null)
const KEY = 'ns-settings'

const DEFAULTS = {
  wordsPerMinute: 250,   // average adult reading speed
  wordsPerPage: 300,     // typical words on a trade paperback page
}

function load() {
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') } }
  catch { return { ...DEFAULTS } }
}

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(load)

  const update = useCallback((patch) => {
    setSettings(prev => {
      const next = { ...prev, ...patch }
      localStorage.setItem(KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const value = useMemo(() => ({ settings, update }), [settings, update])
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings() {
  return useContext(SettingsContext)
}
