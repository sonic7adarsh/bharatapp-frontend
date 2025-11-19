import axios from '../lib/axios'

const STORAGE_KEY = 'i18n_prefs'
// Enable mock by default in local/dev, override via VITE_USE_I18N_MOCK=false
const USE_I18N_MOCK = (import.meta.env?.VITE_USE_I18N_MOCK ?? 'true') === 'true'

const MOCK_LOCALES = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'हिन्दी' },
]

const MOCK_TRANSLATIONS = {
  en: {
    'nav.language': 'Language',
    'nav.language_select_title': 'Choose Language',
    'common.close': 'Close',
  },
  hi: {
    'nav.language': 'भाषा',
    'nav.language_select_title': 'भाषा चुनें',
    'common.close': 'बंद करें',
  }
}

function getSavedPreferences() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function savePreferences(prefs) {
  try {
    const current = getSavedPreferences() || {}
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...prefs }))
  } catch {}
}

// Backend-driven preferences (tenant/user scoped)
async function getPreferences() {
  try {
    if (USE_I18N_MOCK) {
      const saved = getSavedPreferences()
      return saved && saved.locale ? { locale: saved.locale } : { locale: 'en' }
    }
    const { data } = await axios.get('/api/storefront/i18n/preferences')
    return typeof data === 'object' && data ? data : null
  } catch {
    return null
  }
}

async function savePreferencesServer(prefs) {
  try {
    if (USE_I18N_MOCK) {
      // In mock mode, just save locally
      savePreferences(prefs)
      return true
    }
    await axios.post('/api/storefront/i18n/preferences', prefs)
    return true
  } catch {
    // Ignore errors (e.g., unauthenticated or endpoint missing) and rely on local save
    return false
  }
}

async function getAvailableLocales() {
  try {
    if (USE_I18N_MOCK) {
      return { locales: MOCK_LOCALES, defaultLocale: 'en', fallbackLocale: 'en' }
    }
    const { data } = await axios.get('/api/i18n/locales')
    const locales = Array.isArray(data?.locales) ? data.locales : []
    return {
      locales: locales.length > 0 ? locales : MOCK_LOCALES,
      defaultLocale: data?.defaultLocale || 'en',
      fallbackLocale: data?.fallbackLocale || 'en'
    }
  } catch {
    return {
      locales: MOCK_LOCALES,
      defaultLocale: 'en',
      fallbackLocale: 'en'
    }
  }
}

async function fetchTranslations(locale) {
  try {
    if (USE_I18N_MOCK) {
      return MOCK_TRANSLATIONS[locale] || {}
    }
    const { data } = await axios.get('/api/i18n/translations', { params: { locale } })
    return typeof data === 'object' && data ? data : {}
  } catch {
    return {}
  }
}

export default {
  getSavedPreferences,
  savePreferences,
  getPreferences,
  savePreferencesServer,
  getAvailableLocales,
  fetchTranslations
}