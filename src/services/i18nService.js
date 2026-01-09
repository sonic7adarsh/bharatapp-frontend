import axios from '../lib/axios'

const STORAGE_KEY = 'i18n_prefs'

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
    const { data } = await axios.get('/api/storefront/i18n/preferences')
    return typeof data === 'object' && data ? data : null
  } catch {
    return null
  }
}

async function savePreferencesServer(prefs) {
  try {
    await axios.post('/api/storefront/i18n/preferences', prefs)
    return true
  } catch {
    // Ignore errors (e.g., unauthenticated or endpoint missing) and rely on local save
    return false
  }
}

async function getAvailableLocales() {
  try {
    const { data } = await axios.get('/api/i18n/locales')
    const locales = Array.isArray(data?.locales) ? data.locales : []
    return {
      locales: locales.length > 0 ? locales : [],
      defaultLocale: data?.defaultLocale || 'en',
      fallbackLocale: data?.fallbackLocale || 'en'
    }
  } catch {
    return {
      locales: [],
      defaultLocale: 'en',
      fallbackLocale: 'en'
    }
  }
}

async function fetchTranslations(locale) {
  try {
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