import { useState, useCallback } from 'react'

export function useSearchHistory(storageKey, maxItems = 8) {
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem(storageKey) || '[]') } catch { return [] }
  })

  const push = useCallback((term) => {
    if (!term?.trim()) return
    setHistory(prev => {
      const next = [term.trim(), ...prev.filter(h => h !== term.trim())].slice(0, maxItems)
      localStorage.setItem(storageKey, JSON.stringify(next))
      return next
    })
  }, [storageKey, maxItems])

  const remove = useCallback((term) => {
    setHistory(prev => {
      const next = prev.filter(h => h !== term)
      localStorage.setItem(storageKey, JSON.stringify(next))
      return next
    })
  }, [storageKey])

  const clear = useCallback(() => {
    localStorage.removeItem(storageKey)
    setHistory([])
  }, [storageKey])

  return { history, push, remove, clear }
}
