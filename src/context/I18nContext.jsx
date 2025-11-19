import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import i18nService from '../services/i18nService'
import eventService from '../services/eventService'

const I18nContext = createContext(null)

export function I18nProvider({ children }) {
  const [locale, setLocale] = useState('en')
  const [translations, setTranslations] = useState({})
  const [availableLocales, setAvailableLocales] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function init() {
      try {
        const prefs = i18nService.getSavedPreferences()
        const { locales, defaultLocale } = await i18nService.getAvailableLocales()
        const serverPrefs = await i18nService.getPreferences()
        if (cancelled) return
        setAvailableLocales(locales)
        const initialLocale = serverPrefs?.locale || prefs?.locale || defaultLocale || 'en'
        setLocale(initialLocale)
        const t = await i18nService.fetchTranslations(initialLocale)
        if (cancelled) return
        setTranslations(t || {})
        // Persist locally for faster subsequent loads
        i18nService.savePreferences({ locale: initialLocale })
      } catch {
        // Fallback: English only
        setAvailableLocales([{ code: 'en', name: 'English' }, { code: 'hi', name: 'हिन्दी' }])
        setTranslations({})
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    init()
    return () => { cancelled = true }
  }, [])

  const changeLocale = async (newLocale) => {
    if (!newLocale || newLocale === locale) return
    setLoading(true)
    try {
      const t = await i18nService.fetchTranslations(newLocale)
      setTranslations(t || {})
      setLocale(newLocale)
      // Try to persist preference server-side; fallback to local
      i18nService.savePreferencesServer({ locale: newLocale })
      i18nService.savePreferences({ locale: newLocale })
      eventService.track('language_change', { locale: newLocale })
    } finally {
      setLoading(false)
    }
  }

  const t = useMemo(() => {
    return (key, fallback, params) => {
      const raw = translations?.[key] || fallback || key
      if (!params) return raw
      return String(raw).replace(/\{(\w+)\}/g, (_, k) => (
        params[k] != null ? String(params[k]) : `{${k}}`
      ))
    }
  }, [translations])

  const value = useMemo(() => ({ locale, availableLocales, loading, t, setLocale: changeLocale }), [locale, availableLocales, loading, t])

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  return useContext(I18nContext)
}