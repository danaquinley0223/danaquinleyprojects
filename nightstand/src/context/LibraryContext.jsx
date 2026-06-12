import { createContext, useContext, useState, useCallback, useMemo } from 'react'

const LibraryContext = createContext(null)
const KEY = 'ns-books'

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') }
  catch { return [] }
}

export function LibraryProvider({ children }) {
  const [books, setBooks] = useState(load)

  const save = useCallback((next) => {
    localStorage.setItem(KEY, JSON.stringify(next))
    return next
  }, [])

  // Merge an array of normalized books in, updating existing entries (matched by
  // id) and adding new ones. Existing enrichment is preserved on re-import.
  const importBooks = useCallback((incoming) => {
    let added = 0, updated = 0
    setBooks(prev => {
      const byId = new Map(prev.map(b => [b.id, b]))
      for (const book of incoming) {
        if (byId.has(book.id)) {
          const existing = byId.get(book.id)
          byId.set(book.id, { ...existing, ...book, enriched: existing.enriched })
          updated++
        } else {
          byId.set(book.id, book)
          added++
        }
      }
      return save([...byId.values()])
    })
    return { added, updated }
  }, [save])

  const updateBook = useCallback((id, patch) => {
    setBooks(prev => save(prev.map(b => b.id === id ? { ...b, ...patch } : b)))
  }, [save])

  const removeBook = useCallback((id) => {
    setBooks(prev => save(prev.filter(b => b.id !== id)))
  }, [save])

  const setStatus = useCallback((id, readStatus) => {
    setBooks(prev => save(prev.map(b => b.id === id ? { ...b, readStatus } : b)))
  }, [save])

  const clearAll = useCallback(() => setBooks(save([])), [save])

  const getById = useCallback((id) => books.find(b => b.id === id) || null, [books])

  const value = useMemo(() => ({
    books, importBooks, updateBook, removeBook, setStatus, clearAll, getById,
  }), [books, importBooks, updateBook, removeBook, setStatus, clearAll, getById])

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>
}

export function useLibrary() {
  return useContext(LibraryContext)
}
