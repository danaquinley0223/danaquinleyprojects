import { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { getState, saveState } from '../api/campApi'
import { makeInitialState } from '../utils/seed'

const Ctx = createContext(null)
const LS_KEY = 'bc-state'
const LS_TRIP = 'bc-current-trip'

function loadLocal() {
  try {
    const v = JSON.parse(localStorage.getItem(LS_KEY))
    if (v && v.households) return v
  } catch { /* ignore */ }
  return makeInitialState()
}

export function CampDataProvider({ children }) {
  const [doc, setDoc] = useState(loadLocal)
  const [status, setStatus] = useState('local') // local | offline | saving | synced
  const [currentTripId, setCurrentTripIdState] = useState(() => localStorage.getItem(LS_TRIP) || null)

  const docRef = useRef(doc)
  const dirtyRef = useRef(false)
  const saveTimer = useRef(null)

  const applyDoc = useCallback((next) => {
    docRef.current = next
    setDoc(next)
    localStorage.setItem(LS_KEY, JSON.stringify(next))
  }, [])

  const doSave = useCallback(async () => {
    if (!dirtyRef.current) return
    setStatus('saving')
    const resp = await saveState(docRef.current)
    if (resp === null) { setStatus('offline'); return } // worker unreachable; stay dirty
    if (resp.conflict && resp.state) {
      applyDoc(resp.state)            // someone else saved newer — take theirs
      dirtyRef.current = false
      setStatus('synced')
      return
    }
    if (resp.ok) {
      applyDoc({ ...docRef.current, rev: resp.rev })
      dirtyRef.current = false
      setStatus('synced')
    }
  }, [applyDoc])

  const scheduleSave = useCallback(() => {
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(doSave, 800)
  }, [doSave])

  const mutate = useCallback((fn) => {
    const next = { ...fn(docRef.current), updatedAt: Date.now() }
    applyDoc(next)
    dirtyRef.current = true
    scheduleSave()
  }, [applyDoc, scheduleSave])

  useEffect(() => {
    let alive = true
    async function load() {
      const resp = await getState()
      if (!alive) return
      if (resp === null) { setStatus('offline'); return }
      if (!resp.households) {           // server never initialized → push our seed
        dirtyRef.current = true
        doSave()
        return
      }
      applyDoc(resp)                     // adopt the shared state
      setStatus('synced')
    }
    load()
    const poll = setInterval(async () => {
      if (dirtyRef.current) return
      const resp = await getState()
      if (!alive || !resp || !resp.households) return
      if ((resp.rev || 0) > (docRef.current.rev || 0)) {
        applyDoc(resp)
        setStatus('synced')
      }
    }, 5000)
    return () => { alive = false; clearInterval(poll); clearTimeout(saveTimer.current) }
  }, [applyDoc, doSave])

  const setCurrentTrip = useCallback((id) => {
    setCurrentTripIdState(id)
    if (id) localStorage.setItem(LS_TRIP, id)
    else localStorage.removeItem(LS_TRIP)
  }, [])

  // convenience mutators
  const updateCollection = useCallback((key, fn) =>
    mutate(d => ({ ...d, [key]: fn(d[key] || []) })), [mutate])
  const updateTrip = useCallback((id, fn) =>
    mutate(d => ({ ...d, trips: (d.trips || []).map(t => t.id === id ? fn(t) : t) })), [mutate])

  const value = useMemo(() => ({
    households: doc.households || [],
    library: doc.library || [],
    campsites: doc.campsites || [],
    trips: doc.trips || [],
    status,
    currentTripId,
    setCurrentTrip,
    mutate,
    updateCollection,
    updateTrip,
  }), [doc, status, currentTripId, setCurrentTrip, mutate, updateCollection, updateTrip])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useCamp() {
  return useContext(Ctx)
}
