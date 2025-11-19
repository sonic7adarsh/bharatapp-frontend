import api from '../lib/axios'

// Lightweight in-memory caches with TTL to enable hover prefetch
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes
const MAX_STORE_CACHE_ENTRIES = 50
const MAX_PRODUCT_CACHE_ENTRIES = 200
const storeCache = new Map() // id -> { data, ts }
const productCache = new Map() // storeId -> { data, ts }
const inflightPrefetch = new Set()

function getWithTtl(cache, key) {
  const entry = cache.get(key)
  if (!entry) return undefined
  const fresh = (Date.now() - entry.ts) < CACHE_TTL_MS
  if (!fresh) { cache.delete(key); return undefined }
  return entry.data
}
function evictLruByTs(cache, maxEntries) {
  if (!Number.isFinite(maxEntries) || maxEntries <= 0) return
  while (cache.size > maxEntries) {
    let oldestKey = undefined
    let oldestTs = Infinity
    for (const [k, v] of cache.entries()) {
      const ts = v?.ts ?? Infinity
      if (ts < oldestTs) { oldestTs = ts; oldestKey = k }
    }
    if (oldestKey !== undefined) cache.delete(oldestKey)
    else break
  }
}
function setWithTs(cache, key, data, maxEntries = undefined) {
  cache.set(key, { data, ts: Date.now() })
  if (maxEntries) evictLruByTs(cache, maxEntries)
}

const storeService = {
  async getStores(params = undefined, config = undefined) {
    try {
      const tryApi = await api.get('/api/stores', config ?? (params ? { params } : undefined))
      return Array.isArray(tryApi?.data) ? tryApi.data : []
    } catch (e) {
      // Ignore aborted/canceled requests quietly (common during route changes/HMR)
      if (e?.code === 'ERR_CANCELED' || e?.name === 'CanceledError') {
        return []
      }
      console.error('getStores failed:', e)
      return []
    }
  },
  async getStore(id, config = undefined) {
    // Serve from cache if available and fresh
    const cached = getWithTtl(storeCache, id)
    if (cached) return cached
    try {
      const tryApi = await api.get(`/api/stores/${id}`, config)
      if (tryApi?.data) {
        setWithTs(storeCache, id, tryApi.data, MAX_STORE_CACHE_ENTRIES)
        return tryApi.data
      }
    } catch (e) {
      // Suppress noisy logs for aborted requests (common during route changes/HMR)
      if (e?.code === 'ERR_CANCELED' || e?.name === 'CanceledError') {
        // Propagate so callers can short-circuit without error UI
        throw e
      }
      console.error('getStore failed:', e)
      // Throw to allow page-level catch to show not found
      throw e
    }
  },
  async getProductsByStore(storeId, config = undefined) {
    // Serve from cache if available and fresh
    const cached = getWithTtl(productCache, storeId)
    if (cached) return cached
    const extractList = (data) => {
      if (Array.isArray(data)) return data
      if (Array.isArray(data?.items)) return data.items
      if (Array.isArray(data?.products)) return data.products
      if (Array.isArray(data?.list)) return data.list
      if (Array.isArray(data?.data)) return data.data
      if (Array.isArray(data?.records)) return data.records
      return []
    }
    // Supports both query-style and nested route depending on backend
    try {
      const byQuery = await api.get(`/api/products`, { params: { storeId }, ...(config || {}) })
      const list = extractList(byQuery?.data)
      if (Array.isArray(list)) {
        setWithTs(productCache, storeId, list, MAX_PRODUCT_CACHE_ENTRIES)
        return list
      }
    } catch (e) {
      // continue to nested path
      console.warn('getProductsByStore query path failed, trying nested:', e)
    }
    try {
      const nested = await api.get(`/api/stores/${storeId}/products`, config)
      const list = extractList(nested?.data)
      if (Array.isArray(list)) {
        setWithTs(productCache, storeId, list, MAX_PRODUCT_CACHE_ENTRIES)
        return list
      }
    } catch (e) {
      console.error('getProductsByStore failed:', e)
      return []
    }
    // If both paths returned non-array payloads, treat as empty list
    return []
  },
  // Prefetch helpers
  getCachedStore(id) { return getWithTtl(storeCache, id) },
  getCachedProducts(storeId) { return getWithTtl(productCache, storeId) },
  async prefetchStoreDetail(id) {
    if (!id || inflightPrefetch.has(id)) return
    inflightPrefetch.add(id)
    try {
      // Fire-and-forget; ignore errors and rely on caching for success paths
      await Promise.allSettled([
        this.getStore(id).catch(() => {}),
        this.getProductsByStore(id).catch(() => {})
      ])
    } finally {
      inflightPrefetch.delete(id)
    }
  },
  async checkRoomAvailability({ storeId, roomId, checkIn, checkOut, guests = 1, roomsGuests = undefined }) {
    try {
      const res = await api.get('/api/availability', {
        params: { storeId, roomId, checkIn, checkOut, guests, roomsGuests }
      })
      return res?.data || { available: false }
    } catch (e) {
      console.error('checkRoomAvailability failed:', e)
      return { available: false, reason: 'availability_unavailable' }
    }
  },
  async createStore(payload) {
    const res = await api.post('/api/stores', payload, { showSuccessToast: true, successMessage: 'Store onboarding request sent.' })
    return res.data
  }
}

export default storeService
