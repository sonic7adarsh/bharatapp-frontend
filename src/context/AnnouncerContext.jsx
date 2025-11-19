import React, { createContext, useContext, useEffect, useRef, useState } from 'react'

const AnnouncerContext = createContext(null)

export function AnnouncerProvider({ children }) {
  const [message, setMessage] = useState('')
  const [politeness, setPoliteness] = useState('polite') // 'polite' | 'assertive'
  const mountedRef = useRef(false)

  const announce = (msg, politenessMode = 'polite') => {
    if (typeof msg !== 'string' || !msg.trim()) return
    setPoliteness(politenessMode === 'assertive' ? 'assertive' : 'polite')
    setMessage(msg)
  }

  // Expose a global hook for non-React callers (e.g., axios interceptors)
  useEffect(() => {
    mountedRef.current = true
    window.__announce = announce
    return () => {
      mountedRef.current = false
      delete window.__announce
    }
  }, [])

  return (
    <AnnouncerContext.Provider value={{ announce }}>
      {/* Visually hidden live region for screen readers */}
      <div
        role="status"
        aria-live={politeness}
        aria-atomic="true"
        className="sr-only"
      >
        {message}
      </div>
      {children}
    </AnnouncerContext.Provider>
  )
}

export function useAnnouncer() {
  const ctx = useContext(AnnouncerContext)
  if (!ctx) throw new Error('useAnnouncer must be used within AnnouncerProvider')
  return ctx
}