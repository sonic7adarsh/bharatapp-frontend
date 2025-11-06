import api from '../lib/axios'
import { STORES } from '../data/stores'
import { generateProducts } from '../lib/mock'

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
    // Try /api first, then fallback to plain route and versioned route
    try {
      const tryApi = await api.get('/api/stores', config ?? (params ? { params } : undefined))
      if (Array.isArray(tryApi?.data)) return tryApi.data
    } catch {}
    // Local fallback using sample stores
    const search = params?.search ? String(params.search).toLowerCase() : ''
    const category = params?.category ? String(params.category).toLowerCase() : ''
    return STORES.filter(s => {
      const matchName = search ? s.name.toLowerCase().includes(search) : true
      const matchCat = category ? (s.category || '').toLowerCase() === category : true
      return matchName && matchCat
    })
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
    } catch {}
    const localStore = STORES.find(s => s.id === id)
    if (localStore) {
      setWithTs(storeCache, id, localStore, MAX_STORE_CACHE_ENTRIES)
      return localStore
    }
    // Throw to allow page-level catch to show not found
    throw new Error('Store not found')
  },
  async getProductsByStore(storeId, config = undefined) {
    // Serve from cache if available and fresh
    const cached = getWithTtl(productCache, storeId)
    if (cached) return cached
    // Supports both query-style and nested route depending on backend
    try {
      const byQuery = await api.get(`/api/products`, { params: { storeId }, ...(config || {}) })
      if (Array.isArray(byQuery?.data)) {
        setWithTs(productCache, storeId, byQuery.data, MAX_PRODUCT_CACHE_ENTRIES)
        return byQuery.data
      }
    } catch {}
    try {
      const nested = await api.get(`/api/stores/${storeId}/products`, config)
      if (Array.isArray(nested?.data)) {
        setWithTs(productCache, storeId, nested.data, MAX_PRODUCT_CACHE_ENTRIES)
        return nested.data
      }
    } catch {}
    // Local fallback using sample store products or generated ones
    const localStore = STORES.find(s => s.id === storeId)
    if (localStore && Array.isArray(localStore.products)) {
      const items = localStore.products.map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        description: `${p.name} from ${localStore.name}`,
        image: `https://picsum.photos/seed/${encodeURIComponent(p.name)}/300/200`
      }))
      setWithTs(productCache, storeId, items, MAX_PRODUCT_CACHE_ENTRIES)
      return items
    }
    const generated = generateProducts(6)
    setWithTs(productCache, storeId, generated, MAX_PRODUCT_CACHE_ENTRIES)
    return generated
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
    // Try backend if available
    try {
      const res = await api.get('/api/availability', {
        params: { storeId, roomId, checkIn, checkOut, guests }
      })
      if (res?.data) return res.data
    } catch {}
    // Local mock: compute nights and apply simple rules
    const start = new Date(checkIn)
    const end = new Date(checkOut)
    const oneDay = 24 * 60 * 60 * 1000
    const nights = Math.max(0, Math.round((end - start) / oneDay))
    const store = STORES.find(s => s.id === storeId)
    const room = store?.products?.find(p => p.id === roomId)
    const base = room?.price || 1000
    // Simple constraints: max stay 14 nights, min 1 night
    if (nights < 1) return { available: false, reason: 'Invalid date range' }
    if (nights > 14) return { available: false, reason: 'Maximum 14 nights allowed' }
    // Hospitality-specific capacity: base capacity 2, optional extra mattress to allow up to 3
    const roomName = String(room?.name || '').toLowerCase()
    const extraMattressAllowed = /deluxe|suite|business|club|premier/.test(roomName) || roomName.includes('family')
    // Business rule: max 3 guests per room universally; 3rd guest implies extra mattress when allowed
    const perRoomMax = 3
    let roomsRequired = Math.ceil(Math.max(1, guests) / perRoomMax)
    let extraMattressCount = 0
    if (Array.isArray(roomsGuests) && roomsGuests.length > 0) {
      roomsRequired = roomsGuests.length
      // Validate each room capacity
      for (const g of roomsGuests) {
        if (g < 1 || g > perRoomMax) {
          return { available: false, reason: 'Invalid room allocation: max ' + perRoomMax + ' guests per room' }
        }
      }
      // Count an extra mattress for each room with 3 guests, only if allowed; capacity remains 3 regardless
      extraMattressCount = extraMattressAllowed ? roomsGuests.filter(g => g === 3).length : 0
    } else {
      // Approximate: base capacity 2 per room; any 3rd guest in a room implies extra mattress
      const threeOccupancyRooms = Math.max(0, guests - roomsRequired * 2)
      extraMattressCount = extraMattressAllowed ? Math.min(roomsRequired, threeOccupancyRooms) : 0
      // Reject if any single room would exceed 3 guests
      if (guests > 0 && Math.ceil(guests / roomsRequired) > 3) {
        return { available: false, reason: 'Not more than 3 guests allowed per room' }
      }
    }
    // Weekend surcharge mock
    const isWeekend = [0, 6].includes(start.getDay()) || [0, 6].includes(end.getDay())
    const surcharge = isWeekend ? 0.1 : 0
    const mattressFeePerNight = extraMattressAllowed ? Math.round(300) : 0
    const baseRoomsSubtotal = base * roomsRequired * nights * (1 + surcharge)
    const mattressSubtotal = extraMattressCount * mattressFeePerNight * nights
    const subtotal = baseRoomsSubtotal + mattressSubtotal
    const taxes = subtotal * 0.1
    const fees = subtotal * 0.05
    const total = Math.round(subtotal + taxes + fees)
    return {
      available: true,
      nights,
      base,
      surchargeRate: surcharge,
      rooms: roomsRequired,
      perRoomMax,
      extraMattressAllowed,
      extraMattressCount,
      mattressFeePerNight,
      roomsGuests: Array.isArray(roomsGuests) ? roomsGuests : undefined,
      subtotal: Math.round(subtotal),
      taxes: Math.round(taxes),
      fees: Math.round(fees),
      total
    }
  },
  async createStore(payload) {
    try {
      const res = await api.post('/api/stores', payload, { showSuccessToast: true, successMessage: 'Store onboarding request sent.' })
      return res.data
    } catch (e) {
      // Local mock success
      const mockId = `s_${Date.now()}`
      const mockStore = {
        id: mockId,
        name: payload?.name || `New Store ${mockId}`,
        area: payload?.area || 'Unknown Area',
        category: payload?.category || 'Grocery',
      }
      try {
        const saved = localStorage.getItem('stores')
        const stores = Array.isArray(saved ? JSON.parse(saved) : null) ? JSON.parse(saved) : []
        stores.push(mockStore)
        localStorage.setItem('stores', JSON.stringify(stores))
      } catch {}
      return { success: true, store: mockStore }
    }
  }
}

export default storeService
